import { v4 as uuidv4 } from 'uuid';
import { addDays, addWeeks, addMonths, addYears } from 'date-fns';

import { supabase } from '../../../lib/supabase';
import { addToSyncQueue } from '../../../lib/syncManager';

// Helper for pushing to Supabase
async function pushTaskSpaceToSupabase(space: TaskSpace, action: 'insert' | 'update' | 'remove', workspaceId?: string) {
    if (getStorageMode() === 'offline') return;
    
    // Try online synchronous execution first
    if (navigator.onLine) {
        try {
            let error = null;
            if (action === 'insert') {
                const res = await supabase.from('nodes').insert([{ 
                    id: space.id, title: space.title, color: space.color, icon: space.icon, type: 'task_board', created_at: new Date(space.createdAt).toISOString(), workspace_id: workspaceId
                }]);
                error = res.error;
            } else if (action === 'update') {
                const res = await supabase.from('nodes').update({
                    title: space.title, color: space.color, icon: space.icon
                }).eq('id', space.id);
                error = res.error;
            } else if (action === 'remove') {
                const res = await supabase.from('nodes').delete().eq('id', space.id);
                error = res.error;
            }
            if (!error) return; // Success
        } catch (e) {
            console.warn('[tasksStorage] Online space sync failed, falling back to sync queue', e);
        }
    }

    // Create sync payload (offline fallback)
    const payload = {
        id: space.id,
        title: space.title,
        color: space.color,
        icon: space.icon,
        createdAt: space.createdAt,
        workspaceId
    };
    
    addToSyncQueue('task_space', action, space.id, payload);
}

async function pushTaskToSupabase(task: TaskData, action: 'insert' | 'update' | 'remove', workspaceId?: string) {
    if (getStorageMode() === 'offline') return;
    
    const taskPayload = { ...task, workspaceId };
    if (action === 'insert' || action === 'update') {
        taskPayload.customFields = {
            ...task.customFields,
            type: task.type || task.customFields?.type || 'task',
            guests: task.guests || task.customFields?.guests || []
        };
    }

    // Try online synchronous execution first
    if (navigator.onLine) {
        try {
            let error = null;
            if (action === 'insert') {
                const res = await supabase.from('tasks').insert([{
                    id: task.id, title: task.title, description: task.description, status: task.status, priority: task.priority,
                    node_id: task.spaceId === 'default' ? null : task.spaceId, time_spent_seconds: task.timeSpent,
                    tags: task.tags, created_at: new Date(task.createdAt).toISOString(),
                    updated_at: new Date(task.updatedAt).toISOString(),
                    workspace_id: workspaceId,
                    metadata: { date: task.date, endDate: task.endDate, startTime: task.startTime, endTime: task.endTime, crmContactId: task.crmContactId, googleEventId: task.googleEventId, linkedCanvasIds: task.linkedCanvasIds, customFields: taskPayload.customFields, comments: task.comments, recurringRule: task.recurringRule }
                }]);
                error = res.error;
            } else if (action === 'update') {
                const res = await supabase.from('tasks').update({
                    title: task.title, description: task.description, status: task.status, priority: task.priority,
                    node_id: task.spaceId === 'default' ? null : task.spaceId, time_spent_seconds: task.timeSpent,
                    tags: task.tags, updated_at: new Date(task.updatedAt).toISOString(),
                    workspace_id: workspaceId,
                    metadata: { date: task.date, endDate: task.endDate, startTime: task.startTime, endTime: task.endTime, crmContactId: task.crmContactId, googleEventId: task.googleEventId, linkedCanvasIds: task.linkedCanvasIds, customFields: taskPayload.customFields, comments: task.comments, recurringRule: task.recurringRule }
                }).eq('id', task.id);
                error = res.error;
            } else if (action === 'remove') {
                const res = await supabase.from('tasks').delete().eq('id', task.id);
                error = res.error;
            }
            if (!error) return; // Success
        } catch (e) {
            console.warn('[tasksStorage] Online task sync failed, falling back to sync queue', e);
        }
    }
    
    addToSyncQueue('task', action, task.id, taskPayload);
}



function getStorageMode(): 'online' | 'offline' {
    return 'offline';
}

