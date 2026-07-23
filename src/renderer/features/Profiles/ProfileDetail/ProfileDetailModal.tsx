import React, { useState, useEffect, useCallback } from 'react';
import {
    X, Settings, Fingerprint, Globe, RotateCw, Plus, Trash2, AlertTriangle,
    Cookie, History, Bookmark, Download, Upload, Search, CheckCircle,
    Loader2, RefreshCw, Tag,
} from 'lucide-react';
import styles from './ProfileDetailModal.module.css';
import { Profile } from '../../../types';
import { useToast } from '../../../context/ToastContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TagTemplate { id: string; name: string; color: string; tags: string[]; }

const SOCIAL_TAG_COLORS: Record<string, { color: string; bg: string; border: string; bgActive: string; borderActive: string }> = {
    facebook:  { color: '#1877f2', bg: 'rgba(24, 119, 242, 0.05)',  border: 'rgba(24, 119, 242, 0.15)', bgActive: 'rgba(24, 119, 242, 0.15)', borderActive: 'rgba(24, 119, 242, 0.4)' },
    instagram: { color: '#e1306c', bg: 'rgba(225, 48, 108, 0.05)', border: 'rgba(225, 48, 108, 0.15)', bgActive: 'rgba(225, 48, 108, 0.15)', borderActive: 'rgba(225, 48, 108, 0.4)' },
    twitter:   { color: '#1da1f2', bg: 'rgba(29, 161, 242, 0.05)',  border: 'rgba(29, 161, 242, 0.15)', bgActive: 'rgba(29, 161, 242, 0.15)', borderActive: 'rgba(29, 161, 242, 0.4)' },
    tiktok:    { color: '#fe2c55', bg: 'rgba(254, 44, 85, 0.05)',  border: 'rgba(254, 44, 85, 0.15)', bgActive: 'rgba(254, 44, 85, 0.15)', borderActive: 'rgba(254, 44, 85, 0.4)' },
    linkedin:  { color: '#0a66c2', bg: 'rgba(10, 102, 194, 0.05)',  border: 'rgba(10, 102, 194, 0.15)', bgActive: 'rgba(10, 102, 194, 0.15)', borderActive: 'rgba(10, 102, 194, 0.4)' },
};

type Tab = 'general' | 'fingerprint' | 'proxy' | 'cookies' | 'history' | 'bookmarks' | 'clear';

interface CookieEntry { name: string; value: string; domain: string; path: string; expires: number; secure: boolean; httpOnly: boolean; sameSite: string; }
interface HistoryEntry { id: number; url: string; title: string; visitCount: number; lastVisit: string; }
interface BookmarkNode { id: string; name: string; type: 'folder' | 'url'; url?: string; children?: BookmarkNode[]; }
interface DataStats { cookieCount: number; historyCount: number; bookmarkCount: number; }

interface ProfileDetailModalProps {
    profile: Profile;
    tagTemplates?: TagTemplate[];
    defaultTab?: Tab;
    onClose: () => void;
    onSave: (profile: Profile) => void;
    onDelete?: (profileId: string) => void;
}

// ─── Browser Data Sub-Components ─────────────────────────────────────────────

function ActionBtn({ onClick, icon, label, variant = 'default', loading = false }: {
    onClick: () => void; icon?: React.ReactNode; label: string;
    variant?: 'default' | 'danger' | 'primary'; loading?: boolean;
}) {
    const cls = {
        default: styles.actionBtnDefault,
        danger: styles.actionBtnDanger,
        primary: styles.actionBtnPrimary,
    }[variant];
    return (
        <button onClick={onClick} disabled={loading} className={`${styles.actionBtn} ${cls}`}>
            {loading ? <Loader2 size={12} className="animate-spin" /> : icon}
            {label}
        </button>
    );
}

function FlashMsg({ msg }: { msg: { type: 'ok' | 'err'; text: string } }) {
    return (
        <div className={`${styles.flash} ${msg.type === 'ok' ? styles.flashOk : styles.flashErr}`}>
            {msg.type === 'ok' ? <CheckCircle size={13} /> : <AlertTriangle size={13} />}
            {msg.text}
        </div>
    );
}

