import * as path from 'path';
import * as fs from 'fs';
import { execFile } from 'child_process';
import ffmpeg, { ffmpegPath, escapeFFmpegText } from './ffmpeg-utils';
import { ImportedVideo, BulkEditTemplate, TextOverlay, CropMode, Track } from '../../types/bulkVideo';


/** Result of probing a video file */
export interface ProbeResult {
  duration: number;
  width: number;
  height: number;
  codec: string;
  fileSize: number;
}

/**
 * Probes a video file to extract metadata using ffprobe (via fluent-ffmpeg).
 * Falls back to parsing ffmpeg -i output if ffprobe is not available.
 */
export function probeVideo(videoPath: string): Promise<ProbeResult> {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(videoPath)) {
      return reject(new Error(`Video file not found: ${videoPath}`));
    }

    // Get file size from filesystem
    const stats = fs.statSync(videoPath);
    const fileSize = stats.size;

    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        // Fallback: try using ffmpeg -i to parse metadata
        console.warn('[BulkEditEngine] ffprobe failed, attempting ffmpeg -i fallback:', err.message);
        return probeVideoFallback(videoPath, fileSize)
          .then(resolve)
          .catch(reject);
      }

      try {
        const videoStream = metadata.streams.find(
          (s) => s.codec_type === 'video'
        );

        if (!videoStream) {
          return reject(new Error('No video stream found in file.'));
        }

        const duration = metadata.format.duration || 0;
        const width = videoStream.width || 0;
        const height = videoStream.height || 0;
        const codec = videoStream.codec_name || 'unknown';

        resolve({
          duration: Number(duration),
          width,
          height,
          codec,
          fileSize,
        });
      } catch (parseErr) {
        reject(new Error(`Failed to parse video metadata: ${parseErr}`));
      }
    });
  });
}

/**
 * Fallback: Use ffmpeg -i to extract video metadata when ffprobe is unavailable.
 */
function probeVideoFallback(videoPath: string, fileSize: number): Promise<ProbeResult> {
  return new Promise((resolve, reject) => {
    execFile(ffmpegPath, ['-i', videoPath, '-hide_banner'], { timeout: 15000 }, (err, _stdout, stderr) => {
      // ffmpeg -i always exits with error when no output specified, so we parse stderr
      const output = stderr || '';

      // Parse duration: "Duration: 00:01:30.50"
      const durationMatch = output.match(/Duration:\s*(\d+):(\d+):(\d+)\.(\d+)/);
      let duration = 0;
      if (durationMatch) {
        duration =
          parseInt(durationMatch[1], 10) * 3600 +
          parseInt(durationMatch[2], 10) * 60 +
          parseInt(durationMatch[3], 10) +
          parseInt(durationMatch[4], 10) / 100;
      }

      // Parse resolution: "1920x1080" or "1280x720"
      const resolutionMatch = output.match(/(\d{2,5})x(\d{2,5})/);
      let width = 0;
      let height = 0;
      if (resolutionMatch) {
        width = parseInt(resolutionMatch[1], 10);
        height = parseInt(resolutionMatch[2], 10);
      }

      // Parse codec: "Video: h264" or "Video: hevc"
      const codecMatch = output.match(/Video:\s*(\w+)/);
      const codec = codecMatch ? codecMatch[1] : 'unknown';

      if (width === 0 || height === 0) {
        return reject(new Error('Could not determine video resolution from ffmpeg output.'));
      }

      resolve({ duration, width, height, codec, fileSize });
    });
  });
}

/**
 * Probes a video file to check if it has an audio stream.
 */
export function probeHasAudio(videoPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!fs.existsSync(videoPath)) {
      return resolve(false);
    }
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        resolve(false);
        return;
      }
      const hasAudio = (metadata.streams || []).some(
        (s) => s.codec_type === 'audio'
      );
      resolve(hasAudio);
    });
  });
}

/**
 * Extracts a thumbnail JPEG frame from a video at the given second.
 */
export function extractThumbnail(
  videoPath: string,
  outputPath: string,
  atSecond: number = 1
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(videoPath)) {
      return reject(new Error(`Video file not found: ${videoPath}`));
    }

    // Ensure output directory exists
    const outDir = path.dirname(outputPath);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    ffmpeg(videoPath)
      .seekInput(atSecond)
      .frames(1)
      .outputOptions(['-vf', 'scale=320:-1', '-q:v', '5'])
      .output(outputPath)
      .on('end', () => {
        console.log(`[BulkEditEngine] Thumbnail extracted: ${outputPath}`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error(`[BulkEditEngine] Error extracting thumbnail:`, err);
        reject(err);
      })
      .run();
  });
}

/**
 * Generates ffmpeg video filter strings for smart reframing / cropping.
 */
