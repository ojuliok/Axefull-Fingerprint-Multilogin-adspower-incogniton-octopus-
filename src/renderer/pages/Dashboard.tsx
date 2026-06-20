import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Grid, List, Shield, MoreVertical, Edit, Trash2, Globe, Tag, Star, Fingerprint, Folder as FolderIcon, Filter, LayoutGrid, ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen, Settings, Database, Copy, RefreshCw, Download, Square, Play, StopCircle, Upload, RotateCcw, AlertTriangle, Zap, Users, Activity, Monitor, Clock, Layers, Bookmark, Code, Package, Cpu, Palette, LucideIcon, CheckSquare, Eye, EyeOff, Columns, ArrowUpDown, X, Maximize2, Home, MessageSquare, FileText, Bold, Italic, Underline, Strikethrough, ListOrdered, Link2, Puzzle, Network } from 'lucide-react';
import CreateProfileModal from '../components/ProfileEditor/CreateProfileModal';
import PropertiesModal from '../components/ProfileEditor/PropertiesModal';
import ProfileDetailModal from '../components/ProfileDetail/ProfileDetailModal';
import AutomationModal from '../components/AutomationModal/AutomationModal';
import TemplatesModal from '../components/Templates/TemplatesModal';
import { useToast } from '../context/ToastContext';
import styles from './Dashboard.module.css';
import { ProfileAIScore } from '../components/AI/ProfileAIScore';
import { Profile, Folder } from '../types';

import {
    getOsLabel,
    STATUS_CONFIG,
    SOCIAL_TAG_COLORS,
    getTagIconElement,
    DEFAULT_TAG_TEMPLATES,
    FOLDER_ICONS,
    FOLDER_COLORS,
    TagTemplate,
    FolderCustomization
} from '../utils/constants';
import { StatusPickerPopup } from '../components/Dashboard/StatusPickerPopup';
import { TagPickerPopup } from '../components/Dashboard/TagPickerPopup';
import { MiniSidebarItem as MiniItem } from '../components/Dashboard/MiniSidebarItem';
import { FloatingBulkActions } from '../components/Dashboard/FloatingBulkActions';
import { ResourceMonitor } from '../components/Dashboard/ResourceMonitor';

