import initSqlJs, { Database as SqlJsDatabase, SqlValue } from 'sql.js';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { getSupabase } from './supabase-client';

let db: SqlJsDatabase | null = null;
let dbPath: string = '';

/**
 * Get the database directory path
 */
function getDbPath(): string {
    const userDataPath = app.getPath('userData');
    const dbDir = path.join(userDataPath, 'database');

    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }

    return path.join(dbDir, 'profiles.db');
}

/**
 * Get the browser data directory for storing profile contexts
 */
export function getBrowserDataPath(): string {
    const userDataPath = app.getPath('userData');
    const browserDataDir = path.join(userDataPath, 'browser_data');

    if (!fs.existsSync(browserDataDir)) {
        fs.mkdirSync(browserDataDir, { recursive: true });
    }

    return browserDataDir;
}

let saveTimeout: NodeJS.Timeout | null = null;

/**
 * Save database to disk atomically to prevent corruption
 */
export function saveDatabase(immediate: boolean = false): void {
    if (!db || !dbPath) return;

    const performSave = () => {
        if (!db || !dbPath) return;
        try {
            const data = db.export();
            const buffer = Buffer.from(data);
            const tempPath = dbPath + '.tmp';
            
            // Write to a temporary file first
            fs.writeFileSync(tempPath, buffer);
            
            // Atomically rename the temp file to the final destination
            fs.renameSync(tempPath, dbPath);
        } catch (err) {
            console.error('[Database] Failed to save database atomically:', err);
        }
    };

    if (immediate) {
        if (saveTimeout) {
            clearTimeout(saveTimeout);
            saveTimeout = null;
        }
        performSave();
        return;
    }

    if (saveTimeout) return;

    saveTimeout = setTimeout(() => {
        saveTimeout = null;
        performSave();
    }, 500);
}

/**
 * Check if a column exists in a table
 */
function columnExists(database: SqlJsDatabase, table: string, column: string): boolean {
    try {
        const stmt = database.prepare(`PRAGMA table_info(${table})`);
        while (stmt.step()) {
            const row = stmt.getAsObject() as { name: string };
            if (row.name === column) {
                stmt.free();
                return true;
            }
        }
        stmt.free();
        return false;
    } catch {
        return false;
    }
}

/**
 * Run database migrations to ensure schema is up to date
 */
function runMigrations(database: SqlJsDatabase): void {
    console.log('[Database] Running migrations...');

    // Add missing columns to profiles table
    const profileMigrations = [
        { column: 'last_used', type: 'DATETIME' },
        { column: 'notes', type: 'TEXT' },
        { column: 'status', type: 'TEXT DEFAULT \'ready\'' },
        { column: 'is_active', type: 'INTEGER DEFAULT 0' },
        { column: 'tags', type: 'TEXT' },
        { column: 'category', type: 'TEXT DEFAULT \'all\'' },
        { column: 'folder_id', type: 'TEXT' },
        { column: 'browser_type', type: 'TEXT DEFAULT \'chromium\'' },
        { column: 'last_login_at', type: 'DATETIME' },
        { column: 'oauth_linked_email', type: 'TEXT' },
        { column: 'bypass_list', type: 'TEXT' },
        { column: 'avatar_color', type: 'TEXT' },
        { column: 'avatar_icon', type: 'TEXT' },
    ];

    for (const migration of profileMigrations) {
        if (!columnExists(database, 'profiles', migration.column)) {
            console.log(`[Database] Adding column: profiles.${migration.column}`);
            try {
                database.run(`ALTER TABLE profiles ADD COLUMN ${migration.column} ${migration.type}`);
            } catch (error) {
                console.log(`[Database] Column ${migration.column} may already exist:`, error);
            }
        }
    }

    console.log('[Database] Migrations complete');
}

/**
 * Initialize the database and create tables if they don't exist
 */
