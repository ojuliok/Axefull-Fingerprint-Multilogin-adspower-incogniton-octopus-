const fs = require('fs');

let code = fs.readFileSync('src/renderer/pages/Dashboard.tsx', 'utf8');

// We will find `<div className={styles.megaToolbar}>`
// and the closing `</div>` right before `{/* Folder Tabs Navigation */}`
// and replace the entire block to be absolutely sure it's correct.

const startToken = '<div className={styles.megaToolbar}>';
const endToken = '{/* Folder Tabs Navigation */}';

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
                                                        </div>
                                                        <span className={styles.colLabel}>{col.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
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

                    `;

code = code.substring(0, startIndex) + replacement + code.substring(endIndex);

fs.writeFileSync('src/renderer/pages/Dashboard.tsx', code);
console.log("Fixed dashboard perfectly!");
