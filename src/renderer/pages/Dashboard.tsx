import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Grid, List, Shield, MoreVertical, Edit, Trash2, Globe, Tag, Star, Fingerprint, Folder as FolderIcon, Filter, LayoutGrid, ChevronDown, ChevronUp, ChevronRight, PanelLeftClose, PanelLeftOpen, Settings, Database, Copy, RefreshCw, Download, Square, Play, StopCircle, Upload, RotateCcw, AlertTriangle, Zap, Users, Activity, Monitor, Clock, Layers, Bookmark, Code, Package, Cpu, Palette, LucideIcon, CheckSquare, Eye, EyeOff, Columns, ArrowUpDown, X, Maximize2, Home, MessageSquare, FileText, Bold, Italic, Underline, Strikethrough, ListOrdered, Link2, Puzzle, Network, Eraser, GripVertical } from 'lucide-react';
import CreateProfileModal from '../features/Profiles/ProfileEditor/CreateProfileModal';
import PropertiesModal from '../features/Profiles/ProfileEditor/PropertiesModal';
import ProfileDetailModal from '../features/Profiles/ProfileDetail/ProfileDetailModal';
import AutomationModal from '../features/AutomationModal/AutomationModal';
import TemplatesModal from '../features/Templates/TemplatesModal';
import { useToast } from '../context/ToastContext';
import { useWorkspace } from '../context/WorkspaceContext';
import styles from './Dashboard.module.css';
import { ProfileAIScore } from '../features/AI/ProfileAIScore';
import { Profile, Folder } from '../types';

import {
    getOsLabel,
    STATUS_CONFIG,
    getStatusMap,
    SOCIAL_TAG_COLORS,
    getTagIconElement,
    DEFAULT_TAG_TEMPLATES,
    FOLDER_ICONS,
    FOLDER_COLORS,
    TagTemplate,
    FolderCustomization
} from '../utils/constants';
import { StatusPickerPopup } from '../features/Dashboard/StatusPickerPopup';
import { TagPickerPopup } from '../features/Dashboard/TagPickerPopup';
import { AvatarPickerPopup } from '../features/Dashboard/AvatarPickerPopup';
import * as Lucide from 'lucide-react';
import NoteTiptapEditor from '../features/Notes/NoteTiptapEditor';
import { MiniSidebarItem as MiniItem } from '../features/Dashboard/MiniSidebarItem';
import { FloatingBulkActions } from '../features/Dashboard/FloatingBulkActions';
import { ResourceMonitor } from '../features/Dashboard/ResourceMonitor';

interface DashboardProps {
    onOpenExtensions?: () => void;
    onOpenProxies?: () => void;
}

const syncProfilesToNotes = (profilesList: Profile[]) => {
    try {
        const savedNotes = localStorage.getItem('axe_notes_notes');
        const parsedNotes = savedNotes ? JSON.parse(savedNotes) : [];
        const savedSpaces = localStorage.getItem('axe_notes_spaces');
        const parsedSpaces = savedSpaces ? JSON.parse(savedSpaces) : [];
        const FINGERPRINT_SPACE_ID = 'fingerprint-notes-space';
        
        let changed = false;
        
        // Ensure space exists
        if (!parsedSpaces.find((s: any) => s.id === FINGERPRINT_SPACE_ID)) {
            parsedSpaces.push({
                id: FINGERPRINT_SPACE_ID,
                name: 'Perfis 👤',
                icon: '👤',
                created_at: new Date().toISOString()
            });
            localStorage.setItem('axe_notes_spaces', JSON.stringify(parsedSpaces));
        }
        
        let updatedNotes = [...parsedNotes];
        
        profilesList.forEach((profile) => {
            if (profile.category === 'trash') return;
            
            const noteId = `profile-note-${profile.id}`;
            let noteIndex = updatedNotes.findIndex((n: any) => n.profileId === profile.id || n.id === noteId);
            
            if (noteIndex > -1) {
                const note = updatedNotes[noteIndex];
                if (note.title !== profile.name || note.content !== (profile.notes || '')) {
                    updatedNotes[noteIndex] = {
                        ...note,
                        title: profile.name,
                        content: profile.notes || '',
                        profileId: profile.id,
                        updated_at: new Date().toISOString()
                    };
                    changed = true;
                }
            } else {
                updatedNotes.push({
                    id: noteId,
                    spaceId: FINGERPRINT_SPACE_ID,
                    title: profile.name,
                    content: profile.notes || '',
                    isStarred: false,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    profileId: profile.id
                });
                changed = true;
            }
        });
        
        // Remove notes of deleted profiles
        const activeProfileIds = profilesList.filter(p => p.category !== 'trash').map(p => p.id);
        const beforeCount = updatedNotes.length;
        updatedNotes = updatedNotes.filter((n: any) => n.spaceId !== FINGERPRINT_SPACE_ID || (n.profileId && activeProfileIds.includes(n.profileId)));
        if (updatedNotes.length !== beforeCount) {
            changed = true;
        }
        
        if (changed) {
            localStorage.setItem('axe_notes_notes', JSON.stringify(updatedNotes));
            // Trigger storage event to update other views in real-time
            window.dispatchEvent(new Event('storage'));
        }
    } catch (e) {
        console.error('Error syncing profiles to notes:', e);
    }
};

