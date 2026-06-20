import { v4 as uuidv4 } from 'uuid';
import type { SqlValue } from 'sql.js';
import { getDb, insert, remove, saveDatabase } from '../database/db';
import { testProxy } from '../browser/browser-engine';
import { Proxy } from '../profile/types';

export interface ProxyPoolEntry {
    id: string;
    label: string | null;
    type: 'http' | 'https' | 'socks4' | 'socks5';
    host: string;
    port: number;
    username: string | null;
    password: string | null;
    last_tested_at: string | null;
    last_status: 'ok' | 'failed' | 'untested';
    last_latency_ms: number | null;
    assigned_profile_id: string | null;
    created_at: string;
}

export function getProxyPool(): ProxyPoolEntry[] {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM proxy_pool ORDER BY created_at DESC');
    const results: ProxyPoolEntry[] = [];
    while (stmt.step()) {
        const row = stmt.getAsObject() as Record<string, SqlValue>;
        results.push({
            id: row.id as string,
            label: row.label as string | null,
            type: (row.type as string) as ProxyPoolEntry['type'],
            host: row.host as string,
            port: row.port as number,
            username: row.username as string | null,
            password: row.password as string | null,
            last_tested_at: row.last_tested_at as string | null,
            last_status: (row.last_status as string || 'untested') as ProxyPoolEntry['last_status'],
            last_latency_ms: row.last_latency_ms as number | null,
            assigned_profile_id: row.assigned_profile_id as string | null,
            created_at: row.created_at as string,
        });
    }
    stmt.free();
    return results;
}

export function addProxyToPool(input: {
    label?: string;
    type: ProxyPoolEntry['type'];
    host: string;
    port: number;
    username?: string;
    password?: string;
}): ProxyPoolEntry {
    const id = uuidv4();
    const now = new Date().toISOString();
    const entry: ProxyPoolEntry = {
        id,
        label: input.label ?? null,
        type: input.type,
        host: input.host,
        port: input.port,
        username: input.username ?? null,
        password: input.password ?? null,
        last_tested_at: null,
        last_status: 'untested',
        last_latency_ms: null,
        assigned_profile_id: null,
        created_at: now,
    };
    insert('proxy_pool', entry as unknown as Record<string, unknown>);
    saveDatabase();
    return entry;
}

function parseProxyLine(line: string): Omit<ProxyPoolEntry, 'id' | 'last_tested_at' | 'last_status' | 'last_latency_ms' | 'assigned_profile_id' | 'created_at'> | null {
    line = line.trim();
    if (!line || line.startsWith('#')) return null;

    // Format: type://user:pass@host:port
    const urlMatch = line.match(/^(https?|socks[45]):\/\/(?:([^:@]+):([^@]*)@)?([^:]+):(\d+)/i);
    if (urlMatch) {
        return {
            label: null,
            type: urlMatch[1].toLowerCase() as ProxyPoolEntry['type'],
            username: urlMatch[2] ?? null,
            password: urlMatch[3] ?? null,
            host: urlMatch[4],
            port: parseInt(urlMatch[5], 10),
        };
    }

    // Format: host:port or host:port:user:pass or host:port:user:pass:type
    const parts = line.split(':');
    if (parts.length >= 2) {
        const host = parts[0];
        const port = parseInt(parts[1], 10);
        if (!host || isNaN(port)) return null;
        const username = parts[2] ?? null;
        const password = parts[3] ?? null;
        const type = (parts[4] as ProxyPoolEntry['type']) || 'http';
        return { label: null, type, host, port, username, password };
    }

    return null;
}

export function bulkImportProxies(rawText: string): ProxyPoolEntry[] {
    const lines = rawText.split(/\r?\n/);
    const results: ProxyPoolEntry[] = [];
    for (const line of lines) {
        const parsed = parseProxyLine(line);
        if (parsed) {
            results.push(addProxyToPool({ ...parsed, label: parsed.label ?? undefined, username: parsed.username ?? undefined, password: parsed.password ?? undefined }));
        }
    }
    return results;
}

export function removeProxyFromPool(id: string): void {
    remove('proxy_pool', id);
    saveDatabase();
}

export async function testPoolProxy(id: string): Promise<{ ok: boolean; ip?: string; latency?: number; error?: string }> {
    const pool = getProxyPool();
    const entry = pool.find(p => p.id === id);
    if (!entry) throw new Error('Proxy not found in pool');

    const proxy: Proxy = {
        id: entry.id,
        profile_id: '',
        type: entry.type,
        host: entry.host,
        port: entry.port,
        username: entry.username,
        password: entry.password,
    };

    const result = await testProxy(proxy);

    const db = getDb();
    db.run(
        'UPDATE proxy_pool SET last_tested_at = ?, last_status = ?, last_latency_ms = ? WHERE id = ?',
        [new Date().toISOString(), result.ok ? 'ok' : 'failed', result.latency ?? null, id]
    );
    saveDatabase();

    return result;
}

export function assignProxy(proxyId: string, profileId: string): void {
    const db = getDb();
    db.run('UPDATE proxy_pool SET assigned_profile_id = ? WHERE id = ?', [profileId, proxyId]);
    saveDatabase();
}

export function unassignProxy(proxyId: string): void {
    const db = getDb();
    db.run('UPDATE proxy_pool SET assigned_profile_id = NULL WHERE id = ?', [proxyId]);
    saveDatabase();
}

export function getUnassignedProxies(): ProxyPoolEntry[] {
    return getProxyPool().filter(p => !p.assigned_profile_id);
}
