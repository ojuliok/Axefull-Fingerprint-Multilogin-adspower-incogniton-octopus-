import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';

// Resolve ffmpeg/ffprobe paths for packaged/unpackaged Electron app
export const ffmpegPath = ffmpegInstaller.path.replace('app.asar', 'app.asar.unpacked');
ffmpeg.setFfmpegPath(ffmpegPath);

export const ffprobePath = ffprobeInstaller.path.replace('app.asar', 'app.asar.unpacked');
ffmpeg.setFfprobePath(ffprobePath);

/**
 * Escapes text for the FFmpeg drawtext filter.
 */
export function escapeFFmpegText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "'\\\\''")
    .replace(/:/g, '\\\\:')
    .replace(/\r?\n/g, '\\\n');
}

export default ffmpeg;
