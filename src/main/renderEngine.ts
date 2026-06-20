import * as path from 'path';
import * as fs from 'fs';
import ffmpeg, { escapeFFmpegText } from './ffmpeg-utils';
import { RenderJob, VideoTemplate, Track } from './types/bulkVideo';

/**
 * Resolves template variables like {{titulo}} with data from the job.
 */
function resolveVariables(content: string, jobData: Record<string, string>): string {
  let resolved = content;
  Object.entries(jobData).forEach(([key, value]) => {
    // Matches both {{key}} and {{ key }}
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    resolved = resolved.replace(regex, value);
  });
  return resolved;
}

/**
 * Renders a single RenderJob based on the VideoTemplate.
 */
export function renderVideo(
  job: RenderJob,
  template: VideoTemplate,
  outputDir: string,
  onProgress: (progress: number) => void,
  onStart?: (cmd: ffmpeg.FfmpegCommand) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Ensure the output directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const outputFilePath = path.join(outputDir, `${job.id}.mp4`);

      // Initialize fluent-ffmpeg
      const ffmpegCmd = ffmpeg();

      // We will build a filter graph for video overlays, text, and images.
      const filterComplex: string[] = [];
      const audioStreams: string[] = [];
      
      let nextInputIndex = 0;
      let hasBaseVideo = false;

      // 1. Identify base video track (lowest zIndex or first video track)
      const videoTracks = template.tracks.filter(t => t.type === 'video');
      let baseVideoTrack: Track | undefined;

      if (videoTracks.length > 0) {
        // Find the one with lowest zIndex
        baseVideoTrack = videoTracks.reduce((prev, curr) => (prev.zIndex < curr.zIndex ? prev : curr));
      }

      // Add base input
      if (baseVideoTrack && baseVideoTrack.properties.src && fs.existsSync(baseVideoTrack.properties.src)) {
        hasBaseVideo = true;
        ffmpegCmd.input(baseVideoTrack.properties.src);
        
        // Input options to trim and format base video
        const duration = baseVideoTrack.endTime - baseVideoTrack.startTime;
        if (baseVideoTrack.startTime > 0) {
          ffmpegCmd.inputOption(`-ss ${baseVideoTrack.startTime}`);
        }
        ffmpegCmd.inputOption(`-t ${duration}`);
        
        // Initialize base video stream scaled to template resolution
        filterComplex.push(`[0:v]scale=${template.width}:${template.height},setsar=1[v0]`);
        
        // Add to audio streams if base video has audio
        audioStreams.push('[0:a]');
        nextInputIndex = 1;
      } else {
        // Fallback: Generate a black solid canvas if no base video is provided
        ffmpegCmd.input(`color=c=black:s=${template.width}x${template.height}:d=${template.duration}:r=${template.fps || 30}`);
        ffmpegCmd.inputFormat('lavfi');
        
        // Output base stream tag
        filterComplex.push(`[0:v]scale=${template.width}:${template.height}[v0]`);
        nextInputIndex = 1;
      }

      // 2. Sort all OTHER visual/overlay tracks (video, image, text) by zIndex ascending
      const overlayTracks = template.tracks
        .filter(t => t !== baseVideoTrack && (t.type === 'video' || t.type === 'image' || t.type === 'text'))
        .sort((a, b) => a.zIndex - b.zIndex);

      let currentVideoStreamTag = '[v0]';
      let videoChainCount = 0;

      overlayTracks.forEach((track) => {
        const startTime = track.startTime;
        const endTime = track.endTime;
        const x = track.properties.x || 0;
        const y = track.properties.y || 0;

        if (track.type === 'image' || track.type === 'video') {
          const src = track.properties.src;
          if (src && fs.existsSync(src)) {
            ffmpegCmd.input(src);
            const inputIdx = nextInputIndex++;

            const w = track.properties.width || 200;
            const h = track.properties.height || 200;
            const scaledTag = `[ov_scaled_${track.id}]`;
            const nextTag = `[v_chain_${++videoChainCount}]`;

            // Scale overlay source
            filterComplex.push(`[${inputIdx}:v]scale=${w}:${h}${scaledTag}`);

            // Overlay onto the current stream
            const overlayFilter = `overlay=x=${x}:y=${y}:enable='between(t,${startTime},${endTime})'`;
            filterComplex.push(`${currentVideoStreamTag}${scaledTag}${overlayFilter}${nextTag}`);
            currentVideoStreamTag = nextTag;

            // If it's a video overlay and has audio, extract its audio stream
            if (track.type === 'video') {
              audioStreams.push(`[${inputIdx}:a]`);
            }
          }
        } else if (track.type === 'text') {
          const content = track.properties.content || '';
          const resolvedText = resolveVariables(content, job.data);
          const escapedText = escapeFFmpegText(resolvedText);
          const fontSize = track.properties.fontSize || 24;
          let fontColor = track.properties.fontColor || 'white';
          
          if (fontColor.startsWith('#')) {
            fontColor = '0x' + fontColor.substring(1);
          }
          if (track.properties.opacity !== undefined) {
            fontColor = `${fontColor}@${track.properties.opacity}`;
          }

          // Use standard Windows font path as fallback
          const fontPath = 'C\\:/Windows/Fonts/arial.ttf';
          const nextTag = `[v_chain_${++videoChainCount}]`;

          const drawTextFilter = `drawtext=fontfile='${fontPath}':text='${escapedText}':fontsize=${fontSize}:fontcolor=${fontColor}:x=${x}:y=${y}:enable='between(t,${startTime},${endTime})'`;
          filterComplex.push(`${currentVideoStreamTag}${drawTextFilter}${nextTag}`);
          currentVideoStreamTag = nextTag;
        }
      });

      // 3. Process separate audio tracks
      const separateAudioTracks = template.tracks.filter(t => t.type === 'audio');
      let audioChainCount = 0;

      separateAudioTracks.forEach((track) => {
        const src = track.properties.src;
        if (src && fs.existsSync(src)) {
          ffmpegCmd.input(src);
          const inputIdx = nextInputIndex++;
          
          const startTime = track.startTime;
          const endTime = track.endTime;
          const volume = track.properties.volume !== undefined ? track.properties.volume : 1.0;
          
          const trimTag = `[a_trim_${track.id}]`;
          const volTag = `[a_vol_${track.id}]`;

          // Trim audio track
          filterComplex.push(`[${inputIdx}:a]atrim=start=${startTime}:end=${endTime},asetpts=PTS-STARTPTS${trimTag}`);
          // Adjust volume
          filterComplex.push(`${trimTag}volume=${volume}${volTag}`);
          
          audioStreams.push(volTag);
        }
      });

      // 4. Combine Video and Audio outputs
      let hasAudio = audioStreams.length > 0;
      
      if (filterComplex.length > 0) {
        ffmpegCmd.complexFilter(filterComplex);
      }

      // Map output streams
      ffmpegCmd.map(currentVideoStreamTag);

      if (hasAudio) {
        if (audioStreams.length === 1) {
          // Single audio track, map it directly
          ffmpegCmd.map(audioStreams[0]);
        } else {
          // Multiple audio tracks, mix them using amix
          const mixTag = '[a_mix]';
          filterComplex.push(`${audioStreams.join('')}amix=inputs=${audioStreams.length}:duration=first${mixTag}`);
          ffmpegCmd.map(mixTag);
        }
      }

      // Set standard encoding configurations
      ffmpegCmd
        .videoCodec('libx264')
        .outputOptions('-pix_fmt yuv420p') // for compatibility with web/HTML5 players
        .outputOptions(`-r ${template.fps || 30}`)
        .duration(template.duration)
        .output(outputFilePath)
        .on('start', (cmdline) => {
          console.log('[RenderEngine] FFmpeg process started with command:', cmdline);
        })
        .on('progress', (progressInfo) => {
          // progressInfo.percent can be undefined or inaccurate, let's sanitize it
          let percent = progressInfo.percent || 0;
          if (percent < 0) percent = 0;
          if (percent > 100) percent = 100;
          onProgress(Math.round(percent));
        })
        .on('end', () => {
          console.log(`[RenderEngine] Rendering completed successfully for job ${job.id}`);
          resolve(outputFilePath);
        })
        .on('error', (err) => {
          console.error(`[RenderEngine] Error rendering job ${job.id}:`, err);
          reject(err);
        });

      // Run FFmpeg command
      ffmpegCmd.run();
      if (onStart) {
        onStart(ffmpegCmd);
      }

    } catch (error) {
      console.error('[RenderEngine] Exception in renderVideo:', error);
      reject(error);
    }
  });
}