export function smartReframe(
  inputWidth: number,
  inputHeight: number,
  targetW: number,
  targetH: number,
  cropMode: CropMode
): string[] {
  const filters: string[] = [];

  const inputAR = inputWidth / inputHeight;
  const targetAR = targetW / targetH;

  if (Math.abs(inputAR - targetAR) < 0.01) {
    // Same aspect ratio, just scale
    filters.push(`scale=${targetW}:${targetH}`);
  } else if (inputAR > targetAR) {
    // Input is wider than target → need to crop width
    // First scale height to match target, then crop width
    const scaledW = Math.round(targetH * inputAR);
    const scaledH = targetH;
    filters.push(`scale=${scaledW}:${scaledH}`);

    // Determine crop position based on cropMode
    let cropX: string;
    switch (cropMode) {
      case 'center':
      case 'smart-detect': // smart-detect defaults to center crop
        cropX = `(iw-${targetW})/2`;
        break;
      case 'top':
      case 'bottom':
        // For wider videos, top/bottom doesn't apply on X-axis; default to center
        cropX = `(iw-${targetW})/2`;
        break;
      default:
        cropX = `(iw-${targetW})/2`;
    }

    filters.push(`crop=${targetW}:${targetH}:${cropX}:0`);
  } else {
    // Input is taller than target → need to crop height
    // First scale width to match target, then crop height
    const scaledW = targetW;
    const scaledH = Math.round(targetW / inputAR);
    filters.push(`scale=${scaledW}:${scaledH}`);

    // Determine crop position based on cropMode
    let cropY: string;
    switch (cropMode) {
      case 'top':
        cropY = '0';
        break;
      case 'bottom':
        cropY = `ih-${targetH}`;
        break;
      case 'center':
      case 'smart-detect':
      default:
        cropY = `(ih-${targetH})/2`;
        break;
    }

    filters.push(`crop=${targetW}:${targetH}:0:${cropY}`);
  }

  // Always ensure exact output dimensions and pixel format
  filters.push('setsar=1');

  return filters;
}



interface UnifiedTextParams {
  content: string;
  fontSize: number;
  fontColor?: string;
  opacity?: number;
  x?: string | number;
  y?: string | number;
  position?: 'top' | 'center' | 'bottom' | 'custom';
  backgroundColor?: string;
  padding?: number;
  startTime?: number;
  endTime?: number;
}

/**
 * Common drawtext filter generator
 */
function buildDrawtextFilter(params: UnifiedTextParams): string {
  const escapedText = escapeFFmpegText(params.content);
  if (!escapedText) return '';

  const fontPath = process.platform === 'win32'
    ? 'C\\\\:/Windows/Fonts/arial.ttf'
    : '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';

  let fontColor = params.fontColor || 'white';
  if (fontColor.startsWith('#')) {
    fontColor = '0x' + fontColor.substring(1);
  }
  if (params.opacity !== undefined && params.opacity < 1) {
    fontColor = `${fontColor}@${params.opacity}`;
  }

  let x = '0';
  let y = '0';

  if (params.position) {
    switch (params.position) {
      case 'top':
        x = '(w-text_w)/2';
        y = '20';
        break;
      case 'center':
        x = '(w-text_w)/2';
        y = '(h-text_h)/2';
        break;
      case 'bottom':
        x = '(w-text_w)/2';
        y = 'h-text_h-20';
        break;
      case 'custom':
      default:
        x = String(params.x || 0);
        y = String(params.y || 0);
        break;
    }
  } else {
    x = String(params.x || 0);
    y = String(params.y || 0);
  }

  let drawtext = `drawtext=fontfile='${fontPath}':text='${escapedText}':fontsize=${params.fontSize || 32}:fontcolor=${fontColor}:x=${x}:y=${y}`;

  if (params.backgroundColor && params.backgroundColor !== 'transparent') {
    let bgColor = params.backgroundColor;
    if (bgColor.startsWith('#')) bgColor = '0x' + bgColor.substring(1);
    if (params.opacity !== undefined && params.opacity < 1) bgColor = `${bgColor}@${params.opacity}`;
    drawtext += `:box=1:boxcolor=${bgColor}:boxborderw=${params.padding || 0}`;
  }

  // Add time-based enable filter
  if (params.startTime !== undefined && params.endTime !== undefined && params.endTime < 9999) {
    drawtext += `:enable='between(t,${params.startTime},${params.endTime})'`;
  } else if (params.startTime !== undefined) {
    drawtext += `:enable='gte(t,${params.startTime})'`;
  } else if (params.endTime !== undefined) {
    drawtext += `:enable='lte(t,${params.endTime})'`;
  }

  return drawtext;
}

/**
 * Builds drawtext filter strings for text tracks.
 */