const getStorageKeys = (workspaceId?: string) => {
    const mode = getStorageMode();
    const wsSuffix = workspaceId ? `_${workspaceId}` : '_default-workspace';
    if (mode === 'offline') {
        return {
            tasks: `axe_offline_tasks_data_v2${wsSuffix}`,
            spaces: `axe_offline_tasks_spaces_v1${wsSuffix}`
        };
    } else {
        return {
            tasks: `axe_tasks_data_v2${wsSuffix}`,
            spaces: `axe_tasks_spaces_v1${wsSuffix}`
        };
    }
};

export type TaskStatus = 'todo' | 'in-progress' | 'in-review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';
export type RecurringRule = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface TaskComment {
    id: string;
    author: string;
    content: string;
    createdAt: number;
}

export interface Subtask {
    id: string;
    title: string;
    completed: boolean;
}

export interface TaskSpace {
    id: string;
    title: string;
    color: string;
    icon: string;
    createdAt: number;
}

export interface TaskData {
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    subtasks?: Subtask[];
    
    // Date & Time logic for Calendar
    date: number | null; // UNIX timestamp for the day
    endDate?: number | null; // UNIX timestamp for the end day
    startTime: string | null; // "HH:MM"
    endTime: string | null; // "HH:MM"
    
    // Integration & Pomodoro
    crmContactId: string | null;
    spaceId: string | null;
    timeSpent: number; // in seconds
    comments: TaskComment[];
    googleEventId: string | null;
    
    // New Advanced Features
    linkedCanvasIds: string[];
    customFields: Record<string, any>;
    tags?: string[]; // Array of categories/tags
    recurringRule?: RecurringRule;
    
    // Calendar enhancements
    type?: 'task' | 'event';
    guests?: string[];
    
    createdAt: number;
    updatedAt: number;
}

// Tasks LocalStorage Keys
const STORAGE_KEY = 'axe_tasks_data_v2';
const SPACES_KEY = 'axe_tasks_spaces_v1';
const PINNED_TASK_KEY = 'axe_pinned_task_id';

export const getTasksSpaces = (workspaceId?: string): TaskSpace[] => {
    try {
        const data = localStorage.getItem(getStorageKeys(workspaceId).spaces);
        if (data) {
            return JSON.parse(data);
        }
    } catch (e) {}
    // Retornar um espaço padrão se não houver
    return [{ id: 'default', title: 'Geral', color: '#8b5cf6', icon: 'List', createdAt: Date.now() }];
};

export const saveTasksSpaces = (spaces: TaskSpace[], workspaceId?: string) => {
    localStorage.setItem(getStorageKeys(workspaceId).spaces, JSON.stringify(spaces));
};

export const createSpace = (title: string, color: string = '#8b5cf6', workspaceId?: string): TaskSpace => {
    const spaces = getTasksSpaces(workspaceId);
    const newSpace: TaskSpace = {
        id: uuidv4(),
        title,
        color,
        icon: 'Folder',
        createdAt: Date.now()
    };
    spaces.push(newSpace);
    saveTasksSpaces(spaces, workspaceId);
    pushTaskSpaceToSupabase(newSpace, 'insert', workspaceId);
    return newSpace;
};

export const updateSpace = (id: string, updates: Partial<TaskSpace>, workspaceId?: string) => {
    const spaces = getTasksSpaces(workspaceId);
    const index = spaces.findIndex(s => s.id === id);
    if (index !== -1) {
        spaces[index] = { ...spaces[index], ...updates };
        saveTasksSpaces(spaces, workspaceId);
        pushTaskSpaceToSupabase(spaces[index], 'update', workspaceId);
    }
};

export const deleteSpace = (id: string, workspaceId?: string) => {
    const spaces = getTasksSpaces(workspaceId);
    saveTasksSpaces(spaces.filter(s => s.id !== id), workspaceId);
    const tasks = getTasksData(workspaceId);
    saveTasksData(tasks.filter(t => t.spaceId !== id), workspaceId);
    pushTaskSpaceToSupabase({id} as TaskSpace, 'remove', workspaceId);
};

export const getPinnedTaskId = (): string | null => {
    try {
        return localStorage.getItem(PINNED_TASK_KEY);
    } catch {
        return null;
    }
};

export const setPinnedTaskId = (taskId: string | null) => {
    try {
        if (taskId) {
            localStorage.setItem(PINNED_TASK_KEY, taskId);
        } else {
            localStorage.removeItem(PINNED_TASK_KEY);
        }
        window.dispatchEvent(new Event('pinnedTaskChanged'));
    } catch (e) {
        console.error('Failed to set pinned task', e);
    }
};

