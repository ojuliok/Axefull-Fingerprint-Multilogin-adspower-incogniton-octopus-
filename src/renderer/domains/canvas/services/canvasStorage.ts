import { supabase } from '../../../lib/supabase';
import { CanvasInfo, CanvasData, CanvasNode, Stroke, CanvasConnection, BrowserTab } from '../types/canvasTypes';
import { addToSyncQueue } from '../../../lib/syncManager';

export * from '../types/canvasTypes';

// -- Helpers --

function generateId(): string {
    return Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9);
}

function sanitizeUUID(id: string | undefined | null): string | null {
    if (!id) return null;
    const clean = id.trim();
    if (clean === '') return null;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(clean) ? clean : null;
}

function getStorageMode(): 'online' | 'offline' {
    return 'offline';
}

function updateLocalCachedNodes(id: string, action: 'delete' | 'update' | 'insert', updates?: any) {
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('axe_online_backup_nodes_')) {
                const raw = localStorage.getItem(key);
                if (raw) {
                    let list: CanvasInfo[] = JSON.parse(raw);
                    if (action === 'delete') {
                        list = list.filter(item => item.id !== id);
                    } else if (action === 'insert' && updates) {
                        list.unshift(updates);
                    } else if (action === 'update' && updates) {
                        list = list.map(item => {
                            if (item.id === id) {
                                return { ...item, ...updates, updatedAt: Date.now() };
                            }
                            return item;
                        });
                    }
                    localStorage.setItem(key, JSON.stringify(list));
                }
            }
        }
    } catch (e) {
        console.error('Failed to update local node cache', e);
    }
}


// ── List Operations ──

