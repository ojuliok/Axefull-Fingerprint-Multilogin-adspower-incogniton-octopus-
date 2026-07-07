import React, { useState, useEffect, useRef } from 'react';
import { 
    X, Bold, Italic, List, Paperclip, Send, Clock, User, FileText, 
    ChevronUp, ChevronDown, Share2, Sparkles, MoreHorizontal, Layout, 
    Play, Pause, RefreshCw, Tag, Calendar, Flag, Plus, Search, Bell, Filter, 
    Check, Smile, AtSign, Settings, Trash, Eye, Lock, CheckSquare, Square
} from 'lucide-react';
import { MarketingPriority, LeadUpdate } from './crmStorage';
import { getTasksByCrmContact, TaskData } from '../Tasks/Tasks/tasksStorage';
import { v4 as uuidv4 } from 'uuid';
import { useTheme } from '../../context/ThemeContext';
import { useCRMState } from './CRMContext';

const PRIORITIES: MarketingPriority[] = ['Alta', 'Média', 'Baixa'];

const AVAILABLE_COLUMNS = [
    { id: 'status', label: 'Status' },
    { id: 'assignee', label: 'Pessoas' },
    { id: 'deadline', label: 'Data' },
    { id: 'priority', label: 'Prioridade' },
    { id: 'notes', label: 'Texto (Notas)' },
    { id: 'budget', label: 'Números (Orçamento)' },
    { id: 'files', label: 'Arquivos' }
];

