import React, { useState } from 'react';
import { X, Settings, Layout, Fingerprint, Tag, Trash2, Plus, Save, Edit2 } from 'lucide-react';
import styles from './PropertiesModal.module.css';
import { Profile } from '../../types';

interface TagTemplate {
    id: string;
    name: string;
    color: string;
    tags: string[];
}

interface VisibleProps {
    notes: boolean;
    tags: boolean;
    proxy: boolean;
    specs: boolean;
    statusPill: boolean;
    osBadge: boolean;
    statusBadge: boolean;
}

interface PropertiesModalProps {
    profile: Profile | null;
    visibleProps: VisibleProps;
    tagTemplates: TagTemplate[];
    onClose: () => void;
    onUpdateVisibleProps: (props: VisibleProps) => void;
    onUpdateProfile: (profileId: string, data: any) => void;
    onSaveTagTemplates: (templates: TagTemplate[]) => void;
    onDeleteProfile?: (profileId: string) => void;
}

const PRESET_COLORS = ['#a78bfa', '#60a5fa', '#34d399', '#f87171', '#fb923c', '#facc15', '#f472b6', '#22d3ee'];

const PropertiesModal: React.FC<PropertiesModalProps> = ({
    profile,
    visibleProps,
    tagTemplates,
    onClose,
    onUpdateVisibleProps,
    onUpdateProfile,
    onSaveTagTemplates,
    onDeleteProfile
}) => {
    const [activeTab, setActiveTab] = useState<'global' | 'individual'>(profile ? 'individual' : 'global');
    const [templates, setTemplates] = useState<TagTemplate[]>(tagTemplates);
    const [editingTplId, setEditingTplId] = useState<string | null>(null);
    const [editingTpl, setEditingTpl] = useState<TagTemplate | null>(null);

    const toggle = (key: keyof VisibleProps) =>
        onUpdateVisibleProps({ ...visibleProps, [key]: !visibleProps[key] });

    const startEdit = (tpl: TagTemplate) => {
        setEditingTplId(tpl.id);
        setEditingTpl({ ...tpl, tags: [...tpl.tags] });
    };

    const saveEdit = () => {
        if (!editingTpl) return;
        const updated = templates.map(t => t.id === editingTpl.id ? editingTpl : t);
        setTemplates(updated);
        onSaveTagTemplates(updated);
        setEditingTplId(null);
        setEditingTpl(null);
    };

    const cancelEdit = () => { setEditingTplId(null); setEditingTpl(null); };

    const addTemplate = () => {
        const newTpl: TagTemplate = {
            id: `tpl_${Date.now()}`,
            name: 'Novo Template',
            color: '#a78bfa',
            tags: [],
        };
        const updated = [...templates, newTpl];
        setTemplates(updated);
        startEdit(newTpl);
    };

    const deleteTemplate = (id: string) => {
        const updated = templates.filter(t => t.id !== id);
        setTemplates(updated);
        onSaveTagTemplates(updated);
    };

    const updateEditTag = (raw: string) => {
        if (!editingTpl) return;
        setEditingTpl({ ...editingTpl, tags: raw.split(',').map(t => t.trim()).filter(Boolean) });
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <div className="flex items-center gap-3">
                        <div className={styles.iconBox}>
                            <Settings size={20} className="text-violet-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-100">Gerenciamento</h2>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Configurações & Propriedades</p>
                        </div>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'global' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('global')}>
                        <Layout size={16} />
                        Geral (Dashboard)
                    </button>
                    {profile && (
                        <button
                            className={`${styles.tab} ${activeTab === 'individual' ? styles.tabActive : ''}`}
                            onClick={() => setActiveTab('individual')}>
                            <Fingerprint size={16} />
                            Este Perfil
                        </button>
                    )}
                </div>

                <div className={styles.content}>
                    {activeTab === 'global' ? (
                        <>
                            {/* ── Visibilidade ── */}
                            <div className={styles.section}>
                                <h3 className={styles.sectionTitle}>Visibilidade nos Cards</h3>
                                <p className={styles.sectionDesc}>Escolha quais informações são exibidas em todos os perfis.</p>

                                <div className={styles.toggleList}>
                                    {([
                                        { key: 'statusPill',  label: 'Status Online/Pronto', hint: 'Indicador de conexão ativa' },
                                        { key: 'osBadge',     label: 'Sistema Operacional',  hint: 'Badge Win / Mac / Linux' },
                                        { key: 'statusBadge', label: 'Status do Perfil',     hint: 'Novo, Farming, Banido, etc. (clicável)' },
                                        { key: 'proxy',       label: 'Proxy',                hint: 'Endereço do servidor proxy' },
                                        { key: 'tags',        label: 'Tags',                 hint: 'Chips de tags com quick-add' },
                                        { key: 'notes',       label: 'Notas',                hint: 'Bloco de anotações expansível' },
                                    ] as { key: keyof VisibleProps; label: string; hint: string }[]).map(({ key, label, hint }) => (
                                        <div key={key} className={styles.toggleItem}>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-slate-200">{label}</span>
                                                <span className="text-[10px] text-slate-500">{hint}</span>
                                            </div>
                                            <button
                                                className={`${styles.toggleSwitch} ${visibleProps[key] ? styles.toggleSwitchOn : ''}`}
                                                onClick={() => toggle(key)}>
                                                <span className={styles.toggleThumb} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* ── Tag Templates ── */}
                            <div className={styles.section}>
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className={styles.sectionTitle} style={{ margin: 0 }}>Templates de Tags</h3>
                                    <button className={styles.addTplBtn} onClick={addTemplate}>
                                        <Plus size={13} /> Novo
                                    </button>
                                </div>
                                <p className={styles.sectionDesc}>Grupos de tags para aplicar rapidamente nos perfis.</p>

                                <div className={styles.tplList}>
                                    {templates.map(tpl => (
                                        <div key={tpl.id} className={styles.tplCard}>
                                            {editingTplId === tpl.id && editingTpl ? (
                                                <div className={styles.tplEditBody}>
                                                    <input
                                                        className={styles.tplInput}
                                                        value={editingTpl.name}
                                                        onChange={(e) => setEditingTpl({ ...editingTpl, name: e.target.value })}
                                                        placeholder="Nome do template"
                                                    />
                                                    <div className={styles.colorRow}>
                                                        {PRESET_COLORS.map(c => (
                                                            <div
                                                                key={c}
                                                                className={`${styles.colorDot} ${editingTpl.color === c ? styles.colorDotActive : ''}`}
                                                                style={{ background: c }}
                                                                onClick={() => setEditingTpl({ ...editingTpl, color: c })}
                                                            />
                                                        ))}
                                                    </div>
                                                    <input
                                                        className={styles.tplInput}
                                                        value={editingTpl.tags.join(', ')}
                                                        onChange={(e) => updateEditTag(e.target.value)}
                                                        placeholder="tag1, tag2, tag3..."
                                                    />
                                                    <div className={styles.tplEditActions}>
                                                        <button className={styles.tplSaveBtn} onClick={saveEdit}>
                                                            <Save size={13} /> Salvar
                                                        </button>
                                                        <button className={styles.tplCancelBtn} onClick={cancelEdit}>Cancelar</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className={styles.tplViewBody}>
                                                    <div className={styles.tplHeader}>
                                                        <span className={styles.tplColorBar} style={{ background: tpl.color }} />
                                                        <span className={styles.tplName}>{tpl.name}</span>
                                                        <div className={styles.tplActions}>
                                                            <button className={styles.tplActionBtn} onClick={() => startEdit(tpl)} title="Editar">
                                                                <Edit2 size={12} />
                                                            </button>
                                                            <button className={`${styles.tplActionBtn} ${styles.tplDeleteBtn}`} onClick={() => deleteTemplate(tpl.id)} title="Excluir">
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className={styles.tplTags}>
                                                        {tpl.tags.map(t => (
                                                            <span key={t} className={styles.tplTagChip} style={{ borderColor: tpl.color + '44', color: tpl.color }}>
                                                                {t}
                                                            </span>
                                                        ))}
                                                        {tpl.tags.length === 0 && <span className={styles.tplEmpty}>Sem tags definidas</span>}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        profile && (
                            <div className={styles.profileContent}>
                                <div className={styles.fieldGroup}>
                                    <label>Nome do Perfil</label>
                                    <input
                                        type="text"
                                        value={profile.name}
                                        onChange={(e) => onUpdateProfile(profile.id, { name: e.target.value })}
                                    />
                                </div>

                                <div className={styles.fieldGroup}>
                                    <label>Tags (separadas por vírgula)</label>
                                    <div className={styles.inputIcon}>
                                        <Tag size={14} />
                                        <input
                                            type="text"
                                            placeholder="ex: ads, social, farm"
                                            value={profile.tags || ''}
                                            onChange={(e) => onUpdateProfile(profile.id, { tags: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className={styles.fieldGroup}>
                                    <label>Anotações</label>
                                    <textarea
                                        rows={4}
                                        placeholder="Observações importantes..."
                                        value={(() => {
                                            if (!profile.notes) return '';
                                            try {
                                                const parsed = JSON.parse(profile.notes);
                                                if (Array.isArray(parsed)) {
                                                    return parsed.map((n: {title: string; content: string}) =>
                                                        n.title ? `[${n.title}]\n${n.content}` : n.content
                                                    ).join('\n\n');
                                                }
                                            } catch { /* not JSON */ }
                                            return profile.notes;
                                        })()}
                                        readOnly
                                    />
                                </div>

                                <div className={styles.techGrid}>
                                    <div className={styles.techCard}>
                                        <span>Plataforma</span>
                                        <p>{profile.fingerprint?.platform || 'Unknown'}</p>
                                    </div>
                                    <div className={styles.techCard}>
                                        <span>Navegador</span>
                                        <p>Chrome {profile.fingerprint.user_agent?.match(/Chrome\/(\d+)/)?.[1] || '?'}</p>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <button
                                        className={styles.deleteBtn}
                                        onClick={() => {
                                            if (onDeleteProfile) { onDeleteProfile(profile.id); onClose(); }
                                        }}>
                                        <Trash2 size={16} />
                                        Excluir este Perfil
                                    </button>
                                </div>
                            </div>
                        )
                    )}
                </div>

                <div className={styles.footer}>
                    <button className={styles.primaryBtn} onClick={onClose}>Concluir</button>
                </div>
            </div>
        </div>
    );
};

export default PropertiesModal;