export async function initDatabase(): Promise<SqlJsDatabase> {
    if (db) return db;

    dbPath = getDbPath();

    // Initialize SQL.js
    const SQL = await initSqlJs();

    // Load existing database or create new one
    if (fs.existsSync(dbPath)) {
        const buffer = fs.readFileSync(dbPath);
        db = new SQL.Database(buffer);
    } else {
        db = new SQL.Database();
    }

    // Create tables
    const schema = `
        -- Profiles table
        CREATE TABLE IF NOT EXISTS profiles (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_used DATETIME,
            data_dir_path TEXT NOT NULL UNIQUE,
            notes TEXT,
            status TEXT DEFAULT 'ready',
            is_active INTEGER DEFAULT 0,
            tags TEXT,
            category TEXT DEFAULT 'all',
            folder_id TEXT,
            browser_type TEXT DEFAULT 'chromium',
            FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
        );

        -- Folders table
        CREATE TABLE IF NOT EXISTS folders (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            is_default INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Fingerprints table
        CREATE TABLE IF NOT EXISTS fingerprints (
            id TEXT PRIMARY KEY,
            profile_id TEXT NOT NULL UNIQUE,
            user_agent TEXT NOT NULL,
            platform TEXT NOT NULL,
            vendor TEXT NOT NULL,
            renderer TEXT NOT NULL,
            webgl_vendor TEXT NOT NULL,
            viewport_width INTEGER NOT NULL,
            viewport_height INTEGER NOT NULL,
            screen_width INTEGER NOT NULL,
            screen_height INTEGER NOT NULL,
            color_depth INTEGER DEFAULT 24,
            pixel_ratio REAL DEFAULT 1.0,
            hardware_concurrency INTEGER NOT NULL,
            device_memory INTEGER NOT NULL,
            timezone TEXT NOT NULL,
            language TEXT NOT NULL,
            languages TEXT NOT NULL,
            canvas_noise_seed TEXT NOT NULL,
            webgl_noise_seed TEXT NOT NULL,
            audio_noise_seed TEXT NOT NULL,
            webrtc_mode TEXT DEFAULT 'disabled',
            FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
        );

        -- Proxies table
        CREATE TABLE IF NOT EXISTS proxies (
            id TEXT PRIMARY KEY,
            profile_id TEXT NOT NULL UNIQUE,
            type TEXT NOT NULL,
            host TEXT NOT NULL,
            port INTEGER NOT NULL,
            username TEXT,
            password TEXT,
            FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
        );

        -- Profile templates table
        CREATE TABLE IF NOT EXISTS profile_templates (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            platform TEXT DEFAULT 'windows',
            tags TEXT,
            fingerprint_snapshot TEXT NOT NULL,
            proxy_snapshot TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Proxy pool table
        CREATE TABLE IF NOT EXISTS proxy_pool (
            id TEXT PRIMARY KEY,
            label TEXT,
            type TEXT NOT NULL DEFAULT 'http',
            host TEXT NOT NULL,
            port INTEGER NOT NULL,
            username TEXT,
            password TEXT,
            last_tested_at TEXT,
            last_status TEXT DEFAULT 'untested',
            last_latency_ms INTEGER,
            assigned_profile_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Activity/Audit logs table (Immutable)
        CREATE TABLE IF NOT EXISTS activity_logs (
            id TEXT PRIMARY KEY,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            action_type TEXT NOT NULL,
            profile_id TEXT,
            details TEXT,
            integrity_hash TEXT NOT NULL
        );

        -- Security/Audit logs table
        CREATE TABLE IF NOT EXISTS security_audit_logs (
            id TEXT PRIMARY KEY,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            action_type TEXT NOT NULL,
            profile_id TEXT,
            details TEXT,
            severity TEXT CHECK(severity IN ('INFO', 'WARNING', 'ERROR')) DEFAULT 'INFO'
        );

        -- Sessions table
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            profile_id TEXT NOT NULL,
            provider TEXT NOT NULL,
            status TEXT NOT NULL,
            last_login_at DATETIME,
            expires_at DATETIME,
            FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
        );

        -- OAuth Tokens table
        CREATE TABLE IF NOT EXISTS oauth_tokens (
            id TEXT PRIMARY KEY,
            profile_id TEXT NOT NULL,
            provider TEXT NOT NULL,
            access_token_ref TEXT NOT NULL,
            refresh_token_ref TEXT,
            scope TEXT,
            expires_at DATETIME,
            FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
        );
    `;

    db.run(schema);

    // Run migrations to add missing columns
    runMigrations(db);

    // Reset all profiles to inactive on startup (in case app crashed with browsers open)
    db.run('UPDATE profiles SET is_active = 0');
    console.log('[Database] Reset all profiles to inactive state');

    saveDatabase();

    console.log('[Database] Initialized at:', dbPath);
    return db;
}

