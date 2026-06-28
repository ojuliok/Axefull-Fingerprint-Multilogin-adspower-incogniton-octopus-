import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

const isMobileViewport = () => window.innerWidth <= 768;
import {
    Plus, MoreHorizontal, Trash2, Edit3,
    Copy, Download, Upload, ChevronRight, ChevronDown,
    Home, PenTool, FileText, Notebook, Search, Folder, FolderPlus, MessageSquare, Settings2, Box,
    PanelLeftClose, PanelLeftOpen, PanelLeft, MousePointerClick, Smile, Settings, X, ChevronsLeft, LayoutDashboard, KanbanSquare, Star, Compass, Lock, Eye, Maximize2,
    Menu, ChevronLeft
} from 'lucide-react';
import {
    CanvasInfo, CanvasData,
    getCanvasList, createCanvas, deleteCanvas, renameCanvas,
    softDeleteCanvas, restoreCanvas, updateCanvasInfo,
    duplicateCanvas, getCanvasData,
    exportBackupData, importBackupData, exportCanvas, importCanvas,
    createFolder, moveCanvasItem
} from '../features/Canvas/canvasStorage';
import InfiniteCanvas from '../features/Canvas/InfiniteCanvas';
import CanvasHome from '../features/Canvas/CanvasHome';
import CanvasRichText from '../features/Canvas/CanvasRichText';
import { DynamicIcon, CANVAS_ICONS, ICON_CATEGORIES, getDefaultIconForType } from '../features/Canvas/CanvasIcons';
import { CRMCanvasView } from './MarketingPage';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { ItemPinModal } from '../features/Canvas/ItemPinModal';
import { ItemPinUnlockModal } from '../features/Canvas/ItemPinUnlockModal';

import styles from './CanvasPage.module.css';

type ViewState = 'home' | 'canvas';

const DEFAULT_SIDEBAR_WIDTH = 240;
const MIN_SIDEBAR_WIDTH = 200;
const MAX_SIDEBAR_WIDTH = 480;


interface TabItem {
    id: string;
    name: string;
    type: string;
    icon?: string;
    navigationStack: { id: string; name: string }[];
}

