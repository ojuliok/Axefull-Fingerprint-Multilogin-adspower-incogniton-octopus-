import React, { useState } from 'react';
import { X, Settings, Fingerprint, Globe, RotateCw, Plus, Trash2, AlertTriangle } from 'lucide-react';
import styles from './ProfileEditor.module.css';
import { Profile } from '../../../types';
import { useToast } from '../../../context/ToastContext';

interface ProfileEditorProps {
    profile: Profile;
    onClose: () => void;
    onSave: (profile: Profile) => void;
}

const ProfileEditor: React.FC<ProfileEditorProps> = ({ profile, onClose, onSave }) => {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<'general' | 'fingerprint' | 'proxy'>('general');
    const [regenConfirm, setRegenConfirm] = useState(false);
    const [name, setName] = useState(profile.name);
    const [tags, setTags] = useState<string[]>(() => {
        if (!profile.tags) return [];
        return profile.tags.split(',').map(t => t.trim()).filter(t => t !== '');
    });
    const [newTag, setNewTag] = useState('');
    const [loading, setLoading] = useState(false);

    // Multiple Notes Logic
    const [notesList, setNotesList] = useState<{title: string, content: string}[]>(() => {
        try {
            const parsed = JSON.parse(profile.notes || '[]');
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            return [{ title: 'Notas', content: profile.notes || '' }];
        } catch {
            return [{ title: 'Notas', content: profile.notes || '' }];
        }
    });

    // Proxy state
    const [proxyEnabled, setProxyEnabled] = useState(!!profile.proxy);
    const [proxyType, setProxyType] = useState(profile.proxy?.type || 'http');
    const [proxyHost, setProxyHost] = useState(profile.proxy?.host || '');
    const [proxyPort, setProxyPort] = useState(profile.proxy?.port?.toString() || '8080');
    const [proxyUsername, setProxyUsername] = useState(profile.proxy?.username || '');
    const [proxyPassword, setProxyPassword] = useState(profile.proxy?.password || '');

    const handleSave = async () => {
        setLoading(true);
        try {
            // Update profile info with multiple notes serialized as JSON and tags
            await window.api.profiles.update(profile.id, { 
                name, 
                notes: JSON.stringify(notesList),
                tags: tags.join(', ')
            });

            // Update proxy
            if (proxyEnabled) {
                await window.api.profiles.updateProxy(profile.id, {
                    type: proxyType as 'http' | 'https' | 'socks4' | 'socks5',
                    host: proxyHost,
                    port: parseInt(proxyPort),
                    username: proxyUsername || undefined,
                    password: proxyPassword || undefined,
                });
            } else {
                await window.api.profiles.updateProxy(profile.id, null);
            }

            onSave({ ...profile, name, notes: JSON.stringify(notesList), tags: tags.join(', ') });
        } catch (error) {
            console.error('Error saving profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRegenerateFingerprint = async () => {
        if (!regenConfirm) { setRegenConfirm(true); return; }
        setRegenConfirm(false);
        try {
            await window.api.profiles.regenerateFingerprint(profile.id);
            toast.success('Fingerprint regenerado', 'Nova identidade aplicada ao perfil.');
            onSave(profile);
        } catch (error) {
            toast.error('Erro ao regenerar fingerprint', String(error));
        }
    };

    const addNote = () => {
        setNotesList([...notesList, { title: 'Nova Nota', content: '' }]);
    };

    const removeNote = (index: number) => {
        if (notesList.length <= 1) {
            setNotesList([{ title: 'Notas', content: '' }]);
            return;
        }
        const newList = [...notesList];
        newList.splice(index, 1);
        setNotesList(newList);
    };

    const updateNote = (index: number, field: 'title' | 'content', value: string) => {
        const newList = [...notesList];
        newList[index][field] = value;
        setNotesList(newList);
    };

    const addTag = (e?: React.FormEvent) => {
        e?.preventDefault();
        const trimmed = newTag.trim();
        if (trimmed && !tags.includes(trimmed)) {
            setTags([...tags, trimmed]);
            setNewTag('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    const handleTagKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            addTag();
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <div className={styles.headerTitle}>
                        <h2>Editar Perfil</h2>
                        <p>Configurações de Identidade e Rede</p>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.tabs}>
                    <button 
                        className={`${styles.tab} ${activeTab === 'general' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('general')}>
                        <Settings size={18} /> Geral
                    </button>
                    <button 
                        className={`${styles.tab} ${activeTab === 'fingerprint' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('fingerprint')}>
                        <Fingerprint size={18} /> Fingerprint
                    </button>
                    <button 
                        className={`${styles.tab} ${activeTab === 'proxy' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('proxy')}>
                        <Globe size={18} /> Proxy
                    </button>
                </div>

                <div className={styles.content}>
                    {activeTab === 'general' && (
                        <div className={styles.formSection}>
                            <div className={styles.fieldGroup}>
                                <label>Nome do Navegador</label>
                                <input 
                                    type="text" 
                                    className={styles.inputField}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ex: Conta Principal 01"
                                />
                            </div>

                            <div className={styles.fieldGroup}>
                                <label>Tags de Identificação</label>
                                <div className={styles.tagsContainer}>
                                    <div className={styles.tagsList}>
                                        {tags.map((tag, idx) => (
                                            <span key={idx} className={styles.tagChip}>
                                                {tag}
                                                <button onClick={() => removeTag(tag)} className={styles.removeTagBtn}>
                                                    <X size={10} />
                                                </button>
                                            </span>
                                        ))}
                                        {tags.length === 0 && <span className="text-[10px] text-slate-600 italic">Nenhuma tag adicionada</span>}
                                    </div>
                                    <div className={styles.tagInputWrapper}>
                                        <input 
                                            type="text" 
                                            className={styles.tagInput}
                                            value={newTag}
                                            onChange={(e) => setNewTag(e.target.value)}
                                            onKeyDown={handleTagKeyDown}
                                            placeholder="Nova tag..."
                                        />
                                        <button className={styles.tagAddBtn} onClick={addTag}>
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.fieldGroup}>
                                <label>Blocos de Notas</label>
                                <div className={styles.notesWrapper}>
                                    {notesList.map((note, index) => (
                                        <div key={index} className={styles.noteItem}>
                                            <div className={styles.noteHeader}>
                                                <input 
                                                    className={styles.noteTitleInput}
                                                    value={note.title}
                                                    onChange={(e) => updateNote(index, 'title', e.target.value)}
                                                />
                                                <button className={styles.removeNoteBtn} onClick={() => removeNote(index)}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                            <textarea 
                                                className={styles.inputField}
                                                rows={3}
                                                value={note.content}
                                                onChange={(e) => updateNote(index, 'content', e.target.value)}
                                                placeholder="Escreva suas anotações aqui..."
                                            />
                                        </div>
                                    ))}
                                    <button className={styles.addNoteBtn} onClick={addNote}>
                                        <Plus size={16} /> Adicionar Seção de Notas
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'fingerprint' && (
                        <div className={styles.formSection}>
                            <div className={styles.fingerprintGrid}>
                                <div className={styles.fingerprintCard}>
                                    <span>Plataforma</span>
                                    <p>{profile.fingerprint?.platform || 'Unknown'}</p>
                                </div>
                                <div className={styles.fingerprintCard}>
                                    <span>Navegador</span>
                                    <p>Chrome {profile.fingerprint?.user_agent?.match(/Chrome\/(\d+)/)?.[1] || '?'}</p>
                                </div>
                                <div className={styles.fingerprintCard}>
                                    <span>Timezone</span>
                                    <p>{profile.fingerprint?.timezone || 'UTC'}</p>
                                </div>
                                <div className={styles.fingerprintCard}>
                                    <span>Idioma</span>
                                    <p>{profile.fingerprint?.language || 'en-US'}</p>
                                </div>
                                <div className={styles.fingerprintCard}>
                                    <span>Resolução</span>
                                    <p>{profile.fingerprint ? `${profile.fingerprint.screen_width}x${profile.fingerprint.screen_height}` : '1920x1080'}</p>
                                </div>
                                <div className={styles.fingerprintCard}>
                                    <span>Hardware</span>
                                    <p>{profile.fingerprint?.hardware_concurrency || '4'} Núcleos · {profile.fingerprint?.device_memory || '8'}GB</p>
                                </div>
                                <div className={styles.fingerprintCard}>
                                    <span>WebRTC</span>
                                    <p>{profile.fingerprint?.webrtc_mode || 'fake'}</p>
                                </div>
                                <div className={styles.fingerprintCard}>
                                    <span>Canvas Noise</span>
                                    <p>{profile.fingerprint?.canvas_noise_seed ? `Seed #${profile.fingerprint.canvas_noise_seed}` : '—'}</p>
                                </div>
                            </div>

                            {regenConfirm ? (
                                <div style={{ marginTop:20, padding:'14px 18px', background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:14, display:'flex', alignItems:'center', gap:12 }}>
                                    <AlertTriangle size={16} style={{ color:'#fbbf24', flexShrink:0 }} />
                                    <div style={{ flex:1 }}>
                                        <p style={{ fontSize:13, fontWeight:600, color:'#fbbf24', margin:'0 0 2px' }}>Confirmar regeneração?</p>
                                        <p style={{ fontSize:11, color:'#92400e', margin:0 }}>Isso substituirá o fingerprint atual. Sessões ativas podem ser afetadas.</p>
                                    </div>
                                    <div style={{ display:'flex', gap:8 }}>
                                        <button onClick={() => setRegenConfirm(false)} style={{ padding:'6px 12px', borderRadius:8, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)', color:'#64748b', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                                            Cancelar
                                        </button>
                                        <button onClick={handleRegenerateFingerprint} style={{ padding:'6px 14px', borderRadius:8, background:'rgba(245,158,11,0.2)', border:'1px solid rgba(245,158,11,0.4)', color:'#fbbf24', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                                            Confirmar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button className={styles.regenerateBtn} onClick={handleRegenerateFingerprint}>
                                    <RotateCw size={16} /> Regenerar Fingerprint
                                </button>
                            )}
                        </div>
                    )}

                    {activeTab === 'proxy' && (
                        <div className={styles.formSection}>
                            <div className={styles.toggleWrapper}>
                                <div className={styles.toggleText}>
                                    <h4>Habilitar Proxy</h4>
                                    <p>Rotear todo o tráfego através de um servidor seguro.</p>
                                </div>
                                <label className={styles.switch}>
                                    <input 
                                        type="checkbox" 
                                        checked={proxyEnabled}
                                        onChange={() => setProxyEnabled(!proxyEnabled)}
                                    />
                                    <span className={styles.slider}></span>
                                </label>
                            </div>

                            {proxyEnabled && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className={styles.fieldGroup}>
                                        <label>Tipo de Conexão</label>
                                        <select 
                                            className={styles.inputField}
                                            value={proxyType}
                                            onChange={(e) => setProxyType(e.target.value)}
                                        >
                                            <option value="http">HTTP / HTTPS</option>
                                            <option value="socks4">SOCKS 4</option>
                                            <option value="socks5">SOCKS 5</option>
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-4 gap-3">
                                        <div className="col-span-3">
                                            <div className={styles.fieldGroup}>
                                                <label>Host / IP</label>
                                                <input 
                                                    type="text" 
                                                    className={styles.inputField}
                                                    value={proxyHost}
                                                    onChange={(e) => setProxyHost(e.target.value)}
                                                    placeholder="proxy.servidor.com"
                                                />
                                            </div>
                                        </div>
                                        <div className="col-span-1">
                                            <div className={styles.fieldGroup}>
                                                <label>Porta</label>
                                                <input 
                                                    type="text" 
                                                    className={styles.inputField}
                                                    value={proxyPort}
                                                    onChange={(e) => setProxyPort(e.target.value)}
                                                    placeholder="8080"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className={styles.fieldGroup}>
                                            <label>Usuário</label>
                                            <input 
                                                type="text" 
                                                className={styles.inputField}
                                                value={proxyUsername}
                                                onChange={(e) => setProxyUsername(e.target.value)}
                                                placeholder="Opcional"
                                            />
                                        </div>
                                        <div className={styles.fieldGroup}>
                                            <label>Senha</label>
                                            <input 
                                                type="password" 
                                                className={styles.inputField}
                                                value={proxyPassword}
                                                onChange={(e) => setProxyPassword(e.target.value)}
                                                placeholder="Opcional"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className={styles.footer}>
                    <button className={styles.cancelBtn} onClick={onClose}>
                        Cancelar
                    </button>
                    <button 
                        className={styles.saveBtn} 
                        onClick={handleSave}
                        disabled={loading}
                    >
                        {loading ? 'Sincronizando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfileEditor;
