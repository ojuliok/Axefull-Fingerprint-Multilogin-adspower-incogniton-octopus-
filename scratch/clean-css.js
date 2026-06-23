const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '../src/renderer/styles/index.css');
const content = fs.readFileSync(cssPath, 'utf8');
const lines = content.split('\n');

const newLines = [];
for (let i = 0; i < lines.length; i++) {
    // 0-based index! 
    // Remove lines 649-1389 (index 648 to 1388)
    // Remove lines 1622-1721 (index 1621 to 1720)
    
    if (i >= 648 && i <= 1388) continue;
    if (i >= 1621 && i <= 1720) continue;
    
    newLines.push(lines[i]);
}

fs.writeFileSync(cssPath, newLines.join('\n'));
console.log('Cleaned index.css successfully.');
