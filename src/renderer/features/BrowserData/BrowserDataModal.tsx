import React, { useState, useEffect, useCallback } from 'react';
import {
    X, Cookie, History, Bookmark, Trash2, Download, Upload,
    Plus, Search, AlertTriangle, CheckCircle, Loader2, Globe, RefreshCw,
} from 'lucide-react';

interface Props {
    profileId: string;
    profileName: string;
    onClose: () => void;
}

type Tab = 'cookies' | 'history' | 'bookmarks' | 'clear';

interface Cookie { name: string; value: string; domain: string; path: string; expires: number; secure: boolean; httpOnly: boolean; sameSite: string; }
interface HistoryEntry { id: number; url: string; title: string; visitCount: number; lastVisit: string; }
interface BookmarkNode { id: string; name: string; type: 'folder' | 'url'; url?: string; children?: BookmarkNode[]; }
interface DataStats { cookieCount: number; historyCount: number; bookmarkCount: number; }

function TabBtn({ active, onClick, icon, label, count }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; count?: number }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                active
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-600'
            }`}
        >
            {icon}
            {label}
            {count !== undefined && count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${active ? 'bg-blue-500/20 text-blue-300' : 'bg-zinc-700 text-zinc-400'}`}>
                    {count}
                </span>
            )}
        </button>
    );
}

