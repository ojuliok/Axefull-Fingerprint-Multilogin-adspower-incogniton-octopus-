import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import type { SqlValue } from 'sql.js';
import { getDb, insert, remove, getBrowserDataPath, saveDatabase } from '../database/db';
import { getProfileById } from './profile-manager';
import { Fingerprint, Proxy, Profile, ProfileWithDetails } from './types';

export interface ProfileTemplate {
    id: string;
    name: string;
    description: string | null;
    platform: string;
    tags: string | null;
    fingerprint_snapshot: string;
    proxy_snapshot: string | null;
    created_at: string;
}

export function getTemplates(): ProfileTemplate[] {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM profile_templates ORDER BY created_at DESC');
    const results: ProfileTemplate[] = [];
    while (stmt.step()) {
        const row = stmt.getAsObject() as Record<string, SqlValue>;
        results.push({
            id: row.id as string,
            name: row.name as string,
            description: row.description as string | null,
            platform: (row.platform as string) || 'windows',
            tags: row.tags as string | null,
            fingerprint_snapshot: row.fingerprint_snapshot as string,
            proxy_snapshot: row.proxy_snapshot as string | null,
            created_at: row.created_at as string,
        });
    }
    stmt.free();
    return results;
}

export function saveTemplate(profileId: string, name: string, description?: string): ProfileTemplate {
    const profile = getProfileById(profileId);
    if (!profile) throw new Error('Profile not found');

    const id = uuidv4();
    const now = new Date().toISOString();

    const template: ProfileTemplate = {
        id,
        name,
        description: description ?? null,
        platform: profile.fingerprint.platform,
        tags: profile.tags,
        fingerprint_snapshot: JSON.stringify(profile.fingerprint),
        proxy_snapshot: profile.proxy ? JSON.stringify(profile.proxy) : null,
        created_at: now,
    };

    insert('profile_templates', {
        id: template.id,
        name: template.name,
        description: template.description,
        platform: template.platform,
        tags: template.tags,
        fingerprint_snapshot: template.fingerprint_snapshot,
        proxy_snapshot: template.proxy_snapshot,
        created_at: template.created_at,
    });

    saveDatabase();
    return template;
}

export function deleteTemplate(id: string): void {
    remove('profile_templates', id);
    saveDatabase();
}

export function createProfileFromTemplate(templateId: string, profileName: string): ProfileWithDetails {
    const templates = getTemplates();
    const template = templates.find(t => t.id === templateId);
    if (!template) throw new Error('Template not found');

    const srcFingerprint: Fingerprint = JSON.parse(template.fingerprint_snapshot);
    const srcProxy: Proxy | null = template.proxy_snapshot ? JSON.parse(template.proxy_snapshot) : null;

    const newId = uuidv4();
    const browserDataPath = getBrowserDataPath();
    const dataDirPath = path.join(browserDataPath, newId);
    fs.mkdirSync(dataDirPath, { recursive: true });

    const now = new Date().toISOString();

    const profile: Profile = {
        id: newId,
        name: profileName,
        created_at: now,
        updated_at: now,
        last_used: null,
        data_dir_path: dataDirPath,
        notes: null,
        status: 'new',
        is_active: 0,
        tags: template.tags ?? null,
        category: null,
        folder_id: null,
        browser_type: 'chromium',
    };
    insert('profiles', profile as unknown as Record<string, unknown>);

    const fingerprint: Fingerprint = {
        ...srcFingerprint,
        id: uuidv4(),
        profile_id: newId,
        canvas_noise_seed: uuidv4().replace(/-/g, '').slice(0, 16),
        webgl_noise_seed: uuidv4().replace(/-/g, '').slice(0, 16),
        audio_noise_seed: uuidv4().replace(/-/g, '').slice(0, 16),
    };
    insert('fingerprints', fingerprint as unknown as Record<string, unknown>);

    let proxy: Proxy | null = null;
    if (srcProxy) {
        proxy = { ...srcProxy, id: uuidv4(), profile_id: newId };
        insert('proxies', proxy as unknown as Record<string, unknown>);
    }

    saveDatabase();
    return { ...profile, fingerprint, proxy };
}

export function bulkCreateFromTemplate(templateId: string, baseName: string, count: number): ProfileWithDetails[] {
    const results: ProfileWithDetails[] = [];
    for (let i = 1; i <= count; i++) {
        const name = count === 1 ? baseName : `${baseName} ${i}`;
        results.push(createProfileFromTemplate(templateId, name));
    }
    return results;
}
