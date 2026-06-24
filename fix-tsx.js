const fs = require('fs');
const path = require('path');

const tsxMap = [
    { pattern: /border-dark-800/g, replacement: 'border-theme-border' },
    { pattern: /border-dark-700/g, replacement: 'border-theme-border' },
    { pattern: /border-dark-500/g, replacement: 'border-theme-border/50' },
    { pattern: /border-dark-400/g, replacement: 'border-theme-border/50' },
    { pattern: /border-dark-600/g, replacement: 'border-theme-border' },
    { pattern: /bg-dark-900/g, replacement: 'bg-theme-surface' },
    { pattern: /bg-dark-800/g, replacement: 'bg-theme-surface' },
    { pattern: /bg-dark-700/g, replacement: 'bg-theme-card' },
    { pattern: /bg-dark-600/g, replacement: 'bg-theme-card' },
    { pattern: /text-dark-300/g, replacement: 'text-theme-text' },
    { pattern: /text-dark-400/g, replacement: 'text-theme-text-muted' },
    { pattern: /text-dark-500/g, replacement: 'text-theme-text-muted' },
    { pattern: /text-dark-200/g, replacement: 'text-theme-text' },
    { pattern: /text-white/g, replacement: 'text-theme-text' },
    { pattern: /text-slate-800/g, replacement: 'text-theme-text' },
    { pattern: /text-slate-900/g, replacement: 'text-theme-text' },
    { pattern: /text-gray-900/g, replacement: 'text-theme-text' },
    { pattern: /text-gray-800/g, replacement: 'text-theme-text' },
    { pattern: /text-slate-400/g, replacement: 'text-theme-text-muted' },
    { pattern: /text-gray-400/g, replacement: 'text-theme-text-muted' },
    { pattern: /bg-white/g, replacement: 'bg-theme-card' },
    { pattern: /bg-slate-50/g, replacement: 'bg-theme-surface' },
    { pattern: /bg-slate-100/g, replacement: 'bg-theme-surface' },
    { pattern: /bg-gray-50/g, replacement: 'bg-theme-surface' },
    { pattern: /bg-gray-100/g, replacement: 'bg-theme-surface' },
    { pattern: /border-slate-200/g, replacement: 'border-theme-border' },
    { pattern: /border-slate-300/g, replacement: 'border-theme-border' },
    { pattern: /border-gray-200/g, replacement: 'border-theme-border' },
    { pattern: /border-gray-300/g, replacement: 'border-theme-border' },
];

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            processDir(fullPath);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;
            for (const { pattern, replacement } of tsxMap) {
                // Avoid replacing things that are followed by a slash like /50
                const refinedPattern = new RegExp(pattern.source + '(?![/\\w-])', 'g');
                if (refinedPattern.test(content)) {
                    content = content.replace(refinedPattern, replacement);
                    modified = true;
                }
            }
            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated TSX ${fullPath}`);
            }
        }
    }
}

processDir(path.join(__dirname, 'src', 'renderer'));
