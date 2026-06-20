const fs = require('fs');

let code = fs.readFileSync('src/renderer/pages/Dashboard.tsx', 'utf8');

const targetStr = `                                    <input 
                                        className={styles.megaSearchInput}
                                        placeholder="Buscar perfis..."
                                    <Trash2 size={14} /> Lixeira
                                </button>`;

const replacementStr = `                                    <input 
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
                                </button>`;

code = code.replace(targetStr, replacementStr);
fs.writeFileSync('src/renderer/pages/Dashboard.tsx', code);
console.log("Fixed!");
