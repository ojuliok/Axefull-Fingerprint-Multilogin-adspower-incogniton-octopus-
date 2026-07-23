import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import { getBrowserDataPath, getDb, insert, update } from '../../database/db';
import { getProfileById } from './profile-manager';
import { getSupabase } from '../../database/supabase-client';

const EXCLUDED_DIRS = new Set([
    'Cache',
    'Code Cache',
    'GPUCache',
    'ShaderCache',
    'blob_storage',
    'CacheStorage',
    'ScriptCache',
    'Crashpad',
    'Crash Reports'
]);

import { Worker } from 'worker_threads';

function createZipWorker(profileDir: string, destPath: string, metadata: any, excludedDirs: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
        const workerCode = `
            const fs = require('fs');
            const path = require('path');
            const AdmZip = require('adm-zip');
            const { parentPort, workerData } = require('worker_threads');

            const { profileDir, destPath, metadata, excludedDirs } = workerData;
            const EXCLUDED = new Set(excludedDirs);

            function addFolderToZipFiltered(zip, localPath, zipPath) {
                if (!fs.existsSync(localPath)) return;
                const items = fs.readdirSync(localPath);
                for (const item of items) {
                    const itemLocalPath = path.join(localPath, item);
                    const itemZipPath = path.join(zipPath, item).split(path.sep).join('/');
                    const stats = fs.statSync(itemLocalPath);
                    if (stats.isDirectory()) {
                        if (EXCLUDED.has(item)) continue;
                        addFolderToZipFiltered(zip, itemLocalPath, itemZipPath);
                    } else if (stats.isFile()) {
                        try {
                            const data = fs.readFileSync(itemLocalPath);
                            zip.addFile(itemZipPath, data);
                        } catch(e) {}
                    }
                }
            }

            try {
                const zip = new AdmZip();
                addFolderToZipFiltered(zip, profileDir, 'browser_data');
                zip.addFile('metadata.json', Buffer.from(JSON.stringify(metadata, null, 2)));
                zip.writeZip(destPath);
                parentPort.postMessage({ success: true });
            } catch (err) {
                parentPort.postMessage({ error: err.message });
            }
        `;

        const worker = new Worker(workerCode, { 
            eval: true,
            workerData: { profileDir, destPath, metadata, excludedDirs }
        });

        worker.on('message', (msg) => {
            if (msg.error) reject(new Error(msg.error));
            else resolve();
        });
        worker.on('error', reject);
        worker.on('exit', (code) => {
            if (code !== 0) reject(new Error('Worker stopped with exit code ' + code));
        });
    });
}

/**
 * Export a browser profile to a .axeprofile (zip) file
 */
export async function exportProfile(profileId: string, destPath: string): Promise<boolean> {
    try {
        const profile = getProfileById(profileId);
        if (!profile) throw new Error('Profile not found in database');

        const browserDataPath = getBrowserDataPath();
        const profileDir = path.join(browserDataPath, profileId);

        if (!fs.existsSync(profileDir)) {
            throw new Error('Browser data directory not found');
        }

        // Fetch metadata from database
        const db = getDb();
        
        const fpStmt = db.prepare('SELECT * FROM fingerprints WHERE profile_id = ?');
        fpStmt.bind([profileId]);
        const fingerprint = fpStmt.step() ? fpStmt.getAsObject() : null;
        fpStmt.free();

        const pxStmt = db.prepare('SELECT * FROM proxies WHERE profile_id = ?');
        pxStmt.bind([profileId]);
        const proxy = pxStmt.step() ? pxStmt.getAsObject() : null;
        pxStmt.free();

        const metadata = {
            profile,
            fingerprint,
            proxy,
            version: '1.0'
        };

        // Offload all heavy zip operations to a separate thread
        await createZipWorker(profileDir, destPath, metadata, Array.from(EXCLUDED_DIRS));

        console.log(`[BackupManager] Profile ${profileId} exported to ${destPath}`);
        return true;
    } catch (err) {
        console.error('[BackupManager] Error exporting profile:', err);
        throw err;
    }
}

/**
 * Import a browser profile from a .axeprofile (zip) file
 */
export async function importProfile(sourcePath: string): Promise<any> {
    try {
        if (!fs.existsSync(sourcePath)) {
            throw new Error('Backup file not found');
        }

        const zip = new AdmZip(sourcePath);
        const zipEntries = zip.getEntries();

        const metadataEntry = zipEntries.find(e => e.entryName === 'metadata.json');
        if (!metadataEntry) throw new Error('Invalid backup file: metadata.json missing');

        const metadataStr = zip.readAsText(metadataEntry);
        const metadata = JSON.parse(metadataStr);

        const profileId = metadata.profile.id;
        const browserDataPath = getBrowserDataPath();
        const profileDir = path.join(browserDataPath, profileId);

        // Extract browser_data to the actual directory
        zip.extractEntryTo('browser_data/', browserDataPath, false, true);
        
        // Rename 'browser_data' folder from zip to 'profileId' if adm-zip doesn't map it right
        const extractedDir = path.join(browserDataPath, 'browser_data');
        if (fs.existsSync(extractedDir)) {
            if (fs.existsSync(profileDir)) fs.rmSync(profileDir, { recursive: true, force: true });
            fs.renameSync(extractedDir, profileDir);
        }

        // Upsert Database Records
        const existingProfile = getProfileById(profileId);
        if (existingProfile) {
            update('profiles', profileId, metadata.profile);
        } else {
            insert('profiles', metadata.profile);
        }

        if (metadata.fingerprint) {
            const db = getDb();
            const fpExists = db.prepare('SELECT id FROM fingerprints WHERE profile_id = ?');
            fpExists.bind([profileId]);
            if (fpExists.step()) {
                update('fingerprints', metadata.fingerprint.id, metadata.fingerprint);
            } else {
                insert('fingerprints', metadata.fingerprint);
            }
            fpExists.free();
        }

        if (metadata.proxy) {
            const db = getDb();
            const pxExists = db.prepare('SELECT id FROM proxies WHERE profile_id = ?');
            pxExists.bind([profileId]);
            if (pxExists.step()) {
                update('proxies', metadata.proxy.id, metadata.proxy);
            } else {
                insert('proxies', metadata.proxy);
            }
            pxExists.free();
        }

        console.log(`[BackupManager] Profile ${profileId} imported successfully`);
        return metadata.profile;
    } catch (err) {
        console.error('[BackupManager] Error importing profile:', err);
        throw err;
    }
}

