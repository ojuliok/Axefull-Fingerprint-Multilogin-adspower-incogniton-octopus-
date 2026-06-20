const fs = require('fs');

let code = fs.readFileSync('src/renderer/pages/Dashboard.tsx', 'utf8');

const startToken = '<div className={styles.megaToolbar}>';
const endToken = "{selectedCategory === 'trash' && !loading && (";

const startIndex = code.indexOf(startToken);
const endIndex = code.indexOf(endToken);

if (startIndex === -1 || endIndex === -1) {
    console.error("Tokens not found", { startIndex, endIndex });
    process.exit(1);
}

const replacement = `<div className={styles.megaToolbar}>
                        <h1 className={styles.megaTitle}>
                            {selectedFolder ? getFolderName(selectedFolder) : selectedCategory === 'trash' ? 'Lixeira' : selectedCategory === 'all' ? 'Todos os Perfis' : getCategoryName(selectedCategory)}
                        </h1>

                        {!loading && (
                            <>
                                <div className={styles.megaDivider} />

                                {/* Retractable Search */}
                                <div className={\`\${styles.megaSearchContainer} \${isSearchOpen || searchQuery ? styles.searchExpanded : ''}\`}>
                                    <div className={styles.megaSearchIcon}>
                                        <Search size={14} />
                                    </div>
                                    <input 
                                        className={styles.megaSearchInput}
                                        placeholder="Buscar perfis..."
                                        value={searchQuery} 
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                                        onFocus={() => setIsSearchOpen(true)}
                                        onBlur={() => !searchQuery && setIsSearchOpen(false)}
                                    />
                                </div>

                                <div className={styles.megaDivider} />

                                {/* Core Actions */}
                                <button className={\`\${styles.megaBtn} \${styles.megaBtnPrimary}\`} onClick={() => setShowCreateModal(true)}>
                                    <Plus size={14} strokeWidth={2.5} /> Novo Perfil
                                </button>
                                <button className={styles.megaBtn} onClick={handleImportProfiles} title="Importar perfis">
                                    <Upload size={14} /> Importar
                                </button>
                                <button className={styles.megaBtn} onClick={() => setShowTemplatesModal(true)} title="Templates">
                                    <Layers size={14} /> Templates
                                </button>

                                <div className={styles.megaDivider} />

                                {/* Tools */}
                                <div style={{ position: 'relative' }}>
                                    <button className={\`\${styles.megaBtn} \${openMenu === 'tagsNavbar' ? styles.megaBtnActive : ''}\`} onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === 'tagsNavbar' ? null : 'tagsNavbar'); }}>
                                        <Tag size={14} /> Tags {selectedTag && <span className="ml-1 text-violet-400">•</span>}
                                    </button>
                                    {openMenu === 'tagsNavbar' && (
                                        <div className={styles.folderPickerDropdown} style={{ position: 'absolute', top: '100%', left: 0, marginTop: '8px', zIndex: 100, minWidth: '180px' }}>
                                            <button onClick={() => { setSelectedTag(null); setOpenMenu(null); }} style={{ background: !selectedTag ? 'rgba(255,255,255,0.1)' : '' }}>
                                                <Tag size={14} /> Todas as Tags
                                            </button>
                                            <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
                                            {availableTags.map(t => (
                                                <button key={t} onClick={() => { setSelectedTag(t); setSelectedCategory('all'); setSelectedFolder(null); setOpenMenu(null); }} style={{ background: selectedTag === t ? 'rgba(255,255,255,0.1)' : '' }}>
                                                    <Tag size={14} style={{ color: SOCIAL_TAG_COLORS[t.toLowerCase()]?.color || '#a78bfa' }} /> {t}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button className={\`\${styles.megaBtn} \${selectedCategory === 'trash' ? styles.megaBtnActive : ''}\`} onClick={() => { setSelectedCategory('trash'); setSelectedFolder(null); setSelectedTag(null); }} style={{ color: selectedCategory === 'trash' ? '#f87171' : undefined }}>
                                    <Trash2 size={14} /> Lixeira
                                </button>

                                {/* Column Selector */}
                                <div style={{ position: 'relative' }}>
                                    <button className={\`\${styles.megaBtn} \${showColumnSelector ? styles.megaBtnActive : ''}\`} onClick={() => setShowColumnSelector(!showColumnSelector)}>
                                        <Eye size={14} /> Ocultar
                                    </button>
                                    {showColumnSelector && (
                                        <>
                                            <div className={styles.columnSelectorOverlay} onClick={() => setShowColumnSelector(false)} />
                                            <div className={styles.columnSelector} style={{ top: '100%', marginTop: '8px' }}>
                                                <div className={styles.columnSelectorTitle}>Exibir colunas</div>
                                                <div className={styles.columnSelectorAll} onClick={() => {
                                                    const allOn = Object.values(visibleColumns).every(v => v);
                                                    const updated: Record<string, boolean> = {};
                                                    COLUMN_CONFIG.forEach(c => updated[c.key] = !allOn);
                                                    setVisibleColumns(updated);
                                                    localStorage.setItem('axe_visible_columns', JSON.stringify(updated));
                                                }}>
                                                    <div className={\`\${styles.colCheckbox} \${Object.values(visibleColumns).every(v => v) ? styles.colCheckboxChecked : ''}\`}>
                                                        {Object.values(visibleColumns).every(v => v) && <div style={{ width: 6, height: 6, background: 'white', borderRadius: 1 }} />}
                                                    </div>
                                                    <span className={styles.colLabel}>Todas as colunas — {Object.values(visibleColumns).filter(v => v).length} selecionada(s)</span>
                                                </div>
                                                {COLUMN_CONFIG.map(col => (
                                                    <div key={col.key} className={styles.columnSelectorItem} onClick={() => toggleColumn(col.key)}>
                                                        <div className={\`\${styles.colCheckbox} \${visibleColumns[col.key] ? styles.colCheckboxChecked : ''}\`}>
                                                            {visibleColumns[col.key] && <div style={{ width: 6, height: 6, background: 'white', borderRadius: 1 }} />}
                                                        </div>
                                                        <div className={styles.colIcon} style={{ background: col.color + '20', color: col.color }}>
                                                            {col.key === 'favorite' && <Star size={12} />}
                                                            {col.key === 'status' && <Activity size={12} />}
                                                            {col.key === 'notes' && <FileText size={12} />}
                                                            {col.key === 'folder' && <FolderIcon size={12} />}
                                                            {col.key === 'tags' && <Tag size={12} />}
                                                            {col.key === 'proxy' && <Globe size={12} />}
                                                            {col.key === 'actions' && <MoreVertical size={12} />}
                                                        </div>
                                                        <span className={styles.colLabel}>{col.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Group By Selector */}
                                <div style={{ position: 'relative' }}>
                                    <button className={\`\${styles.megaBtn} \${groupBy !== 'none' ? styles.megaBtnActive : ''}\`} onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === 'groupby' ? null : 'groupby'); }}>
                                        <ArrowUpDown size={14} /> Agrupar por
                                    </button>
                                    {openMenu === 'groupby' && (
                                        <div className={styles.folderPickerDropdown} style={{ position: 'absolute', top: '100%', left: 0, marginTop: '8px', zIndex: 100 }}>
                                            <button onClick={() => setGroupBy('none')} style={{ background: groupBy === 'none' ? 'rgba(255,255,255,0.1)' : '' }}>Sem agrupamento</button>
                                            <button onClick={() => setGroupBy('status')} style={{ background: groupBy === 'status' ? 'rgba(255,255,255,0.1)' : '' }}>Por Status</button>
                                            <button onClick={() => setGroupBy('folder')} style={{ background: groupBy === 'folder' ? 'rgba(255,255,255,0.1)' : '' }}>Por Pasta</button>
                                        </div>
                                    )}
                                </div>

                                <div className={styles.megaDivider} />

                                {/* Stats Chips */}
                                <div className={styles.megaStat}>
                                    <Users size={14} className="text-slate-500" />
                                    <span style={{fontWeight:600}}>{profiles.filter(p => p.category !== 'trash').length}</span>
                                </div>
                                <div className={styles.megaStat}>
                                    <Activity size={14} className="text-emerald-500" />
                                    <span style={{fontWeight:600, color: 'var(--tw-text-opacity) ? rgba(52,211,153,var(--tw-text-opacity)) : #34d399'}}>{profiles.filter(p => p.is_active).length}</span>
                                </div>
                                <div className={styles.megaStat}>
                                    <Globe size={14} className="text-cyan-500" />
                                    <span style={{fontWeight:600, color: 'var(--tw-text-opacity) ? rgba(34,211,238,var(--tw-text-opacity)) : #22d3ee'}}>{profiles.filter(p => p.proxy).length}</span>
                                </div>
                                <div className={styles.megaStat}>
                                    <Monitor size={14} className="text-violet-400" />
                                    <span style={{fontWeight:600, color: 'var(--tw-text-opacity) ? rgba(167,139,250,var(--tw-text-opacity)) : #a78bfa'}}>{Object.keys(cdpUrls).length}</span>
                                </div>

                                <div className={styles.megaDivider} />

                                {/* View Mode */}
                                <button className={\`\${styles.megaBtn} \${viewMode === 'grid' ? styles.megaBtnActive : ''}\`} onClick={() => setViewMode('grid')} style={{ padding: '0 8px' }} title="Grid">
                                    <Grid size={14} />
                                </button>
                                <button className={\`\${styles.megaBtn} \${viewMode === 'list' ? styles.megaBtnActive : ''}\`} onClick={() => setViewMode('list')} style={{ padding: '0 8px' }} title="Lista">
                                    <List size={14} />
                                </button>

                                {/* More */}
                                <button className={styles.megaBtn} style={{ padding: '0 8px' }}>
                                    <MoreVertical size={14} />
                                </button>
                            </>
                        )}
                    </div>

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

                    `;

code = code.substring(0, startIndex) + replacement + code.substring(endIndex);

fs.writeFileSync('src/renderer/pages/Dashboard.tsx', code);
console.log("Successfully rebuilt megaToolbar and tabs.");