const CanvasPage: React.FC = () => {
    const [canvasList, setCanvasList] = useState<CanvasInfo[]>([]);
    const uniqueTags = useMemo(() => {
        const tagsSet = new Set<string>();
        canvasList.forEach(c => {
            if (c.tags) {
                c.tags.forEach(t => tagsSet.add(t));
            }
        });
        return Array.from(tagsSet).sort();
    }, [canvasList]);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

    // Tabs States
    const [openTabs, setOpenTabs] = useState<TabItem[]>(() => {
        try {
            const saved = localStorage.getItem('axe_canvas_open_tabs');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });
    const [activeTabId, setActiveTabId] = useState<string | null>(() => {
        return localStorage.getItem('axe_canvas_active_tab_id') || null;
    });

    const [navigationStack, setNavigationStack] = useState<{id: string, name: string}[]>(() => {
        const savedTabId = localStorage.getItem('axe_canvas_active_tab_id');
        const savedTabs = localStorage.getItem('axe_canvas_open_tabs');
        if (savedTabId && savedTabs) {
            try {
                const tabs: TabItem[] = JSON.parse(savedTabs);
                const activeTab = tabs.find(t => t.id === savedTabId);
                if (activeTab) {
                    return activeTab.navigationStack || [{ id: activeTab.id, name: activeTab.name }];
                }
            } catch {}
        }
        return [];
    });

    const activeCanvasId = activeTabId;
    const activeCanvasInfo = activeCanvasId ? canvasList.find(c => c.id === activeCanvasId) : null;
    const activeCanvasType = activeCanvasInfo?.type || 'canvas';
    const [activeCanvasData, setActiveCanvasData] = useState<CanvasData | null>(null);
    const [previewItemId, setPreviewItemId] = useState<string | null>(null);
    const [previewCanvasData, setPreviewCanvasData] = useState<CanvasData | null>(null);
    const previewItemInfo = previewItemId ? canvasList.find(c => c.id === previewItemId) : null;
    const [isTrashView, setIsTrashView] = useState(false);
    const { currentWorkspace } = useWorkspace();
    const { user } = useAuth();
    
    // Sidebar Opening Mode States
    const [menuMode, setMenuMode] = useState<'expanded' | 'hover' | 'collapsed'>(() => {
        if (window.innerWidth <= 768) return 'collapsed';
        const saved = localStorage.getItem('axe_canvas_menu_mode');
        return (saved as any) || 'expanded';
    });
    const [isHovered, setIsHovered] = useState(false);
    const isSidebarExpanded = menuMode === 'expanded' || (menuMode === 'hover' && isHovered);

    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; canvasId: string } | null>(null);
    const [viewState, setViewState] = useState<ViewState>(() => {
        const savedTabId = localStorage.getItem('axe_canvas_active_tab_id');
        return savedTabId ? 'canvas' : 'home';
    });
    const [transitionState, setTransitionState] = useState<'none' | 'closing' | 'opening'>('none');
    const [navHistory, setNavHistory] = useState<string[]>([]);
    const [navHistoryIndex, setNavHistoryIndex] = useState<number>(-1);
    const isNavigatingHistory = useRef(false);

    const handleGoBackHistory = useCallback(() => {
        if (navHistoryIndex <= 0) return;
        const prevIndex = navHistoryIndex - 1;
        const prevTarget = navHistory[prevIndex];
        
        isNavigatingHistory.current = true;
        setNavHistoryIndex(prevIndex);
        
        if (prevTarget === 'home') {
            setActiveTabId(null);
            setNavigationStack([]);
            setActiveCanvasData(null);
            setViewState('home');
        } else {
            handleSelectCanvas(prevTarget, true);
        }
    }, [navHistory, navHistoryIndex, handleSelectCanvas]);

    const handleGoForwardHistory = useCallback(() => {
        if (navHistoryIndex >= navHistory.length - 1) return;
        const nextIndex = navHistoryIndex + 1;
        const nextTarget = navHistory[nextIndex];
        
        isNavigatingHistory.current = true;
        setNavHistoryIndex(nextIndex);
        
        if (nextTarget === 'home') {
            setActiveTabId(null);
            setNavigationStack([]);
            setActiveCanvasData(null);
            setViewState('home');
        } else {
            handleSelectCanvas(nextTarget, true);
        }
    }, [navHistory, navHistoryIndex, handleSelectCanvas]);

    const [sidebarEmojiPicker, setSidebarEmojiPicker] = useState<{ x: number; y: number; canvasId: string } | null>(null);
    const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
    const [sidebarCreateMenu, setSidebarCreateMenu] = useState<{ x: number; y: number; parentId?: string } | null>(null);
    const [showCreateModal, setShowCreateModal] = useState<{ type: 'canvas' | 'folder' | 'page' | 'table' | 'space'; parentId?: string } | null>(null);
    const [createModalName, setCreateModalName] = useState('');
    const [sidebarSearch, setSidebarSearch] = useState('');
    const [sidebarFilterTab, setSidebarFilterTab] = useState<'folders' | 'tags'>('folders');
    


    // New Advanced Features States
    const [sidebarWidth, setSidebarWidth] = useState(() => {
        const saved = localStorage.getItem('axe_canvas_sidebar_width');
        return saved ? parseInt(saved, 10) : DEFAULT_SIDEBAR_WIDTH;
    });
    const [isResizing, setIsResizing] = useState(false);
    
    const [sectionOrder, setSectionOrder] = useState<('favorites' | 'spaces')[]>(() => {
        const saved = localStorage.getItem('axe_canvas_section_order');
        return saved ? JSON.parse(saved) : ['favorites', 'spaces'];
    });
    const [draggedSection, setDraggedSection] = useState<'favorites' | 'spaces' | null>(null);

    const [activeFilter, setActiveFilter] = useState<'all' | 'page' | 'canvas' | 'table'>('all');

    // Security PIN States
    const [unlockedItems, setUnlockedItems] = useState<Set<string>>(new Set());
    const unlockedItemsRef = useRef<Set<string>>(new Set());
    const [pinSettingsItem, setPinSettingsItem] = useState<CanvasInfo | null>(null);
    const [pinUnlockItem, setPinUnlockItem] = useState<CanvasInfo | null>(null);
    const [onPinSuccess, setOnPinSuccess] = useState<((unlockedId: string) => void) | null>(null);

    const checkPinAndProceed = useCallback((id: string, onProceed: () => void) => {
        const item = canvasList.find(c => c.id === id);
        if (!item) {
            onProceed();
            return;
        }

        const getFirstLockedAncestor = (canvasId: string): CanvasInfo | null => {
            let current = canvasList.find(c => c.id === canvasId);
            while (current) {
                const pinVal = current.properties?.pin;
                if (pinVal && !unlockedItemsRef.current.has(current.id)) {
                    return current;
                }
                if (current.parentId) {
                    current = canvasList.find(c => c.id === current.parentId);
                } else {
                    break;
                }
            }
            return null;
        };

        const lockedAncestor = getFirstLockedAncestor(id);
        if (lockedAncestor) {
            setPinUnlockItem(lockedAncestor);
            setOnPinSuccess(() => (pinUnlockedId: string) => {
                unlockedItemsRef.current.add(pinUnlockedId);
                setUnlockedItems(new Set(unlockedItemsRef.current));

                const nextLocked = getFirstLockedAncestor(id);
                if (!nextLocked) {
                    onProceed();
                    setPinUnlockItem(null);
                    setOnPinSuccess(null);
                } else {
                    setPinUnlockItem(nextLocked);
                }
            });
        } else {
            onProceed();
        }
    }, [canvasList]);

    const renameInputRef = useRef<HTMLInputElement>(null);
    const fileImportInputRef = useRef<HTMLInputElement>(null);
    const sidebarRef = useRef<HTMLDivElement>(null);

    const reloadCanvasList = useCallback(async () => {
        if (!currentWorkspace) return;
        const list = await getCanvasList(currentWorkspace.id);
        setCanvasList(list);
    }, [currentWorkspace]);

    // Load canvas list on mount
    useEffect(() => {
        reloadCanvasList();
    }, [reloadCanvasList]);

    // Save menuMode preference
    useEffect(() => {
        localStorage.setItem('axe_canvas_menu_mode', menuMode);
    }, [menuMode]);

    // Track navigation history
    useEffect(() => {
        if (isNavigatingHistory.current) {
            isNavigatingHistory.current = false;
            return;
        }
        
        const currentTarget = viewState === 'home' ? 'home' : (activeTabId || 'home');
        
        setNavHistory(prev => {
            if (navHistoryIndex >= 0 && prev[navHistoryIndex] === currentTarget) {
                return prev;
            }
            const newHistory = prev.slice(0, navHistoryIndex + 1);
            newHistory.push(currentTarget);
            
            setTimeout(() => {
                setNavHistoryIndex(newHistory.length - 1);
            }, 0);
            return newHistory;
        });
    }, [activeTabId, viewState]);

    // Auto-expand parents when active canvas changes
    useEffect(() => {
        if (activeCanvasId && canvasList.length > 0) {
            setExpandedFolders(prev => {
                const next = new Set(prev);
                let currentId = activeCanvasId;
                let canvas = canvasList.find(c => c.id === currentId);
                let added = false;
                
                // Traverse up the parent chain
                while (canvas && canvas.parentId) {
                    if (!next.has(canvas.parentId)) {
                        next.add(canvas.parentId);
                        added = true;
                    }
                    currentId = canvas.parentId;
                    canvas = canvasList.find(c => c.id === currentId);
                }
                
                return added ? next : prev;
            });
        }
    }, [activeCanvasId, canvasList]);

    // Sync openTabs to localStorage
    useEffect(() => {
        localStorage.setItem('axe_canvas_open_tabs', JSON.stringify(openTabs));
    }, [openTabs]);

    // Sync activeTabId to localStorage
    useEffect(() => {
        if (activeTabId) {
            localStorage.setItem('axe_canvas_active_tab_id', activeTabId);
        } else {
            localStorage.removeItem('axe_canvas_active_tab_id');
        }
    }, [activeTabId]);

    // Reactively update tab details (name, icon, type) when canvasList changes
    useEffect(() => {
        if (canvasList.length > 0) {
            setOpenTabs(prev => {
                let changed = false;
                const next = prev.map(tab => {
                    const canvas = canvasList.find(c => c.id === tab.id);
                    if (canvas && (canvas.name !== tab.name || canvas.icon !== tab.icon || canvas.type !== tab.type)) {
                        changed = true;
                        return {
                            ...tab,
                            name: canvas.name,
                            icon: canvas.icon || tab.icon,
                            type: canvas.type
                        };
                    }
                    return tab;
                });
                return changed ? next : prev;
            });
        }
    }, [canvasList]);

    // Load active canvas data when activeCanvasId changes
    useEffect(() => {
        if (activeCanvasId) {
            const canvas = canvasList.find(c => c.id === activeCanvasId);
            if (canvas && (canvas.type === 'canvas' || !canvas.type)) {
                getCanvasData(activeCanvasId).then(data => {
                    setActiveCanvasData(data || { nodes: [], viewport: { x: 0, y: 0, zoom: 1 } });
                }).catch(err => {
                    console.error("Error loading active canvas data:", err);
                });
            }
        } else {
            setActiveCanvasData(null);
        }
    }, [activeCanvasId, canvasList]);

    // Load preview canvas data when previewItemId changes
    useEffect(() => {
        if (previewItemId) {
            const canvas = canvasList.find(c => c.id === previewItemId);
            if (canvas && (canvas.type === 'canvas' || !canvas.type)) {
                getCanvasData(previewItemId).then(data => {
                    setPreviewCanvasData(data || { nodes: [], viewport: { x: 0, y: 0, zoom: 1 } });
                }).catch(err => {
                    console.error("Error loading preview canvas data:", err);
                });
            }
        } else {
            setPreviewCanvasData(null);
        }
    }, [previewItemId, canvasList]);

    // Listen for toggle-canvas-sidebar event from MobileBottomNav
    useEffect(() => {
        const handleToggle = () => {
            setMenuMode(prev => prev === 'expanded' ? 'collapsed' : 'expanded');
        };
        window.addEventListener('toggle-canvas-sidebar', handleToggle);
        return () => window.removeEventListener('toggle-canvas-sidebar', handleToggle);
    }, []);

    // Focus rename input
    useEffect(() => {
        if (renamingId && renameInputRef.current) {
            renameInputRef.current.focus();
            renameInputRef.current.select();
        }
    }, [renamingId]);

    // Close context menu on click
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        if (contextMenu) {
            window.addEventListener('click', handleClick);
            return () => window.removeEventListener('click', handleClick);
        }
    }, [contextMenu]);

    // Close create menu on click
    useEffect(() => {
        const handleClick = () => setSidebarCreateMenu(null);
        if (sidebarCreateMenu) {
            window.addEventListener('click', handleClick);
            return () => window.removeEventListener('click', handleClick);
        }
    }, [sidebarCreateMenu]);

    // Close sidebar on outside click if it's in hover/collapsed mode
    useEffect(() => {
        if (!isSidebarExpanded || menuMode === 'expanded') return;
        const handleClick = (e: MouseEvent) => {
            if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
                setIsHovered(false);
            }
        };
        window.addEventListener('mousedown', handleClick);
        return () => window.removeEventListener('mousedown', handleClick);
    }, [isSidebarExpanded, menuMode]);

    // Resize logic
    useEffect(() => {
        if (!isResizing) return;
        const handleMouseMove = (e: MouseEvent) => {
            if (menuMode !== 'expanded') return;
            const newWidth = Math.min(Math.max(e.clientX, MIN_SIDEBAR_WIDTH), MAX_SIDEBAR_WIDTH);
            setSidebarWidth(newWidth);
        };
        const handleMouseUp = () => {
            setIsResizing(false);
            localStorage.setItem('axe_canvas_sidebar_width', sidebarWidth.toString());
        };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, menuMode, sidebarWidth]);

    // Save section order
    useEffect(() => {
        localStorage.setItem('axe_canvas_section_order', JSON.stringify(sectionOrder));
    }, [sectionOrder]);

    // ── Handlers ──

    const handleUpdateCanvasInfo = useCallback(async (id: string, updates: Partial<CanvasInfo>) => {
        await updateCanvasInfo(id, updates);
        reloadCanvasList();
        
        setActiveCanvasData(prev => {
            if (prev && activeCanvasId === id) {
                return { ...prev }; // trigger re-render if needed
            }
            return prev;
        });
    }, [activeCanvasId, reloadCanvasList]);

    const handleUpdateColor = useCallback((id: string, color?: string) => {
        handleUpdateCanvasInfo(id, { color });
        setContextMenu(null);
    }, [handleUpdateCanvasInfo]);

    const handleToggleFavorite = useCallback(async (id: string) => {
        const canvas = canvasList.find(c => c.id === id);
        if (canvas) {
            handleUpdateCanvasInfo(id, { isFavorite: !canvas.isFavorite });
        }
        setContextMenu(null);
    }, [canvasList, handleUpdateCanvasInfo, reloadCanvasList]);

    const handleConfirmCreateModal = useCallback(async () => {
        if (!showCreateModal) return;
        
        let defaultName = 'Novo Item';
        if (showCreateModal.type === 'canvas') defaultName = 'Canvas sem nome';
        if (showCreateModal.type === 'folder') defaultName = 'Nova Pasta';
        if (showCreateModal.type === 'page') defaultName = 'Página sem nome';
        if (showCreateModal.type === 'table') defaultName = 'Novo CRM/Pipeline';
        if (showCreateModal.type === 'space') defaultName = 'Novo Espaço';

        const name = createModalName.trim() || defaultName;
        const parentId = showCreateModal.parentId;
        
        if (showCreateModal.type === 'folder') {
            await createFolder(currentWorkspace?.id || '', user?.id || '', name, parentId);
            reloadCanvasList();
            if (parentId) {
                setExpandedFolders(prev => {
                    const next = new Set(prev);
                    next.add(parentId);
                    return next;
                });
            }
        } else {
            const info = await createCanvas(currentWorkspace?.id || '', user?.id || '', name, parentId, showCreateModal.type);
            reloadCanvasList();
            if (parentId) {
                setExpandedFolders(prev => {
                    const next = new Set(prev);
                    next.add(parentId);
                    return next;
                });
            }
            
            // Add to openTabs and make it active
            const newTab: TabItem = {
                id: info.id,
                name: info.name,
                type: info.type,
                icon: info.icon,
                navigationStack: [{ id: info.id, name: info.name }]
            };
            setOpenTabs(prev => {
                if (prev.some(t => t.id === info.id)) return prev;
                return [...prev, newTab];
            });
            setActiveTabId(info.id);
            setNavigationStack([{ id: info.id, name: info.name }]);
            setActiveCanvasData({ nodes: [], viewport: { x: 0, y: 0, zoom: 1 } });
            setViewState('canvas');
        }
        
        setShowCreateModal(null);
        setCreateModalName('');
    }, [showCreateModal, createModalName, reloadCanvasList, currentWorkspace, user]);

    const setModalNameToToday = useCallback(() => {
        const today = new Date().toLocaleDateString('pt-BR');
        setCreateModalName(today);
    }, []);

    const handleCreateCanvas = useCallback(() => {
        setShowCreateModal({ type: 'canvas' });
        setCreateModalName('');
    }, []);

    const handleSelectCanvas = useCallback(async (id: string, skipClosing = false) => {
        checkPinAndProceed(id, async () => {
            const canvas = canvasList.find(c => c.id === id);
            if (!canvas) return;

            // Check if already in openTabs
            setOpenTabs(prev => {
                const exists = prev.some(t => t.id === id);
                if (exists) return prev;
                
                const newTab: TabItem = {
                    id: canvas.id,
                    name: canvas.name,
                    type: canvas.type,
                    icon: canvas.icon,
                    navigationStack: [{ id: canvas.id, name: canvas.name }]
                };
                return [...prev, newTab];
            });

            // Set as active
            setActiveTabId(id);

            // Restore navigation stack
            setOpenTabs(currentTabs => {
                const existingTab = currentTabs.find(t => t.id === id);
                if (existingTab) {
                    setNavigationStack(existingTab.navigationStack || [{ id, name: canvas.name }]);
                } else {
                    setNavigationStack([{ id, name: canvas.name }]);
                }
                return currentTabs;
            });

            const isSpace = canvas.type === 'space';

            if (!isSpace) {
                setRenamingId(null);
                setViewState('canvas');
                setIsHovered(false);
                if (isMobileViewport()) {
                    setMenuMode('collapsed');
                }
                setTransitionState('none');
                return;
            }

            // For spaces, run transitions if we want
            if (skipClosing) {
                setRenamingId(null);
                setViewState('canvas');
                setIsHovered(false);
                if (isMobileViewport()) {
                    setMenuMode('collapsed');
                }
                setTransitionState('opening');
                setTimeout(() => {
                    setTransitionState('none');
                }, 400);
            } else {
                setTransitionState('closing');
                setTimeout(async () => {
                    setRenamingId(null);
                    setViewState('canvas');
                    setIsHovered(false);
                    if (isMobileViewport()) {
                        setMenuMode('collapsed');
                    }
                    setTransitionState('opening');
                    setTimeout(() => {
                        setTransitionState('none');
                    }, 400);
                }, 400);
            }
        });
    }, [canvasList, checkPinAndProceed]);

    const handleGoHome = useCallback(() => {
        // Do not touch openTabs, just de-activate the active tab and go home
        setActiveTabId(null);
        setNavigationStack([]);
        setActiveCanvasData(null);
        setViewState('home');
        setIsHovered(false);
        if (isMobileViewport()) {
            setMenuMode('collapsed');
        }
        setTransitionState('none');
    }, []);

    const handleCloseTab = useCallback((tabId: string, e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        
        setOpenTabs(prev => {
            const nextTabs = prev.filter(t => t.id !== tabId);
            
            // If the closed tab was the active one, we need to choose a new active tab
            if (activeTabId === tabId) {
                if (nextTabs.length > 0) {
                    // Try to activate the tab next to the closed one, or the last one
                    const closedIndex = prev.findIndex(t => t.id === tabId);
                    const newActiveIndex = Math.min(closedIndex, nextTabs.length - 1);
                    const nextActiveTab = nextTabs[newActiveIndex];
                    
                    setActiveTabId(nextActiveTab.id);
                    setNavigationStack(nextActiveTab.navigationStack);
                    setViewState('canvas');
                } else {
                    setActiveTabId(null);
                    setNavigationStack([]);
                    setViewState('home');
                }
            }
            
            return nextTabs;
        });
    }, [activeTabId]);

    const handleSectionDragStart = (e: React.DragEvent, section: 'favorites' | 'spaces') => {
        setDraggedSection(section);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleSectionDragOver = (e: React.DragEvent, targetSection: 'favorites' | 'spaces') => {
        e.preventDefault();
        if (!draggedSection || draggedSection === targetSection) return;

        setSectionOrder(prev => {
            const newOrder = [...prev];
            const draggedIdx = newOrder.indexOf(draggedSection);
            const targetIdx = newOrder.indexOf(targetSection);
            if (draggedIdx === -1 || targetIdx === -1) return prev;
            newOrder.splice(draggedIdx, 1);
            newOrder.splice(targetIdx, 0, draggedSection);
            return newOrder;
        });
    };

    const handleSectionDragEnd = () => {
        setDraggedSection(null);
    };



    const handleSoftDeleteCanvas = useCallback(async (id: string) => {
        await softDeleteCanvas(id);
        await reloadCanvasList();
        
        // Close tab if open
        handleCloseTab(id);
        
        setContextMenu(null);
    }, [reloadCanvasList, handleCloseTab]);

    const handlePermanentDeleteCanvas = useCallback(async (id: string) => {
        await deleteCanvas(id);
        reloadCanvasList();
        
        // Close tab if open
        handleCloseTab(id);
        
        setContextMenu(null);
    }, [reloadCanvasList, handleCloseTab]);


    const handleRestoreCanvas = useCallback(async (id: string) => {
        await restoreCanvas(id);
        reloadCanvasList();
        setContextMenu(null);
    }, []);

    const handleNodesDeleted = useCallback((canvasIds: string[]) => {
        canvasIds.forEach(id => softDeleteCanvas(id));
        reloadCanvasList();
    }, []);

    const handleStartRename = useCallback((id: string) => {
        const canvas = canvasList.find(c => c.id === id);
        if (canvas) {
            setRenamingId(id);
            setRenameValue(canvas.name);
        }
        setContextMenu(null);
    }, [canvasList, reloadCanvasList, currentWorkspace, user]);

    const handleConfirmRename = useCallback(async () => {
        if (renamingId && renameValue.trim()) {
            await renameCanvas(renamingId, renameValue.trim());
            reloadCanvasList();
        }
        setRenamingId(null);
    }, [renamingId, renameValue, reloadCanvasList]);

    const handleRenameKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleConfirmRename();
        if (e.key === 'Escape') setRenamingId(null);
    }, [handleConfirmRename]);

    const handleDuplicate = useCallback(async (id: string) => {
        const newInfo = await duplicateCanvas(id, currentWorkspace?.id || '', user?.id || '');
        if (newInfo) {
            reloadCanvasList();
            setNavigationStack([{ id: newInfo.id, name: newInfo.name }]);
            const data = await getCanvasData(newInfo.id);
            setActiveCanvasData(data || { nodes: [], viewport: { x: 0, y: 0, zoom: 1 } });
            setViewState('canvas');
        }
        setContextMenu(null);
    }, []);

    const handleContextMenu = useCallback((e: React.MouseEvent, canvasId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY, canvasId });
    }, []);

    const handleDataChange = useCallback((data: CanvasData) => {
        setActiveCanvasData(data);
    }, []);



    const handleCreateFolder = useCallback(async () => {
        const count = canvasList.filter(c => c.type === 'folder' && !c.parentId).length + 1;
        if (!currentWorkspace || !user) return;
        await createFolder(currentWorkspace.id, user.id, `Nova Pasta ${count}`);
        reloadCanvasList();
    }, [canvasList, reloadCanvasList, currentWorkspace, user]);

    // ── Drag & Drop States ──
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);
    const [dropPosition, setDropPosition] = useState<'before' | 'after' | 'inside' | null>(null);

    const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
        setDraggedId(id);
        e.dataTransfer.setData('text/plain', id);
        e.dataTransfer.effectAllowed = 'move';
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent, targetId: string, isFolder: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        if (draggedId === targetId) {
            setDragOverId(null);
            setDropPosition(null);
            return;
        }

        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const y = e.clientY - rect.top;
        const height = rect.height;

        let pos: 'before' | 'after' | 'inside' = 'after';
        
        if (isFolder) {
            if (y < height * 0.25) pos = 'before';
            else if (y > height * 0.75) pos = 'after';
            else pos = 'inside';
        } else {
            if (y < height / 2) pos = 'before';
            else pos = 'after';
        }

        setDragOverId(targetId);
        setDropPosition(pos);
    }, [draggedId]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOverId(null);
        setDropPosition(null);
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (draggedId && draggedId !== targetId && dropPosition) {
            await moveCanvasItem(draggedId, targetId, dropPosition, currentWorkspace?.id || '');
            reloadCanvasList();
            
            // Auto expand folder if dropped inside
            if (dropPosition === 'inside') {
                setExpandedFolders(prev => {
                    const next = new Set(prev);
                    next.add(targetId);
                    return next;
                });
            }
        }
        
        setDraggedId(null);
        setDragOverId(null);
        setDropPosition(null);
    }, [draggedId, dropPosition, reloadCanvasList, currentWorkspace]);

    const handleDragEnd = useCallback(() => {
        setDraggedId(null);
        setDragOverId(null);
        setDropPosition(null);
    }, []);

    const handleOpenSidebarEmojiPicker = useCallback((e: React.MouseEvent, canvasId: string) => {
        e.stopPropagation();
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        setSidebarEmojiPicker({ x: rect.left, y: rect.bottom + 6, canvasId });
    }, []);

    const selectSidebarEmoji = useCallback(async (emoji: string) => {
        if (sidebarEmojiPicker) {
            handleUpdateCanvasInfo(sidebarEmojiPicker.canvasId, { icon: emoji });
        }
        setSidebarEmojiPicker(null);
    }, [sidebarEmojiPicker, handleUpdateCanvasInfo]);

    // ── Export / Import ──

    const triggerVaultExport = () => {
        const backupStr = exportBackupData();
        const blob = new Blob([backupStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'axe_canvas_cofre_backup.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const triggerVaultImport = () => {
        fileImportInputRef.current?.click();
    };

    const handleVaultImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            try {
                const parsed = JSON.parse(content);
                if (parsed.type === 'axecanvas') {
                    const info = importCanvas(content);
                    if (info) {
                        reloadCanvasList();
                        handleSelectCanvas(info.id);
                        alert(`Canvas "${info.name}" importado com sucesso!`);
                    } else {
                        alert('Erro ao importar o canvas individual.');
                    }
                } else if (parsed.list && parsed.canvases) {
                    const success = importBackupData(content);
                    if (success) {
                        reloadCanvasList();
                        setViewState('home');
                        alert('Cofre (Backup geral) importado com sucesso!');
                    } else {
                        alert('Erro ao importar o cofre de backup.');
                    }
                } else {
                    alert('Arquivo inválido ou não reconhecido.');
                }
            } catch (err) {
                alert('Erro ao processar o arquivo JSON.');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const triggerCanvasExport = (id: string) => {
        const exp = exportCanvas(id);
        if (!exp) return;
        const blob = new Blob([exp.content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = exp.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setContextMenu(null);
    };

    // ── Helpers ──

    const formatDate = (timestamp: number) => {
        const d = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        if (diff < 60000) return 'agora';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}min`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)}d`;
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    };

    const handleOpenPage = useCallback(async (targetCanvasId: string, pageName: string) => {
        const nextStack = [...navigationStack, { id: targetCanvasId, name: pageName }];
        setNavigationStack(nextStack);
        
        // Update stack in the active tab
        if (activeTabId) {
            setOpenTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, navigationStack: nextStack } : t));
        }
        
        const data = await getCanvasData(targetCanvasId);
        setActiveCanvasData(data || { nodes: [], viewport: { x: 0, y: 0, zoom: 1 } });
    }, [navigationStack, activeTabId]);

    const handleBreadcrumbClick = useCallback(async (index: number) => {
        if (index === -1) {
            handleGoHome();
            return;
        }
        const nextStack = navigationStack.slice(0, index + 1);
        setNavigationStack(nextStack);
        
        // Update stack in the active tab
        if (activeTabId) {
            setOpenTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, navigationStack: nextStack } : t));
        }
        
        const targetCanvasId = nextStack[nextStack.length - 1].id;
        const data = await getCanvasData(targetCanvasId);
        setActiveCanvasData(data || { nodes: [], viewport: { x: 0, y: 0, zoom: 1 } });
    }, [handleGoHome, navigationStack, activeTabId]);

    const toggleFolder = useCallback((id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const isExpanding = !expandedFolders.has(id);
        if (isExpanding) {
            checkPinAndProceed(id, () => {
                setExpandedFolders(prev => {
                    const next = new Set(prev);
                    next.add(id);
                    return next;
                });
            });
        } else {
            setExpandedFolders(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    }, [expandedFolders, checkPinAndProceed]);

    const renderCanvasTree = useCallback((parentId: string | undefined = undefined, depth: number = 0) => {
        if (sidebarSearch.trim() !== '' && parentId !== undefined) {
            return null;
        }

        const items = canvasList.filter(c => {
            if (isTrashView ? !c.isDeleted : c.isDeleted) return false;
            
            if (sidebarSearch.trim() !== '') {
                return c.name.toLowerCase().includes(sidebarSearch.toLowerCase().trim());
            }

            if (activeFilter !== 'all') {
                // When filtering, ignore parentId (flatten the tree) and only show matching types
                if (activeFilter === 'canvas' && (!c.type || c.type === 'canvas')) return true;
                if (activeFilter === c.type) return true;
                return false;
            }

            // Normal tree view
            return (c.parentId || undefined) === (parentId || undefined);
        });

        if (items.length === 0) return null;

        return items.map(canvas => {
            const hasChildren = canvasList.some(c => c.parentId === canvas.id);
            const isFolderExpanded = expandedFolders.has(canvas.id);
            const isActive = activeCanvasId === canvas.id;
            const isFolder = canvas.type === 'folder';

            const isDragged = draggedId === canvas.id;
            const isDragOver = dragOverId === canvas.id;
            
            let dropIndicatorClass = '';
            if (isDragOver && dropPosition) {
                if (dropPosition === 'before') dropIndicatorClass = styles.dropBefore;
                else if (dropPosition === 'after') dropIndicatorClass = styles.dropAfter;
                else if (dropPosition === 'inside') dropIndicatorClass = styles.dropInside;
            }

            const itemColor = canvas.color ? canvas.color : 
                              canvas.type === 'canvas' ? '192, 132, 252' : // Roxo
                              canvas.type === 'page' ? '96, 165, 250' :   // Azul
                              canvas.type === 'table' ? '74, 222, 128' :  // Verde
                              canvas.type === 'space' ? '161, 161, 170' : // Cinza Neutro / Preto leve
                              '250, 204, 21';                             // Amarelo (Folders)

            return (
                <div 
                    key={canvas.id} 
                    className={`${styles.treeNode} ${isDragged ? styles.draggedNode : ''} ${depth === 0 ? styles.spaceNode : ''}`}
                    draggable={!isTrashView}
                    onDragStart={(e) => handleDragStart(e, canvas.id)}
                    onDragOver={(e) => handleDragOver(e, canvas.id, isFolder)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, canvas.id)}
                    onDragEnd={handleDragEnd}
                >
                    <div
                        className={`${styles.canvasItem} ${isActive ? styles.active : ''} ${isFolder && isFolderExpanded ? styles.expandedFolder : ''} ${dropIndicatorClass}`}
                        style={{ paddingLeft: `${depth * 12 + 8}px`, '--item-rgb': itemColor } as React.CSSProperties}
                        onClick={(e) => isFolder ? toggleFolder(canvas.id, e) : handleSelectCanvas(canvas.id)}
                        onContextMenu={(e) => handleContextMenu(e, canvas.id)}
                        title={canvas.name}
                    >
                        <div className={styles.chevronWrapper}>
                            {(hasChildren || isFolder) ? (
                                <div className={styles.folderToggle} onClick={(e) => toggleFolder(canvas.id, e)}>
                                    {isFolderExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </div>
                            ) : (
                                <div className={styles.folderTogglePlaceholder} />
                            )}
                        </div>

                        <span
                            className={styles.canvasItemIcon}
                            onClick={(e) => handleOpenSidebarEmojiPicker(e, canvas.id)}
                            title="Alterar ícone"
                        >
                            <DynamicIcon name={canvas.icon || getDefaultIconForType(canvas.type)} size={14} />
                        </span>

                        {isSidebarExpanded && (
                            renamingId === canvas.id ? (
                                <input
                                    ref={renameInputRef}
                                    type="text"
                                    className={styles.renameInput}
                                    value={renameValue}
                                    onChange={(e) => setRenameValue(e.target.value)}
                                    onBlur={handleConfirmRename}
                                    onKeyDown={handleRenameKeyDown}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            ) : (
                                <>
                                    <span className={styles.canvasItemName}>{canvas.name}</span>
                                    
                                    {!isFolder && hasChildren && (
                                        <span className={styles.canvasItemCount}>{canvasList.filter(c => c.parentId === canvas.id).length}</span>
                                    )}
                                    {isFolder && hasChildren && (
                                        <span className={styles.canvasItemCount}>{canvasList.filter(c => c.parentId === canvas.id).length}</span>
                                    )}
                                    
                                    {(isFolder || !isFolder) && (
                                        <button
                                            className={`${styles.addSubBtn} ${(canvas.type === 'space' && isActive) ? styles.alwaysShow : ''}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                setSidebarCreateMenu({ x: rect.right + 10, y: rect.top, parentId: canvas.id });
                                            }}
                                            title={canvas.type === 'space' ? "Adicionar ao Espaço" : isFolder ? "Adicionar página" : "Adicionar sub-página"}
                                        >
                                            <Plus size={14} />
                                        </button>
                                    )}
                                </>
                            )
                        )}
                    </div>

                    {((hasChildren && isFolderExpanded) || isFolderExpanded) && isSidebarExpanded && (
                        <div className={styles.treeChildren}>
                            {renderCanvasTree(canvas.id, depth + 1)}
                            <div 
                                className={styles.canvasItem} 
                                style={{ paddingLeft: `${(depth + 1) * 12 + 8}px`, opacity: 0.7, cursor: 'pointer' }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setSidebarCreateMenu({ x: rect.left + 20, y: rect.bottom, parentId: canvas.id });
                                }}
                            >
                                <div className={styles.chevronWrapper}>
                                    <div className={styles.folderTogglePlaceholder} />
                                </div>
                                <span className={styles.canvasItemIcon} style={{ background: 'transparent' }}>
                                    <Plus size={14} />
                                </span>
                                <span className={styles.canvasItemName} style={{ fontSize: '11px' }}>Novo Item</span>
                            </div>
                        </div>
                    )}
                </div>
            );
        });
    }, [canvasList, expandedFolders, activeCanvasId, renamingId, renameValue, isSidebarExpanded, isTrashView, handleSelectCanvas, handleContextMenu, handleConfirmRename, handleRenameKeyDown, toggleFolder, handleOpenSidebarEmojiPicker, draggedId, dragOverId, dropPosition, handleDragStart, handleDragOver, handleDragLeave, handleDrop, handleDragEnd, activeFilter, sidebarSearch]);

    return (
        <div className={styles.pageContainer}>

            {/* ── Mobile Overlay ── */}
            <div 
                className={`${styles.mobileOverlay} ${isSidebarExpanded ? styles.active : ''}`}
                onClick={() => setMenuMode('collapsed')}
            />

            {/* ── Minimalist Sidebar ── */}
            <div
                ref={sidebarRef}
                className={`${styles.sidebar} ${isSidebarExpanded ? styles.sidebarExpanded : ''} ${isResizing ? styles.isResizing : ''}`}
                style={isSidebarExpanded ? { width: sidebarWidth, minWidth: sidebarWidth } : { width: 0, minWidth: 0, border: 'none', padding: 0, overflow: 'hidden' }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {isSidebarExpanded && (
                    <div 
                        className={styles.resizeHandle} 
                        onMouseDown={() => setIsResizing(true)} 
                    />
                )}
                {/* Sidebar Header (ClickUp style) */}
                {/* Sidebar Header matching Reference mockup */}
                <div className={styles.sidebarHeader}>
                    {isSidebarExpanded ? (
                        <>
                            <span className={styles.sidebarHeaderTitle}>Base de Conhecimento</span>
                            <div className={styles.headerActions}>
                                <button 
                                    className={`${styles.headerBtn} ${isCreateMenuOpen ? styles.headerBtnActive : ''}`} 
                                    onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)}
                                    title="Criar novo item"
                                >
                                    <Plus size={14} />
                                </button>
                                <button 
                                    className={styles.headerBtn}
                                    onClick={() => setMenuMode('collapsed')}
                                    title="Recolher menu lateral"
                                >
                                    <ChevronLeft size={14} />
                                </button>
                            </div>
                        </>
                    ) : (
                        <button 
                            className={styles.headerBtn}
                            onClick={() => setMenuMode('expanded')}
                            title="Expandir menu lateral"
                            style={{ margin: '0 auto' }}
                        >
                            <Menu size={14} />
                        </button>
                    )}
                </div>

                {/* Create Dropdown */}
                {isCreateMenuOpen && isSidebarExpanded && (
                    <>
                        <div className={styles.createMenuOverlay} onClick={() => setIsCreateMenuOpen(false)} />
                        <div className={styles.createMenu}>
                            <button className={styles.createMenuItem} onClick={() => { setShowCreateModal({ type: 'folder' }); setIsCreateMenuOpen(false); }}>
                                <Folder size={14} /> Nova Pasta
                            </button>
                            <button className={styles.createMenuItem} onClick={() => { setShowCreateModal({ type: 'page' }); setIsCreateMenuOpen(false); }}>
                                <FileText size={14} /> Nova Página
                            </button>
                            <button className={styles.createMenuItem} onClick={() => { setShowCreateModal({ type: 'canvas' }); setIsCreateMenuOpen(false); }}>
                                <LayoutDashboard size={14} /> Novo Canvas
                            </button>
                            <button className={styles.createMenuItem} onClick={() => { setShowCreateModal({ type: 'table' }); setIsCreateMenuOpen(false); }}>
                                <KanbanSquare size={14} /> Nova Tabela
                            </button>
                            
                            <div className={styles.createMenuDivider} />
                            
                            <button className={styles.createMenuItem} onClick={() => { triggerVaultImport(); setIsCreateMenuOpen(false); }}>
                                <Upload size={14} /> Importar
                            </button>
                            <button className={styles.createMenuItem} onClick={() => { triggerVaultExport(); setIsCreateMenuOpen(false); }}>
                                <Download size={14} /> Exportar Backup
                            </button>
                        </div>
                    </>
                )}

                {/* Search Bar matching Reference mockup */}
                {isSidebarExpanded && (
                    <div className={styles.sidebarSearchWrapper}>
                        <Search size={14} className={styles.sidebarSearchIcon} />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            className={styles.sidebarSearchInput}
                            value={sidebarSearch}
                            onChange={(e) => setSidebarSearch(e.target.value)}
                        />
                        {sidebarSearch && (
                            <button 
                                className={styles.sidebarSearchClear}
                                onClick={() => setSidebarSearch('')}
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>
                )}

                {/* Filter Tabs (Folders / Tags) matching Reference mockup */}
                {isSidebarExpanded && (
                    <div className={styles.sidebarTabsWrapper}>
                        <div className={styles.sidebarTabs}>
                            <button
                                className={`${styles.sidebarTabBtn} ${sidebarFilterTab === 'folders' ? styles.sidebarTabBtnActive : ''}`}
                                onClick={() => setSidebarFilterTab('folders')}
                            >
                                Pastas
                            </button>
                            <button
                                className={`${styles.sidebarTabBtn} ${sidebarFilterTab === 'tags' ? styles.sidebarTabBtnActive : ''}`}
                                onClick={() => setSidebarFilterTab('tags')}
                            >
                                Tags
                            </button>
                        </div>
                    </div>
                )}

                {/* Top Nav Links */}
                <div className={styles.sidebarTop}>
                    <button
                        className={`${styles.sidebarBtn} ${viewState === 'home' ? styles.sidebarBtnActive : ''}`}
                        onClick={handleGoHome}
                        title="Início"
                    >
                        <Home size={14} />
                        {isSidebarExpanded && <span>Início</span>}
                    </button>
                    <button className={styles.sidebarBtn} title="Caixa de entrada">
                        <MessageSquare size={14} />
                        {isSidebarExpanded && <span>Caixa de entrada</span>}
                    </button>
                </div>

                <div className={styles.sidebarDivider} />

                {/* Dynamic Sections / Tree / Tags View */}
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
                    {isSidebarExpanded && sidebarFilterTab === 'tags' ? (
                        <div className={styles.sidebarTagsContainer}>
                            {uniqueTags.length === 0 ? (
                                <div className={styles.sidebarEmpty} style={{ textAlign: 'center', marginTop: '16px' }}>
                                    Nenhuma tag criada
                                </div>
                            ) : (
                                uniqueTags.map(tag => {
                                    const itemsWithTag = canvasList.filter(c => c.tags?.includes(tag) && !c.isDeleted);
                                    if (itemsWithTag.length === 0) return null;
                                    return (
                                        <div key={tag} className={styles.tagSection}>
                                            <div className={styles.tagHeader}>
                                                <span className={styles.tagName}>#{tag}</span>
                                                <span className={styles.tagCount}>{itemsWithTag.length}</span>
                                            </div>
                                            <div className={styles.tagChildren}>
                                                {itemsWithTag.map(item => (
                                                    <div 
                                                        key={item.id} 
                                                        className={`${styles.tagChildItem} ${activeCanvasId === item.id ? styles.tagChildItemActive : ''}`} 
                                                        onClick={() => handleSelectCanvas(item.id)}
                                                    >
                                                        <span className={styles.tagChildIcon}>
                                                            <DynamicIcon name={item.icon || getDefaultIconForType(item.type)} size={12} />
                                                        </span>
                                                        <span className={styles.tagChildName}>{item.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    ) : (
                        sectionOrder.map((sectionId, idx) => {
                            if (sectionId === 'favorites') {
                                const favs = canvasList.filter(c => c.isFavorite && !c.isDeleted);
                                if (favs.length === 0) return null; // Auto-hide empty favorites

                                return (
                                    <div 
                                        key="favorites"
                                        className={styles.sidebarList} 
                                        draggable 
                                        onDragStart={(e) => handleSectionDragStart(e, 'favorites')}
                                        onDragOver={(e) => handleSectionDragOver(e, 'favorites')}
                                        onDragEnd={handleSectionDragEnd}
                                        style={{ flex: 'none', paddingBottom: 0 }}
                                    >
                                        {isSidebarExpanded && (
                                            <div className={`${styles.sectionHeader} ${styles.draggableSectionHeader}`}>
                                                <span className={styles.sidebarSectionTitle}>Favoritos</span>
                                            </div>
                                        )}
                                        {favs.map(canvas => (
                                            <div
                                                key={`fav-${canvas.id}`}
                                                className={`${styles.treeNode}`}
                                                onClick={() => handleSelectCanvas(canvas.id)}
                                                onContextMenu={(e) => handleContextMenu(e, canvas.id)}
                                            >
                                                <div className={`${styles.canvasItem} ${activeCanvasId === canvas.id ? styles.active : ''}`} style={{ paddingLeft: '20px' }} title={canvas.name}>
                                                    <span className={styles.canvasItemIcon}>
                                                        <DynamicIcon name={canvas.icon || getDefaultIconForType(canvas.type)} size={14} />
                                                    </span>
                                                    {isSidebarExpanded && <span className={styles.canvasItemName}>{canvas.name}</span>}
                                                </div>
                                            </div>
                                        ))}
                                        <div className={styles.sidebarDivider} style={{ margin: '8px 12px 0' }} />
                                    </div>
                                );
                            }

                            if (sectionId === 'spaces') {
                                return (
                                    <div 
                                        key="spaces"
                                        className={styles.sidebarList}
                                        draggable 
                                        onDragStart={(e) => handleSectionDragStart(e, 'spaces')}
                                        onDragOver={(e) => handleSectionDragOver(e, 'spaces')}
                                        onDragEnd={handleSectionDragEnd}
                                    >
                                        {isSidebarExpanded && (
                                            <div className={`${styles.sectionHeader} ${styles.draggableSectionHeader}`}>
                                                <span className={styles.sidebarSectionTitle}>Espaços</span>
                                                <div className={styles.filterBarHorizontal} style={{ marginLeft: 'auto', marginRight: '4px' }}>
                                                    <button 
                                                        className={`${styles.filterBtn} ${activeFilter === 'all' ? styles.active : ''}`}
                                                        onClick={() => setActiveFilter('all')}
                                                        title="Todos"
                                                    >
                                                        <Search size={11} />
                                                    </button>
                                                    <button 
                                                        className={`${styles.filterBtn} ${activeFilter === 'page' ? styles.active : ''}`}
                                                        onClick={() => setActiveFilter('page')}
                                                        title="Páginas"
                                                    >
                                                        <FileText size={11} />
                                                    </button>
                                                    <button 
                                                        className={`${styles.filterBtn} ${activeFilter === 'canvas' ? styles.active : ''}`}
                                                        onClick={() => setActiveFilter('canvas')}
                                                        title="Canvas"
                                                    >
                                                        <LayoutDashboard size={11} />
                                                    </button>
                                                    <button 
                                                        className={`${styles.filterBtn} ${activeFilter === 'table' ? styles.active : ''}`}
                                                        onClick={() => setActiveFilter('table')}
                                                        title="Tabelas"
                                                    >
                                                        <KanbanSquare size={11} />
                                                    </button>
                                                </div>
                                                <button className={styles.sectionAddBtn} onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowCreateModal({ type: 'space' });
                                                    setCreateModalName('');
                                                }} title="Novo Espaço">
                                                    <Plus size={12} />
                                                </button>
                                            </div>
                                        )}
                                        {renderCanvasTree(undefined, 0)}

                                        {canvasList.filter(c => !c.isDeleted && !c.parentId).length === 0 && isSidebarExpanded && (
                                            <div className={styles.sidebarEmpty}>
                                                Nenhum espaço criado
                                            </div>
                                        )}
                                        
                                        {isSidebarExpanded && (
                                            <div style={{ padding: '8px 14px' }}>
                                                <button 
                                                    className={styles.sidebarBtn} 
                                                    style={{ width: '100%', padding: '6px 8px', color: 'var(--text-secondary)' }}
                                                    onClick={(e) => { 
                                                        e.stopPropagation();
                                                        setShowCreateModal({ type: 'space' });
                                                        setCreateModalName('');
                                                    }}
                                                >
                                                    <Plus size={14} /> 
                                                    Novo Espaço
                                                </button>
                                                <button 
                                                    className={styles.sidebarBtn} 
                                                    style={{ width: '100%', padding: '6px 8px', color: 'var(--text-secondary)', marginTop: '4px' }}
                                                    onClick={(e) => { 
                                                        e.stopPropagation();
                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                        setSidebarCreateMenu({ x: rect.left + 16, y: rect.bottom + 4, parentId: undefined });
                                                    }}
                                                >
                                                    <Plus size={14} /> 
                                                    Novo Objeto
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            }
                            return null;
                        })
                    )}
                </div>

                {/* Bottom Actions */}
                <div className={styles.sidebarBottom}>
                    <button
                        className={`${styles.sidebarBtn} ${isTrashView ? styles.sidebarBtnDanger : ''}`}
                        onClick={() => setIsTrashView(!isTrashView)}
                        title="Lixeira"
                    >
                        <Trash2 size={14} />
                        {isSidebarExpanded && <span>Lixeira</span>}
                    </button>
                </div>
            </div>

            {/* ── Main Content Area ── */}
            <div className={styles.mainContent}>
                {/* ── Tabs Bar & Navigation (Mockup matching) ── */}
                <div className={`${styles.tabBar} ${!isSidebarExpanded ? styles.tabBarCollapsed : ''}`}>
                    {/* Sidebar Toggle Button */}
                    <button
                        className={styles.sidebarToggleBtn}
                        onClick={() => setMenuMode(prev => prev === 'expanded' ? 'collapsed' : 'expanded')}
                        title={isSidebarExpanded ? "Recolher menu lateral" : "Abrir menu lateral"}
                    >
                        {isSidebarExpanded ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
                    </button>

                    <span className={styles.tabDivider}>|</span>

                    {/* Tabs List */}
                    <div className={styles.tabsList}>
                        {openTabs.map(tab => {
                            const isActive = viewState === 'canvas' && activeTabId === tab.id;
                            return (
                                <div
                                    key={tab.id}
                                    className={`${styles.tabItem} ${isActive ? styles.tabItemActive : ''}`}
                                    onClick={() => handleSelectCanvas(tab.id)}
                                    title={tab.name}
                                >
                                    <span className={styles.tabTitle}>{tab.name}</span>
                                    <button
                                        className={styles.tabCloseBtn}
                                        onClick={(e) => handleCloseTab(tab.id, e)}
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            );
                        })}
                        {/* New Tab Button (+) */}
                        <button
                            className={styles.tabAddBtn}
                            onClick={() => {
                                setShowCreateModal({ type: 'page' });
                                setCreateModalName('');
                            }}
                            title="Nova página"
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                </div>

                {/* ── Subbar with Navigation Arrows & Centered Breadcrumb ── */}
                <div className={`${styles.subBar} ${!isSidebarExpanded ? styles.subBarCollapsed : ''}`}>
                    {/* Navigation Arrows */}
                    <div className={styles.navArrows}>
                        <button
                            className={styles.arrowBtn}
                            onClick={handleGoBackHistory}
                            disabled={navHistoryIndex <= 0}
                            title="Voltar"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        <button
                            className={styles.arrowBtn}
                            onClick={handleGoForwardHistory}
                            disabled={navHistoryIndex >= navHistory.length - 1}
                            title="Avançar"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>

                    {/* Centered Breadcrumb / Title Path */}
                    <div className={styles.centeredBreadcrumb}>
                        <span 
                            className={styles.breadcrumbItem}
                            onClick={() => handleBreadcrumbClick(-1)}
                        >
                            Início
                        </span>
                        {viewState === 'canvas' && navigationStack.length > 0 && (
                            <>
                                {navigationStack.map((nav, index) => (
                                    <React.Fragment key={nav.id}>
                                        <span className={styles.breadcrumbSeparator}>/</span>
                                        <span
                                            className={`${styles.breadcrumbItem} ${index === navigationStack.length - 1 ? styles.active : ''}`}
                                            onClick={() => handleBreadcrumbClick(index)}
                                        >
                                            {nav.name}
                                        </span>
                                    </React.Fragment>
                                ))}
                            </>
                        )}
                    </div>
                </div>

                {viewState === 'home' ? (
                    <CanvasHome
                        canvasList={canvasList}
                        onSelectCanvas={handleSelectCanvas}
                        onCreateCanvas={handleCreateCanvas}
                        onCreateItem={(type) => {
                            setShowCreateModal({ type });
                            setCreateModalName('');
                        }}
                        onDeleteCanvas={handleSoftDeleteCanvas}
                        onRenameCanvas={(id, name) => { renameCanvas(id, name); reloadCanvasList(); }}
                        onDuplicateCanvas={handleDuplicate}
                        onUpdateCanvasInfo={handleUpdateCanvasInfo}
                        onMoveCanvasItem={(sourceId, targetId, position) => {
                            moveCanvasItem(sourceId, targetId, position, currentWorkspace?.id || '');
                            reloadCanvasList();
                        }}
                    />
                ) : activeCanvasId ? (
                    (activeCanvasType === 'space' || activeCanvasType === 'folder') ? (
                        <CanvasHome
                            activeSpaceId={activeCanvasId}
                            canvasList={canvasList}
                            onSelectCanvas={handleSelectCanvas}
                            onCreateCanvas={handleCreateCanvas}
                            onCreateItem={(type) => {
                                setShowCreateModal({ type, parentId: activeCanvasId });
                                setCreateModalName('');
                            }}
                            onDeleteCanvas={handleSoftDeleteCanvas}
                            onRenameCanvas={(id, name) => { renameCanvas(id, name); reloadCanvasList(); }}
                            onDuplicateCanvas={handleDuplicate}
                            onUpdateCanvasInfo={handleUpdateCanvasInfo}
                            onMoveCanvasItem={(sourceId, targetId, position) => {
                                moveCanvasItem(sourceId, targetId, position, currentWorkspace?.id || '');
                                reloadCanvasList();
                            }}
                        />
                    ) : activeCanvasType === 'table' ? (
                        <CRMCanvasView key={activeCanvasId} boardId={activeCanvasId} />
                    ) : activeCanvasType === 'page' && activeCanvasInfo ? (
                        <CanvasRichText 
                            key={activeCanvasId} 
                            canvasInfo={activeCanvasInfo} 
                            onUpdate={() => reloadCanvasList()} 
                            onSelectCanvas={handleSelectCanvas}
                        />
                    ) : activeCanvasData ? (
                        <InfiniteCanvas
                            key={activeCanvasId}
                            canvasId={activeCanvasId}
                            data={activeCanvasData}
                            onDataChange={handleDataChange}
                            onOpenPage={handleOpenPage}
                            onCanvasCreated={() => reloadCanvasList()}
                            onNodesDeleted={handleNodesDeleted}
                            workspaceId={currentWorkspace?.id || ''}
                            ownerId={user?.id || ''}
                        />
                    ) : (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>Carregando dados...</div>
                    )
                ) : (
                    <CanvasHome
                        canvasList={canvasList}
                        onSelectCanvas={handleSelectCanvas}
                        onCreateCanvas={handleCreateCanvas}
                        onCreateItem={(type) => {
                            setShowCreateModal({ type });
                            setCreateModalName('');
                        }}
                        onDeleteCanvas={handleSoftDeleteCanvas}
                        onRenameCanvas={(id, name) => { renameCanvas(id, name); reloadCanvasList(); }}
                        onDuplicateCanvas={handleDuplicate}
                        onUpdateCanvasInfo={handleUpdateCanvasInfo}
                    />
                )}


                {/* ── Preview Drawer ── */}
                {previewItemId && previewItemInfo && (
                    <>
                        <div className={styles.drawerOverlay} onClick={() => setPreviewItemId(null)} />
                        <div className={styles.previewDrawer}>
                            <div className={styles.drawerHeader}>
                                <span className={styles.drawerIcon}>
                                    <DynamicIcon name={previewItemInfo.icon || getDefaultIconForType(previewItemInfo.type)} size={14} />
                                </span>
                                <span className={styles.drawerTitle}>{previewItemInfo.name}</span>
                                
                                <button
                                    className={styles.drawerActionBtn}
                                    onClick={() => {
                                        handleSelectCanvas(previewItemInfo.id);
                                        setPreviewItemId(null);
                                    }}
                                    title="Abrir em Tela Cheia"
                                >
                                    <Maximize2 size={14} />
                                </button>
                                <button
                                    className={styles.drawerCloseBtn}
                                    onClick={() => setPreviewItemId(null)}
                                    title="Fechar"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                            <div className={styles.drawerContent}>
                                {previewItemInfo.type === 'table' ? (
                                    <CRMCanvasView key={`preview-${previewItemId}`} boardId={previewItemId} />
                                ) : previewItemInfo.type === 'page' ? (
                                    <CanvasRichText 
                                        key={`preview-${previewItemId}`} 
                                        canvasInfo={previewItemInfo} 
                                        onUpdate={() => reloadCanvasList()} 
                                        onSelectCanvas={(id) => {
                                            handleSelectCanvas(id);
                                            setPreviewItemId(null);
                                        }}
                                    />
                                ) : previewCanvasData ? (
                                    <InfiniteCanvas
                                        key={`preview-${previewItemId}`}
                                        canvasId={previewItemId}
                                        data={previewCanvasData}
                                        onDataChange={() => {}}
                                        onOpenPage={(id, name) => {
                                            handleSelectCanvas(id);
                                            setPreviewItemId(null);
                                        }}
                                        onCanvasCreated={() => reloadCanvasList()}
                                        onNodesDeleted={handleNodesDeleted}
                                        workspaceId={currentWorkspace?.id || ''}
                                        ownerId={user?.id || ''}
                                    />
                                ) : (
                                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>Carregando...</div>
                                )}
                            </div>
                        </div>
                    </>
                )}

            {/* Transition circular mask */}
            <div className={`entrance-circular-mask ${transitionState === 'closing' ? 'closing' : transitionState === 'opening' ? 'opening' : ''}`} />
            </div>

            {/* ── Context Menu ── */}
            {contextMenu && (
                <div
                    className={styles.contextMenu}
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {isTrashView ? (
                        <>
                            <button className={styles.contextMenuItem} onClick={() => handleRestoreCanvas(contextMenu.canvasId)}>
                                <Upload size={14} /> Restaurar
                            </button>
                            <div className={styles.contextMenuDivider} />
                            <button className={`${styles.contextMenuItem} ${styles.danger}`} onClick={() => handlePermanentDeleteCanvas(contextMenu.canvasId)}>
                                <Trash2 size={14} /> Excluir Permanentemente
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                className={styles.contextMenuItem}
                                onClick={() => {
                                    setPreviewItemId(contextMenu.canvasId);
                                    setContextMenu(null);
                                }}
                            >
                                <Eye size={14} /> Pré-visualizar
                            </button>
                            <button className={styles.contextMenuItem} onClick={() => handleToggleFavorite(contextMenu.canvasId)}>
                                <Star size={14} fill={canvasList.find(c => c.id === contextMenu.canvasId)?.isFavorite ? "currentColor" : "none"} /> 
                                {canvasList.find(c => c.id === contextMenu.canvasId)?.isFavorite ? 'Remover dos Favoritos' : 'Favoritar'}
                            </button>
                            <div className={styles.contextMenuDivider} />
                            <button className={styles.contextMenuItem} onClick={() => handleStartRename(contextMenu.canvasId)}>
                                <Edit3 size={14} /> Renomear
                            </button>
                            <button className={styles.contextMenuItem} onClick={() => handleDuplicate(contextMenu.canvasId)}>
                                <Copy size={14} /> Duplicar
                            </button>
                            <button
                                className={styles.contextMenuItem}
                                onClick={() => {
                                    const id = contextMenu.canvasId;
                                    const item = canvasList.find(c => c.id === id);
                                    setPinSettingsItem(item || null);
                                    setContextMenu(null);
                                }}
                            >
                                <Lock size={14} /> Senha PIN
                            </button>
                            <button
                                className={styles.contextMenuItem}
                                onClick={(e) => {
                                    const id = contextMenu.canvasId;
                                    setContextMenu(null);
                                    setSidebarEmojiPicker({ x: contextMenu.x, y: contextMenu.y, canvasId: id });
                                }}
                            >
                                <Smile size={14} /> Alterar Ícone
                            </button>
                            <button className={styles.contextMenuItem} onClick={() => triggerCanvasExport(contextMenu.canvasId)}>
                                <Download size={14} /> Exportar (.axecanvas)
                            </button>
                            <div className={styles.contextMenuDivider} />
                            <div className={styles.contextMenuColors}>
                                <div className={styles.contextMenuColorTitle}>Cores</div>
                                <div className={styles.contextMenuColorGrid}>
                                    <button className={`${styles.colorSwatch} ${styles.colorDefault}`} onClick={() => handleUpdateColor(contextMenu.canvasId, undefined)} title="Padrão" />
                                    <button className={`${styles.colorSwatch}`} style={{ background: 'rgba(161,161,170,1)' }} onClick={() => handleUpdateColor(contextMenu.canvasId, '161, 161, 170')} title="Cinza" />
                                    <button className={`${styles.colorSwatch}`} style={{ background: 'rgba(248,113,113,1)' }} onClick={() => handleUpdateColor(contextMenu.canvasId, '248, 113, 113')} title="Vermelho" />
                                    <button className={`${styles.colorSwatch}`} style={{ background: 'rgba(251,146,60,1)' }} onClick={() => handleUpdateColor(contextMenu.canvasId, '251, 146, 60')} title="Laranja" />
                                    <button className={`${styles.colorSwatch}`} style={{ background: 'rgba(250,204,21,1)' }} onClick={() => handleUpdateColor(contextMenu.canvasId, '250, 204, 21')} title="Amarelo" />
                                    <button className={`${styles.colorSwatch}`} style={{ background: 'rgba(74,222,128,1)' }} onClick={() => handleUpdateColor(contextMenu.canvasId, '74, 222, 128')} title="Verde" />
                                    <button className={`${styles.colorSwatch}`} style={{ background: 'rgba(96,165,250,1)' }} onClick={() => handleUpdateColor(contextMenu.canvasId, '96, 165, 250')} title="Azul" />
                                    <button className={`${styles.colorSwatch}`} style={{ background: 'rgba(192,132,252,1)' }} onClick={() => handleUpdateColor(contextMenu.canvasId, '192, 132, 252')} title="Roxo" />
                                    <button className={`${styles.colorSwatch}`} style={{ background: 'rgba(244,114,182,1)' }} onClick={() => handleUpdateColor(contextMenu.canvasId, '244, 114, 182')} title="Rosa" />
                                </div>
                            </div>
                            <div className={styles.contextMenuDivider} />
                            <button className={`${styles.contextMenuItem} ${styles.danger}`} onClick={() => handleSoftDeleteCanvas(contextMenu.canvasId)}>
                                <Trash2 size={14} /> Mover para Lixeira
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* Sidebar Icon Picker */}
            {sidebarEmojiPicker && (
                <>
                    <div
                        className={styles.emojiPickerOverlay}
                        onClick={() => setSidebarEmojiPicker(null)}
                    />
                    <div
                        className={styles.emojiPicker}
                        style={{ left: sidebarEmojiPicker.x, top: sidebarEmojiPicker.y }}
                    >
                        <div className={styles.emojiPickerTitle}>Escolher cor</div>
                        <div className={styles.contextMenuColorGrid} style={{ marginBottom: '16px', padding: '0 4px', gridTemplateColumns: 'repeat(9, 1fr)' }}>
                            <button className={`${styles.colorSwatch} ${styles.colorDefault}`} onClick={() => handleUpdateColor(sidebarEmojiPicker.canvasId, undefined)} title="Padrão" />
                            <button className={`${styles.colorSwatch}`} style={{ background: 'rgba(161,161,170,1)' }} onClick={() => handleUpdateColor(sidebarEmojiPicker.canvasId, '161, 161, 170')} title="Cinza" />
                            <button className={`${styles.colorSwatch}`} style={{ background: 'rgba(248,113,113,1)' }} onClick={() => handleUpdateColor(sidebarEmojiPicker.canvasId, '248, 113, 113')} title="Vermelho" />
                            <button className={`${styles.colorSwatch}`} style={{ background: 'rgba(251,146,60,1)' }} onClick={() => handleUpdateColor(sidebarEmojiPicker.canvasId, '251, 146, 60')} title="Laranja" />
                            <button className={`${styles.colorSwatch}`} style={{ background: 'rgba(250,204,21,1)' }} onClick={() => handleUpdateColor(sidebarEmojiPicker.canvasId, '250, 204, 21')} title="Amarelo" />
                            <button className={`${styles.colorSwatch}`} style={{ background: 'rgba(74,222,128,1)' }} onClick={() => handleUpdateColor(sidebarEmojiPicker.canvasId, '74, 222, 128')} title="Verde" />
                            <button className={`${styles.colorSwatch}`} style={{ background: 'rgba(96,165,250,1)' }} onClick={() => handleUpdateColor(sidebarEmojiPicker.canvasId, '96, 165, 250')} title="Azul" />
                            <button className={`${styles.colorSwatch}`} style={{ background: 'rgba(192,132,252,1)' }} onClick={() => handleUpdateColor(sidebarEmojiPicker.canvasId, '192, 132, 252')} title="Roxo" />
                            <button className={`${styles.colorSwatch}`} style={{ background: 'rgba(244,114,182,1)' }} onClick={() => handleUpdateColor(sidebarEmojiPicker.canvasId, '244, 114, 182')} title="Rosa" />
                        </div>
                        
                        <div className={styles.emojiPickerTitle}>Escolher ícone</div>
                        <div className={styles.emojiPickerScroll}>
                            {ICON_CATEGORIES.map((category) => (
                                <div key={category.name} className={styles.iconCategory}>
                                    <div className={styles.iconCategoryTitle}>{category.name}</div>
                                    <div className={styles.emojiGrid}>
                                        {category.icons.map((iconName) => (
                                            <button
                                                key={iconName}
                                                className={styles.emojiBtn}
                                                onClick={() => selectSidebarEmoji(iconName)}
                                                title={iconName}
                                            >
                                                <DynamicIcon name={iconName} size={18} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* Sidebar Create Menu */}
            {sidebarCreateMenu && (
                <>
                    <div className={styles.contextOverlay} onClick={() => setSidebarCreateMenu(null)} />
                    <div
                        className={styles.contextMenu}
                        style={{ left: sidebarCreateMenu.x, top: sidebarCreateMenu.y, width: '180px' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button className={styles.contextMenuItem} onClick={() => {
                            const pid = sidebarCreateMenu.parentId;
                            setSidebarCreateMenu(null);
                            setShowCreateModal({ type: 'folder', parentId: pid });
                            setCreateModalName('');
                        }}>
                            <Folder size={14} /> Pasta
                        </button>
                        <div className={styles.contextMenuDivider} />
                        <button className={styles.contextMenuItem} onClick={() => {
                            const pid = sidebarCreateMenu.parentId;
                            setSidebarCreateMenu(null);
                            setShowCreateModal({ type: 'page', parentId: pid });
                            setCreateModalName('');
                        }}>
                            <FileText size={14} /> Página (Docs)
                        </button>
                        <button className={styles.contextMenuItem} onClick={() => {
                            const pid = sidebarCreateMenu.parentId;
                            setSidebarCreateMenu(null);
                            setShowCreateModal({ type: 'canvas', parentId: pid });
                            setCreateModalName('');
                        }}>
                            <LayoutDashboard size={14} /> Canvas Infinito
                        </button>
                        <button className={styles.contextMenuItem} onClick={() => {
                            const pid = sidebarCreateMenu.parentId;
                            setSidebarCreateMenu(null);
                            setShowCreateModal({ type: 'table', parentId: pid });
                            setCreateModalName('');
                        }}>
                            <KanbanSquare size={14} /> Tabela / CRM
                        </button>
                    </div>
                </>
            )}

            {/* Create Modal */}
            {showCreateModal && (() => {
                const modalConfig = {
                    canvas: { title: 'Criar Novo Canvas', desc: 'Quadro em branco infinito para ideias, fluxos e diagramas.', icon: <LayoutDashboard size={32} color="#8B5CF6" />, color: '#8B5CF6', placeholder: 'Ex: Reunião de Marketing' },
                    page: { title: 'Criar Nova Página', desc: 'Documento rico para notas, atas e textos estruturados.', icon: <FileText size={32} color="#3B82F6" />, color: '#3B82F6', placeholder: 'Ex: Planejamento Anual' },
                    table: { title: 'Criar Novo CRM', desc: 'Tabela inteligente para gerenciar leads, tarefas ou inventário.', icon: <KanbanSquare size={32} color="#10B981" />, color: '#10B981', placeholder: 'Ex: Pipeline de Vendas' },
                    folder: { title: 'Criar Nova Pasta', desc: 'Organize seus arquivos e projetos para fácil acesso.', icon: <FolderPlus size={32} color="#6B7280" />, color: '#6B7280', placeholder: 'Ex: Projetos 2026' },
                    space: { title: 'Criar Novo Espaço', desc: 'Um novo ambiente de trabalho isolado para uma equipe.', icon: <Folder size={32} color="#F59E0B" />, color: '#F59E0B', placeholder: 'Ex: Equipe de Produto' }
                }[showCreateModal.type];
                
                return (
                <div className={styles.modalOverlayPremium} onClick={() => setShowCreateModal(null)}>
                    <div className={styles.modalContentPremium} onClick={(e) => e.stopPropagation()} style={{ '--modal-color': modalConfig.color } as React.CSSProperties}>
                        <div className={styles.modalHeaderPremium}>
                            <div className={styles.modalHeaderIconBox} style={{ borderColor: modalConfig.color, background: `${modalConfig.color}15` }}>
                                {modalConfig.icon}
                            </div>
                            <div className={styles.modalHeaderText}>
                                <h2>{modalConfig.title}</h2>
                                <p>{modalConfig.desc}</p>
                            </div>
                            <button className={styles.modalCloseBtn} style={{ alignSelf: 'flex-start' }} onClick={() => setShowCreateModal(null)}>
                                <X size={16} />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <label className={styles.modalLabel}>Nome do {showCreateModal.type === 'canvas' ? 'Canvas' : showCreateModal.type === 'space' ? 'Espaço' : showCreateModal.type === 'page' ? 'Página' : showCreateModal.type === 'folder' ? 'Pasta' : 'CRM/Pipeline'}</label>
                            <input
                                autoFocus
                                className={styles.modalInputPremium}
                                value={createModalName}
                                onChange={(e) => setCreateModalName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleConfirmCreateModal();
                                    if (e.key === 'Escape') setShowCreateModal(null);
                                }}
                                placeholder={modalConfig.placeholder}
                            />
                            <div style={{ marginTop: '12px' }}>
                                <button className={styles.secondaryBtn} onClick={setModalNameToToday} style={{ fontSize: '12px', padding: '4px 8px' }}>
                                    Usar data de hoje
                                </button>
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button className={styles.cancelBtn} onClick={() => setShowCreateModal(null)}>Cancelar</button>
                            <button className={styles.confirmBtn} style={{ background: modalConfig.color }} onClick={handleConfirmCreateModal}>Criar {showCreateModal.type === 'canvas' ? 'Canvas' : showCreateModal.type === 'space' ? 'Espaço' : showCreateModal.type === 'page' ? 'Página' : showCreateModal.type === 'folder' ? 'Pasta' : 'CRM'}</button>
                        </div>
                    </div>
                </div>
                );
            })()}

            {/* Hidden file input */}
            <input
                ref={fileImportInputRef}
                type="file"
                accept=".json,.axecanvas"
                style={{ display: 'none' }}
                onChange={handleVaultImportFile}
            />

            {/* PIN Settings Modal */}
            {pinSettingsItem && (
                <ItemPinModal
                    itemId={pinSettingsItem.id}
                    itemName={pinSettingsItem.name}
                    initialPin={pinSettingsItem.properties?.pin}
                    initialRecoveryEmail={pinSettingsItem.properties?.recoveryEmail}
                    onSave={async (pin, recoveryEmail) => {
                        const currentProps = pinSettingsItem.properties || {};
                        const updatedProps = { ...currentProps };
                        if (pin) {
                            updatedProps.pin = pin;
                            updatedProps.recoveryEmail = recoveryEmail || '';
                        } else {
                            delete updatedProps.pin;
                            delete updatedProps.recoveryEmail;
                        }
                        await updateCanvasInfo(pinSettingsItem.id, { properties: updatedProps });
                        await reloadCanvasList();
                    }}
                    onClose={() => setPinSettingsItem(null)}
                />
            )}

            {/* PIN Unlock Modal */}
            {pinUnlockItem && (
                <ItemPinUnlockModal
                    itemId={pinUnlockItem.id}
                    itemName={pinUnlockItem.name}
                    itemIcon={pinUnlockItem.icon}
                    itemType={pinUnlockItem.type}
                    correctPin={pinUnlockItem.properties?.pin || ''}
                    recoveryEmail={pinUnlockItem.properties?.recoveryEmail || ''}
                    onUnlock={() => {
                        const unlockedId = pinUnlockItem.id;
                        if (onPinSuccess) {
                            onPinSuccess(unlockedId);
                        } else {
                            setPinUnlockItem(null);
                        }
                    }}
                    onClose={() => {
                        setPinUnlockItem(null);
                        setOnPinSuccess(null);
                    }}
                />
            )}

        </div>
    );
};

export default CanvasPage;
