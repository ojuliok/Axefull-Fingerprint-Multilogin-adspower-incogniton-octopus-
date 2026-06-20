import { ipcMain, IpcMainInvokeEvent, shell, app, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import ffmpeg from 'fluent-ffmpeg';
import { renderVideo } from '../renderEngine';
import { probeVideo, extractThumbnail, processBulkEdit } from '../bulkEditEngine';
import { RenderJob, VideoTemplate, ImportedVideo, BulkEditTemplate, BulkEditJob } from '../types/bulkVideo';
import licenseManager from '../license-manager';
import { getStoredSession } from '../auth-manager';
import { getFirebaseDb } from '../firebase/firebase-client';
import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';

// Active ffmpeg commands for cancellation
const activeCommands = new Map<string, ffmpeg.FfmpegCommand>();

interface QueuedJob {
  job: RenderJob;
  template: VideoTemplate;
  outputDir: string;
  sender: Electron.WebContents;
}

// Queue state
let pendingQueue: QueuedJob[] = [];
const runningJobs = new Set<string>();

function safeSend(sender: Electron.WebContents, channel: string, data: any) {
  try {
    if (!sender.isDestroyed()) {
      sender.send(channel, data);
    }
  } catch (error) {
    // ignore
  }
}

/**
 * Retrieves the user's subscription plan from the license token.
 */
async function getUserPlan(): Promise<string> {
  try {
    const token = await licenseManager.getLicenseToken();
    if (token) {
      const decoded = licenseManager.decodeToken(token);
      if (decoded && decoded.plan) {
        return decoded.plan.toLowerCase();
      }
    }
  } catch (error) {
    console.error('[BulkVideoIPC] Error reading user license token:', error);
  }
  return 'basic'; // Default to basic
}

/**
 * Triggers processing the next item in the queue.
 */
function processNextQueue(maxConcurrency: number) {
  if (runningJobs.size >= maxConcurrency) return;
  if (pendingQueue.length === 0) return;

  const nextItem = pendingQueue.shift()!;
  const { job, template, outputDir, sender } = nextItem;

  runningJobs.add(job.id);
  
  // Notify progress start
  safeSend(sender, 'bulk-video:progress', {
    jobId: job.id,
    progress: 0,
    status: 'processing'
  });

  renderVideo(
    job,
    template,
    outputDir,
    (progress) => {
      safeSend(sender, 'bulk-video:progress', {
        jobId: job.id,
        progress,
        status: 'processing'
      });
    },
    (cmd) => {
      activeCommands.set(job.id, cmd);
    }
  )
  .then((outputPath) => {
    activeCommands.delete(job.id);
    runningJobs.delete(job.id);
    
    safeSend(sender, 'bulk-video:progress', {
      jobId: job.id,
      progress: 100,
      status: 'done',
      outputPath
    });
    
    // Process next item
    processNextQueue(maxConcurrency);
  })
  .catch((err) => {
    activeCommands.delete(job.id);
    runningJobs.delete(job.id);
    
    const isCancelled = err.message && (err.message.includes('SIGKILL') || err.message.includes('ffmpeg was killed'));
    
    safeSend(sender, 'bulk-video:progress', {
      jobId: job.id,
      progress: 0,
      status: 'error',
      error: isCancelled ? 'Cancelado pelo usuário' : err.message || String(err)
    });
    
    // Process next item
    processNextQueue(maxConcurrency);
  });

  // Try to fill up parallel threads if concurrency allows
  processNextQueue(maxConcurrency);
}

/**
 * Register all Bulk Video IPC handlers
 */
export function registerBulkVideoHandlers(): void {
  console.log('[BulkVideoIPC] Registering Bulk Video handlers...');

  // Start rendering a batch of videos
  ipcMain.handle(
    'bulk-video:start-render',
    async (event: IpcMainInvokeEvent, jobs: RenderJob[], template: VideoTemplate) => {
      try {
        const plan = await getUserPlan();
        
        // Enforce Plan Limits
        let maxConcurrency = 1;
        if (plan === 'enterprise') {
          maxConcurrency = 4;
        }

        // Limit basic users to 10 jobs per batch
        if (plan === 'basic' && jobs.length > 10) {
          return {
            success: false,
            error: 'O plano Básico é limitado a no máximo 10 vídeos por lote. Faça upgrade para desbloquear mais.'
          };
        }

        // Default output path: userData/rendered_videos
        const outputDir = path.join(app.getPath('userData'), 'rendered_videos');

        // Enqueue all jobs
        jobs.forEach((job) => {
          // If already running or in queue, skip it
          const isAlreadyQueued = pendingQueue.some((q) => q.job.id === job.id);
          const isAlreadyRunning = runningJobs.has(job.id);
          
          if (!isAlreadyQueued && !isAlreadyRunning) {
            pendingQueue.push({
              job,
              template,
              outputDir,
              sender: event.sender
            });
          }
        });

        // Trigger queue execution
        processNextQueue(maxConcurrency);

        return { success: true, message: `${jobs.length} vídeos adicionados à fila de renderização.` };
      } catch (error) {
        console.error('[BulkVideoIPC] Error starting render batch:', error);
        return { success: false, error: String(error) };
      }
    }
  );

  // Cancel a specific active or pending rendering job
  ipcMain.handle('bulk-video:cancel-job', async (_event: IpcMainInvokeEvent, jobId: string) => {
    try {
      // 1. Check if it's currently running and active
      if (activeCommands.has(jobId)) {
        const cmd = activeCommands.get(jobId)!;
        cmd.kill('SIGKILL');
        activeCommands.delete(jobId);
        runningJobs.delete(jobId);
        return { success: true, message: 'Processo de renderização interrompido.' };
      }

      // 2. Check if it's in the pending queue
      const queueIndex = pendingQueue.findIndex((q) => q.job.id === jobId);
      if (queueIndex !== -1) {
        pendingQueue.splice(queueIndex, 1);
        return { success: true, message: 'Vídeo removido da fila de espera.' };
      }

      return { success: false, error: 'Trabalho de renderização não encontrado.' };
    } catch (error) {
      console.error(`[BulkVideoIPC] Error cancelling job ${jobId}:`, error);
      return { success: false, error: String(error) };
    }
  });

  // Pick a file using Electron showOpenDialog
  ipcMain.handle('bulk-video:pick-file', async (_event, type: 'video' | 'image' | 'audio') => {
    try {
      const filters: { name: string; extensions: string[] }[] = [];
      if (type === 'video') {
        filters.push({ name: 'Videos (*.mp4, *.mov, *.webm)', extensions: ['mp4', 'mov', 'webm'] });
      } else if (type === 'image') {
        filters.push({ name: 'Images (*.png, *.jpg, *.jpeg, *.webp)', extensions: ['png', 'jpg', 'jpeg', 'webp'] });
      } else if (type === 'audio') {
        filters.push({ name: 'Audio (*.mp3, *.wav, *.aac)', extensions: ['mp3', 'wav', 'aac'] });
      }

      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: `Selecionar arquivo de ${type === 'video' ? 'vídeo' : type === 'image' ? 'imagem' : 'áudio'}`,
        properties: ['openFile'],
        filters,
      });

      if (canceled || filePaths.length === 0) {
        return { success: false, error: 'User canceled file picking' };
      }

      return { success: true, filePath: filePaths[0] };
    } catch (error) {
      console.error('[BulkVideoIPC] Error picking file:', error);
      return { success: false, error: String(error) };
    }
  });

  // Open the rendered videos folder
  ipcMain.handle('bulk-video:open-output-folder', async (_event, customOutputDir?: string) => {
    try {
      const outputDir = customOutputDir && customOutputDir.trim() !== ''
        ? customOutputDir
        : path.join(app.getPath('userData'), 'bulk_edited_videos');

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      await shell.openPath(outputDir);
      return { success: true };
    } catch (error) {
      console.error('[BulkVideoIPC] Error opening output folder:', error);
      return { success: false, error: String(error) };
    }
  });

  // Save or update a video project in Firestore
  ipcMain.handle('bulk-video:save-project', async (_event, project: any) => {
    try {
      const session = await getStoredSession();
      if (!session || !session.userId) {
        return { success: false, error: 'Usuário não autenticado.' };
      }
      
      const db = getFirebaseDb();
      const projectRef = doc(db, 'users', session.userId, 'videoProjects', project.id);
      
      // Save it
      await setDoc(projectRef, {
        ...project,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      return { success: true };
    } catch (error) {
      console.error('[BulkVideoIPC] Error saving project:', error);
      return { success: false, error: String(error) };
    }
  });

  // Get all video projects for the current user from Firestore
  ipcMain.handle('bulk-video:get-projects', async () => {
    try {
      const session = await getStoredSession();
      if (!session || !session.userId) {
        return { success: false, error: 'Usuário não autenticado.' };
      }
      
      const db = getFirebaseDb();
      const projectsCol = collection(db, 'users', session.userId, 'videoProjects');
      const snapshot = await getDocs(projectsCol);
      
      const projects = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      
      return { success: true, data: projects };
    } catch (error) {
      console.error('[BulkVideoIPC] Error getting projects:', error);
      return { success: false, error: String(error) };
    }
  });

  // Delete a video project from Firestore
  ipcMain.handle('bulk-video:delete-project', async (_event, projectId: string) => {
    try {
      const session = await getStoredSession();
      if (!session || !session.userId) {
        return { success: false, error: 'Usuário não autenticado.' };
      }
      
      const db = getFirebaseDb();
      const projectRef = doc(db, 'users', session.userId, 'videoProjects', projectId);
      await deleteDoc(projectRef);
      
      return { success: true };
    } catch (error) {
      console.error('[BulkVideoIPC] Error deleting project:', error);
      return { success: false, error: String(error) };
    }
  });

  // ═══════════════════════════════════════════════════════════
  // ── Bulk Video Editor v2: Folder-based handlers ───────────
  // ═══════════════════════════════════════════════════════════

  // Supported video file extensions for folder scanning
  const VIDEO_EXTENSIONS = new Set([
    '.mp4', '.mov', '.avi', '.mkv', '.webm', '.wmv', '.flv', '.m4v', '.mpeg', '.mpg', '.3gp'
  ]);

  // Pick a folder using Electron showOpenDialog
  ipcMain.handle('bulk-video:pick-folder', async () => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: 'Selecionar pasta com vídeos',
        properties: ['openDirectory'],
      });

      if (canceled || filePaths.length === 0) {
        return { success: false, error: 'User canceled folder picking' };
      }

      return { success: true, folderPath: filePaths[0] };
    } catch (error) {
      console.error('[BulkVideoIPC] Error picking folder:', error);
      return { success: false, error: String(error) };
    }
  });

  // Scan a folder for video files and probe each one
  ipcMain.handle('bulk-video:scan-folder', async (_event: IpcMainInvokeEvent, folderPath: string) => {
    try {
      if (!fs.existsSync(folderPath)) {
        return { success: false, error: 'Pasta não encontrada.' };
      }

      const entries = fs.readdirSync(folderPath, { withFileTypes: true });
      const videoFiles = entries
        .filter(entry => entry.isFile() && VIDEO_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
        .map(entry => path.join(folderPath, entry.name));

      if (videoFiles.length === 0) {
        return { success: false, error: 'Nenhum arquivo de vídeo encontrado na pasta.' };
      }

      const importedVideos: ImportedVideo[] = [];

      for (const filePath of videoFiles) {
        try {
          const probeResult = await probeVideo(filePath);
          const video: ImportedVideo = {
            id: crypto.randomUUID(),
            fileName: path.basename(filePath),
            filePath,
            duration: probeResult.duration,
            width: probeResult.width,
            height: probeResult.height,
            codec: probeResult.codec,
            fileSize: probeResult.fileSize,
            selected: true,
          };
          importedVideos.push(video);
        } catch (probeErr) {
          console.warn(`[BulkVideoIPC] Skipping file "${path.basename(filePath)}": ${probeErr}`);
          // Skip files that can't be probed (not valid video files)
        }
      }

      console.log(`[BulkVideoIPC] Scanned folder: ${importedVideos.length} videos found in "${folderPath}"`);
      return { success: true, data: importedVideos };
    } catch (error) {
      console.error('[BulkVideoIPC] Error scanning folder:', error);
      return { success: false, error: String(error) };
    }
  });

  // Generate a single thumbnail for a video
  ipcMain.handle('bulk-video:generate-thumbnail', async (_event: IpcMainInvokeEvent, videoPath: string) => {
    try {
      if (!fs.existsSync(videoPath)) {
        return { success: false, error: 'Arquivo de vídeo não encontrado.' };
      }

      const thumbnailDir = path.join(app.getPath('userData'), 'thumbnails');
      const thumbName = `thumb_${crypto.randomUUID()}.jpg`;
      const thumbnailPath = path.join(thumbnailDir, thumbName);

      await extractThumbnail(videoPath, thumbnailPath, 1);

      return { success: true, thumbnailPath };
    } catch (error) {
      console.error('[BulkVideoIPC] Error generating thumbnail:', error);
      return { success: false, error: String(error) };
    }
  });

  // Generate thumbnails for multiple videos in batch, sending progress events
  ipcMain.handle('bulk-video:generate-thumbnails-batch', async (event: IpcMainInvokeEvent, videoPaths: string[]) => {
    try {
      const thumbnailDir = path.join(app.getPath('userData'), 'thumbnails');
      const results: { videoPath: string; thumbnailPath?: string; error?: string }[] = [];

      for (let i = 0; i < videoPaths.length; i++) {
        const videoPath = videoPaths[i];
        try {
          const thumbName = `thumb_${crypto.randomUUID()}.jpg`;
          const thumbnailPath = path.join(thumbnailDir, thumbName);
          await extractThumbnail(videoPath, thumbnailPath, 1);
          results.push({ videoPath, thumbnailPath });
        } catch (err) {
          results.push({ videoPath, error: String(err) });
        }

        // Send progress event to renderer
        safeSend(event.sender, 'bulk-video:thumbnails-progress', {
          current: i + 1,
          total: videoPaths.length,
          videoPath,
          thumbnailPath: results[results.length - 1].thumbnailPath,
        });
      }

      return { success: true, data: results };
    } catch (error) {
      console.error('[BulkVideoIPC] Error generating thumbnails batch:', error);
      return { success: false, error: String(error) };
    }
  });

  // Get detailed metadata for a single video
  ipcMain.handle('bulk-video:get-video-metadata', async (_event: IpcMainInvokeEvent, videoPath: string) => {
    try {
      if (!fs.existsSync(videoPath)) {
        return { success: false, error: 'Arquivo de vídeo não encontrado.' };
      }

      const probeResult = await probeVideo(videoPath);
      return { success: true, data: probeResult };
    } catch (error) {
      console.error('[BulkVideoIPC] Error getting video metadata:', error);
      return { success: false, error: String(error) };
    }
  });

  // Active bulk edit commands for cancellation
  const activeBulkEditCommands = new Map<string, boolean>();

  // Start bulk editing: process all selected videos with the given template
  ipcMain.handle(
    'bulk-video:start-bulk-edit',
    async (event: IpcMainInvokeEvent, videos: ImportedVideo[], editTemplate: BulkEditTemplate, customOutputDir?: string) => {
      try {
        const plan = await getUserPlan();

        // Enforce plan limits
        if (plan === 'basic' && videos.length > 10) {
          return {
            success: false,
            error: 'O plano Básico é limitado a no máximo 10 vídeos por lote. Faça upgrade para desbloquear mais.',
          };
        }

        // Output directory
        const outputDir = customOutputDir && customOutputDir.trim() !== '' 
          ? customOutputDir 
          : path.join(app.getPath('userData'), 'bulk_edited_videos');

        // Build job list
        const jobs: BulkEditJob[] = videos.map((video) => ({
          id: crypto.randomUUID(),
          videoId: video.id,
          fileName: video.fileName,
          status: 'pending' as const,
          progress: 0,
        }));

        // Send initial job list to renderer
        safeSend(event.sender, 'bulk-video:bulk-edit-progress', {
          type: 'started',
          jobs,
        });

        // Determine concurrency based on plan
        let maxConcurrency = 1;
        if (plan === 'enterprise') {
          maxConcurrency = 4;
        }

        // Process jobs with limited concurrency
        const processJob = async (jobIndex: number) => {
          const job = jobs[jobIndex];
          const video = videos[jobIndex];

          job.status = 'processing';
          safeSend(event.sender, 'bulk-video:bulk-edit-progress', {
            type: 'job-update',
            job: { ...job },
          });

          try {
            const outputPath = await processBulkEdit(
              video,
              editTemplate,
              outputDir,
              (progress) => {
                job.progress = progress;
                safeSend(event.sender, 'bulk-video:bulk-edit-progress', {
                  type: 'job-update',
                  job: { ...job },
                });
              },
              (cmd) => {
                activeCommands.set(job.id, cmd);
              }
            );

            activeCommands.delete(job.id);
            job.status = 'done';
            job.progress = 100;
            job.outputPath = outputPath;
          } catch (err: any) {
            activeCommands.delete(job.id);
            job.status = 'error';
            job.progress = 0;
            job.error = err.message || String(err);
          }

          safeSend(event.sender, 'bulk-video:bulk-edit-progress', {
            type: 'job-update',
            job: { ...job },
          });
        };

        // Process in batches respecting concurrency limit
        const processBatch = async () => {
          let currentIndex = 0;
          const running: Promise<void>[] = [];

          const startNext = async (): Promise<void> => {
            if (currentIndex >= jobs.length) return;
            const idx = currentIndex++;
            await processJob(idx);
            await startNext();
          };

          // Start up to maxConcurrency workers
          for (let i = 0; i < Math.min(maxConcurrency, jobs.length); i++) {
            running.push(startNext());
          }

          await Promise.all(running);
        };

        // Run processing in background (don't await — return immediately)
        processBatch()
          .then(() => {
            safeSend(event.sender, 'bulk-video:bulk-edit-progress', {
              type: 'completed',
              jobs,
            });
            console.log('[BulkVideoIPC] Bulk edit batch completed.');
          })
          .catch((batchErr) => {
            console.error('[BulkVideoIPC] Bulk edit batch error:', batchErr);
            safeSend(event.sender, 'bulk-video:bulk-edit-progress', {
              type: 'error',
              error: String(batchErr),
            });
          });

        return { success: true, data: jobs, message: `${jobs.length} vídeos adicionados à fila de processamento.` };
      } catch (error) {
        console.error('[BulkVideoIPC] Error starting bulk edit:', error);
        return { success: false, error: String(error) };
      }
    }
  );

  // Cancel all active bulk edit jobs
  ipcMain.handle('bulk-video:cancel-bulk-edit', async () => {
    try {
      let count = 0;
      for (const [jobId, cmd] of activeCommands.entries()) {
        cmd.kill('SIGKILL');
        activeCommands.delete(jobId);
        count++;
      }
      return { success: true, message: `${count} processos foram cancelados.` };
    } catch (error) {
      console.error('[BulkVideoIPC] Error cancelling bulk edit:', error);
      return { success: false, error: String(error) };
    }
  });
}
