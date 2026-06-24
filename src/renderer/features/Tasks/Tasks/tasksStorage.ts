import { v4 as uuidv4 } from 'uuid';
import { addDays, addWeeks, addMonths, addYears } from 'date-fns';

import { supabase } from '../../../lib/supabase';

// Helper for pushing to Supabase
async function pushTaskSpaceToSupabase(space: TaskSpace, action: 'insert' | 'update' | 'remove') {
    try {
        if (action === 'insert') {
            await supabase.from('task_spaces').insert([{ 
                id: space.id, title: space.title, color: space.color, icon: space.icon, created_at: new Date(space.createdAt).toISOString()
            }]);
        } else if (action === 'update') {
            await supabase.from('task_spaces').update({
                title: space.title, color: space.color, icon: space.icon
            }).eq('id', space.id);
        } else if (action === 'remove') {
            await supabase.from('task_spaces').delete().eq('id', space.id);
        }
    } catch(e) { console.error('Supabase Sync Error:', e); }
}

async function pushTaskToSupabase(task: TaskData, action: 'insert' | 'update' | 'remove') {
    try {
        if (action === 'insert') {
            await supabase.from('tasks').insert([{
                id: task.id, title: task.title, description: task.description, status: task.status, priority: task.priority,
                date: task.date, end_date: task.endDate, start_time: task.startTime, end_time: task.endTime,
                crm_contact_id: task.crmContactId, space_id: task.spaceId, time_spent: task.timeSpent,
                google_event_id: task.googleEventId, linked_canvas_ids: task.linkedCanvasIds,
                custom_fields: task.customFields, tags: task.tags, created_at: new Date(task.createdAt).toISOString(),
                updated_at: new Date(task.updatedAt).toISOString()
            }]);
        } else if (action === 'update') {
            await supabase.from('tasks').update({
                title: task.title, description: task.description, status: task.status, priority: task.priority,
                date: task.date, end_date: task.endDate, start_time: task.startTime, end_time: task.endTime,
                crm_contact_id: task.crmContactId, space_id: task.spaceId, time_spent: task.timeSpent,
                google_event_id: task.googleEventId, linked_canvas_ids: task.linkedCanvasIds,
                custom_fields: task.customFields, tags: task.tags, updated_at: new Date(task.updatedAt).toISOString()
            }).eq('id', task.id);
        } else if (action === 'remove') {
            await supabase.from('tasks').delete().eq('id', task.id);
        }
    } catch(e) { console.error('Supabase Sync Error:', e); }
}


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
    
    createdAt: number;
    updatedAt: number;
}

// Tasks LocalStorage Keys
const STORAGE_KEY = 'axe_tasks_data_v2';
const SPACES_KEY = 'axe_tasks_spaces_v1';
const PINNED_TASK_KEY = 'axe_pinned_task_id';

export const getTasksSpaces = (): TaskSpace[] => {
    try {
        const data = localStorage.getItem(SPACES_KEY);
        if (data) {
            return JSON.parse(data);
        }
    } catch (e) {}
    // Retornar um espaço padrão se não houver
    return [{ id: 'default', title: 'Geral', color: '#8b5cf6', icon: 'List', createdAt: Date.now() }];
};

export const saveTasksSpaces = (spaces: TaskSpace[]) => {
    localStorage.setItem(SPACES_KEY, JSON.stringify(spaces));
};

export const createSpace = (title: string, color: string = '#8b5cf6'): TaskSpace => {
    const spaces = getTasksSpaces();
    const newSpace: TaskSpace = {
        id: uuidv4(),
        title,
        color,
        icon: 'Folder',
        createdAt: Date.now()
    };
    spaces.push(newSpace);
    saveTasksSpaces(spaces);
    pushTaskSpaceToSupabase(newSpace, 'insert');
    return newSpace;
};

export const updateSpace = (id: string, updates: Partial<TaskSpace>) => {
    const spaces = getTasksSpaces();
    const index = spaces.findIndex(s => s.id === id);
    if (index !== -1) {
        spaces[index] = { ...spaces[index], ...updates };
        saveTasksSpaces(spaces);
        pushTaskSpaceToSupabase(spaces[index], 'update');
    }
};

export const deleteSpace = (id: string) => {
    const spaces = getTasksSpaces();
    saveTasksSpaces(spaces.filter(s => s.id !== id));
    const tasks = getTasksData();
    saveTasksData(tasks.filter(t => t.spaceId !== id));
    pushTaskSpaceToSupabase({id} as TaskSpace, 'remove');
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

export const getTasksData = (): TaskData[] => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            return JSON.parse(data);
        }
    } catch (e) {
        console.error('Error reading tasks data', e);
    }
    return [];
};

export const saveTasksData = (tasks: TaskData[]) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
        console.error('Error saving tasks data', e);
    }
};

export const createTask = (title: string, spaceId: string | null = null, date: number | null = null, status: TaskStatus = 'todo'): TaskData => {
    const tasks = getTasksData();
    const newTask: TaskData = {
        id: uuidv4(),
        title,
        description: '',
        status,
        priority: 'medium',
        date,
        endDate: null,
        startTime: null,
        endTime: null,
        crmContactId: null,
        spaceId: spaceId || 'default',
        timeSpent: 0,
        comments: [],
        googleEventId: null,
        linkedCanvasIds: [],
        customFields: {},
        tags: [],
        recurringRule: 'none',
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
    tasks.push(newTask);
    saveTasksData(tasks);
    pushTaskToSupabase(newTask, 'insert');
    return newTask;
};

export const updateTask = (id: string, updates: Partial<TaskData>) => {
    const tasks = getTasksData();
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
            pushTaskToSupabase(nextTask, 'insert');
        }

        tasks[index] = { ...oldTask, ...updates, updatedAt: Date.now() };
        saveTasksData(tasks);
        pushTaskToSupabase(tasks[index], 'update');
    }
};

export const deleteTask = (id: string) => {
    const tasks = getTasksData();
    saveTasksData(tasks.filter(t => t.id !== id));
    pushTaskToSupabase({id} as TaskData, 'remove');
};

export const addTaskComment = (taskId: string, content: string, author: string = 'User') => {
    const tasks = getTasksData();
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
        saveTasksData(tasks);
    }
};

export const getTasksByCrmContact = (crmContactId: string): TaskData[] => {
    const tasks = getTasksData();
    return tasks.filter(t => t.crmContactId === crmContactId);
};

export const getTasksByCanvasId = (canvasId: string): TaskData[] => {
    const tasks = getTasksData();
    return tasks.filter(t => t.linkedCanvasIds?.includes(canvasId));
};

export const linkTaskToCanvas = (taskId: string, canvasId: string) => {
    const tasks = getTasksData();
    const index = tasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
        if (!tasks[index].linkedCanvasIds) tasks[index].linkedCanvasIds = [];
        if (!tasks[index].linkedCanvasIds.includes(canvasId)) {
            tasks[index].linkedCanvasIds.push(canvasId);
            tasks[index].updatedAt = Date.now();
            saveTasksData(tasks);
        }
    }
};

export const unlinkTaskFromCanvas = (taskId: string, canvasId: string) => {
    const tasks = getTasksData();
    const index = tasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
        if (tasks[index].linkedCanvasIds) {
            tasks[index].linkedCanvasIds = tasks[index].linkedCanvasIds.filter(id => id !== canvasId);
            tasks[index].updatedAt = Date.now();
            saveTasksData(tasks);
        }
    }
};
