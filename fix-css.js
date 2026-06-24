const fs = require('fs');
const path = require('path');

const cssMap = [
    { pattern: /rgba\(255,\s*255,\s*255,\s*0\.[0-9]+\)/g, replacement: 'var(--bg-secondary)' },
    { pattern: /#111827/g, replacement: 'var(--text-primary)' },
    { pattern: /#1f2937/g, replacement: 'var(--text-secondary)' },
    { pattern: /#374151/g, replacement: 'var(--text-secondary)' },
    { pattern: /#4b5563/g, replacement: 'var(--text-tertiary)' },
    { pattern: /#6b7280/g, replacement: 'var(--text-tertiary)' },
    { pattern: /#9ca3af/g, replacement: 'var(--text-disabled)' },
    { pattern: /#d1d5db/g, replacement: 'var(--border-hover)' },
    { pattern: /#e5e7eb/g, replacement: 'var(--border-default)' },
    { pattern: /#f3f4f6/g, replacement: 'var(--bg-secondary)' },
    { pattern: /#f9fafb/g, replacement: 'var(--bg-card-hover)' },
    { pattern: /#ffffff/ig, replacement: 'var(--bg-card)' },
    { pattern: /background:\s*white/ig, replacement: 'background: var(--bg-card)' },
    { pattern: /color:\s*white/ig, replacement: 'color: var(--text-primary)' },
    { pattern: /#14141c/ig, replacement: 'var(--bg-card)' },
    { pattern: /#0f0f13/ig, replacement: 'var(--bg-secondary)' },
    { pattern: /#27272a/ig, replacement: 'var(--border-default)' },
    { pattern: /#e2e8f0/ig, replacement: 'var(--text-primary)' },
    // Some basic tailwind gray values occasionally hardcoded in CSS
    { pattern: /#64748b/ig, replacement: 'var(--text-secondary)' },
    { pattern: /#475569/ig, replacement: 'var(--text-secondary)' },
    { pattern: /#334155/ig, replacement: 'var(--text-primary)' },
    { pattern: /#1e293b/ig, replacement: 'var(--text-primary)' },
    { pattern: /#0f172a/ig, replacement: 'var(--text-primary)' },
    { pattern: /#cbd5e1/ig, replacement: 'var(--border-hover)' },
    { pattern: /#94a3b8/ig, replacement: 'var(--text-tertiary)' },
    { pattern: /#e2e8f0/ig, replacement: 'var(--border-default)' },
    { pattern: /#f1f5f9/ig, replacement: 'var(--bg-secondary)' },
    { pattern: /#f8fafc/ig, replacement: 'var(--bg-card-hover)' },
];

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            processDir(fullPath);
        } else if (file.endsWith('.module.css') || file.endsWith('.css')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;
            for (const { pattern, replacement } of cssMap) {
                if (pattern.test(content)) {
                    content = content.replace(pattern, replacement);
                    modified = true;
                }
            }
            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated CSS ${fullPath}`);
            }
        }
    }
}

// Ensure we run on all renderer code
processDir(path.join(__dirname, 'src', 'renderer'));