export const getTasksData = (workspaceId?: string): TaskData[] => {
    try {
        const data = localStorage.getItem(getStorageKeys(workspaceId).tasks);
        if (data) {
            return JSON.parse(data);
        }
    } catch (e) {
        console.error('Error reading tasks data', e);
    }
    return [];
};

export const saveTasksData = (tasks: TaskData[], workspaceId?: string) => {
    try {
        localStorage.setItem(getStorageKeys(workspaceId).tasks, JSON.stringify(tasks));
    } catch (e) {
        console.error('Error saving tasks data', e);
    }
};

export const createTask = (
    title: string, 
    spaceId: string | null = null, 
    date: number | null = null, 
    status: TaskStatus = 'todo',
    type: 'task' | 'event' = 'task',
    description: string = '',
    startTime: string | null = null,
    endTime: string | null = null,
    guests: string[] = [],
    workspaceId?: string
): TaskData => {
    const tasks = getTasksData(workspaceId);
    const newTask: TaskData = {
        id: uuidv4(),
        title,
        description,
        status,
        priority: 'medium',
        date,
        endDate: null,
        startTime,
        endTime,
        crmContactId: null,
        spaceId: spaceId || 'default',
        timeSpent: 0,
        comments: [],
        googleEventId: null,
        linkedCanvasIds: [],
        customFields: {
            type,
            guests
        },
        type,
        guests,
        tags: [],
        recurringRule: 'none',
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
    tasks.push(newTask);
    saveTasksData(tasks, workspaceId);
    pushTaskToSupabase(newTask, 'insert', workspaceId);
    return newTask;
};

export const updateTask = (id: string, updates: Partial<TaskData>, workspaceId?: string) => {
    const tasks = getTasksData(workspaceId);
    const index = tasks.findIndex(t => t.id === id);
    if (index !== -1) {
        const oldTask = tasks[index];
        
        if (updates.status === 'done' && oldTask.status !== 'done' && oldTask.recurringRule && oldTask.recurringRule !== 'none' && oldTask.date) {
            let nextDate = new Date(oldTask.date);
            if (oldTask.recurringRule === 'daily') nextDate = addDays(nextDate, 1);
            else if (oldTask.recurringRule === 'weekly') nextDate = addWeeks(nextDate, 1);
            else if (oldTask.recurringRule === 'monthly') nextDate = addMonths(nextDate, 1);
            else if (oldTask.recurringRule === 'yearly') nextDate = addYears(nextDate, 1);
            
            const nextTask: TaskData = {
                ...oldTask,
                id: uuidv4(),
                status: 'todo',
                date: nextDate.getTime(),
                createdAt: Date.now(),
                updatedAt: Date.now(),
                subtasks: oldTask.subtasks?.map(s => ({ ...s, completed: false }))
            };
            tasks.push(nextTask);
            pushTaskToSupabase(nextTask, 'insert', workspaceId);
        }

        tasks[index] = { ...oldTask, ...updates, updatedAt: Date.now() };
        saveTasksData(tasks, workspaceId);
        pushTaskToSupabase(tasks[index], 'update', workspaceId);
    }
};

export const deleteTask = (id: string, workspaceId?: string) => {
    const tasks = getTasksData(workspaceId);
    saveTasksData(tasks.filter(t => t.id !== id), workspaceId);
    pushTaskToSupabase({id} as TaskData, 'remove', workspaceId);
};

export const addTaskComment = (taskId: string, content: string, author: string = 'User', workspaceId?: string) => {
    const tasks = getTasksData(workspaceId);
    const index = tasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
        const comment: TaskComment = {
            id: uuidv4(),
            author,
            content,
            createdAt: Date.now()
        };
        tasks[index].comments.push(comment);
        tasks[index].updatedAt = Date.now();
        saveTasksData(tasks, workspaceId);
        pushTaskToSupabase(tasks[index], 'update', workspaceId);
    }
};

export const getTasksByCrmContact = (crmContactId: string, workspaceId?: string): TaskData[] => {
    const tasks = getTasksData(workspaceId);
    return tasks.filter(t => t.crmContactId === crmContactId);
};

export const getTasksByCanvasId = (canvasId: string, workspaceId?: string): TaskData[] => {
    const tasks = getTasksData(workspaceId);
    return tasks.filter(t => t.linkedCanvasIds?.includes(canvasId));
};

