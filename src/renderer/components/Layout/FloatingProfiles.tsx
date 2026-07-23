import React, { useState, useEffect, useRef } from 'react';
import { GripHorizontal, X, ExternalLink, Play, StopCircle, RefreshCw, Search, Folder as FolderIcon, LayoutGrid } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useToast } from '../../context/ToastContext';
import { Profile, Folder } from '../../types';

const getFolderColor = (folderId: string) => {
    try {
        const customizations = JSON.parse(localStorage.getItem('axe_folder_custom') || '{}');
        return customizations[folderId]?.color;
    } catch {
        return null;
    }
};

const FloatingProfiles: React.FC = () => {
    const { isProfilesFloating, setIsProfilesFloating } = useWorkspace();
    const { toast } = useToast();
    
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [, setCdpUrls] = useState<Record<string, string>>({});
    
    const [position, setPosition] = useState({ x: window.innerWidth - 390, y: 150 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartPos = useRef({ x: 0, y: 0 });
    const initialPos = useRef({ x: 0, y: 0 });

    const loadData = async () => {
        try {
            if (window.api && window.api.profiles) {
                const result = await window.api.profiles.list();
                if (result.success && Array.isArray(result.data)) {
                    setProfiles(result.data as Profile[]);
                }
                const foldersResult = await window.api.profiles.listFolders();
                if (foldersResult.success && Array.isArray(foldersResult.data)) {
                    setFolders(foldersResult.data as Folder[]);
                }
            }
        } catch (err) {
            console.error('Failed to load profiles inside widget:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isProfilesFloating) return;
        loadData();
        
        // Listen to normal browser closures
        let cleanupClose = () => {};
        if (window.api && window.api.browser) {
            cleanupClose = window.api.browser.onProfileClosed((profileId: string) => {
                setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, is_active: 0, status: 'ready' as any } : p));
                setCdpUrls(prev => { const next = { ...prev }; delete next[profileId]; return next; });
            });
        }
        
        // Poll status every 3s to stay in sync
        const interval = setInterval(loadData, 3000);
        
        // Listen to localStorage storage events in case profile is updated/deleted elsewhere
        const handleStorage = () => loadData();
        window.addEventListener('storage', handleStorage);
        
        return () => {
            cleanupClose();
            clearInterval(interval);
            window.removeEventListener('storage', handleStorage);
        };
    }, [isProfilesFloating]);

    useEffect(() => {
        const handleResize = () => {
            setPosition(prev => ({
                x: Math.min(prev.x, window.innerWidth - 370),
                y: Math.min(prev.y, window.innerHeight - 550)
            }));
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (!isProfilesFloating) return null;

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        setIsDragging(true);
        dragStartPos.current = { x: e.clientX, y: e.clientY };
        initialPos.current = { x: position.x, y: position.y };
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging) return;
        const dx = e.clientX - dragStartPos.current.x;
        const dy = e.clientY - dragStartPos.current.y;
        setPosition({
            x: Math.max(0, Math.min(window.innerWidth - 370, initialPos.current.x + dx)),
            y: Math.max(0, Math.min(window.innerHeight - 550, initialPos.current.y + dy))
        });
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        setIsDragging(false);
        e.currentTarget.releasePointerCapture(e.pointerId);
    };

    const handleLaunchProfile = async (profileId: string) => {
        setProfiles((prev) => prev.map((p) => p.id === profileId ? { ...p, status: 'running' as any } : p));
        try {
            const result = await window.api.browser.launch(profileId);
            if (result.success) {
                setProfiles((prev) => prev.map((p) => p.id === profileId ? { ...p, is_active: 1, status: 'running' as any } : p));
                const cdpResult = await window.api.browser.cdpUrl(profileId);
                if (cdpResult.success && cdpResult.data) {
                    setCdpUrls(prev => ({ ...prev, [profileId]: cdpResult.data as string }));
                }
            } else {
                setProfiles((prev) => prev.map((p) => p.id === profileId ? { ...p, status: 'ready' as any } : p));
                toast.error('Erro ao iniciar perfil', result.error as string);
            }
        } catch (error) {
            setProfiles((prev) => prev.map((p) => p.id === profileId ? { ...p, status: 'ready' as any } : p));
            toast.error('Erro ao iniciar perfil', String(error));
        }
    };

    const handleCloseProfile = async (profileId: string) => {
        try {
            const result = await window.api.browser.close(profileId);
            if (result.success) {
                setProfiles((prev) => prev.map((p) => p.id === profileId ? { ...p, is_active: 0, status: 'ready' as any } : p));
                setCdpUrls(prev => { const next = { ...prev }; delete next[profileId]; return next; });
            }
        } catch (error) {
            console.error('Error closing profile inside widget:', error);
        }
    };

    const handleExpandBack = () => {
        setIsProfilesFloating(false);
        // Navigate back to full profiles layout
        window.dispatchEvent(new CustomEvent('navigate-to', { detail: '/profiles' }));
    };

    const filteredProfiles = profiles.filter((p) => {
        if (p.category === 'trash') return false;
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFolder = !selectedFolderId || p.folder_id === selectedFolderId;
        return matchesSearch && matchesFolder;
    });

    const getOsIcon = (platform: string) => {
        if (platform.includes('Win')) return '🪟';
        if (platform.includes('Mac')) return '🍎';
        return '🐧';
    };

    return (
        <div
            style={{
                position: 'fixed',
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: '370px',
                height: '520px',
                backgroundColor: '#18181b',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                zIndex: 9997,
                color: 'white',
                fontFamily: 'Inter, sans-serif',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                transition: isDragging ? 'none' : 'box-shadow 0.2s ease, border-color 0.2s ease'
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    cursor: isDragging ? 'grabbing' : 'grab'
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <GripHorizontal size={16} color="#a1a1aa" />
                    <span style={{ fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        👤 Perfis Flutuantes
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={handleExpandBack}
                        style={{
                            background: 'transparent', border: 'none', color: '#a78bfa', cursor: 'pointer',
                            padding: '4px', borderRadius: '4px', display: 'flex'
                        }}
                        title="Maximizar para Tela Cheia"
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(167,139,250,0.1)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                        <ExternalLink size={16} />
                    </button>
                    <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => setIsProfilesFloating(false)}
                        style={{
                            background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer',
                            padding: '4px', borderRadius: '4px', display: 'flex'
                        }}
                        title="Fechar Widget"
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Search Box */}
            <div style={{ padding: '12px 16px 8px 16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '6px 10px', gap: '6px' }}>
                    <Search size={14} color="#71717a" />
                    <input
                        type="text"
                        placeholder="Buscar impressões digitais..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ background: 'transparent', border: 'none', outline: 'none', color: 'white', fontSize: '12px', width: '100%' }}
                    />
                </div>
            </div>

            {/* Folders Chips Carousel */}
            <div style={{ display: 'flex', gap: '6px', padding: '8px 16px', overflowX: 'auto', whiteSpace: 'nowrap', borderBottom: '1px solid rgba(255,255,255,0.02)' }} className="scrollbar-none">
                <button
                    onClick={() => setSelectedFolderId(null)}
                    style={{
                        padding: '4px 10px', fontSize: '11px', fontWeight: 600, borderRadius: '6px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)',
                        background: !selectedFolderId ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255,255,255,0.03)',
                        color: !selectedFolderId ? '#a78bfa' : '#a1a1aa',
                        borderColor: !selectedFolderId ? '#8b5cf6' : 'rgba(255,255,255,0.05)',
                    }}
                >
                    Todos ({profiles.filter(p => p.category !== 'trash').length})
                </button>
                {folders.map(f => {
                    const count = profiles.filter(p => p.folder_id === f.id && p.category !== 'trash').length;
                    const isSelected = selectedFolderId === f.id;
                    const color = getFolderColor(f.id) || '#a78bfa';
                    return (
                        <button
                            key={f.id}
                            onClick={() => setSelectedFolderId(f.id)}
                            style={{
                                padding: '4px 10px', fontSize: '11px', fontWeight: 600, borderRadius: '6px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)',
                                background: isSelected ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255,255,255,0.03)',
                                color: isSelected ? color : '#a1a1aa',
                                borderColor: isSelected ? `${color}60` : 'rgba(255,255,255,0.05)',
                            }}
                        >
                            {f.name} ({count})
                        </button>
                    );
                })}
            </div>

            {/* Profile List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px' }}>
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '8px' }}>
                        <RefreshCw size={18} className="animate-spin" color="#a1a1aa" />
                        <span style={{ fontSize: '12px', color: '#71717a' }}>Carregando perfis...</span>
                    </div>
                ) : filteredProfiles.length === 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '12px', color: '#71717a' }}>
                        Nenhum perfil encontrado nesta pasta
                    </div>
                ) : (
                    filteredProfiles.map((profile) => {
                        const isStarting = profile.status === 'running' && !profile.is_active;
                        return (
                            <div
                                key={profile.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '10px 12px',
                                    backgroundColor: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.04)',
                                    borderRadius: '10px',
                                    marginBottom: '6px',
                                    gap: '10px'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, #6d28d9 0%, #4f46e5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>
                                        {getOsIcon(profile.fingerprint?.platform || '')}
                                    </div>
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#f4f4f5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {profile.name}
                                            {profile.is_active === 1 && (
                                                <span style={{ width: '6px', height: '6px', borderRadius: '9999px', backgroundColor: '#10b981', boxShadow: '0 0 6px rgba(16,185,129,0.5)' }} />
                                            )}
                                        </div>
                                        {profile.notes && (
                                            <div style={{ fontSize: '10px', color: '#71717a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                                                {profile.notes}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {/* Action button */}
                                    <button
                                        disabled={isStarting}
                                        onClick={() => {
                                            profile.is_active === 1 ? handleCloseProfile(profile.id) : handleLaunchProfile(profile.id);
                                        }}
                                        style={{
                                            width: '28px',
                                            height: '28px',
                                            borderRadius: '6px',
                                            border: 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: isStarting ? 'not-allowed' : 'pointer',
                                            background: isStarting 
                                                ? 'rgba(139, 92, 246, 0.1)' 
                                                : profile.is_active === 1
                                                ? 'rgba(239, 68, 68, 0.15)'
                                                : 'rgba(167, 139, 250, 0.15)',
                                            color: isStarting 
                                                ? '#71717a'
                                                : profile.is_active === 1
                                                ? '#ef4444'
                                                : '#a78bfa'
                                        }}
                                        title={isStarting ? 'Iniciando...' : profile.is_active === 1 ? 'Parar' : 'Iniciar'}
                                    >
                                        {isStarting ? <RefreshCw size={12} className="animate-spin" /> : profile.is_active === 1 ? <StopCircle size={12} /> : <Play size={12} />}
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default FloatingProfiles;
