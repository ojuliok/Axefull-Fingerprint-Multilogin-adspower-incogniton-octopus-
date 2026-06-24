import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Loader2, Fingerprint, Globe, ChevronDown, ChevronUp, Tag, Flame, CheckCircle2, Zap, ShieldCheck, Clock, Cookie, History, AlertCircle } from 'lucide-react';

interface ProxyInput {
    type: 'http' | 'https' | 'socks4' | 'socks5';
    host: string;
    port: string;
    username: string;
    password: string;
}

interface TagTemplate { id: string; name: string; color: string; tags: string[]; }

const DEFAULT_TEMPLATES: TagTemplate[] = [
    { id: 'social',  name: 'Social Media',  color: '#60a5fa', tags: ['facebook', 'instagram', 'twitter', 'tiktok', 'linkedin'] },
    { id: 'ads',     name: 'Marketing',     color: '#fb923c', tags: ['ads', 'leads', 'campanhas', 'google', 'meta'] },
    { id: 'crypto',  name: 'Crypto / Web3', color: '#a78bfa', tags: ['defi', 'nft', 'wallet', 'trading', 'binance'] },
    { id: 'farm',    name: 'Farming',       color: '#34d399', tags: ['farming', 'warming', 'aged', 'pronto'] },
    { id: 'ecom',    name: 'E-commerce',    color: '#f472b6', tags: ['amazon', 'shopify', 'mercado-livre', 'ebay'] },
];

const SOCIAL_TAG_COLORS: Record<string, { color: string; bg: string; border: string; bgActive: string; borderActive: string }> = {
    facebook:  { color: '#1877f2', bg: 'rgba(24, 119, 242, 0.05)',  border: 'rgba(24, 119, 242, 0.15)', bgActive: 'rgba(24, 119, 242, 0.15)', borderActive: 'rgba(24, 119, 242, 0.4)' },
    instagram: { color: '#e1306c', bg: 'rgba(225, 48, 108, 0.05)', border: 'rgba(225, 48, 108, 0.15)', bgActive: 'rgba(225, 48, 108, 0.15)', borderActive: 'rgba(225, 48, 108, 0.4)' },
    twitter:   { color: '#1da1f2', bg: 'rgba(29, 161, 242, 0.05)',  border: 'rgba(29, 161, 242, 0.15)', bgActive: 'rgba(29, 161, 242, 0.15)', borderActive: 'rgba(29, 161, 242, 0.4)' },
    tiktok:    { color: '#fe2c55', bg: 'rgba(254, 44, 85, 0.05)',  border: 'rgba(254, 44, 85, 0.15)', bgActive: 'rgba(254, 44, 85, 0.15)', borderActive: 'rgba(254, 44, 85, 0.4)' },
    linkedin:  { color: '#0a66c2', bg: 'rgba(10, 102, 194, 0.05)',  border: 'rgba(10, 102, 194, 0.15)', bgActive: 'rgba(10, 102, 194, 0.15)', borderActive: 'rgba(10, 102, 194, 0.4)' },
};

const loadTemplates = (): TagTemplate[] => {
    try { return JSON.parse(localStorage.getItem('axe_tag_templates') || 'null') ?? DEFAULT_TEMPLATES; }
    catch { return DEFAULT_TEMPLATES; }
};

interface CreateProfileModalProps {
    onClose: () => void;
    onCreate: (name: string, platform: string, tags?: string, proxy?: { type: 'http'|'https'|'socks4'|'socks5'; host: string; port: number; username?: string; password?: string }) => void;
}

const PLATFORMS = [
    { id: 'windows', label: 'Windows', platform: 'Win32',         icon: '🪟' },
    { id: 'macos',   label: 'macOS',   platform: 'MacIntel',      icon: '🍎' },
    { id: 'linux',   label: 'Linux',   platform: 'Linux x86_64',  icon: '🐧' },
];

interface ProfileWarmupProgress {
    profileId: string;
    profileName: string;
    phase: 'idle' | 'warming' | 'done' | 'skipped' | 'error';
    current: number;
    total: number;
    url: string;
    sitesVisited: number;
    error?: string;
}

interface MultiWarmupState {
    phase: 'idle' | 'warming' | 'done';
    mode: 'parallel' | 'sequential';
    profiles: ProfileWarmupProgress[];
}

