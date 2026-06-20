export interface VideoProject {
  id: string
  name: string
  createdAt: Date | string
  // New flow: folder-based bulk editing
  sourceFolderPath?: string
  importedVideos: ImportedVideo[]
  editTemplate: BulkEditTemplate
  // Legacy flow: CSV/variable-based template rendering
  template: VideoTemplate
  renderJobs: RenderJob[]
}

// ── New: Imported video from folder scan ──────────────────
export interface ImportedVideo {
  id: string
  fileName: string          // file name with extension
  filePath: string          // absolute path
  thumbnailPath?: string    // path to generated thumbnail
  duration: number          // in seconds (via ffprobe)
  width: number             // original resolution
  height: number            // original resolution
  codec?: string
  fileSize: number          // in bytes
  selected: boolean         // whether selected for processing
}

// ── New: Bulk edit template (applied to all videos) ──────
export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:5' | '4:3' | 'original'
export type CropMode = 'center' | 'top' | 'bottom' | 'smart-detect'

export interface BulkEditTemplate {
  id: string
  name: string
  // Output aspect ratio
  outputAspectRatio: AspectRatio
  outputWidth: number
  outputHeight: number
  outputFps: number
  // Smart crop
  smartCrop: boolean
  cropMode: CropMode
  // Layered Tracks (Text, Image, Audio)
  tracks: Track[]
  // Text overlays (applied to all videos) - legacy, will be migrated to tracks
  textOverlays: TextOverlay[]
  // Visual filters
  brightness: number           // -1 to 1
  contrast: number             // 0 to 2
  saturation: number           // 0 to 3
  // Audio
  audioVolume: number          // 0 to 2
  addBackgroundMusic?: string  // path to background music
  backgroundMusicVolume?: number
}

export interface TextOverlay {
  id: string
  content: string
  x: number
  y: number
  fontSize: number
  fontColor: string
  fontFamily?: string
  position: 'top' | 'center' | 'bottom' | 'custom'
  opacity: number
  startTime?: number    // if undefined, appears entire video
  endTime?: number
}

// ── Legacy types (kept for backward compatibility) ───────
export interface VideoTemplate {
  duration: number // em segundos
  width: number
  height: number
  fps: number
  tracks: Track[]
  variables: TemplateVariable[]
}

export interface Track {
  id: string
  type: 'video' | 'image' | 'text' | 'audio' | 'subtitle'
  startTime: number
  endTime: number
  zIndex: number
  properties: TrackProperties
}

export interface TrackProperties {
  src?: string           // path ou URL do asset
  content?: string       // para texto e legenda (suporta {{variavel}})
  x?: number
  y?: number
  width?: number
  height?: number
  fontSize?: number
  fontColor?: string
  fontFamily?: string
  backgroundColor?: string
  padding?: number
  borderRadius?: number
  textAlign?: 'left' | 'center' | 'right'
  opacity?: number
  volume?: number
}

export interface TemplateVariable {
  key: string             // ex: "titulo"
  label: string           // ex: "Título do Vídeo"
  defaultValue: string
}

export interface RenderJob {
  id: string
  status: 'pending' | 'processing' | 'done' | 'error'
  progress: number        // 0-100
  data: Record<string, string>  // { titulo: "Valor", produto: "..." }
  outputPath?: string
  error?: string
}

// ── New: Bulk edit job for folder processing ─────────────
export interface BulkEditJob {
  id: string
  videoId: string         // reference to ImportedVideo.id
  fileName: string
  status: 'pending' | 'processing' | 'done' | 'error'
  progress: number        // 0-100
  outputPath?: string
  error?: string
}
