import { getDb, saveDatabase } from '../../database/db';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export interface AuditLogEntry {
    id: string;
    timestamp: string;
    action_type: string;
    profile_id: string | null;
    details: string;
    integrity_hash: string;
}

/**
 * Get the last inserted log hash to chain the next log (Blockchain style)
 */
function getLastHash(): string {
    try {
        const db = getDb();
        const stmt = db.prepare('SELECT integrity_hash FROM activity_logs ORDER BY timestamp DESC LIMIT 1');
        if (stmt.step()) {
            const row = stmt.getAsObject();
            stmt.free();
            return row.integrity_hash as string;
        }
        stmt.free();
        return 'GENESIS_HASH';
    } catch {
        return 'GENESIS_HASH';
    }
}

/**
 * Logs an irreversible action to the audit logs.
 */
export function logAction(actionType: string, details: Record<string, any> | string, profileId?: string): void {
    const db = getDb();
    const prevHash = getLastHash();
    
    const timestamp = new Date().toISOString();
    const detailsStr = typeof details === 'string' ? details : JSON.stringify(details);
    
    // Hash = SHA256(prevHash + actionType + profileId + detailsStr + timestamp)
    const hashPayload = `${prevHash}|${actionType}|${profileId || 'null'}|${detailsStr}|${timestamp}`;
    const hash = crypto.createHash('sha256').update(hashPayload).digest('hex');
    
    const id = uuidv4();
    
    const stmt = db.prepare(
        'INSERT INTO activity_logs (id, timestamp, action_type, profile_id, details, integrity_hash) VALUES (?, ?, ?, ?, ?, ?)'
    );
    stmt.run([id, timestamp, actionType, profileId || null, detailsStr, hash]);
    stmt.free();
    saveDatabase();
}

/**
 * Retrieve recent logs for the UI
 */
export function getRecentLogs(limit = 100): AuditLogEntry[] {
    const db = getDb();
    const results: AuditLogEntry[] = [];
    const stmt = db.prepare('SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT ?');
    stmt.bind([limit]);
    
    while (stmt.step()) {
        results.push(stmt.getAsObject() as unknown as AuditLogEntry);
    }
    stmt.free();
    
    return results;
}