interface DashboardProps {
    onOpenExtensions?: () => void;
    onOpenProxies?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onOpenExtensions, onOpenProxies }) => {
    const { toast } = useToast();
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
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
        try { return JSON.parse(localStorage.getItem('axe_visible_columns') || 'null') ?? { favorite: true, status: true, notes: true, folder: true, tags: true, proxy: true, actions: true }; }
        catch { return { favorite: true, status: true, notes: true, folder: true, tags: true, proxy: true, actions: true }; }
    });
    const [showColumnSelector, setShowColumnSelector] = useState(false);
    const [favorites, setFavorites] = useState<Record<string, boolean>>(() => {
        try { return JSON.parse(localStorage.getItem('axe_favorites') || '{}'); }
        catch { return {}; }
    });
    const [expandedPanel, setExpandedPanel] = useState<{ profileId: string; tab: string } | null>(null);
    const [editingNotes, setEditingNotes] = useState('');
    const [folderCellPicker, setFolderCellPicker] = useState<{ profileId: string; x: number; y: number } | null>(null);
    const [groupBy, setGroupBy] = useState<'none' | 'status' | 'folder'>('none');
    const [defaultDetailTab, setDefaultDetailTab] = useState<'general' | 'fingerprint' | 'proxy' | 'cookies' | 'history' | 'bookmarks' | 'clear'>('general');

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
            if (result.success) {
                setProfiles(result.data as Profile[]);
            }
            
            const foldersResult = await window.api.profiles.listFolders();
            if (foldersResult.success) {
                setFolders(foldersResult.data as Folder[]);
            }
        } catch (error) {
            console.error('Error loading profiles:', error);
        } finally {
            setLoading(false);
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
                    setProfiles((prev: Profile[]) => prev.filter((p: Profile) => p.id !== profileId));
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
                setProfiles((prev: Profile[]) => prev.map((p: Profile) => 
                    p.id === profileId ? { ...p, ...data } : p
                ));
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
                toast.error('Erro ao importar', result.error as string);
            }
        } catch (error) {
            toast.error('Erro ao importar', String(error));
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
        cols += ' minmax(200px, 2fr)'; // name always
        if (visibleColumns.status) cols += ' 120px';
        if (visibleColumns.notes) cols += ' minmax(80px, 1fr)';
        if (visibleColumns.folder) cols += ' 140px';
        if (visibleColumns.tags) cols += ' 160px';
        if (visibleColumns.proxy) cols += ' 1fr';
        if (visibleColumns.actions) cols += ' 90px';
        return cols;
    };

    const openDetailPanel = (profileId: string, tab: string = 'updates') => {
        const p = profiles.find(pr => pr.id === profileId);
        setEditingNotes(p?.notes || '');
        setExpandedPanel({ profileId, tab });
    };

    const saveNotes = async () => {
        if (!expandedPanel) return;
        await handleUpdateProfile(expandedPanel.profileId, { notes: editingNotes });
    };

    const COLUMN_CONFIG = [
        { key: 'favorite', label: 'Favorito', color: '#f59e0b' },
        { key: 'status', label: 'Status', color: '#38bdf8' },
        { key: 'notes', label: 'Notas', color: '#f87171' },
        { key: 'folder', label: 'Grupo / Pasta', color: '#a78bfa' },
        { key: 'tags', label: 'Tags / SO', color: '#34d399' },
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
        
        return matchesSearch && matchesCategory && matchesFolder && matchesTag;
    });

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
                                    className="p-1.5 bg-white/5 border border-white/5 rounded-lg text-slate-500 hover:text-white transition-colors"
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
                                        <Plus size={14} className="cursor-pointer hover:text-white" onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleCreateFolder(); }} />
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
                                                                border: '1px dashed rgba(255, 255, 255, 0.04)',
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
                                    <p className="text-xs text-slate-400 leading-relaxed">Você está usando o plano profissional com perfis ilimitados.</p>
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
                        <h1 className={styles.megaTitle}>
                            {selectedFolder ? getFolderName(selectedFolder) : selectedCategory === 'trash' ? 'Lixeira' : selectedCategory === 'all' ? 'Todos os Perfis' : getCategoryName(selectedCategory)}
                        </h1>

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
                                <button className={`${styles.megaBtn} ${styles.megaBtnPrimary}`} onClick={() => setShowCreateModal(true)} title="Novo Perfil">
                                    <Plus size={14} strokeWidth={2.5} /> <span className={styles.btnText}>Novo Perfil</span>
                                </button>
                                <button className={styles.megaBtn} onClick={handleImportProfiles} title="Importar perfis">
                                    <Upload size={14} /> <span className={styles.btnText}>Importar</span>
                                </button>
                                <button className={styles.megaBtn} onClick={() => setShowTemplatesModal(true)} title="Templates">
                                    <Layers size={14} /> <span className={styles.btnText}>Templates</span>
                                </button>
                                <button className={styles.megaBtn} onClick={onOpenExtensions} title="Extensões">
                                    <Puzzle size={14} /> <span className={styles.btnText}>Extensões</span>
                                </button>
                                <button className={styles.megaBtn} onClick={onOpenProxies} title="Proxy">
                                    <Network size={14} /> <span className={styles.btnText}>Proxy</span>
                                </button>

                                <div className={styles.megaDivider} />

                                {/* Tools */}
                                <button className={styles.megaBtn} title="Filtro">
                                    <Filter size={14} /> <span className={styles.btnText}>Filtro</span>
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
                                {selectedCategory === 'trash' ? <Trash2 size={32} className="text-red-400/50" /> : <Shield size={32} className="text-slate-400" />}
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
                                <button className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-all border border-white/10" onClick={() => setShowCreateModal(true)}>
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
                                <div className={styles.mondayHeaderCell}>Nome do Perfil</div>
                                {visibleColumns.status && <div className={styles.mondayHeaderCell}>Status</div>}
                                {visibleColumns.notes && <div className={styles.mondayHeaderCell}>Notas</div>}
                                {visibleColumns.folder && <div className={styles.mondayHeaderCell}>Grupo / Pasta</div>}
                                {visibleColumns.tags && <div className={styles.mondayHeaderCell}>Tags / SO</div>}
                                {visibleColumns.proxy && <div className={styles.mondayHeaderCell}>Proxy</div>}
                                {visibleColumns.actions && <div className={styles.mondayHeaderCell}>Ações</div>}
                            </div>
                            
                            {filteredProfiles.map((profile: Profile) => {
                                const statusCfg = STATUS_CONFIG[profile.status ?? 'ready'] ?? STATUS_CONFIG.ready;
                                const isSelected = selectedProfileIds.includes(profile.id);
                                return (
                                    <div 
                                        key={profile.id} 
                                        className={`${styles.mondayRow} ${isSelected ? styles.mondayRowActive : ''}`}
                                        style={{ gridTemplateColumns: getGridTemplateColumns() }}
                                        draggable
                                        onDragStart={(e: React.DragEvent) => handleDragStart(e, profile.id)}
                                        onContextMenu={(e: React.MouseEvent) => handleProfileContextMenu(e, profile.id)}
                                        onClick={() => handleCardClick(profile)}>
                                        
                                        {/* Checkbox */}
                                        <div className={`${styles.mondayCell} ${styles.mondayCellCheckbox}`}>
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

                                        {/* Name & Avatar */}
                                        <div className={styles.mondayCell} style={{ gap: '10px' }}>
                                            <div className={styles.mondayAvatar}>{profile.name.charAt(0).toUpperCase()}</div>
                                            <span className={styles.mondayProfileName} onClick={(e) => { e.stopPropagation(); setDetailProfile(profile); }}>{profile.name}</span>
                                            {profile.is_active && <span className="flex w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" title="Online" />}
                                            <button className={styles.expandBtn} onClick={(e) => { e.stopPropagation(); openDetailPanel(profile.id); }} title="Expandir">
                                                <Maximize2 size={12} />
                                            </button>
                                        </div>

                                        {/* Status */}
                                        {visibleColumns.status && (
                                            <div className={styles.mondayCell} style={{ padding: '6px 8px' }}>
                                                <div 
                                                    className={styles.statusCell}
                                                    onClick={(e) => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); setStatusPicker({ profileId: profile.id, x: r.left, y: r.bottom + 6 }); }}>
                                                    <span className={styles.statusDot} style={{ background: statusCfg.dot }} />
                                                    <span className={styles.statusLabel}>{statusCfg.label}</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Notes */}
                                        {visibleColumns.notes && (
                                            <div className={styles.mondayCell} onClick={(e) => { e.stopPropagation(); openDetailPanel(profile.id, 'updates'); }}>
                                                {profile.notes ? (
                                                    <span className={styles.notesPreview} title={profile.notes}>{profile.notes}</span>
                                                ) : (
                                                    <span className={styles.notesEmpty}>Adicionar nota...</span>
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

                                        {/* Tags & OS */}
                                        {visibleColumns.tags && (
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
                                                {/* Tags */}
                                                <div className={styles.tagListContainer} onClick={(e) => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); setTagPicker({ profileId: profile.id, x: r.left, y: r.bottom + 4 }); }} title="Adicionar / Remover tags">
                                                    {profile.tags ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {profile.tags.split(',').map(tag => {
                                                                const t = tag.trim();
                                                                if(!t) return null;
                                                                const isSocial = SOCIAL_TAG_COLORS[t.toLowerCase()];
                                                                return (
                                                                    <span key={t} className={styles.tagChip} style={isSocial ? { color: isSocial.color, background: isSocial.bgActive, borderColor: isSocial.borderActive, display: 'inline-flex', alignItems: 'center', gap: '4px' } : { display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
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
                                            <div className={styles.mondayCell} style={{ gap: '8px', justifyContent: 'flex-end', position: 'relative' }}>
                                                <button
                                                    className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all border ${
                                                        profile.is_active
                                                        ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/20'
                                                        : 'bg-white/5 hover:bg-violet-600 text-slate-200 border-white/10 hover:border-violet-500'
                                                    }`}
                                                    title={profile.is_active ? 'Parar' : 'Iniciar'}
                                                    onClick={(e) => { e.stopPropagation(); profile.is_active ? handleCloseProfile(profile.id) : handleLaunchProfile(profile.id); }}>
                                                    {profile.is_active ? <StopCircle size={14} /> : <Play size={14} />}
                                                </button>
                                                
                                                <button
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/10 transition-colors"
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
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mover para pasta</p>
                                <button onClick={() => setShowBulkFolderPicker(false)} className="text-slate-500 hover:text-white"><X size={14} /></button>
                            </div>
                            <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                {folders.map(f => (
                                    <button
                                        key={f.id}
                                        className="w-full text-left px-3 py-2.5 hover:bg-white/5 rounded-xl flex items-center gap-3 text-sm text-slate-300 hover:text-white transition-colors"
                                        onClick={() => handleBulkMoveToFolder(f.id)}>
                                        <FolderIcon size={16} style={{ color: getFolderColor(f.id) || '#a78bfa' }} /> {f.name}
                                    </button>
                                ))}
                                {folders.length > 0 && <div className="h-px bg-white/5 my-1 mx-2" />}
                                <button
                                    className="w-full text-left px-3 py-2.5 hover:bg-white/5 rounded-xl flex items-center gap-3 text-sm text-slate-300 hover:text-white transition-colors"
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
                />
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
                    <div className={styles.detailPanelOverlay} onClick={() => { saveNotes(); setExpandedPanel(null); }} />
                    <div className={styles.detailPanel}>
                        <div className={styles.detailPanelHeader}>
                            <button className={styles.detailPanelClose} onClick={() => { saveNotes(); setExpandedPanel(null); }}>
                                <X size={16} />
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
                                    <div className={styles.notesEditor}>
                                        <div className={styles.notesEditorToolbar}>
                                            <button className={styles.notesToolbarBtn} title="Negrito"><Bold size={14} /></button>
                                            <button className={styles.notesToolbarBtn} title="Itálico"><Italic size={14} /></button>
                                            <button className={styles.notesToolbarBtn} title="Sublinhado"><Underline size={14} /></button>
                                            <button className={styles.notesToolbarBtn} title="Tachado"><Strikethrough size={14} /></button>
                                            <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.06)', margin: '0 4px' }} />
                                            <button className={styles.notesToolbarBtn} title="Lista"><ListOrdered size={14} /></button>
                                            <button className={styles.notesToolbarBtn} title="Link"><Link2 size={14} /></button>
                                        </div>
                                        <textarea
                                            className={styles.notesTextarea}
                                            placeholder="Escreva uma atualização..."
                                            value={editingNotes}
                                            onChange={(e) => setEditingNotes(e.target.value)}
                                        />
                                        <div className={styles.notesSaveRow}>
                                            <div />
                                            <button className={styles.notesSaveBtn} onClick={saveNotes}>Atualizar</button>
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
                        {folders.map(f => (
                            <button key={f.id} onClick={() => { handleUpdateProfile(folderCellPicker.profileId, { folder_id: f.id }); setFolderCellPicker(null); }}>
                                <FolderIcon size={13} /> {f.name}
                            </button>
                        ))}
                        {folders.length > 0 && <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 8px' }} />}
                        <button onClick={() => { handleUpdateProfile(folderCellPicker.profileId, { folder_id: null }); setFolderCellPicker(null); }}>
                            <Square size={13} /> Sem Pasta
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default Dashboard;
