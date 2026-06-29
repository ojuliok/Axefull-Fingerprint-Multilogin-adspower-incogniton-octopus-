import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Table2,
  MoreHorizontal,
  Trash2,
  Edit3,
  Copy,
  FileText,
  Calendar,
  Layers,
  ChevronRight,
  ImagePlus,
  Move,
  Image,
  Smile,
  Star,
  Clock,
  Layout,
  Users,
  Shield,
  FolderOpen,
  Home,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Maximize2,
  Minimize2,
  X,
  LayoutDashboard,
  KanbanSquare,
  FolderPlus,
  Eye,
  EyeOff,
  Box,
  Lock,
  Check,
  ArrowLeftRight
} from 'lucide-react';
import { CanvasInfo, getCanvasData } from './canvasStorage';
import { CANVAS_ICONS, DynamicIcon } from './CanvasIcons';
import NeuralBackground from './NeuralBackground';
import { CanvasPreviewModal } from './Home/CanvasPreviewModal';
import { CanvasTableView } from './Home/CanvasTableView';
import { CanvasGridView } from './Home/CanvasGridView';
import { CanvasListView } from './Home/CanvasListView';
import { CanvasSpacesGrid } from './Home/CanvasSpacesGrid';
import { useToast } from '../../context/ToastContext';
import SpaceOverview from './SpaceOverview';
import { GlobalOverview } from './GlobalOverview';
import { MembersManager } from './MembersManager';
import { ItemPinModal } from './ItemPinModal';
import styles from './CanvasHome.module.css';

// ─── Props ───────────────────────────────────────────
interface CanvasHomeProps {
  canvasList: CanvasInfo[];
  onSelectCanvas: (id: string, skipClosing?: boolean) => void;
  onCreateCanvas: () => void;
  onCreateItem?: (type: 'canvas' | 'page' | 'folder' | 'table' | 'space') => void;
  onDeleteCanvas: (id: string) => void;
  onRenameCanvas: (id: string, name: string) => void;
  onDuplicateCanvas: (id: string) => void;
  onUpdateCanvasInfo: (id: string, updates: Partial<CanvasInfo>) => void;
  activeSpaceId?: string;
  onMoveCanvasItem?: (sourceId: string, targetId: string, position: 'before' | 'after' | 'inside') => void;
}

// ─── View Types ──────────────────────────────────────
type ViewMode = 'grid' | 'list' | 'table';

// ─── Date Formatter ──────────────────────────────────
function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'agora mesmo';
  if (mins < 60) return `há ${mins} min`;
  if (hours < 24) return `há ${hours}h`;
  if (days < 7) return `há ${days} dia${days > 1 ? 's' : ''}`;

  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