/**
 * Get the database instance
 */
export function getDb(): SqlJsDatabase {
    if (!db) {
        throw new Error('Database not initialized. Call initDatabase() first.');
    }
    return db;
}

/**
 * Close the database connection
 */
export function closeDatabase(): void {
    if (db) {
        saveDatabase(true);
        db.close();
        db = null;
        console.log('[Database] Connection closed');
    }
}


async function pushToSupabase(action: 'insert' | 'update' | 'remove', table: string, id: string, data?: any) {
    return;
}

const ALLOWED_TABLES = new Set([
    'profiles',
    'folders',
    'fingerprints',
    'proxies',
    'profile_templates',
    'proxy_pool',
    'activity_logs'
]);

function validateTable(table: string): void {
    if (!ALLOWED_TABLES.has(table)) {
        throw new Error(`Unauthorized table access: ${table}`);
    }
}

/**
 * Generic insert helper
 */
export function insert<T extends Record<string, unknown>>(
    table: string,
    data: T
): void {
    validateTable(table);
    const db = getDb();
    const keys = Object.keys(data);
    const values = Object.values(data) as SqlValue[];
    const placeholders = keys.map(() => '?').join(', ');

    const stmt = db.prepare(
        `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`
    );
    stmt.run(values);
    stmt.free();
    saveDatabase();
    
    // Sync with Supabase
    if (data.id) {
        pushToSupabase('insert', table, data.id as string, data);
    }
}

/**
 * Generic update helper
 */
export function update<T extends Record<string, unknown>>(
    table: string,
    id: string,
    data: T
): void {
    validateTable(table);
    const db = getDb();
    const keys = Object.keys(data);
    const values = Object.values(data) as SqlValue[];
    const setClause = keys.map(k => `${k} = ?`).join(', ');

    const stmt = db.prepare(
        `UPDATE ${table} SET ${setClause} WHERE id = ?`
    );
    stmt.run([...values, id]);
    stmt.free();
    saveDatabase();
    
    // Sync with Supabase
    pushToSupabase('update', table, id, data);
}

/**
 * Generic delete helper
 */
export function remove(table: string, id: string): void {
    validateTable(table);
    const db = getDb();
    const stmt = db.prepare(`DELETE FROM ${table} WHERE id = ?`);
    stmt.run([id]);
    stmt.free();
    saveDatabase();
    
    // Sync with Supabase
    pushToSupabase('remove', table, id);
}

/**
 * Generic find by ID helper
 */
export function findById<T>(table: string, id: string): T | undefined {
    validateTable(table);
    const db = getDb();
    const stmt = db.prepare(`SELECT * FROM ${table} WHERE id = ?`);
    stmt.bind([id]);

    if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return row as T;
    }

    stmt.free();
    return undefined;
}

/**
 * Generic find all helper
 */
export function findAll<T>(table: string): T[] {
    validateTable(table);
    const db = getDb();
    const results: T[] = [];
    const stmt = db.prepare(`SELECT * FROM ${table}`);

    while (stmt.step()) {
        results.push(stmt.getAsObject() as T);
    }

    stmt.free();
    return results;
}

/**
 * Generic find by column helper
 */
export function findBy<T>(
    table: string,
    column: string,
    value: unknown
): T | undefined {
    validateTable(table);
    const db = getDb();
    const stmt = db.prepare(`SELECT * FROM ${table} WHERE ${column} = ?`);
    stmt.bind([value as string | number]);

    if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return row as T;
    }

    stmt.free();
    return undefined;
}

/**
 * Log a security event to the security_audit_logs table.
 */
export function logSecurityEvent(
    actionType: string,
    details: string,
    severity: 'INFO' | 'WARNING' | 'ERROR' = 'INFO',
    profileId?: string
): void {
    if (!db) return;
    try {
        const id = uuidv4();
        db.run(
            `INSERT INTO security_audit_logs (id, action_type, profile_id, details, severity) VALUES (?, ?, ?, ?, ?)`,
            [id, actionType, profileId || null, details, severity]
        );
        saveDatabase();
        console.log(`[SecurityAuditLog] [${severity}] ${actionType}: ${details}`);
    } catch (err) {
        console.error('[Database] Failed to write security audit log:', err);
    }
}
