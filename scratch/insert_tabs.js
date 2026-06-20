const fs = require('fs');

let code = fs.readFileSync('src/renderer/pages/Dashboard.tsx', 'utf8');

// 1. Import LayoutGrid if not imported
if (!code.includes('LayoutGrid')) {
    code = code.replace(
        "import { Plus, Search, Folder as FolderIcon, Tag, MoreVertical, Play, StopCircle, CheckSquare, Trash2, Edit, Copy, Upload, Download, Grid, List, Star, Activity, Settings, Bell, LayoutDashboard, Database, HelpCircle, Layers, Fingerprint, RefreshCcw, Power, Moon, Sun, AlertTriangle, Monitor, Globe, FileText, Smartphone, ChevronRight, ChevronDown, Check, Columns, Filter, ArrowUpDown, ChevronUp, RefreshCw, X, Maximize2, Shield, Eye, ShieldAlert, Cpu } from 'lucide-react';",
        "import { Plus, Search, Folder as FolderIcon, Tag, MoreVertical, Play, StopCircle, CheckSquare, Trash2, Edit, Copy, Upload, Download, Grid, List, Star, Activity, Settings, Bell, LayoutDashboard, Database, HelpCircle, Layers, Fingerprint, RefreshCcw, Power, Moon, Sun, AlertTriangle, Monitor, Globe, FileText, Smartphone, ChevronRight, ChevronDown, Check, Columns, Filter, ArrowUpDown, ChevronUp, RefreshCw, X, Maximize2, Shield, Eye, ShieldAlert, Cpu, LayoutGrid } from 'lucide-react';"
    );
    // fallback if regex doesn't match exactly
    if (!code.includes('LayoutGrid')) {
        code = code.replace("from 'lucide-react';", ", LayoutGrid } from 'lucide-react';");
    }
}

// 2. Insert tabs after megaToolbar
const targetStr = `                    </div>

                    {selectedCategory === 'trash' && !loading && (`

const tabsCode = `                    </div>

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
                    </div>

                    {selectedCategory === 'trash' && !loading && (`

if (!code.includes('styles.tabsContainer')) {
    code = code.replace(targetStr, tabsCode);
}

fs.writeFileSync('src/renderer/pages/Dashboard.tsx', code);
console.log("Tabs inserted.");