function CookiesTab({ profileId }: { profileId: string }) {
    const [cookies, setCookies] = useState<CookieEntry[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

    const flash = (type: 'ok' | 'err', text: string) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3000); };

    const load = useCallback(async () => {
        setLoading(true);
        const res = await window.api.browserData.cookies.list(profileId);
        if (res.success) setCookies(res.data as CookieEntry[]);
        setLoading(false);
    }, [profileId]);

    useEffect(() => { load(); }, [load]);

    const handleImport = async () => {
        const res = await window.api.browserData.cookies.openImportDialog(profileId);
        if (!res.success) return flash('err', res.error ?? 'Erro ao importar');
        if (!res.data) return;
        const d = res.data as { imported: number; skipped: number };
        flash('ok', `${d.imported} cookies importados, ${d.skipped} ignorados`);
        load();
    };

    const handleExport = async () => {
        const res = await window.api.browserData.cookies.saveExport(profileId);
        if (!res.success) flash('err', res.error ?? 'Erro ao exportar');
        else if (res.data) flash('ok', 'Cookies exportados');
    };

    const handleClear = async () => {
        if (!confirm('Limpar todos os cookies deste perfil?')) return;
        const res = await window.api.browserData.cookies.clear(profileId);
        if (res.success) { flash('ok', 'Cookies removidos'); setCookies([]); }
        else flash('err', res.error ?? 'Erro');
    };

    const filtered = cookies.filter(c =>
        c.domain.toLowerCase().includes(search.toLowerCase()) ||
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className={styles.tabPane}>
            <div className={styles.tabToolbar}>
                <div className={styles.searchWrapper}>
                    <Search size={13} className={styles.searchIcon} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filtrar por domínio ou nome..." className={styles.searchInput} />
                </div>
                <ActionBtn onClick={load} icon={<RefreshCw size={12} />} label="Atualizar" />
                <ActionBtn onClick={handleImport} icon={<Upload size={12} />} label="Importar" variant="primary" />
                <ActionBtn onClick={handleExport} icon={<Download size={12} />} label="Exportar" />
                <ActionBtn onClick={handleClear} icon={<Trash2 size={12} />} label="Limpar tudo" variant="danger" />
            </div>
            {msg && <FlashMsg msg={msg} />}
            <div className={styles.tableContainer}>
                {loading ? (
                    <div className={styles.emptyState}><Loader2 size={18} className="animate-spin" /> Carregando...</div>
                ) : filtered.length === 0 ? (
                    <div className={styles.emptyState}><Cookie size={24} style={{ opacity: 0.4 }} />{cookies.length === 0 ? 'Nenhum cookie. Lance o perfil e navegue primeiro.' : 'Nenhum resultado'}</div>
                ) : (
                    <table className={styles.table}>
                        <thead><tr>
                            <th>Domínio</th><th>Nome</th><th>Valor</th><th>Expira</th><th>Flags</th>
                        </tr></thead>
                        <tbody>
                            {filtered.map((c, i) => (
                                <tr key={i}>
                                    <td className={styles.tdTrunc}>{c.domain}</td>
                                    <td className={`${styles.tdTrunc} ${styles.mono}`}>{c.name}</td>
                                    <td className={`${styles.tdTrunc} ${styles.mono} ${styles.dim}`}>{c.value || <span style={{ color: '#334155' }}>(encrypted)</span>}</td>
                                    <td className={styles.dim}>{c.expires > 0 ? new Date(c.expires).toLocaleDateString('pt-BR') : 'Sessão'}</td>
                                    <td>
                                        <div className={styles.flagCell}>
                                            {c.secure && <span className={styles.flagS}>S</span>}
                                            {c.httpOnly && <span className={styles.flagH}>H</span>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            <p className={styles.tableHint}>Formato de importação: Netscape Cookie File (.txt)</p>
        </div>
    );
}

function HistoryTab({ profileId }: { profileId: string }) {
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [clearing, setClearing] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        const res = await window.api.browserData.history.list(profileId, 300);
        if (res.success) setHistory(res.data as HistoryEntry[]);
        setLoading(false);
    }, [profileId]);

    useEffect(() => { load(); }, [load]);

    const handleClear = async () => {
        if (!confirm('Limpar todo o histórico deste perfil?')) return;
        setClearing(true);
        await window.api.browserData.history.clear(profileId);
        setHistory([]);
        setClearing(false);
    };

    const filtered = history.filter(h =>
        h.url.toLowerCase().includes(search.toLowerCase()) ||
        h.title.toLowerCase().includes(search.toLowerCase())
    );

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    };

    return (
        <div className={styles.tabPane}>
            <div className={styles.tabToolbar}>
                <div className={styles.searchWrapper}>
                    <Search size={13} className={styles.searchIcon} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar URL ou título..." className={styles.searchInput} />
                </div>
                <ActionBtn onClick={load} icon={<RefreshCw size={12} />} label="Atualizar" />
                <ActionBtn onClick={handleClear} icon={<Trash2 size={12} />} label="Limpar histórico" variant="danger" loading={clearing} />
            </div>
            <div className={styles.tableContainer}>
                {loading ? (
                    <div className={styles.emptyState}><Loader2 size={18} className="animate-spin" /> Carregando...</div>
                ) : filtered.length === 0 ? (
                    <div className={styles.emptyState}><History size={24} style={{ opacity: 0.4 }} />{history.length === 0 ? 'Nenhum histórico encontrado.' : 'Nenhum resultado'}</div>
                ) : (
                    <table className={styles.table}>
                        <thead><tr><th>Título / URL</th><th>Última visita</th><th>Visitas</th></tr></thead>
                        <tbody>
                            {filtered.map(h => (
                                <tr key={h.id}>
                                    <td className={styles.tdDouble}>
                                        <div className={`${styles.tdTrunc} ${styles.bright}`}>{h.title || h.url}</div>
                                        <div className={`${styles.tdTrunc} ${styles.dim} ${styles.small}`}><Globe size={10} style={{ display: 'inline', marginRight: 4 }} />{h.url}</div>
                                    </td>
                                    <td className={`${styles.dim} ${styles.noWrap}`}>{formatDate(h.lastVisit)}</td>
                                    <td>{h.visitCount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

function BookmarksTab({ profileId }: { profileId: string }) {
    const [bookmarks, setBookmarks] = useState<BookmarkNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const [newUrl, setNewUrl] = useState('');
    const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

    const flash = (type: 'ok' | 'err', text: string) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3000); };

    const load = useCallback(async () => {
        setLoading(true);
        const res = await window.api.browserData.bookmarks.list(profileId);
        if (res.success) setBookmarks(res.data as BookmarkNode[]);
        setLoading(false);
    }, [profileId]);

    useEffect(() => { load(); }, [load]);

    const handleAdd = async () => {
        if (!newName.trim() || !newUrl.trim()) return;
        const url = newUrl.startsWith('http') ? newUrl : `https://${newUrl}`;
        const res = await window.api.browserData.bookmarks.add(profileId, newName.trim(), url);
        if (res.success) { flash('ok', 'Bookmark adicionado'); setNewName(''); setNewUrl(''); setAdding(false); load(); }
        else flash('err', res.error ?? 'Erro');
    };

    const handleDelete = async (id: string) => {
        const res = await window.api.browserData.bookmarks.delete(profileId, id);
        if (res.success) load();
        else flash('err', res.error ?? 'Erro');
    };

    const handleClear = async () => {
        if (!confirm('Remover todos os bookmarks deste perfil?')) return;
        await window.api.browserData.bookmarks.clear(profileId);
        setBookmarks([]);
    };

    const flatUrls: BookmarkNode[] = [];
    const flatten = (nodes: BookmarkNode[]) => { for (const n of nodes) { if (n.type === 'url') flatUrls.push(n); if (n.children) flatten(n.children); } };
    flatten(bookmarks);

    return (
        <div className={styles.tabPane}>
            <div className={styles.tabToolbar}>
                <ActionBtn onClick={load} icon={<RefreshCw size={12} />} label="Atualizar" />
                <ActionBtn onClick={() => setAdding(v => !v)} icon={<Plus size={12} />} label="Adicionar" variant="primary" />
                <ActionBtn onClick={handleClear} icon={<Trash2 size={12} />} label="Limpar tudo" variant="danger" />
            </div>

            {adding && (
                <div className={styles.addBookmarkRow}>
                    <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nome do bookmark" className={styles.bmInput} />
                    <input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://..." className={styles.bmInput} />
                    <ActionBtn onClick={handleAdd} label="Salvar" variant="primary" />
                    <ActionBtn onClick={() => setAdding(false)} label="Cancelar" />
                </div>
            )}

            {msg && <FlashMsg msg={msg} />}

            <div className={styles.tableContainer}>
                {loading ? (
                    <div className={styles.emptyState}><Loader2 size={18} className="animate-spin" /> Carregando...</div>
                ) : flatUrls.length === 0 ? (
                    <div className={styles.emptyState}><Bookmark size={24} style={{ opacity: 0.4 }} />Nenhum bookmark encontrado</div>
                ) : (
                    <div className={styles.bookmarkList}>
                        {flatUrls.map(b => (
                            <div key={b.id} className={styles.bookmarkRow}>
                                <Globe size={13} className={styles.bmGlobe} />
                                <div className={styles.bmInfo}>
                                    <div className={styles.bmName}>{b.name}</div>
                                    <div className={styles.bmUrl}>{b.url}</div>
                                </div>
                                <button onClick={() => handleDelete(b.id)} className={styles.bmDeleteBtn}><Trash2 size={12} /></button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function ClearDataTab({ profileId, onDone }: { profileId: string; onDone: () => void }) {
    const [selected, setSelected] = useState({ cookies: false, history: false, bookmarks: false, cache: false });
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    const toggle = (k: keyof typeof selected) => setSelected(s => ({ ...s, [k]: !s[k] }));
    const anySelected = Object.values(selected).some(Boolean);

    const handleClear = async () => {
        if (!anySelected) return;
        setLoading(true);
        await window.api.browserData.clearAll(profileId, selected);
        setLoading(false);
        setDone(true);
        setTimeout(() => { setDone(false); onDone(); }, 1500);
    };

    const items = [
        { key: 'cookies' as const,   label: 'Cookies',   desc: 'Sessões, autenticações e preferências',   icon: <Cookie size={16} style={{ color: '#facc15' }} /> },
        { key: 'history' as const,   label: 'Histórico', desc: 'Páginas visitadas e pesquisas',           icon: <History size={16} style={{ color: '#60a5fa' }} /> },
        { key: 'bookmarks' as const, label: 'Bookmarks', desc: 'Favoritos salvos no perfil',              icon: <Bookmark size={16} style={{ color: '#34d399' }} /> },
        { key: 'cache' as const,     label: 'Cache',     desc: 'Arquivos temporários e dados em cache',   icon: <Trash2 size={16} style={{ color: '#94a3b8' }} /> },
    ];

    return (
        <div className={styles.clearPane}>
            <p className={styles.clearDesc}>Selecione o que deseja limpar deste perfil. Esta ação é irreversível.</p>
            <div className={styles.clearList}>
                {items.map(item => (
                    <label key={item.key} className={`${styles.clearItem} ${selected[item.key] ? styles.clearItemSelected : ''}`}>
                        <input type="checkbox" checked={selected[item.key]} onChange={() => toggle(item.key)} className={styles.clearCheckbox} />
                        <div className={styles.clearIconBox}>{item.icon}</div>
                        <div>
                            <div className={styles.clearLabel}>{item.label}</div>
                            <div className={styles.clearSubLabel}>{item.desc}</div>
                        </div>
                    </label>
                ))}
            </div>
            {done ? (
                <div className={`${styles.flash} ${styles.flashOk}`}><CheckCircle size={16} /> Dados limpos com sucesso</div>
            ) : (
                <button onClick={handleClear} disabled={!anySelected || loading} className={styles.clearBtn}>
                    {loading ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                    {loading ? 'Limpando...' : 'Limpar dados selecionados'}
                </button>
            )}
        </div>
    );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

const ProfileDetailModal: React.FC<ProfileDetailModalProps> = ({ profile, tagTemplates = [], defaultTab, onClose, onSave, onDelete }) => {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<Tab>(defaultTab || 'general');
    const [regenConfirm, setRegenConfirm] = useState(false);
    const [saving, setSaving] = useState(false);

    // General fields
    const [name, setName] = useState(profile.name);
    const [tags, setTags] = useState<string[]>(() =>
        profile.tags ? profile.tags.split(',').map(t => t.trim()).filter(Boolean) : []
    );
    const [newTag, setNewTag] = useState('');
    const [notesList, setNotesList] = useState<{ title: string; content: string }[]>(() => {
        try {
            const parsed = JSON.parse(profile.notes || '[]');
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            return [{ title: 'Notas', content: profile.notes || '' }];
        } catch {
            return [{ title: 'Notas', content: profile.notes || '' }];
        }
    });

    // Proxy fields
    const [proxyEnabled, setProxyEnabled] = useState(!!profile.proxy);
    const [proxyType, setProxyType] = useState(profile.proxy?.type || 'http');
    const [proxyHost, setProxyHost] = useState(profile.proxy?.host || '');
    const [proxyPort, setProxyPort] = useState(profile.proxy?.port?.toString() || '8080');
    const [proxyUsername, setProxyUsername] = useState(profile.proxy?.username || '');
    const [proxyPassword, setProxyPassword] = useState(profile.proxy?.password || '');
    const [proxyPasteError, setProxyPasteError] = useState('');
    const [proxyPasteOk, setProxyPasteOk] = useState(false);
    const [proxyPool, setProxyPool] = useState<any[]>([]);

    useEffect(() => {
        const loadPool = async () => {
            try {
                const poolRes = await (window.api as any).proxyPool.list();
                if (poolRes && poolRes.success) {
                    setProxyPool(poolRes.data);
                }
            } catch (e) {
                console.error('Error fetching proxy pool:', e);
            }
        };
        loadPool();
    }, []);

    const handleProxyPaste = (raw: string) => {
        setProxyPasteError('');
        setProxyPasteOk(false);
        const s = raw.trim();
        if (!s) return;

        let type = proxyType;
        let host = '';
        let port = '';
        let username = '';
        let password = '';

        // Try scheme://[user:pass@]host:port
        const schemeMatch = s.match(/^(https?|socks[45]):\/\/(?:([^:@]+):([^@]+)@)?([^:]+):(\d+)/i);
        if (schemeMatch) {
            type     = schemeMatch[1].toLowerCase();
            username = schemeMatch[2] || '';
            password = schemeMatch[3] || '';
            host     = schemeMatch[4];
            port     = schemeMatch[5];
        } else {
            // host:port[:user:pass]
            const parts = s.split(':');
            if (parts.length >= 2) {
                host     = parts[0].trim();
                port     = parts[1].trim();
                username = parts[2]?.trim() || '';
                password = parts[3]?.trim() || '';
            }
        }

        if (!host || !port || isNaN(parseInt(port))) {
            setProxyPasteError('Formato inválido. Use: host:porta ou host:porta:usuário:senha');
            return;
        }

        setProxyType(type);
        setProxyHost(host);
        setProxyPort(port);
        setProxyUsername(username);
        setProxyPassword(password);
        setProxyPasteOk(true);
        setTimeout(() => setProxyPasteOk(false), 2500);
    };

    // Browser data stats
    const [stats, setStats] = useState<DataStats>({ cookieCount: 0, historyCount: 0, bookmarkCount: 0 });
    const loadStats = useCallback(async () => {
        const res = await window.api.browserData.stats(profile.id);
        if (res.success) setStats(res.data as DataStats);
    }, [profile.id]);
    useEffect(() => { loadStats(); }, [loadStats]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await window.api.profiles.update(profile.id, {
                name,
                notes: JSON.stringify(notesList),
                tags: tags.join(', '),
            });
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
        } catch (err) {
            console.error('Error saving profile:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleRegenerateFingerprint = async () => {
        if (!regenConfirm) { setRegenConfirm(true); return; }
        setRegenConfirm(false);
        try {
            await window.api.profiles.regenerateFingerprint(profile.id);
            toast.success('Fingerprint regenerado', 'Nova identidade aplicada ao perfil.');
            onSave(profile);
        } catch (err) {
            toast.error('Erro ao regenerar fingerprint', String(err));
        }
    };

    const addTag = (e?: React.FormEvent) => {
        e?.preventDefault();
        const t = newTag.trim();
        if (t && !tags.includes(t)) { setTags([...tags, t]); setNewTag(''); }
    };

    const removeTag = (tag: string) => setTags(tags.filter(t => t !== tag));

    const addNote = () => setNotesList([...notesList, { title: 'Nova Nota', content: '' }]);
    const removeNote = (i: number) => {
        if (notesList.length <= 1) { setNotesList([{ title: 'Notas', content: '' }]); return; }
        const n = [...notesList]; n.splice(i, 1); setNotesList(n);
    };
    const updateNote = (i: number, field: 'title' | 'content', val: string) => {
        const n = [...notesList]; n[i][field] = val; setNotesList(n);
    };

    const profileTabs: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
        { id: 'general',     label: 'Geral',        icon: <Settings size={16} /> },
        { id: 'fingerprint', label: 'Fingerprint',  icon: <Fingerprint size={16} /> },
        { id: 'proxy',       label: 'Proxy',        icon: <Globe size={16} /> },
    ];

    const dataTabs: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
        { id: 'cookies',   label: 'Cookies',   icon: <Cookie size={16} />,   badge: stats.cookieCount || undefined },
        { id: 'history',   label: 'Histórico', icon: <History size={16} />,  badge: stats.historyCount || undefined },
        { id: 'bookmarks', label: 'Bookmarks', icon: <Bookmark size={16} />, badge: stats.bookmarkCount || undefined },
        { id: 'clear',     label: 'Limpar',    icon: <Trash2 size={16} /> },
    ];

    const isDataTab = ['cookies', 'history', 'bookmarks', 'clear'].includes(activeTab);

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>

                {/* ─── Left Tab Nav ─── */}
                <div className={styles.tabNav}>
                    <div className={styles.profileInfo}>
                        <div className={styles.profileAvatar}>
                            {profile.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className={styles.profileMeta}>
                            <span className={styles.profileMetaName}>{profile.name}</span>
                            <span className={styles.profileMetaId}>ID {profile.id.slice(0, 8)}</span>
                        </div>
                    </div>

                    <div className={styles.tabSection}>
                        <p className={styles.tabSectionLabel}>Perfil</p>
                        {profileTabs.map(t => (
                            <button
                                key={t.id}
                                className={`${styles.tabItem} ${activeTab === t.id ? styles.tabItemActive : ''}`}
                                onClick={() => setActiveTab(t.id)}>
                                {t.icon}
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <div className={styles.tabSection}>
                        <p className={styles.tabSectionLabel}>Dados do Navegador</p>
                        {dataTabs.map(t => (
                            <button
                                key={t.id}
                                className={`${styles.tabItem} ${activeTab === t.id ? styles.tabItemActive : ''} ${t.id === 'clear' ? styles.tabItemDanger : ''}`}
                                onClick={() => setActiveTab(t.id)}>
                                {t.icon}
                                {t.label}
                                {t.badge !== undefined && t.badge > 0 && (
                                    <span className={styles.tabBadge}>{t.badge > 999 ? '999+' : t.badge}</span>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className={styles.tabNavFooter}>
                        {onDelete && (
                            <button
                                className={styles.deleteProfileBtn}
                                onClick={() => { if (confirm('Excluir este perfil permanentemente?')) { onDelete(profile.id); onClose(); } }}>
                                <Trash2 size={14} /> Excluir Perfil
                            </button>
                        )}
                    </div>
                </div>

                {/* ─── Main Content ─── */}
                <div className={styles.mainPanel}>
                    {/* Header */}
                    <div className={styles.header}>
                        <div>
                            <h2 className={styles.headerTitle}>
                                {[...profileTabs, ...dataTabs].find(t => t.id === activeTab)?.label}
                            </h2>
                            <p className={styles.headerSub}>{profile.name}</p>
                        </div>
                        <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
                    </div>

                    {/* Content */}
                    <div className={styles.content}>

                        {/* ── General Tab ── */}
                        {activeTab === 'general' && (
                            <div className={styles.formSection}>
                                <div className={styles.fieldGroup}>
                                    <label>Nome do Perfil</label>
                                    <input type="text" className={styles.input} value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Conta Principal 01" />
                                </div>

                                <div className={styles.fieldGroup}>
                                    <label>Tags de Identificação</label>
                                    <div className={styles.tagsContainer}>
                                        <div className={styles.tagsList}>
                                            {tags.map((tag, i) => {
                                                const isSocial = SOCIAL_TAG_COLORS[tag.toLowerCase()];
                                                return (
                                                    <span key={i} className={styles.tagChip}
                                                        style={isSocial ? { color: isSocial.color, background: isSocial.bgActive, borderColor: isSocial.borderActive } : {}}>
                                                        <Tag size={10} style={{ opacity: 0.6, color: isSocial ? isSocial.color : undefined }} />
                                                        {tag}
                                                        <button onClick={() => removeTag(tag)} className={styles.tagRemove} style={isSocial ? { color: isSocial.color } : {}}><X size={9} /></button>
                                                    </span>
                                                );
                                            })}
                                            {tags.length === 0 && <span className={styles.tagsEmpty}>Nenhuma tag</span>}
                                        </div>
                                        <div className={styles.tagInputRow}>
                                            <input
                                                type="text" className={styles.tagInput}
                                                value={newTag} onChange={e => setNewTag(e.target.value)}
                                                onKeyDown={e => { if (e.key === 'Enter') addTag(); }}
                                                placeholder="Nova tag personalizada..."
                                            />
                                            <button className={styles.tagAddBtn} onClick={() => addTag()}><Plus size={14} /></button>
                                        </div>

                                        {tagTemplates.length > 0 && (
                                            <div className={styles.tplGroups}>
                                                {tagTemplates.map(tpl => (
                                                    <div key={tpl.id} className={styles.tplGroup}>
                                                        <p className={styles.tplGroupLabel} style={{ color: tpl.color }}>
                                                            <span className={styles.tplGroupDot} style={{ background: tpl.color }} />
                                                            {tpl.name}
                                                        </p>
                                                        <div className={styles.tplGroupTags}>
                                                            {tpl.tags.map(tag => {
                                                                const active = tags.includes(tag);
                                                                const isSocial = SOCIAL_TAG_COLORS[tag.toLowerCase()];
                                                                const customStyle = isSocial
                                                                    ? (active
                                                                        ? { borderColor: isSocial.borderActive, color: isSocial.color, backgroundColor: isSocial.bgActive }
                                                                        : { borderColor: isSocial.border, color: isSocial.color, backgroundColor: isSocial.bg, opacity: 0.6 })
                                                                    : (active ? { borderColor: tpl.color, color: tpl.color } : {});
                                                                return (
                                                                    <button
                                                                        key={tag}
                                                                        className={`${styles.tplTag} ${active ? styles.tplTagActive : ''}`}
                                                                        style={customStyle}
                                                                        onClick={() => active ? removeTag(tag) : setTags([...tags, tag])}>
                                                                        {tag}{active && ' ✓'}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className={styles.fieldGroup}>
                                    <label>Blocos de Notas</label>
                                    <div className={styles.notesWrapper}>
                                        {notesList.map((note, i) => (
                                            <div key={i} className={styles.noteItem}>
                                                <div className={styles.noteHeader}>
                                                    <input
                                                        className={styles.noteTitleInput}
                                                        value={note.title}
                                                        onChange={e => updateNote(i, 'title', e.target.value)}
                                                    />
                                                    <button className={styles.noteRemoveBtn} onClick={() => removeNote(i)}><Trash2 size={13} /></button>
                                                </div>
                                                <textarea
                                                    className={styles.input}
                                                    rows={3}
                                                    value={note.content}
                                                    onChange={e => updateNote(i, 'content', e.target.value)}
                                                    placeholder="Escreva suas anotações aqui..."
                                                />
                                            </div>
                                        ))}
                                        <button className={styles.addNoteBtn} onClick={addNote}><Plus size={14} /> Adicionar Seção</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Fingerprint Tab ── */}
                        {activeTab === 'fingerprint' && (
                            <div className={styles.formSection}>
                                <div className={styles.fpGrid}>
                                    {[
                                        { label: 'Plataforma',    value: profile.fingerprint?.platform || 'Unknown' },
                                        { label: 'Navegador',     value: `Chrome ${profile.fingerprint?.user_agent?.match(/Chrome\/(\d+)/)?.[1] || '?'}` },
                                        { label: 'Timezone',      value: profile.fingerprint?.timezone || 'UTC' },
                                        { label: 'Idioma',        value: profile.fingerprint?.language || 'en-US' },
                                        { label: 'Resolução',     value: profile.fingerprint ? `${profile.fingerprint.screen_width}x${profile.fingerprint.screen_height}` : '1920x1080' },
                                        { label: 'Viewport',      value: profile.fingerprint ? `${profile.fingerprint.viewport_width}x${profile.fingerprint.viewport_height}` : '—' },
                                        { label: 'Hardware',      value: `${profile.fingerprint?.hardware_concurrency || 4} Núcleos · ${profile.fingerprint?.device_memory || 8}GB` },
                                        { label: 'Cores',         value: profile.fingerprint?.color_depth ? `${profile.fingerprint.color_depth}-bit` : '—' },
                                        { label: 'GPU (WebGL)',   value: profile.fingerprint?.renderer || '—' },
                                        { label: 'Vendor WebGL',  value: profile.fingerprint?.webgl_vendor || '—' },
                                        { label: 'WebRTC',        value: profile.fingerprint?.webrtc_mode || 'fake' },
                                        { label: 'Canvas Noise',  value: profile.fingerprint?.canvas_noise_seed ? `Seed #${profile.fingerprint.canvas_noise_seed}` : '—' },
                                    ].map(item => (
                                        <div key={item.label} className={styles.fpCard}>
                                            <span className={styles.fpCardLabel}>{item.label}</span>
                                            <p className={styles.fpCardValue}>{item.value}</p>
                                        </div>
                                    ))}
                                </div>

                                {regenConfirm ? (
                                    <div className={styles.regenConfirmBox}>
                                        <AlertTriangle size={16} style={{ color: '#fbbf24', flexShrink: 0 }} />
                                        <div style={{ flex: 1 }}>
                                            <p className={styles.regenConfirmTitle}>Confirmar regeneração?</p>
                                            <p className={styles.regenConfirmSub}>Isso substituirá o fingerprint atual. Sessões ativas podem ser afetadas.</p>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button onClick={() => setRegenConfirm(false)} className={styles.regenCancelBtn}>Cancelar</button>
                                            <button onClick={handleRegenerateFingerprint} className={styles.regenConfirmBtn}>Confirmar</button>
                                        </div>
                                    </div>
                                ) : (
                                    <button className={styles.regenBtn} onClick={handleRegenerateFingerprint}>
                                        <RotateCw size={15} /> Regenerar Fingerprint
                                    </button>
                                )}
                            </div>
                        )}

                        {/* ── Proxy Tab ── */}
                        {activeTab === 'proxy' && (
                            <div className={styles.formSection}>
                                <div className={styles.proxyToggleRow}>
                                    <div>
                                        <h4 className={styles.proxyToggleTitle}>Habilitar Proxy</h4>
                                        <p className={styles.proxyToggleSub}>Rotear todo o tráfego através de um servidor seguro.</p>
                                    </div>
                                    <button
                                        className={`${styles.toggleSwitch} ${proxyEnabled ? styles.toggleSwitchOn : ''}`}
                                        onClick={() => setProxyEnabled(!proxyEnabled)}>
                                        <span className={styles.toggleThumb} />
                                    </button>
                                </div>

                                {proxyEnabled && (
                                    <div className={styles.proxyFields}>
                                        {/* ── Select from Pool ── */}
                                        {proxyPool.length > 0 && (
                                            <div className={styles.fieldGroup}>
                                                <label>Selecionar do Pool</label>
                                                <select
                                                    className={styles.input}
                                                    defaultValue=""
                                                    onChange={e => {
                                                        const selected = proxyPool.find(p => p.id === e.target.value);
                                                        if (selected) {
                                                            setProxyType(selected.type);
                                                            setProxyHost(selected.host);
                                                            setProxyPort(String(selected.port));
                                                            setProxyUsername(selected.username || '');
                                                            setProxyPassword(selected.password || '');
                                                        }
                                                    }}>
                                                    <option value="" disabled>Escolha um proxy salvo...</option>
                                                    {proxyPool.map(p => (
                                                        <option key={p.id} value={p.id}>
                                                            {p.label ? `${p.label} - ` : ''}{p.host}:{p.port} ({p.type})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {/* ── Paste & Auto-fill ── */}
                                        <div className={styles.fieldGroup}>
                                            <label>Colar Proxy (auto-preencher)</label>
                                            <div style={{ position:'relative' }}>
                                                <input
                                                    type="text"
                                                    className={styles.input}
                                                    placeholder="host:porta:usuário:senha  ou  socks5://user:pass@host:porta"
                                                    onPaste={e => {
                                                        const text = e.clipboardData.getData('text');
                                                        e.preventDefault();
                                                        handleProxyPaste(text);
                                                    }}
                                                    onChange={e => handleProxyPaste(e.target.value)}
                                                    style={{
                                                        fontFamily:'monospace', fontSize:12,
                                                        background: proxyPasteOk ? 'rgba(52,211,153,0.08)' : proxyPasteError ? 'rgba(239,68,68,0.08)' : undefined,
                                                        borderColor: proxyPasteOk ? 'rgba(52,211,153,0.5)' : proxyPasteError ? 'rgba(239,68,68,0.5)' : undefined,
                                                        transition:'border-color 0.2s, background 0.2s',
                                                        paddingRight: 80,
                                                    }}
                                                />
                                                <span style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', fontSize:10, color: proxyPasteOk ? '#34d399' : 'var(--text-muted)', pointerEvents:'none', whiteSpace:'nowrap' }}>
                                                    {proxyPasteOk ? '✓ Preenchido' : 'Cole aqui'}
                                                </span>
                                            </div>
                                            {proxyPasteError && <p style={{ fontSize:10.5, color:'#ef4444', margin:'4px 0 0' }}>{proxyPasteError}</p>}
                                            <p style={{ fontSize:10, color:'var(--text-muted)', margin:'4px 0 0' }}>
                                                Formatos: <code style={{ fontFamily:'monospace' }}>host:porta</code> · <code style={{ fontFamily:'monospace' }}>host:porta:user:senha</code> · <code style={{ fontFamily:'monospace' }}>socks5://user:senha@host:porta</code>
                                            </p>
                                        </div>

                                        <div className={styles.fieldGroup}>
                                            <label>Tipo de Conexão</label>
                                            <select className={styles.input} value={proxyType} onChange={e => setProxyType(e.target.value)}>
                                                <option value="http">HTTP / HTTPS</option>
                                                <option value="socks4">SOCKS 4</option>
                                                <option value="socks5">SOCKS 5</option>
                                            </select>
                                        </div>
                                        <div className={styles.proxyHostRow}>
                                            <div className={`${styles.fieldGroup} ${styles.flex3}`}>
                                                <label>Host / IP</label>
                                                <input type="text" className={styles.input} value={proxyHost} onChange={e => setProxyHost(e.target.value)} placeholder="proxy.servidor.com" />
                                            </div>
                                            <div className={`${styles.fieldGroup} ${styles.flex1}`}>
                                                <label>Porta</label>
                                                <input type="text" className={styles.input} value={proxyPort} onChange={e => setProxyPort(e.target.value)} placeholder="8080" />
                                            </div>
                                        </div>
                                        <div className={styles.proxyAuthRow}>
                                            <div className={styles.fieldGroup}>
                                                <label>Usuário</label>
                                                <input type="text" className={styles.input} value={proxyUsername} onChange={e => setProxyUsername(e.target.value)} placeholder="Opcional" />
                                            </div>
                                            <div className={styles.fieldGroup}>
                                                <label>Senha</label>
                                                <input type="password" className={styles.input} value={proxyPassword} onChange={e => setProxyPassword(e.target.value)} placeholder="Opcional" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Browser Data Tabs ── */}
                        {activeTab === 'cookies'   && <CookiesTab profileId={profile.id} />}
                        {activeTab === 'history'   && <HistoryTab profileId={profile.id} />}
                        {activeTab === 'bookmarks' && <BookmarksTab profileId={profile.id} />}
                        {activeTab === 'clear'     && <ClearDataTab profileId={profile.id} onDone={loadStats} />}
                    </div>

                    {/* Footer — only for profile edit tabs */}
                    {!isDataTab && (
                        <div className={styles.footer}>
                            <button className={styles.cancelBtn} onClick={onClose}>Cancelar</button>
                            <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                                {saving ? 'Salvando...' : 'Salvar Alterações'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfileDetailModal;
