import fs from 'fs';
import path from 'path';
import initSqlJs from 'sql.js';
import { getProfileById } from './profile-manager';

// Chrome epoch offset: microseconds between 1601-01-01 and 1970-01-01
const CHROME_EPOCH_OFFSET_MICRO = BigInt('11644473600000000');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDefaultDir(dataDirPath: string): string {
    // Playwright's launchPersistentContext uses the dir as userDataDir
    // Chromium creates "Default" subdirectory inside it
    const withDefault = path.join(dataDirPath, 'Default');
    if (fs.existsSync(withDefault)) return withDefault;
    return dataDirPath; // fallback for some setups
}

function jsToChromeMicros(unixMs: number): bigint {
    return BigInt(unixMs) * BigInt(1000) + CHROME_EPOCH_OFFSET_MICRO;
}

function chromeMicrosToUnixMs(chromeMicros: bigint): number {
    return Number((chromeMicros - CHROME_EPOCH_OFFSET_MICRO) / BigInt(1000));
}

function nowChromeMicros(): bigint {
    return jsToChromeMicros(Date.now());
}

async function openSqlite(filePath: string): Promise<import('sql.js').Database | null> {
    if (!fs.existsSync(filePath)) return null;
    try {
        const SQL = await initSqlJs();
        const buffer = fs.readFileSync(filePath);
        return new SQL.Database(buffer);
    } catch {
        return null;
    }
}

