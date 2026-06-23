import React, { useState, useEffect } from 'react';
import { X, Layers, Trash2, Play, Plus, ChevronRight, Hash } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import styles from './TemplatesModal.module.css';

interface Template {
    id: string;
    name: string;
    description: string | null;
    platform: string;
    tags: string | null;
    created_at: string;
}

interface Props {
    onClose: () => void;
    onProfilesCreated: () => void;
}

const PLATFORM_LABELS: Record<string, string> = {
    windows: 'Windows',
    macos: 'macOS',
    linux: 'Linux',
};

const TemplatesModal: React.FC<Props> = ({ onClose, onProfilesCreated }) => {
    const { toast } = useToast();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Template | null>(null);
    const [baseName, setBaseName] = useState('');
    const [count, setCount] = useState(1);
    const [creating, setCreating] = useState(false);

    useEffect(() => { loadTemplates(); }, []);

    const loadTemplates = async () => {
        setLoading(true);
        const res = await window.api.templates.list();
        if (res.success) setTemplates(res.data as Template[]);
        setLoading(false);
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const res = await window.api.templates.delete(id);
        if (res.success) {
            toast.success('Template removido');
            setTemplates(prev => prev.filter(t => t.id !== id));
            if (selected?.id === id) setSelected(null);
        } else {
            toast.error('Erro ao remover template');
        }
    };

    const handleCreate = async () => {
        if (!selected || !baseName.trim()) return;
        setCreating(true);
        try {
            const res = await window.api.templates.bulkCreate(selected.id, baseName.trim(), count);
            if (res.success) {
                const created = (res.data as any[]).length;
                toast.success(`${created} perfil${created > 1 ? 's' : ''} criado${created > 1 ? 's' : ''} com sucesso`);
                onProfilesCreated();
                onClose();
            } else {
                toast.error('Erro ao criar perfis');
            }
        } catch {
            toast.error('Erro ao criar perfis');
        } finally {
            setCreating(false);
        }
    };

    const formatDate = (iso: string) => {
        try { return new Date(iso).toLocaleDateString('pt-BR'); } catch { return iso; }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>

                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <div className={styles.headerIcon}>
                            <Layers size={16} />
                        </div>
                        <div>
                            <h2 className={styles.title}>Templates de Perfil</h2>
                            <p className={styles.subtitle}>Crie perfis em massa a partir de um preset salvo</p>
                        </div>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}><X size={16} /></button>
                </div>

                <div className={styles.body}>
                    <div className={styles.listPane}>
                        <p className={styles.paneLabel}>{templates.length} template{templates.length !== 1 ? 's' : ''}</p>

                        {loading && <p className={styles.empty}>Carregando...</p>}

                        {!loading && templates.length === 0 && (
                            <div className={styles.emptyState}>
                                <Layers size={32} className={styles.emptyIcon} />
                                <p>Nenhum template salvo</p>
                                <span>Clique com o botão direito em um perfil e selecione "Salvar como Template"</span>
                            </div>
                        )}

                        {templates.map(t => (
                            <button
                                key={t.id}
                                className={`${styles.templateCard} ${selected?.id === t.id ? styles.templateCardActive : ''}`}
                                onClick={() => { setSelected(t); setBaseName(t.name); }}>
                                <div className={styles.templateInfo}>
                                    <p className={styles.templateName}>{t.name}</p>
                                    <div className={styles.templateMeta}>
                                        <span className={styles.metaBadge}>{PLATFORM_LABELS[t.platform] || t.platform}</span>
                                        {t.tags && t.tags.split(',').slice(0, 2).map(tag => (
                                            <span key={tag} className={styles.tagBadge}><Hash size={9} />{tag.trim()}</span>
                                        ))}
                                        <span className={styles.metaDate}>{formatDate(t.created_at)}</span>
                                    </div>
                                    {t.description && <p className={styles.templateDesc}>{t.description}</p>}
                                </div>
                                <div className={styles.templateActions}>
                                    {selected?.id === t.id && <ChevronRight size={14} className={styles.chevron} />}
                                    <button className={styles.deleteBtn} onClick={e => handleDelete(t.id, e)} title="Remover template">
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className={styles.configPane}>
                        {!selected ? (
                            <div className={styles.emptyConfig}>
                                <Layers size={28} className={styles.emptyIcon} />
                                <p>Selecione um template</p>
                                <span>para configurar a criação em massa</span>
                            </div>
                        ) : (
                            <>
                                <p className={styles.paneLabel}>Configurar criação</p>

                                <div className={styles.field}>
                                    <label className={styles.fieldLabel}>Nome base do perfil</label>
                                    <input
                                        className={styles.input}
                                        value={baseName}
                                        onChange={e => setBaseName(e.target.value)}
                                        placeholder="ex: Conta Facebook"
                                    />
                                    {count > 1 && (
                                        <p className={styles.fieldHint}>Os perfis serão nomeados: {baseName} 1, {baseName} 2, ...</p>
                                    )}
                                </div>

                                <div className={styles.field}>
                                    <label className={styles.fieldLabel}>Quantidade de perfis</label>
                                    <div className={styles.countRow}>
                                        <button className={styles.countBtn} onClick={() => setCount(c => Math.max(1, c - 1))}>−</button>
                                        <input
                                            className={styles.countInput}
                                            type="number"
                                            min={1}
                                            max={200}
                                            value={count}
                                            onChange={e => setCount(Math.max(1, Math.min(200, parseInt(e.target.value) || 1)))}
                                        />
                                        <button className={styles.countBtn} onClick={() => setCount(c => Math.min(200, c + 1))}>+</button>
                                    </div>
                                </div>

                                <div className={styles.previewBox}>
                                    <p className={styles.previewLabel}>Template selecionado</p>
                                    <p className={styles.previewName}>{selected.name}</p>
                                    <p className={styles.previewDetail}>{PLATFORM_LABELS[selected.platform]} • {count} perfil{count > 1 ? 's' : ''} será{count > 1 ? 'ão' : ''} criado{count > 1 ? 's' : ''}</p>
                                </div>

                                <button
                                    className={styles.createBtn}
                                    onClick={handleCreate}
                                    disabled={!baseName.trim() || creating}>
                                    {creating
                                        ? 'Criando...'
                                        : <><Play size={13} /> Criar {count} Perfil{count > 1 ? 's' : ''}</>}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TemplatesModal;
