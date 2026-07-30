import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import type { SqlValue } from 'sql.js';
import {
    getDb,
    insert,
    update,
    remove,
    findById,
    findAll,
    findBy,
    getBrowserDataPath
} from '../../database/db';
import {
    Profile,
    Fingerprint,
    Proxy,
    ProfileWithDetails,
    CreateProfileInput,
    UpdateProfileInput,
    UpdateProxyInput,
    BrowserType
} from './types';
import { generateFingerprint, regenerateFingerprint } from '../fingerprint/generator';
import { logAction } from '../ai/audit-logger';

/**
 * Create a new profile with fingerprint and optional proxy
 */
export function createProfile(input: CreateProfileInput): ProfileWithDetails {
    const db = getDb();
    const profileId = uuidv4();

    // Create data directory for this profile
    const browserDataPath = getBrowserDataPath();
    const dataDirPath = path.join(browserDataPath, profileId);
    fs.mkdirSync(dataDirPath, { recursive: true });

    // Create profile
    const profile: Profile = {
        id: profileId,
        name: input.name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_used: null,
        data_dir_path: dataDirPath,
        notes: input.notes || null,
        status: 'new',
        is_active: 0,
        tags: input.tags || null,
        category: input.category || null,
        folder_id: input.folder_id || null,
        browser_type: input.browser_type || 'chromium',
        bypass_list: input.bypass_list || null,
        avatar_color: input.avatar_color || null,
        avatar_icon: input.avatar_icon || null,
    };

    insert('profiles', profile as unknown as Record<string, unknown>);

    // Generate and save fingerprint
    const platform = input.platform || 'windows';
    const fingerprint = generateFingerprint(profileId, platform);
    insert('fingerprints', fingerprint as unknown as Record<string, unknown>);

    // Create proxy if provided
    let proxy: Proxy | null = null;
    if (input.proxy) {
        proxy = {
            id: uuidv4(),
            profile_id: profileId,
            ...input.proxy,
        };
        insert('proxies', proxy as unknown as Record<string, unknown>);
    }

    console.log(`[ProfileManager] Created profile: ${profile.name} (${profileId})`);

    logAction('profile_created', { name: profile.name, category: profile.category }, profileId);

    return {
        ...profile,
        fingerprint,
        proxy,
    };
}

/**
 * Get all profiles with their fingerprints and proxies (supports pagination)
 */
export function getAllProfiles(options?: { page?: number; limit?: number }): ProfileWithDetails[] {
    const db = getDb();
    let queryStr = 'SELECT * FROM profiles';
    const params: SqlValue[] = [];

    if (options && options.limit) {
        queryStr += ' LIMIT ?';
        params.push(options.limit);
        if (options.page) {
            const offset = (options.page - 1) * options.limit;
            queryStr += ' OFFSET ?';
            params.push(offset);
        }
    }

    const stmt = db.prepare(queryStr);
    if (params.length > 0) {
        stmt.bind(params);
    }

    const profiles: Profile[] = [];
    while (stmt.step()) {
        profiles.push(stmt.getAsObject() as unknown as Profile);
    }
    stmt.free();

    return profiles.map(profile => {
        const fingerprint = findBy<Fingerprint>('fingerprints', 'profile_id', profile.id);
        const proxy = findBy<Proxy>('proxies', 'profile_id', profile.id);

        return {
            ...profile,
            fingerprint: fingerprint!,
            proxy: proxy || null,
        };
    });
}

/**
 * Get a single profile by ID with details
 */
export function getProfileById(id: string): ProfileWithDetails | null {
    const profile = findById<Profile>('profiles', id);
    if (!profile) return null;

    const fingerprint = findBy<Fingerprint>('fingerprints', 'profile_id', id);
    const proxy = findBy<Proxy>('proxies', 'profile_id', id);

    return {
        ...profile,
        fingerprint: fingerprint!,
        proxy: proxy || null,
    };
}

/**
 * Update profile basic info
 */
export function updateProfile(id: string, input: UpdateProfileInput): ProfileWithDetails | null {
    const profile = findById<Profile>('profiles', id);
    if (!profile) return null;

    update('profiles', id, {
        ...input,
        updated_at: new Date().toISOString(),
    });

    return getProfileById(id);
}

/**
 * Update or create proxy for a profile
 */