export const linkTaskToCanvas = (taskId: string, canvasId: string, workspaceId?: string) => {
    const tasks = getTasksData(workspaceId);
    const index = tasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
        if (!tasks[index].linkedCanvasIds) tasks[index].linkedCanvasIds = [];
        if (!tasks[index].linkedCanvasIds.includes(canvasId)) {
            tasks[index].linkedCanvasIds.push(canvasId);
            tasks[index].updatedAt = Date.now();
            saveTasksData(tasks, workspaceId);
            pushTaskToSupabase(tasks[index], 'update', workspaceId);
        }
    }
};

export const unlinkTaskFromCanvas = (taskId: string, canvasId: string, workspaceId?: string) => {
    const tasks = getTasksData(workspaceId);
    const index = tasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
        if (tasks[index].linkedCanvasIds) {
            tasks[index].linkedCanvasIds = tasks[index].linkedCanvasIds.filter(id => id !== canvasId);
            tasks[index].updatedAt = Date.now();
            saveTasksData(tasks, workspaceId);
            pushTaskToSupabase(tasks[index], 'update', workspaceId);
        }
    }
};

export const syncTasksFromSupabase = async (workspaceId?: string): Promise<TaskData[]> => {
    if (getStorageMode() === 'offline') return getTasksData(workspaceId);
    try {
        let query = supabase.from('tasks').select('*');
        if (workspaceId) {
            query = query.eq('workspace_id', workspaceId);
        }
        const { data, error } = await query;
        if (error) {
            console.error('Error fetching tasks from Supabase:', error);
            return getTasksData(workspaceId);
        }
        if (data && Array.isArray(data)) {
            const syncedTasks: TaskData[] = data.map((row: any) => {
                const type = row.metadata?.customFields?.type || 'task';
                const guests = row.metadata?.customFields?.guests || [];
                return {
                    id: row.id,
                    title: row.title,
                    description: row.description || '',
                    status: row.status || 'todo',
                    priority: row.priority || 'medium',
                    date: row.metadata?.date || null,
                    endDate: row.metadata?.endDate || null,
                    startTime: row.metadata?.startTime || null,
                    endTime: row.metadata?.endTime || null,
                    crmContactId: row.metadata?.crmContactId || null,
                    spaceId: row.node_id || 'default',
                    timeSpent: row.time_spent_seconds || 0,
                    comments: row.metadata?.comments || [],
                    googleEventId: row.metadata?.googleEventId || null,
                    linkedCanvasIds: row.metadata?.linkedCanvasIds || [],
                    customFields: row.metadata?.customFields || {},
                    tags: row.tags || [],
                    recurringRule: row.metadata?.recurringRule || 'none',
                    type,
                    guests,
                    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
                    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now()
                };
            });
            
            const localTasks = getTasksData(workspaceId);
            const localMap = new Map(localTasks.map(t => [t.id, t]));
            
            syncedTasks.forEach(synced => {
                const local = localMap.get(synced.id);
                if (!local || synced.updatedAt > local.updatedAt) {
                    localMap.set(synced.id, synced);
                }
            });
            
            const merged = Array.from(localMap.values());
            saveTasksData(merged, workspaceId);
            return merged;
        }
    } catch (e) {
        console.error('Supabase Sync Error:', e);
    }
    return getTasksData(workspaceId);
};

export const syncTaskSpacesFromSupabase = async (workspaceId?: string): Promise<TaskSpace[]> => {
    if (getStorageMode() === 'offline') return getTasksSpaces(workspaceId);
    try {
        let query = supabase.from('nodes').select('*').eq('type', 'task_board');
        if (workspaceId) {
            query = query.eq('workspace_id', workspaceId);
        }
        const { data, error } = await query;
        if (error) {
            console.error('Error fetching task spaces from Supabase:', error);
            return getTasksSpaces(workspaceId);
        }
        if (data && Array.isArray(data)) {
            const syncedSpaces: TaskSpace[] = data.map((row: any) => ({
                id: row.id,
                title: row.title,
                color: row.color || '#8b5cf6',
                icon: row.icon || 'Folder',
                createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now()
            }));
            
            const localSpaces = getTasksSpaces(workspaceId);
            const localMap = new Map(localSpaces.map(s => [s.id, s]));
            syncedSpaces.forEach(synced => {
                localMap.set(synced.id, synced);
            });
            
            const merged = Array.from(localMap.values());
            saveTasksSpaces(merged, workspaceId);
            return merged;
        }
    } catch (e) {
        console.error('Supabase Space Sync Error:', e);
    }
    return getTasksSpaces(workspaceId);
};