const Dashboard: React.FC<DashboardProps> = ({ onOpenExtensions, onOpenProxies }) => {
    const { toast } = useToast();
    const { isProfilesFloating, setIsProfilesFloating } = useWorkspace();
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showFoldersGridWindow, setShowFoldersGridWindow] = useState(false);
    const [newInlineFolderName, setNewInlineFolderName] = useState('');
    const [isFoldersBarExpanded, setIsFoldersBarExpanded] = useState(true);
    const [detailProfile, setDetailProfile] = useState<Profile | null>(null);
    const [showPropertiesModal, setShowPropertiesModal] = useState(false);
    const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
    const [sidebarMode, setSidebarMode] = useState<'full' | 'mini' | 'closed'>('mini');
    const [expandedSections, setExpandedSections] = useState({
        filters: true,
        folders: true,
        tags: true
    });
    const [folders, setFolders] = useState<Folder[]>([]);
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
    const [renamingFolderName, setRenamingFolderName] = useState('');
    const [folderContextMenu, setFolderContextMenu] = useState<{ x: number, y: number, folderId: string } | null>(null);
    const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
    const [visibleProps, setVisibleProps] = useState({
        notes: true,
        tags: true,
        proxy: true,
        specs: false,
        statusPill: true,
        osBadge: true,
        statusBadge: true,
    });
    const [statusPicker, setStatusPicker] = useState<{ profileId: string; x: number; y: number } | null>(null);
    const [tagPicker, setTagPicker] = useState<{ profileId: string; x: number; y: number } | null>(null);
    const [tagTemplates, setTagTemplates] = useState<TagTemplate[]>(() => {
        try { return JSON.parse(localStorage.getItem('axe_tag_templates') || 'null') ?? DEFAULT_TAG_TEMPLATES; }
        catch { return DEFAULT_TAG_TEMPLATES; }
    });
    const [showHiddenTags, setShowHiddenTags] = useState(false);
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [profileContextMenu, setProfileContextMenu] = useState<{ x: number, y: number, profileId: string } | null>(null);
    const [showBulkFolderPicker, setShowBulkFolderPicker] = useState(false);
    const [showTemplatesModal, setShowTemplatesModal] = useState(false);
    const [bulkProgress, setBulkProgress] = useState<string | null>(null);
    const bulkFolderRef = useRef<HTMLDivElement>(null);
    const [automationModal, setAutomationModal] = useState<{ profileId: string; profileName: string; cdpUrl: string } | null>(null);
    const [cdpUrls, setCdpUrls] = useState<Record<string, string>>({});
    const [folderCustomizations, setFolderCustomizations] = useState<Record<string, FolderCustomization>>(() => {
        try { return JSON.parse(localStorage.getItem('axe_folder_custom') || '{}'); }
        catch { return {}; }
    });
    const [folderPickerTarget, setFolderPickerTarget] = useState<string | null>(null);
    const [folderPickerPos, setFolderPickerPos] = useState({ x: 0, y: 0 });
    const [pickerDraft, setPickerDraft] = useState<FolderCustomization>({ color: '#a78bfa', iconName: 'Folder' });
    const [floatingPos, setFloatingPos] = useState({ x: 20, y: 200 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    // Column visibility
    const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
        const defaults = { favorite: true, status: true, notes: true, folder: true, tags: true, os: true, proxy: true, actions: true };
        try { 
            const saved = localStorage.getItem('axe_visible_columns');
            if (saved) return { ...defaults, ...JSON.parse(saved) };
            return defaults;
        }
        catch { return defaults; }
    });
    const [showColumnSelector, setShowColumnSelector] = useState(false);
    const [favorites, setFavorites] = useState<Record<string, boolean>>(() => {
        try { return JSON.parse(localStorage.getItem('axe_favorites') || '{}'); }
        catch { return {}; }
    });
    const [expandedPanel, setExpandedPanel] = useState<{ profileId: string; tab: string } | null>(null);
    const [isDetailExpanded, setIsDetailExpanded] = useState(false);
    const [isSavingNotes, setIsSavingNotes] = useState(false);
    const [editingNotes, setEditingNotes] = useState('');
    const [activeNotesEdit, setActiveNotesEdit] = useState<{ profileId: string; tempValue: string } | null>(null);
    const [folderCellPicker, setFolderCellPicker] = useState<{ profileId: string; x: number; y: number } | null>(null);
    const [statusMap, setStatusMap] = useState(() => getStatusMap());
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
        const defaults = {
            name: 340,
            status: 120,
            notes: 150,
            folder: 120,
            tags: 130,
            os: 120,
            proxy: 160,
        };
        try {
            const saved = localStorage.getItem('axe_column_widths');
            return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
        } catch {
            return defaults;
        }
    });
    const [avatarPicker, setAvatarPicker] = useState<{ profileId: string; x: number; y: number } | null>(null);
    const [viewingNote, setViewingNote] = useState<{ profileName: string; notes: string } | null>(null);
    const [groupBy, setGroupBy] = useState<'none' | 'status' | 'folder'>('none');
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    const [showStatusFilterMenu, setShowStatusFilterMenu] = useState(false);
    const [defaultDetailTab, setDefaultDetailTab] = useState<'general' | 'fingerprint' | 'proxy' | 'cookies' | 'history' | 'bookmarks' | 'clear'>('general');

    const [profileCustomOrder, setProfileCustomOrder] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem('axe_profile_custom_order');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const [noteModalState, setNoteModalState] = useState<{
        isOpen: boolean;
        profileId: string;
        profileName: string;
        content: string;
    } | null>(null);

    // Drag handle for floating trigger
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragOffset({
            x: e.clientX - floatingPos.x,
            y: e.clientY - floatingPos.y
        });
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                setFloatingPos({
                    x: e.clientX - dragOffset.x,
                    y: e.clientY - dragOffset.y
                });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset]);

    useEffect(() => {
        loadProfiles();
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            setFolderContextMenu(null);
            setProfileContextMenu(null);
            if (bulkFolderRef.current && !bulkFolderRef.current.contains(e.target as Node)) {
                setShowBulkFolderPicker(false);
            }
        };
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    useEffect(() => {
        const cleanup = window.api.browser.onProfileClosed((profileId: string) => {
            setProfiles((prev: Profile[]) => prev.map((p: Profile) =>
                p.id === profileId ? { ...p, is_active: 0, status: p.status === 'running' ? 'ready' : p.status } : p
            ));
            setCdpUrls(prev => { const next = { ...prev }; delete next[profileId]; return next; });
        });
        return cleanup;
    }, []);

    const loadProfiles = async () => {
        try {
            const result = await window.api.profiles.list();
            if (!isMountedRef.current) return;
            if (result.success) {
                setProfiles(result.data as Profile[]);
                syncProfilesToNotes(result.data as Profile[]);
            }
            
            const foldersResult = await window.api.profiles.listFolders();
            if (!isMountedRef.current) return;
            if (foldersResult.success) {
                setFolders(foldersResult.data as Folder[]);
            }
        } catch (error) {
            console.error('Error loading profiles:', error);
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
            }
        }
    };

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handleCreateFolder = () => {
        setIsCreatingFolder(true);
        setNewFolderName('');
    };

    const submitNewFolder = async () => {
        if (!newFolderName.trim()) {
            setIsCreatingFolder(false);
            return;
        }
        try {
            const result = await window.api.profiles.createFolder(newFolderName.trim());
            if (result.success) {
                await loadProfiles();
                setIsCreatingFolder(false);
                setNewFolderName('');
            } else {
                toast.error('Erro ao criar pasta', result.error as string);
            }
        } catch (error) {
            console.error('Error creating folder:', error);
        }
    };

    const handleFolderInputKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            submitNewFolder();
        } else if (e.key === 'Escape') {
            setIsCreatingFolder(false);
            setNewFolderName('');
        }
    };

    const handleFolderContextMenu = (e: React.MouseEvent, folderId: string) => {
        e.preventDefault();
        setFolderContextMenu({ x: e.clientX, y: e.clientY, folderId });
    };

    const handleDeleteFolder = async (folderId: string) => {
        if (!confirm('Tem certeza que deseja excluir esta pasta? Os perfis nela não serão excluídos, apenas perderão o rótulo da pasta.')) return;
        try {
            const result = await window.api.profiles.deleteFolder(folderId);
            if (result.success) {
                loadProfiles();
            }
        } catch (error) {
            console.error('Error deleting folder:', error);
        }
    };

    const startRenameFolder = (folderId: string, currentName: string) => {
        setRenamingFolderId(folderId);
        setRenamingFolderName(currentName);
        setFolderContextMenu(null);
    };

    const submitRenameFolder = async () => {
        if (!renamingFolderId || !renamingFolderName.trim()) {
            setRenamingFolderId(null);
            return;
        }
        try {
            const result = await window.api.profiles.updateFolder(renamingFolderId, renamingFolderName.trim());
            if (result.success) {
                await loadProfiles();
                setRenamingFolderId(null);
            }
        } catch (error) {
            console.error('Error renaming folder:', error);
        }
    };

    const handleRenameKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            submitRenameFolder();
        } else if (e.key === 'Escape') {
            setRenamingFolderId(null);
        }
    };

    const handleLaunchProfile = async (profileId: string) => {
        setProfiles((prev: Profile[]) => prev.map((p: Profile) =>
            p.id === profileId ? { ...p, status: 'running' } : p
        ));
        try {
            const result = await window.api.browser.launch(profileId);
            if (result.success) {
                setProfiles((prev: Profile[]) => prev.map((p: Profile) =>
                    p.id === profileId ? { ...p, is_active: 1, status: 'running' } : p
                ));
                const cdpResult = await window.api.browser.cdpUrl(profileId);
                if (cdpResult.success && cdpResult.data) {
                    setCdpUrls(prev => ({ ...prev, [profileId]: cdpResult.data as string }));
                }
            } else {
                setProfiles((prev: Profile[]) => prev.map((p: Profile) => p.id === profileId ? { ...p, status: 'ready' } : p));
                toast.error('Erro ao iniciar perfil', result.error as string);
            }
        } catch (error) {
            setProfiles((prev: Profile[]) => prev.map((p: Profile) => p.id === profileId ? { ...p, status: 'ready' } : p));
            toast.error('Erro ao iniciar perfil', String(error));
        }
    };

    const handleCloseProfile = async (profileId: string) => {
        try {
            const result = await window.api.browser.close(profileId);
            if (result.success) {
                setProfiles((prev: Profile[]) => prev.map((p: Profile) =>
                    p.id === profileId ? { ...p, is_active: 0, status: 'ready' } : p
                ));
                setCdpUrls(prev => { const next = { ...prev }; delete next[profileId]; return next; });
            }
        } catch (error) {
            console.error('Error closing profile:', error);
        }
    };

    const [activeSubmenu, setActiveSubmenu] = useState<'folder' | 'category' | null>(null);

    const handleDeleteProfile = async (profileId: string, skipConfirm: boolean = false) => {
        const profile = profiles.find((p: Profile) => p.id === profileId);
        if (profile?.category === 'trash') {
            if (!skipConfirm) {
                if (!confirm('ATENÇÃO: Você está prestes a excluir permanentemente este perfil.')) return;
                if (!confirm('CONFIRMAÇÃO FINAL: Tem certeza absoluta? Esta ação não pode ser desfeita.')) return;
            }
            try {
                const result = await window.api.profiles.delete(profileId);
                if (result.success) {
                    setProfiles((prev: Profile[]) => {
                        const next = prev.filter((p: Profile) => p.id !== profileId);
                        syncProfilesToNotes(next);
                        return next;
                    });
                }
            } catch (error) {
                console.error('Error deleting profile:', error);
            }
        } else {
            await handleUpdateProfile(profileId, { category: 'trash' });
        }
        setProfileContextMenu(null);
    };

    const handleRestoreProfile = async (profileId: string) => {
        await handleUpdateProfile(profileId, { category: 'all' });
        setProfileContextMenu(null);
    };

    const handleProfileContextMenu = (e: React.MouseEvent, profileId: string) => {
        e.preventDefault();
        setProfileContextMenu({ x: e.clientX, y: e.clientY, profileId });
    };

    const handleRemoveFromFolder = async (profileId: string) => {
        await handleUpdateProfile(profileId, { folder_id: null });
        setProfileContextMenu(null);
    };

    // Called by CreateProfileModal AFTER profile creation + warmup complete (or skipped)
    const handleCreateProfile = async (name: string, _platform: string, _tags: string = '') => {
        setShowCreateModal(false);
        toast.success('Perfil criado', name);
        await loadProfiles();
    };

    const toggleNotes = (e: React.MouseEvent, profileId: string) => {
        e.stopPropagation();
        setExpandedNotes(prev => ({ ...prev, [profileId]: !prev[profileId] }));
    };

    const handleUpdateProfile = async (profileId: string, data: any) => {
        try {
            const result = await window.api.profiles.update(profileId, data);
            if (result.success) {
                setProfiles((prev: Profile[]) => {
                    const next = prev.map((p: Profile) => 
                        p.id === profileId ? { ...p, ...data } : p
                    );
                    syncProfilesToNotes(next);
                    return next;
                });
            }
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    };

    const toggleSelection = (profileId: string) => {
        setSelectedProfileIds(prev => 
            prev.includes(profileId) 
                ? prev.filter(id => id !== profileId) 
                : [...prev, profileId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedProfileIds.length === filteredProfiles.length) {
            setSelectedProfileIds([]);
        } else {
            setSelectedProfileIds(filteredProfiles.map(p => p.id));
        }
    };

    const handleBulkStart = async () => {
        const toStart = selectedProfileIds.filter(id => {
            const p = profiles.find(p => p.id === id);
            return p && !p.is_active;
        });

        if (toStart.length === 0) return;

        for (const id of toStart) {
            handleLaunchProfile(id);
        }
        setSelectedProfileIds([]);
    };

    const handleBulkDelete = async () => {
        const inTrash = selectedProfileIds.filter(id => {
            const p = profiles.find(p => p.id === id);
            return p?.category === 'trash';
        });

        if (inTrash.length > 0) {
            if (!confirm(`Você selecionou ${inTrash.length} perfis que já estão na lixeira. Eles serão excluídos PERMANENTEMENTE. Deseja continuar?`)) return;
            if (!confirm('ESTA AÇÃO NÃO PODE SER DESFEITA. Confirmar exclusão permanente?')) return;
        } else {
            if (!confirm(`Deseja mover ${selectedProfileIds.length} perfis para a lixeira?`)) return;
        }
        
        for (const id of selectedProfileIds) {
            await handleDeleteProfile(id, true);
        }
        setSelectedProfileIds([]);
    };

    const handleBulkStop = async () => {
        const toStop = selectedProfileIds.filter(id => {
            const p = profiles.find(p => p.id === id);
            return p?.is_active;
        });
        if (toStop.length === 0) return;
        setBulkProgress(`Parando ${toStop.length} perfis...`);
        for (const id of toStop) {
            await handleCloseProfile(id);
        }
        setBulkProgress(null);
        setSelectedProfileIds([]);
    };

    const handleBulkClone = async () => {
        if (!confirm(`Criar ${selectedProfileIds.length} cópia(s) dos perfis selecionados?`)) return;
        setBulkProgress(`Clonando ${selectedProfileIds.length} perfis...`);
        try {
            const result = await window.api.profiles.bulkClone(selectedProfileIds);
            if (result.success) {
                await loadProfiles();
                toast.success(`${selectedProfileIds.length} perfil(s) clonado(s)`);
                setSelectedProfileIds([]);
            } else {
                toast.error('Erro ao clonar', result.error as string);
            }
        } catch (error) {
            toast.error('Erro ao clonar', String(error));
        } finally {
            setBulkProgress(null);
        }
    };

    const handleBulkFingerprint = async () => {
        if (!confirm(`Regenerar fingerprint de ${selectedProfileIds.length} perfis selecionados? Os perfis não podem estar ativos.`)) return;
        const activeSelected = selectedProfileIds.filter(id => profiles.find(p => p.id === id)?.is_active);
        if (activeSelected.length > 0) {
            toast.warning('Perfis ativos', `${activeSelected.length} perfil(s) precisam ser fechados antes de regenerar o fingerprint.`);
            return;
        }
        setBulkProgress(`Regenerando fingerprints...`);
        try {
            const result = await window.api.profiles.bulkRegenerateFingerprint(selectedProfileIds);
            if (result.success) {
                toast.success('Fingerprints regenerados', `${selectedProfileIds.length} perfil(s) atualizados`);
                setSelectedProfileIds([]);
            } else {
                toast.error('Erro ao regenerar', result.error as string);
            }
        } catch (error) {
            toast.error('Erro ao regenerar', String(error));
        } finally {
            setBulkProgress(null);
        }
    };

    const handleBulkMoveToFolder = async (folderId: string | null) => {
        setBulkProgress(`Movendo ${selectedProfileIds.length} perfis...`);
        try {
            for (const id of selectedProfileIds) {
                await handleUpdateProfile(id, { folder_id: folderId });
            }
            setSelectedProfileIds([]);
        } finally {
            setShowBulkFolderPicker(false);
            setBulkProgress(null);
        }
    };

    const handleBulkExport = async () => {
        setBulkProgress(`Exportando ${selectedProfileIds.length} perfis...`);
        try {
            const result = await window.api.profiles.export(selectedProfileIds);
            if (result.success) {
                const data = result.data as { path: string; count: number };
                toast.success(`${data.count} perfil(s) exportado(s)`, data.path);
                setSelectedProfileIds([]);
            } else if ((result.error as string) !== 'cancelled') {
                toast.error('Erro ao exportar', result.error as string);
            }
        } catch (error) {
            toast.error('Erro ao exportar', String(error));
        } finally {
            setBulkProgress(null);
        }
    };

    const handleImportProfiles = async () => {
        setBulkProgress('Abrindo arquivo...');
        try {
            const result = await window.api.profiles.import();
            if (result.success) {
                const data = result.data as { count: number };
                await loadProfiles();
                toast.success(`${data.count} perfil(s) importado(s) com sucesso!`);
            } else if ((result.error as string) !== 'cancelled') {
                const zipResult = await window.api.profiles.importZip();
                if (zipResult.success && zipResult.profile) {
                    await loadProfiles();
                    toast.success(`Pacote de perfil "${(zipResult.profile as any).name}" importado com sucesso!`);
                } else if (zipResult.error && zipResult.error !== 'cancelled') {
                    toast.error('Erro ao importar', zipResult.error as string);
                }
            }
        } catch (error) {
            toast.error('Erro ao importar', String(error));
        } finally {
            setBulkProgress(null);
        }
    };

    const handleExportSelectedOrAll = async () => {
        const targetIds = selectedProfileIds.length > 0
            ? selectedProfileIds
            : profiles.filter(p => p.category !== 'trash').map(p => p.id);

        if (targetIds.length === 0) {
            toast.error('Nenhum perfil disponível para exportação');
            return;
        }

        setBulkProgress(`Exportando ${targetIds.length} perfil(s)...`);
        try {
            const result = await window.api.profiles.export(targetIds);
            if (result.success && result.data) {
                const data = result.data as { path: string; count: number };
                toast.success('Exportação Concluída', `${data.count} perfil(s) exportado(s) com dados completos (fingerprint, cookies, histórico, favoritos) em: ${data.path}`);
            } else if (result.error && result.error !== 'cancelled') {
                toast.error('Erro ao exportar', result.error as string);
            }
        } catch (error) {
            toast.error('Erro ao exportar perfis', String(error));
        } finally {
            setBulkProgress(null);
        }
    };

    const handleEmptyTrash = async () => {
        const trashCount = profiles.filter(p => p.category === 'trash').length;
        if (trashCount === 0) return;
        if (!confirm(`Esvaziar lixeira? Isso excluirá permanentemente ${trashCount} perfil(s). Esta ação não pode ser desfeita.`)) return;
        if (!confirm('CONFIRMAÇÃO FINAL: excluir todos os perfis da lixeira permanentemente?')) return;
        setBulkProgress('Esvaziando lixeira...');
        try {
            const result = await window.api.profiles.emptyTrash();
            if (result.success) {
                await loadProfiles();
                setSelectedProfileIds([]);
                toast.success('Lixeira esvaziada');
            } else {
                toast.error('Erro ao esvaziar lixeira', result.error as string);
            }
        } finally {
            setBulkProgress(null);
        }
    };

    const handleRestoreAllTrash = async () => {
        const trashed = profiles.filter(p => p.category === 'trash');
        if (trashed.length === 0) return;
        if (!confirm(`Restaurar todos os ${trashed.length} perfis da lixeira?`)) return;
        setBulkProgress('Restaurando perfis...');
        try {
            for (const p of trashed) {
                await handleUpdateProfile(p.id, { category: null });
            }
            setSelectedProfileIds([]);
        } finally {
            setBulkProgress(null);
        }
    };

    const handleCardClick = (profile: Profile) => {
        setDefaultDetailTab('general');
        setDetailProfile(profile);
    };

    const handleAddTag = async (profileId: string, tag: string) => {
        const p = profiles.find(pr => pr.id === profileId);
        if (!p) return;
        const existing = p.tags ? p.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
        if (existing.includes(tag)) return;
        await handleUpdateProfile(profileId, { tags: [...existing, tag].join(', ') });
    };

    const handleRemoveTag = async (profileId: string, tag: string) => {
        const p = profiles.find(pr => pr.id === profileId);
        if (!p) return;
        const remaining = (p.tags || '').split(',').map(t => t.trim()).filter(t => t && t !== tag);
        await handleUpdateProfile(profileId, { tags: remaining.join(', ') });
    };

    const saveTagTemplates = (templates: TagTemplate[]) => {
        setTagTemplates(templates);
        localStorage.setItem('axe_tag_templates', JSON.stringify(templates));
    };

    const openFolderPicker = (folderId: string, e: React.MouseEvent) => {
        const current = folderCustomizations[folderId] ?? { color: '#a78bfa', iconName: 'Folder' };
        setPickerDraft({ ...current });
        setFolderPickerTarget(folderId);
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setFolderPickerPos({ x: rect.right + 10, y: rect.top });
        setFolderContextMenu(null);
    };

    const saveFolderCustomization = () => {
        if (!folderPickerTarget) return;
        const updated = { ...folderCustomizations, [folderPickerTarget]: pickerDraft };
        setFolderCustomizations(updated);
        localStorage.setItem('axe_folder_custom', JSON.stringify(updated));
        setFolderPickerTarget(null);
    };

    const getFolderIcon = (folderId: string) => {
        const iconName = folderCustomizations[folderId]?.iconName ?? 'Folder';
        return FOLDER_ICONS.find(i => i.name === iconName)?.Icon ?? FolderIcon;
    };

    const getFolderColor = (folderId: string) => folderCustomizations[folderId]?.color;

    const getFolderName = (folderId: string | null) => {
        if (!folderId) return null;
        return folders.find((f: Folder) => f.id === folderId)?.name;
    };

    const getCategoryName = (category: string | null) => {
        if (!category || category === 'all') return null;
        const names: Record<string, string> = {
            social: 'Redes Sociais',
            ads: 'Contas de Ads',
            crypto: 'Cripto / Web3'
        };
        return names[category] || category;
    };

    const toggleFavorite = (profileId: string) => {
        setFavorites(prev => {
            const updated = { ...prev, [profileId]: !prev[profileId] };
            if (!updated[profileId]) delete updated[profileId];
            localStorage.setItem('axe_favorites', JSON.stringify(updated));
            return updated;
        });
    };

    const toggleColumn = (col: string) => {
        setVisibleColumns(prev => {
            const updated = { ...prev, [col]: !prev[col] };
            localStorage.setItem('axe_visible_columns', JSON.stringify(updated));
            return updated;
        });
    };

    const getGridTemplateColumns = () => {
        let cols = '40px'; // checkbox always
        if (visibleColumns.favorite) cols += ' 32px';
        cols += ` ${columnWidths.name}px`;
        if (visibleColumns.status) cols += ` ${columnWidths.status}px`;
        if (visibleColumns.notes) cols += ` ${columnWidths.notes}px`;
        if (visibleColumns.folder) cols += ` ${columnWidths.folder}px`;
        if (visibleColumns.tags) cols += ` ${columnWidths.tags}px`;
        if (visibleColumns.os) cols += ` ${columnWidths.os}px`;
        if (visibleColumns.proxy) cols += ` ${columnWidths.proxy}px`;
        cols += ' 90px'; // actions
        return cols;
    };

    const openDetailPanel = (profileId: string, tab: string = 'updates') => {
        const p = profiles.find(pr => pr.id === profileId);
        setEditingNotes(p?.notes || '');
        setExpandedPanel({ profileId, tab });
    };

    const saveNotes = async () => {
        if (!expandedPanel) return;
        setIsSavingNotes(true);
        try {
            await handleUpdateProfile(expandedPanel.profileId, { notes: editingNotes });
        } finally {
            setTimeout(() => setIsSavingNotes(false), 800);
        }
    };

    const cleanNotesText = (notes: string | null | undefined): string => {
        if (!notes) return '';
        let text = String(notes).trim();

        // 1. Strip HTML tags like <p>, </p>, <div>, etc.
        text = text.replace(/<[^>]*>/g, '').trim();

        // 2. Unescape HTML entities
        text = text
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'")
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&');

        // 3. Parse embedded JSON string if present
        if (text.startsWith('[') || text.startsWith('{')) {
            try {
                const parsed = JSON.parse(text);
                if (Array.isArray(parsed)) {
                    return parsed
                        .map((block: any) => {
                            if (typeof block === 'object' && block !== null) {
                                return block.content || block.title || block.text || '';
                            }
                            return String(block);
                        })
                        .filter(Boolean)
                        .join(' - ')
                        .trim();
                }
                if (parsed.type === 'doc' && Array.isArray(parsed.content)) {
                    const extractText = (node: any): string => {
                        if (node.text) return node.text;
                        if (Array.isArray(node.content)) {
                            return node.content.map(extractText).join(' ');
                        }
                        return '';
                    };
                    return parsed.content.map(extractText).join(' ').trim();
                }
                if (typeof parsed === 'object' && parsed !== null) {
                    if (parsed.content) return String(parsed.content).trim();
                    if (parsed.text) return String(parsed.text).trim();
                }
            } catch {
                // Ignore parse error, use stripped text
            }
        }

        return text;
    };

    const renderNotesPreview = (notes: string | null): string => {
        return cleanNotesText(notes);
    };

    const saveInlineNotes = async () => {
        if (!activeNotesEdit) return;
        const { profileId, tempValue } = activeNotesEdit;
        setActiveNotesEdit(null);
        await handleUpdateProfile(profileId, { notes: tempValue });
    };

    const handleInlineNotesKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            saveInlineNotes();
        } else if (e.key === 'Escape') {
            setActiveNotesEdit(null);
        }
    };

    const startResize = (e: React.MouseEvent, columnKey: string) => {
        e.preventDefault();
        e.stopPropagation();
        const startX = e.clientX;
        const startWidth = columnWidths[columnKey] || 150;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const newWidth = Math.max(80, startWidth + deltaX);
            setColumnWidths(prev => {
                const next = { ...prev, [columnKey]: newWidth };
                localStorage.setItem('axe_column_widths', JSON.stringify(next));
                return next;
            });
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const renderProfileAvatar = (p: Profile) => {
        const iconName = p.avatar_icon;
        const customColor = p.avatar_color || 'linear-gradient(135deg, #6d28d9 0%, #4f46e5 100%)';
        const IconComponent = iconName ? (Lucide as any)[iconName] : null;

        return (
            <div 
                className={styles.mondayAvatar} 
                style={{ background: customColor, cursor: 'pointer' }}
                onClick={(e) => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    setAvatarPicker({
                        profileId: p.id,
                        x: rect.left,
                        y: rect.bottom + 4
                    });
                }}
            >
                {IconComponent ? <IconComponent size={12} /> : p.name.charAt(0).toUpperCase()}
            </div>
        );
    };

    const COLUMN_CONFIG = [
        { key: 'favorite', label: 'Favorito', color: '#f59e0b' },
        { key: 'status', label: 'Status', color: '#38bdf8' },
        { key: 'notes', label: 'Notas', color: '#f87171' },
        { key: 'folder', label: 'Grupo / Pasta', color: '#a78bfa' },
        { key: 'tags', label: 'Tags', color: '#34d399' },
        { key: 'os', label: 'SO', color: '#6366f1' },
        { key: 'proxy', label: 'Proxy', color: '#06b6d4' },
        { key: 'actions', label: 'Ações', color: '#94a3b8' },
    ];

    const handleDragStart = (e: React.DragEvent, profileId: string) => {
        e.dataTransfer.setData('profileId', profileId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDropCategory = async (e: React.DragEvent, category: string) => {
        e.preventDefault();
        const profileId = e.dataTransfer.getData('profileId');
        if (!profileId) return;
        
        await handleUpdateProfile(profileId, { category });
    };

    const handleDropFolder = async (e: React.DragEvent, folderId: string) => {
        e.preventDefault();
        const profileId = e.dataTransfer.getData('profileId');
        if (!profileId) return;
        
        await handleUpdateProfile(profileId, { folder_id: folderId });
    };

    const availableTags = React.useMemo(() => {
        const tagsSet = new Set<string>();
        profiles.forEach(p => {
            if (p.category !== 'trash' && p.tags) {
                p.tags.split(',').forEach(t => {
                    const trimmed = t.trim();
                    if (trimmed) {
                        tagsSet.add(trimmed);
                    }
                });
            }
        });
        return Array.from(tagsSet).sort();
    }, [profiles]);

    const inactiveTags = React.useMemo(() => {
        const allTemplateTags = new Set<string>();
        tagTemplates.forEach(tpl => {
            if (Array.isArray(tpl.tags)) {
                tpl.tags.forEach(t => {
                    const trimmed = t.trim();
                    if (trimmed) {
                        allTemplateTags.add(trimmed);
                    }
                });
            }
        });

        const inactiveSet = new Set<string>();
        allTemplateTags.forEach(t => {
            const isAssigned = availableTags.some(act => act.toLowerCase() === t.toLowerCase());
            if (!isAssigned) {
                inactiveSet.add(t);
            }
        });
        return Array.from(inactiveSet).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    }, [availableTags, tagTemplates]);

    const filteredProfiles = profiles.filter((profile: Profile) => {
        if (selectedCategory === 'trash') {
            if (profile.category !== 'trash') return false;
        } else {
            if (profile.category === 'trash') return false;
        }

        const matchesSearch = profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             (profile.tags?.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const matchesCategory = selectedCategory === 'all' || selectedCategory === 'trash' || profile.category === selectedCategory;
        const matchesFolder = !selectedFolder || profile.folder_id === selectedFolder;
        const matchesTag = !selectedTag || (profile.tags && profile.tags.split(',').map(t => t.trim().toLowerCase()).includes(selectedTag.toLowerCase()));
        const matchesStatus = !selectedStatus || (profile.status ?? 'ready') === selectedStatus;
        
        return matchesSearch && matchesCategory && matchesFolder && matchesTag && matchesStatus;
    });

    const sortedFilteredProfiles = React.useMemo(() => {
        if (profileCustomOrder.length === 0) return filteredProfiles;
        const orderMap = new Map(profileCustomOrder.map((id, index) => [id, index]));
        return [...filteredProfiles].sort((a, b) => {
            const orderA = orderMap.has(a.id) ? orderMap.get(a.id)! : 999999;
            const orderB = orderMap.has(b.id) ? orderMap.get(b.id)! : 999999;
            return orderA - orderB;
        });
    }, [filteredProfiles, profileCustomOrder]);

    const handleDropReorderProfile = (draggedId: string, targetId: string) => {
        if (!draggedId || !targetId || draggedId === targetId) return;
        const allIds = profiles.map(p => p.id);
        const currentOrder = profileCustomOrder.length > 0 ? [...profileCustomOrder] : [...allIds];

        allIds.forEach(id => {
            if (!currentOrder.includes(id)) currentOrder.push(id);
        });

        const fromIdx = currentOrder.indexOf(draggedId);
        const toIdx = currentOrder.indexOf(targetId);

        if (fromIdx !== -1 && toIdx !== -1) {
            currentOrder.splice(fromIdx, 1);
            currentOrder.splice(toIdx, 0, draggedId);
            setProfileCustomOrder(currentOrder);
            localStorage.setItem('axe_profile_custom_order', JSON.stringify(currentOrder));
            toast.success('Ordem dos perfis reordenada!');
        }
    };

    const handleSaveNoteModal = async (profileId: string, content: string) => {
        const cleaned = cleanNotesText(content);
        await handleUpdateProfile(profileId, { notes: cleaned });
        toast.success('Nota salva com sucesso!');
        setNoteModalState(null);
    };

    return (
        <div className="h-full flex flex-col bg-[#09090b] overflow-hidden">
            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <aside className={`${styles.sidebar} ${sidebarMode === 'closed' ? styles.sidebarClosed : sidebarMode === 'mini' ? styles.sidebarMini : ''}`}>
                    {sidebarMode === 'mini' ? (
                        /* ── Mini Sidebar (icon rail) ── */
                        <div className={styles.miniNav}>
                            {/* Expand toggle */}
                            <MiniItem
                                icon={PanelLeftOpen}
                                label="Expandir Menu"
                                onClick={() => setSidebarMode('full')}
                            />

                            <div className={styles.miniDivider} />

                            {/* Todos os Perfis */}
                            <MiniItem
                                icon={LayoutGrid}
                                label="Todos os Perfis"
                                active={selectedCategory === 'all' && !selectedFolder && !selectedTag}
                                badge={profiles.filter(p => p.category !== 'trash').length}
                                onClick={() => { setSelectedCategory('all'); setSelectedFolder(null); setSelectedTag(null); }}
                            />

                            <div className={styles.miniDivider} />

                            {/* Pastas — section icon */}
                            <div className={styles.miniSectionLabel} title="Pastas">
                                <FolderIcon size={13} />
                            </div>

                            {folders.map((folder: Folder) => {
                                const FolderIconComp = getFolderIcon(folder.id);
                                return (
                                    <MiniItem
                                        key={folder.id}
                                        icon={FolderIconComp}
                                        label={folder.name}
                                        active={selectedFolder === folder.id}
                                        badge={profiles.filter((p: Profile) => p.folder_id === folder.id && p.category !== 'trash').length}
                                        color={getFolderColor(folder.id)}
                                        onClick={() => { setSelectedFolder(folder.id); setSelectedCategory('all'); setSelectedTag(null); }}
                                        onContextMenu={(e: React.MouseEvent) => handleFolderContextMenu(e, folder.id)}
                                        onDragOver={handleDragOver}
                                        onDrop={(e: React.DragEvent) => handleDropFolder(e, folder.id)}
                                    />
                                );
                            })}

                            {/* Nova pasta */}
                            <MiniItem icon={Plus} label="Nova Pasta" onClick={handleCreateFolder} />

                            {isCreatingFolder && (
                                <div className={styles.folderInputWrapper} style={{ width: '100%', margin: '4px 0' }}>
                                    <FolderIcon size={14} className="text-violet-400" />
                                    <input
                                        autoFocus
                                        type="text"
                                        className={styles.folderInput}
                                        placeholder="Nome..."
                                        value={newFolderName}
                                        onChange={(e) => setNewFolderName(e.target.value)}
                                        onKeyDown={handleFolderInputKeyDown}
                                        onBlur={submitNewFolder}
                                        style={{ fontSize: '0.75rem' }}
                                    />
                                </div>
                            )}

                            <div className={styles.miniDivider} />

                            {/* Filtros — section icon */}
                            <div className={styles.miniSectionLabel} title="Filtros Rápidos">
                                <Filter size={13} />
                            </div>

                            <MiniItem icon={Shield}  label="Ativos"     badge={profiles.filter((p: Profile) => p.is_active).length} color="#10b981" />
                            <MiniItem icon={Globe}   label="Com Proxy"  badge={profiles.filter((p: Profile) => p.proxy).length}     color="#06b6d4" />
                            <MiniItem icon={Star}    label="Favoritos"  badge={0}                                                    color="#f59e0b" />

                            <div className={styles.miniDivider} />

                            {/* Tags — section icon */}
                            <div className={styles.miniSectionLabel} onClick={() => toggleSection('tags')} title="Tags" style={{ cursor: 'pointer' }}>
                                <Tag size={13} />
                            </div>

                            {expandedSections.tags && availableTags.map(tag => {
                                const active = selectedTag === tag;
                                const isSocial = SOCIAL_TAG_COLORS[tag.toLowerCase()];
                                return (
                                    <MiniItem
                                        key={tag}
                                        icon={Tag}
                                        label={tag}
                                        active={active}
                                        badge={profiles.filter(p => p.category !== 'trash' && p.tags && p.tags.split(',').map(t => t.trim().toLowerCase()).includes(tag.toLowerCase())).length}
                                        color={isSocial ? isSocial.color : '#a78bfa'}
                                        onClick={() => {
                                            setSelectedTag(active ? null : tag);
                                            setSelectedCategory('all');
                                            setSelectedFolder(null);
                                        }}
                                    />
                                );
                            })}

                            {/* Spacer */}
                            <div style={{ flex: 1 }} />

                            {/* Lixeira */}
                            <MiniItem
                                icon={Trash2}
                                label="Lixeira"
                                danger
                                active={selectedCategory === 'trash'}
                                badge={profiles.filter((p: Profile) => p.category === 'trash').length}
                                badgeDanger
                                onClick={() => { setSelectedCategory('trash'); setSelectedFolder(null); setSelectedTag(null); }}
                                onDragOver={handleDragOver}
                                onDrop={(e: React.DragEvent) => handleDropCategory(e, 'trash')}
                            />
                        </div>
                    ) : (
                        /* ── Full Sidebar ── */
                        <>
                            <div className="flex items-center justify-between mb-1 px-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Perfis</span>
                                <button
                                    className="p-1.5 bg-white/5 border border-white/5 rounded-lg text-slate-500 hover:text-theme-text transition-colors"
                                    onClick={() => setSidebarMode('mini')}
                                    title="Recolher sidebar">
                                    <PanelLeftClose size={15} />
                                </button>
                            </div>

                            <div className={styles.sidebarSection}>
                                <div className={styles.sectionContent}>
                                    <div
                                        className={`${styles.sidebarItem} ${selectedCategory === 'all' && !selectedFolder && !selectedTag ? styles.sidebarItemActive : ''}`}
                                        onClick={() => { setSelectedCategory('all'); setSelectedFolder(null); setSelectedTag(null); }}>
                                        <LayoutGrid size={18} />
                                        <span>Todos os Perfis</span>
                                        <span className={styles.sidebarBadge}>{profiles.filter(p => p.category !== 'trash').length}</span>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.sidebarSection}>
                                <div className={styles.sectionHeader} onClick={() => toggleSection('folders')}>
                                    <h4 className={styles.sidebarTitle}>Pastas</h4>
                                    <div className="flex items-center gap-2">
                                        <Plus size={14} className="cursor-pointer hover:text-theme-text" onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleCreateFolder(); }} />
                                        {expandedSections.folders ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </div>
                                </div>

                                {expandedSections.folders && (
                                    <div className={styles.sectionContent}>
                                        {isCreatingFolder && (
                                            <div className={styles.folderInputWrapper}>
                                                <FolderIcon size={16} className="text-violet-400" />
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    className={styles.folderInput}
                                                    placeholder="Nome da pasta..."
                                                    value={newFolderName}
                                                    onChange={(e) => setNewFolderName(e.target.value)}
                                                    onKeyDown={handleFolderInputKeyDown}
                                                    onBlur={submitNewFolder}
                                                />
                                            </div>
                                        )}
                                        {folders.length === 0 && !isCreatingFolder && <p className="text-[10px] text-slate-600 px-3 py-2 italic">Nenhuma pasta criada</p>}
                                        {folders.map((folder: Folder) => {
                                            const FolderIconComp = getFolderIcon(folder.id);
                                            const folderColor = getFolderColor(folder.id);
                                            return (
                                                <div
                                                    key={folder.id}
                                                    className={`${styles.sidebarItem} ${selectedFolder === folder.id ? styles.sidebarItemActive : ''}`}
                                                    onClick={() => { setSelectedFolder(folder.id); setSelectedCategory('all'); setSelectedTag(null); }}
                                                    onContextMenu={(e: React.MouseEvent) => handleFolderContextMenu(e, folder.id)}
                                                    onDragOver={handleDragOver}
                                                    onDrop={(e: React.DragEvent) => handleDropFolder(e, folder.id)}>
                                                    <FolderIconComp size={18} style={folderColor ? { color: folderColor } : {}} />
                                                    {renamingFolderId === folder.id ? (
                                                        <input
                                                            autoFocus
                                                            type="text"
                                                            className={styles.renameInput}
                                                            value={renamingFolderName}
                                                            onChange={(e) => setRenamingFolderName(e.target.value)}
                                                            onKeyDown={handleRenameKeyDown}
                                                            onBlur={submitRenameFolder}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    ) : (
                                                        <>
                                                            <span className="flex-1 truncate">{folder.name}</span>
                                                            <span className={styles.sidebarBadge}>{profiles.filter((p: Profile) => p.folder_id === folder.id && p.category !== 'trash').length}</span>
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className={styles.sidebarSection}>
                                <div className={styles.sectionHeader} onClick={() => toggleSection('tags')}>
                                    <h4 className={styles.sidebarTitle}>Tags</h4>
                                    {expandedSections.tags ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </div>

                                {expandedSections.tags && (
                                    <div className={styles.sectionContent}>
                                        {availableTags.length === 0 && inactiveTags.length === 0 ? (
                                            <p className="text-[10px] text-slate-600 px-3 py-2 italic">Nenhuma tag vinculada</p>
                                        ) : (
                                            <>
                                                {/* Active Tags */}
                                                {availableTags.map(tag => {
                                                    const active = selectedTag === tag;
                                                    const isSocial = SOCIAL_TAG_COLORS[tag.toLowerCase()];
                                                    return (
                                                        <div
                                                            key={tag}
                                                            className={`${styles.sidebarItem} ${active ? styles.sidebarItemActive : ''}`}
                                                            onClick={() => {
                                                                setSelectedTag(active ? null : tag);
                                                                setSelectedCategory('all');
                                                                setSelectedFolder(null);
                                                            }}
                                                        >
                                                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: isSocial ? isSocial.color : '#a78bfa', flexShrink: 0 }}>
                                                                {getTagIconElement(tag, 16)}
                                                            </span>
                                                            <span className="flex-1 truncate ml-2">{tag}</span>
                                                            <span className={styles.sidebarBadge}>
                                                                {profiles.filter(p => p.category !== 'trash' && p.tags && p.tags.split(',').map(t => t.trim().toLowerCase()).includes(tag.toLowerCase())).length}
                                                            </span>
                                                        </div>
                                                    );
                                                })}

                                                {/* Collapsible Hidden/Inactive Tags section */}
                                                {inactiveTags.length > 0 && (
                                                    <>
                                                        <div
                                                            className={styles.hiddenTagsToggle}
                                                            onClick={() => setShowHiddenTags(!showHiddenTags)}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 6,
                                                                padding: '6px 12px',
                                                                borderRadius: 8,
                                                                cursor: 'pointer',
                                                                fontSize: '11px',
                                                                fontWeight: 700,
                                                                color: '#475569',
                                                                background: 'rgba(255, 255, 255, 0.01)',
                                                                border: '1px solid var(--border-default)',
                                                                marginTop: 8,
                                                                marginBottom: 4,
                                                                transition: 'all 0.15s',
                                                                userSelect: 'none'
                                                            }}
                                                            onMouseEnter={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'; }}
                                                            onMouseLeave={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.01)'; }}
                                                        >
                                                            {showHiddenTags ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                                            <span>Ocultos ({inactiveTags.length})</span>
                                                        </div>

                                                        {showHiddenTags && (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingLeft: 4, animation: 'slideDown 0.15s ease-out' }}>
                                                                {inactiveTags.map(tag => {
                                                                    const active = selectedTag === tag;
                                                                    const isSocial = SOCIAL_TAG_COLORS[tag.toLowerCase()];
                                                                    return (
                                                                        <div
                                                                            key={tag}
                                                                            className={`${styles.sidebarItem} ${active ? styles.sidebarItemActive : ''}`}
                                                                            style={{ opacity: 0.55 }}
                                                                            onClick={() => {
                                                                                setSelectedTag(active ? null : tag);
                                                                                setSelectedCategory('all');
                                                                                setSelectedFolder(null);
                                                                            }}
                                                                            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                                                                            onMouseLeave={e => e.currentTarget.style.opacity = '0.55'}
                                                                        >
                                                                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: isSocial ? isSocial.color : '#64748b', flexShrink: 0 }}>
                                                                                {getTagIconElement(tag, 14)}
                                                                            </span>
                                                                            <span className="flex-1 truncate ml-2 font-normal text-xs">{tag}</span>
                                                                            <span className={styles.sidebarBadge} style={{ opacity: 0.5 }}>0</span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className={styles.sidebarSection}>
                                <div className={styles.sectionHeader} onClick={() => toggleSection('filters')}>
                                    <h4 className={styles.sidebarTitle}>Filtros Rápidos</h4>
                                    {expandedSections.filters ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </div>

                                {expandedSections.filters && (
                                    <div className={styles.sectionContent}>
                                        <div className={styles.sidebarItem}>
                                            <Shield size={18} className="text-emerald-500" />
                                            <span>Ativos</span>
                                            <span className={styles.sidebarBadge}>{profiles.filter((p: Profile) => p.is_active).length}</span>
                                        </div>
                                        <div className={styles.sidebarItem}>
                                            <Globe size={18} className="text-cyan-500" />
                                            <span>Com Proxy</span>
                                            <span className={styles.sidebarBadge}>{profiles.filter((p: Profile) => p.proxy).length}</span>
                                        </div>
                                        <div className={styles.sidebarItem}>
                                            <Star size={18} className="text-amber-500" />
                                            <span>Favoritos</span>
                                            <span className={styles.sidebarBadge}>0</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-auto flex flex-col gap-3 p-3">
                                <ResourceMonitor />

                                <div className={`bg-gradient-to-br from-violet-600/10 to-indigo-600/10 rounded-2xl p-4 border border-violet-500/10 relative group ${styles.proBannerContent}`}>
                                    <p className="text-[10px] text-violet-400 font-bold uppercase tracking-wider mb-1">Versão Pro</p>
                                    <p className="text-xs text-theme-text-muted leading-relaxed">Você está usando o plano profissional com perfis ilimitados.</p>
                                </div>

                                <div
                                    className={`${styles.sidebarItem} ${selectedCategory === 'trash' ? styles.sidebarItemActive : ''} !text-red-400/80 hover:!text-red-400 !bg-red-500/5 border border-transparent hover:border-red-500/20`}
                                    onClick={() => { setSelectedCategory('trash'); setSelectedFolder(null); setSelectedTag(null); }}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDropCategory(e, 'trash')}>
                                    <Trash2 size={18} />
                                    <span>Lixeira</span>
                                    <span className={`${styles.sidebarBadge} !bg-red-500/20 !text-red-400`}>
                                        {profiles.filter((p: Profile) => p.category === 'trash').length}
                                    </span>
                                </div>
                            </div>
                        </>
                    )}
                </aside>

                <main className={styles.content} onClick={() => { setOpenMenu(null); setFolderContextMenu(null); setProfileContextMenu(null); setStatusPicker(null); setTagPicker(null); }}>
                    {/* Monday Style Board Header */}
                    {/* Mega Toolbar (Phase 4) */}
                    <div className={styles.megaToolbar}>
                        <div className="flex items-center gap-3">
                            <h1 className={styles.megaTitle}>
                                {selectedFolder ? getFolderName(selectedFolder) : selectedCategory === 'trash' ? 'Lixeira' : selectedCategory === 'all' ? 'Todos os Perfis' : getCategoryName(selectedCategory)}
                            </h1>
                            {!loading && (
                                <button className={`${styles.megaBtn} ${styles.megaBtnPrimary}`} onClick={() => setShowCreateModal(true)} title="Novo Perfil" style={{ height: '28px', padding: '0 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Plus size={13} strokeWidth={2.5} /> <span style={{ fontSize: '12px' }}>Novo Perfil</span>
                                </button>
                            )}
                        </div>

                        {!loading && (
                            <>
                                <div className={styles.megaDivider} />

                                {/* Retractable Search */}
                                <div className={`${styles.megaSearchContainer} ${isSearchOpen || searchQuery ? styles.searchExpanded : ''}`}>
                                    <div className={styles.megaSearchIcon}>
                                        <Search size={14} />
                                    </div>
                                    <input 
                                        className={styles.megaSearchInput}
                                        placeholder="Buscar perfis..."
                                        value={searchQuery} 
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                                        onFocus={() => setIsSearchOpen(true)}
                                        onBlur={() => !searchQuery && setIsSearchOpen(false)}
                                    />
                                </div>

                                <div className={styles.megaDivider} />

                                {/* Core Actions */}
                                <button className={styles.megaBtn} onClick={handleImportProfiles} title="Importar perfis (JSON ou .axeprofile)">
                                    <Upload size={14} /> <span className={styles.btnText}>Importar</span>
                                </button>
                                <button className={styles.megaBtn} onClick={handleExportSelectedOrAll} title="Exportar perfil selecionado ou todos os perfis com dados completos (JSON)">
                                    <Download size={14} /> <span className={styles.btnText}>Exportar</span>
                                </button>
                                <button className={styles.megaBtn} onClick={() => setShowTemplatesModal(true)} title="Templates">
                                    <Layers size={14} /> <span className={styles.btnText}>Templates</span>
                                </button>
                                <button className={styles.megaBtn} onClick={onOpenExtensions} title="Extensões">
                                    <Puzzle size={14} /> <span className={styles.btnText}>Extensões</span>
                                </button>
                                <button className={styles.megaBtn} onClick={() => window.dispatchEvent(new CustomEvent('open-metaclean-modal'))} title="MetaClean">
                                    <Eraser size={14} /> <span className={styles.btnText}>MetaClean</span>
                                </button>
                                <button className={styles.megaBtn} onClick={onOpenProxies} title="Proxy">
                                    <Network size={14} /> <span className={styles.btnText}>Proxy</span>
                                </button>

                                <div className={styles.megaDivider} />

                                {/* Status Filter Menu Dropdown */}
                                <div style={{ position: 'relative' }}>
                                    <button 
                                        className={`${styles.megaBtn} ${selectedStatus ? styles.megaBtnActive : ''}`} 
                                        onClick={(e) => { e.stopPropagation(); setShowStatusFilterMenu(!showStatusFilterMenu); }} 
                                        title="Filtrar por Status do Perfil"
                                    >
                                        <Activity size={14} /> 
                                        <span className={styles.btnText}>
                                            {selectedStatus ? (statusMap[selectedStatus]?.label || selectedStatus) : 'Status'}
                                        </span>
                                        {selectedStatus && (
                                            <span className="w-2 h-2 rounded-full ml-1 shrink-0" style={{ background: statusMap[selectedStatus]?.dot || '#38bdf8' }} />
                                        )}
                                    </button>

                                    {showStatusFilterMenu && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setShowStatusFilterMenu(false)} />
                                            <div className="absolute top-full left-0 mt-2 z-50 w-56 bg-[#18181b] border border-white/15 rounded-[5px] shadow-2xl p-1.5 space-y-0.5 text-xs font-sans">
                                                <div className="px-2 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-white/10 mb-1 flex items-center justify-between">
                                                    <span>Filtrar por Status</span>
                                                    {selectedStatus && (
                                                        <button 
                                                            onClick={() => setSelectedStatus(null)}
                                                            className="text-[10px] text-emerald-400 hover:underline cursor-pointer"
                                                        >
                                                            Limpar
                                                        </button>
                                                    )}
                                                </div>

                                                <button
                                                    className={`w-full text-left px-2.5 py-1.5 rounded-[5px] flex items-center justify-between font-semibold transition-colors cursor-pointer ${
                                                        !selectedStatus ? 'bg-white/10 text-white' : 'text-zinc-300 hover:bg-white/5'
                                                    }`}
                                                    onClick={() => { setSelectedStatus(null); setShowStatusFilterMenu(false); }}
                                                >
                                                    <span>Todos os Status</span>
                                                    <span className="text-[10px] text-zinc-500 font-mono">
                                                        ({profiles.filter(p => p.category !== 'trash').length})
                                                    </span>
                                                </button>

                                                {Object.entries(statusMap).map(([key, cfg]) => {
                                                    const count = profiles.filter(p => p.category !== 'trash' && (p.status ?? 'ready') === key).length;
                                                    return (
                                                        <button
                                                            key={key}
                                                            className={`w-full text-left px-2.5 py-1.5 rounded-[5px] flex items-center justify-between font-semibold transition-colors cursor-pointer ${
                                                                selectedStatus === key ? 'bg-white/10 text-white' : 'text-zinc-300 hover:bg-white/5'
                                                            }`}
                                                            onClick={() => { setSelectedStatus(key); setShowStatusFilterMenu(false); }}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cfg.dot }} />
                                                                <span>{cfg.label}</span>
                                                            </div>
                                                            <span className="text-[10px] text-zinc-500 font-mono">({count})</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    )}
                                </div>
                                <button className={`${styles.megaBtn} ${showFoldersGridWindow ? styles.megaBtnActive : ''}`} onClick={() => setShowFoldersGridWindow(true)} title="Pastas e Grupos">
                                    <FolderIcon size={14} /> <span className={styles.btnText}>Pastas</span>
                                </button>
                                <button className={styles.megaBtn} onClick={() => setIsFoldersBarExpanded(!isFoldersBarExpanded)} title={isFoldersBarExpanded ? "Ocultar Barra de Pastas" : "Exibir Barra de Pastas"}>
                                    {isFoldersBarExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />} <span className={styles.btnText}>{isFoldersBarExpanded ? "Ocultar" : "Pastas Rápidas"}</span>
                                </button>

                                {/* Column Selector */}
                                <div style={{ position: 'relative' }}>
                                    <button className={`${styles.megaBtn} ${showColumnSelector ? styles.megaBtnActive : ''}`} onClick={() => setShowColumnSelector(!showColumnSelector)} title="Exibir / Ocultar colunas">
                                        <Eye size={14} /> <span className={styles.btnText}>Ocultar</span>
                                    </button>
                                    {showColumnSelector && (
                                        <>
                                            <div className={styles.columnSelectorOverlay} onClick={() => setShowColumnSelector(false)} />
                                            <div className={styles.columnSelector} style={{ top: '100%', marginTop: '8px' }}>
                                                <div className={styles.columnSelectorTitle}>Exibir colunas</div>
                                                <div className={styles.columnSelectorAll} onClick={() => {
                                                    const allOn = Object.values(visibleColumns).every(v => v);
                                                    const updated: Record<string, boolean> = {};
                                                    COLUMN_CONFIG.forEach(c => updated[c.key] = !allOn);
                                                    setVisibleColumns(updated);
                                                    localStorage.setItem('axe_visible_columns', JSON.stringify(updated));
                                                }}>
                                                    <div className={`${styles.colCheckbox} ${Object.values(visibleColumns).every(v => v) ? styles.colCheckboxChecked : ''}`}>
                                                        {Object.values(visibleColumns).every(v => v) && <div style={{ width: 6, height: 6, background: 'white', borderRadius: 1 }} />}
                                                    </div>
                                                    <span className={styles.colLabel}>Todas as colunas — {Object.values(visibleColumns).filter(v => v).length} selecionada(s)</span>
                                                </div>
                                                {COLUMN_CONFIG.map(col => (
                                                    <div key={col.key} className={styles.columnSelectorItem} onClick={() => toggleColumn(col.key)}>
                                                        <div className={`${styles.colCheckbox} ${visibleColumns[col.key] ? styles.colCheckboxChecked : ''}`}>
                                                            {visibleColumns[col.key] && <div style={{ width: 6, height: 6, background: 'white', borderRadius: 1 }} />}
                                                        </div>
                                                        <div className={styles.colIcon} style={{ background: col.color + '20', color: col.color }}>
                                                            {col.key === 'favorite' && <Star size={12} />}
                                                            {col.key === 'status' && <Activity size={12} />}
                                                            {col.key === 'notes' && <FileText size={12} />}
                                                            {col.key === 'folder' && <FolderIcon size={12} />}
                                                            {col.key === 'tags' && <Tag size={12} />}
                                                            {col.key === 'proxy' && <Globe size={12} />}
                                                            {col.key === 'actions' && <MoreVertical size={12} />}
                                                        </div>
                                                        <span className={styles.colLabel}>{col.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Group By Selector */}
                                <div style={{ position: 'relative' }}>
                                    <button className={`${styles.megaBtn} ${groupBy !== 'none' ? styles.megaBtnActive : ''}`} onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === 'groupby' ? null : 'groupby'); }} title="Agrupar por">
                                        <ArrowUpDown size={14} /> <span className={styles.btnText}>Agrupar por</span>
                                    </button>
                                    {openMenu === 'groupby' && (
                                        <div className={styles.folderPickerDropdown} style={{ position: 'absolute', top: '100%', left: 0, marginTop: '8px', zIndex: 100 }}>
                                            <button onClick={() => setGroupBy('none')} style={{ background: groupBy === 'none' ? 'rgba(255,255,255,0.1)' : '' }}>Sem agrupamento</button>
                                            <button onClick={() => setGroupBy('status')} style={{ background: groupBy === 'status' ? 'rgba(255,255,255,0.1)' : '' }}>Por Status</button>
                                            <button onClick={() => setGroupBy('folder')} style={{ background: groupBy === 'folder' ? 'rgba(255,255,255,0.1)' : '' }}>Por Pasta</button>
                                        </div>
                                    )}
                                </div>

                                <div className={styles.megaDivider} />

                                {/* Stats Chips */}
                                <div className={styles.megaStat}>
                                    <Users size={14} className="text-slate-500" />
                                    <span style={{fontWeight:600}}>{profiles.filter(p => p.category !== 'trash').length}</span>
                                </div>
                                <div className={styles.megaStat}>
                                    <Activity size={14} className="text-emerald-500" />
                                    <span style={{fontWeight:600, color: 'var(--tw-text-opacity) ? rgba(52,211,153,var(--tw-text-opacity)) : #34d399'}}>{profiles.filter(p => p.is_active).length}</span>
                                </div>
                                <div className={styles.megaStat}>
                                    <Globe size={14} className="text-cyan-500" />
                                    <span style={{fontWeight:600, color: 'var(--tw-text-opacity) ? rgba(34,211,238,var(--tw-text-opacity)) : #22d3ee'}}>{profiles.filter(p => p.proxy).length}</span>
                                </div>
                                <div className={styles.megaStat}>
                                    <Monitor size={14} className="text-violet-400" />
                                    <span style={{fontWeight:600, color: 'var(--tw-text-opacity) ? rgba(167,139,250,var(--tw-text-opacity)) : #a78bfa'}}>{Object.keys(cdpUrls).length}</span>
                                </div>

                                <div className={styles.megaDivider} />

                                {/* View Mode */}
                                <button className={`${styles.megaBtn} ${viewMode === 'grid' ? styles.megaBtnActive : ''}`} onClick={() => setViewMode('grid')} style={{ padding: '0 8px' }} title="Grid">
                                    <Grid size={14} />
                                </button>
                                <button className={`${styles.megaBtn} ${viewMode === 'list' ? styles.megaBtnActive : ''}`} onClick={() => setViewMode('list')} style={{ padding: '0 8px' }} title="Lista">
                                    <List size={14} />
                                </button>

                                {/* More */}
                                <button className={styles.megaBtn} style={{ padding: '0 8px' }}>
                                    <MoreVertical size={14} />
                                </button>
                            </>
                        )}
                    </div>

                    {!loading && selectedCategory !== 'trash' && isFoldersBarExpanded && (
                        <div className={styles.quickFoldersBar}>
                            <span className={styles.quickFoldersTitle}>
                                <FolderIcon size={12} /> Pastas rápidas:
                            </span>
                            <button
                                onClick={() => { setSelectedFolder(null); setSelectedCategory('all'); setSelectedTag(null); }}
                                className={`${styles.quickFolderChip} ${!selectedFolder ? styles.quickFolderChipActive : ''}`}
                            >
                                Todos ({profiles.filter(p => p.category !== 'trash').length})
                            </button>
                            {folders.map(folder => {
                                const folderProfilesCount = profiles.filter(p => p.folder_id === folder.id && p.category !== 'trash').length;
                                const isSelected = selectedFolder === folder.id;
                                const color = getFolderColor(folder.id) || '#a78bfa';
                                return (
                                    <button
                                        key={folder.id}
                                        onClick={() => { setSelectedFolder(folder.id); setSelectedCategory('all'); setSelectedTag(null); }}
                                        className={`${styles.quickFolderChip} ${isSelected ? styles.quickFolderChipActive : ''}`}
                                        style={isSelected ? { borderColor: `${color}60`, color: color } : {}}
                                    >
                                        <span className={styles.folderDot} style={{ background: color }} />
                                        {folder.name}
                                        <span className={styles.quickFolderCount}>({folderProfilesCount})</span>
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => setIsProfilesFloating(true)}
                                className={styles.quickFoldersFloatingLaunchBtn}
                                title="Abrir como Janela Flutuante"
                            >
                                <Maximize2 size={12} /> Flutuar Perfis
                            </button>
                        </div>
                    )}

                    {selectedCategory === 'trash' && !loading && (
                        <div className={styles.trashBanner}>
                            <div className="flex items-center gap-2 text-red-400/80">
                                <AlertTriangle size={15} />
                                <span className="text-xs font-semibold">Lixeira — {profiles.filter(p => p.category === 'trash').length} perfil(s)</span>
                            </div>
                            <div className="flex items-center gap-2 ml-auto">
                                <button className={styles.trashRestoreAllBtn} onClick={handleRestoreAllTrash}>
                                    <RotateCcw size={14} /> Restaurar Todos
                                </button>
                                <button className={styles.trashEmptyBtn} onClick={handleEmptyTrash}>
                                    <Trash2 size={14} /> Esvaziar Lixeira
                                </button>
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-10 h-10 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
                                <p className="text-slate-500 font-medium animate-pulse">Sincronizando perfis...</p>
                            </div>
                        </div>
                    ) : filteredProfiles.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6 shadow-inner border border-white/5">
                                {selectedCategory === 'trash' ? <Trash2 size={32} className="text-red-400/50" /> : <Shield size={32} className="text-theme-text-muted" />}
                            </div>
                            <h3 className="text-xl font-bold text-slate-200 mb-2">
                                {selectedCategory === 'trash' ? 'Lixeira vazia' : 'Nenhum perfil encontrado'}
                            </h3>
                            <p className="text-slate-500 max-w-sm mb-8">
                                {selectedCategory === 'trash'
                                    ? 'Nenhum perfil foi movido para a lixeira.'
                                    : searchQuery
                                        ? 'Tente outro termo de busca ou limpe o filtro.'
                                        : 'Você ainda não possui nenhum perfil criado neste workspace.'}
                            </p>
                            {!searchQuery && selectedCategory !== 'trash' && (
                                <button className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-theme-text font-medium rounded-xl transition-all border border-white/10" onClick={() => setShowCreateModal(true)}>
                                    <Plus size={18} /> Criar Primeiro Perfil
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className={styles.mondayTableContainer}>
                            <div className={styles.mondayHeaderRow} style={{ gridTemplateColumns: getGridTemplateColumns() }}>
                                <div className={styles.mondayHeaderCell}>
                                    <div className={`${styles.checkbox} ${selectedProfileIds.length > 0 && selectedProfileIds.length === filteredProfiles.length ? styles.checkboxChecked : ''}`} onClick={toggleSelectAll}>
                                        {selectedProfileIds.length > 0 && selectedProfileIds.length === filteredProfiles.length && <div className={styles.checkboxInner} />}
                                    </div>
                                </div>
                                {visibleColumns.favorite && <div className={styles.mondayHeaderCell}>★</div>}
                                <div className={styles.mondayHeaderCell}>
                                    Nome do Perfil
                                    <div className={styles.resizeHandle} onMouseDown={(e) => startResize(e, 'name')} />
                                </div>
                                {visibleColumns.status && (
                                    <div className={styles.mondayHeaderCell}>
                                        Status
                                        <div className={styles.resizeHandle} onMouseDown={(e) => startResize(e, 'status')} />
                                    </div>
                                )}
                                {visibleColumns.notes && (
                                    <div className={styles.mondayHeaderCell}>
                                        Notas
                                        <div className={styles.resizeHandle} onMouseDown={(e) => startResize(e, 'notes')} />
                                    </div>
                                )}
                                {visibleColumns.folder && (
                                    <div className={styles.mondayHeaderCell}>
                                        Grupo / Pasta
                                        <div className={styles.resizeHandle} onMouseDown={(e) => startResize(e, 'folder')} />
                                    </div>
                                )}
                                {visibleColumns.tags && (
                                    <div className={styles.mondayHeaderCell}>
                                        Tags
                                        <div className={styles.resizeHandle} onMouseDown={(e) => startResize(e, 'tags')} />
                                    </div>
                                )}
                                {visibleColumns.os && (
                                    <div className={styles.mondayHeaderCell}>
                                        SO
                                        <div className={styles.resizeHandle} onMouseDown={(e) => startResize(e, 'os')} />
                                    </div>
                                )}
                                {visibleColumns.proxy && (
                                    <div className={styles.mondayHeaderCell}>
                                        Proxy
                                        <div className={styles.resizeHandle} onMouseDown={(e) => startResize(e, 'proxy')} />
                                    </div>
                                )}
                                {visibleColumns.actions && <div className={styles.mondayHeaderCell}>Ações</div>}
                            </div>
                            
                            {sortedFilteredProfiles.map((profile: Profile) => {
                                const statusCfg = statusMap[profile.status ?? 'ready'] ?? statusMap.ready;
                                const isSelected = selectedProfileIds.includes(profile.id);
                                const isStarting = profile.status === 'running' && !profile.is_active;

                                return (
                                    <div 
                                        key={profile.id} 
                                        className={`${styles.mondayRow} ${isSelected ? styles.mondayRowActive : ''}`}
                                        style={{ gridTemplateColumns: getGridTemplateColumns() }}
                                        draggable
                                        onDragStart={(e: React.DragEvent) => handleDragStart(e, profile.id)}
                                        onDragOver={handleDragOver}
                                        onDrop={(e: React.DragEvent) => {
                                            e.preventDefault();
                                            const draggedId = e.dataTransfer.getData('profileId');
                                            if (draggedId) handleDropReorderProfile(draggedId, profile.id);
                                        }}
                                        onContextMenu={(e: React.MouseEvent) => handleProfileContextMenu(e, profile.id)}
                                        onClick={() => handleCardClick(profile)}>
                                        
                                        {/* Checkbox & Reorder Grip */}
                                        <div className={`${styles.mondayCell} ${styles.mondayCellCheckbox}`} style={{ gap: '4px', paddingLeft: '4px' }}>
                                            <div className="text-zinc-600 hover:text-zinc-300 cursor-grab active:cursor-grabbing p-0.5 shrink-0" title="Arrastar para reordenar perfil">
                                                <GripVertical size={13} />
                                            </div>
                                            <div className={`${styles.checkbox} ${isSelected ? styles.checkboxChecked : ''}`} onClick={(e) => { e.stopPropagation(); toggleSelection(profile.id); }}>
                                                {isSelected && <div className={styles.checkboxInner} />}
                                            </div>
                                        </div>

                                        {/* Favorite */}
                                        {visibleColumns.favorite && (
                                            <div className={`${styles.mondayCell} ${styles.mondayCellCheckbox}`}>
                                                <button className={`${styles.favoriteBtn} ${favorites[profile.id] ? styles.favoriteBtnActive : ''}`} onClick={(e) => { e.stopPropagation(); toggleFavorite(profile.id); }}>
                                                    <Star size={14} fill={favorites[profile.id] ? '#f59e0b' : 'none'} />
                                                </button>
                                            </div>
                                        )}

                                        {/* Name & Avatar + Standardized Icon-Only Action Buttons (Play, Gear/Settings, Notes) */}
                                        <div className={styles.mondayCell} style={{ gap: '8px', alignItems: 'center', overflow: 'hidden' }}>
                                            {renderProfileAvatar(profile)}

                                            <span 
                                                className={`${styles.mondayProfileName} flex-1 min-w-0 font-medium text-slate-100 whitespace-nowrap overflow-hidden text-ellipsis`} 
                                                onClick={(e) => { e.stopPropagation(); setDetailProfile(profile); }}
                                                title={profile.name}
                                            >
                                                {profile.name}
                                            </span>

                                            {profile.is_active && <span className="flex w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] shrink-0" title="Online" />}

                                            {/* Standardized Icon-Only Action Buttons */}
                                            <div className="flex items-center gap-1 shrink-0 ml-auto">
                                                {/* 1. Play / Parar Button */}
                                                <button
                                                    disabled={isStarting}
                                                    className={`p-1.5 rounded-lg flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                                                        isStarting
                                                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                                            : profile.is_active
                                                            ? 'bg-red-500 hover:bg-red-600 text-white shadow-md active:scale-95'
                                                            : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-md active:scale-95'
                                                    }`}
                                                    title={isStarting ? 'Iniciando...' : profile.is_active ? 'Parar Navegador' : 'Iniciar Navegador'}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        profile.is_active ? handleCloseProfile(profile.id) : handleLaunchProfile(profile.id);
                                                    }}
                                                >
                                                    {isStarting ? <RefreshCw size={15} className="animate-spin" /> : profile.is_active ? <StopCircle size={15} /> : <Play size={15} fill="currentColor" />}
                                                </button>

                                                {/* 2. Configurações (Engrenagem / Gear Icon) */}
                                                <button
                                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-colors cursor-pointer shrink-0"
                                                    title="Abrir Configurações do Perfil"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDetailProfile(profile);
                                                    }}
                                                >
                                                    <Settings size={15} />
                                                </button>

                                                {/* 3. Notas (FileText / Notes Icon) */}
                                                <button
                                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-colors cursor-pointer shrink-0"
                                                    title="Abrir Notas do Perfil"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setNoteModalState({
                                                            isOpen: true,
                                                            profileId: profile.id,
                                                            profileName: profile.name,
                                                            content: cleanNotesText(profile.notes),
                                                        });
                                                    }}
                                                >
                                                    <FileText size={15} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Status */}
                                        {visibleColumns.status && (
                                            <div className={styles.mondayCell} style={{ padding: '6px 8px' }}>
                                                <div 
                                                    className={styles.statusCell}
                                                    style={{ background: statusCfg.dot, color: '#fff', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', borderRadius: '4px', textShadow: '0 1px 2px rgba(0,0,0,0.25)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', height: '28px', width: '100%' }}
                                                    onClick={(e) => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); setStatusPicker({ profileId: profile.id, x: r.left, y: r.bottom + 6 }); }}>
                                                    <span className={styles.statusLabel}>{statusCfg.label}</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Notes */}
                                        {visibleColumns.notes && (
                                            <div 
                                                className={styles.mondayCell} 
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    setNoteModalState({
                                                        isOpen: true,
                                                        profileId: profile.id,
                                                        profileName: profile.name,
                                                        content: cleanNotesText(profile.notes),
                                                    });
                                                }}
                                            >
                                                {profile.notes ? (
                                                    <div className={styles.notesPreviewContainer} style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between', gap: '8px' }}>
                                                        <span className={styles.notesPreview} style={{ flex: 1 }} title={renderNotesPreview(profile.notes)}>{renderNotesPreview(profile.notes)}</span>
                                                        <button 
                                                            className={styles.notesExpandBtn} 
                                                            onClick={(e) => { 
                                                                e.stopPropagation(); 
                                                                setNoteModalState({
                                                                    isOpen: true,
                                                                    profileId: profile.id,
                                                                    profileName: profile.name,
                                                                    content: cleanNotesText(profile.notes),
                                                                });
                                                            }}
                                                            title="Abrir editor de notas"
                                                        >
                                                            <Maximize2 size={11} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className={styles.notesEmpty}>+ Adicionar nota</span>
                                                )}
                                            </div>
                                        )}

                                        {/* Folder / Category */}
                                        {visibleColumns.folder && (
                                            <div className={styles.mondayCell}>
                                                <div className={styles.folderPickerCell} onClick={(e) => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); setFolderCellPicker({ profileId: profile.id, x: r.left, y: r.bottom + 4 }); }}>
                                                    {getFolderName(profile.folder_id) ? (
                                                        <span className={styles.folderBadge}><FolderIcon size={10} /> {getFolderName(profile.folder_id)}</span>
                                                    ) : getCategoryName(profile.category) ? (
                                                        <span className={styles.categoryBadge}>{getCategoryName(profile.category)}</span>
                                                    ) : (
                                                        <span className={styles.notesEmpty}>Sem pasta</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Tags */}
                                        {visibleColumns.tags && (
                                            <div className={styles.mondayCell} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '6px', padding: '8px 12px' }}>
                                                {/* Tags */}
                                                <div className={styles.tagListContainer} onClick={(e) => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); setTagPicker({ profileId: profile.id, x: r.left, y: r.bottom + 4 }); }} title="Adicionar / Remover tags">
                                                    {profile.tags ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {profile.tags.split(',').map(tag => {
                                                                const t = tag.trim();
                                                                if(!t) return null;
                                                                const isSocial = SOCIAL_TAG_COLORS[t.toLowerCase()];
                                                                return (
                                                                    <span key={t} className={styles.tagChip} style={isSocial ? { color: isSocial.color, background: isSocial.bgActive, borderColor: isSocial.borderActive, display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' } : { display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setSelectedTag(t); setSelectedCategory('all'); setSelectedFolder(null); }}>
                                                                        {t}
                                                                    </span>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <span className={styles.notesEmpty}>+ Adicionar tag</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* OS */}
                                        {visibleColumns.os && (
                                            <div className={styles.mondayCell} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '6px', padding: '8px 12px' }}>
                                                {/* OS and Browser */}
                                                <div className="flex flex-wrap gap-1">
                                                    {getOsLabel(profile.fingerprint?.platform) && (
                                                        <span className={styles.osBadge} onClick={(e) => { e.stopPropagation(); setDefaultDetailTab('fingerprint'); setDetailProfile(profile); }} title="Especificações da Fingerprint (S.O.)">
                                                            <Monitor size={10} /> {getOsLabel(profile.fingerprint?.platform)}
                                                        </span>
                                                    )}
                                                    <span className={styles.browserBadge} onClick={(e) => { e.stopPropagation(); setDefaultDetailTab('fingerprint'); setDetailProfile(profile); }} title="Especificações da Fingerprint (Navegador)">
                                                        <Globe size={10} /> Chrome {profile.fingerprint?.user_agent?.match(/Chrome\/(\d+)/)?.[1] || ''}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Proxy */}
                                        {visibleColumns.proxy && (
                                            <div className={styles.mondayCell}>
                                                {profile.proxy ? (
                                                    <span className={styles.proxyBadge} title={`${profile.proxy.type}://${profile.proxy.host}:${profile.proxy.port}`}>
                                                        <Globe size={9} /> {profile.proxy.host}:{profile.proxy.port}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-600 text-[10px]">Sem Proxy</span>
                                                )}
                                            </div>
                                        )}

                                        {/* Actions */}
                                        {visibleColumns.actions && (
                                            <div className={`${styles.mondayCell} ${styles.mondayCellActions}`} style={{ gap: '8px', justifyContent: 'flex-end' }}>
                                                {(() => {
                                                    const isStarting = profile.status === 'running' && !profile.is_active;
                                                    return (
                                                        <button
                                                            disabled={isStarting}
                                                            className={`${styles.actionBtn} ${
                                                                isStarting
                                                                ? styles.actionBtnStarting
                                                                : profile.is_active
                                                                ? styles.actionBtnStop
                                                                : styles.actionBtnPlay
                                                            }`}
                                                            title={isStarting ? 'Iniciando...' : profile.is_active ? 'Parar' : 'Iniciar'}
                                                            onClick={(e) => { e.stopPropagation(); profile.is_active ? handleCloseProfile(profile.id) : handleLaunchProfile(profile.id); }}>
                                                            {isStarting ? <RefreshCw size={14} className="animate-spin" /> : profile.is_active ? <StopCircle size={14} /> : <Play size={14} />}
                                                        </button>
                                                    );
                                                })()}
                                                
                                                <button
                                                    className={styles.actionBtn}
                                                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); setOpenMenu(openMenu === profile.id ? null : profile.id); }}>
                                                    <MoreVertical size={16} />
                                                </button>

                                                {openMenu === profile.id && (
                                                    <div className={styles.dropdown} onClick={(e: React.MouseEvent) => e.stopPropagation()} style={{ right: '0', top: '100%' }}>
                                                        <button onClick={() => { setDetailProfile(profile); setOpenMenu(null); }}>
                                                            <Edit size={16} /> Editar Perfil
                                                        </button>
                                                        <div className="h-px bg-white/10 my-1"></div>
                                                        <button className={styles.dangerItem} onClick={() => { handleDeleteProfile(profile.id); setOpenMenu(null); }}>
                                                            <Trash2 size={16} /> Excluir
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <FloatingBulkActions
                        selectedCount={selectedProfileIds.length}
                        onClearSelection={() => { setSelectedProfileIds([]); setShowBulkFolderPicker(false); }}
                        onStart={handleBulkStart}
                        onStop={handleBulkStop}
                        onClone={handleBulkClone}
                        onFingerprint={handleBulkFingerprint}
                        onMoveToFolder={(e) => {
                            e.stopPropagation();
                            setShowBulkFolderPicker(v => !v);
                        }}
                        onExport={handleBulkExport}
                        onDelete={handleBulkDelete}
                    />

                    {showBulkFolderPicker && selectedProfileIds.length > 0 && (
                        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#18181b] border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.5)] rounded-2xl p-2 w-72 animate-in slide-in-from-bottom-2 fade-in duration-200">
                            <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 mb-1">
                                <p className="text-xs font-bold text-theme-text-muted uppercase tracking-wider">Mover para pasta</p>
                                <button onClick={() => setShowBulkFolderPicker(false)} className="text-slate-500 hover:text-theme-text"><X size={14} /></button>
                            </div>
                            <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                {folders.map(f => (
                                    <button
                                        key={f.id}
                                        className="w-full text-left px-3 py-2.5 hover:bg-white/5 rounded-xl flex items-center gap-3 text-sm text-slate-300 hover:text-theme-text transition-colors"
                                        onClick={() => handleBulkMoveToFolder(f.id)}>
                                        <FolderIcon size={16} style={{ color: getFolderColor(f.id) || '#a78bfa' }} /> {f.name}
                                    </button>
                                ))}
                                {folders.length > 0 && <div className="h-px bg-white/5 my-1 mx-2" />}
                                <button
                                    className="w-full text-left px-3 py-2.5 hover:bg-white/5 rounded-xl flex items-center gap-3 text-sm text-slate-300 hover:text-theme-text transition-colors"
                                    onClick={() => handleBulkMoveToFolder(null)}>
                                    <Square size={16} className="text-slate-500" /> Nenhuma Pasta
                                </button>
                            </div>
                        </div>
                    )}
                    {bulkProgress && (
                        <div className={styles.bulkProgressToast}>
                            <div className="w-4 h-4 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin" />
                            {bulkProgress}
                        </div>
                    )}
                </main>

                {profileContextMenu && (
                    <div className={styles.contextMenu} style={{ top: profileContextMenu.y, left: profileContextMenu.x }}>
                        <div 
                            className={styles.menuItemWithSub}
                            onMouseEnter={() => setActiveSubmenu('folder')}
                            onMouseLeave={() => setActiveSubmenu(null)}>
                            <div className="flex items-center gap-2.5">
                                <FolderIcon size={14} /> Mover para Pasta
                            </div>
                            <ChevronRight size={12} />
                            {activeSubmenu === 'folder' && (
                                <div className={styles.submenu}>
                                    {folders.map(f => (
                                        <button key={f.id} onClick={() => { handleUpdateProfile(profileContextMenu.profileId, { folder_id: f.id }); setProfileContextMenu(null); }}>
                                            {f.name}
                                        </button>
                                    ))}
                                    <button onClick={() => handleRemoveFromFolder(profileContextMenu.profileId)}>Sem Pasta</button>
                                </div>
                            )}
                        </div>

                        <div 
                            className={styles.menuItemWithSub}
                            onMouseEnter={() => setActiveSubmenu('category')}
                            onMouseLeave={() => setActiveSubmenu(null)}>
                            <div className="flex items-center gap-2.5">
                                <Tag size={14} /> Alterar Categoria
                            </div>
                            <ChevronRight size={12} />
                            {activeSubmenu === 'category' && (
                                <div className={styles.submenu}>
                                    <button onClick={() => { handleUpdateProfile(profileContextMenu.profileId, { category: 'social' }); setProfileContextMenu(null); }}>Redes Sociais</button>
                                    <button onClick={() => { handleUpdateProfile(profileContextMenu.profileId, { category: 'ads' }); setProfileContextMenu(null); }}>Contas de Ads</button>
                                    <button onClick={() => { handleUpdateProfile(profileContextMenu.profileId, { category: 'crypto' }); setProfileContextMenu(null); }}>Cripto / Web3</button>
                                    <button onClick={() => { handleUpdateProfile(profileContextMenu.profileId, { category: 'all' }); setProfileContextMenu(null); }}>Sem Categoria</button>
                                </div>
                            )}
                        </div>

                        <button
                            className={styles.menuItem}
                            onClick={async () => {
                                const id = profileContextMenu.profileId;
                                setProfileContextMenu(null);
                                setBulkProgress('Clonando perfil...');
                                try {
                                    const result = await window.api.profiles.clone(id);
                                    if (result.success) {
                                        await loadProfiles();
                                    } else {
                                        toast.error('Erro ao clonar', result.error as string);
                                    }
                                } finally {
                                    setBulkProgress(null);
                                }
                            }}
                        >
                            <Copy size={14} /> Clonar Perfil
                        </button>

                        <button
                            className={styles.menuItem}
                            onClick={async () => {
                                const p = profiles.find(pr => pr.id === profileContextMenu!.profileId);
                                if (!p) return;
                                const name = prompt('Nome do template:', p.name);
                                if (!name) return;
                                const res = await window.api.templates.save(p.id, name);
                                if (res.success) toast.success('Template salvo');
                                else toast.error('Erro ao salvar template');
                                setProfileContextMenu(null);
                            }}
                        >
                            <Layers size={14} className="text-violet-400" /> Salvar como Template
                        </button>

                        {cdpUrls[profileContextMenu.profileId] && (
                            <button
                                className={styles.menuItem}
                                onClick={() => {
                                    const p = profiles.find(pr => pr.id === profileContextMenu.profileId);
                                    const url = cdpUrls[profileContextMenu.profileId];
                                    if (p && url) setAutomationModal({ profileId: p.id, profileName: p.name, cdpUrl: url });
                                    setProfileContextMenu(null);
                                }}
                            >
                                <Zap size={14} className="text-emerald-400" /> API / Playwright
                            </button>
                        )}

                        <button
                            className={styles.menuItem}
                            onClick={() => {
                                const p = profiles.find(pr => pr.id === profileContextMenu.profileId);
                                if (p) setDetailProfile(p);
                                setProfileContextMenu(null);
                            }}
                        >
                            <Database size={14} /> Dados do Navegador
                        </button>

                        <div className="h-px bg-white/5 my-1 mx-2"></div>

                        {profiles.find(p => p.id === profileContextMenu.profileId)?.category === 'trash' && (
                            <button className={styles.restoreOption} onClick={() => handleRestoreProfile(profileContextMenu.profileId)}>
                                <Clock size={14} /> Restaurar Perfil
                            </button>
                        )}

                        <button className={styles.deleteOption} onClick={() => handleDeleteProfile(profileContextMenu.profileId)}>
                            <Trash2 size={14} /> {profiles.find((p: Profile) => p.id === profileContextMenu.profileId)?.category === 'trash' ? 'Excluir Permanentemente' : 'Mover para Lixeira'}
                        </button>
                    </div>
                )}

                {folderContextMenu && (
                    <div className={styles.contextMenu} style={{ top: folderContextMenu.y, left: folderContextMenu.x }}>
                        <button onClick={() => startRenameFolder(folderContextMenu.folderId, folders.find((f: Folder) => f.id === folderContextMenu.folderId)?.name || '')}>
                            <Edit size={14} /> Renomear Pasta
                        </button>
                        <button
                            className={styles.menuItem}
                            onClick={(e) => openFolderPicker(folderContextMenu.folderId, e)}>
                            <Palette size={14} className="text-violet-400" /> Personalizar
                        </button>
                        <button className={styles.dangerItem} onClick={() => handleDeleteFolder(folderContextMenu.folderId)}>
                            <Trash2 size={14} /> Excluir Pasta
                        </button>
                    </div>
                )}

                {sidebarMode === 'closed' && (
                    <button 
                        className={styles.floatingTrigger}
                        onClick={() => { if (!isDragging) setSidebarMode('full'); }}
                        onMouseDown={handleMouseDown}
                        style={{ left: floatingPos.x, top: floatingPos.y }}>
                        <LayoutGrid size={18} />
                        <span>Categorias</span>
                    </button>
                )}
            </div>

            {showCreateModal && (
                <CreateProfileModal onClose={() => setShowCreateModal(false)} onCreate={handleCreateProfile} />
            )}

            {detailProfile && (
                <ProfileDetailModal
                    profile={detailProfile}
                    tagTemplates={tagTemplates}
                    defaultTab={defaultDetailTab}
                    onClose={() => setDetailProfile(null)}
                    onSave={() => { loadProfiles(); setDetailProfile(null); }}
                    onDelete={(id) => { handleDeleteProfile(id); setDetailProfile(null); }}
                />
            )}

            {showPropertiesModal && (
                <PropertiesModal
                    profile={null}
                    visibleProps={visibleProps}
                    tagTemplates={tagTemplates}
                    onClose={() => { setShowPropertiesModal(false); }}
                    onUpdateVisibleProps={setVisibleProps}
                    onUpdateProfile={handleUpdateProfile}
                    onSaveTagTemplates={saveTagTemplates}
                    onDeleteProfile={handleDeleteProfile}
                />
            )}

            {automationModal && (
                <AutomationModal
                    profileName={automationModal.profileName}
                    profileId={automationModal.profileId}
                    cdpUrl={automationModal.cdpUrl}
                    onClose={() => setAutomationModal(null)}
                />
            )}

            {showTemplatesModal && (
                <TemplatesModal
                    onClose={() => setShowTemplatesModal(false)}
                    onProfilesCreated={loadProfiles}
                />
            )}

            {/* Status Picker Popup */}
            {statusPicker && (
                <StatusPickerPopup
                    profileId={statusPicker.profileId}
                    currentStatus={profiles.find(p => p.id === statusPicker.profileId)?.status ?? 'ready'}
                    position={{ x: statusPicker.x, y: statusPicker.y }}
                    onSelect={(id, status) => handleUpdateProfile(id, { status })}
                    onClose={() => setStatusPicker(null)}
                    onStatusMapUpdated={() => setStatusMap(getStatusMap())}
                />
            )}

            {/* Avatar Picker Popup */}
            {avatarPicker && (
                <AvatarPickerPopup
                    profileId={avatarPicker.profileId}
                    currentIcon={profiles.find(p => p.id === avatarPicker.profileId)?.avatar_icon ?? null}
                    currentColor={profiles.find(p => p.id === avatarPicker.profileId)?.avatar_color ?? null}
                    position={{ x: avatarPicker.x, y: avatarPicker.y }}
                    onSelect={(id, updates) => {
                        handleUpdateProfile(id, updates);
                        setAvatarPicker(null);
                    }}
                    onClose={() => setAvatarPicker(null)}
                />
            )}

            {/* Expanded Note Modal */}
            {viewingNote && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
                    onClick={() => setViewingNote(null)}
                >
                    <div 
                        className="bg-[#181824] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[80vh] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-4 border-b border-white/5">
                            <h3 className="text-md font-semibold text-slate-200">
                                Notas do Perfil: <span className="text-violet-400 font-semibold">{viewingNote.profileName}</span>
                            </h3>
                            <button 
                                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-all"
                                onClick={() => setViewingNote(null)}
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto text-slate-300 text-sm whitespace-pre-wrap leading-relaxed select-text max-h-[60vh]">
                            {renderNotesPreview(viewingNote.notes) || viewingNote.notes}
                        </div>
                    </div>
                </div>
            )}

            {/* Tag Picker Popup */}
            {tagPicker && (
                <TagPickerPopup
                    profileId={tagPicker.profileId}
                    currentTags={(profiles.find(p => p.id === tagPicker.profileId)?.tags || '').split(',').map(t => t.trim()).filter(Boolean)}
                    position={{ x: tagPicker.x, y: tagPicker.y }}
                    templates={tagTemplates}
                    onAdd={handleAddTag}
                    onRemove={handleRemoveTag}
                    onClose={() => setTagPicker(null)}
                />
            )}

            {/* Folder Customization Picker */}
            {folderPickerTarget && (
                <>
                    <div className={styles.folderPickerOverlay} onClick={() => setFolderPickerTarget(null)} />
                    <div
                        className={styles.folderPickerModal}
                        style={{
                            top: Math.min(folderPickerPos.y, window.innerHeight - 320),
                            left: Math.min(folderPickerPos.x, window.innerWidth - 260),
                        }}
                        onClick={(e) => e.stopPropagation()}>
                        <p className={styles.folderPickerTitle}>Personalizar Pasta</p>

                        <div className={styles.folderPickerSection}>
                            <p className={styles.folderPickerSectionLabel}>Cor</p>
                            <div className={styles.colorRow}>
                                {FOLDER_COLORS.map(c => (
                                    <div
                                        key={c}
                                        className={`${styles.colorDot} ${pickerDraft.color === c ? styles.colorDotActive : ''}`}
                                        style={{ background: c }}
                                        onClick={() => setPickerDraft(d => ({ ...d, color: c }))}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className={styles.folderPickerSection}>
                            <p className={styles.folderPickerSectionLabel}>Ícone</p>
                            <div className={styles.iconRow}>
                                {FOLDER_ICONS.map(({ name, Icon }) => (
                                    <div
                                        key={name}
                                        className={`${styles.iconOption} ${pickerDraft.iconName === name ? styles.iconOptionActive : ''}`}
                                        onClick={() => setPickerDraft(d => ({ ...d, iconName: name }))}
                                        title={name}>
                                        <Icon size={16} style={{ color: pickerDraft.iconName === name ? pickerDraft.color : undefined }} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button className={styles.pickerSaveBtn} onClick={saveFolderCustomization}>
                            Salvar
                        </button>
                    </div>
                </>
            )}

            {/* Detail Panel */}
            {expandedPanel && (
                <>
                    <div className={styles.detailPanelOverlay} onClick={() => { saveNotes(); setExpandedPanel(null); setIsDetailExpanded(false); }} />
                    <div className={`${styles.detailPanel} ${isDetailExpanded ? styles.detailPanelExpanded : ''}`}>
                        <div className={styles.detailPanelHeader}>
                            <button className={styles.detailPanelClose} onClick={() => { saveNotes(); setExpandedPanel(null); setIsDetailExpanded(false); }}>
                                <X size={16} />
                            </button>
                            <button className={styles.detailPanelClose} onClick={() => setIsDetailExpanded(!isDetailExpanded)} title={isDetailExpanded ? "Restaurar" : "Expandir"}>
                                {isDetailExpanded ? <PanelLeftClose size={16} /> : <Maximize2 size={16} />}
                            </button>
                            <span className={styles.detailPanelTitle}>
                                {profiles.find(p => p.id === expandedPanel.profileId)?.name}
                            </span>
                        </div>
                        <div className={styles.detailPanelTabs}>
                            <button className={`${styles.detailPanelTab} ${expandedPanel.tab === 'updates' ? styles.detailPanelTabActive : ''}`} onClick={() => setExpandedPanel({ ...expandedPanel, tab: 'updates' })}>
                                <Home size={13} style={{ marginRight: 6 }} /> Atualizações
                            </button>
                            <button className={`${styles.detailPanelTab} ${expandedPanel.tab === 'files' ? styles.detailPanelTabActive : ''}`} onClick={() => setExpandedPanel({ ...expandedPanel, tab: 'files' })}>
                                <FileText size={13} style={{ marginRight: 6 }} /> Arquivos
                            </button>
                            <button className={`${styles.detailPanelTab} ${expandedPanel.tab === 'log' ? styles.detailPanelTabActive : ''}`} onClick={() => setExpandedPanel({ ...expandedPanel, tab: 'log' })}>
                                <Clock size={13} style={{ marginRight: 6 }} /> Log de atividade
                            </button>
                        </div>
                        <div className={styles.detailPanelBody}>
                            {expandedPanel.tab === 'updates' && (
                                <>
                                    <div className={styles.notesEditor} style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                                        <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--bg-secondary)', marginBottom: '16px', display: 'flex', flexDirection: 'column' }}>
                                            <NoteTiptapEditor 
                                                content={editingNotes}
                                                onChange={setEditingNotes}
                                                placeholder="Escreva uma atualização (suporta Markdown e atalhos úteis)..."
                                            />
                                        </div>
                                        <div className={styles.notesSaveRow}>
                                            <div />
                                            <button 
                                                className={styles.notesSaveBtn} 
                                                onClick={saveNotes} 
                                                disabled={isSavingNotes}
                                                style={{ opacity: isSavingNotes ? 0.7 : 1, transition: 'all 0.2s' }}
                                            >
                                                {isSavingNotes ? 'Salvando...' : 'Atualizar / Salvar'}
                                            </button>
                                        </div>
                                    </div>
                                    {!editingNotes && (
                                        <div className={styles.emptyState}>
                                            <MessageSquare size={40} className="text-slate-700" />
                                            <p className={styles.emptyStateText}>Nenhuma atualização ainda</p>
                                            <p className={styles.emptyStateSub}>Compartilhe o progresso, adicione notas ou registre observações.</p>
                                        </div>
                                    )}
                                </>
                            )}
                            {expandedPanel.tab === 'files' && (
                                <div className={styles.emptyState}>
                                    <FileText size={40} className="text-slate-700" />
                                    <p className={styles.emptyStateText}>Nenhum arquivo ainda</p>
                                    <p className={styles.emptyStateSub}>Arquivos anexados aparecerão aqui.</p>
                                </div>
                            )}
                            {expandedPanel.tab === 'log' && (
                                <div className={styles.emptyState}>
                                    <Clock size={40} className="text-slate-700" />
                                    <p className={styles.emptyStateText}>Sem atividade registrada</p>
                                    <p className={styles.emptyStateSub}>O histórico de ações aparecerá aqui.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Folder Cell Picker */}
            {folderCellPicker && (
                <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 498 }} onClick={() => setFolderCellPicker(null)} />
                    <div className={styles.folderPickerDropdown} style={{ left: folderCellPicker.x, top: folderCellPicker.y }}>
                        {folders.map(f => {
                            const color = getFolderColor(f.id) || '#a78bfa';
                            return (
                                <div key={f.id} className={styles.folderPickerItemRow}>
                                    <button 
                                        className={styles.folderPickerSelectBtn}
                                        onClick={() => { handleUpdateProfile(folderCellPicker.profileId, { folder_id: f.id }); setFolderCellPicker(null); }}
                                    >
                                        <FolderIcon size={13} style={{ color: color }} />
                                        <span className={styles.folderPickerName}>{f.name}</span>
                                    </button>
                                    <button 
                                        className={styles.folderPickerDeleteBtn}
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            if (confirm(`Tem certeza que deseja excluir permanentemente a pasta "${f.name}"?`)) {
                                                const res = await window.api.profiles.deleteFolder(f.id);
                                                if (res.success) {
                                                    await loadProfiles();
                                                }
                                            }
                                        }}
                                        title="Excluir Pasta"
                                    >
                                        <Trash2 size={11} />
                                    </button>
                                </div>
                            );
                        })}
                        {folders.length > 0 && <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 8px' }} />}
                        <button className={styles.folderPickerSelectBtn} onClick={() => { handleUpdateProfile(folderCellPicker.profileId, { folder_id: null }); setFolderCellPicker(null); }}>
                            <Square size={13} /> <span className={styles.folderPickerName}>Sem Pasta</span>
                        </button>
                        
                        <div className={styles.folderPickerInputRow}>
                            <input
                                type="text"
                                placeholder="Nova pasta..."
                                value={newInlineFolderName}
                                onChange={(e) => setNewInlineFolderName(e.target.value)}
                                onKeyDown={async (e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (newInlineFolderName.trim()) {
                                            const res = await window.api.profiles.createFolder(newInlineFolderName.trim());
                                            if (res.success) {
                                                await loadProfiles();
                                                setNewInlineFolderName('');
                                            }
                                        }
                                    }
                                }}
                            />
                            <button
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    if (newInlineFolderName.trim()) {
                                        const res = await window.api.profiles.createFolder(newInlineFolderName.trim());
                                        if (res.success) {
                                            await loadProfiles();
                                            setNewInlineFolderName('');
                                        }
                                    }
                                }}
                                title="Criar Pasta"
                            >
                                <Plus size={12} />
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Folders Grid Window Modal */}
            {showFoldersGridWindow && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[1100] p-4 animate-fade-in" onClick={() => setShowFoldersGridWindow(false)}>
                    <div className="bg-theme-surface border border-theme-border rounded-2xl shadow-2xl w-[680px] max-w-full flex flex-col overflow-hidden relative" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-theme-border flex items-center justify-between">
                            <h3 className="text-base font-bold text-theme-text flex items-center gap-2">
                                <FolderIcon size={18} className="text-violet-400" />
                                Pastas e Grupos
                            </h3>
                            <button
                                className="text-theme-text-muted hover:text-theme-text transition-colors p-1 hover:bg-theme-surface rounded-lg"
                                onClick={() => setShowFoldersGridWindow(false)}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Folders Grid */}
                        <div className="flex-1 p-6 overflow-y-auto max-h-[420px] grid grid-cols-2 md:grid-cols-3 gap-4">
                            {/* All profiles card */}
                            <div 
                                onClick={() => { setSelectedFolder(null); setSelectedCategory('all'); setSelectedTag(null); setShowFoldersGridWindow(false); }}
                                className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between h-[100px] ${
                                    !selectedFolder 
                                    ? 'bg-violet-600/10 border-violet-500/50 hover:bg-violet-600/20' 
                                    : 'bg-theme-card border-theme-border hover:bg-theme-card-hover hover:border-theme-border-hover'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="w-8 h-8 rounded-lg bg-violet-600/20 flex items-center justify-center text-violet-400">
                                        <LayoutGrid size={16} />
                                    </div>
                                    <span className="text-[10px] bg-violet-500/20 text-violet-300 font-semibold px-2 py-0.5 rounded-full">
                                        Padrão
                                    </span>
                                </div>
                                <div>
                                    <div className="font-bold text-sm text-theme-text">Todos os Perfis</div>
                                    <div className="text-xs text-theme-text-muted mt-1">
                                        {profiles.filter(p => p.category !== 'trash').length} perfis
                                    </div>
                                </div>
                            </div>

                            {/* Dynamic folder cards */}
                            {folders.map(folder => {
                                const folderProfilesCount = profiles.filter(p => p.folder_id === folder.id && p.category !== 'trash').length;
                                const isSelected = selectedFolder === folder.id;
                                const color = getFolderColor(folder.id) || '#a78bfa';
                                const FolderIconComp = getFolderIcon(folder.id);
                                return (
                                    <div 
                                        key={folder.id}
                                        onClick={() => { setSelectedFolder(folder.id); setSelectedCategory('all'); setSelectedTag(null); setShowFoldersGridWindow(false); }}
                                        className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between h-[100px] relative group ${
                                            isSelected 
                                            ? 'bg-violet-600/10 border-violet-500/50 hover:bg-violet-600/20' 
                                            : 'bg-theme-card border-theme-border hover:bg-theme-card-hover hover:border-theme-border-hover'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15`, color: color }}>
                                                <FolderIconComp size={16} />
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        if (confirm(`Tem certeza que deseja excluir permanentemente a pasta "${folder.name}"?`)) {
                                                            const res = await window.api.profiles.deleteFolder(folder.id);
                                                            if (res.success) {
                                                                await loadProfiles();
                                                            }
                                                        }
                                                    }}
                                                    className="w-6 h-6 rounded bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Excluir Pasta"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${color}15`, color: color }}>
                                                    Pasta
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm text-theme-text truncate">{folder.name}</div>
                                            <div className="text-xs text-theme-text-muted mt-1">
                                                {folderProfilesCount} perfis
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer / Create Folder Quick Action */}
                        <div className="px-6 py-4 border-t border-theme-border bg-theme-surface/50 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2 flex-1">
                                <FolderIcon size={14} className="text-theme-text-muted" />
                                <input
                                    type="text"
                                    placeholder="Nova pasta rápida..."
                                    className="bg-transparent text-xs text-theme-text border-none outline-none focus:ring-0 flex-1 placeholder:text-theme-text-faint"
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && newFolderName.trim()) {
                                            submitNewFolder();
                                        }
                                    }}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => { setIsProfilesFloating(true); setShowFoldersGridWindow(false); }}
                                    className="px-3 py-1.5 bg-violet-600/10 hover:bg-violet-600 text-violet-400 hover:text-white font-semibold rounded-lg text-xs border border-violet-500/20 hover:border-violet-500 transition-colors flex items-center gap-1"
                                    title="Abrir como Janela Flutuante"
                                >
                                    <Maximize2 size={12} /> Flutuar Perfis
                                </button>
                                <button
                                    disabled={!newFolderName.trim()}
                                    onClick={submitNewFolder}
                                    className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:hover:bg-violet-600 text-white font-semibold rounded-lg text-xs transition-colors flex items-center gap-1"
                                >
                                    <Plus size={12} /> Criar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Note Editor Modal (Retangular 5px) */}
            {noteModalState && noteModalState.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in" onClick={() => setNoteModalState(null)}>
                    <div className="w-full max-w-lg bg-[#18181b] border border-white/10 rounded-[5px] shadow-2xl overflow-hidden font-sans text-zinc-200 animate-in zoom-in-95 p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-emerald-400" />
                                <h3 className="font-bold text-sm text-zinc-100">Notas do Perfil</h3>
                                <span className="text-xs text-zinc-400 font-mono">({noteModalState.profileName})</span>
                            </div>
                            <button onClick={() => setNoteModalState(null)} className="text-zinc-500 hover:text-zinc-200 p-1 rounded-[5px]">
                                <X size={16} />
                            </button>
                        </div>

                        <div>
                            <textarea
                                value={noteModalState.content}
                                onChange={(e) => setNoteModalState({ ...noteModalState, content: e.target.value })}
                                placeholder="Escreva suas anotações para este perfil aqui..."
                                rows={8}
                                className="w-full bg-white/5 border border-white/10 rounded-[5px] p-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/40 resize-none font-mono leading-relaxed"
                                autoFocus
                            />
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                            <span className="text-zinc-500 font-mono">{noteModalState.content.length} caracteres</span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setNoteModalState(null)}
                                    className="px-3.5 py-1.5 rounded-[5px] bg-white/5 hover:bg-white/10 text-zinc-300 font-semibold transition-colors cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => handleSaveNoteModal(noteModalState.profileId, noteModalState.content)}
                                    className="px-4 py-1.5 rounded-[5px] bg-emerald-500 hover:bg-emerald-400 text-black font-bold shadow transition-all active:scale-95 cursor-pointer"
                                >
                                    Salvar Nota
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