function buildTextTrackFilters(tracks: Track[]): string[] {
  const textTracks = tracks.filter(t => t.type === 'text');
  return textTracks
    .map(track => {
      const props = track.properties;
      return buildDrawtextFilter({
        content: props.content || '',
        fontSize: props.fontSize || 32,
        fontColor: props.fontColor,
        opacity: props.opacity,
        x: props.x,
        y: props.y,
        backgroundColor: props.backgroundColor,
        padding: props.padding,
        startTime: track.startTime,
        endTime: track.endTime,
      });
    })
    .filter(Boolean);
}

/**
 * Builds drawtext filter strings for text overlays.
 */
function buildTextOverlayFilters(overlays: TextOverlay[]): string[] {
  return overlays
    .map(overlay => {
      return buildDrawtextFilter({
        content: overlay.content,
        fontSize: overlay.fontSize,
        fontColor: overlay.fontColor,
        opacity: overlay.opacity,
        x: overlay.x,
        y: overlay.y,
        position: overlay.position,
        startTime: overlay.startTime,
        endTime: overlay.endTime,
      });
    })
    .filter(Boolean);
}

export async function processBulkEdit(
  video: ImportedVideo,
  template: BulkEditTemplate,
  outputDir: string,
  onProgress: (progress: number) => void,
  onCmd?: (cmd: ffmpeg.FfmpegCommand) => void
): Promise<string> {
  const hasAudioStream = await probeHasAudio(video.filePath);
  return new Promise((resolve, reject) => {
    try {
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const ext = path.extname(video.fileName);
      const baseName = path.basename(video.fileName, ext);
      const outputFileName = `${baseName}_edited${ext || '.mp4'}`;
      const outputPath = path.join(outputDir, outputFileName);

      const cmd = ffmpeg(video.filePath);
      const complexFilter: string[] = [];
      let lastVideoLink = '[0:v]';
      let linkCounter = 1;
      
      let currentInputIndex = 1; // 0 is the main video
      
      const tracks = template.tracks || [];
      const imageTracks = tracks.filter(t => t.type === 'image' && t.properties.src);
      const textTracks = tracks.filter(t => t.type === 'text');
      const audioTracks = tracks.filter(t => t.type === 'audio' && t.properties.src);
      
      const hasBackgroundMusic = template.addBackgroundMusic && fs.existsSync(template.addBackgroundMusic);
      let bgMusicInputIndex = -1;
      
      // Map inputs
      if (hasBackgroundMusic) {
        cmd.input(template.addBackgroundMusic!);
        bgMusicInputIndex = currentInputIndex++;
      }
      
      for (const t of audioTracks) {
        cmd.input(t.properties.src!);
        (t as any).inputIndex = currentInputIndex++;
      }
      
      for (const t of imageTracks) {
        cmd.input(t.properties.src!);
        (t as any).inputIndex = currentInputIndex++;
      }

      // 1. Smart reframe / crop
      if (template.outputAspectRatio !== 'original') {
        const reframeFilters = smartReframe(
          video.width, video.height,
          template.outputWidth, template.outputHeight,
          template.cropMode
        );
        const outLink = `[v${linkCounter++}]`;
        complexFilter.push(`${lastVideoLink}${reframeFilters.join(',')}${outLink}`);
        lastVideoLink = outLink;
      } else {
        const outLink = `[v${linkCounter++}]`;
        complexFilter.push(`${lastVideoLink}scale=${video.width}:${video.height},setsar=1${outLink}`);
        lastVideoLink = outLink;
      }

      // 2. Color adjustments
      const hasBrightness = template.brightness !== 0;
      const hasContrast = template.contrast !== 1;
      const hasSaturation = template.saturation !== 1;

      if (hasBrightness || hasContrast || hasSaturation) {
        const outLink = `[v${linkCounter++}]`;
        const brightness = template.brightness || 0;
        const contrast = template.contrast !== undefined ? template.contrast : 1;
        const saturation = template.saturation !== undefined ? template.saturation : 1;
        complexFilter.push(`${lastVideoLink}eq=brightness=${brightness}:contrast=${contrast}:saturation=${saturation}${outLink}`);
        lastVideoLink = outLink;
      }

      // 3. Set output FPS
      if (template.outputFps && template.outputFps > 0) {
        const outLink = `[v${linkCounter++}]`;
        complexFilter.push(`${lastVideoLink}fps=${template.outputFps}${outLink}`);
        lastVideoLink = outLink;
      }

      // 4. Image Overlays (Watermarks)
      for (const t of imageTracks) {
        const idx = (t as any).inputIndex;
        if (idx) {
          const w = t.properties.width || 100;
          const h = t.properties.height || 100;
          const x = t.properties.x || 0;
          const y = t.properties.y || 0;
          
          const scaledInputLink = `[ovl_in_${idx}]`;
          complexFilter.push(`[${idx}:v]scale=${w}:${h}${scaledInputLink}`);
          
          const outLink = `[v${linkCounter++}]`;
          complexFilter.push(`${lastVideoLink}${scaledInputLink}overlay=${x}:${y}${outLink}`);
          lastVideoLink = outLink;
        }
      }

      // 5. Text Overlays (and legacy text overlays if any)
      const allTextFilters = [];
      if (textTracks.length > 0) {
        allTextFilters.push(...buildTextTrackFilters(textTracks));
      }
      if (template.textOverlays && template.textOverlays.length > 0) {
        // Fallback for legacy text overlays
        for (const overlay of template.textOverlays) {
           const fontPath = process.platform === 'win32' ? 'C\\\\:/Windows/Fonts/arial.ttf' : '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
           let drawtext = `drawtext=fontfile='${fontPath}':text='${escapeFFmpegText(overlay.content)}':fontsize=${overlay.fontSize}:fontcolor=white:x=10:y=10`;
           allTextFilters.push(drawtext);
        }
      }
      
      if (allTextFilters.length > 0) {
        const outLink = `[v${linkCounter++}]`;
        complexFilter.push(`${lastVideoLink}${allTextFilters.join(',')}${outLink}`);
        lastVideoLink = outLink;
      }

      // ── Build audio filter chain ──────────────────────────────
      let lastAudioLink = '[0:a]';
      let hasFinalAudio = false;
      const audioMixInputs: string[] = [];

      if (hasAudioStream) {
        const origVolume = template.audioVolume !== undefined ? template.audioVolume : 1;
        complexFilter.push(`[0:a]volume=${origVolume}[a_orig]`);
        audioMixInputs.push('[a_orig]');
      }

      if (hasBackgroundMusic && bgMusicInputIndex > 0) {
        const bgVolume = template.backgroundMusicVolume !== undefined ? template.backgroundMusicVolume : 0.3;
        complexFilter.push(`[${bgMusicInputIndex}:a]volume=${bgVolume}[a_bg]`);
        audioMixInputs.push('[a_bg]');
      }
      
      for (const t of audioTracks) {
        const idx = (t as any).inputIndex;
        if (idx) {
          const vol = t.properties.volume !== undefined ? t.properties.volume : 1;
          complexFilter.push(`[${idx}:a]volume=${vol}[a_track_${idx}]`);
          audioMixInputs.push(`[a_track_${idx}]`);
        }
      }

      if (audioMixInputs.length > 1) {
        complexFilter.push(`${audioMixInputs.join('')}amix=inputs=${audioMixInputs.length}:duration=first:dropout_transition=2[aout]`);
        hasFinalAudio = true;
      } else if (audioMixInputs.length === 1) {
        complexFilter.push(`${audioMixInputs[0]}anull[aout]`);
        hasFinalAudio = true;
      }

      // Map output links
      const finalVideoLink = `[vout]`;
      complexFilter.push(`${lastVideoLink}copy${finalVideoLink}`);
      
      cmd.complexFilter(complexFilter);
      cmd.map(finalVideoLink);
      
      if (hasFinalAudio) {
        cmd.map('[aout]');
        cmd.audioCodec('aac');
      } else {
        cmd.noAudio();
      }

      cmd.videoCodec('libx264');
      cmd.outputOptions(['-pix_fmt', 'yuv420p', '-movflags', '+faststart']);
      
      cmd.output(outputPath)
        .on('start', (cmdline) => {
          console.log(`[BulkEditEngine] Processing "${video.fileName}":`, cmdline);
        })
        .on('progress', (progressInfo) => {
          if (progressInfo.percent !== undefined && progressInfo.percent !== null) {
            let percent = progressInfo.percent;
            if (percent < 0) percent = 0;
            if (percent > 100) percent = 100;
            onProgress(Math.round(percent));
          } else if (progressInfo.timemark && video.duration > 0) {
            const parts = progressInfo.timemark.split(':');
            if (parts.length === 3) {
              const seconds = parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
              const percent = Math.min(100, Math.round((seconds / video.duration) * 100));
              onProgress(percent);
            }
          }
        })
        .on('end', () => {
          console.log(`[BulkEditEngine] Finished processing: ${outputPath}`);
          onProgress(100);
          resolve(outputPath);
        })
        .on('error', (err) => {
          console.error(`[BulkEditEngine] Error processing "${video.fileName}":`, err);
          reject(err);
        });

      if (onCmd) {
        onCmd(cmd);
      }
      cmd.run();
    } catch (error) {
      console.error('[BulkEditEngine] Exception in processBulkEdit:', error);
      reject(error);
    }
  });
}
