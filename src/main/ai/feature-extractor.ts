import path from 'path';
import fs from 'fs';
import { getBrowserDataPath } from '../database/db';

export interface ProfileFeatures {
    cookieCount: number;
    historySize: number;
    profileSizeMb: number;
    proxyLatencyMs: number;
}

/**
 * Extracts basic ML features from a profile's data directory.
 * Safely measures folder sizes and basic SQLite file sizes without locking the db.
 */
export function extractProfileFeatures(profileId: string): ProfileFeatures {
    const dataDir = path.join(getBrowserDataPath(), profileId);
    
    let cookieCount = 0;
    let historySize = 0;
    let profileSizeMb = 0;
    
    try {
        if (fs.existsSync(dataDir)) {
            // Calculate total profile size
            profileSizeMb = getFolderSize(dataDir) / (1024 * 1024);
            
            // Typical Chromium cookie db path inside user data dir
            const defaultProfilePath = path.join(dataDir, 'Default');
            const networkPath = path.join(defaultProfilePath, 'Network');
            const cookiePath = path.join(networkPath, 'Cookies');
            
            if (fs.existsSync(cookiePath)) {
                // A very rough proxy for cookie count without doing a locked SQLite query 
                // is using the file size of the Cookies database. Or we could just use file size directly.
                const stat = fs.statSync(cookiePath);
                cookieCount = Math.floor(stat.size / 1024); // Approximation (1KB ~ 1 cookie)
            }
            
            const historyPath = path.join(defaultProfilePath, 'History');
            if (fs.existsSync(historyPath)) {
                historySize = fs.statSync(historyPath).size / 1024;
            }
        }
    } catch (err) {
        console.error('[FeatureExtractor] Error extracting features for', profileId, err);
    }
    
    return {
        cookieCount,
        historySize,
        profileSizeMb: parseFloat(profileSizeMb.toFixed(2)),
        proxyLatencyMs: 0 // Will be injected by the caller if available
    };
}

function getFolderSize(dirPath: string): number {
    let size = 0;
    try {
        const files = fs.readdirSync(dirPath);
        for (let i = 0; i < files.length; i++) {
            const filePath = path.join(dirPath, files[i]);
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
                size += getFolderSize(filePath);
            } else {
                size += stats.size;
            }
        }
    } catch {
        // Ignore read errors
    }
    return size;
}
