import { supabase } from '../../lib/supabase';
import { CanvasInfo, CanvasData, CanvasNode, Stroke, CanvasConnection, BrowserTab } from './canvasTypes';

export * from './canvasTypes';

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

// ── List Operations ──

export async function getCanvasList(workspaceId: string): Promise<CanvasInfo[]> {
    const cleanWorkspaceId = sanitizeUUID(workspaceId);
    if (!cleanWorkspaceId) return [];
    try {
        const { data, error } = await supabase
            .from('canvases')
            .select('*')
            .eq('workspace_id', cleanWorkspaceId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        
        return (data || []).map(row => ({
            id: row.id,
            name: row.name,
            createdAt: new Date(row.created_at).getTime(),
            updatedAt: new Date(row.updated_at).getTime(),
            parentId: row.parent_id,
            type: row.type as any,
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
    } catch (err) {
        console.error('Error fetching canvases', err);
        return [];
    }
}

export async function createCanvas(workspaceId: string, ownerId: string, name: string, parentId?: string, type: 'canvas'|'page'|'card'|'table'|'folder'|'space' = 'canvas', forceId?: string): Promise<CanvasInfo> {
    const cleanForceId = sanitizeUUID(forceId);
    const id = cleanForceId || crypto.randomUUID();
    const emptyData: CanvasData = { nodes: [], viewport: { x: 0, y: 0, zoom: 1 } };
    
    try {
        const { data, error } = await supabase.from('canvases').insert([{
            id,
            workspace_id: sanitizeUUID(workspaceId),
            owner_id: sanitizeUUID(ownerId),
            parent_id: sanitizeUUID(parentId),
            name,
            type,
            data: emptyData
        }]).select().single();
        if (error) throw error;
        
        return {
            id: data.id,
            name: data.name,
            createdAt: new Date(data.created_at).getTime(),
            updatedAt: new Date(data.updated_at).getTime(),
            parentId: data.parent_id,
            type: data.type as any
        };
    } catch (err) {
        console.error('Error creating canvas', err);
        throw err;
    }
}

export async function createFolder(workspaceId: string, ownerId: string, name: string, parentId?: string): Promise<CanvasInfo> {
    return createCanvas(workspaceId, ownerId, name, parentId, 'folder');
}

export async function deleteCanvas(id: string): Promise<void> {
    const cleanId = sanitizeUUID(id);
    if (!cleanId) return;
    try {
        await supabase.from('canvases').delete().eq('id', cleanId);
    } catch (err) {
        console.error('Error deleting canvas', err);
    }
}

export async function softDeleteCanvas(id: string): Promise<void> {
    const cleanId = sanitizeUUID(id);
    if (!cleanId) return;
    try {
        await supabase.from('canvases').update({
            is_deleted: true,
            deleted_at: new Date().toISOString()
        }).eq('id', cleanId);
    } catch (err) {
        console.error('Error soft deleting canvas', err);
    }
}

export async function restoreCanvas(id: string): Promise<void> {
    const cleanId = sanitizeUUID(id);
    if (!cleanId) return;
    try {
        await supabase.from('canvases').update({
            is_deleted: false,
            deleted_at: null
        }).eq('id', cleanId);
    } catch (err) {
        console.error('Error restoring canvas', err);
    }
}

export async function renameCanvas(id: string, name: string): Promise<void> {
    const cleanId = sanitizeUUID(id);
    if (!cleanId) return;
    try {
        await supabase.from('canvases').update({
            name,
            updated_at: new Date().toISOString()
        }).eq('id', cleanId);
    } catch (err) {
        console.error('Error renaming canvas', err);
    }
}

export async function updateCanvasInfo(id: string, updates: Partial<CanvasInfo>): Promise<void> {
    const cleanId = sanitizeUUID(id);
    if (!cleanId) return;
    try {
        const dbUpdates: any = { updated_at: new Date().toISOString() };
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.color !== undefined) dbUpdates.color = updates.color;
        if (updates.isFavorite !== undefined) dbUpdates.is_favorite = updates.isFavorite;
        if (updates.coverImage !== undefined) dbUpdates.cover_image = updates.coverImage;
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
        if (updates.properties !== undefined) dbUpdates.properties = updates.properties;
        if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
        if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

        await supabase.from('canvases').update(dbUpdates).eq('id', cleanId);
    } catch (err) {
        console.error('Error updating canvas info', err);
    }
}

export async function moveCanvasItem(id: string, targetId: string, position: 'before' | 'after' | 'inside', workspaceId: string): Promise<void> {
    const cleanId = sanitizeUUID(id);
    const cleanTargetId = sanitizeUUID(targetId);
    if (!cleanId || !cleanTargetId) return;
    try {
        let newParentId: string | null = null;
        
        if (position === 'inside') {
            newParentId = cleanTargetId;
        } else {
            const { data: targetData } = await supabase.from('canvases').select('parent_id').eq('id', cleanTargetId).single();
            if (targetData) {
                newParentId = targetData.parent_id;
            }
        }
        
        await supabase.from('canvases').update({
            parent_id: newParentId,
            updated_at: new Date().toISOString()
        }).eq('id', cleanId);
        
    } catch (err) {
        console.error('Error moving canvas', err);
    }
}

export async function duplicateCanvas(id: string, workspaceId: string, ownerId: string): Promise<CanvasInfo | null> {
    const cleanId = sanitizeUUID(id);
    if (!cleanId) return null;
    try {
        const { data: original } = await supabase.from('canvases').select('*').eq('id', cleanId).single();
        if (!original) return null;
        
        const newId = crypto.randomUUID();
        const { data: newCanvas, error } = await supabase.from('canvases').insert([{
            ...original,
            id: newId,
            workspace_id: sanitizeUUID(workspaceId) || original.workspace_id,
            owner_id: sanitizeUUID(ownerId) || original.owner_id,
            name: `${original.name} (cópia)`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }]).select().single();
        
        if (error) throw error;
        
        return {
            id: newCanvas.id,
            name: newCanvas.name,
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

// ── Canvas Data Operations ──

export async function getCanvasData(id: string): Promise<CanvasData | null> {
    const cleanId = sanitizeUUID(id);
    if (!cleanId) return { nodes: [], viewport: { x: 0, y: 0, zoom: 1 } };
    try {
        const { data, error } = await supabase.from('canvases').select('data').eq('id', cleanId).single();
        if (error) throw error;
        
        if (data && data.data) {
            return data.data as CanvasData;
        }
        return { nodes: [], viewport: { x: 0, y: 0, zoom: 1 } };
    } catch (err) {
        console.error('Error fetching canvas data', err);
        return null;
    }
}

export async function saveCanvasData(id: string, data: CanvasData): Promise<void> {
    const cleanId = sanitizeUUID(id);
    if (!cleanId) return;
    try {
        await supabase.from('canvases').update({
            data,
            updated_at: new Date().toISOString()
        }).eq('id', cleanId);
    } catch (err) {
        console.error('Error saving canvas data', err);
    }
}

// ── Debounced Save ──
const saveTimers: Record<string, ReturnType<typeof setTimeout>> = {};

export function debouncedSaveCanvasData(id: string, data: CanvasData, delay = 500): void {
    if (saveTimers[id]) {
        clearTimeout(saveTimers[id]);
    }
    saveTimers[id] = setTimeout(() => {
        saveCanvasData(id, data);
        delete saveTimers[id];
    }, delay);
}

// Vault methods are disabled/placeholder for now since we use Supabase
export function exportBackupData(): string { return ''; }
export function importBackupData(jsonString: string): boolean { return false; }
export function exportCanvas(id: string): { name: string; content: string } | null { return null; }
export function importCanvas(jsonString: string): CanvasInfo | null { return null; }
