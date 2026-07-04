import { supabase } from './supabase';

export interface SyncItem {
    id: string; // Unique id for the queue item
    type: 'canvas' | 'crm_group' | 'crm_card' | 'task' | 'task_space' | 'node';
    action: 'insert' | 'update' | 'remove';
    recordId: string;
    payload: any;
    timestamp: number;
}

const QUEUE_KEY = 'axe_sync_queue';
let isSyncing = false;

// Helpers to get and set queue
export function getSyncQueue(): SyncItem[] {
    try {
        const raw = localStorage.getItem(QUEUE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export function saveSyncQueue(queue: SyncItem[]) {
    try {
        localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
        console.error('Failed to save sync queue', e);
    }
}

// Add an item to the sync queue
export function addToSyncQueue(
    type: SyncItem['type'],
    action: SyncItem['action'],
    recordId: string,
    payload: any
) {
    const queue = getSyncQueue();
    
    // De-duplicate updates if possible to reduce redundant network calls
    if (action === 'update') {
        const existingIndex = queue.findIndex(
            (item) => item.type === type && item.action === 'update' && item.recordId === recordId
        );
        if (existingIndex !== -1) {
            queue[existingIndex].payload = { ...queue[existingIndex].payload, ...payload };
            queue[existingIndex].timestamp = Date.now();
            saveSyncQueue(queue);
            triggerSync();
            return;
        }
    }

    const newItem: SyncItem = {
        id: crypto.randomUUID(),
        type,
        action,
        recordId,
        payload,
        timestamp: Date.now(),
    };

    queue.push(newItem);
    saveSyncQueue(queue);
    triggerSync();
}

// Run the sync process
export async function triggerSync() {
    if (isSyncing) return;
    if (!navigator.onLine) {
        console.log('[SyncManager] Browser is offline. Sync scheduled for later.');
        return;
    }

    const queue = getSyncQueue();
    if (queue.length === 0) return;

    isSyncing = true;
    console.log(`[SyncManager] Starting sync of ${queue.length} items...`);

    const failedItems: SyncItem[] = [];

    for (const item of queue) {
        try {
            const success = await processSyncItem(item);
            if (!success) {
                failedItems.push(item);
                // If a connection issue happens mid-sync, stop processing further items
                break;
            }
        } catch (err) {
            console.error('[SyncManager] Error processing sync item:', item, err);
            failedItems.push(item);
            break;
        }
    }

    // Keep the failed items (and any unprocessed ones) in the queue
    const remainingQueue = getSyncQueue();
    const processedIds = new Set(queue.filter(q => !failedItems.includes(q)).map(q => q.id));
    const filteredQueue = remainingQueue.filter(item => !processedIds.has(item.id));
    
    saveSyncQueue(filteredQueue);
    isSyncing = false;

    if (filteredQueue.length > 0) {
        console.log(`[SyncManager] Sync cycle finished. ${filteredQueue.length} items remain in queue.`);
    } else {
        console.log('[SyncManager] Sync completed successfully. All items synced!');
    }
}

// Process an individual sync item by hitting Supabase
async function processSyncItem(item: SyncItem): Promise<boolean> {
    const { type, action, recordId, payload } = item;

    try {
        if (type === 'canvas') {
            const { error } = await supabase.from('nodes').update({
                content_data: payload,
                updated_at: new Date().toISOString()
            }).eq('id', recordId);
            if (error) throw error;
        } 
        else if (type === 'crm_group') {
            if (action === 'insert') {
                const { error } = await supabase.from('crm_groups').insert([{
                    id: payload.id,
                    board_node_id: payload.boardId,
                    title: payload.title,
                    color: payload.color,
                    order_index: payload.order
                }]);
                if (error) throw error;
            } else if (action === 'update') {
                const { error } = await supabase.from('crm_groups').update({
                    title: payload.title,
                    color: payload.color,
                    order_index: payload.order
                }).eq('id', recordId);
                if (error) throw error;
            } else if (action === 'remove') {
                const { error } = await supabase.from('crm_groups').delete().eq('id', recordId);
                if (error) throw error;
            }
        } 
        else if (type === 'crm_card') {
            if (action === 'insert') {
                const custom_fields = {
                    priority: payload.priority,
                    deadline: payload.deadline,
                    budget: payload.budget,
                    notes: payload.notes,
                    assignee: payload.assignee,
                    updates: payload.updates,
                    tags: payload.tags,
                    timeSpent: payload.timeSpent,
                    profileId: payload.profileId,
                    subtasks: payload.subtasks,
                    orderIndex: payload.orderIndex || 0
                };
                const contact_info = {
                    company: payload.company,
                    contact: payload.contact
                };
                const { error } = await supabase.from('crm_cards').insert([{
                    id: payload.id,
                    board_node_id: payload.boardId,
                    group_id: payload.groupId === 'unassigned' ? null : payload.groupId,
                    title: payload.title,
                    description: payload.description,
                    status: payload.status,
                    value: payload.value,
                    contact_info,
                    custom_fields,
                    created_at: new Date(payload.createdAt).toISOString(),
                    updated_at: new Date(payload.updatedAt).toISOString()
                }]);
                if (error) throw error;
            } else if (action === 'update') {
                const custom_fields = {
                    priority: payload.priority,
                    deadline: payload.deadline,
                    budget: payload.budget,
                    notes: payload.notes,
                    assignee: payload.assignee,
                    updates: payload.updates,
                    tags: payload.tags,
                    timeSpent: payload.timeSpent,
                    profileId: payload.profileId,
                    subtasks: payload.subtasks,
                    orderIndex: payload.orderIndex || 0
                };
                const contact_info = {
                    company: payload.company,
                    contact: payload.contact
                };
                const { error } = await supabase.from('crm_cards').update({
                    group_id: payload.groupId === 'unassigned' ? null : payload.groupId,
                    title: payload.title,
                    description: payload.description,
                    status: payload.status,
                    value: payload.value,
                    contact_info,
                    custom_fields,
                    updated_at: new Date(payload.updatedAt).toISOString()
                }).eq('id', recordId);
                if (error) throw error;
            } else if (action === 'remove') {
                const { error } = await supabase.from('crm_cards').delete().eq('id', recordId);
                if (error) throw error;
            }
        } 
        else if (type === 'task') {
            if (action === 'insert') {
                const { error } = await supabase.from('tasks').insert([{
                    id: payload.id,
                    title: payload.title,
                    description: payload.description,
                    status: payload.status,
                    priority: payload.priority,
                    node_id: payload.spaceId === 'default' ? null : payload.spaceId,
                    time_spent_seconds: payload.timeSpent,
                    tags: payload.tags,
                    created_at: new Date(payload.createdAt).toISOString(),
                    updated_at: new Date(payload.updatedAt).toISOString(),
                    workspace_id: payload.workspaceId,
                    metadata: { 
                        date: payload.date, 
                        endDate: payload.endDate, 
                        startTime: payload.startTime, 
                        endTime: payload.endTime, 
                        crmContactId: payload.crmContactId, 
                        googleEventId: payload.googleEventId, 
                        linkedCanvasIds: payload.linkedCanvasIds, 
                        customFields: payload.customFields, 
                        comments: payload.comments, 
                        recurringRule: payload.recurringRule 
                    }
                }]);
                if (error) throw error;
            } else if (action === 'update') {
                const { error } = await supabase.from('tasks').update({
                    title: payload.title,
                    description: payload.description,
                    status: payload.status,
                    priority: payload.priority,
                    node_id: payload.spaceId === 'default' ? null : payload.spaceId,
                    time_spent_seconds: payload.timeSpent,
                    tags: payload.tags,
                    updated_at: new Date(payload.updatedAt).toISOString(),
                    workspace_id: payload.workspaceId,
                    metadata: { 
                        date: payload.date, 
                        endDate: payload.endDate, 
                        startTime: payload.startTime, 
                        endTime: payload.endTime, 
                        crmContactId: payload.crmContactId, 
                        googleEventId: payload.googleEventId, 
                        linkedCanvasIds: payload.linkedCanvasIds, 
                        customFields: payload.customFields, 
                        comments: payload.comments, 
                        recurringRule: payload.recurringRule 
                    }
                }).eq('id', recordId);
                if (error) throw error;
            } else if (action === 'remove') {
                const { error } = await supabase.from('tasks').delete().eq('id', recordId);
                if (error) throw error;
            }
        } 
        else if (type === 'task_space') {
            if (action === 'insert') {
                const { error } = await supabase.from('nodes').insert([{ 
                    id: payload.id, 
                    title: payload.title, 
                    color: payload.color, 
                    icon: payload.icon, 
                    type: 'task_board', 
                    created_at: new Date(payload.createdAt).toISOString(), 
                    workspace_id: payload.workspaceId
                }]);
                if (error) throw error;
            } else if (action === 'update') {
                const { error } = await supabase.from('nodes').update({
                    title: payload.title,
                    color: payload.color,
                    icon: payload.icon
                }).eq('id', recordId);
                if (error) throw error;
            } else if (action === 'remove') {
                const { error } = await supabase.from('nodes').delete().eq('id', recordId);
                if (error) throw error;
            }
        } 
        else if (type === 'node') {
            if (action === 'insert') {
                const { error } = await supabase.from('nodes').insert([{
                    id: payload.id,
                    workspace_id: payload.workspaceId,
                    owner_id: payload.ownerId,
                    parent_id: payload.parentId,
                    title: payload.title,
                    type: payload.type,
                    properties: payload.properties,
                    content_data: payload.content_data,
                    is_favorite: payload.isFavorite,
                    is_deleted: payload.isDeleted,
                    deleted_at: payload.deletedAt ? new Date(payload.deletedAt).toISOString() : null,
                    created_at: payload.createdAt ? new Date(payload.createdAt).toISOString() : new Date().toISOString(),
                    updated_at: payload.updatedAt ? new Date(payload.updatedAt).toISOString() : new Date().toISOString()
                }]);
                if (error) throw error;
            } else if (action === 'update') {
                const dbUpdates: any = { updated_at: new Date().toISOString() };
                if (payload.name !== undefined) dbUpdates.title = payload.name;
                if (payload.title !== undefined) dbUpdates.title = payload.title;
                if (payload.color !== undefined) dbUpdates.color = payload.color;
                if (payload.isFavorite !== undefined) dbUpdates.is_favorite = payload.isFavorite;
                if (payload.coverImage !== undefined) dbUpdates.cover_image = payload.coverImage;
                if (payload.description !== undefined) dbUpdates.description = payload.description;
                if (payload.icon !== undefined) dbUpdates.icon = payload.icon;
                if (payload.properties !== undefined) dbUpdates.properties = payload.properties;
                if (payload.tags !== undefined) dbUpdates.tags = payload.tags;
                if (payload.notes !== undefined) dbUpdates.notes = payload.notes;
                if (payload.parentId !== undefined) dbUpdates.parent_id = payload.parentId;
                if (payload.isDeleted !== undefined) {
                    dbUpdates.is_deleted = payload.isDeleted;
                    dbUpdates.deleted_at = payload.deletedAt ? new Date(payload.deletedAt).toISOString() : (payload.isDeleted ? new Date().toISOString() : null);
                }
                
                const { error } = await supabase.from('nodes').update(dbUpdates).eq('id', recordId);
                if (error) throw error;
            } else if (action === 'remove') {
                const { error } = await supabase.from('nodes').delete().eq('id', recordId);
                if (error) throw error;
            }
        }

        return true;
    } catch (err: any) {
        console.error(`[SyncManager] Process error for type ${type}, action ${action}, record ${recordId}:`, err);
        
        // Se for um erro de constraint permanente do banco de dados (ex: formato de UUID inválido '22P02',
        // violação de chave estrangeira '23503', violação de restrição não nula '23502', etc.), 
        // descartamos o item (retorna true) para evitar o congelamento eterno de toda a fila de sincronização.
        const dbErrorCodes = ['22P02', '23502', '23503', '23505', '42703', '42P01'];
        if (err && err.code && dbErrorCodes.includes(err.code)) {
            console.warn(`[SyncManager] Discarding invalid sync item due to permanent Postgres database error (${err.code}):`, err.message || err);
            return true;
        }

        return false;
    }
}

// Global Event Listeners to run Sync when coming back online
if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        console.log('[SyncManager] Network status changed to ONLINE. Syncing queue...');
        triggerSync();
    });

    // Start a periodic checker every 60 seconds
    setInterval(() => {
        if (navigator.onLine && getSyncQueue().length > 0) {
            console.log('[SyncManager] Periodic trigger: syncing queue...');
            triggerSync();
        }
    }, 60000);

    // Initial trigger on script load
    setTimeout(() => {
        triggerSync();
    }, 2000);
}