// ─── Component ───────────────────────────────────────
const CanvasHome: React.FC<CanvasHomeProps> = ({
  canvasList,
  onSelectCanvas,
  onCreateCanvas,
  onCreateItem,
  onDeleteCanvas,
  onRenameCanvas,
  onDuplicateCanvas,
  onUpdateCanvasInfo,
  activeSpaceId,
  onMoveCanvasItem,
}) => {
  const { toast } = useToast();

  // ── Onboarding Checklist Logic ──
  const [profiles, setProfiles] = useState<any[]>([]);
  useEffect(() => {
    if (window.api && window.api.profiles && window.api.profiles.list) {
      window.api.profiles.list().then(res => {
        if (res && res.success) {
          setProfiles(res.data || []);
        }
      }).catch(err => console.error('Failed to load profiles for checklist:', err));
    }
  }, []);

  const onboardingSteps = useMemo(() => {
    const hasProfile = profiles.length > 0;
    const hasProxy = profiles.some(p => p.proxy_id || p.proxy);
    const hasCanvas = canvasList.some(c => c.type === 'canvas' && !c.isDeleted);
    const hasCRM = canvasList.some(c => c.type === 'table' && !c.isDeleted);

    return [
      { id: 'profile', label: 'Criar seu primeiro perfil de navegador', done: hasProfile, desc: 'Configure as opções iniciais de hardware fingerprinting.' },
      { id: 'proxy', label: 'Vincular um Proxy ao perfil', done: hasProxy, desc: 'Garanta navegação com IPs isolados por perfil.' },
      { id: 'canvas', label: 'Criar um quadro de fluxo Canvas', done: hasCanvas, desc: 'Mapeie visualmente sua esteira de contingência.' },
      { id: 'crm', label: 'Inicializar um CRM Kanban', done: hasCRM, desc: 'Gerencie o aquecimento e progresso de suas contas.' },
    ];
  }, [profiles, canvasList]);

  const completedStepsCount = useMemo(() => onboardingSteps.filter(s => s.done).length, [onboardingSteps]);
  const isOnboardingCompleted = completedStepsCount === onboardingSteps.length;

  const [isOnboardingMinimized, setIsOnboardingMinimized] = useState(() => {
    return localStorage.getItem('axe_onboarding_minimized') === 'true';
  });

  const [isOnboardingDismissed, setIsOnboardingDismissed] = useState(() => {
    try {
      return localStorage.getItem('axe_onboarding_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  const handleDismissOnboarding = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOnboardingDismissed(true);
    localStorage.setItem('axe_onboarding_dismissed', 'true');
  }, []);

  const handleShowOnboarding = useCallback(() => {
    setIsOnboardingDismissed(false);
    localStorage.removeItem('axe_onboarding_dismissed');
  }, []);

  const toggleOnboardingMinimize = useCallback(() => {
    setIsOnboardingMinimized(prev => {
      const next = !prev;
      localStorage.setItem('axe_onboarding_minimized', String(next));
      return next;
    });
  }, []);

  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list'); // Default to list since it's the standard for Workspace view
  const [activeTab, setActiveTab] = useState(activeSpaceId ? 'Visão Geral' : 'Conteúdo');
  const [favorites, setFavorites] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem('axe_canvas_favorites') || '{}'); }
    catch { return {}; }
  });
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);
  const [previewOnClick, setPreviewOnClick] = useState(() => {
    try { return JSON.parse(localStorage.getItem('axe_canvas_preview_onclick') || 'true'); }
    catch { return true; }
  });
  const [previewLayout, setPreviewLayout] = useState<'center' | 'side'>('center');
  const [isCreationOpen, setIsCreationOpen] = useState(true);

  const [showCreateSpace, setShowCreateSpace] = useState(() => {
    try { return JSON.parse(localStorage.getItem('axe_canvas_show_create_space') ?? 'true'); }
    catch { return true; }
  });

  const [layoutMode, setLayoutMode] = useState<'right' | 'left' | 'bottom' | 'full-main' | 'full-side'>(() => {
    try { return localStorage.getItem('axe_canvas_layout_mode') as any || 'right'; }
    catch { return 'right'; }
  });

  const [sidebarWidth, setSidebarWidth] = useState(320);

  const toggleLayoutMode = useCallback(() => {
    setLayoutMode(prev => {
      const order = ['right', 'left', 'bottom', 'full-main', 'full-side'];
      const nextIdx = (order.indexOf(prev) + 1) % order.length;
      const next = order[nextIdx] as any;
      localStorage.setItem('axe_canvas_layout_mode', next);
      return next;
    });
  }, []);

  const [fullTextWrap, setFullTextWrap] = useState(() => {
    try { return localStorage.getItem('axe_canvas_full_wrap') === 'true'; }
    catch { return false; }
  });

  const toggleFullTextWrap = useCallback(() => {
    setFullTextWrap(prev => {
      localStorage.setItem('axe_canvas_full_wrap', String(!prev));
      return !prev;
    });
  }, []);

  const handleResizeDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      let newWidth = layoutMode === 'right' ? startWidth - deltaX : startWidth + deltaX;
      if (newWidth < 200) newWidth = 200;
      if (newWidth > 800) newWidth = 800;
      setSidebarWidth(newWidth);
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [sidebarWidth, layoutMode]);

  // ── Space Entrance Animation ──
  const [isEnteringSpace, setIsEnteringSpace] = useState<boolean>(false);

  const handleSpaceEnter = useCallback((id: string) => {
    setIsEnteringSpace(true);
    setTimeout(() => {
      onSelectCanvas(id, true);
      setIsEnteringSpace(false);
    }, 400);
  }, [onSelectCanvas]);
  const [showMembersManager, setShowMembersManager] = useState(false);
  const [pinSettingsItem, setPinSettingsItem] = useState<CanvasInfo | null>(null);
  
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; id: string } | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [editingDescId, setEditingDescId] = useState<string | null>(null);
  const [descValue, setDescValue] = useState('');
  const [emojiPicker, setEmojiPicker] = useState<{ x: number; y: number; id: string } | null>(null);

  // Cover image edit states
  const [editingCoverId, setEditingCoverId] = useState<string | null>(null);
  const [repositioningId, setRepositioningId] = useState<string | null>(null);
  const [tempPosition, setTempPosition] = useState(50);

  const renameInputRef = useRef<HTMLInputElement>(null);
  const descInputRef = useRef<HTMLTextAreaElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Drag states
  const [startY, setStartY] = useState(0);
  const [startPos, setStartPos] = useState(50);
  const isDragging = useRef(false);

  // ── Active Space ──
  const activeSpace = useMemo(() => {
    return activeSpaceId ? canvasList.find(c => c.id === activeSpaceId) : null;
  }, [canvasList, activeSpaceId]);

  // Filter canvases — top-level, not deleted, matching search
  const filteredCanvases = useMemo(() => {
    const term = search.toLowerCase().trim();
    return canvasList
      .filter((c) => {
        if (c.isDeleted) return false;
        if (activeSpaceId) {
          // In space view, only show children of this space
          return c.parentId === activeSpaceId;
        } else {
          // Normal home view, only show top-level items
          return !c.parentId;
        }
      })
      .filter((c) => !term || c.name.toLowerCase().includes(term))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [canvasList, search, activeSpaceId]);

  const spaces = useMemo(() => filteredCanvases.filter(c => c.type === 'space'), [filteredCanvases]);
  const otherItems = useMemo(() => filteredCanvases.filter(c => c.type !== 'space'), [filteredCanvases]);
  const folders = useMemo(() => otherItems.filter(c => c.type === 'folder'), [otherItems]);
  const regularItems = useMemo(() => otherItems.filter(c => c.type !== 'folder'), [otherItems]);

  // ── Focus rename input ──
  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  // ── Focus description input ──
  useEffect(() => {
    if (editingDescId && descInputRef.current) {
      descInputRef.current.focus();
      descInputRef.current.select();
    }
  }, [editingDescId]);

  const handleItemClick = useCallback((id: string) => {
    const item = canvasList.find(c => c.id === id);
    if (item && (item.type === 'space' || item.type === 'folder')) {
      onSelectCanvas(id);
    } else if (previewOnClick) {
      setActivePreviewId(id);
    } else {
      onSelectCanvas(id);
    }
  }, [previewOnClick, onSelectCanvas, canvasList]);

  // ── Favorites ──
  const toggleFavorite = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = { ...prev, [id]: !prev[id] };
      if (!next[id]) delete next[id];
      localStorage.setItem('axe_canvas_favorites', JSON.stringify(next));
      return next;
    });
  }, []);

  // ── Context Menu Handlers ──
  const handleContextMenu = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, id });
  }, []);

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  // ── Rename ──
  const startRename = useCallback((id: string, currentName: string) => {
    setRenamingId(id);
    setRenameValue(currentName);
    setContextMenu(null);
  }, []);

  const commitRename = useCallback(() => {
    if (renamingId && renameValue.trim()) {
      onRenameCanvas(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  }, [renamingId, renameValue, onRenameCanvas]);

  // ── Description Editing ──
  const startDescEdit = useCallback((id: string, currentDesc: string) => {
    setEditingDescId(id);
    setDescValue(currentDesc);
  }, []);

  const commitDescEdit = useCallback(() => {
    if (editingDescId) {
      onUpdateCanvasInfo(editingDescId, { description: descValue.trim() });
    }
    setEditingDescId(null);
  }, [editingDescId, descValue, onUpdateCanvasInfo]);

  // ── Emoji Picker ──
  const openEmojiPicker = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setEmojiPicker({ x: rect.left, y: rect.bottom + 6, id });
  }, []);

  const selectEmoji = useCallback(
    (emoji: string) => {
      if (emojiPicker) {
        onUpdateCanvasInfo(emojiPicker.id, { icon: emoji });
      }
      setEmojiPicker(null);
    },
    [emojiPicker, onUpdateCanvasInfo]
  );

  // ── Helpers ──
  const getChildCount = useCallback(
    (id: string) => canvasList.filter((c) => c.parentId === id).length,
    [canvasList]
  );

  const getNodeCount = useCallback((id: string) => {
    // Cannot fetch canvas data synchronously here
    return 0;
  }, []);

  const previewCanvas = useMemo(() => {
    return canvasList.find(c => c.id === activePreviewId);
  }, [canvasList, activePreviewId]);

  const handleAddProperty = useCallback(() => {
    if (!previewCanvas) return;
    const currentProps = previewCanvas.properties || {};
    let baseKey = 'Nova Propriedade';
    let counter = 1;
    let newKey = baseKey;
    while (currentProps[newKey] !== undefined) {
      newKey = `${baseKey} ${counter}`;
      counter++;
    }
    const updatedProps = { ...currentProps, [newKey]: '' };
    onUpdateCanvasInfo(previewCanvas.id, { properties: updatedProps });
  }, [previewCanvas, onUpdateCanvasInfo]);

  const handleUpdatePropertyKey = useCallback((oldKey: string, newKey: string) => {
    if (!previewCanvas || !newKey.trim() || oldKey === newKey) return;
    const currentProps = previewCanvas.properties || {};
    const value = currentProps[oldKey] || '';
    const updatedProps = { ...currentProps };
    delete updatedProps[oldKey];
    updatedProps[newKey] = value;
    onUpdateCanvasInfo(previewCanvas.id, { properties: updatedProps });
  }, [previewCanvas, onUpdateCanvasInfo]);

  const handleUpdatePropertyValue = useCallback((key: string, value: string) => {
    if (!previewCanvas) return;
    const currentProps = previewCanvas.properties || {};
    const updatedProps = { ...currentProps, [key]: value };
    onUpdateCanvasInfo(previewCanvas.id, { properties: updatedProps });
  }, [previewCanvas, onUpdateCanvasInfo]);

  const handleDeleteProperty = useCallback((key: string) => {
    if (!previewCanvas) return;
    const currentProps = previewCanvas.properties || {};
    const updatedProps = { ...currentProps };
    delete updatedProps[key];
    onUpdateCanvasInfo(previewCanvas.id, { properties: updatedProps });
  }, [previewCanvas, onUpdateCanvasInfo]);

  const handleUpdateNotes = useCallback((notes: string) => {
    if (!previewCanvas) return;
    onUpdateCanvasInfo(previewCanvas.id, { notes });
  }, [previewCanvas, onUpdateCanvasInfo]);

  const startReposition = useCallback((id: string, currentPos: number) => {
    setRepositioningId(id);
    setTempPosition(currentPos);
  }, []);

  const saveReposition = useCallback((id: string) => {
    onUpdateCanvasInfo(id, { coverPosition: tempPosition });
    setRepositioningId(null);
  }, [tempPosition, onUpdateCanvasInfo]);

  const cancelReposition = useCallback(() => {
    setRepositioningId(null);
  }, []);

  const handleRepositionStart = useCallback((e: React.MouseEvent<HTMLDivElement>, canvasId: string, currentPos: number) => {
    e.preventDefault();
    e.stopPropagation();
    setStartY(e.clientY);
    setStartPos(currentPos);
    isDragging.current = true;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDragging.current) return;
      const deltaY = moveEvent.clientY - e.clientY;
      const pctChange = (deltaY / 120) * 100; // 120px is the cover height
      let newPos = startPos - pctChange;
      if (newPos < 0) newPos = 0;
      if (newPos > 100) newPos = 100;
      setTempPosition(Math.round(newPos));
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [startPos]);

  const triggerCoverUpload = useCallback((id: string) => {
    setEditingCoverId(id);
    if (coverInputRef.current) {
      coverInputRef.current.value = '';
      coverInputRef.current.click();
    }
  }, []);

  const handleCoverFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingCoverId) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      onUpdateCanvasInfo(editingCoverId, { coverImage: base64, coverPosition: 50 });
      setEditingCoverId(null);
    };
    reader.readAsDataURL(file);
  }, [editingCoverId, onUpdateCanvasInfo]);

  // ── Context Menu Actions ──
  const handleMenuAction = useCallback(
    (action: 'rename' | 'duplicate' | 'delete' | 'change_cover' | 'change_icon' | 'pin') => {
      if (!contextMenu) return;
      const canvas = canvasList.find((c) => c.id === contextMenu.id);
      switch (action) {
        case 'rename':
          if (canvas) startRename(canvas.id, canvas.name);
          break;
        case 'duplicate':
          onDuplicateCanvas(contextMenu.id);
          break;
        case 'delete':
          onDeleteCanvas(contextMenu.id);
          break;
        case 'change_cover':
          if (canvas) triggerCoverUpload(canvas.id);
          break;
        case 'change_icon':
          if (canvas) {
            setEmojiPicker({ x: contextMenu.x, y: contextMenu.y, id: canvas.id });
          }
          break;
        case 'pin':
          if (canvas) {
            setPinSettingsItem(canvas);
          }
          break;
      }
      setContextMenu(null);
    },
    [contextMenu, canvasList, startRename, onDuplicateCanvas, onDeleteCanvas, triggerCoverUpload]
  );

  const renderItemList = (items: CanvasInfo[]) => {
    if (viewMode === 'grid') {
      return (
        <CanvasGridView
          filteredCanvases={items}
          renamingId={renamingId}
          renameValue={renameValue}
          setRenameValue={setRenameValue}
          commitRename={commitRename}
          startRename={startRename}
          setActivePreviewId={handleItemClick}
          handleContextMenu={handleContextMenu}
          onSelectCanvas={onSelectCanvas}
          openEmojiPicker={openEmojiPicker}
          getChildCount={getChildCount}
          getNodeCount={getNodeCount}
          formatDate={formatDate}
          repositioningId={repositioningId}
          tempPosition={tempPosition}
          handleRepositionStart={handleRepositionStart}
          startReposition={startReposition}
          saveReposition={saveReposition}
          cancelReposition={cancelReposition}
          triggerCoverUpload={triggerCoverUpload}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
          editingDescId={editingDescId}
          descValue={descValue}
          setDescValue={setDescValue}
          commitDescEdit={commitDescEdit}
          startDescEdit={startDescEdit}
        />
      );
    } else if (viewMode === 'list') {
      return (
        <CanvasListView
          filteredCanvases={items}
          renamingId={renamingId}
          renameValue={renameValue}
          setRenameValue={setRenameValue}
          commitRename={commitRename}
          startRename={startRename}
          setActivePreviewId={handleItemClick}
          handleContextMenu={handleContextMenu}
          onSelectCanvas={onSelectCanvas}
          openEmojiPicker={openEmojiPicker}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
        />
      );
    } else {
      return (
        <CanvasTableView 
          filteredCanvases={items}
          renamingId={renamingId}
          renameValue={renameValue}
          setRenameValue={setRenameValue}
          commitRename={commitRename}
          startRename={startRename}
          setActivePreviewId={handleItemClick}
          handleContextMenu={handleContextMenu}
          onSelectCanvas={onSelectCanvas}
          openEmojiPicker={openEmojiPicker}
          getChildCount={getChildCount}
          getNodeCount={getNodeCount}
          formatDate={formatDate}
        />
      );
    }
  };

  // ─── Render ────────────────────────────────────────
  return (
    <div className={`${styles.container} ${isEnteringSpace ? styles.enteringSpace : ''}`} style={{ position: 'relative' }}>
      <NeuralBackground color={activeSpace?.color} />
      {/* Workspace Header */}
      <div className={styles.workspaceHeader}>
        <div className={styles.workspaceTabs}>
          <button className={`${styles.tab} ${activeTab === 'Visão Geral' ? styles.tabActive : ''}`} onClick={() => setActiveTab('Visão Geral')}>
            <LayoutDashboard size={16} /> Visão Geral
          </button>
          <button className={`${styles.tab} ${activeTab === 'Conteúdo' ? styles.tabActive : ''}`} onClick={() => setActiveTab('Conteúdo')}>
            <FolderOpen size={16} /> Conteúdo
          </button>
          <button className={`${styles.tab} ${activeTab === 'Recentes' ? styles.tabActive : ''}`} onClick={() => setActiveTab('Recentes')}>
            <Clock size={16} /> Recentes
          </button>
          <button className={`${styles.tab} ${activeTab === 'Colaboradores' ? styles.tabActive : ''}`} onClick={() => setActiveTab('Colaboradores')}>
            <Users size={16} /> Colaboradores
          </button>
          <button className={`${styles.tab} ${activeTab === 'Permissões' ? styles.tabActive : ''}`} onClick={() => setActiveTab('Permissões')}>
            <Shield size={16} /> Permissões
          </button>
        </div>
      </div>

      {activeTab === 'Visão Geral' && activeSpace ? (
        <SpaceOverview activeSpace={activeSpace} onUpdate={onUpdateCanvasInfo} />
      ) : activeTab === 'Conteúdo' ? (
        <>
          {/* Unified Toolbar: Create + Search + View */}
          <div className={styles.contentToolbar}>
            <div className={styles.createActions}>
              <button className={styles.minimalCreateBtn} onClick={() => onCreateItem && onCreateItem('space')}>
                <Plus size={14} />
                <Box size={14} className={styles.iconYellow} />
                <span className={styles.createLabel}>Espaço</span>
              </button>
              <button className={styles.minimalCreateBtn} onClick={() => onCreateItem && onCreateItem('canvas')}>
                <Plus size={14} />
                <LayoutDashboard size={14} className={styles.iconPurple} />
                <span className={styles.createLabel}>Canvas</span>
              </button>
              <button className={styles.minimalCreateBtn} onClick={() => onCreateItem && onCreateItem('page')}>
                <Plus size={14} />
                <FileText size={14} className={styles.iconBlue} />
                <span className={styles.createLabel}>Página</span>
              </button>
              <button className={styles.minimalCreateBtn} onClick={() => onCreateItem && onCreateItem('table')}>
                <Plus size={14} />
                <KanbanSquare size={14} className={styles.iconGreen} />
                <span className={styles.createLabel}>CRM</span>
              </button>
              <button className={styles.minimalCreateBtn} onClick={() => onCreateItem && onCreateItem('folder')}>
                <Plus size={14} />
                <FolderPlus size={14} className={styles.iconGray} />
                <span className={styles.createLabel}>Pasta</span>
              </button>
            </div>

            <div className={styles.toolbarRight}>
              <div className={styles.searchWrapper}>
                <Search size={15} className={styles.searchIcon} />
                <input
                  className={styles.searchInput}
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className={styles.viewToggles}>
                <button
                  className={`${styles.viewToggle} ${previewOnClick ? styles.viewToggleActive : ''}`}
                  onClick={() => {
                    const next = !previewOnClick;
                    setPreviewOnClick(next);
                    localStorage.setItem('axe_canvas_preview_onclick', JSON.stringify(next));
                    if (next) {
                      toast.info('Modo de Pré-visualização Ativado', 'Ao clicar em um item, você verá os detalhes e seu conteúdo antes de abrir o editor.');
                    } else {
                      toast.info('Modo de Pré-visualização Desativado', 'Ao clicar em um item, o editor principal será aberto diretamente.');
                    }
                  }}
                  title={previewOnClick ? "Desativar prévia ao clicar (Abre o editor direto)" : "Ativar prévia ao clicar"}
                  style={{ marginRight: '16px' }}
                >
                  {previewOnClick ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>

                <button
                  className={`${styles.viewToggle} ${viewMode === 'grid' ? styles.viewToggleActive : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Grade"
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  className={`${styles.viewToggle} ${viewMode === 'list' ? styles.viewToggleActive : ''}`}
                  onClick={() => setViewMode('list')}
                  title="Lista"
                >
                  <List size={15} />
                </button>
                <button
                  className={`${styles.viewToggle} ${viewMode === 'table' ? styles.viewToggleActive : ''}`}
                  onClick={() => setViewMode('table')}
                  title="Tabela"
                >
                  <Table2 size={15} />
                </button>
                <div className={styles.viewSeparator} />
                <button
                  className={`${styles.viewToggle} ${fullTextWrap ? styles.viewToggleActive : ''}`}
                  onClick={toggleFullTextWrap}
                  title="Texto por inteiro"
                >
                  <List size={15} />
                </button>
                <button
                  className={styles.viewToggle}
                  onClick={toggleLayoutMode}
                  title={`Alternar Layout: ${layoutMode}`}
                >
                  <Layout size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className={styles.statsBar}>
            <span className={styles.statsCount}>
              <strong>{filteredCanvases.length}</strong>{' '}
              {filteredCanvases.length === 1 ? 'item' : 'itens'}
              {search && ` encontrado${filteredCanvases.length !== 1 ? 's' : ''}`}
            </span>
          </div>

      {/* Content */}
      <div className={`${styles.content} ${fullTextWrap ? styles.fullTextWrap : ''}`} style={{ position: 'relative', zIndex: 1 }}>
        <div className={`${styles.layoutWrapper} ${styles[`layout-${layoutMode}`]}`}>
          
          {/* Main Column */}
          {layoutMode !== 'full-side' && (
            <div className={styles.mainColumn} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>

        {!activeSpaceId && (
          <CanvasSpacesGrid
            spaces={spaces}
            renamingId={renamingId}
            renameValue={renameValue}
            setRenameValue={setRenameValue}
            commitRename={commitRename}
            startRename={startRename}
            setActivePreviewId={setActivePreviewId}
            onSelectCanvas={handleSpaceEnter}
            handleContextMenu={handleContextMenu}
            openEmojiPicker={openEmojiPicker}
            getChildCount={getChildCount}
            editingDescId={editingDescId}
            descValue={descValue}
            setDescValue={setDescValue}
            commitDescEdit={commitDescEdit}
            startDescEdit={startDescEdit}
            onCreateSpace={() => onCreateItem && onCreateItem('space')}
            showCreateSpace={showCreateSpace}
            onToggleCreateSpace={toggleCreateSpace}
          />
        )}

        {otherItems.length === 0 && spaces.length === 0 && folders.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <FileText size={32} />
            </div>
            <h3 className={styles.emptyTitle}>
              {search ? 'Nenhum item encontrado' : 'Nenhum item ainda'}
            </h3>
            <p className={styles.emptySubtitle}>
              {search
                ? `Não encontramos nada com "${search}". Tente outro termo.`
                : activeSpaceId ? 'Crie sua primeira pasta ou objeto para começar.' : 'Crie seu primeiro espaço ou canvas para começar.'}
            </p>
            {!search && (
              <button className={styles.emptyButton} onClick={() => onCreateItem && onCreateItem(activeSpaceId ? 'folder' : 'space')}>
                <Plus size={18} />
                {activeSpaceId ? 'Criar primeira Pasta' : 'Criar primeiro Espaço'}
              </button>
            )}
            
            {/* Quick Templates for Objects inside a space/folder */}
            {!search && activeSpaceId && (
              <div className={styles.templatesContainer}>
                <h4 className={styles.templatesTitle}>Ou inicie com um modelo:</h4>
                <div className={styles.templatesGrid}>
                  <div className={styles.templateCard} onClick={() => onCreateItem && onCreateItem('page')} style={{ '--item-rgb': '96, 165, 250' } as React.CSSProperties}>
                    <div className={styles.templateIcon}>
                      <FileText size={20} />
                    </div>
                    <div className={styles.templateInfo}>
                      <h5 className={styles.templateName}>Documento de Texto</h5>
                      <p className={styles.templateDesc}>Páginas com Rich Text para anotações, roteiros e SOPs.</p>
                    </div>
                  </div>
                  
                  <div className={styles.templateCard} onClick={() => onCreateItem && onCreateItem('canvas')} style={{ '--item-rgb': '192, 132, 252' } as React.CSSProperties}>
                    <div className={styles.templateIcon}>
                      <LayoutDashboard size={20} />
                    </div>
                    <div className={styles.templateInfo}>
                      <h5 className={styles.templateName}>Quadro Canvas</h5>
                      <p className={styles.templateDesc}>Organização visual de fluxos de contingência, BMs e ideias.</p>
                    </div>
                  </div>
                  
                  <div className={styles.templateCard} onClick={() => onCreateItem && onCreateItem('table')} style={{ '--item-rgb': '74, 222, 128' } as React.CSSProperties}>
                    <div className={styles.templateIcon}>
                      <KanbanSquare size={20} />
                    </div>
                    <div className={styles.templateInfo}>
                      <h5 className={styles.templateName}>CRM / Kanban</h5>
                      <p className={styles.templateDesc}>Gerenciamento de leads de marketing, vendas e tarefas.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {folders.length > 0 && (
          <>
            <h2 className={styles.sectionTitle} style={{ marginTop: activeSpaceId ? '0px' : '24px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
              <FolderOpen size={18} /> Pastas
            </h2>
            {renderItemList(folders)}
          </>
        )}
          </div>
          )}
          
          {/* Resizer */}
          {layoutMode !== 'bottom' && layoutMode !== 'full-main' && layoutMode !== 'full-side' && (
            <div 
              className={styles.columnResizer} 
              onMouseDown={handleResizeDrag}
            />
          )}

          {/* Sidebar Column */}
          {regularItems.length > 0 && layoutMode !== 'full-main' && (
            <div 
               className={styles.sidebarColumn} 
               style={{ 
                 width: layoutMode === 'bottom' || layoutMode === 'full-side' ? '100%' : `${sidebarWidth}px`, 
                 flexShrink: 0, 
                 display: 'flex', 
                 flexDirection: 'column' 
               }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: activeSpaceId ? '0px' : '24px', marginBottom: '16px' }}>
                <h2 className={styles.sectionTitle} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  <FileText size={18} /> {folders.length > 0 || activeSpaceId ? 'Conteúdo' : 'Outros Arquivos'}
                </h2>
                <button onClick={toggleLayoutMode} title="Alternar Layout" style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <Layout size={16} />
                </button>
              </div>
              {renderItemList(regularItems)}
            </div>
          )}
        </div>
      </div>
      </>
      ) : (
        <GlobalOverview 
            canvasList={canvasList} 
            onSelectCanvas={handleItemClick} 
            setActivePreviewId={setActivePreviewId} 
        />
      )}

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div className={styles.contextOverlay} onClick={closeContextMenu} />
          <div
            className={styles.contextMenu}
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              className={styles.contextMenuItem}
              onClick={() => handleMenuAction('rename')}
            >
              <Edit3 size={15} />
              Renomear
            </button>
            <button
              className={styles.contextMenuItem}
              onClick={() => handleMenuAction('duplicate')}
            >
              <Copy size={15} />
              Duplicar
            </button>
            <button
              className={styles.contextMenuItem}
              onClick={() => handleMenuAction('change_cover')}
            >
              <Image size={15} />
              {canvasList.find(c => c.id === contextMenu.id)?.coverImage ? 'Alterar Capa' : 'Inserir Capa'}
            </button>
            <button
              className={styles.contextMenuItem}
              onClick={() => handleMenuAction('change_icon')}
            >
              <Smile size={15} />
              Alterar Ícone
            </button>
            <button
              className={styles.contextMenuItem}
              onClick={() => handleMenuAction('pin')}
            >
              <Lock size={15} />
              Senha PIN
            </button>
            <div className={styles.contextMenuSeparator} />
            <button
              className={`${styles.contextMenuItem} ${styles.contextMenuDanger}`}
              onClick={() => handleMenuAction('delete')}
            >
              <Trash2 size={15} />
              Excluir
            </button>
          </div>
        </>
      )}

      {/* Emoji Picker */}
      {emojiPicker && (
        <>
          <div
            className={styles.emojiPickerOverlay}
            onClick={() => setEmojiPicker(null)}
          />
          <div
            className={styles.emojiPicker}
            style={{ left: emojiPicker.x, top: emojiPicker.y }}
          >
            <div className={styles.emojiPickerTitle}>Escolher ícone</div>
            <div className={styles.emojiGrid}>
              {CANVAS_ICONS.map((iconName) => (
                <button
                  key={iconName}
                  className={styles.emojiBtn}
                  onClick={() => selectEmoji(iconName)}
                >
                  <DynamicIcon name={iconName} size={18} />
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {activePreviewId && previewCanvas && (
        <CanvasPreviewModal
          previewCanvas={previewCanvas}
          previewLayout={previewLayout}
          setActivePreviewId={setActivePreviewId}
          setPreviewLayout={setPreviewLayout}
          openEmojiPicker={openEmojiPicker}
          onRenameCanvas={onRenameCanvas}
          onUpdateCanvasInfo={onUpdateCanvasInfo}
          onSelectCanvas={onSelectCanvas}
          handleAddProperty={handleAddProperty}
          handleUpdatePropertyKey={handleUpdatePropertyKey}
          handleUpdatePropertyValue={handleUpdatePropertyValue}
          handleDeleteProperty={handleDeleteProperty}
          handleUpdateNotes={handleUpdateNotes}
          canvasList={canvasList}
          onMoveCanvasItem={onMoveCanvasItem}
        />
      )}

      {/* Hidden Cover File Input */}
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleCoverFileChange}
      />
      {showMembersManager && (
        <MembersManager onClose={() => setShowMembersManager(false)} />
      )}
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
            onUpdateCanvasInfo(pinSettingsItem.id, { properties: updatedProps });
          }}
          onClose={() => setPinSettingsItem(null)}
        />
      )}
      {/* ── Onboarding Checklist Widget (Floating Pop-up) ── */}
      {!activeSpaceId && !search && !isOnboardingCompleted && (
        isOnboardingDismissed ? (
          <button 
            className={styles.onboardingTriggerFloat}
            onClick={handleShowOnboarding}
            title="Ver checklist de configuração inicial"
          >
            <span className={styles.onboardingTriggerEmoji}>🎯</span>
            <span className={styles.onboardingTriggerBadge}>{completedStepsCount}/{onboardingSteps.length}</span>
          </button>
        ) : (
          <div className={styles.onboardingWidget}>
            <div className={styles.onboardingHeader}>
              <div className={styles.onboardingHeaderInfo} style={{ cursor: 'pointer', userSelect: 'none' }} onClick={toggleOnboardingMinimize}>
                <h3 className={styles.onboardingTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🎯 Configuração da Operação
                  {isOnboardingMinimized ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                </h3>
                {!isOnboardingMinimized && (
                  <p className={styles.onboardingSubtitle}>Complete a trilha para ativar sua contingência de anúncios.</p>
                )}
              </div>
              <button className={styles.onboardingCloseBtn} onClick={handleDismissOnboarding} title="Fechar">
                <X size={14} />
              </button>
            </div>

            {!isOnboardingMinimized && (
              <>
                <div className={styles.onboardingProgressContainer}>
                  <div className={styles.onboardingProgressBar}>
                    <div className={styles.onboardingProgressFill} style={{ width: `${(completedStepsCount / onboardingSteps.length) * 100}%` }} />
                  </div>
                  <span className={styles.onboardingProgressLabel}>{completedStepsCount} de {onboardingSteps.length} concluídas</span>
                </div>

                <div className={styles.onboardingStepsList}>
                  {onboardingSteps.map((step) => (
                    <div 
                      key={step.id} 
                      className={`${styles.onboardingStepItem} ${step.done ? styles.onboardingStepDone : ''}`}
                      onClick={() => {
                        if (step.done) return;
                        switch (step.id) {
                          case 'canvas':
                            onCreateCanvas();
                            break;
                          case 'crm':
                            if (onCreateItem) onCreateItem('table');
                            break;
                          case 'proxy':
                            window.dispatchEvent(new Event('open-proxies-modal'));
                            break;
                          case 'profile':
                            // Navigate to profiles page
                            window.dispatchEvent(new CustomEvent('navigate-to', { detail: '/profiles' }));
                            break;
                        }
                      }}
                      style={{ cursor: step.done ? 'default' : 'pointer' }}
                    >
                      <div className={styles.onboardingStepCheck}>
                        <div className={styles.checkboxCircle}>
                          {step.done && <Check size={10} strokeWidth={3} className={styles.checkIcon} />}
                        </div>
                      </div>
                      <div className={styles.onboardingStepText}>
                        <span className={styles.onboardingStepLabel}>{step.label}</span>
                        <span className={styles.onboardingStepDesc}>{step.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )
      )}
    </div>
  );
};

export default CanvasHome;