export function updateProfileProxy(profileId: string, input: UpdateProxyInput | null): Proxy | null {
    const existingProxy = findBy<Proxy>('proxies', 'profile_id', profileId);

    if (input === null) {
        // Remove proxy
        if (existingProxy) {
            remove('proxies', existingProxy.id);
        }
        return null;
    }

    if (existingProxy) {
        // Update existing proxy
        update('proxies', existingProxy.id, input as unknown as Record<string, unknown>);
        return findById<Proxy>('proxies', existingProxy.id) || null;
    } else {
        // Create new proxy
        const proxy: Proxy = {
            id: uuidv4(),
            profile_id: profileId,
            type: input.type || 'http',
            host: input.host || '',
            port: input.port || 8080,
            username: input.username || null,
            password: input.password || null,
        };
        insert('proxies', proxy as unknown as Record<string, unknown>);
        return proxy;
    }
}

/**
 * Regenerate fingerprint for a profile
 */
export function regenerateProfileFingerprint(
    profileId: string,
    platform: 'windows' | 'macos' | 'linux' = 'windows'
): Fingerprint | null {
    const existingFingerprint = findBy<Fingerprint>('fingerprints', 'profile_id', profileId);
    if (!existingFingerprint) return null;

    const newFingerprint = regenerateFingerprint(existingFingerprint, platform);

    // Update in database
    const db = getDb();
    const keys = Object.keys(newFingerprint).filter(k => k !== 'id');
    const setClause = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => (newFingerprint as unknown as Record<string, SqlValue>)[k]);

    const stmt = db.prepare(`UPDATE fingerprints SET ${setClause} WHERE id = ?`);
    stmt.run([...values, existingFingerprint.id]);

    console.log(`[ProfileManager] Regenerated fingerprint for profile: ${profileId}`);

    return findById<Fingerprint>('fingerprints', existingFingerprint.id) || null;
}

/**
 * Delete a profile and all associated data
 */
export function deleteProfile(id: string): boolean {
    const profile = findById<Profile>('profiles', id);
    if (!profile) return false;

    // Delete data directory
    if (fs.existsSync(profile.data_dir_path)) {
        fs.rmSync(profile.data_dir_path, { recursive: true, force: true });
    }

    // Delete from database (cascade will handle fingerprint and proxy)
    remove('profiles', id);

    console.log(`[ProfileManager] Deleted profile: ${id}`);
    logAction('profile_deleted', { name: profile.name }, id);

    return true;
}

/**
 * Set profile as active (for tracking which profiles are currently open)
 */
export function setProfileActive(id: string, active: boolean): void {
    update('profiles', id, { is_active: active ? 1 : 0 });
}

/**
 * Get all active profiles
 */
export function getActiveProfiles(): ProfileWithDetails[] {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM profiles WHERE is_active = 1');
    const profiles: Profile[] = [];
    while (stmt.step()) {
        profiles.push(stmt.getAsObject() as unknown as Profile);
    }
    stmt.free();

    return profiles.map(profile => {
        const fingerprint = findBy<Fingerprint>('fingerprints', 'profile_id', profile.id);
        const proxy = findBy<Proxy>('proxies', 'profile_id', profile.id);

        return {
            ...profile,
            fingerprint: fingerprint!,
            proxy: proxy || null,
        };
    });
}

/**
 * Update profile status
 */
export function updateProfileStatus(id: string, status: Profile['status']): ProfileWithDetails | null {
    const profile = findById<Profile>('profiles', id);
    if (!profile) return null;

    update('profiles', id, {
        status,
        updated_at: new Date().toISOString(),
    });

    return getProfileById(id);
}

/**
 * Update last used timestamp for a profile
 */
export function updateLastUsed(id: string): void {
    update('profiles', id, {
        last_used: new Date().toISOString(),
    });
}

/**
 * Import profiles from a previously exported JSON file
 * Returns the list of newly created profiles
 */