let backupInterval: NodeJS.Timeout | null = null;

/**
 * Start the automatic backup scheduler (runs every 12 hours)
 */
export function startBackupScheduler(): void {
    if (backupInterval) return;

    console.log('[BackupManager] Starting automatic backup scheduler...');
    
    // Run an initial backup check in the background after 1 minute of app start
    setTimeout(() => {
        runAutoBackupFlow().catch(err => console.error('[BackupManager] Initial auto backup failed:', err));
    }, 60 * 1000);

    // Schedule to run every 12 hours
    backupInterval = setInterval(() => {
        runAutoBackupFlow().catch(err => console.error('[BackupManager] Scheduled auto backup failed:', err));
    }, 12 * 60 * 60 * 1000);
}

/**
 * Stop the automatic backup scheduler
 */
export function stopBackupScheduler(): void {
    if (backupInterval) {
        clearInterval(backupInterval);
        backupInterval = null;
        console.log('[BackupManager] Stopped automatic backup scheduler.');
    }
}

/**
 * Run the automatic backup flow:
 * Backs up all profiles to a local backup zip folder
 */
export async function runAutoBackupFlow(): Promise<void> {
    console.log('[BackupManager] Running automatic backup flow...');
    
    const db = getDb();
    const stmt = db.prepare('SELECT id, name FROM profiles');
    const profiles: { id: string; name: string }[] = [];
    while (stmt.step()) {
        profiles.push(stmt.getAsObject() as { id: string; name: string });
    }
    stmt.free();

    if (profiles.length === 0) {
        console.log('[BackupManager] No profiles to backup.');
        return;
    }

    const userDataPath = app.getPath('userData');
    const backupsDir = path.join(userDataPath, 'profile_backups');
    if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir, { recursive: true });
    }

    // Export each profile locally to backupsDir (overwrites previous backup)
    for (const profile of profiles) {
        try {
            const destPath = path.join(backupsDir, `backup_${profile.id}.axeprofile`);
            await exportProfile(profile.id, destPath);
            console.log(`[BackupManager] Auto backup completed for profile: ${profile.name}`);
        } catch (err) {
            console.error(`[BackupManager] Failed to backup profile ${profile.name}:`, err);
        }
    }
}

/**
 * Automatically backup a profile when it is closed, and sync it to the cloud if configured
 */
export async function handleProfileCloseBackup(profileId: string): Promise<void> {
    try {
        const userDataPath = app.getPath('userData');
        const backupsDir = path.join(userDataPath, 'profile_backups');
        if (!fs.existsSync(backupsDir)) {
            fs.mkdirSync(backupsDir, { recursive: true });
        }

        const destPath = path.join(backupsDir, `backup_${profileId}.axeprofile`);
        await exportProfile(profileId, destPath);
        console.log(`[BackupManager] Created post-close backup for profile: ${profileId}`);

        // Try syncing to Supabase Storage if configured
        await uploadBackupToCloud(profileId, destPath);
    } catch (err) {
        console.error(`[BackupManager] Failed to run post-close backup for profile ${profileId}:`, err);
    }
}

/**
 * Upload the zipped profile backup to Supabase Storage
 */
async function uploadBackupToCloud(profileId: string, filePath: string): Promise<void> {
    try {
        const url = process.env.VITE_SUPABASE_URL;
        const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
        
        if (!url || !key || url.includes('COLOQUE') || key.includes('COLOQUE')) {
            // Cloud sync not configured, skip
            return;
        }

        const supabase = getSupabase();
        if (!supabase) return;

        console.log(`[BackupManager] Uploading backup for profile ${profileId} to cloud storage...`);
        const fileBuffer = fs.readFileSync(filePath);
        const fileName = `backups/${profileId}.axeprofile`;

        // Upload to bucket 'profiles'
        const { data, error } = await supabase.storage
            .from('profiles')
            .upload(fileName, fileBuffer, {
                contentType: 'application/zip',
                upsert: true
            });

        if (error) {
            console.error(`[BackupManager] Supabase storage upload failed for ${profileId}:`, error.message);
        } else {
            console.log(`[BackupManager] Supabase storage upload successful for ${profileId}`);
        }
    } catch (err) {
        console.error(`[BackupManager] Error uploading backup to cloud:`, err);
    }
}
