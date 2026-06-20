const fs = require('fs');

let code = fs.readFileSync('src/renderer/components/Tasks/tasksStorage.ts', 'utf8');

const importSupabase = `
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'COLOQUE_SUA_URL_AQUI';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || 'COLOQUE_SUA_CHAVE_AQUI';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
`;

if (!code.includes("import { createClient } from '@supabase/supabase-js';")) {
    code = code.replace("import { v4 as uuidv4 } from 'uuid';", "import { v4 as uuidv4 } from 'uuid';\n" + importSupabase);
}

// Hooking into space logic
code = code.replace(
    "saveTasksSpaces(spaces);\n    return newSpace;",
    "saveTasksSpaces(spaces);\n    pushTaskSpaceToSupabase(newSpace, 'insert');\n    return newSpace;"
);

code = code.replace(
    "spaces[index] = { ...spaces[index], ...updates };\n        saveTasksSpaces(spaces);",
    "spaces[index] = { ...spaces[index], ...updates };\n        saveTasksSpaces(spaces);\n        pushTaskSpaceToSupabase(spaces[index], 'update');"
);

code = code.replace(
    "saveTasksData(tasks.filter(t => t.spaceId !== id));",
    "saveTasksData(tasks.filter(t => t.spaceId !== id));\n    pushTaskSpaceToSupabase({id} as TaskSpace, 'remove');"
);

// Hooking into task logic
code = code.replace(
    "tasks.push(newTask);\n    saveTasksData(tasks);\n    return newTask;",
    "tasks.push(newTask);\n    saveTasksData(tasks);\n    pushTaskToSupabase(newTask, 'insert');\n    return newTask;"
);

code = code.replace(
    "tasks[index] = { ...tasks[index], ...updates, updatedAt: Date.now() };\n        saveTasksData(tasks);",
    "tasks[index] = { ...tasks[index], ...updates, updatedAt: Date.now() };\n        saveTasksData(tasks);\n        pushTaskToSupabase(tasks[index], 'update');"
);

code = code.replace(
    "saveTasksData(tasks.filter(t => t.id !== id));",
    "saveTasksData(tasks.filter(t => t.id !== id));\n    pushTaskToSupabase({id} as TaskData, 'remove');"
);

fs.writeFileSync('src/renderer/components/Tasks/tasksStorage.ts', code);
console.log("Refactored tasksStorage.ts to sync with Supabase!");
