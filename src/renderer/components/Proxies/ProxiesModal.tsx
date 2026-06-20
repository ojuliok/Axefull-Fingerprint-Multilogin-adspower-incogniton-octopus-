import React, { useState, useEffect, useCallback } from 'react';
import { Network, RefreshCw, Trash2, CheckCircle2, XCircle, Loader2, Globe, Edit3, X, Plus, Upload, LinkIcon } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { Profile } from '../types';
import styles from './ProxiesModal.module.css';
interface ProxyEntry {
    profileId: string;
    profileName: string;
    proxy: {
        id?: string;
        type: 'http' | 'https' | 'socks4' | 'socks5';
        host: string;
        port: number;
        username?: string;
        password?: string;
    };
    testState: 'idle' | 'testing' | 'ok' | 'fail';
    testResult?: { ip?: string; latency?: number; error?: string };
}

interface EditState {
    profileId: string;
    type: 'http' | 'https' | 'socks4' | 'socks5';
    host: string;
    port: string;
    username: string;
    password: string;
}

interface PoolEntry {
    id: string;
    label: string | null;
    type: 'http' | 'https' | 'socks4' | 'socks5';
    host: string;
    port: number;
    username: string | null;
    password: string | null;
    last_status: 'ok' | 'failed' | 'untested';
    last_latency_ms: number | null;
    assigned_profile_id: string | null;
    testState?: 'idle' | 'testing';
}

const TYPE_COLORS: Record<string, string> = {
    http:   'text-blue-400 bg-blue-500/10 border-blue-500/20',
    https:  'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    socks4: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    socks5: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
};

const ProxiesModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { toast } = useToast();
    const [tab, setTab] = useState<'profiles' | 'pool'>('profiles');

    // ── Per-profile state ──
    const [entries, setEntries] = useState<ProxyEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [editState, setEditState] = useState<EditState | null>(null);
    const [saving, setSaving] = useState(false);

    // ── Pool state ──
    const [pool, setPool] = useState<PoolEntry[]>([]);
    const [poolLoading, setPoolLoading] = useState(false);
    const [showBulkImport, setShowBulkImport] = useState(false);
    const [bulkText, setBulkText] = useState('');
    const [importing, setImporting] = useState(false);
    const [allProfiles, setAllProfiles] = useState<Profile[]>([]);

    // ── Load per-profile proxies ──
    const loadProxies = useCallback(async () => {
        setLoading(true);
        try {
            const res = await window.api.profiles.list();
            if (res.success && Array.isArray(res.data)) {
                const profiles = res.data as Profile[];
                setAllProfiles(profiles.filter(p => p.category !== 'trash'));
                const withProxy = profiles
                    .filter(p => p.proxy && p.category !== 'trash')
                    .map(p => ({ profileId: p.id, profileName: p.name, proxy: p.proxy!, testState: 'idle' as const }));
                setEntries(withProxy);
            }
        } catch {
            toast.error('Erro ao carregar proxies');
        } finally {
            setLoading(false);
        }
    }, [toast]);

    // ── Load pool ──
    const loadPool = useCallback(async () => {
        setPoolLoading(true);
        try {
            const res = await window.api.proxyPool.list();
            if (res.success) setPool(res.data as PoolEntry[]);
        } catch {
            toast.error('Erro ao carregar pool');
        } finally {
            setPoolLoading(false);
        }
    }, [toast]);

    useEffect(() => { loadProxies(); }, [loadProxies]);
    useEffect(() => { if (tab === 'pool') loadPool(); }, [tab, loadPool]);

    // ── Per-profile actions ──
    const handleTest = async (profileId: string) => {
        const entry = entries.find(e => e.profileId === profileId);
        if (!entry) return;
        setEntries(prev => prev.map(e => e.profileId === profileId ? { ...e, testState: 'testing', testResult: undefined } : e));
        try {
            const res = await window.api.browser.testProxy(entry.proxy as any);
            const result = res.data as any;
            if (result?.ok) {
                setEntries(prev => prev.map(e => e.profileId === profileId
                    ? { ...e, testState: 'ok', testResult: { ip: result.ip, latency: result.latency } } : e));
            } else {
                setEntries(prev => prev.map(e => e.profileId === profileId
                    ? { ...e, testState: 'fail', testResult: { error: result?.error || 'Falha na conexão' } } : e));
            }
        } catch {
            setEntries(prev => prev.map(e => e.profileId === profileId
                ? { ...e, testState: 'fail', testResult: { error: 'Erro ao testar' } } : e));
        }
    };

    const handleRemove = async (profileId: string) => {
        try {
            await window.api.profiles.updateProxy(profileId, null);
            setEntries(prev => prev.filter(e => e.profileId !== profileId));
            toast.success('Proxy removido');
        } catch { toast.error('Erro ao remover proxy'); }
    };

    const openEdit = (entry: ProxyEntry) => {
        setEditState({ profileId: entry.profileId, type: entry.proxy.type, host: entry.proxy.host, port: String(entry.proxy.port), username: entry.proxy.username || '', password: entry.proxy.password || '' });
    };

    const handleSaveEdit = async () => {
        if (!editState) return;
        setSaving(true);
        try {
            await window.api.profiles.updateProxy(editState.profileId, { type: editState.type, host: editState.host, port: parseInt(editState.port, 10), username: editState.username || undefined, password: editState.password || undefined });
            toast.success('Proxy atualizado');
            setEditState(null);
            await loadProxies();
        } catch { toast.error('Erro ao salvar proxy'); }
        finally { setSaving(false); }
    };

    const handleTestAll = async () => { for (const entry of entries) await handleTest(entry.profileId); };

    // ── Pool actions ──
    const handlePoolTest = async (id: string) => {
        setPool(prev => prev.map(p => p.id === id ? { ...p, testState: 'testing' } : p));
        try {
            const res = await window.api.proxyPool.test(id);
            await loadPool();
            if (!(res.data as any)?.ok) toast.error('Proxy falhou no teste');
        } catch { toast.error('Erro ao testar proxy'); setPool(prev => prev.map(p => p.id === id ? { ...p, testState: 'idle' } : p)); }
    };

    const handlePoolTestAll = async () => {
        for (const entry of pool) await handlePoolTest(entry.id);
    };

    const handlePoolRemove = async (id: string) => {
        await window.api.proxyPool.remove(id);
        setPool(prev => prev.filter(p => p.id !== id));
        toast.success('Proxy removido do pool');
    };

    const handlePoolAssign = async (proxyId: string, profileId: string) => {
        const res = await window.api.proxyPool.assign(proxyId, profileId);
        if (res.success) { toast.success('Proxy atribuído'); loadPool(); }
        else toast.error('Erro ao atribuir');
    };

    const handlePoolUnassign = async (proxyId: string) => {
        await window.api.proxyPool.unassign(proxyId);
        loadPool();
    };

    const handleBulkImport = async () => {
        if (!bulkText.trim()) return;
        setImporting(true);
        try {
            const res = await window.api.proxyPool.bulkImport(bulkText);
            if (res.success) {
                const count = (res.data as any[]).length;
                toast.success(`${count} ${count === 1 ? 'proxy importado' : 'proxies importados'}`);
                setBulkText('');
                setShowBulkImport(false);
                loadPool();
            } else { toast.error('Erro ao importar'); }
        } catch { toast.error('Erro ao importar'); }
        finally { setImporting(false); }
    };

    const profileName = (id: string | null) => {
        if (!id) return null;
        return allProfiles.find(p => p.id === id)?.name ?? id.slice(0, 8);
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <div className={styles.headerIcon}><Network size={20} className="text-violet-400" /></div>
                        <div>
                            <h1 className={styles.title}>Gerenciador de Proxies</h1>
                            <p className={styles.subtitle}>
                                {tab === 'profiles'
                                    ? (loading ? 'Carregando...' : `${entries.length} ${entries.length === 1 ? 'proxy configurado' : 'proxies configurados'}`)
                                    : `${pool.length} ${pool.length === 1 ? 'proxy no pool' : 'proxies no pool'}`}
                            </p>
                        </div>
                    </div>
                    <div className={styles.headerActions}>
                        {tab === 'profiles' && entries.length > 0 && (
                            <button className={styles.testAllBtn} onClick={handleTestAll}><RefreshCw size={14} /> Testar Todos</button>
                        )}
                        {tab === 'pool' && (
                            <>
                                {pool.length > 0 && <button className={styles.testAllBtn} onClick={handlePoolTestAll}><RefreshCw size={14} /> Testar Todos</button>}
                                <button className={styles.testAllBtn} onClick={() => setShowBulkImport(true)}><Upload size={14} /> Importar</button>
                            </>
                        )}
                        <button className={styles.refreshBtn} onClick={tab === 'profiles' ? loadProxies : loadPool}><RefreshCw size={14} /></button>
                        <button className={styles.refreshBtn} onClick={onClose} title="Fechar"><X size={16} /></button>
                    </div>
                </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                <button className={`${styles.tabBtn} ${tab === 'profiles' ? styles.tabBtnActive : ''}`} onClick={() => setTab('profiles')}>
                    Por Perfil <span className={styles.tabCount}>{entries.length}</span>
                </button>
                <button className={`${styles.tabBtn} ${tab === 'pool' ? styles.tabBtnActive : ''}`} onClick={() => setTab('pool')}>
                    Pool de Proxies <span className={styles.tabCount}>{pool.length}</span>
                </button>
            </div>

            <div className={styles.body}>
                {/* ── Per-profile tab ── */}
                {tab === 'profiles' && (
                    loading ? (
                        <div className={styles.emptyState}><Loader2 size={32} className="animate-spin text-slate-600" /><p>Carregando proxies...</p></div>
                    ) : entries.length === 0 ? (
                        <div className={styles.emptyState}>
                            <Globe size={48} className="text-slate-700 mb-4" />
                            <h3 className="text-slate-400 font-semibold text-base mb-1">Nenhum proxy configurado</h3>
                            <p className="text-slate-600 text-sm">Edite um perfil para adicionar um proxy a ele.</p>
                        </div>
                    ) : (
                        <div className={styles.table}>
                            <div className={styles.tableHead}>
                                <span>Perfil</span><span>Tipo</span><span>Endereço</span><span>Usuário</span><span>Status</span><span>Ações</span>
                            </div>
                            {entries.map(entry => (
                                <div key={entry.profileId} className={styles.tableRow}>
                                    <div className={styles.cellProfile}>
                                        <div className={styles.profileAvatar}>{entry.profileName.charAt(0).toUpperCase()}</div>
                                        <span className={styles.profileName}>{entry.profileName}</span>
                                    </div>
                                    <div className={styles.cellType}>
                                        <span className={`${styles.typeBadge} ${TYPE_COLORS[entry.proxy.type] || ''}`}>{entry.proxy.type.toUpperCase()}</span>
                                    </div>
                                    <div className={styles.cellAddress}>
                                        <span className={styles.host}>{entry.proxy.host}</span>
                                        <span className={styles.port}>:{entry.proxy.port}</span>
                                    </div>
                                    <div className={styles.cellUser}>{entry.proxy.username || <span className="text-slate-700">—</span>}</div>
                                    <div className={styles.cellStatus}>
                                        {entry.testState === 'idle' && <span className={styles.statusIdle}>Não testado</span>}
                                        {entry.testState === 'testing' && <span className={styles.statusTesting}><Loader2 size={12} className="animate-spin" /> Testando...</span>}
                                        {entry.testState === 'ok' && <span className={styles.statusOk}><CheckCircle2 size={12} />{entry.testResult?.ip && <span>{entry.testResult.ip}</span>}{entry.testResult?.latency && <span className="text-slate-500">{entry.testResult.latency}ms</span>}</span>}
                                        {entry.testState === 'fail' && <span className={styles.statusFail}><XCircle size={12} /> {entry.testResult?.error || 'Falhou'}</span>}
                                    </div>
                                    <div className={styles.cellActions}>
                                        <button className={styles.actionBtn} onClick={() => handleTest(entry.profileId)} disabled={entry.testState === 'testing'} title="Testar"><RefreshCw size={13} /></button>
                                        <button className={styles.actionBtn} onClick={() => openEdit(entry)} title="Editar"><Edit3 size={13} /></button>
                                        <button className={`${styles.actionBtn} ${styles.actionDanger}`} onClick={() => handleRemove(entry.profileId)} title="Remover"><Trash2 size={13} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}

                {/* ── Pool tab ── */}
                {tab === 'pool' && (
                    poolLoading ? (
                        <div className={styles.emptyState}><Loader2 size={32} className="animate-spin text-slate-600" /><p>Carregando pool...</p></div>
                    ) : pool.length === 0 ? (
                        <div className={styles.emptyState}>
                            <Globe size={48} className="text-slate-700 mb-4" />
                            <h3 className="text-slate-400 font-semibold text-base mb-1">Pool vazio</h3>
                            <p className="text-slate-600 text-sm mb-4">Importe proxies em massa para gerenciá-los aqui.</p>
                            <button className={styles.testAllBtn} onClick={() => setShowBulkImport(true)}><Upload size={14} /> Importar Proxies</button>
                        </div>
                    ) : (
                        <div className={styles.table}>
                            <div className={styles.tableHead}>
                                <span>Label / Endereço</span><span>Tipo</span><span>Usuário</span><span>Status</span><span>Atribuído a</span><span>Ações</span>
                            </div>
                            {pool.map(entry => (
                                <div key={entry.id} className={styles.tableRow}>
                                    <div className={styles.cellProfile}>
                                        <div className={styles.profileAvatar} style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>P</div>
                                        <div>
                                            {entry.label && <span className={styles.profileName}>{entry.label}</span>}
                                            <span className={`${styles.host} ${entry.label ? 'text-slate-600 text-xs' : ''}`}>{entry.host}:{entry.port}</span>
                                        </div>
                                    </div>
                                    <div className={styles.cellType}>
                                        <span className={`${styles.typeBadge} ${TYPE_COLORS[entry.type] || ''}`}>{entry.type.toUpperCase()}</span>
                                    </div>
                                    <div className={styles.cellUser}>{entry.username || <span className="text-slate-700">—</span>}</div>
                                    <div className={styles.cellStatus}>
                                        {entry.testState === 'testing' && <span className={styles.statusTesting}><Loader2 size={12} className="animate-spin" /> Testando...</span>}
                                        {entry.testState !== 'testing' && entry.last_status === 'untested' && <span className={styles.statusIdle}>Não testado</span>}
                                        {entry.testState !== 'testing' && entry.last_status === 'ok' && <span className={styles.statusOk}><CheckCircle2 size={12} />{entry.last_latency_ms && <span className="text-slate-500">{entry.last_latency_ms}ms</span>}</span>}
                                        {entry.testState !== 'testing' && entry.last_status === 'failed' && <span className={styles.statusFail}><XCircle size={12} /> Falhou</span>}
                                    </div>
                                    <div className={styles.cellUser}>
                                        {entry.assigned_profile_id ? (
                                            <span className={styles.assignedBadge} title={entry.assigned_profile_id}>
                                                <LinkIcon size={10} /> {profileName(entry.assigned_profile_id)}
                                            </span>
                                        ) : (
                                            <select className={styles.assignSelect} defaultValue="" onChange={e => { if (e.target.value) handlePoolAssign(entry.id, e.target.value); }}>
                                                <option value="" disabled>Atribuir...</option>
                                                {allProfiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                        )}
                                    </div>
                                    <div className={styles.cellActions}>
                                        <button className={styles.actionBtn} onClick={() => handlePoolTest(entry.id)} title="Testar"><RefreshCw size={13} /></button>
                                        {entry.assigned_profile_id && <button className={styles.actionBtn} onClick={() => handlePoolUnassign(entry.id)} title="Remover atribuição"><X size={13} /></button>}
                                        <button className={`${styles.actionBtn} ${styles.actionDanger}`} onClick={() => handlePoolRemove(entry.id)} title="Remover"><Trash2 size={13} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>

            {/* ── Edit Modal ── */}
            {editState && (
                <div className={styles.editOverlay} onClick={() => setEditState(null)}>
                    <div className={styles.editModal} onClick={e => e.stopPropagation()}>
                        <div className={styles.editHeader}><h3>Editar Proxy</h3><button onClick={() => setEditState(null)}><X size={16} /></button></div>
                        <div className={styles.editBody}>
                            <div className={styles.editField}>
                                <label>Tipo</label>
                                <select value={editState.type} onChange={e => setEditState(s => s && ({ ...s, type: e.target.value as any }))}>
                                    <option value="http">HTTP</option><option value="https">HTTPS</option><option value="socks4">SOCKS4</option><option value="socks5">SOCKS5</option>
                                </select>
                            </div>
                            <div className={styles.editRow}>
                                <div className={`${styles.editField} flex-1`}>
                                    <label>Host / IP</label>
                                    <input type="text" value={editState.host} onChange={e => setEditState(s => s && ({ ...s, host: e.target.value }))} />
                                </div>
                                <div className={styles.editField} style={{ width: 90 }}>
                                    <label>Porta</label>
                                    <input type="number" value={editState.port} onChange={e => setEditState(s => s && ({ ...s, port: e.target.value }))} />
                                </div>
                            </div>
                            <div className={styles.editField}><label>Usuário (opcional)</label><input type="text" value={editState.username} onChange={e => setEditState(s => s && ({ ...s, username: e.target.value }))} /></div>
                            <div className={styles.editField}><label>Senha (opcional)</label><input type="password" value={editState.password} onChange={e => setEditState(s => s && ({ ...s, password: e.target.value }))} /></div>
                        </div>
                        <div className={styles.editFooter}>
                            <button className={styles.cancelBtn} onClick={() => setEditState(null)}>Cancelar</button>
                            <button className={styles.saveBtn} onClick={handleSaveEdit} disabled={saving}>
                                {saving ? <Loader2 size={14} className="animate-spin" /> : null} Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Bulk Import Modal ── */}
            {showBulkImport && (
                <div className={styles.editOverlay} onClick={() => setShowBulkImport(false)}>
                    <div className={styles.editModal} onClick={e => e.stopPropagation()}>
                        <div className={styles.editHeader}>
                            <h3>Importar Proxies em Massa</h3>
                            <button onClick={() => setShowBulkImport(false)}><X size={16} /></button>
                        </div>
                        <div className={styles.editBody}>
                            <p className={styles.importHint}>Cole uma lista de proxies, um por linha. Formatos aceitos:</p>
                            <code className={styles.importExample}>host:porta<br />host:porta:user:senha<br />socks5://user:senha@host:porta</code>
                            <textarea
                                className={styles.importTextarea}
                                placeholder={"192.168.1.1:8080\n192.168.1.2:1080:user:pass\nsocks5://proxy.com:1080"}
                                value={bulkText}
                                onChange={e => setBulkText(e.target.value)}
                                rows={8}
                            />
                        </div>
                        <div className={styles.editFooter}>
                            <button className={styles.cancelBtn} onClick={() => setShowBulkImport(false)}>Cancelar</button>
                            <button className={styles.saveBtn} onClick={handleBulkImport} disabled={!bulkText.trim() || importing}>
                                {importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Importar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
        </div>
    );
};

export default ProxiesModal;