function ActionBtn({ onClick, icon, label, variant = 'default', loading = false }: { onClick: () => void; icon?: React.ReactNode; label: string; variant?: 'default' | 'danger' | 'primary'; loading?: boolean }) {
    const variants = {
        default: 'bg-zinc-700/60 hover:bg-zinc-600/60 text-zinc-200 border-zinc-600/60',
        danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30',
        primary: 'bg-blue-600 hover:bg-blue-500 text-theme-text border-blue-500',
    };
    return (
        <button
            onClick={onClick}
            disabled={loading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 ${variants[variant]}`}
        >
            {loading ? <Loader2 size={12} className="animate-spin" /> : icon}
            {label}
        </button>
    );
}

// ─── Cookies Tab ──────────────────────────────────────────────────────────────
function CookiesTab({ profileId }: { profileId: string }) {
    const [cookies, setCookies] = useState<Cookie[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        const res = await window.api.browserData.cookies.list(profileId);
        if (res.success) setCookies(res.data as Cookie[]);
        setLoading(false);
    }, [profileId]);

    useEffect(() => { load(); }, [load]);

    const flash = (type: 'ok' | 'err', text: string) => {
        setMsg({ type, text });
        setTimeout(() => setMsg(null), 3000);
    };

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
        else if (res.data) flash('ok', 'Cookies exportados com sucesso');
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
        <div className="flex flex-col gap-3 h-full">
            <div className="flex items-center gap-2 flex-wrap">
                <div className="flex-1 relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Filtrar por domínio ou nome..."
                        className="w-full pl-8 pr-3 py-1.5 bg-zinc-800/60 border border-zinc-700/60 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 outline-none focus:border-blue-500/50"
                    />
                </div>
                <ActionBtn onClick={load} icon={<RefreshCw size={12} />} label="Atualizar" />
                <ActionBtn onClick={handleImport} icon={<Upload size={12} />} label="Importar" variant="primary" />
                <ActionBtn onClick={handleExport} icon={<Download size={12} />} label="Exportar" />
                <ActionBtn onClick={handleClear} icon={<Trash2 size={12} />} label="Limpar tudo" variant="danger" />
            </div>

            {msg && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${msg.type === 'ok' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {msg.type === 'ok' ? <CheckCircle size={13} /> : <AlertTriangle size={13} />}
                    {msg.text}
                </div>
            )}

            <div className="flex-1 overflow-auto rounded-lg border border-zinc-700/40">
                {loading ? (
                    <div className="flex items-center justify-center h-32 text-zinc-500 text-sm gap-2">
                        <Loader2 size={16} className="animate-spin" /> Carregando...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-zinc-500 text-sm gap-1">
                        <Cookie size={24} className="opacity-40" />
                        <span>{cookies.length === 0 ? 'Nenhum cookie. Lance o perfil e navegue primeiro.' : 'Nenhum resultado'}</span>
                    </div>
                ) : (
                    <table className="w-full text-xs">
                        <thead className="bg-zinc-800/60 sticky top-0">
                            <tr className="text-zinc-400">
                                <th className="text-left px-3 py-2 font-medium">Domínio</th>
                                <th className="text-left px-3 py-2 font-medium">Nome</th>
                                <th className="text-left px-3 py-2 font-medium hidden md:table-cell">Valor</th>
                                <th className="text-left px-3 py-2 font-medium hidden lg:table-cell">Expira</th>
                                <th className="px-3 py-2 font-medium">Flags</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((c, i) => (
                                <tr key={i} className="border-t border-zinc-700/30 hover:bg-zinc-800/30">
                                    <td className="px-3 py-1.5 text-zinc-300 max-w-[120px] truncate">{c.domain}</td>
                                    <td className="px-3 py-1.5 text-zinc-200 font-mono max-w-[120px] truncate">{c.name}</td>
                                    <td className="px-3 py-1.5 text-zinc-400 font-mono max-w-[160px] truncate hidden md:table-cell">{c.value || <span className="text-zinc-600">(encrypted)</span>}</td>
                                    <td className="px-3 py-1.5 text-zinc-500 hidden lg:table-cell">
                                        {c.expires > 0 ? new Date(c.expires).toLocaleDateString('pt-BR') : 'Sessão'}
                                    </td>
                                    <td className="px-3 py-1.5">
                                        <div className="flex gap-1">
                                            {c.secure && <span className="px-1 rounded text-[10px] bg-green-500/15 text-green-400">S</span>}
                                            {c.httpOnly && <span className="px-1 rounded text-[10px] bg-yellow-500/15 text-yellow-400">H</span>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            <p className="text-xs text-zinc-600">
                Formato de importação: Netscape Cookie File (.txt) — compatível com curl, EditThisCookie, etc.
                Valores criptografados pelo Chrome aparecem em branco na coluna Valor.
            </p>
        </div>
    );
}

// ─── History Tab ──────────────────────────────────────────────────────────────
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
        <div className="flex flex-col gap-3 h-full">
            <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar URL ou título..."
                        className="w-full pl-8 pr-3 py-1.5 bg-zinc-800/60 border border-zinc-700/60 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 outline-none focus:border-blue-500/50"
                    />
                </div>
                <ActionBtn onClick={load} icon={<RefreshCw size={12} />} label="Atualizar" />
                <ActionBtn onClick={handleClear} icon={<Trash2 size={12} />} label="Limpar histórico" variant="danger" loading={clearing} />
            </div>

            <div className="flex-1 overflow-auto rounded-lg border border-zinc-700/40">
                {loading ? (
                    <div className="flex items-center justify-center h-32 text-zinc-500 text-sm gap-2">
                        <Loader2 size={16} className="animate-spin" /> Carregando...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-zinc-500 text-sm gap-1">
                        <History size={24} className="opacity-40" />
                        <span>{history.length === 0 ? 'Nenhum histórico. Lance o perfil e navegue primeiro.' : 'Nenhum resultado'}</span>
                    </div>
                ) : (
                    <table className="w-full text-xs">
                        <thead className="bg-zinc-800/60 sticky top-0">
                            <tr className="text-zinc-400">
                                <th className="text-left px-3 py-2 font-medium">Título / URL</th>
                                <th className="text-left px-3 py-2 font-medium hidden md:table-cell">Última visita</th>
                                <th className="text-left px-3 py-2 font-medium">Visitas</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(h => (
                                <tr key={h.id} className="border-t border-zinc-700/30 hover:bg-zinc-800/30">
                                    <td className="px-3 py-2 max-w-0">
                                        <div className="truncate text-zinc-200">{h.title || h.url}</div>
                                        <div className="truncate text-zinc-500 text-[10px] flex items-center gap-1">
                                            <Globe size={10} />
                                            <a href={h.url} className="hover:text-blue-400 cursor-default">{h.url}</a>
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 text-zinc-500 whitespace-nowrap hidden md:table-cell">{formatDate(h.lastVisit)}</td>
                                    <td className="px-3 py-2 text-zinc-400">{h.visitCount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

// ─── Bookmarks Tab ────────────────────────────────────────────────────────────
function BookmarksTab({ profileId }: { profileId: string }) {
    const [bookmarks, setBookmarks] = useState<BookmarkNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const [newUrl, setNewUrl] = useState('');
    const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        const res = await window.api.browserData.bookmarks.list(profileId);
        if (res.success) setBookmarks(res.data as BookmarkNode[]);
        setLoading(false);
    }, [profileId]);

    useEffect(() => { load(); }, [load]);

    const flash = (type: 'ok' | 'err', text: string) => {
        setMsg({ type, text });
        setTimeout(() => setMsg(null), 3000);
    };

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
    const flatten = (nodes: BookmarkNode[]) => {
        for (const n of nodes) {
            if (n.type === 'url') flatUrls.push(n);
            if (n.children) flatten(n.children);
        }
    };
    flatten(bookmarks);

    return (
        <div className="flex flex-col gap-3 h-full">
            <div className="flex items-center gap-2 flex-wrap">
                <ActionBtn onClick={load} icon={<RefreshCw size={12} />} label="Atualizar" />
                <ActionBtn onClick={() => setAdding(v => !v)} icon={<Plus size={12} />} label="Adicionar" variant="primary" />
                <ActionBtn onClick={handleClear} icon={<Trash2 size={12} />} label="Limpar tudo" variant="danger" />
            </div>

            {adding && (
                <div className="flex gap-2 items-center p-3 bg-zinc-800/60 rounded-lg border border-zinc-700/60">
                    <input
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        placeholder="Nome do bookmark"
                        className="flex-1 px-3 py-1.5 bg-zinc-900/60 border border-zinc-700/60 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 outline-none focus:border-blue-500/50"
                    />
                    <input
                        value={newUrl}
                        onChange={e => setNewUrl(e.target.value)}
                        placeholder="https://..."
                        className="flex-1 px-3 py-1.5 bg-zinc-900/60 border border-zinc-700/60 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 outline-none focus:border-blue-500/50"
                    />
                    <ActionBtn onClick={handleAdd} label="Salvar" variant="primary" />
                    <ActionBtn onClick={() => setAdding(false)} label="Cancelar" />
                </div>
            )}

            {msg && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${msg.type === 'ok' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {msg.type === 'ok' ? <CheckCircle size={13} /> : <AlertTriangle size={13} />}
                    {msg.text}
                </div>
            )}

            <div className="flex-1 overflow-auto rounded-lg border border-zinc-700/40">
                {loading ? (
                    <div className="flex items-center justify-center h-32 text-zinc-500 text-sm gap-2">
                        <Loader2 size={16} className="animate-spin" /> Carregando...
                    </div>
                ) : flatUrls.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-zinc-500 text-sm gap-1">
                        <Bookmark size={24} className="opacity-40" />
                        <span>Nenhum bookmark encontrado</span>
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-700/30">
                        {flatUrls.map(b => (
                            <div key={b.id} className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-800/30 group">
                                <Globe size={13} className="text-zinc-500 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs text-zinc-200 truncate">{b.name}</div>
                                    <div className="text-[10px] text-zinc-500 truncate">{b.url}</div>
                                </div>
                                <button
                                    onClick={() => handleDelete(b.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-red-400 transition-all"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Clear Data Tab ───────────────────────────────────────────────────────────
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
        { key: 'cookies' as const, label: 'Cookies', desc: 'Sessões, autenticações e preferências', icon: <Cookie size={16} className="text-yellow-400" /> },
        { key: 'history' as const, label: 'Histórico', desc: 'Páginas visitadas e pesquisas', icon: <History size={16} className="text-blue-400" /> },
        { key: 'bookmarks' as const, label: 'Bookmarks', desc: 'Favoritos salvos no perfil', icon: <Bookmark size={16} className="text-green-400" /> },
        { key: 'cache' as const, label: 'Cache', desc: 'Arquivos temporários e dados em cache', icon: <Trash2 size={16} className="text-zinc-400" /> },
    ];

    return (
        <div className="flex flex-col gap-4">
            <p className="text-xs text-zinc-400">Selecione o que deseja limpar deste perfil. Esta ação é irreversível.</p>

            <div className="flex flex-col gap-2">
                {items.map(item => (
                    <label key={item.key} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selected[item.key] ? 'border-red-500/40 bg-red-500/5' : 'border-zinc-700/40 bg-zinc-800/30 hover:border-zinc-600/60'}`}>
                        <input
                            type="checkbox"
                            checked={selected[item.key]}
                            onChange={() => toggle(item.key)}
                            className="w-4 h-4 accent-red-500"
                        />
                        <div className="p-1.5 rounded-lg bg-zinc-800/60">{item.icon}</div>
                        <div>
                            <div className="text-sm font-medium text-zinc-200">{item.label}</div>
                            <div className="text-xs text-zinc-500">{item.desc}</div>
                        </div>
                    </label>
                ))}
            </div>

            {done ? (
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 text-sm">
                    <CheckCircle size={16} /> Dados limpos com sucesso
                </div>
            ) : (
                <button
                    onClick={handleClear}
                    disabled={!anySelected || loading}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-theme-text text-sm font-semibold transition-colors"
                >
                    {loading ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                    {loading ? 'Limpando...' : 'Limpar dados selecionados'}
                </button>
            )}
        </div>
    );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export default function BrowserDataModal({ profileId, profileName, onClose }: Props) {
    const [tab, setTab] = useState<Tab>('cookies');
    const [stats, setStats] = useState<DataStats>({ cookieCount: 0, historyCount: 0, bookmarkCount: 0 });

    const loadStats = useCallback(async () => {
        const res = await window.api.browserData.stats(profileId);
        if (res.success) setStats(res.data as DataStats);
    }, [profileId]);

    useEffect(() => { loadStats(); }, [loadStats]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="flex flex-col w-[860px] max-w-[95vw] h-[600px] max-h-[90vh] bg-zinc-900 border border-zinc-700/60 rounded-xl shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-700/60">
                    <div>
                        <h2 className="text-base font-bold text-theme-text">Dados do Navegador</h2>
                        <p className="text-xs text-zinc-500 mt-0.5">{profileName}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-700/60 text-zinc-400 hover:text-theme-text transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-zinc-700/60 px-2 overflow-x-auto">
                    <TabBtn active={tab === 'cookies'} onClick={() => setTab('cookies')} icon={<Cookie size={14} />} label="Cookies" count={stats.cookieCount} />
                    <TabBtn active={tab === 'history'} onClick={() => setTab('history')} icon={<History size={14} />} label="Histórico" count={stats.historyCount} />
                    <TabBtn active={tab === 'bookmarks'} onClick={() => setTab('bookmarks')} icon={<Bookmark size={14} />} label="Bookmarks" count={stats.bookmarkCount} />
                    <TabBtn active={tab === 'clear'} onClick={() => setTab('clear')} icon={<Trash2 size={14} />} label="Limpar Dados" />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden p-4">
                    {tab === 'cookies'   && <CookiesTab profileId={profileId} />}
                    {tab === 'history'   && <HistoryTab profileId={profileId} />}
                    {tab === 'bookmarks' && <BookmarksTab profileId={profileId} />}
                    {tab === 'clear'     && <ClearDataTab profileId={profileId} onDone={loadStats} />}
                </div>
            </div>
        </div>
    );
}
