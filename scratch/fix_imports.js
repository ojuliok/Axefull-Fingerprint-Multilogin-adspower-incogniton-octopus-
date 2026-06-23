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
    { from: /..\/components\/Tasks\/tasksStorage/g, to: '../features/Tasks/Tasks/tasksStorage' },
    { from: /..\/components\/Tasks\//g, to: '../features/Tasks/Tasks/' },
    { from: /..\/..\/components\/Tasks\//g, to: '../../features/Tasks/Tasks/' },
    
    { from: /..\/components\/Canvas\//g, to: '../features/Canvas/' },
    { from: /..\/..\/components\/Canvas\//g, to: '../../features/Canvas/' },
    
    { from: /..\/components\/Marketing\//g, to: '../features/Marketing/' },
    { from: /..\/..\/components\/Marketing\//g, to: '../../features/Marketing/' },
    
    { from: /..\/components\/ProfileEditor\//g, to: '../features/Profiles/ProfileEditor/' },
    { from: /..\/components\/ProfileDetail\//g, to: '../features/Profiles/ProfileDetail/' },
    { from: /..\/components\/ProfileTable\//g, to: '../features/Profiles/ProfileTable/' },
    { from: /..\/components\/ProfileCard\//g, to: '../features/Profiles/ProfileCard/' },
    
    { from: /..\/components\/AutomationModal\//g, to: '../features/AutomationModal/' },
    { from: /..\/components\/Templates\//g, to: '../features/Templates/' },
    { from: /..\/components\/AI\//g, to: '../features/AI/' },
    { from: /..\/components\/Dashboard\//g, to: '../features/Dashboard/' },
    { from: /..\/components\/Proxies\//g, to: '../features/Proxies/' },
    { from: /..\/components\/Security\//g, to: '../features/Security/' },
    { from: /..\/components\/BrowserData\//g, to: '../features/BrowserData/' },
    { from: /..\/components\/Extensions\//g, to: '../features/Extensions/' },

    // Fixes for nested components
    { from: /..\/StatusBadge\/StatusBadge/g, to: '../../../components/ui/StatusBadge/StatusBadge' },
    { from: /..\/InlineNoteEditor\/InlineNoteEditor/g, to: '../../Notes/InlineNoteEditor/InlineNoteEditor' },
    
    // Fix context paths
    { from: /..\/..\/context\/PomodoroContext/g, to: '../../../../context/PomodoroContext' },
    { from: /..\/context\/PomodoroContext/g, to: '../../../context/PomodoroContext' },
    
    // Fix ViewType imports in LayoutManager and navigation
    { from: /import \{? ViewType \}? from '..\/..\/App';/g, to: '' },
    { from: /currentView: ViewType;/g, to: 'currentView: string;' },
    { from: /onViewChange: \(view: ViewType\) => void;/g, to: 'onViewChange: (view: string) => void;' },
    { from: /currentView: string;/g, to: 'currentView: string;' }, // just in case
];

walk(rendererPath, (filePath) => {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    for (let r of replacements) {
        content = content.replace(r.from, r.to);
    }
    
    if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log(`Updated: ${filePath}`);
    }
});
