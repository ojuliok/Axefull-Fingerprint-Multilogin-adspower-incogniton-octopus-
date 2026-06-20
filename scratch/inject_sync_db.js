const fs = require('fs');

let code = fs.readFileSync('src/main/database/db.ts', 'utf8');

// 1. Add import for getSupabase
if (!code.includes("import { getSupabase }")) {
    code = code.replace("import { app } from 'electron';", "import { app } from 'electron';\nimport { getSupabase } from '../supabase-client';");
}

// 2. Define pushToSupabase
const pushFunc = `
/**
 * Async helper to push local changes to Supabase
 */
async function pushToSupabase(action: 'insert' | 'update' | 'remove', table: string, id: string, data?: any) {
    try {
        const supabase = getSupabase();
        if (action === 'insert' && data) {
            const { error } = await supabase.from(table).insert([data]);
            if (error) console.error(\`[Supabase Sync] Insert error on \${table}:\`, error);
        } else if (action === 'update' && data) {
            const { error } = await supabase.from(table).update(data).eq('id', id);
            if (error) console.error(\`[Supabase Sync] Update error on \${table}:\`, error);
        } else if (action === 'remove') {
            const { error } = await supabase.from(table).delete().eq('id', id);
            if (error) console.error(\`[Supabase Sync] Remove error on \${table}:\`, error);
        }
    } catch (err) {
        console.error(\`[Supabase Sync] Exception:\`, err);
    }
}
`;

if (!code.includes("pushToSupabase")) {
    code = code.replace("const ALLOWED_TABLES = new Set([", pushFunc + "\nconst ALLOWED_TABLES = new Set([");
}

// 3. Update insert, update, remove to call pushToSupabase
if (!code.includes("pushToSupabase('insert'")) {
    code = code.replace(
        "stmt.run(values);\n    stmt.free();\n    saveDatabase();",
        "stmt.run(values);\n    stmt.free();\n    saveDatabase();\n    pushToSupabase('insert', table, data.id as string, data);"
    );
}

if (!code.includes("pushToSupabase('update'")) {
    code = code.replace(
        "stmt.run([...values, id]);\n    stmt.free();\n    saveDatabase();",
        "stmt.run([...values, id]);\n    stmt.free();\n    saveDatabase();\n    pushToSupabase('update', table, id, data);"
    );
}

if (!code.includes("pushToSupabase('remove'")) {
    code = code.replace(
        "stmt.run([id]);\n    stmt.free();\n    saveDatabase();",
        "stmt.run([id]);\n    stmt.free();\n    saveDatabase();\n    pushToSupabase('remove', table, id);"
    );
}

fs.writeFileSync('src/main/database/db.ts', code);
console.log("Injected Sync Engine to db.ts!");
