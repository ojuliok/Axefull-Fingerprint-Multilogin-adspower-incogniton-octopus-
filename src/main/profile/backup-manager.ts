import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';
import { getBrowserDataPath, getDb, insert, update } from '../database/db';
import { getProfileById } from './profile-manager';

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

        const zip = new AdmZip();
        
        // Add browser data directory
        zip.addLocalFolder(profileDir, 'browser_data');

        // Add metadata from database
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

        zip.addFile('metadata.json', Buffer.from(JSON.stringify(metadata, null, 2)));

        zip.writeZip(destPath);
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
