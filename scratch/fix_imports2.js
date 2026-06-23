const fs = require('fs');
const path = require('path');

const rendererPath = path.join(__dirname, '..', 'src', 'renderer');

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(dirPath);
    });
}

const replacements = [
    // ProfileDetailModal, ProfileEditor, PropertiesModal (3 levels deep from renderer)
    // They are in src/renderer/features/Profiles/ProfileDetail/ etc.
    // So to get to src/renderer/types it should be `../../../types`
    // Wait, earlier they were in src/renderer/components/ProfileDetail/ (2 levels deep)
    // So they used `../../types`. I need to change `../../types` to `../../../types`
    { filePattern: /features[\\\/]Profiles[\\\/](ProfileDetail|ProfileEditor)[\\\/].*\.tsx?$/, rules: [
        { from: /..\/..\/types/g, to: '../../../types' },
        { from: /..\/..\/context\/ToastContext/g, to: '../../../context/ToastContext' }
    ]},

    // ProxiesModal is at src/renderer/features/Proxies/ProxiesModal.tsx (2 levels deep)
    // Earlier it was in src/renderer/components/Proxies/ProxiesModal.tsx (2 levels deep)
    // So `../types` should be `../../types`
    { filePattern: /features[\\\/]Proxies[\\\/].*\.tsx?$/, rules: [
        { from: /..\/types/g, to: '../../types' }
    ]},

    // DashboardContext is at src/renderer/features/Dashboard/DashboardContext.tsx (2 levels deep)
    // Error says it has `../../../types` which it can't find? Wait, earlier it might have been `../../types`. Let's just use `../../types`.
    { filePattern: /features[\\\/]Dashboard[\\\/].*\.tsx?$/, rules: [
        { from: /..\/..\/..\/types/g, to: '../../types' },
        { from: /..\/..\/..\/context\/ToastContext/g, to: '../../context/ToastContext' },
        { from: /..\/..\/..\/utils\/constants/g, to: '../../utils/constants' }
    ]}
];

walk(rendererPath, (filePath) => {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    for (let replacement of replacements) {
        if (replacement.filePattern.test(filePath)) {
            for (let rule of replacement.rules) {
                content = content.replace(rule.from, rule.to);
            }
        }
    }
    
    if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log(`Updated: ${filePath}`);
    }
});
