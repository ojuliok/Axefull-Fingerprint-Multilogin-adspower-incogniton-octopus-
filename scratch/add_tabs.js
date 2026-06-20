const fs = require('fs');

let code = fs.readFileSync('src/renderer/pages/Dashboard.tsx', 'utf8');

// 1. Remove the old "Pastas" dropdown block
// The block starts at ` <div style={{ position: 'relative' }}>` (around line 850)
// and ends at `</div>` before `<div style={{ position: 'relative' }}>` (Tags dropdown).
// It's safer to use regex to find the button that has 'foldersNavbar'.
const foldersDropdownRegex = /<div style=\{\{ position: 'relative' \}\}>\s*<button[^>]*openMenu === 'foldersNavbar'[\s\S]*?<\/div>\s*<\/div>\s*<div style=\{\{ position: 'relative' \}\}>\s*<button[^>]*openMenu === 'tagsNavbar'/;
if (foldersDropdownRegex.test(code)) {
    code = code.replace(foldersDropdownRegex, `<div style={{ position: 'relative' }}>\n                                    <button className={\`\${styles.megaBtn} \${openMenu === 'tagsNavbar'`);
    console.log("Removed folders dropdown from megaToolbar.");
}

// 2. Insert the Tabs bar after the megaToolbar
const megaToolbarEnd = `                        )}
                    </div>`;

const tabsCode = `
                    {/* Folder Tabs Navigation */}
                    <div className={styles.tabsContainer}>
                        <button 
                            className={\`\${styles.tabItem} \${!selectedFolder && selectedCategory !== 'trash' ? styles.tabItemActive : ''}\`}
                            onClick={() => { setSelectedFolder(null); setSelectedCategory('all'); setSelectedTag(null); }}
                        >
                            <LayoutGrid size={14} /> Todos os Perfis
                        </button>
                        
                        {folders.map(f => (
                            <button 
                                key={f.id}
                                className={\`\${styles.tabItem} \${selectedFolder === f.id ? styles.tabItemActive : ''}\`}
                                onClick={() => { setSelectedFolder(f.id); setSelectedCategory('all'); setSelectedTag(null); }}
                                onContextMenu={(e: React.MouseEvent) => handleFolderContextMenu(e, f.id)}
                            >
                                <FolderIcon size={14} style={{ color: getFolderColor(f.id) || 'inherit' }} /> {f.name}
                            </button>
                        ))}

                        {isCreatingFolder ? (
                            <div className={styles.tabInputWrapper}>
                                <FolderIcon size={14} className="text-violet-400" />
                                <input
                                    autoFocus
                                    type="text"
                                    className={styles.tabInput}
                                    placeholder="Nome da pasta..."
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    onKeyDown={handleFolderInputKeyDown}
                                    onBlur={submitNewFolder}
                                />
                            </div>
                        ) : (
                            <button className={styles.tabAddButton} onClick={handleCreateFolder} title="Nova Pasta">
                                <Plus size={16} />
                            </button>
                        )}
                    </div>`;

if (!code.includes('className={styles.tabsContainer}')) {
    code = code.replace(megaToolbarEnd, megaToolbarEnd + "\n" + tabsCode);
    console.log("Inserted tabsContainer.");
}

fs.writeFileSync('src/renderer/pages/Dashboard.tsx', code);
console.log("Dashboard updated with Tabs.");