export async function getCanvasList(workspaceId: string): Promise<CanvasInfo[]> {
    if (getStorageMode() === 'offline') {
        const offlineCanvases = localStorage.getItem('axe_offline_canvases');
        const list = offlineCanvases ? JSON.parse(offlineCanvases) : [];
        return list.filter((c: any) => c.workspaceId === workspaceId && !c.isDeleted);
    }

    const cleanWorkspaceId = sanitizeUUID(workspaceId);
    if (!cleanWorkspaceId) return [];
    try {
        const { data, error } = await supabase
            .from('nodes')
            .select('*')
            .eq('workspace_id', cleanWorkspaceId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        
        const list = (data || []).map(row => ({
            id: row.id,
            name: row.title || '',
            title: row.title,
            createdAt: new Date(row.created_at).getTime(),
            updatedAt: new Date(row.updated_at).getTime(),
            parentId: row.parent_id,
            type: row.properties?.subtype === 'table' ? 'table' : (row.type as any),
            color: row.color,
            isDeleted: row.is_deleted,
            deletedAt: row.deleted_at ? new Date(row.deleted_at).getTime() : undefined,
            isFavorite: row.is_favorite,
            coverImage: row.cover_image,
            description: row.description,
            icon: row.icon,
            properties: row.properties,
            tags: row.tags,
            notes: row.notes
        }));
        
        localStorage.setItem(`axe_online_backup_nodes_${workspaceId}`, JSON.stringify(list));
        return list;
    } catch (err) {
        console.error('Error fetching canvases, falling back to local cache', err);
        const cached = localStorage.getItem(`axe_online_backup_nodes_${workspaceId}`);
        return cached ? JSON.parse(cached) : [];
    }
}

export async function createCanvas(workspaceId: string, ownerId: string, name: string, parentId?: string, type: 'canvas'|'page'|'card'|'table'|'folder'|'space' = 'canvas', forceId?: string): Promise<CanvasInfo> {
    if (getStorageMode() === 'offline') {
        const id = forceId || crypto.randomUUID();
        const emptyData: CanvasData = { nodes: [], viewport: { x: 0, y: 0, zoom: 1 } };
        
        const newCanvas: any = {
            id,
            workspaceId: workspaceId || 'offline-workspace',
            ownerId: ownerId || 'offline-owner',
            parentId: parentId || null,
            title: name,
            type,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isDeleted: false,
            content_data: emptyData
        };
        
        const offlineCanvases = localStorage.getItem('axe_offline_canvases');
        const list = offlineCanvases ? JSON.parse(offlineCanvases) : [];
        list.push(newCanvas);
        localStorage.setItem('axe_offline_canvases', JSON.stringify(list));
        localStorage.setItem(`axe_offline_canvas_data_${id}`, JSON.stringify(emptyData));
        
        return {
            id: newCanvas.id,
            name: newCanvas.title || '',
            title: newCanvas.title,
            createdAt: newCanvas.createdAt,
            updatedAt: newCanvas.updatedAt,
            parentId: newCanvas.parentId,
            type: newCanvas.type as any
        };
    }

    const cleanForceId = sanitizeUUID(forceId);
    const id = cleanForceId || crypto.randomUUID();
    const emptyData: CanvasData = { nodes: [], viewport: { x: 0, y: 0, zoom: 1 } };
    
    const actualType = type === 'table' ? 'canvas' : type;
    const properties = type === 'table' ? { subtype: 'table' } : {};
    
    const newCanvasInfo: CanvasInfo = {
        id,
        name,
        title: name,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        parentId: parentId || undefined,
        type: type as any
    };

    // Save empty canvas data locally (both keys for maximum compatibility)
    try {
        localStorage.setItem(`axe_offline_canvas_data_${id}`, JSON.stringify(emptyData));
        localStorage.setItem(`axe_online_backup_canvas_data_${id}`, JSON.stringify(emptyData));
    } catch (_) {}
    updateLocalCachedNodes(id, 'insert', newCanvasInfo);

    // Try online synchronous insert first to prevent race condition
    if (navigator.onLine) {
        try {
            const { data, error } = await supabase.from('nodes').insert([{
                id,
                workspace_id: sanitizeUUID(workspaceId),
                owner_id: sanitizeUUID(ownerId),
                parent_id: sanitizeUUID(parentId),
                title: name,
                type: actualType,
                properties,
                content_data: emptyData
            }]).select().single();
            
            if (error) throw error;
            
            return newCanvasInfo;
        } catch (err) {
            console.warn('[canvasStorage] Online insert failed, falling back to sync queue', err);
        }
    }

    // Queue sync to Supabase (offline mode fallback)
    const syncPayload = {
        id,
        workspaceId,
        ownerId,
        parentId,
        title: name,
        type: actualType,
        properties,
        content_data: emptyData,
        createdAt: newCanvasInfo.createdAt,
        updatedAt: newCanvasInfo.updatedAt
    };
    addToSyncQueue('node', 'insert', id, syncPayload);

    return newCanvasInfo;
}

export async function createFolder(workspaceId: string, ownerId: string, name: string, parentId?: string): Promise<CanvasInfo> {
    return createCanvas(workspaceId, ownerId, name, parentId, 'folder');
}

export async function deleteCanvas(id: string): Promise<void> {
    if (getStorageMode() === 'offline') {
        const offlineCanvases = localStorage.getItem('axe_offline_canvases');
        if (offlineCanvases) {
            let list = JSON.parse(offlineCanvases);
            list = list.filter((c: any) => c.id !== id);
            localStorage.setItem('axe_offline_canvases', JSON.stringify(list));
        }
        localStorage.removeItem(`axe_offline_canvas_data_${id}`);
        return;
    }

    const cleanId = sanitizeUUID(id);
    if (!cleanId) return;
    
    // Update local cache
    updateLocalCachedNodes(cleanId, 'delete');
    localStorage.removeItem(`axe_online_backup_canvas_data_${cleanId}`);

    // Queue sync delete
    addToSyncQueue('node', 'remove', cleanId, null);
}

export async function softDeleteCanvas(id: string): Promise<void> {
    if (getStorageMode() === 'offline') {
        const offlineCanvases = localStorage.getItem('axe_offline_canvases');
        if (offlineCanvases) {
            const list = JSON.parse(offlineCanvases);
            const found = list.find((c: any) => c.id === id);
            if (found) {
                found.isDeleted = true;
                found.deletedAt = Date.now();
                localStorage.setItem('axe_offline_canvases', JSON.stringify(list));
            }
        }
        return;
    }

    const cleanId = sanitizeUUID(id);
    if (!cleanId) return;

    const updates = { isDeleted: true, deletedAt: Date.now() };
    updateLocalCachedNodes(cleanId, 'update', updates);

    // Queue sync update
    addToSyncQueue('node', 'update', cleanId, updates);
}

export async function restoreCanvas(id: string): Promise<void> {
    if (getStorageMode() === 'offline') {
        const offlineCanvases = localStorage.getItem('axe_offline_canvases');
        if (offlineCanvases) {
            const list = JSON.parse(offlineCanvases);
            const found = list.find((c: any) => c.id === id);
            if (found) {
                found.isDeleted = false;
                found.deletedAt = null;
                localStorage.setItem('axe_offline_canvases', JSON.stringify(list));
            }
        }
        return;
    }

    const cleanId = sanitizeUUID(id);
    if (!cleanId) return;

    const updates = { isDeleted: false, deletedAt: null };
    updateLocalCachedNodes(cleanId, 'update', updates);

    // Queue sync update
    addToSyncQueue('node', 'update', cleanId, updates);
}

export async function renameCanvas(id: string, name: string): Promise<void> {
    if (getStorageMode() === 'offline') {
        const offlineCanvases = localStorage.getItem('axe_offline_canvases');
        if (offlineCanvases) {
            const list = JSON.parse(offlineCanvases);
            const found = list.find((c: any) => c.id === id);
            if (found) {
                found.name = name;
                found.updatedAt = Date.now();
                localStorage.setItem('axe_offline_canvases', JSON.stringify(list));
            }
        }
        return;
    }

    const cleanId = sanitizeUUID(id);
    if (!cleanId) return;

    const updates = { name, title: name };
    updateLocalCachedNodes(cleanId, 'update', updates);

    // Queue sync update
    addToSyncQueue('node', 'update', cleanId, updates);
}

export async function updateCanvasInfo(id: string, updates: Partial<CanvasInfo>): Promise<void> {
    if (getStorageMode() === 'offline') {
        const offlineCanvases = localStorage.getItem('axe_offline_canvases');
        if (offlineCanvases) {
            const list = JSON.parse(offlineCanvases);
            const found = list.find((c: any) => c.id === id);
            if (found) {
                Object.assign(found, updates);
                found.updatedAt = Date.now();
                localStorage.setItem('axe_offline_canvases', JSON.stringify(list));
            }
        }
        return;
    }

    const cleanId = sanitizeUUID(id);
    if (!cleanId) return;

    updateLocalCachedNodes(cleanId, 'update', updates);

    // Queue sync update
    addToSyncQueue('node', 'update', cleanId, updates);
}

export async function moveCanvasItem(id: string, targetId: string, position: 'before' | 'after' | 'inside', workspaceId?: string): Promise<void> {
    if (getStorageMode() === 'offline') {
        const offlineCanvases = localStorage.getItem('axe_offline_canvases');
        if (offlineCanvases) {
            const list = JSON.parse(offlineCanvases);
            const found = list.find((c: any) => c.id === id);
            const target = list.find((c: any) => c.id === targetId);
            if (found && target) {
                const newParentId = position === 'inside' ? targetId : target.parentId;
                
                // Prevent circular references
                const isDescendantOffline = (parent: string, child: string): boolean => {
                    let current = list.find((c: any) => c.id === parent);
                    while (current && current.parentId) {
                        if (current.parentId === child) return true;
                        current = list.find((c: any) => c.id === current.parentId);
                    }
                    return false;
                };

                if (newParentId === id || (newParentId && isDescendantOffline(newParentId, id))) {
                    console.warn("Prevented circular reference move in offline mode.");
                    return;
                }

                found.parentId = newParentId;
                found.updatedAt = Date.now();
                localStorage.setItem('axe_offline_canvases', JSON.stringify(list));
            }
        }
        return;
    }

    const cleanId = sanitizeUUID(id);
    const cleanTargetId = sanitizeUUID(targetId);
    if (!cleanId || !cleanTargetId) return;

    try {
        let newParentId: string | null = null;
        if (position === 'inside') {
            newParentId = cleanTargetId;
        } else {
            // Find parentId from local cache if possible or fallback to check
            const cachedStr = localStorage.getItem(`axe_online_backup_nodes_${workspaceId}`);
            if (cachedStr) {
                const list = JSON.parse(cachedStr);
                const targetNode = list.find((n: any) => n.id === cleanTargetId);
                if (targetNode) {
                    newParentId = targetNode.parentId;
                }
            }
        }

        const updates = { parentId: newParentId };
        updateLocalCachedNodes(cleanId, 'update', updates);

        // Queue sync update
        addToSyncQueue('node', 'update', cleanId, updates);
    } catch (err) {
        console.error('Error moving canvas', err);
    }
}


export async function duplicateCanvas(id: string, workspaceId: string, ownerId: string): Promise<CanvasInfo | null> {
    if (getStorageMode() === 'offline') {
        const offlineCanvases = localStorage.getItem('axe_offline_canvases');
        const list = offlineCanvases ? JSON.parse(offlineCanvases) : [];
        const original = list.find((c: any) => c.id === id);
        if (!original) return null;
        
        const newId = crypto.randomUUID();
        const origDataStr = localStorage.getItem(`axe_offline_canvas_data_${id}`);
        const origData = origDataStr ? JSON.parse(origDataStr) : { nodes: [], viewport: { x: 0, y: 0, zoom: 1 } };
        
        const newCanvas: any = {
            ...original,
            id: newId,
            title: `${original.name} (cópia)`,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        
        list.push(newCanvas);
        localStorage.setItem('axe_offline_canvases', JSON.stringify(list));
        localStorage.setItem(`axe_offline_canvas_data_${newId}`, JSON.stringify(origData));
        
        return {
            id: newCanvas.id,
            name: newCanvas.title || '',
            title: newCanvas.title,
            createdAt: newCanvas.createdAt,
            updatedAt: newCanvas.updatedAt,
            parentId: newCanvas.parentId,
            type: newCanvas.type as any
        };
    }

    const cleanId = sanitizeUUID(id);
    if (!cleanId) return null;
    try {
        const { data: original } = await supabase.from('nodes').select('*').eq('id', cleanId).single();
        if (!original) return null;
        
        const newId = crypto.randomUUID();
        const { data: newCanvas, error } = await supabase.from('nodes').insert([{
            ...original,
            id: newId,
            workspace_id: sanitizeUUID(workspaceId) || original.workspace_id,
            owner_id: sanitizeUUID(ownerId) || original.owner_id,
            title: `${original.name} (cópia)`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }]).select().single();
        
        if (error) throw error;
        
        return {
            id: newCanvas.id,
            name: newCanvas.title || '',
            title: newCanvas.title,
            createdAt: new Date(newCanvas.created_at).getTime(),
            updatedAt: new Date(newCanvas.updated_at).getTime(),
            parentId: newCanvas.parent_id,
            type: newCanvas.type as any
        };
    } catch (err) {
        console.error('Error duplicating canvas', err);
        return null;
    }
}

// In-memory cache for canvas data to allow instantaneous loading (SWR)
const canvasDataCache: Record<string, CanvasData> = {};

export function getCachedCanvasData(id: string): CanvasData | null {
    return canvasDataCache[id] || null;
}

export async function getCanvasData(id: string): Promise<CanvasData | null> {
    // 1. Check in-memory cache first (fastest)
    if (canvasDataCache[id]) {
        return canvasDataCache[id];
    }

    // 2. Always try localStorage as primary local cache (works offline and is instant)
    const localKey = `axe_offline_canvas_data_${id}`;
    const localData = localStorage.getItem(localKey);
    if (localData) {
        try {
            const parsed = JSON.parse(localData) as CanvasData;
            canvasDataCache[id] = parsed;
            return parsed;
        } catch (parseErr) {
            console.warn('[canvasStorage] Failed to parse localStorage canvas data:', parseErr);
        }
    }

    // 3. Try online backup key as secondary local fallback
    const backupKey = `axe_online_backup_canvas_data_${id}`;
    const backupData = localStorage.getItem(backupKey);
    if (backupData) {
        try {
            const parsed = JSON.parse(backupData) as CanvasData;
            canvasDataCache[id] = parsed;
            // Migrate to primary key
            localStorage.setItem(localKey, backupData);
            return parsed;
        } catch (parseErr) {
            console.warn('[canvasStorage] Failed to parse backup canvas data:', parseErr);
        }
    }

    // 4. If mode is offline and no local data, return empty default
    if (getStorageMode() === 'offline') {
        const defaultData: CanvasData = { nodes: [], viewport: { x: 0, y: 0, zoom: 1 } };
        canvasDataCache[id] = defaultData;
        return defaultData;
    }

    // 5. Try Supabase (online mode)
    const cleanId = sanitizeUUID(id);
    if (!cleanId) return { nodes: [], viewport: { x: 0, y: 0, zoom: 1 } };
    try {
        const { data, error } = await supabase.from('nodes').select('content_data').eq('id', cleanId).single();
        if (error) throw error;
        
        if (data && data.content_data) {
            const canvasData = data.content_data as CanvasData;
            canvasDataCache[id] = canvasData;
            // Persist locally for next time
            try { localStorage.setItem(localKey, JSON.stringify(canvasData)); } catch (_) {}
            try { localStorage.setItem(backupKey, JSON.stringify(canvasData)); } catch (_) {}
            return canvasData;
        }
        const defaultData: CanvasData = { nodes: [], viewport: { x: 0, y: 0, zoom: 1 } };
        canvasDataCache[id] = defaultData;
        return defaultData;
    } catch (err) {
        console.error('[canvasStorage] Error fetching canvas data from Supabase:', err);
        return null;
    }
}

export async function saveCanvasData(id: string, data: CanvasData, expectedRevision?: number): Promise<void> {
    // DATA-001: Leitura de revisão atômica e detecção de conflitos antes da gravação
    const localKey = `axe_offline_canvas_data_${id}`;
    let currentRevision = 0;

    try {
        const existingStr = localStorage.getItem(localKey);
        if (existingStr) {
            const existingParsed = JSON.parse(existingStr);
            if (existingParsed && typeof existingParsed.revision === 'number') {
                currentRevision = existingParsed.revision;
                // Detecção de conflito: se a revisão armazenada for maior que a esperada pelo escritor
                if (expectedRevision !== undefined && existingParsed.revision > expectedRevision) {
                    console.warn(`[canvasStorage] CONFLITO DETECTADO no canvas ${id}: versão armazenada (rev ${existingParsed.revision}) é superior à versão esperada (rev ${expectedRevision}). Resolvendo com incrementação segura.`);
                }
            }
        }
    } catch (_) {}

    const newRevision = Math.max(currentRevision, expectedRevision || 0) + 1;
    const nowIso = new Date().toISOString();
    const versionedPayload = {
        revision: newRevision,
        updatedAt: nowIso,
        updatedBy: 'local_user',
        data: data,
        // Preserva retrocompatibilidade com propriedades diretas de CanvasData
        nodes: data.nodes || [],
        viewport: data.viewport || { x: 0, y: 0, zoom: 1 },
        strokes: data.strokes || [],
        connections: data.connections || []
    };

    // 1. Atualizar o cache em memória
    canvasDataCache[id] = versionedPayload as any;

    // 2. Persistir com controle de versão
    try {
        localStorage.setItem(localKey, JSON.stringify(versionedPayload));
        
        // Atualiza os metadados do índice offline
        const offlineCanvases = localStorage.getItem('axe_offline_canvases');
        if (offlineCanvases) {
            const list = JSON.parse(offlineCanvases);
            const found = list.find((c: any) => c.id === id);
            if (found) {
                found.updatedAt = Date.now();
                found.revision = newRevision;
                localStorage.setItem('axe_offline_canvases', JSON.stringify(list));
            }
        }
    } catch (storageErr) {
        console.warn('[canvasStorage] localStorage write failed:', storageErr);
    }

    // 3. Fila de sincronização remota com payload versionado
    const cleanId = sanitizeUUID(id);
    if (cleanId) {
        try {
            localStorage.setItem(`axe_online_backup_canvas_data_${cleanId}`, JSON.stringify(versionedPayload));
        } catch (_) {}
        updateLocalCachedNodes(cleanId, 'update', { updatedAt: Date.now(), revision: newRevision });
        addToSyncQueue('canvas', 'update', cleanId, versionedPayload);
    }
}

// ── Debounced Save ──
const saveTimers: Record<string, ReturnType<typeof setTimeout>> = {};

export function debouncedSaveCanvasData(id: string, data: CanvasData, delay = 500): void {
    if (saveTimers[id]) {
        clearTimeout(saveTimers[id]);
    }
    // Store the pending data so it can be flushed
    pendingSaveData[id] = data;
    saveTimers[id] = setTimeout(() => {
        saveCanvasData(id, data);
        delete saveTimers[id];
        delete pendingSaveData[id];
    }, delay);
}

const pendingSaveData: Record<string, CanvasData> = {};

export function flushPendingSave(id: string): void {
    if (saveTimers[id]) {
        clearTimeout(saveTimers[id]);
        delete saveTimers[id];
    }
    if (pendingSaveData[id]) {
        saveCanvasData(id, pendingSaveData[id]);
        delete pendingSaveData[id];
    }
}

// Vault methods are disabled/placeholder for now since we use Supabase
export function exportBackupData(): string { return ''; }
export function importBackupData(jsonString: string): boolean { return false; }
export function exportCanvas(id: string): { name: string; content: string } | null { return null; }
export function importCanvas(jsonString: string): CanvasInfo | null { return null; }