const CreateProfileModal: React.FC<CreateProfileModalProps> = ({ onClose, onCreate }) => {
    const [name, setName] = useState('');
    const [platform, setPlatform] = useState('windows');
    const [browserType, setBrowserType] = useState<'chromium' | 'firefox'>('chromium');
    const [tags, setTags] = useState<string[]>([]);
    const [newTag, setNewTag] = useState('');
    const [loading, setLoading] = useState(false);
    const [showProxy, setShowProxy] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [templates] = useState<TagTemplate[]>(loadTemplates);
    const [proxy, setProxy] = useState<ProxyInput>({ type: 'http', host: '', port: '', username: '', password: '' });
    const [selectedMode, setSelectedMode] = useState<'aquecido' | 'direto' | null>(null);

    // Multi-profile states
    const [quantity, setQuantity] = useState(1);
    const [warmupMode, setWarmupMode] = useState<'parallel' | 'sequential'>('sequential');
    const [warmup, setWarmup] = useState<MultiWarmupState>({
        phase: 'idle',
        mode: 'sequential',
        profiles: []
    });

    const unsubProgress = useRef<(() => void) | null>(null);
    const unsubComplete = useRef<(() => void) | null>(null);

    // Bulk Naming States & Utilities
    const [namingPattern, setNamingPattern] = useState<'space' | 'hyphen' | 'hash' | 'brackets'>('space');
    const [existingNames, setExistingNames] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchExisting = async () => {
            try {
                const listRes = await window.api.profiles.list();
                const namesSet = new Set<string>();
                if (listRes && listRes.success && Array.isArray(listRes.data)) {
                    listRes.data.forEach((p: any) => {
                        if (p && typeof p.name === 'string') {
                            namesSet.add(p.name.trim().toLowerCase());
                        }
                    });
                }
                setExistingNames(namesSet);
            } catch (e) {
                console.error('Error fetching existing profiles for preview:', e);
            }
        };
        fetchExisting();

        return () => {
            unsubProgress.current?.();
            unsubComplete.current?.();
        };
    }, []);

    const getProfileName = (baseName: string, index: number, total: number, pattern: string) => {
        const padLength = total >= 10 ? 2 : 1;
        const paddedIndex = String(index).padStart(padLength, '0');
        
        switch (pattern) {
            case 'hyphen':
                return `${baseName.trim()}-${paddedIndex}`;
            case 'hash':
                return `${baseName.trim()} #${paddedIndex}`;
            case 'brackets':
                return `${baseName.trim()} [${paddedIndex}]`;
            case 'space':
            default:
                return `${baseName.trim()} ${paddedIndex}`;
        }
    };

    const getComputedStartCounter = () => {
        let startCounter = 1;
        let batchHasCollision = true;

        while (batchHasCollision) {
            batchHasCollision = false;
            for (let i = 0; i < quantity; i++) {
                const generatedName = getProfileName(name.trim(), startCounter + i, quantity + startCounter - 1, namingPattern).toLowerCase();
                if (existingNames.has(generatedName)) {
                    batchHasCollision = true;
                    break;
                }
            }
            if (batchHasCollision) {
                startCounter++;
            }
        }
        return startCounter;
    };

    const computedStartCounter = getComputedStartCounter();

    const getPreviewNames = () => {
        if (!name.trim()) return '';
        const start = computedStartCounter;
        const end = start + quantity - 1;
        
        if (quantity === 1) {
            return name.trim();
        } else if (quantity === 2) {
            return `${getProfileName(name, start, end, namingPattern)} e ${getProfileName(name, start + 1, end, namingPattern)}`;
        } else if (quantity === 3) {
            return `${getProfileName(name, start, end, namingPattern)}, ${getProfileName(name, start + 1, end, namingPattern)} e ${getProfileName(name, start + 2, end, namingPattern)}`;
        } else {
            return `${getProfileName(name, start, end, namingPattern)}, ${getProfileName(name, start + 1, end, namingPattern)} ... ${getProfileName(name, end, end, namingPattern)}`;
        }
    };

    const buildProxyArg = () =>
        showProxy && proxy.host && proxy.port
            ? { type: proxy.type, host: proxy.host, port: parseInt(proxy.port, 10), username: proxy.username || undefined, password: proxy.password || undefined }
            : undefined;

    const createMultipleProfilesInDb = async (qty: number) => {
        const proxyArg = buildProxyArg();
        const createdList = [];
        const start = computedStartCounter;
        const end = start + qty - 1;
        try {
            for (let i = 0; i < qty; i++) {
                const profileName = qty > 1 
                    ? getProfileName(name, start + i, end, namingPattern) 
                    : name.trim();
                const result = await (window.api as any).profiles.create({
                    name: profileName,
                    platform,
                    browser_type: browserType,
                    tags: tags.join(', ') || undefined
                });
                if (result.success) {
                    const newProfile = result.data as { id: string; name: string };
                    if (proxyArg) {
                        await (window.api as any).profiles.updateProxy(newProfile.id, proxyArg);
                    }
                    createdList.push({ newProfile, proxyArg });
                }
            }
        } catch (err) {
            console.error('Error creating profiles:', err);
        }
        return createdList;
    };

    // ── With warmup ──────────────────────────────────────────
    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!name.trim()) return;
        setLoading(true);

        const createdList = await createMultipleProfilesInDb(quantity);
        setLoading(false);

        if (!createdList || createdList.length === 0) return;

        // Subscribe to progress events
        unsubProgress.current = window.api.warmup.onProgress((data) => {
            setWarmup(prev => {
                if (prev.phase !== 'warming') return prev;
                return {
                    ...prev,
                    profiles: prev.profiles.map(p =>
                        p.profileId === data.profileId
                            ? { ...p, current: data.current, total: data.total, url: data.url, phase: 'warming' }
                            : p
                    )
                };
            });
        });

        // Subscribe to complete events
        unsubComplete.current = window.api.warmup.onComplete((data) => {
            setWarmup(prev => {
                if (prev.phase !== 'warming') return prev;
                const updatedProfiles = prev.profiles.map(p =>
                    p.profileId === data.profileId
                        ? { ...p, phase: (data.ok ? 'done' as const : 'error' as const), sitesVisited: data.sitesVisited || 0, error: data.error }
                        : p
                );

                // Sequential mode logic - launch next profile's warmup
                if (prev.mode === 'sequential') {
                    const nextIdle = updatedProfiles.find(p => p.phase === 'idle');
                    if (nextIdle) {
                        window.api.warmup.start(nextIdle.profileId);
                        nextIdle.phase = 'warming';
                    }
                }

                const allFinished = updatedProfiles.every(p => p.phase === 'done' || p.phase === 'skipped' || p.phase === 'error');
                if (allFinished) {
                    setTimeout(() => {
                        unsubProgress.current?.();
                        unsubComplete.current?.();
                        onCreate(quantity > 1 ? `${name.trim()} (Lote)` : name.trim(), platform, tags.join(', ') || undefined, buildProxyArg());
                    }, 1200);
                    return {
                        ...prev,
                        phase: 'done',
                        profiles: updatedProfiles
                    };
                }

                return {
                    ...prev,
                    profiles: updatedProfiles
                };
            });
        });

        // Initialize state list of warming profiles
        const initialProfiles: ProfileWarmupProgress[] = createdList.map((item, idx) => ({
            profileId: item.newProfile.id,
            profileName: item.newProfile.name,
            phase: warmupMode === 'parallel' ? 'warming' : (idx === 0 ? 'warming' : 'idle'),
            current: 0,
            total: 40,
            url: '',
            sitesVisited: 0
        }));

        setWarmup({
            phase: 'warming',
            mode: warmupMode,
            profiles: initialProfiles
        });

        // Trigger warmup starts
        if (warmupMode === 'parallel') {
            for (const item of createdList) {
                window.api.warmup.start(item.newProfile.id);
            }
        } else {
            window.api.warmup.start(createdList[0].newProfile.id);
        }
    };

    // ── Without warmup ───────────────────────────────────────
    const handleSubmitFast = async () => {
        if (!name.trim()) return;
        setLoading(true);
        const createdList = await createMultipleProfilesInDb(quantity);
        setLoading(false);
        if (!createdList || createdList.length === 0) return;
        onCreate(quantity > 1 ? `${name.trim()} (Lote)` : name.trim(), platform, tags.join(', ') || undefined, buildProxyArg());
    };

    const skipCurrentProfile = () => {
        setWarmup(prev => {
            if (prev.phase !== 'warming') return prev;
            const currentWarming = prev.profiles.find(p => p.phase === 'warming');
            if (!currentWarming) return prev;

            const updatedProfiles = prev.profiles.map(p =>
                p.profileId === currentWarming.profileId
                    ? { ...p, phase: 'skipped' as const }
                    : p
            );

            const nextIdle = updatedProfiles.find(p => p.phase === 'idle');
            if (nextIdle) {
                window.api.warmup.start(nextIdle.profileId);
                nextIdle.phase = 'warming';
            }

            const allFinished = updatedProfiles.every(p => p.phase === 'done' || p.phase === 'skipped' || p.phase === 'error');
            if (allFinished) {
                setTimeout(() => {
                    unsubProgress.current?.();
                    unsubComplete.current?.();
                    onCreate(quantity > 1 ? `${name.trim()} (Lote)` : name.trim(), platform, tags.join(', ') || undefined, buildProxyArg());
                }, 1200);
                return {
                    ...prev,
                    phase: 'done',
                    profiles: updatedProfiles
                };
            }

            return {
                ...prev,
                profiles: updatedProfiles
            };
        });
    };

    const skipAllWarmups = () => {
        unsubProgress.current?.();
        unsubComplete.current?.();
        onCreate(quantity > 1 ? `${name.trim()} (Lote)` : name.trim(), platform, tags.join(', ') || undefined, buildProxyArg());
    };

    const addTag = () => {
        const t = newTag.trim();
        if (t && !tags.includes(t)) { setTags(prev => [...prev, t]); setNewTag(''); }
    };

    const removeTag = (tag: string) => setTags(prev => prev.filter(t => t !== tag));

    // ── Warmup screen ──────────────────────────────────────────
    if (warmup.phase === 'warming' || warmup.phase === 'done') {
        const done = warmup.phase === 'done';

        // Render standard single profile warmup screen for quantity = 1
        if (warmup.profiles.length === 1) {
            const single = warmup.profiles[0];
            const pct = single.total > 0 ? Math.round((single.current / single.total) * 100) : 0;
            const singleDone = single.phase === 'done' || done;
            const siteName = single.url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];

            return (
                <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.82)', backdropFilter:'blur(12px)' }}>
                    <div style={{ background:'#0f0f11', border: '1px solid var(--border-default)', borderRadius:22, width:'100%', maxWidth:440, padding:'36px 32px', display:'flex', flexDirection:'column', alignItems:'center', gap:24, boxShadow:'0 32px 80px rgba(0,0,0,0.7)', animation:'slideUp 0.25s cubic-bezier(0.4,0,0.2,1)' }}>
                        <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(12px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } } @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.5;} } @keyframes spin { to { transform: rotate(360deg); } }`}</style>

                        {/* Icon */}
                        <div style={{ width:64, height:64, borderRadius:18, background: singleDone ? 'rgba(52,211,153,0.12)' : 'rgba(251,146,60,0.1)', border: singleDone ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(251,146,60,0.25)', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.4s' }}>
                            {singleDone
                                ? <CheckCircle2 size={30} style={{ color:'#34d399' }} />
                                : <Flame size={30} style={{ color:'#fb923c', animation:'pulse 1.5s ease-in-out infinite' }} />
                            }
                        </div>

                        {/* Title */}
                        <div style={{ textAlign:'center' }}>
                            <h2 style={{ fontSize:17, fontWeight:700, color: 'var(--text-primary)', margin:'0 0 6px' }}>
                                {singleDone ? 'Perfil pronto!' : 'Aquecendo o perfil...'}
                            </h2>
                            <p style={{ fontSize:12.5, color:'#475569', margin:0, lineHeight:1.5 }}>
                                {singleDone
                                    ? `${single.sitesVisited} sites visitados. Cookies e histórico gerados.`
                                    : 'Visitando sites reais para construir cookies e histórico de navegação.'}
                            </p>
                        </div>

                        {/* Progress bar */}
                        <div style={{ width:'100%' }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                                <span style={{ fontSize:11, fontWeight:600, color: singleDone ? '#34d399' : '#fb923c' }}>
                                    {singleDone ? 'Concluído' : `${single.current} / ${single.total} sites`}
                                </span>
                                <span style={{ fontSize:11, fontWeight:700, color: 'var(--text-secondary)' }}>{pct}%</span>
                            </div>
                            <div style={{ height:6, background:'rgba(255,255,255,0.06)', borderRadius:999, overflow:'hidden' }}>
                                <div style={{ height:'100%', borderRadius:999, background: singleDone ? '#34d399' : 'linear-gradient(90deg,#fb923c,#f97316)', width:`${pct}%`, transition:'width 0.6s ease' }} />
                            </div>
                            {!singleDone && single.url && (
                                <p style={{ fontSize:10.5, color:'#334155', margin:'8px 0 0', textAlign:'center', fontFamily:'monospace' }}>
                                    {siteName}
                                </p>
                            )}
                        </div>

                        {/* Site icons strip — visual "social proof" */}
                        <div style={{ display:'flex', gap:6, flexWrap:'wrap', justifyContent:'center', opacity:0.45 }}>
                            {['Google','YouTube','Mercado Livre','Amazon','UOL','Globo','Reddit','Wikipedia'].map(s => (
                                <span key={s} style={{ fontSize:10, padding:'2px 7px', background:'rgba(255,255,255,0.04)', border: '1px solid var(--border-default)', borderRadius:5, color: 'var(--text-secondary)' }}>{s}</span>
                            ))}
                            <span style={{ fontSize:10, padding:'2px 7px', color:'#334155' }}>+32 mais</span>
                        </div>

                        {/* Skip button */}
                        {!singleDone && (
                            <button onClick={skipAllWarmups} style={{ fontSize:12, color:'#334155', background:'none', border:'none', cursor:'pointer', textDecoration:'underline', padding:0 }}>
                                Pular aquecimento
                            </button>
                        )}
                    </div>
                </div>
            );
        }

        // Multi-profile Progress UI (for quantity > 1)
        const completedCount = warmup.profiles.filter(p => p.phase === 'done' || p.phase === 'skipped' || p.phase === 'error').length;
        const totalCount = warmup.profiles.length;
        const overallPct = Math.round((completedCount / totalCount) * 100);
        const currentWarming = warmup.profiles.find(p => p.phase === 'warming');

        return (
            <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.85)', backdropFilter:'blur(12px)' }}>
                <div style={{ background:'#0f0f11', border: '1px solid var(--border-default)', borderRadius:24, width:'100%', maxWidth:500, padding:'32px 28px', display:'flex', flexDirection:'column', gap:20, boxShadow:'0 32px 80px rgba(0,0,0,0.7)', animation:'slideUp 0.25s cubic-bezier(0.4,0,0.2,1)', maxHeight:'calc(100vh - 64px)', overflow:'hidden' }}>
                    <style>{`
                        @keyframes slideUp { from { opacity:0; transform:translateY(12px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
                        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.5;} }
                        @keyframes spin { to { transform: rotate(360deg); } }
                        .warmup-list-scroll::-webkit-scrollbar { width: 4px; }
                        .warmup-list-scroll::-webkit-scrollbar-track { background: transparent; }
                        .warmup-list-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
                        .warmup-list-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.18); }
                    `}</style>

                    {/* Header */}
                    <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                        <div style={{ width:48, height:48, borderRadius:14, background: done ? 'rgba(52,211,153,0.12)' : 'rgba(251,146,60,0.1)', border: done ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(251,146,60,0.25)', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.4s' }}>
                            {done
                                ? <CheckCircle2 size={24} style={{ color:'#34d399' }} />
                                : <Flame size={24} style={{ color:'#fb923c', animation:'pulse 1.5s ease-in-out infinite' }} />
                            }
                        </div>
                        <div>
                            <h2 style={{ fontSize:16, fontWeight:700, color: 'var(--text-primary)', margin:'0 0 4px' }}>
                                {done ? 'Perfis prontos!' : `Aquecendo perfis (${warmup.mode === 'sequential' ? 'Fila' : 'Paralelo'})...`}
                            </h2>
                            <p style={{ fontSize:12, color: 'var(--text-secondary)', margin:0 }}>
                                {completedCount} de {totalCount} perfis concluídos
                            </p>
                        </div>
                    </div>

                    {/* Overall Progress */}
                    <div style={{ width:'100%', background:'rgba(255,255,255,0.02)', padding:'12px 16px', borderRadius:14, border: '1px solid var(--border-default)', boxSizing:'border-box' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                            <span style={{ fontSize:11, fontWeight:700, color: 'var(--text-primary)' }}>Progresso Geral</span>
                            <span style={{ fontSize:11, fontWeight:800, color: done ? '#34d399' : '#fb923c' }}>{overallPct}%</span>
                        </div>
                        <div style={{ height:6, background:'rgba(255,255,255,0.06)', borderRadius:999, overflow:'hidden' }}>
                            <div style={{ height:'100%', borderRadius:999, background: done ? '#34d399' : 'linear-gradient(90deg,#fb923c,#f97316)', width:`${overallPct}%`, transition:'width 0.5s ease' }} />
                        </div>
                    </div>

                    {/* Profiles List */}
                    <div className="warmup-list-scroll" style={{ display:'flex', flexDirection:'column', gap:10, overflowY:'auto', flex:1, paddingRight:4 }}>
                        {warmup.profiles.map(p => {
                            const active = p.phase === 'warming';
                            const pct = p.total > 0 ? Math.round((p.current / p.total) * 100) : 0;
                            const cleanUrl = p.url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];

                            return (
                                <div
                                    key={p.profileId}
                                    style={{
                                        padding: '12px 14px', borderRadius:14,
                                        background: active ? 'rgba(251,146,60,0.04)' : 'rgba(255,255,255,0.02)',
                                        border: active ? '1px solid rgba(251,146,60,0.25)' : '1px solid rgba(255,255,255,0.05)',
                                        display:'flex', flexDirection:'column', gap:8, transition:'all 0.2s'
                                    }}
                                >
                                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                                        <span style={{ fontSize:12.5, fontWeight:700, color: 'var(--text-primary)' }}>{p.profileName}</span>
                                        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                                            {p.phase === 'idle' && (
                                                <span style={{ fontSize:10, fontWeight:700, color:'#475569', background:'rgba(255,255,255,0.03)', border: '1px solid var(--border-default)', padding:'2px 7px', borderRadius:6, display:'flex', alignItems:'center', gap:4 }}>
                                                    <Clock size={10} /> Aguardando
                                                </span>
                                            )}
                                            {p.phase === 'warming' && (
                                                <span style={{ fontSize:10, fontWeight:700, color:'#fb923c', background:'rgba(251,146,60,0.1)', border:'1px solid rgba(251,146,60,0.25)', padding:'2px 7px', borderRadius:6, display:'flex', alignItems:'center', gap:4 }}>
                                                    <Flame size={10} style={{ animation:'spin 2s linear infinite' }} /> {pct}%
                                                </span>
                                            )}
                                            {p.phase === 'done' && (
                                                <span style={{ fontSize:10, fontWeight:700, color:'#34d399', background:'rgba(52,211,153,0.1)', border:'1px solid rgba(52,211,153,0.25)', padding:'2px 7px', borderRadius:6, display:'flex', alignItems:'center', gap:4 }}>
                                                    <CheckCircle2 size={10} /> Pronto ({p.sitesVisited} sites)
                                                </span>
                                            )}
                                            {p.phase === 'skipped' && (
                                                <span style={{ fontSize:10, fontWeight:700, color: 'var(--text-secondary)', background:'rgba(255,255,255,0.05)', border: '1px solid var(--border-default)', padding:'2px 7px', borderRadius:6, display:'flex', alignItems:'center', gap:4 }}>
                                                    Pulado
                                                </span>
                                            )}
                                            {p.phase === 'error' && (
                                                <span style={{ fontSize:10, fontWeight:700, color:'#f87171', background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.25)', padding:'2px 7px', borderRadius:6, display:'flex', alignItems:'center', gap:4 }}>
                                                    <AlertCircle size={10} /> Erro
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {active && (
                                        <div style={{ display:'flex', flexDirection:'column', gap:4, animation:'slideUp 0.15s ease-out' }}>
                                            <div style={{ height:3, background:'rgba(255,255,255,0.05)', borderRadius:99, overflow:'hidden' }}>
                                                <div style={{ height:'100%', background:'#fb923c', width:`${pct}%`, transition:'width 0.4s ease' }} />
                                            </div>
                                            {p.url && (
                                                <span style={{ fontSize:9.5, color:'#fb923c', fontFamily:'monospace', textOverflow:'ellipsis', overflow:'hidden', whiteSpace:'nowrap' }}>
                                                    → {cleanUrl}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Actions */}
                    <div style={{ display:'flex', gap:8, borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:16, flexShrink:0 }}>
                        {!done && warmup.mode === 'sequential' && currentWarming && (
                            <button
                                onClick={skipCurrentProfile}
                                style={{ flex:1, padding:'10px', borderRadius:11, background:'rgba(255,255,255,0.03)', border: '1px solid var(--border-default)', color:'#94a3b8', fontSize:12, fontWeight:700, cursor:'pointer', transition:'all 0.15s', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}
                                onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.06)'}
                                onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.03)'}
                            >
                                Pular Perfil
                            </button>
                        )}
                        {!done && (
                            <button
                                onClick={skipAllWarmups}
                                style={{ flex:1, padding:'10px', borderRadius:11, background:'transparent', border: '1px solid var(--border-default)', color:'#475569', fontSize:12, fontWeight:600, cursor:'pointer', transition:'all 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.color='#64748b'}
                                onMouseLeave={e => e.currentTarget.style.color='#475569'}
                            >
                                Pular Todos ({completedCount}/{totalCount})
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)' }}
            onClick={onClose}>
            <div
                style={{ background:'#0f0f11', border: '1px solid var(--border-default)', borderRadius:22, width:'100%', maxWidth:460, maxHeight:'calc(100vh - 48px)', display:'flex', flexDirection:'column', boxShadow:'0 32px 80px rgba(0,0,0,0.7)', animation:'slideUp 0.25s cubic-bezier(0.4,0,0.2,1)', overflow:'hidden' }}
                onClick={e => e.stopPropagation()}>

                <style>{`
                    @keyframes slideUp { from { opacity:0; transform:translateY(12px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
                    .create-modal-scroll::-webkit-scrollbar { width: 4px; }
                    .create-modal-scroll::-webkit-scrollbar-track { background: transparent; }
                    .create-modal-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
                    .create-modal-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.18); }
                `}</style>

                {/* Header */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'22px 24px 0' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <div style={{ width:36, height:36, borderRadius:10, background:'rgba(139,92,246,0.12)', border:'1px solid rgba(139,92,246,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <Fingerprint size={18} style={{ color:'#a78bfa' }} />
                        </div>
                        <div>
                            <h2 style={{ fontSize:16, fontWeight:700, color: 'var(--text-primary)', margin:0 }}>Novo Perfil</h2>
                            <p style={{ fontSize:11, color:'#475569', margin:0 }}>Identidade anti-detect isolada</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ width:30, height:30, borderRadius:8, background:'rgba(255,255,255,0.04)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                        <X size={15} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>
                    <div className="create-modal-scroll" style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:18, overflowY:'auto', flex:1 }}>

                        {/* Name & Quantity */}
                        <div style={{ display:'grid', gridTemplateColumns:'3.2fr 1.8fr', gap:12 }}>
                            <div>
                                <label style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color: 'var(--text-secondary)', display:'block', marginBottom:8 }}>Nome do Perfil</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="Ex: Conta Principal..."
                                    autoFocus
                                    style={{ width:'100%', padding:'9px 14px', background:'rgba(255,255,255,0.04)', border: '1px solid var(--border-default)', borderRadius:10, color: 'var(--text-primary)', fontSize:13, outline:'none', boxSizing:'border-box', transition:'border-color 0.15s' }}
                                    onFocus={e => e.currentTarget.style.borderColor='rgba(139,92,246,0.5)'}
                                    onBlur={e => e.currentTarget.style.borderColor = 'var(--border-default)'}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color: 'var(--text-secondary)', display:'block', marginBottom:8 }}>Quantidade</label>
                                <div style={{ display:'flex', alignItems:'center', background:'rgba(255,255,255,0.04)', border: '1px solid var(--border-default)', borderRadius:10, overflow:'hidden', height:38, boxSizing:'border-box' }}>
                                    <button
                                        type="button"
                                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                        style={{ width:30, height:'100%', background:'none', border:'none', color: 'var(--text-secondary)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:600, transition:'all 0.15s' }}
                                        onMouseEnter={e => e.currentTarget.style.color='#f1f5f9'}
                                        onMouseLeave={e => e.currentTarget.style.color='#64748b'}
                                    >
                                        -
                                    </button>
                                    <input
                                        type="number"
                                        value={quantity}
                                        onChange={e => setQuantity(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                                        style={{ flex:1, width:24, background:'none', border:'none', color: 'var(--text-primary)', fontSize:13, fontWeight:700, textAlign:'center', outline:'none', appearance:'none', margin:0, padding:0 }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setQuantity(q => Math.min(50, q + 1))}
                                        style={{ width:30, height:'100%', background:'none', border:'none', color: 'var(--text-secondary)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:600, transition:'all 0.15s' }}
                                        onMouseEnter={e => e.currentTarget.style.color='#f1f5f9'}
                                        onMouseLeave={e => e.currentTarget.style.color='#64748b'}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Bulk Naming Live Preview and Format Selector */}
                        {quantity > 1 && name.trim() && (
                            <div style={{
                                marginTop: -4,
                                padding: '12px 14px',
                                background: 'rgba(139, 92, 246, 0.03)',
                                border: '1px solid rgba(139, 92, 246, 0.15)',
                                borderRadius: 12,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 8,
                                animation: 'slideDown 0.2s ease-out'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#a78bfa' }}>
                                        Nomenclatura do Lote
                                    </span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span style={{ fontSize: 9, color: 'var(--text-secondary)' }}>Sufixo:</span>
                                        <select
                                            value={namingPattern}
                                            onChange={e => setNamingPattern(e.target.value as any)}
                                            style={{
                                                background: '#0f0f11',
                                                border: '1px solid var(--border-default)',
                                                borderRadius: 6,
                                                color: 'var(--text-primary)',
                                                fontSize: 10.5,
                                                padding: '3px 6px',
                                                outline: 'none',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <option value="space">Espaço (Nome 01)</option>
                                            <option value="hyphen">Hífen (Nome-01)</option>
                                            <option value="hash">Hash (Nome #01)</option>
                                            <option value="brackets">Colchetes (Nome [01])</option>
                                        </select>
                                    </div>
                                </div>
                                <div style={{ fontSize: 11.5, color: '#94a3b8', fontStyle: 'italic', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4 }}>
                                    <span>Nomes gerados:</span>
                                    <strong style={{ color: '#fb923c', fontStyle: 'normal' }}>
                                        {getPreviewNames()}
                                    </strong>
                                </div>
                                {computedStartCounter > 1 && (
                                    <div style={{ fontSize: 9.5, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fb923c', display: 'inline-block' }} />
                                        <span>Nomes anteriores já existentes. Iniciando sequência automaticamente a partir de {String(computedStartCounter).padStart(quantity + computedStartCounter - 1 >= 10 ? 2 : 1, '0')}.</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Platform */}
                        <div>
                            <label style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color: 'var(--text-secondary)', display:'block', marginBottom:8 }}>Plataforma</label>
                            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                                {PLATFORMS.map(opt => (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => setPlatform(opt.id)}
                                        style={{
                                            padding:'10px 8px', borderRadius:12, cursor:'pointer', transition:'all 0.15s',
                                            background: platform === opt.id ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)',
                                            border: platform === opt.id ? '1px solid rgba(139,92,246,0.4)' : '1px solid rgba(255,255,255,0.06)',
                                            color: platform === opt.id ? '#a78bfa' : '#64748b',
                                        }}>
                                        <div style={{ fontSize:20, marginBottom:4 }}>{opt.icon}</div>
                                        <div style={{ fontSize:12, fontWeight:600 }}>{opt.label}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Browser Engine */}
                        <div>
                            <label style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color: 'var(--text-secondary)', display:'block', marginBottom:8 }}>Navegador / Engine</label>
                            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8 }}>
                                {[
                                    { id: 'chromium', label: 'Chrome (Chromium)', icon: '🌐' },
                                    { id: 'firefox', label: 'Firefox', icon: '🦊' }
                                ].map(opt => (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => setBrowserType(opt.id as any)}
                                        style={{
                                            padding:'10px 8px', borderRadius:12, cursor:'pointer', transition:'all 0.15s',
                                            background: browserType === opt.id ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)',
                                            border: browserType === opt.id ? '1px solid rgba(139,92,246,0.4)' : '1px solid rgba(255,255,255,0.06)',
                                            color: browserType === opt.id ? '#a78bfa' : '#64748b',
                                        }}>
                                        <div style={{ fontSize:20, marginBottom:4 }}>{opt.icon}</div>
                                        <div style={{ fontSize:12, fontWeight:600 }}>{opt.label}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tags */}
                        <div>
                            <label style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color: 'var(--text-secondary)', display:'block', marginBottom:8 }}>Tags</label>
                            {tags.length > 0 && (
                                <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:8 }}>
                                    {tags.map(tag => {
                                        const isSocial = SOCIAL_TAG_COLORS[tag.toLowerCase()];
                                        const customStyle = isSocial
                                            ? { color: isSocial.color, background: isSocial.bgActive, borderColor: isSocial.borderActive }
                                            : { background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', color: '#a78bfa' };
                                        return (
                                            <span key={tag} style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 8px', borderRadius:6, fontSize:11, fontWeight:700, ...customStyle }}>
                                                {tag}
                                                <button type="button" onClick={() => removeTag(tag)} style={{ display:'flex', alignItems:'center', cursor:'pointer', color:'inherit', background:'none', border:'none', padding:0 }}>
                                                    <X size={10} />
                                                </button>
                                            </span>
                                        );
                                    })}
                                </div>
                            )}
                            <div style={{ display:'flex', gap:8 }}>
                                <input
                                    type="text"
                                    value={newTag}
                                    onChange={e => setNewTag(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                                    placeholder="Adicionar tag..."
                                    style={{ flex:1, padding:'8px 12px', background:'rgba(255,255,255,0.04)', border: '1px solid var(--border-default)', borderRadius:9, color: 'var(--text-primary)', fontSize:12, outline:'none' }}
                                />
                                <button type="button" onClick={addTag} style={{ width:34, height:34, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.04)', border: '1px solid var(--border-default)', borderRadius:9, color: 'var(--text-secondary)', cursor:'pointer' }}>
                                    <Plus size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Tag Templates */}
                        <div>
                            <button
                                type="button"
                                onClick={() => setShowTemplates(v => !v)}
                                style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'10px 14px', background: showTemplates ? 'rgba(139,92,246,0.07)' : 'rgba(255,255,255,0.02)', border: showTemplates ? '1px solid rgba(139,92,246,0.25)' : '1px solid rgba(255,255,255,0.06)', borderRadius: showTemplates ? '10px 10px 0 0' : 10, color: showTemplates ? '#a78bfa' : '#64748b', fontSize:12, fontWeight:600, cursor:'pointer', transition:'all 0.15s' }}>
                                <Tag size={14} />
                                <span style={{ flex:1, textAlign:'left' }}>Tags Template</span>
                                {showTemplates ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>

                            {showTemplates && (
                                <div style={{ padding:'12px 14px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(139,92,246,0.15)', borderTop:'none', borderRadius:'0 0 10px 10px', display:'flex', flexDirection:'column', gap:10 }}>
                                    {templates.map(tpl => (
                                        <div key={tpl.id}>
                                            <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color: tpl.color, display:'flex', alignItems:'center', gap:6, margin:'0 0 6px' }}>
                                                <span style={{ width:7, height:7, borderRadius:'50%', background: tpl.color, display:'inline-block', flexShrink:0 }} />
                                                {tpl.name}
                                            </p>
                                            <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                                                {tpl.tags.map(tag => {
                                                    const active = tags.includes(tag);
                                                    const isSocial = SOCIAL_TAG_COLORS[tag.toLowerCase()];
                                                    const customStyle = isSocial
                                                        ? (active
                                                            ? { borderColor: isSocial.borderActive, color: isSocial.color, backgroundColor: isSocial.bgActive, fontWeight: 700 }
                                                            : { borderColor: isSocial.border, color: isSocial.color, backgroundColor: isSocial.bg, opacity: 0.6, fontWeight: 500 })
                                                        : {
                                                            background: active ? `${tpl.color}18` : 'rgba(255,255,255,0.03)',
                                                            border: active ? `1px solid ${tpl.color}55` : '1px solid var(--border-default)',
                                                            color: active ? tpl.color : '#64748b',
                                                            fontWeight: active ? 700 : 500,
                                                        };
                                                    return (
                                                        <button
                                                            key={tag}
                                                            type="button"
                                                            onClick={() => active ? removeTag(tag) : (tags.includes(tag) ? null : setTags(prev => [...prev, tag]))}
                                                            style={{
                                                                padding:'4px 10px', borderRadius:6, fontSize:11, cursor:'pointer', transition:'all 0.15s',
                                                                ...customStyle
                                                            }}>
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

                        {/* Proxy quick-setup */}
                        <div>
                            <button
                                type="button"
                                onClick={() => setShowProxy(v => !v)}
                                style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'10px 14px', background:'rgba(255,255,255,0.02)', border: '1px solid var(--border-default)', borderRadius:10, color: 'var(--text-secondary)', fontSize:12, fontWeight:600, cursor:'pointer', transition:'all 0.15s' }}>
                                <Globe size={14} />
                                <span style={{ flex:1, textAlign:'left' }}>Adicionar Proxy (opcional)</span>
                                {showProxy ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>

                            {showProxy && (
                                <div style={{ marginTop:10, padding:14, background:'rgba(255,255,255,0.02)', border: '1px solid var(--border-default)', borderRadius:10, display:'flex', flexDirection:'column', gap:10 }}>
                                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                                        <div>
                                            <label style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#475569', display:'block', marginBottom:5 }}>Tipo</label>
                                            <select
                                                value={proxy.type}
                                                onChange={e => setProxy(p => ({ ...p, type: e.target.value as any }))}
                                                style={{ width:'100%', padding:'7px 10px', background:'rgba(255,255,255,0.04)', border: '1px solid var(--border-default)', borderRadius:8, color: 'var(--text-primary)', fontSize:12, outline:'none' }}>
                                                    <option value="http">HTTP</option>
                                                    <option value="https">HTTPS</option>
                                                    <option value="socks4">SOCKS4</option>
                                                    <option value="socks5">SOCKS5</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#475569', display:'block', marginBottom:5 }}>Porta</label>
                                            <input type="number" value={proxy.port} onChange={e => setProxy(p => ({ ...p, port: e.target.value }))} placeholder="8080"
                                                style={{ width:'100%', padding:'7px 10px', background:'rgba(255,255,255,0.04)', border: '1px solid var(--border-default)', borderRadius:8, color: 'var(--text-primary)', fontSize:12, outline:'none', boxSizing:'border-box' }} />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#475569', display:'block', marginBottom:5 }}>Host / IP</label>
                                        <input type="text" value={proxy.host} onChange={e => setProxy(p => ({ ...p, host: e.target.value }))} placeholder="192.168.1.1 ou proxy.example.com"
                                            style={{ width:'100%', padding:'7px 10px', background:'rgba(255,255,255,0.04)', border: '1px solid var(--border-default)', borderRadius:8, color: 'var(--text-primary)', fontSize:12, outline:'none', boxSizing:'border-box' }} />
                                    </div>
                                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                                        <div>
                                            <label style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#475569', display:'block', marginBottom:5 }}>Usuário</label>
                                            <input type="text" value={proxy.username} onChange={e => setProxy(p => ({ ...p, username: e.target.value }))} placeholder="Opcional"
                                                style={{ width:'100%', padding:'7px 10px', background:'rgba(255,255,255,0.04)', border: '1px solid var(--border-default)', borderRadius:8, color: 'var(--text-primary)', fontSize:12, outline:'none', boxSizing:'border-box' }} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#475569', display:'block', marginBottom:5 }}>Senha</label>
                                            <input type="password" value={proxy.password} onChange={e => setProxy(p => ({ ...p, password: e.target.value }))} placeholder="Opcional"
                                                style={{ width:'100%', padding:'7px 10px', background:'rgba(255,255,255,0.04)', border: '1px solid var(--border-default)', borderRadius:8, color: 'var(--text-primary)', fontSize:12, outline:'none', boxSizing:'border-box' }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Creation mode cards */}
                        <div>
                            <label style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color: 'var(--text-secondary)', display:'block', marginBottom:10 }}>Como deseja criar?</label>
                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>

                                {/* Card — Aquecido */}
                                <button
                                    type="button"
                                    disabled={loading}
                                    onClick={() => setSelectedMode('aquecido')}
                                    style={{
                                        padding:'14px 12px', borderRadius:14, cursor: !loading ? 'pointer' : 'default',
                                        background: selectedMode === 'aquecido' ? 'rgba(251,146,60,0.13)' : 'rgba(251,146,60,0.07)',
                                        border: selectedMode === 'aquecido' ? '2px solid rgba(251,146,60,0.6)' : '1px solid rgba(251,146,60,0.3)',
                                        color: 'var(--text-primary)', textAlign:'left', display:'flex', flexDirection:'column', gap:10,
                                        transition:'all 0.15s', opacity: !loading ? 1 : 0.45,
                                        boxShadow: selectedMode === 'aquecido' ? '0 0 0 3px rgba(251,146,60,0.1)' : 'none',
                                    }}
                                    onMouseEnter={e => { if (!loading && selectedMode !== 'aquecido') (e.currentTarget as HTMLButtonElement).style.background = 'rgba(251,146,60,0.11)'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = selectedMode === 'aquecido' ? 'rgba(251,146,60,0.13)' : 'rgba(251,146,60,0.07)'; }}
                                >
                                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                                        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                                            <div style={{ width:28, height:28, borderRadius:8, background:'rgba(251,146,60,0.15)', border:'1px solid rgba(251,146,60,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                                {loading ? <Loader2 size={13} style={{ color:'#fb923c', animation:'spin 0.8s linear infinite' }} /> : <Flame size={13} style={{ color:'#fb923c' }} />}
                                            </div>
                                            <span style={{ fontSize:12, fontWeight:700, color:'#fb923c' }}>Aquecido</span>
                                        </div>
                                        <span style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', padding:'2px 7px', background:'rgba(251,146,60,0.15)', border:'1px solid rgba(251,146,60,0.3)', borderRadius:5, color:'#fb923c' }}>Recomendado</span>
                                    </div>

                                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                                        {[
                                            { icon: <Cookie size={10} />, text: 'Cookies reais de 40+ sites' },
                                            { icon: <History size={10} />, text: 'Histórico de navegação' },
                                            { icon: <ShieldCheck size={10} />, text: 'Maior confiança no Google' },
                                            { icon: <Clock size={10} />, text: '~2 minutos por perfil' },
                                        ].map(({ icon, text }) => (
                                            <div key={text} style={{ display:'flex', alignItems:'center', gap:6 }}>
                                                <span style={{ color:'#fb923c', flexShrink:0 }}>{icon}</span>
                                                <span style={{ fontSize:11, color:'#94a3b8', lineHeight:1.3 }}>{text}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{ fontSize:10.5, color: 'var(--text-secondary)', lineHeight:1.4, borderTop:'1px solid rgba(251,146,60,0.12)', paddingTop:8 }}>
                                        Ideal para criar contas no Google, Meta, Twitter e qualquer site que analisa histórico do browser.
                                    </div>
                                </button>

                                {/* Card — Direto */}
                                <button
                                    type="button"
                                    disabled={loading}
                                    onClick={() => setSelectedMode('direto')}
                                    style={{
                                        padding:'14px 12px', borderRadius:14, cursor: !loading ? 'pointer' : 'default',
                                        background: selectedMode === 'direto' ? 'rgba(148,163,184,0.1)' : 'rgba(255,255,255,0.02)',
                                        border: selectedMode === 'direto' ? '2px solid rgba(148,163,184,0.4)' : '1px solid rgba(255,255,255,0.07)',
                                        color: 'var(--text-primary)', textAlign:'left', display:'flex', flexDirection:'column', gap:10,
                                        transition:'all 0.15s', opacity: !loading ? 1 : 0.45,
                                        boxShadow: selectedMode === 'direto' ? '0 0 0 3px rgba(148,163,184,0.08)' : 'none',
                                    }}
                                    onMouseEnter={e => { if (!loading && selectedMode !== 'direto') (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = selectedMode === 'direto' ? 'rgba(148,163,184,0.1)' : 'rgba(255,255,255,0.02)'; }}
                                >
                                    <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                                        <div style={{ width:28, height:28, borderRadius:8, background:'rgba(255,255,255,0.04)', border: '1px solid var(--border-default)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                            <Zap size={13} style={{ color:'#94a3b8' }} />
                                        </div>
                                        <span style={{ fontSize:12, fontWeight:700, color:'#94a3b8' }}>Direto</span>
                                    </div>

                                    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                                        {[
                                            { icon: <Zap size={10} />,         text: 'Pronto em segundos' },
                                            { icon: <Fingerprint size={10} />, text: 'Fingerprint único gerado' },
                                            { icon: <X size={10} />,           text: 'Sem cookies ou histórico' },
                                            { icon: <X size={10} />,           text: 'Menor confiança em sites' },
                                        ].map(({ icon, text }, i) => (
                                            <div key={text} style={{ display:'flex', alignItems:'center', gap:6 }}>
                                                <span style={{ color: i < 2 ? '#64748b' : '#334155', flexShrink:0 }}>{icon}</span>
                                                <span style={{ fontSize:11, color: i < 2 ? '#64748b' : '#334155', lineHeight:1.3 }}>{text}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{ fontSize:10.5, color:'#334155', lineHeight:1.4, borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:8 }}>
                                        Use para testes rápidos, ferramentas internas ou sites que não verificam histórico.
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Warmup Mode Option for multiple profiles */}
                        {quantity > 1 && selectedMode === 'aquecido' && (
                            <div style={{ marginTop: 4, padding: 14, background: 'rgba(251,146,60,0.04)', border: '1px solid rgba(251,146,60,0.15)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 8, animation: 'slideUp 0.2s ease-out' }}>
                                <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#fb923c' }}>
                                    Modo de Aquecimento ({quantity} Perfis)
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                    <button
                                        type="button"
                                        onClick={() => setWarmupMode('sequential')}
                                        style={{
                                            padding: '8px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                                            background: warmupMode === 'sequential' ? 'rgba(251,146,60,0.12)' : 'rgba(255,255,255,0.02)',
                                            border: warmupMode === 'sequential' ? '1px solid rgba(251,146,60,0.4)' : '1px solid rgba(255,255,255,0.06)',
                                            color: warmupMode === 'sequential' ? '#fb923c' : '#64748b',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                                        }}
                                    >
                                        <Clock size={12} />
                                        Um por um (Fila)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setWarmupMode('parallel')}
                                        style={{
                                            padding: '8px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                                            background: warmupMode === 'parallel' ? 'rgba(251,146,60,0.12)' : 'rgba(255,255,255,0.02)',
                                            border: warmupMode === 'parallel' ? '1px solid rgba(251,146,60,0.4)' : '1px solid rgba(255,255,255,0.06)',
                                            color: warmupMode === 'parallel' ? '#fb923c' : '#64748b',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                                        }}
                                    >
                                        <Zap size={12} />
                                        Todos de uma vez
                                    </button>
                                </div>
                                <p style={{ fontSize: 9.5, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.3 }}>
                                    {warmupMode === 'sequential'
                                        ? 'Recomendado. Abre um navegador por vez para evitar alto consumo de CPU/Memória.'
                                        : 'Aviso: Abre todos os navegadores simultaneamente. Requer máquina potente.'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div style={{ display:'flex', flexDirection:'column', gap:8, padding:'10px 24px 20px', flexShrink:0 }}>
                        {selectedMode && (
                            <button
                                type="button"
                                disabled={!name.trim() || loading}
                                onClick={() => selectedMode === 'aquecido' ? handleSubmit() : handleSubmitFast()}
                                style={{
                                    width:'100%', padding:'10px', borderRadius:11, fontSize:13, fontWeight:700, cursor: name.trim() && !loading ? 'pointer' : 'default',
                                    background: selectedMode === 'aquecido' ? 'linear-gradient(135deg,#fb923c,#f97316)' : 'rgba(148,163,184,0.15)',
                                    border: selectedMode === 'aquecido' ? 'none' : '1px solid rgba(148,163,184,0.25)',
                                    color: selectedMode === 'aquecido' ? '#fff' : '#94a3b8',
                                    opacity: name.trim() && !loading ? 1 : 0.45,
                                    display:'flex', alignItems:'center', justifyContent:'center', gap:7,
                                    boxShadow: selectedMode === 'aquecido' ? '0 4px 16px rgba(251,146,60,0.35)' : 'none',
                                    transition:'all 0.15s',
                                }}>
                                {loading
                                    ? <Loader2 size={14} style={{ animation:'spin 0.8s linear infinite' }} />
                                    : selectedMode === 'aquecido'
                                        ? <Flame size={14} />
                                        : <Zap size={14} />
                                }
                                {loading ? 'Criando...' : (quantity > 1 ? `Criar ${quantity} Perfis` : 'Criar Perfil')}
                            </button>
                        )}
                        <button type="button" onClick={onClose}
                            style={{ width:'100%', padding:'9px', borderRadius:11, background:'transparent', border: '1px solid var(--border-default)', color:'#475569', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                            Cancelar
                        </button>
                    </div>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </form>
            </div>
        </div>
    );
};

export default CreateProfileModal;
