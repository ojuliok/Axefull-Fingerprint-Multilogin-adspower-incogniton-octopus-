import React, { useState, useEffect, useRef } from 'react';
import { Settings, User, CreditCard, Palette, Database, Info, LogOut, Download, Copy, Check, ChevronRight, Zap, LifeBuoy, MessageCircle, ExternalLink, BookOpen, Activity, Users, Crown, Shield, UserCheck, Loader2, UserPlus, UserMinus, LogIn, LayoutGrid, Layout as LayoutIcon, PanelLeft, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme, Theme, Layout, ButtonStyle } from '../context/ThemeContext';
import { useSecurity } from '../context/SecurityContext';
import styles from './SettingsPage.module.css';
import { AITimelinePage } from './AITimelinePage';
import { ThemeEditor } from '../features/Settings/ThemeEditor';

interface AppInfo {
    version: string;
    electronVersion: string;
    chromiumVersion: string;
    dataDir: string;
}

const PLAN_COLORS: Record<string, { bg: string; text: string }> = {
    free:       { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8' },
    starter:    { bg: 'rgba(59,130,246,0.15)',  text: '#60a5fa' },
    pro:        { bg: 'rgba(139,92,246,0.15)',  text: '#a78bfa' },
    enterprise: { bg: 'rgba(16,185,129,0.15)',  text: '#34d399' },
};

const SettingsPage: React.FC = () => {
    const { user, logout } = useAuth();
    const isMountedRef = useRef(true);
    const { toast } = useToast();
    const { theme, layout, buttonStyle, setTheme, setLayout, setButtonStyle } = useTheme();
    const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
    const [copiedDir, setCopiedDir] = useState(false);
    const [localApiPort, setLocalApiPort] = useState<number | null>(null);
    const [copiedApi, setCopiedApi] = useState(false);
    const [gridSizeDefault, setGridSizeDefault] = useState<string>(
        localStorage.getItem('gridSizeDefault') || 'medium'
    );
    const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(
        localStorage.getItem('sidebarCollapsedDefault') === 'true'
    );
    const [activeSection, setActiveSection] = useState<string>('appearance');

    // Team state
    const [team, setTeam] = useState<any>(null);
    const [teamLoading, setTeamLoading] = useState(false);
    const [teamName, setTeamName] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [teamError, setTeamError] = useState<string | null>(null);
    const [teamAction, setTeamAction] = useState(false);

    // Security state
    const { pin, secondPassword, timeoutMinutes, accessLogs, setPin, setSecondPassword, setTimeoutMinutes } = useSecurity();
    const [pinInput, setPinInput] = useState(pin || '');
    const [passInput, setPassInput] = useState(secondPassword || '');

    // Fixed Bookmark state
    const [fixedBookmarkName, setFixedBookmarkName] = useState('');
    const [fixedBookmarkUrl, setFixedBookmarkUrl] = useState('');

    useEffect(() => {
        isMountedRef.current = true;
        window.api.app.info().then(res => {
            if (isMountedRef.current && res.success) setAppInfo(res.data as AppInfo);
        });
        window.api.app.localApiPort().then(res => {
            if (isMountedRef.current && res.success && res.data) {
                setLocalApiPort((res.data as { port: number }).port);
            }
        });
        window.api.app.getFixedBookmark().then(res => {
            if (isMountedRef.current && res.success && res.data) {
                setFixedBookmarkName((res.data as any).name || '');
                setFixedBookmarkUrl((res.data as any).url || '');
            }
        });
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const loadTeam = async () => {
        setTeamLoading(true);
        setTeamError(null);
        const res = await window.api.team.me();
        if (!isMountedRef.current) return;
        setTeamLoading(false);
        if (res.success) setTeam((res.data as any)?.team ?? null);
        else setTeamError(res.error ?? 'Erro ao carregar equipe');
    };

    useEffect(() => {
        if (activeSection === 'team') loadTeam();
    }, [activeSection]);

    const handleCreateTeam = async () => {
        if (!teamName.trim()) return;
        setTeamAction(true);
        setTeamError(null);
        const res = await window.api.team.create(teamName.trim());
        if (!isMountedRef.current) return;
        setTeamAction(false);
        if (res.success) {
            setTeamName('');
            toast.success('Workspace criado com sucesso');
            loadTeam();
        } else {
            setTeamError(res.error ?? 'Erro ao criar workspace');
        }
    };

    const handleInvite = async () => {
        if (!inviteEmail.trim()) return;
        setTeamAction(true);
        setTeamError(null);
        const res = await window.api.team.invite(inviteEmail.trim());
        if (!isMountedRef.current) return;
        setTeamAction(false);
        if (res.success) {
            setInviteEmail('');
            toast.success('Convite enviado');
        } else {
            setTeamError(res.error ?? 'Erro ao enviar convite');
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        const res = await window.api.team.removeMember(memberId);
        if (!isMountedRef.current) return;
        if (res.success) { toast.success('Membro removido'); loadTeam(); }
        else toast.error(res.error ?? 'Erro ao remover membro');
    };

    const handleLeaveTeam = async () => {
        const res = await window.api.team.leave();
        if (!isMountedRef.current) return;
        if (res.success) { toast.success('Você saiu do time'); setTeam(null); }
        else toast.error(res.error ?? 'Erro ao sair do time');
    };

    const handleGridSizeChange = (size: string) => {
        setGridSizeDefault(size);
        localStorage.setItem('gridSizeDefault', size);
        toast.success('Preferência salva');
    };

    const handleSidebarToggle = () => {
        const next = !sidebarCollapsed;
        setSidebarCollapsed(next);
        localStorage.setItem('sidebarCollapsedDefault', String(next));
        toast.success('Preferência salva');
    };

    const handleCopyDir = () => {
        if (appInfo?.dataDir) {
            navigator.clipboard.writeText(appInfo.dataDir);
            setCopiedDir(true);
            setTimeout(() => setCopiedDir(false), 2000);
        }
    };

    const handleExportAll = async () => {
        try {
            const listRes = await window.api.profiles.list();
            if (!listRes.success || !Array.isArray(listRes.data)) {
                toast.error('Erro ao listar perfis');
                return;
            }
            const ids = (listRes.data as any[]).map(p => p.id);
            const res = await window.api.profiles.export(ids);
            if (res.success) {
                toast.success('Perfis exportados com sucesso');
            } else {
                toast.error('Exportação cancelada');
            }
        } catch {
            toast.error('Erro ao exportar perfis');
        }
    };

    const handleSaveFixedBookmark = async () => {
        try {
            const res = await window.api.app.saveFixedBookmark(fixedBookmarkName.trim(), fixedBookmarkUrl.trim());
            if (res.success) {
                toast.success('Favorito fixo salvo com sucesso');
            } else {
                toast.error(res.error || 'Erro ao salvar favorito');
            }
        } catch {
            toast.error('Erro ao salvar favorito');
        }
    };

    const planStyle = PLAN_COLORS[user?.plan ?? 'free'] ?? PLAN_COLORS.free;

    const SECTIONS = [
        { id: 'appearance', label: 'Aparência',       icon: Palette },
        { id: 'data',       label: 'Dados',           icon: Database },
        { id: 'security',   label: 'Segurança',       icon: Shield },
        { id: 'aitimeline', label: 'Auditoria de IA', icon: Activity },
        { id: 'support',    label: 'Suporte e Ajuda', icon: LifeBuoy },
        { id: 'about',      label: 'Sobre',           icon: Info },
    ];

    return (
        <div className={styles.page}>
            <div className={styles.nav}>
                <div className={styles.navHeader}>
                    <Settings size={16} className="text-violet-400" />
                    <span>Configurações</span>
                </div>
                {SECTIONS.map(s => {
                    const Icon = s.icon;
                    return (
                        <button
                            key={s.id}
                            className={`${styles.navItem} ${activeSection === s.id ? styles.navItemActive : ''}`}
                            onClick={() => setActiveSection(s.id)}>
                            <Icon size={15} />
                            <span>{s.label}</span>
                            {activeSection === s.id && <ChevronRight size={12} className="ml-auto text-violet-400" />}
                        </button>
                    );
                })}
            </div>

            <div className={styles.content}>

                {activeSection === 'account' && (
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Conta</h2>
                        <p className={styles.sectionDesc}>Informações da sua conta Axe MultiLogin.</p>

                        <div className={styles.card}>
                            <div className={styles.accountRow}>
                                <div className={styles.accountAvatar}>
                                    {user?.email?.slice(0, 2).toUpperCase() || 'Axe'}
                                </div>
                                <div className={styles.accountInfo}>
                                    <p className={styles.accountEmail}>{user?.email || '—'}</p>
                                    <div className={styles.accountMeta}>
                                        <span className={styles.planBadge} style={{ background: planStyle.bg, color: planStyle.text }}>
                                            {user?.plan_label || user?.plan || 'Free'}
                                        </span>
                                        <span className={styles.accountLimit}>{user?.max_profiles ?? 0} perfis permitidos</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={styles.dangerZone}>
                            <h3 className={styles.dangerTitle}>Zona de Perigo</h3>
                            <button className={styles.logoutBtn} onClick={logout}>
                                <LogOut size={14} /> Sair da Conta
                            </button>
                        </div>
                    </section>
                )}

                {activeSection === 'plan' && (
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Plano</h2>
                        <p className={styles.sectionDesc}>Seu plano atual e opções de upgrade.</p>

                        <div className={styles.card}>
                            <div className={styles.planCurrent}>
                                <Zap size={18} className="text-violet-400" />
                                <div>
                                    <p className={styles.planName}>{user?.plan_label || user?.plan || 'Free'}</p>
                                    <p className={styles.planDetail}>Até {user?.max_profiles ?? 0} perfis • Acesso ao Axe Anti-Detect Engine</p>
                                </div>
                                <span className={styles.planBadgeLarge} style={{ background: planStyle.bg, color: planStyle.text }}>
                                    ATIVO
                                </span>
                            </div>
                        </div>

                        {user?.plan === 'free' && (
                            <div className={styles.upgradeCard}>
                                <h3 className="text-base font-bold text-theme-text mb-1">Faça upgrade para Pro</h3>
                                <p className="text-sm text-slate-500 mb-4">Perfis ilimitados, fingerprints avançados e suporte prioritário.</p>
                                <button className={styles.upgradeBtn}>
                                    Ver Planos <ChevronRight size={14} />
                                </button>
                            </div>
                        )}
                    </section>
                )}

                {activeSection === 'team' && (
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Equipe</h2>
                        <p className={styles.sectionDesc}>Crie um workspace compartilhado e gerencie membros da sua equipe.</p>

                        {/* Free plan gate */}
                        {user?.plan === 'free' && (
                            <div className={styles.upgradeCard}>
                                <div className={styles.teamGateIcon}>
                                    <Crown size={22} className="text-violet-400" />
                                </div>
                                <h3 className="text-base font-bold text-theme-text mb-1">Recurso exclusivo Pro / Enterprise</h3>
                                <p className="text-sm text-slate-500 mb-4">Times e workspaces compartilhados estão disponíveis nos planos pagos.</p>
                                <button className={styles.upgradeBtn}>
                                    Ver Planos <ChevronRight size={14} />
                                </button>
                            </div>
                        )}

                        {/* Pro / Enterprise */}
                        {(user?.plan === 'pro' || user?.plan === 'enterprise') && (
                            <>
                                {teamLoading && (
                                    <div className={styles.teamLoading}>
                                        <Loader2 size={20} className="text-violet-400 animate-spin" />
                                        <span>Carregando equipe...</span>
                                    </div>
                                )}

                                {teamError && !teamLoading && (
                                    <div className={styles.teamError}>{teamError}</div>
                                )}

                                {/* No team yet */}
                                {!teamLoading && !team && (
                                    <div className={styles.card}>
                                        <div className={styles.teamEmpty}>
                                            <div className={styles.teamEmptyIcon}>
                                                <Users size={26} className="text-violet-400" />
                                            </div>
                                            <p className={styles.teamEmptyTitle}>Nenhum workspace</p>
                                            <p className={styles.teamEmptyHint}>Crie um workspace para colaborar com sua equipe.</p>
                                            <div className={styles.teamCreateRow}>
                                                <input
                                                    className={styles.teamInput}
                                                    placeholder="Nome do workspace..."
                                                    value={teamName}
                                                    onChange={e => setTeamName(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && handleCreateTeam()}
                                                />
                                                <button
                                                    className={styles.teamCreateBtn}
                                                    onClick={handleCreateTeam}
                                                    disabled={teamAction || !teamName.trim()}>
                                                    {teamAction ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                                                    Criar Workspace
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Has team */}
                                {!teamLoading && team && (
                                    <>
                                        {/* Team header */}
                                        <div className={styles.card}>
                                            <div className={styles.teamHeader}>
                                                <div className={styles.teamAvatar}>
                                                    {(team.name as string).slice(0, 2).toUpperCase()}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <p className={styles.teamName}>{team.name}</p>
                                                    <p className={styles.teamMeta}>
                                                        {(team.members as any[])?.length ?? 0} membros
                                                    </p>
                                                </div>
                                                <span className={`${styles.roleBadge} ${styles.roleOwner}`}>
                                                    {team.role === 'owner' ? 'Owner' : team.role === 'admin' ? 'Admin' : 'User'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Members list */}
                                        <div className={styles.card}>
                                            <p className={styles.teamSectionLabel}>Membros</p>
                                            <div className={styles.memberList}>
                                                {(team.members as any[])?.map((m: any) => (
                                                    <div key={m.uid} className={styles.memberRow}>
                                                        <div className={styles.memberAvatar}>
                                                            {(m.email as string).slice(0, 2).toUpperCase()}
                                                        </div>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <p className={styles.memberEmail}>{m.email}</p>
                                                        </div>
                                                        <span className={`${styles.roleBadge} ${
                                                            m.role === 'owner' ? styles.roleOwner :
                                                            m.role === 'admin' ? styles.roleAdmin :
                                                            styles.roleUser
                                                        }`}>
                                                            {m.role === 'owner' ? 'Owner' : m.role === 'admin' ? 'Admin' : 'Usuário'}
                                                        </span>
                                                        {team.role === 'owner' && m.role !== 'owner' && (
                                                            <button
                                                                className={styles.memberRemoveBtn}
                                                                onClick={() => handleRemoveMember(m.uid)}
                                                                title="Remover membro">
                                                                <UserMinus size={13} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Invite */}
                                        {(team.role === 'owner' || team.role === 'admin') && (
                                            <div className={styles.card}>
                                                <p className={styles.teamSectionLabel}>Convidar por e-mail</p>
                                                <div className={styles.inviteRow}>
                                                    <input
                                                        className={styles.teamInput}
                                                        placeholder="email@exemplo.com"
                                                        type="email"
                                                        value={inviteEmail}
                                                        onChange={e => setInviteEmail(e.target.value)}
                                                        onKeyDown={e => e.key === 'Enter' && handleInvite()}
                                                    />
                                                    <button
                                                        className={styles.inviteBtn}
                                                        onClick={handleInvite}
                                                        disabled={teamAction || !inviteEmail.trim()}>
                                                        {teamAction ? <Loader2 size={13} className="animate-spin" /> : <LogIn size={13} />}
                                                        Enviar Convite
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Leave */}
                                        {team.role !== 'owner' && (
                                            <div className={styles.dangerZone}>
                                                <h3 className={styles.dangerTitle}>Zona de Perigo</h3>
                                                <button className={styles.logoutBtn} onClick={handleLeaveTeam}>
                                                    <Shield size={14} /> Sair do Time
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </section>
                )}

                {activeSection === 'appearance' && (
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Aparência</h2>
                        <p className={styles.sectionDesc}>Personalize como a interface é exibida.</p>

                        {/* Temas Visuais */}
                        <div className={styles.card}>
                            <p className={styles.settingLabel} style={{ fontSize: '14px', marginBottom: '4px' }}>Tema Visual</p>
                            <p className={styles.settingHint} style={{ marginBottom: '16px' }}>Selecione uma paleta estética premium para a interface do aplicativo.</p>
                            
                            <div className={styles.themeGrid}>
                                {[
                                    { id: 'dark',           label: 'Escuro Clássico', bg: '#09090B', colors: ['#8B5CF6', '#3B82F6', '#EC4899'] },
                                    { id: 'light',          label: 'Claro Clássico',  bg: '#f8fafc', colors: ['#7c3aed', '#3B82F6', '#EC4899'] },
                                    { id: 'retro-vintage',  label: 'American Retro',  bg: '#12100E', colors: ['#DFA05D', '#AC5045', '#658761'] },
                                    { id: 'cyber-retro',    label: 'Retro Cyber',     bg: '#15181C', colors: ['#4b607f', '#e8d8c9', '#f3701e'] },
                                    { id: 'luxury-supreme', label: 'Luxury Supreme',  bg: '#0A0A0A', colors: ['#a67d43', '#ad0013', '#1C1D1C'] },
                                    { id: 'cool-tech',      label: 'Cool Tech',       bg: '#08090A', colors: ['#00FF43', '#C2C4C8', '#484C51'] },
                                    { id: 'pool-vibe',      label: 'Pool Vibe',       bg: '#EBF2F3', colors: ['#3DA0AB', '#F2E8D1', '#DD664E'] },
                                ].map((item) => {
                                    const isActive = theme === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                setTheme(item.id as Theme);
                                                toast.success(`Tema ${item.label} aplicado`);
                                            }}
                                            className={`${styles.themeCard} ${isActive ? styles.themeCardActive : ''}`}
                                        >
                                            <div className={styles.themePreview} style={{ backgroundColor: item.bg }}>
                                                {item.colors.map((c, idx) => (
                                                    <span key={idx} className={styles.themeBubble} style={{ backgroundColor: c }} />
                                                ))}
                                            </div>
                                            <span className={styles.themeLabel}>{item.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Editor de Tema Customizado */}
                        <div className={styles.card}>
                            <ThemeEditor />
                        </div>

                        {/* Layouts Estruturais */}
                        <div className={styles.card}>
                            <p className={styles.settingLabel} style={{ fontSize: '14px', marginBottom: '4px' }}>Estrutura de Layout</p>
                            <p className={styles.settingHint} style={{ marginBottom: '16px' }}>Mude a distribuição e o comportamento das barras de navegação do aplicativo.</p>

                            <div className={styles.layoutGrid}>
                                {[
                                    { 
                                        id: 'classic-sidebar', 
                                        label: 'Sidebar Clássica', 
                                        desc: 'Menu lateral fino de ícones fixados à esquerda.',
                                        icon: PanelLeft,
                                        mock: (
                                            <div className="flex h-full w-full">
                                                <div className="w-3 bg-violet-600/30 border-r border-white/5 h-full" />
                                                <div className="flex-1 flex flex-col h-full justify-between p-0.5">
                                                    <div className="h-1.5 bg-white/5 rounded-sm" />
                                                    <div className="flex gap-0.5">
                                                        <div className="w-2 h-2 bg-white/5 rounded-sm" />
                                                        <div className="w-2 h-2 bg-white/5 rounded-sm" />
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    },
                                    { 
                                        id: 'classic-sidebar-right', 
                                        label: 'Sidebar Direita', 
                                        desc: 'Menu lateral fino de ícones fixados à direita.',
                                        icon: PanelLeft,
                                        mock: (
                                            <div className="flex h-full w-full">
                                                <div className="flex-1 flex flex-col h-full justify-between p-0.5">
                                                    <div className="h-1.5 bg-white/5 rounded-sm" />
                                                    <div className="flex gap-0.5 justify-end">
                                                        <div className="w-2 h-2 bg-white/5 rounded-sm" />
                                                        <div className="w-2 h-2 bg-white/5 rounded-sm" />
                                                    </div>
                                                </div>
                                                <div className="w-3 bg-violet-600/30 border-l border-white/5 h-full" />
                                            </div>
                                        )
                                    },
                                    { 
                                        id: 'top-navigation', 
                                        label: 'Navegação Superior', 
                                        desc: 'Barra horizontal integrada ao topo, liberando as laterais.',
                                        icon: LayoutIcon,
                                        mock: (
                                            <div className="flex flex-col h-full w-full justify-between">
                                                <div className="h-3.5 bg-violet-600/30 border-b border-white/5 flex items-center px-1 gap-1">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                                                    <div className="w-2 h-0.5 bg-white/20 rounded-sm" />
                                                    <div className="w-2 h-0.5 bg-white/20 rounded-sm" />
                                                </div>
                                                <div className="flex-1 p-0.5 flex gap-0.5">
                                                    <div className="w-3 h-2 bg-white/5 rounded-sm" />
                                                    <div className="w-3 h-2 bg-white/5 rounded-sm" />
                                                </div>
                                            </div>
                                        )
                                    },
                                    { 
                                        id: 'floating-dock', 
                                        label: 'Dock Flutuante', 
                                        desc: 'Visão limpa de ponta a ponta com dock flutuante inferior.',
                                        icon: Eye,
                                        mock: (
                                            <div className="flex flex-col h-full w-full justify-between p-0.5">
                                                <div className="flex gap-0.5">
                                                    <div className="w-2 h-2 bg-white/5 rounded-sm" />
                                                    <div className="w-2 h-2 bg-white/5 rounded-sm" />
                                                </div>
                                                <div className="self-center w-10 h-2 bg-violet-600/30 rounded-full border border-white/10" />
                                            </div>
                                        )
                                    },
                                    { 
                                        id: 'split-panel', 
                                        label: 'Painel Dividido', 
                                        desc: 'Menu lateral largo de 220px com rótulos e status do app.',
                                        icon: PanelLeft,
                                        mock: (
                                            <div className="flex h-full w-full">
                                                <div className="w-6 bg-violet-600/30 border-r border-white/5 h-full p-0.5 flex flex-col gap-0.5 shrink-0">
                                                    <div className="w-full h-0.5 bg-white/20 rounded-sm" />
                                                    <div className="w-full h-0.5 bg-white/20 rounded-sm" />
                                                </div>
                                                <div className="flex-1 flex flex-col h-full justify-between p-0.5">
                                                    <div className="h-1.5 bg-white/5 rounded-sm" />
                                                    <div className="w-full h-2 bg-white/5 rounded-sm" />
                                                </div>
                                            </div>
                                        )
                                    },
                                    { 
                                        id: 'futuristic-console', 
                                        label: 'Console Holográfico', 
                                        desc: 'Interface futurista cercada por frame de neon e scanlines.',
                                        icon: Settings,
                                        mock: (
                                            <div className="flex h-full w-full p-0.5 border border-emerald-500/30 bg-black/40">
                                                <div className="w-2 bg-emerald-500/15 border-r border-emerald-500/20 h-full shrink-0" />
                                                <div className="flex-1 flex flex-col h-full justify-between p-0.5">
                                                    <div className="h-1 bg-emerald-500/10 rounded-sm" />
                                                    <div className="w-full h-2 bg-emerald-500/5 rounded-sm" />
                                                </div>
                                            </div>
                                        )
                                    },
                                ].map((item) => {
                                    const isActive = layout === item.id;
                                    const IconComponent = item.icon;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                setLayout(item.id as Layout);
                                                toast.success(`Layout ${item.label} aplicado`);
                                            }}
                                            className={`${styles.layoutCard} ${isActive ? styles.layoutCardActive : ''}`}
                                        >
                                            <div className={styles.layoutPreviewMockup}>
                                                {item.mock}
                                            </div>
                                            <div className={styles.layoutHeader}>
                                                <IconComponent size={14} className={styles.layoutIcon} />
                                                <span className={styles.layoutLabel}>{item.label}</span>
                                            </div>
                                            <p className={styles.layoutDesc}>{item.desc}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Estilo dos Botões */}
                        <div className={styles.card}>
                            <p className={styles.settingLabel} style={{ fontSize: '14px', marginBottom: '4px' }}>Estilo dos Botões</p>
                            <p className={styles.settingHint} style={{ marginBottom: '16px' }}>Personalize o estilo visual, bordas e efeitos dos botões do sistema.</p>

                            <div className={styles.themeGrid}>
                                {[
                                    { id: 'default',       label: 'Padrão Moderno', mock: <button className="btn btn-primary btn-sm" style={{ width: '100%' }}>Padrão</button> },
                                    { id: 'retro-striped', label: 'Retro Listrado',  mock: <button className="btn btn-primary btn-sm" style={{ width: '100%' }}>Retro</button> },
                                    { id: 'gold-gradient', label: 'Cápsula de Ouro', mock: <button className="btn btn-primary btn-sm" style={{ width: '100%' }}>Premium</button> },
                                    { id: 'cyber-neon',    label: 'Console Neon',   mock: <button className="btn btn-primary btn-sm" style={{ width: '100%', fontSize: '10px' }}>Neon</button> },
                                    { id: 'glossy-pill',   label: 'Vidro Brilhante', mock: <button className="btn btn-primary btn-sm" style={{ width: '100%' }}>Glossy</button> },
                                    { id: 'glass-card',    label: 'Borda de Vidro', mock: <button className="btn btn-primary btn-sm" style={{ width: '100%' }}>Card</button> },
                                ].map((item) => {
                                    const isActive = buttonStyle === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                setButtonStyle(item.id as ButtonStyle);
                                                toast.success(`Estilo de botão ${item.label} aplicado`);
                                            }}
                                            className={`${styles.themeCard} ${isActive ? styles.themeCardActive : ''}`}
                                        >
                                            <div className="h-14 flex items-center justify-center p-2 rounded-lg bg-black/20" data-button-style={item.id}>
                                                {item.mock}
                                            </div>
                                            <span className={styles.themeLabel}>{item.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Outros Ajustes */}
                        <div className={styles.card}>
                            <p className={styles.settingLabel} style={{ fontSize: '14px', marginBottom: '12px' }}>Preferências Gerais</p>

                            <div className={styles.settingRow}>
                                <div>
                                    <p className={styles.settingLabel}>Tamanho padrão dos cards</p>
                                    <p className={styles.settingHint}>Aplica-se ao modo grade ao abrir o app</p>
                                </div>
                                <div className={styles.sizeGroup}>
                                    {(['small', 'medium', 'large'] as const).map(size => (
                                        <button
                                            key={size}
                                            className={`${styles.sizeBtn} ${gridSizeDefault === size ? styles.sizeBtnActive : ''}`}
                                            onClick={() => handleGridSizeChange(size)}>
                                            {size === 'small' ? 'Pequeno' : size === 'medium' ? 'Médio' : 'Grande'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.settingDivider} />

                            <div className={styles.settingRow}>
                                <div>
                                    <p className={styles.settingLabel}>Painel lateral recolhido por padrão</p>
                                    <p className={styles.settingHint}>O painel de categorias inicia minimizado</p>
                                </div>
                                <button
                                    className={`${styles.toggle} ${sidebarCollapsed ? styles.toggleOn : ''}`}
                                    onClick={handleSidebarToggle}>
                                    <span className={styles.toggleThumb} />
                                </button>
                            </div>
                        </div>
                    </section>
                )}

                {activeSection === 'data' && (
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Dados</h2>
                        <p className={styles.sectionDesc}>Gerencie dados locais e exportações.</p>

                        <div className={styles.card}>
                            <div className={styles.settingRow}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p className={styles.settingLabel}>Diretório de dados</p>
                                    <p className={styles.dirPath}>{appInfo?.dataDir || 'Carregando...'}</p>
                                </div>
                                <button className={styles.copyBtn} onClick={handleCopyDir} title="Copiar caminho">
                                    {copiedDir ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                </button>
                            </div>
                        </div>

                        <div className={styles.card}>
                            <div className={styles.settingRow}>
                                <div>
                                    <p className={styles.settingLabel}>Exportar todos os perfis</p>
                                    <p className={styles.settingHint}>Salva todos os perfis em um arquivo JSON</p>
                                </div>
                                <button className={styles.exportBtn} onClick={handleExportAll}>
                                    <Download size={13} /> Exportar
                                </button>
                            </div>
                        </div>
                        <div className={styles.card}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div>
                                    <p className={styles.settingLabel}>Favorito Fixo (Barra de Favoritos)</p>
                                    <p className={styles.settingHint}>Configure uma URL fixa que ficará visível na barra de favoritos de todos os perfis ao iniciar o navegador.</p>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                    <div style={{ flex: 1, minWidth: '150px' }}>
                                        <label style={{ fontSize: '11px', color: 'var(--text-muted, #71717a)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', display: 'block' }}>Nome do Favorito</label>
                                        <input
                                            type="text"
                                            className={styles.teamInput}
                                            style={{ width: '100%', height: '36px', padding: '0 10px', fontSize: '13px' }}
                                            placeholder="Ex: Google"
                                            value={fixedBookmarkName}
                                            onChange={e => setFixedBookmarkName(e.target.value)}
                                        />
                                    </div>
                                    <div style={{ flex: 2, minWidth: '220px' }}>
                                        <label style={{ fontSize: '11px', color: 'var(--text-muted, #71717a)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', display: 'block' }}>URL</label>
                                        <input
                                            type="text"
                                            className={styles.teamInput}
                                            style={{ width: '100%', height: '36px', padding: '0 10px', fontSize: '13px' }}
                                            placeholder="Ex: https://google.com"
                                            value={fixedBookmarkUrl}
                                            onChange={e => setFixedBookmarkUrl(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                                    <button 
                                        className={styles.teamCreateBtn}
                                        style={{ height: '36px', padding: '0 16px' }}
                                        onClick={handleSaveFixedBookmark}
                                    >
                                        Salvar Favorito
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {activeSection === 'support' && (
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Suporte e Ajuda</h2>
                        <p className={styles.sectionDesc}>Recursos de ajuda, documentação e contato com o suporte.</p>

                        <div className={styles.card}>
                            <div className={styles.supportGrid}>
                                <a className={styles.supportItem} href="#" onClick={e => e.preventDefault()}>
                                    <div className={styles.supportIcon} style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
                                        <BookOpen size={18} style={{ color: '#a78bfa' }} />
                                    </div>
                                    <div>
                                        <p className={styles.supportLabel}>Documentação</p>
                                        <p className={styles.supportHint}>Guias, tutoriais e referências da API</p>
                                    </div>
                                    <ExternalLink size={13} className={styles.supportArrow} />
                                </a>

                                <a className={styles.supportItem} href="#" onClick={e => e.preventDefault()}>
                                    <div className={styles.supportIcon} style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                                        <MessageCircle size={18} style={{ color: '#60a5fa' }} />
                                    </div>
                                    <div>
                                        <p className={styles.supportLabel}>Chat de Suporte</p>
                                        <p className={styles.supportHint}>Fale com nossa equipe em tempo real</p>
                                    </div>
                                    <ExternalLink size={13} className={styles.supportArrow} />
                                </a>

                                <a className={styles.supportItem} href="#" onClick={e => e.preventDefault()}>
                                    <div className={styles.supportIcon} style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                                        <MessageCircle size={18} style={{ color: '#34d399' }} />
                                    </div>
                                    <div>
                                        <p className={styles.supportLabel}>Comunidade</p>
                                        <p className={styles.supportHint}>Fórum e grupo de usuários Axe</p>
                                    </div>
                                    <ExternalLink size={13} className={styles.supportArrow} />
                                </a>

                                <a className={styles.supportItem} href="#" onClick={e => e.preventDefault()}>
                                    <div className={styles.supportIcon} style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                                        <LifeBuoy size={18} style={{ color: '#fbbf24' }} />
                                    </div>
                                    <div>
                                        <p className={styles.supportLabel}>Abrir Ticket</p>
                                        <p className={styles.supportHint}>Reporte um bug ou problema técnico</p>
                                    </div>
                                    <ExternalLink size={13} className={styles.supportArrow} />
                                </a>
                            </div>
                        </div>

                        <div className={styles.card} style={{ marginTop: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#6d28d9,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <LifeBuoy size={18} style={{ color: '#fff' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p className={styles.supportLabel}>Suporte Prioritário</p>
                                    <p className={styles.supportHint}>
                                        {(user?.plan === 'pro' || user?.plan === 'enterprise')
                                            ? 'Disponível no seu plano. Tempo de resposta: até 4h.'
                                            : 'Disponível nos planos Pro e Enterprise.'}
                                    </p>
                                </div>
                                {!(user?.plan === 'pro' || user?.plan === 'enterprise') && (
                                    <button className={styles.upgradeBtn} style={{ flexShrink: 0 }}>
                                        Fazer Upgrade <ChevronRight size={13} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </section>
                )}

                {activeSection === 'about' && (
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Sobre</h2>
                        <p className={styles.sectionDesc}>Informações sobre esta versão do Axe MultiLogin.</p>

                        <div className={styles.card}>
                            <div className={styles.aboutGrid}>
                                <div className={styles.aboutItem}>
                                    <span className={styles.aboutLabel}>Versão do App</span>
                                    <span className={styles.aboutValue}>v{appInfo?.version || '—'}</span>
                                </div>
                                <div className={styles.aboutItem}>
                                    <span className={styles.aboutLabel}>Electron</span>
                                    <span className={styles.aboutValue}>{appInfo?.electronVersion || '—'}</span>
                                </div>
                                <div className={styles.aboutItem}>
                                    <span className={styles.aboutLabel}>Chromium</span>
                                    <span className={styles.aboutValue}>{appInfo?.chromiumVersion || '—'}</span>
                                </div>
                                <div className={styles.aboutItem}>
                                    <span className={styles.aboutLabel}>Plataforma</span>
                                    <span className={styles.aboutValue}>{navigator.platform}</span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.card}>
                            <div className={styles.settingRow}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 10, background: localApiPort ? 'rgba(16,185,129,0.12)' : 'rgba(100,116,139,0.12)', border: `1px solid ${localApiPort ? 'rgba(16,185,129,0.2)' : 'rgba(100,116,139,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Activity size={15} style={{ color: localApiPort ? '#34d399' : '#64748b' }} />
                                    </div>
                                    <div>
                                        <p className={styles.settingLabel}>API Local REST</p>
                                        <p className={styles.settingHint}>
                                            {localApiPort
                                                ? <><span style={{ color: '#34d399', fontWeight: 700 }}>Online</span> — http://127.0.0.1:{localApiPort}</>
                                                : 'Offline'}
                                        </p>
                                    </div>
                                </div>
                                {localApiPort && (
                                    <button className={styles.copyBtn} onClick={() => {
                                        navigator.clipboard.writeText(`http://127.0.0.1:${localApiPort}`);
                                        setCopiedApi(true);
                                        setTimeout(() => setCopiedApi(false), 2000);
                                    }} title="Copiar URL da API">
                                        {copiedApi ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className={styles.card}>
                            <div className={styles.aboutBrand}>
                                <p className="text-sm font-bold text-slate-300 mb-1">Axe MultiLogin</p>
                                <p className="text-xs text-slate-600">Anti-Detect Browser Engine • Todos os direitos reservados</p>
                            </div>
                        </div>
                    </section>
                )}

                {activeSection === 'aitimeline' && (
                    <section className={styles.section} style={{ maxWidth: '100%' }}>
                        <AITimelinePage />
                    </section>
                )}

                {activeSection === 'security' && (
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Segurança</h2>
                        <p className={styles.sectionDesc}>Proteja o acesso ao aplicativo e veja o histórico de sessões.</p>

                        <div className={styles.card}>
                            <p className={styles.settingLabel} style={{ fontSize: '14px', marginBottom: '12px' }}>Autenticação de Acesso</p>
                            
                            <div className={styles.settingRow}>
                                <div>
                                    <p className={styles.settingLabel}>PIN de Segurança</p>
                                    <p className={styles.settingHint}>Código numérico para bloqueio de tela</p>
                                </div>
                                <div className="flex gap-2">
                                    <input 
                                        type="password" 
                                        maxLength={4}
                                        value={pinInput}
                                        onChange={e => setPinInput(e.target.value.replace(/\D/g, ''))}
                                        placeholder="0000"
                                        className="w-24 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-theme-text text-center tracking-widest focus:outline-none focus:border-violet-500"
                                    />
                                    <button 
                                        onClick={() => {
                                            setPin(pinInput || null);
                                            toast.success(pinInput ? 'PIN salvo com sucesso' : 'PIN removido');
                                        }}
                                        className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-theme-text rounded-lg text-sm transition-colors"
                                    >
                                        Salvar
                                    </button>
                                </div>
                            </div>

                            <div className={styles.settingDivider} />

                            <div className={styles.settingRow}>
                                <div>
                                    <p className={styles.settingLabel}>Senha Secundária</p>
                                    <p className={styles.settingHint}>Senha alternativa para desbloqueio</p>
                                </div>
                                <div className="flex gap-2">
                                    <input 
                                        type="password" 
                                        value={passInput}
                                        onChange={e => setPassInput(e.target.value)}
                                        placeholder="Sua senha secreta"
                                        className="w-40 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-theme-text focus:outline-none focus:border-violet-500"
                                    />
                                    <button 
                                        onClick={() => {
                                            setSecondPassword(passInput || null);
                                            toast.success(passInput ? 'Senha salva com sucesso' : 'Senha removida');
                                        }}
                                        className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-theme-text rounded-lg text-sm transition-colors"
                                    >
                                        Salvar
                                    </button>
                                </div>
                            </div>

                            <div className={styles.settingDivider} />

                            <div className={styles.settingRow}>
                                <div>
                                    <p className={styles.settingLabel}>Tempo para bloqueio automático</p>
                                    <p className={styles.settingHint}>Bloqueia a tela após inatividade</p>
                                </div>
                                <select 
                                    value={timeoutMinutes}
                                    onChange={e => {
                                        setTimeoutMinutes(parseInt(e.target.value, 10));
                                        toast.success('Tempo de bloqueio atualizado');
                                    }}
                                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-theme-text text-sm focus:outline-none focus:border-violet-500"
                                >
                                    <option value="0" className="bg-[#18181b]">Nunca</option>
                                    <option value="1" className="bg-[#18181b]">1 minuto</option>
                                    <option value="5" className="bg-[#18181b]">5 minutos</option>
                                    <option value="15" className="bg-[#18181b]">15 minutos</option>
                                    <option value="30" className="bg-[#18181b]">30 minutos</option>
                                    <option value="60" className="bg-[#18181b]">1 hora</option>
                                </select>
                            </div>
                        </div>

                        <div className={styles.card}>
                            <p className={styles.settingLabel} style={{ fontSize: '14px', marginBottom: '12px' }}>Histórico de Acessos</p>
                            <p className={styles.settingHint} style={{ marginBottom: '16px' }}>Registro dos últimos desbloqueios e acessos ao aplicativo.</p>
                            
                            {accessLogs.length === 0 ? (
                                <div className="text-center py-6 border border-dashed border-white/10 rounded-xl">
                                    <p className="text-slate-500 text-sm">Nenhum acesso registrado ainda.</p>
                                </div>
                            ) : (
                                <div className="overflow-hidden border border-white/10 rounded-xl">
                                    <table className="w-full text-left text-sm text-slate-300">
                                        <thead className="bg-white/5 text-xs text-theme-text-muted">
                                            <tr>
                                                <th className="px-4 py-3 font-medium">Data / Hora</th>
                                                <th className="px-4 py-3 font-medium">Endereço IP</th>
                                                <th className="px-4 py-3 font-medium">Dispositivo</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {accessLogs.slice(0, 10).map(log => (
                                                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        {new Date(log.timestamp).toLocaleString()}
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-xs">{log.ip}</td>
                                                    <td className="px-4 py-3 truncate max-w-[200px]" title={log.device}>
                                                        {log.device}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};

export default SettingsPage;