function saveSqlite(db: import('sql.js').Database, filePath: string): void {
    const data = db.export();
    fs.writeFileSync(filePath, Buffer.from(data));
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BrowserCookie {
    name: string;
    value: string;
    domain: string;
    path: string;
    expires: number; // unix ms, -1 = session
    secure: boolean;
    httpOnly: boolean;
    sameSite: 'Strict' | 'Lax' | 'None' | 'Unspecified';
}

export interface HistoryEntry {
    id: number;
    url: string;
    title: string;
    visitCount: number;
    lastVisit: string; // ISO
}

export interface BookmarkNode {
    id: string;
    name: string;
    type: 'folder' | 'url';
    url?: string;
    children?: BookmarkNode[];
    dateAdded?: string;
}

export interface DataStats {
    cookieCount: number;
    historyCount: number;
    bookmarkCount: number;
    hasCookies: boolean;
    hasHistory: boolean;
    hasBookmarks: boolean;
}

// ─── Stats ───────────────────────────────────────────────────────────────────

export async function getDataStats(profileId: string): Promise<DataStats> {
    const profile = getProfileById(profileId);
    if (!profile) throw new Error('Perfil não encontrado');
    const dir = getDefaultDir(profile.data_dir_path);

    let cookieCount = 0;
    let historyCount = 0;
    let bookmarkCount = 0;

    const cookiePath = path.join(dir, 'Cookies');
    if (fs.existsSync(cookiePath)) {
        const db = await openSqlite(cookiePath);
        if (db) {
            try {
                const res = db.exec('SELECT COUNT(*) as c FROM cookies');
                cookieCount = Number(res[0]?.values[0]?.[0] ?? 0);
            } catch { /* table may not exist yet */ }
            db.close();
        }
    }

    const historyPath = path.join(dir, 'History');
    if (fs.existsSync(historyPath)) {
        const db = await openSqlite(historyPath);
        if (db) {
            try {
                const res = db.exec('SELECT COUNT(*) as c FROM urls');
                historyCount = Number(res[0]?.values[0]?.[0] ?? 0);
            } catch { }
            db.close();
        }
    }

    const bookmarksPath = path.join(dir, 'Bookmarks');
    if (fs.existsSync(bookmarksPath)) {
        try {
            const raw = JSON.parse(fs.readFileSync(bookmarksPath, 'utf-8'));
            const count = (node: any): number => {
                if (!node) return 0;
                if (node.type === 'url') return 1;
                if (node.children) return node.children.reduce((s: number, c: any) => s + count(c), 0);
                return 0;
            };
            bookmarkCount = count(raw.roots?.bookmark_bar) + count(raw.roots?.other) + count(raw.roots?.synced);
        } catch { }
    }

    return {
        cookieCount,
        historyCount,
        bookmarkCount,
        hasCookies: fs.existsSync(cookiePath),
        hasHistory: fs.existsSync(historyPath),
        hasBookmarks: fs.existsSync(bookmarksPath),
    };
}

// ─── Cookies ─────────────────────────────────────────────────────────────────

export async function getCookies(profileId: string): Promise<BrowserCookie[]> {
    const profile = getProfileById(profileId);
    if (!profile) throw new Error('Perfil não encontrado');
    const dir = getDefaultDir(profile.data_dir_path);
    const cookiePath = path.join(dir, 'Cookies');

    const db = await openSqlite(cookiePath);
    if (!db) return [];

    const cookies: BrowserCookie[] = [];
    try {
        const res = db.exec(`
            SELECT name, value, host_key, path, expires_utc, secure, httponly, samesite
            FROM cookies
            ORDER BY host_key, name
        `);
        if (res[0]) {
            for (const row of res[0].values) {
                const [name, value, host_key, cPath, expires_utc, secure, httponly, samesite] = row;
                const expiresChrome = BigInt(String(expires_utc));
                const expiresMs = expiresChrome > 0 ? chromeMicrosToUnixMs(expiresChrome) : -1;
                const sameSiteMap: Record<number, BrowserCookie['sameSite']> = {
                    [-1]: 'Unspecified', 0: 'None', 1: 'Lax', 2: 'Strict',
                };
                cookies.push({
                    name: String(name),
                    value: String(value),
                    domain: String(host_key),
                    path: String(cPath),
                    expires: expiresMs,
                    secure: Number(secure) === 1,
                    httpOnly: Number(httponly) === 1,
                    sameSite: sameSiteMap[Number(samesite)] ?? 'Unspecified',
                });
            }
        }
    } finally {
        db.close();
    }

    return cookies;
}

// Netscape format: domain \t includeSubdomains \t path \t secure \t expiry \t name \t value
export async function importCookiesNetscape(profileId: string, content: string): Promise<{ imported: number; skipped: number }> {
    const profile = getProfileById(profileId);
    if (!profile) throw new Error('Perfil não encontrado');
    const dir = getDefaultDir(profile.data_dir_path);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const cookiePath = path.join(dir, 'Cookies');
    const SQL = await initSqlJs();

    let db: import('sql.js').Database;
    if (fs.existsSync(cookiePath)) {
        db = new SQL.Database(fs.readFileSync(cookiePath));
    } else {
        db = new SQL.Database();
        db.run(`
            CREATE TABLE IF NOT EXISTS meta (key LONGVARCHAR NOT NULL UNIQUE PRIMARY KEY, value LONGVARCHAR);
            CREATE TABLE IF NOT EXISTS cookies (
                creation_utc INTEGER NOT NULL,
                host_key TEXT NOT NULL,
                top_frame_site_key TEXT NOT NULL DEFAULT '',
                name TEXT NOT NULL,
                value TEXT NOT NULL,
                encrypted_value BLOB DEFAULT '',
                path TEXT NOT NULL,
                expires_utc INTEGER NOT NULL,
                secure INTEGER NOT NULL,
                httponly INTEGER NOT NULL,
                last_access_utc INTEGER NOT NULL,
                has_expires INTEGER NOT NULL DEFAULT 1,
                persistent INTEGER NOT NULL DEFAULT 1,
                priority INTEGER NOT NULL DEFAULT 1,
                samesite INTEGER NOT NULL DEFAULT -1,
                source_scheme INTEGER NOT NULL DEFAULT 0,
                source_port INTEGER NOT NULL DEFAULT -1,
                is_same_party INTEGER NOT NULL DEFAULT 0,
                last_update_utc INTEGER NOT NULL DEFAULT 0,
                UNIQUE (host_key, top_frame_site_key, name, path)
            );
            INSERT OR IGNORE INTO meta VALUES ('version', '20');
        `);
    }

    const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'));
    let imported = 0;
    let skipped = 0;
    const nowMicros = nowChromeMicros();

    for (const line of lines) {
        const parts = line.split('\t');
        if (parts.length < 7) { skipped++; continue; }

        const [domain, , cPath, secureStr, expiryStr, name, value] = parts;
        const secure = secureStr?.toUpperCase() === 'TRUE' ? 1 : 0;
        const expiryUnix = parseInt(expiryStr ?? '0', 10);
        const expiresUtc = expiryUnix > 0
            ? jsToChromeMicros(expiryUnix * 1000)
            : BigInt(0);
        const creationUtc = nowMicros + BigInt(imported);

        try {
            db.run(`
                INSERT OR REPLACE INTO cookies
                  (creation_utc, host_key, top_frame_site_key, name, value, encrypted_value,
                   path, expires_utc, secure, httponly, last_access_utc, has_expires,
                   persistent, priority, samesite, source_scheme, source_port,
                   is_same_party, last_update_utc)
                VALUES (?, ?, '', ?, ?, '', ?, ?, ?, 0, ?, 1, 1, 1, -1, 0, 443, 0, ?)
            `, [
                creationUtc.toString(), domain.trim(), name.trim(), value?.trim() ?? '',
                (cPath ?? '/').trim(), expiresUtc.toString(), secure,
                nowMicros.toString(), nowMicros.toString(),
            ]);
            imported++;
        } catch {
            skipped++;
        }
    }

    saveSqlite(db, cookiePath);
    db.close();
    return { imported, skipped };
}

export async function exportCookiesNetscape(profileId: string): Promise<string> {
    const cookies = await getCookies(profileId);
    const lines = [
        '# Netscape HTTP Cookie File',
        '# Generated by Axe MultiLogin',
        '',
    ];
    for (const c of cookies) {
        const expiry = c.expires > 0 ? Math.floor(c.expires / 1000) : 0;
        const subdomain = c.domain.startsWith('.') ? 'TRUE' : 'FALSE';
        lines.push([c.domain, subdomain, c.path, c.secure ? 'TRUE' : 'FALSE', expiry, c.name, c.value].join('\t'));
    }
    return lines.join('\n');
}

export async function clearCookies(profileId: string): Promise<void> {
    const profile = getProfileById(profileId);
    if (!profile) throw new Error('Perfil não encontrado');
    const dir = getDefaultDir(profile.data_dir_path);
    const cookiePath = path.join(dir, 'Cookies');
    if (fs.existsSync(cookiePath)) fs.unlinkSync(cookiePath);
    const walPath = cookiePath + '-wal';
    const shmPath = cookiePath + '-shm';
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
    if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
}

// ─── History ──────────────────────────────────────────────────────────────────

export async function getHistory(profileId: string, limit = 200): Promise<HistoryEntry[]> {
    const profile = getProfileById(profileId);
    if (!profile) throw new Error('Perfil não encontrado');
    const dir = getDefaultDir(profile.data_dir_path);
    const historyPath = path.join(dir, 'History');

    const db = await openSqlite(historyPath);
    if (!db) return [];

    const entries: HistoryEntry[] = [];
    try {
        const res = db.exec(`
            SELECT id, url, title, visit_count, last_visit_time
            FROM urls
            ORDER BY last_visit_time DESC
            LIMIT ${limit}
        `);
        if (res[0]) {
            for (const row of res[0].values) {
                const [id, url, title, visitCount, lastVisitTime] = row;
                entries.push({
                    id: Number(id),
                    url: String(url),
                    title: String(title ?? ''),
                    visitCount: Number(visitCount),
                    lastVisit: new Date(chromeMicrosToUnixMs(BigInt(String(lastVisitTime)))).toISOString(),
                });
            }
        }
    } finally {
        db.close();
    }

    return entries;
}

export async function clearHistory(profileId: string): Promise<void> {
    const profile = getProfileById(profileId);
    if (!profile) throw new Error('Perfil não encontrado');
    const dir = getDefaultDir(profile.data_dir_path);
    const files = ['History', 'History-wal', 'History-shm', 'Visited Links', 'Top Sites'];
    for (const f of files) {
        const fp = path.join(dir, f);
        if (fs.existsSync(fp)) fs.unlinkSync(fp);
    }
}

// ─── Bookmarks ───────────────────────────────────────────────────────────────

function flattenBookmarks(node: any): BookmarkNode[] {
    if (!node) return [];
    if (node.type === 'url') {
        return [{ id: String(node.id), name: node.name, type: 'url', url: node.url }];
    }
    if (node.children) {
        const children = node.children.flatMap((c: any) => flattenBookmarks(c));
        return [{ id: String(node.id), name: node.name, type: 'folder', children }];
    }
    return [];
}

export async function getBookmarks(profileId: string): Promise<BookmarkNode[]> {
    const profile = getProfileById(profileId);
    if (!profile) throw new Error('Perfil não encontrado');
    const dir = getDefaultDir(profile.data_dir_path);
    const bookmarksPath = path.join(dir, 'Bookmarks');

    if (!fs.existsSync(bookmarksPath)) return [];

    try {
        const raw = JSON.parse(fs.readFileSync(bookmarksPath, 'utf-8'));
        return [
            ...flattenBookmarks(raw.roots?.bookmark_bar),
            ...flattenBookmarks(raw.roots?.other),
        ];
    } catch {
        return [];
    }
}

export async function addBookmark(profileId: string, name: string, url: string): Promise<void> {
    const profile = getProfileById(profileId);
    if (!profile) throw new Error('Perfil não encontrado');
    const dir = getDefaultDir(profile.data_dir_path);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const bookmarksPath = path.join(dir, 'Bookmarks');

    let raw: any = {};
    if (fs.existsSync(bookmarksPath)) {
        try { raw = JSON.parse(fs.readFileSync(bookmarksPath, 'utf-8')); } catch { }
    }

    if (!raw.roots) {
        raw.roots = { bookmark_bar: { children: [], id: '1', name: 'Bookmarks bar', type: 'folder' }, other: { children: [], id: '2', name: 'Other bookmarks', type: 'folder' } };
    }
    if (!raw.roots.bookmark_bar.children) raw.roots.bookmark_bar.children = [];

    const newId = String(Date.now());
    raw.roots.bookmark_bar.children.push({ date_added: String(nowChromeMicros()), id: newId, name, type: 'url', url });
    raw.version = 1;
    raw.checksum = '';

    fs.writeFileSync(bookmarksPath, JSON.stringify(raw, null, 2), 'utf-8');
}

export async function deleteBookmark(profileId: string, bookmarkId: string): Promise<void> {
    const profile = getProfileById(profileId);
    if (!profile) throw new Error('Perfil não encontrado');
    const dir = getDefaultDir(profile.data_dir_path);
    const bookmarksPath = path.join(dir, 'Bookmarks');
    if (!fs.existsSync(bookmarksPath)) return;

    const raw = JSON.parse(fs.readFileSync(bookmarksPath, 'utf-8'));
    const removeById = (nodes: any[]): any[] => nodes.filter((n: any) => {
        if (String(n.id) === bookmarkId) return false;
        if (n.children) n.children = removeById(n.children);
        return true;
    });

    if (raw.roots?.bookmark_bar?.children) raw.roots.bookmark_bar.children = removeById(raw.roots.bookmark_bar.children);
    if (raw.roots?.other?.children) raw.roots.other.children = removeById(raw.roots.other.children);
    fs.writeFileSync(bookmarksPath, JSON.stringify(raw, null, 2), 'utf-8');
}

export async function clearBookmarks(profileId: string): Promise<void> {
    const profile = getProfileById(profileId);
    if (!profile) throw new Error('Perfil não encontrado');
    const dir = getDefaultDir(profile.data_dir_path);
    const bookmarksPath = path.join(dir, 'Bookmarks');
    if (fs.existsSync(bookmarksPath)) fs.unlinkSync(bookmarksPath);
}

// ─── Clear All ────────────────────────────────────────────────────────────────

export async function clearAllData(profileId: string, options: {
    cookies?: boolean;
    history?: boolean;
    bookmarks?: boolean;
    cache?: boolean;
}): Promise<void> {
    const profile = getProfileById(profileId);
    if (!profile) throw new Error('Perfil não encontrado');
    const dir = getDefaultDir(profile.data_dir_path);

    if (options.cookies) await clearCookies(profileId);
    if (options.history) await clearHistory(profileId);
    if (options.bookmarks) await clearBookmarks(profileId);

    if (options.cache) {
        const cacheDirs = ['Cache', 'Code Cache', 'GPUCache', 'ShaderCache', 'blob_storage'];
        for (const d of cacheDirs) {
            const dp = path.join(dir, d);
            if (fs.existsSync(dp)) fs.rmSync(dp, { recursive: true, force: true });
        }
    }
}