export function importProfiles(exportData: {
    version: string;
    profiles: ProfileWithDetails[];
}): ProfileWithDetails[] {
    const created: ProfileWithDetails[] = [];

    for (const source of exportData.profiles) {
        try {
            const newId = uuidv4();
            const browserDataPath = getBrowserDataPath();
            const dataDirPath = path.join(browserDataPath, newId);
            fs.mkdirSync(dataDirPath, { recursive: true });

            const profile: Profile = {
                id: newId,
                name: source.name,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                last_used: null,
                data_dir_path: dataDirPath,
                notes: source.notes || null,
                status: 'new',
                is_active: 0,
                tags: source.tags || null,
                category: (source.category !== 'trash' ? source.category : null) || null,
                folder_id: null,
                browser_type: (source as any).browser_type || 'chromium',
            };
            insert('profiles', profile as unknown as Record<string, unknown>);

            let fingerprint: Fingerprint;
            if (source.fingerprint) {
                fingerprint = { ...source.fingerprint, id: uuidv4(), profile_id: newId };
            } else {
                fingerprint = generateFingerprint(newId, 'windows');
            }
            insert('fingerprints', fingerprint as unknown as Record<string, unknown>);

            let proxy: Proxy | null = null;
            if (source.proxy) {
                proxy = { ...source.proxy, id: uuidv4(), profile_id: newId };
                insert('proxies', proxy as unknown as Record<string, unknown>);
            }

            // Restore cookies if present in JSON export
            if (source.cookies && Array.isArray(source.cookies) && source.cookies.length > 0) {
                try {
                    const dataManager = require('./data-manager');
                    const netscapeLines = [
                        '# Netscape HTTP Cookie File',
                        ...source.cookies.map((c: any) => [
                            c.domain,
                            c.domain?.startsWith('.') ? 'TRUE' : 'FALSE',
                            c.path || '/',
                            c.secure ? 'TRUE' : 'FALSE',
                            c.expires > 0 ? Math.floor(c.expires / 1000) : 0,
                            c.name,
                            c.value
                        ].join('\t'))
                    ].join('\n');
                    dataManager.importCookiesNetscape(newId, netscapeLines);
                } catch (cErr) {
                    console.error(`[ProfileManager] Could not restore cookies for ${newId}:`, cErr);
                }
            }

            // Restore bookmarks if present in JSON export
            if (source.bookmarks && Array.isArray(source.bookmarks) && source.bookmarks.length > 0) {
                try {
                    const dataManager = require('./data-manager');
                    for (const b of source.bookmarks) {
                        if (b.url && b.name) {
                            dataManager.addBookmark(newId, b.name, b.url);
                        }
                    }
                } catch (bErr) {
                    console.error(`[ProfileManager] Could not restore bookmarks for ${newId}:`, bErr);
                }
            }

            created.push({ ...profile, fingerprint, proxy });
        } catch (err) {
            console.error(`[ProfileManager] Failed to import profile "${source.name}":`, err);
        }
    }

    console.log(`[ProfileManager] Imported ${created.length} profiles`);
    return created;
}

/**
 * Permanently delete all profiles in trash
 */
export function emptyTrash(): number {
    const db = getDb();
    const stmt = db.prepare("SELECT id, data_dir_path FROM profiles WHERE category = 'trash'");
    const toDelete: { id: string; data_dir_path: string }[] = [];
    while (stmt.step()) {
        toDelete.push(stmt.getAsObject() as { id: string; data_dir_path: string });
    }
    stmt.free();

    for (const p of toDelete) {
        if (fs.existsSync(p.data_dir_path)) {
            fs.rmSync(p.data_dir_path, { recursive: true, force: true });
        }
        remove('profiles', p.id);
    }

    console.log(`[ProfileManager] Emptied trash: deleted ${toDelete.length} profiles`);
    return toDelete.length;
}

/**
 * Clone an existing profile (copies fingerprint, proxy, metadata) into a new profile
 */
export function cloneProfile(profileId: string): ProfileWithDetails {
    const source = getProfileById(profileId);
    if (!source) throw new Error('Profile not found');

    const newId = uuidv4();
    const browserDataPath = getBrowserDataPath();
    const dataDirPath = path.join(browserDataPath, newId);
    fs.mkdirSync(dataDirPath, { recursive: true });

    const cloned: Profile = {
        id: newId,
        name: `${source.name} (Cópia)`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_used: null,
        data_dir_path: dataDirPath,
        notes: source.notes,
        status: 'new',
        is_active: 0,
        tags: source.tags,
        category: source.category,
        folder_id: source.folder_id,
        browser_type: source.browser_type || 'chromium',
        bypass_list: source.bypass_list || null,
        avatar_color: source.avatar_color || null,
        avatar_icon: source.avatar_icon || null,
    };
    insert('profiles', cloned as unknown as Record<string, unknown>);

    const fp = source.fingerprint;
    const newFp: Fingerprint = { ...fp, id: uuidv4(), profile_id: newId };
    insert('fingerprints', newFp as unknown as Record<string, unknown>);

    let proxy: Proxy | null = null;
    if (source.proxy) {
        proxy = { ...source.proxy, id: uuidv4(), profile_id: newId };
        insert('proxies', proxy as unknown as Record<string, unknown>);
    }

    console.log(`[ProfileManager] Cloned profile: ${source.name} → ${cloned.name} (${newId})`);
    logAction('profile_cloned', { original_id: profileId, new_name: cloned.name }, newId);

    return { ...cloned, fingerprint: newFp, proxy };
}