const LeadDetailModal: React.FC = () => {
    const { theme } = useTheme();
    const isLight = theme === 'light';
    const { 
        selectedLeadId, 
        selectedLead, 
        setSelectedLeadId, 
        updateLead, 
        activeGroups, 
        leads,
        activeSpace,
        activeBoard,
        folders
    } = useCRMState();

    // Tab view in right column
    const [activeTab, setActiveTab] = useState<'activity' | 'tasks'>('activity');

    const [updateText, setUpdateText] = useState('');
    const [description, setDescription] = useState('');
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleText, setTitleText] = useState('');

    // Time tracking state
    const [isTracking, setIsTracking] = useState(false);
    const [timerSeconds, setTimerSeconds] = useState(0);

    // Dropdown visibility states
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
    const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
    const [showTagsDropdown, setShowTagsDropdown] = useState(false);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    
    // Profiles list state
    const [profiles, setProfiles] = useState<any[]>([]);

    // New tag & subtask states
    const [newTagText, setNewTagText] = useState('');
    const [newSubtaskText, setNewSubtaskText] = useState('');

    // Refs for click outside
    const statusRef = useRef<HTMLDivElement>(null);
    const assigneeRef = useRef<HTMLDivElement>(null);
    const priorityRef = useRef<HTMLDivElement>(null);
    const tagsRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);

    // Load active card values
    useEffect(() => {
        if (selectedLead) {
            setTitleText(selectedLead.title || '');
            setDescription(selectedLead.description || selectedLead.notes || '');
            setTimerSeconds(selectedLead.timeSpent || 0);
        }
    }, [selectedLead]);

    // Timer Interval
    useEffect(() => {
        let interval: any = null;
        if (isTracking) {
            interval = setInterval(() => {
                setTimerSeconds(prev => {
                    const next = prev + 1;
                    // Save to storage every 5 seconds
                    if (next % 5 === 0) {
                        updateLead(selectedLead!.id, { timeSpent: next });
                    }
                    return next;
                });
            }, 1000);
        } else {
            if (interval) clearInterval(interval);
            // Save final time spent
            if (selectedLead) {
                updateLead(selectedLead.id, { timeSpent: timerSeconds });
            }
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isTracking]);

    // Click outside dropdowns
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (statusRef.current && !statusRef.current.contains(e.target as Node)) setShowStatusDropdown(false);
            if (assigneeRef.current && !assigneeRef.current.contains(e.target as Node)) setShowAssigneeDropdown(false);
            if (priorityRef.current && !priorityRef.current.contains(e.target as Node)) setShowPriorityDropdown(false);
            if (tagsRef.current && !tagsRef.current.contains(e.target as Node)) setShowTagsDropdown(false);
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfileDropdown(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Load browser profiles and listen for window closed events in real-time
    useEffect(() => {
        const loadProfilesList = async () => {
            try {
                const result = await window.api.profiles.list();
                if (result && result.success) {
                    setProfiles(result.data as any[]);
                }
            } catch (error) {
                console.error('Error loading profiles in CRM Modal:', error);
            }
        };
        
        loadProfilesList();

        const cleanup = window.api.browser.onProfileClosed((closedProfileId: string) => {
            setProfiles((prev) => prev.map((p) =>
                p.id === closedProfileId ? { ...p, is_active: 0, status: p.status === 'running' ? 'ready' : p.status } : p
            ));
        });

        return () => {
            if (cleanup) cleanup();
        };
    }, []);

    const launchProfile = async (profileId: string) => {
        setProfiles((prev) => prev.map((p) =>
            p.id === profileId ? { ...p, status: 'running' } : p
        ));
        try {
            const result = await window.api.browser.launch(profileId);
            if (result && result.success) {
                setProfiles((prev) => prev.map((p) =>
                    p.id === profileId ? { ...p, is_active: 1, status: 'running' } : p
                ));
            } else {
                setProfiles((prev) => prev.map((p) => p.id === profileId ? { ...p, status: 'ready' } : p));
            }
        } catch (error) {
            setProfiles((prev) => prev.map((p) => p.id === profileId ? { ...p, status: 'ready' } : p));
            console.error('Error launching profile from CRM:', error);
        }
    };

    const closeProfile = async (profileId: string) => {
        try {
            const result = await window.api.browser.close(profileId);
            if (result && result.success) {
                setProfiles((prev) => prev.map((p) =>
                    p.id === profileId ? { ...p, is_active: 0, status: 'ready' } : p
                ));
            }
        } catch (error) {
            console.error('Error closing profile from CRM:', error);
        }
    };

    if (!selectedLeadId || !selectedLead) return null;

    // Folder information
    const activeFolder = activeBoard?.folderId ? folders.find(f => f.id === activeBoard.folderId) : null;

    // Helper functions for formatting time
    const formatTimeSpent = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        if (hours > 0) {
            return `${hours}h ${minutes}m ${seconds}s`;
        }
        if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        }
        return `${seconds}s`;
    };

    const handleSaveDescription = () => {
        updateLead(selectedLead.id, { description: description, notes: description });
    };

    const handleSaveTitle = () => {
        if (titleText.trim()) {
            updateLead(selectedLead.id, { title: titleText.trim() });
            setIsEditingTitle(false);
        }
    };

    const handleClose = () => {
        if (isTracking) {
            setIsTracking(false);
            updateLead(selectedLead.id, { timeSpent: timerSeconds });
        }
        setSelectedLeadId(null);
    };

    // Card navigation (arrow Up / Down)
    const boardLeads = leads.filter(l => l.boardId === selectedLead.boardId);
    const currentIndex = boardLeads.findIndex(l => l.id === selectedLead.id);
    const hasPrevious = currentIndex > 0;
    const hasNext = currentIndex < boardLeads.length - 1;

    const navigateToLead = (direction: 'prev' | 'next') => {
        if (direction === 'prev' && hasPrevious) {
            setSelectedLeadId(boardLeads[currentIndex - 1].id);
        } else if (direction === 'next' && hasNext) {
            setSelectedLeadId(boardLeads[currentIndex + 1].id);
        }
    };

    // AI Assist description pre-fill
    const handleAIDescription = () => {
        const aiDesc = `Esta tarefa representa o lead da empresa "${selectedLead.company || 'Cliente Potencial'}" para fins de prospecção comercial. O objetivo é estabelecer contato, entender suas necessidades operacionais de multilogin e apresentar a proposta técnica adequada. 

Próximos Passos:
- Agendar call de demonstração
- Enviar briefing comercial
- Validar proposta final`;
        setDescription(aiDesc);
        updateLead(selectedLead.id, { description: aiDesc, notes: aiDesc });
        
        // Add log activity
        const currentUpdates = selectedLead.updates || [];
        const logUpdate: LeadUpdate = {
            id: uuidv4(),
            author: 'Brain AI',
            content: 'Escreveu uma descrição inteligente baseada em IA para a tarefa.',
            createdAt: Date.now()
        };
        updateLead(selectedLead.id, { updates: [logUpdate, ...currentUpdates] });
    };

    // AI Assist Subtask generation
    const handleAISubtasks = () => {
        const aiSubtasks = [
            { id: uuidv4(), title: 'Pesquisar histórico da empresa e mercado do cliente', done: false },
            { id: uuidv4(), title: 'Realizar abordagem via WhatsApp / E-mail de apresentação', done: false },
            { id: uuidv4(), title: 'Preparar slides da demonstração técnica personalizada', done: false }
        ];
        const currentSubtasks = selectedLead.subtasks || [];
        updateLead(selectedLead.id, { subtasks: [...currentSubtasks, ...aiSubtasks] });

        // Add log activity
        const currentUpdates = selectedLead.updates || [];
        const logUpdate: LeadUpdate = {
            id: uuidv4(),
            author: 'Brain AI',
            content: 'Gerou 3 subtarefas estratégicas para guiar o progresso deste lead.',
            createdAt: Date.now()
        };
        updateLead(selectedLead.id, { updates: [logUpdate, ...currentUpdates] });
    };

    // AI find similar task
    const handleAISimilar = () => {
        alert('O Brain analisou outros quadros e encontrou 2 tarefas com contexto semelhante: \n1. "Integração API Fingerprint" (Espaço Vendas) \n2. "Setup Inicial de Clientes" (Espaço Suporte)');
    };

    // Actions
    const handleAddComment = () => {
        if (!updateText.trim()) return;
        const newUpdate: LeadUpdate = {
            id: uuidv4(),
            author: 'Você',
            content: updateText.trim(),
            createdAt: Date.now()
        };
        const currentUpdates = selectedLead.updates || [];
        updateLead(selectedLead.id, {
            updates: [newUpdate, ...currentUpdates]
        });
        setUpdateText('');
    };

    const handleAddTag = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTagText.trim()) {
            const currentTags = selectedLead.tags || [];
            if (!currentTags.includes(newTagText.trim())) {
                const updatedTags = [...currentTags, newTagText.trim()];
                updateLead(selectedLead.id, { tags: updatedTags });
                
                // Add log
                const currentUpdates = selectedLead.updates || [];
                const log: LeadUpdate = {
                    id: uuidv4(),
                    author: 'Você',
                    content: `adicionou a etiqueta "${newTagText.trim()}"`,
                    createdAt: Date.now()
                };
                updateLead(selectedLead.id, { updates: [log, ...currentUpdates] });
            }
            setNewTagText('');
            setShowTagsDropdown(false);
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        const currentTags = selectedLead.tags || [];
        const updatedTags = currentTags.filter(t => t !== tagToRemove);
        updateLead(selectedLead.id, { tags: updatedTags });

        // Add log
        const currentUpdates = selectedLead.updates || [];
        const log: LeadUpdate = {
            id: uuidv4(),
            author: 'Você',
            content: `removeu a etiqueta "${tagToRemove}"`,
            createdAt: Date.now()
        };
        updateLead(selectedLead.id, { updates: [log, ...currentUpdates] });
    };

    const handleAddSubtask = (e: React.FormEvent) => {
        e.preventDefault();
        if (newSubtaskText.trim()) {
            const currentSubtasks = selectedLead.subtasks || [];
            const newSub = {
                id: uuidv4(),
                title: newSubtaskText.trim(),
                done: false
            };
            updateLead(selectedLead.id, { subtasks: [...currentSubtasks, newSub] });
            setNewSubtaskText('');
        }
    };

    const handleToggleSubtask = (subId: string, currentDone: boolean) => {
        const currentSubtasks = selectedLead.subtasks || [];
        const updatedSubtasks = currentSubtasks.map(s => s.id === subId ? { ...s, done: !currentDone } : s);
        updateLead(selectedLead.id, { subtasks: updatedSubtasks });
    };

    const handleDeleteSubtask = (subId: string) => {
        const currentSubtasks = selectedLead.subtasks || [];
        const updatedSubtasks = currentSubtasks.filter(s => s.id !== subId);
        updateLead(selectedLead.id, { subtasks: updatedSubtasks });
    };

    const handleCheckmarkComplete = () => {
        if (activeGroups.length > 0) {
            const lastGroup = activeGroups[activeGroups.length - 1];
            if (selectedLead.groupId !== lastGroup.id) {
                updateLead(selectedLead.id, { 
                    groupId: lastGroup.id, 
                    status: lastGroup.title 
                });
                
                const currentUpdates = selectedLead.updates || [];
                const log: LeadUpdate = {
                    id: uuidv4(),
                    author: 'Você',
                    content: `marcou a tarefa como concluída (status "${lastGroup.title}")`,
                    createdAt: Date.now()
                };
                updateLead(selectedLead.id, { updates: [log, ...currentUpdates] });
            }
        }
    };

    const getPriorityColor = (p?: MarketingPriority) => {
        if (p === 'Alta') return '#ef4444';
        if (p === 'Média') return '#f59e0b';
        if (p === 'Baixa') return '#3b82f6';
        return '#64748b';
    };

    const currentGroup = activeGroups.find(g => g.id === selectedLead.groupId);

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'var(--bg-overlay)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000,
            color: 'var(--text-primary)'
        }} onClick={handleClose}>
            
            <div style={{
                background: 'var(--bg-card)',
                width: '95vw', maxWidth: '1280px', height: '90vh',
                borderRadius: '12px',
                border: '1px solid var(--border-default)',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-xl)'
            }} onClick={(e) => e.stopPropagation()}>
                
                {/* 1. TOP HEADER & BREADCRUMBS BAR */}
                <div style={{
                    padding: '12px 20px',
                    borderBottom: '1px solid var(--border-default)',
                    background: 'var(--bg-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexShrink: 0
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <button 
                                onClick={() => navigateToLead('prev')} 
                                disabled={!hasPrevious}
                                style={{ 
                                    background: 'transparent', border: 'none', 
                                    color: hasPrevious ? 'var(--text-secondary)' : 'var(--text-tertiary)', 
                                    cursor: hasPrevious ? 'pointer' : 'not-allowed', 
                                    display: 'flex', alignItems: 'center', padding: '4px'
                                }}
                            >
                                <ChevronUp size={16} />
                            </button>
                            <button 
                                onClick={() => navigateToLead('next')} 
                                disabled={!hasNext}
                                style={{ 
                                    background: 'transparent', border: 'none', 
                                    color: hasNext ? 'var(--text-secondary)' : 'var(--text-tertiary)', 
                                    cursor: hasNext ? 'pointer' : 'not-allowed', 
                                    display: 'flex', alignItems: 'center', padding: '4px'
                                }}
                            >
                                <ChevronDown size={16} />
                            </button>
                        </div>
                        
                        <div style={{ width: '1px', height: '16px', background: 'var(--border-default)' }} />
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                            <span style={{ 
                                width: '16px', height: '16px', borderRadius: '4px',
                                background: activeSpace?.color || '#ef4444', color: '#fff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '10px', fontWeight: 'bold'
                            }}>
                                {activeSpace?.title ? activeSpace.title.charAt(0).toUpperCase() : 'E'}
                            </span>
                            <span style={{ cursor: 'pointer' }}>{activeSpace?.title || 'Espaço da equipe'}</span>
                            <span>/</span>
                            {activeFolder && (
                                <>
                                    <span style={{ cursor: 'pointer' }}>{activeFolder.title}</span>
                                    <span>/</span>
                                </>
                            )}
                            <span style={{ color: 'var(--text-primary)', fontWeight: 500, cursor: 'pointer' }}>{activeBoard?.title || 'Projeto 1'}</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button style={{
                            background: 'transparent', border: 'none', color: 'var(--text-secondary)',
                            fontSize: '12px', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '6px'
                        }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                            <Share2 size={14} /> Compartilhar
                        </button>

                        <button style={{
                            background: 'transparent', border: 'none', color: '#8b5cf6',
                            fontSize: '12px', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500
                        }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                            <Sparkles size={14} /> Pergunte à IA
                        </button>

                        <button style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}>
                            <Settings size={16} />
                        </button>
                        
                        <button style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}>
                            <Layout size={16} />
                        </button>

                        <div style={{ width: '1px', height: '16px', background: 'var(--border-default)', margin: '0 4px' }} />

                        <button 
                            onClick={handleClose} 
                            style={{ 
                                background: 'transparent', border: 'none', color: 'var(--text-secondary)', 
                                cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '6px', borderRadius: '6px'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Main Body */}
                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                    
                    {/* 2. LEFT PANE - DETAILS & PROPERTIES */}
                    <div style={{ 
                        flex: '0 0 62%',
                        background: 'var(--bg-card)',
                        padding: '24px 32px',
                        overflowY: 'auto',
                        display: 'flex', flexDirection: 'column', gap: '24px'
                    }}>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                                background: 'var(--bg-secondary)', border: '1px solid var(--border-default)',
                                borderRadius: '4px', padding: '3px 8px', fontSize: '11px', fontWeight: 600,
                                color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px'
                            }}>
                                <CheckSquare size={12} color="#10b981" /> Tarefa
                            </div>
                            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>
                                ID: #{selectedLead.id.substring(0, 8)}
                            </span>
                        </div>

                        <div>
                            {isEditingTitle ? (
                                <input 
                                    value={titleText}
                                    onChange={(e) => setTitleText(e.target.value)}
                                    onBlur={handleSaveTitle}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveTitle();
                                        if (e.key === 'Escape') { setTitleText(selectedLead.title); setIsEditingTitle(false); }
                                    }}
                                    autoFocus
                                    style={{
                                        fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)',
                                        background: 'var(--bg-secondary)', border: '1px solid var(--border-focus)',
                                        padding: '4px 8px', borderRadius: '6px', width: '100%', outline: 'none'
                                    }}
                                />
                            ) : (
                                <h1 
                                    onClick={() => setIsEditingTitle(true)}
                                    style={{
                                        fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)',
                                        margin: 0, cursor: 'text', padding: '5px 8px', borderRadius: '6px',
                                        border: '1px solid transparent', display: 'block', width: '100%'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border-default)'}
                                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
                                >
                                    {selectedLead.title || 'Sem título'}
                                </h1>
                            )}
                        </div>

                        <div style={{
                            background: isLight ? 'linear-gradient(90deg, #faf5ff, #f0f9ff)' : 'linear-gradient(90deg, #1d1b26, #141f2c)',
                            border: isLight ? '1px solid rgba(167, 139, 250, 0.3)' : '1px solid rgba(139, 92, 246, 0.2)',
                            borderRadius: '8px', padding: '10px 16px',
                            display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px'
                        }}>
                            <Sparkles size={14} color="#a78bfa" />
                            <span style={{ color: 'var(--text-secondary)' }}>
                                Peça ao Brain para{' '}
                                <span onClick={handleAIDescription} style={{ color: '#a78bfa', textDecoration: 'underline', cursor: 'pointer', fontWeight: 500 }}>Escrever uma descrição</span>,{' '}
                                <span onClick={handleAISubtasks} style={{ color: '#a78bfa', textDecoration: 'underline', cursor: 'pointer', fontWeight: 500 }}>Gerar subtarefas</span> ou{' '}
                                <span onClick={handleAISimilar} style={{ color: '#a78bfa', textDecoration: 'underline', cursor: 'pointer', fontWeight: 500 }}>encontrar tarefas semelhantes</span>.
                            </span>
                        </div>

                        <div style={{
                            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px',
                            padding: '16px 0', borderBottom: '1px solid var(--border-default)'
                        }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <span style={{ width: '110px', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <CheckSquare size={14} /> Status
                                    </span>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <div style={{ position: 'relative' }} ref={statusRef}>
                                            <button 
                                                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                                                style={{
                                                    background: currentGroup?.color || '#0ea5e9',
                                                    color: '#fff', border: 'none', padding: '4px 10px',
                                                    borderRadius: '6px', fontSize: '11px', fontWeight: 'bold',
                                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                                                    textTransform: 'uppercase', letterSpacing: '0.5px'
                                                }}
                                            >
                                                {selectedLead.status} <ChevronDown size={10} />
                                            </button>
                                            {showStatusDropdown && (
                                                <div style={{
                                                    position: 'absolute', top: '100%', left: 0, background: 'var(--bg-card)',
                                                    border: '1px solid var(--border-default)', borderRadius: '6px', padding: '4px',
                                                    zIndex: 100, width: '160px', boxShadow: 'var(--shadow-md)', marginTop: '4px'
                                                }}>
                                                    {activeGroups.map(g => (
                                                        <div 
                                                            key={g.id}
                                                            onClick={() => {
                                                                updateLead(selectedLead.id, { groupId: g.id, status: g.title });
                                                                setShowStatusDropdown(false);
                                                            }}
                                                            style={{
                                                                padding: '6px 8px', fontSize: '12px', color: 'var(--text-primary)',
                                                                cursor: 'pointer', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px'
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                        >
                                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: g.color }} />
                                                            {g.title}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <button 
                                            onClick={handleCheckmarkComplete}
                                            title="Concluir tarefa"
                                            style={{
                                                background: 'transparent', border: '1px solid var(--border-default)',
                                                color: 'var(--text-secondary)', borderRadius: '4px', padding: '2px 4px',
                                                cursor: 'pointer', display: 'flex', alignItems: 'center'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#10b981'}
                                            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-default)'}
                                        >
                                            <Check size={12} />
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <span style={{ width: '110px', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Calendar size={14} /> Datas
                                    </span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <input 
                                            type="date"
                                            value={selectedLead.deadline ? new Date(selectedLead.deadline).toISOString().split('T')[0] : ''}
                                            onChange={(e) => {
                                                const time = e.target.value ? new Date(e.target.value).getTime() : null;
                                                updateLead(selectedLead.id, { deadline: time });
                                            }}
                                            style={{
                                                background: 'var(--bg-secondary)', border: '1px solid var(--border-default)',
                                                borderRadius: '6px', padding: '4px 8px', fontSize: '11px',
                                                color: 'var(--text-primary)', outline: 'none'
                                            }}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <span style={{ width: '110px', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Clock size={14} /> Estimativa
                                    </span>
                                    <input 
                                        type="text"
                                        placeholder="Ex: 2h"
                                        value={selectedLead.company || ''} 
                                        onChange={(e) => updateLead(selectedLead.id, { company: e.target.value })}
                                        style={{
                                            background: 'transparent', border: '1px solid transparent',
                                            padding: '4px 8px', fontSize: '12px', color: 'var(--text-primary)',
                                            outline: 'none', width: '120px', borderRadius: '4px'
                                        }}
                                        onFocus={(e) => e.target.style.border = '1px solid var(--border-default)'}
                                        onBlur={(e) => e.target.style.border = '1px solid transparent'}
                                    />
                                </div>

                                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                                    <span style={{ width: '110px', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                        <Tag size={14} /> Etiquetas
                                    </span>
                                    
                                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                                        {(selectedLead.tags || []).map(t => (
                                            <span 
                                                key={t}
                                                style={{
                                                    background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc',
                                                    border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '4px',
                                                    padding: '2px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px'
                                                }}
                                            >
                                                {t}
                                                <button 
                                                    onClick={() => handleRemoveTag(t)}
                                                    style={{ background: 'transparent', border: 'none', color: '#c084fc', cursor: 'pointer', fontSize: '10px', padding: 0 }}
                                                >
                                                    <X size={10} />
                                                </button>
                                            </span>
                                        ))}
                                        
                                        <div style={{ position: 'relative' }} ref={tagsRef}>
                                            <button 
                                                onClick={() => setShowTagsDropdown(!showTagsDropdown)}
                                                style={{
                                                    background: 'transparent', border: '1px dashed var(--border-default)',
                                                    color: 'var(--text-secondary)', borderRadius: '4px', padding: '2px 8px',
                                                    fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                                                }}
                                            >
                                                <Plus size={10} /> Tag
                                            </button>
                                            {showTagsDropdown && (
                                                <form 
                                                    onSubmit={handleAddTag}
                                                    style={{
                                                        position: 'absolute', top: '100%', left: 0, background: 'var(--bg-card)',
                                                        border: '1px solid var(--border-default)', borderRadius: '6px', padding: '8px',
                                                        zIndex: 100, width: '150px', boxShadow: 'var(--shadow-md)', marginTop: '4px',
                                                        display: 'flex', flexDirection: 'column', gap: '6px'
                                                    }}
                                                >
                                                    <input 
                                                        value={newTagText}
                                                        onChange={(e) => setNewTagText(e.target.value)}
                                                        placeholder="Nova tag..."
                                                        autoFocus
                                                        style={{
                                                            background: 'var(--bg-secondary)', border: '1px solid var(--border-default)',
                                                            borderRadius: '4px', padding: '4px 6px', fontSize: '11px',
                                                            color: 'var(--text-primary)', outline: 'none'
                                                        }}
                                                    />
                                                </form>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <span style={{ width: '110px', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <User size={14} /> Responsáveis
                                    </span>
                                    
                                    <div style={{ position: 'relative' }} ref={assigneeRef}>
                                        <button 
                                            onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                                            style={{
                                                background: 'transparent', border: 'none', color: 'var(--text-primary)',
                                                cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px',
                                                padding: '4px 8px', borderRadius: '4px'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <div style={{
                                                width: '20px', height: '20px', borderRadius: '50%',
                                                background: selectedLead.assignee ? '#10b981' : 'var(--bg-tertiary)',
                                                color: '#fff', fontSize: '10px', fontWeight: 'bold',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                {selectedLead.assignee ? selectedLead.assignee.charAt(0).toUpperCase() : <User size={10} />}
                                            </div>
                                            {selectedLead.assignee || 'Vazio'}
                                        </button>
                                        
                                        {showAssigneeDropdown && (
                                            <div style={{
                                                position: 'absolute', top: '100%', left: 0, background: 'var(--bg-card)',
                                                border: '1px solid var(--border-default)', borderRadius: '6px', padding: '4px',
                                                zIndex: 100, width: '160px', boxShadow: 'var(--shadow-md)', marginTop: '4px'
                                            }}>
                                                {['Julio Cesar', 'Fagner', 'Alice', 'Bob', 'Não Atribuído'].map(u => (
                                                    <div 
                                                        key={u}
                                                        onClick={() => {
                                                            updateLead(selectedLead.id, { assignee: u === 'Não Atribuído' ? '' : u });
                                                            setShowAssigneeDropdown(false);
                                                        }}
                                                        style={{
                                                            padding: '6px 8px', fontSize: '12px', color: 'var(--text-primary)',
                                                            cursor: 'pointer', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px'
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                    >
                                                        {u}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <span style={{ width: '110px', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Flag size={14} /> Prioridade
                                    </span>
                                    
                                    <div style={{ position: 'relative' }} ref={priorityRef}>
                                        <button 
                                            onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
                                            style={{
                                                background: 'transparent', border: 'none', 
                                                color: getPriorityColor(selectedLead.priority),
                                                cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px',
                                                padding: '4px 8px', borderRadius: '4px', fontWeight: 500
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <Flag size={14} fill={selectedLead.priority ? getPriorityColor(selectedLead.priority) : 'transparent'} />
                                            {selectedLead.priority || 'Vazio'}
                                        </button>
                                        
                                        {showPriorityDropdown && (
                                            <div style={{
                                                position: 'absolute', top: '100%', left: 0, background: 'var(--bg-card)',
                                                border: '1px solid var(--border-default)', borderRadius: '6px', padding: '4px',
                                                zIndex: 100, width: '130px', boxShadow: 'var(--shadow-md)', marginTop: '4px'
                                            }}>
                                                {['Alta', 'Média', 'Baixa', 'Limpar'].map(p => (
                                                    <div 
                                                        key={p}
                                                        onClick={() => {
                                                            updateLead(selectedLead.id, { priority: p === 'Limpar' ? undefined : p as MarketingPriority });
                                                            setShowPriorityDropdown(false);
                                                        }}
                                                        style={{
                                                            padding: '6px 8px', fontSize: '12px', 
                                                            color: p === 'Limpar' ? '#ef4444' : 'var(--text-primary)',
                                                            cursor: 'pointer', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px'
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                    >
                                                        {p !== 'Limpar' && <Flag size={12} fill={getPriorityColor(p as MarketingPriority)} color={getPriorityColor(p as MarketingPriority)} />}
                                                        {p}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <span style={{ width: '110px', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Clock size={14} /> Rastrear Tempo
                                    </span>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <button 
                                            onClick={() => setIsTracking(!isTracking)}
                                            style={{
                                                background: isTracking ? '#ef4444' : '#10b981',
                                                border: 'none', color: '#fff', borderRadius: '50%',
                                                width: '24px', height: '24px', display: 'flex',
                                                alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                                boxShadow: isTracking ? '0 0 8px rgba(239, 68, 68, 0.4)' : 'none'
                                            }}
                                        >
                                            {isTracking ? <Pause size={10} fill="#fff" /> : <Play size={10} fill="#fff" style={{ marginLeft: '1px' }} />}
                                        </button>
                                        <span style={{ fontSize: '12px', fontWeight: 600, color: isTracking ? '#ef4444' : 'var(--text-primary)', fontFamily: 'monospace' }}>
                                            {formatTimeSpent(timerSeconds)}
                                        </span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', marginTop: '4px' }}>
                                    <span style={{ width: '110px', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Settings size={14} /> Perfil Browser
                                    </span>
                                    
                                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }} ref={profileRef}>
                                        <button 
                                            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                                            style={{
                                                background: 'transparent', border: 'none', 
                                                color: 'var(--text-primary)',
                                                cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px',
                                                padding: '4px 8px', borderRadius: '4px', fontWeight: 500
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            {selectedLead.profileId ? (
                                                profiles.find(p => p.id === selectedLead.profileId)?.name || 'Perfil Vinculado'
                                            ) : (
                                                'Vazio'
                                            )}
                                        </button>

                                        {selectedLead.profileId && (() => {
                                            const prof = profiles.find(p => p.id === selectedLead.profileId);
                                            if (!prof) return null;
                                            const isOnline = prof.is_active === 1;
                                            const isStarting = prof.status === 'running' && !isOnline;
                                            return (
                                                <button
                                                    disabled={isStarting}
                                                    onClick={() => isOnline ? closeProfile(prof.id) : launchProfile(prof.id)}
                                                    style={{
                                                        background: isStarting ? '#475569' : isOnline ? '#ef4444' : '#10b981',
                                                        border: 'none', color: '#fff', borderRadius: '4px',
                                                        padding: '2px 8px', fontSize: '11px', display: 'flex',
                                                        alignItems: 'center', gap: '4px', cursor: isStarting ? 'not-allowed' : 'pointer',
                                                        opacity: isStarting ? 0.7 : 1
                                                    }}
                                                >
                                                    {isStarting ? <RefreshCw size={10} className="animate-spin" /> : isOnline ? <Pause size={10} fill="#fff" /> : <Play size={10} fill="#fff" />}
                                                    {isStarting ? 'Iniciando...' : isOnline ? 'Parar' : 'Iniciar'}
                                                </button>
                                            );
                                        })()}
                                        
                                        {showProfileDropdown && (
                                            <div style={{
                                                position: 'absolute', top: '100%', left: 0, background: 'var(--bg-card)',
                                                border: '1px solid var(--border-default)', borderRadius: '6px', padding: '4px',
                                                zIndex: 100, width: '180px', maxHeight: '200px', overflowY: 'auto',
                                                boxShadow: 'var(--shadow-md)', marginTop: '4px'
                                            }}>
                                                <div 
                                                    onClick={() => {
                                                        updateLead(selectedLead.id, { profileId: undefined });
                                                        setShowProfileDropdown(false);
                                                    }}
                                                    style={{
                                                        padding: '6px 8px', fontSize: '12px', color: '#ef4444',
                                                        cursor: 'pointer', borderRadius: '4px'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    Remover Vínculo
                                                </div>
                                                <div style={{ height: '1px', background: 'var(--border-default)', margin: '4px 0' }} />
                                                {profiles.map(p => (
                                                    <div 
                                                        key={p.id}
                                                        onClick={() => {
                                                            updateLead(selectedLead.id, { profileId: p.id });
                                                            setShowProfileDropdown(false);
                                                        }}
                                                        style={{
                                                            padding: '6px 8px', fontSize: '12px', color: 'var(--text-primary)',
                                                            cursor: 'pointer', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px'
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                    >
                                                        <span style={{
                                                            width: '6px', height: '6px', borderRadius: '50%',
                                                            background: p.status === 'running' || p.is_active === 1 ? '#10b981' : '#6b7280'
                                                        }} />
                                                        {p.name}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Custom Columns rendering */}
                        {(() => {
                            const customCols = (activeBoard?.columns || []).filter(col => 
                                col.startsWith('custom_') || col === 'budget'
                            );
                            if (customCols.length === 0) return null;

                            return (
                                <div style={{
                                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px',
                                    paddingBottom: '16px', borderBottom: '1px solid var(--border-default)'
                                }}>
                                    {customCols.map(col => {
                                        const label = activeBoard?.customColumnNames?.[col] || 
                                                      AVAILABLE_COLUMNS.find(c => c.id === col)?.label || col;
                                        const value = (selectedLead as any)[col];

                                        return (
                                            <div key={col} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Layout size={14} /> {label}
                                                </span>
                                                {col.startsWith('custom_status_') || col.startsWith('custom_dropdown_') ? (
                                                    <input 
                                                        value={value || ''}
                                                        onChange={(e) => updateLead(selectedLead.id, { [col]: e.target.value })}
                                                        placeholder="Definir..."
                                                        style={{
                                                            background: 'transparent', border: '1px solid transparent',
                                                            padding: '4px 8px', fontSize: '12px', color: 'var(--text-primary)',
                                                            outline: 'none', width: '100%', borderRadius: '4px'
                                                        }}
                                                        onFocus={(e) => e.target.style.border = '1px solid var(--border-default)'}
                                                        onBlur={(e) => e.target.style.border = '1px solid transparent'}
                                                    />
                                                ) : col === 'budget' || col.startsWith('custom_number_') ? (
                                                    <input 
                                                        type="number"
                                                        value={value || ''}
                                                        onChange={(e) => updateLead(selectedLead.id, { [col]: parseFloat(e.target.value) || 0 })}
                                                        placeholder="0"
                                                        style={{
                                                            background: 'transparent', border: '1px solid transparent',
                                                            padding: '4px 8px', fontSize: '12px', color: 'var(--text-primary)',
                                                            outline: 'none', width: '100%', borderRadius: '4px'
                                                        }}
                                                        onFocus={(e) => e.target.style.border = '1px solid var(--border-default)'}
                                                        onBlur={(e) => e.target.style.border = '1px solid transparent'}
                                                    />
                                                ) : col.startsWith('custom_date_') ? (
                                                    <input 
                                                        type="date"
                                                        value={value ? new Date(value).toISOString().split('T')[0] : ''}
                                                        onChange={(e) => updateLead(selectedLead.id, { [col]: e.target.value ? new Date(e.target.value).getTime() : null })}
                                                        style={{
                                                            background: 'var(--bg-secondary)', border: '1px solid var(--border-default)',
                                                            padding: '4px 8px', fontSize: '11px', color: 'var(--text-primary)',
                                                            outline: 'none', width: '100%', borderRadius: '4px'
                                                        }}
                                                    />
                                                ) : (
                                                    <input 
                                                        value={value || ''}
                                                        onChange={(e) => updateLead(selectedLead.id, { [col]: e.target.value })}
                                                        placeholder="Adicionar..."
                                                        style={{
                                                            background: 'transparent', border: '1px solid transparent',
                                                            padding: '4px 8px', fontSize: '12px', color: 'var(--text-primary)',
                                                            outline: 'none', width: '100%', borderRadius: '4px'
                                                        }}
                                                        onFocus={(e) => e.target.style.border = '1px solid var(--border-default)'}
                                                        onBlur={(e) => e.target.style.border = '1px solid transparent'}
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })()}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                Descrição
                            </span>
                            <textarea 
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                onBlur={handleSaveDescription}
                                placeholder="Adicione uma descrição ou escreva com IA..."
                                style={{
                                    width: '100%', minHeight: '120px', background: 'transparent',
                                    border: '1px solid transparent', padding: '8px',
                                    borderRadius: '6px', color: 'var(--text-primary)', outline: 'none',
                                    fontSize: '13px', resize: 'vertical', lineHeight: 1.6
                                }}
                                onFocus={(e) => e.target.style.border = '1px solid var(--border-default)'}
                            />
                        </div>

                        <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: '20px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '12px' }}>
                                Subtarefas ({ (selectedLead.subtasks || []).filter(s => s.done).length } / { (selectedLead.subtasks || []).length })
                            </span>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                                {(selectedLead.subtasks || []).map(sub => (
                                    <div 
                                        key={sub.id}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyItems: 'space-between', gap: '10px',
                                            padding: '6px 8px', borderRadius: '6px', background: 'var(--bg-secondary)'
                                        }}
                                    >
                                        <button 
                                            onClick={() => handleToggleSubtask(sub.id, sub.done)}
                                            style={{
                                                background: 'transparent', border: 'none', color: sub.done ? '#10b981' : 'var(--text-secondary)',
                                                cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center'
                                            }}
                                        >
                                            {sub.done ? <CheckSquare size={16} /> : <Square size={16} />}
                                        </button>
                                        
                                        <span style={{
                                            flex: 1, fontSize: '12px',
                                            textDecoration: sub.done ? 'line-through' : 'none',
                                            color: sub.done ? 'var(--text-tertiary)' : 'var(--text-primary)'
                                        }}>
                                            {sub.title}
                                        </span>
                                        
                                        <button 
                                            onClick={() => handleDeleteSubtask(sub.id)}
                                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                                        >
                                            <Trash size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <form onSubmit={handleAddSubtask} style={{ display: 'flex', gap: '8px' }}>
                                <input 
                                    value={newSubtaskText}
                                    onChange={(e) => setNewSubtaskText(e.target.value)}
                                    placeholder="+ Adicionar subtarefa..."
                                    style={{
                                        background: 'var(--bg-secondary)', border: '1px solid var(--border-default)',
                                        borderRadius: '6px', padding: '6px 12px', fontSize: '12px',
                                        color: 'var(--text-primary)', outline: 'none', flex: 1
                                    }}
                                />
                                <button 
                                    type="submit"
                                    style={{
                                        background: '#0ea5e9', border: 'none', color: '#fff',
                                        padding: '6px 12px', borderRadius: '6px', fontSize: '12px',
                                        fontWeight: 600, cursor: 'pointer'
                                    }}
                                >
                                    Adicionar
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* 3. RIGHT PANE - ACTIVITY & TIMELINE */}
                    <div style={{
                        flex: '0 0 38%',
                        borderLeft: '1px solid var(--border-default)',
                        background: 'var(--bg-secondary)',
                        display: 'flex', flexDirection: 'column',
                        overflow: 'hidden'
                    }}>
                        
                        <div style={{
                            padding: '16px 20px',
                            borderBottom: '1px solid var(--border-default)',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            flexShrink: 0
                        }}>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <span 
                                    onClick={() => setActiveTab('activity')}
                                    style={{ 
                                        fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                                        color: activeTab === 'activity' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                                        borderBottom: activeTab === 'activity' ? '2px solid #8b5cf6' : '2px solid transparent',
                                        paddingBottom: '4px'
                                    }}
                                >
                                    Activity
                                </span>
                                <span 
                                    onClick={() => setActiveTab('tasks')}
                                    style={{ 
                                        fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                                        color: activeTab === 'tasks' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                                        borderBottom: activeTab === 'tasks' ? '2px solid #8b5cf6' : '2px solid transparent',
                                        paddingBottom: '4px'
                                    }}
                                >
                                    Tarefas
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', color: 'var(--text-secondary)' }}>
                                <Search size={14} style={{ cursor: 'pointer' }} />
                                <Bell size={14} style={{ cursor: 'pointer' }} />
                                <Filter size={14} style={{ cursor: 'pointer' }} />
                            </div>
                        </div>

                        <div style={{
                            flex: 1, padding: '20px', overflowY: 'auto',
                            display: 'flex', flexDirection: 'column', gap: '20px'
                        }}>
                            {activeTab === 'activity' ? (
                                <>
                                    {(selectedLead.updates || []).map((up: any) => (
                                        <div key={up.id} style={{ display: 'flex', gap: '12px' }}>
                                            <div style={{
                                                width: '28px', height: '28px', borderRadius: '50%',
                                                background: up.author === 'Brain AI' ? '#8b5cf6' : 'var(--bg-tertiary)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: '#fff', fontSize: '11px', fontWeight: 'bold', flexShrink: 0
                                            }}>
                                                {up.author === 'Brain AI' ? 'AI' : up.author.charAt(0).toUpperCase()}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginBottom: '4px' }}>
                                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '12px' }}>
                                                        {up.author}
                                                    </span>
                                                    <span style={{ color: 'var(--text-tertiary)', fontSize: '10px' }}>
                                                        {new Date(up.createdAt).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <div style={{
                                                    color: 'var(--text-secondary)', fontSize: '12px',
                                                    background: 'var(--bg-card)', padding: '8px 12px',
                                                    borderRadius: '8px', border: '1px solid var(--border-default)',
                                                    lineHeight: 1.5, whiteSpace: 'pre-wrap'
                                                }}>
                                                    {up.content}
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <div style={{
                                            width: '28px', height: '28px', borderRadius: '50%',
                                            background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'var(--text-secondary)', fontSize: '11px', flexShrink: 0
                                        }}>
                                            S
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                                                <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '12px' }}>Sistema</span>
                                                <span style={{ color: 'var(--text-tertiary)', fontSize: '10px' }}>
                                                    {new Date(selectedLead.createdAt).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <div style={{ color: 'var(--text-tertiary)', fontSize: '11px', fontStyle: 'italic' }}>
                                                Tarefa criada no quadro.
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {getTasksByCrmContact(selectedLead.id).map(task => (
                                        <div key={task.id} style={{
                                            background: 'var(--bg-card)', padding: '12px',
                                            borderRadius: '8px', border: '1px solid var(--border-default)'
                                        }}>
                                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{task.title || 'Sem título'}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                                Status: {task.status === 'todo' ? 'A fazer' : task.status === 'in-progress' ? 'Em progresso' : 'Concluído'}
                                            </div>
                                            {task.date && (
                                                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                                                    Data: {new Date(task.date).toLocaleDateString('pt-BR')}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {getTasksByCrmContact(selectedLead.id).length === 0 && (
                                        <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', textAlign: 'center' }}>
                                            Nenhuma tarefa associada a este lead.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div style={{
                            padding: '16px', borderTop: '1px solid var(--border-default)',
                            background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', gap: '10px',
                            flexShrink: 0
                        }}>
                            <textarea 
                                value={updateText}
                                onChange={(e) => setUpdateText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleAddComment();
                                    }
                                }}
                                placeholder="Escreva um comentário..."
                                style={{
                                    width: '100%', minHeight: '60px', background: 'transparent',
                                    border: 'none', color: 'var(--text-primary)', outline: 'none',
                                    fontSize: '12px', resize: 'none', lineHeight: 1.5
                                }}
                            />
                            
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', gap: '10px', color: 'var(--text-secondary)' }}>
                                    <button style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex' }}>
                                        <Plus size={14} />
                                    </button>
                                    <button style={{ background: 'none', border: 'none', color: '#8b5cf6', cursor: 'pointer', display: 'flex' }}>
                                        <Sparkles size={14} />
                                    </button>
                                    <button style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex' }}>
                                        <Smile size={14} />
                                    </button>
                                    <button style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex' }}>
                                        <Paperclip size={14} />
                                    </button>
                                    <button style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex' }}>
                                        <AtSign size={14} />
                                    </button>
                                </div>

                                <button 
                                    onClick={handleAddComment}
                                    style={{
                                        background: updateText.trim() ? '#0ea5e9' : 'var(--bg-tertiary)',
                                        color: '#fff', border: 'none', borderRadius: '4px',
                                        width: '24px', height: '24px', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center',
                                        cursor: updateText.trim() ? 'pointer' : 'default',
                                        opacity: updateText.trim() ? 1 : 0.5
                                    }}
                                >
                                    <Send size={10} fill="#fff" />
                                </button>
                            </div>
                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
};

export default LeadDetailModal;
