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
  MessageSquare,
  Maximize2,
  Minimize2,
  X,
  LayoutDashboard,
  KanbanSquare,
  FolderPlus,
  Eye,
  EyeOff,
  Box
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
import { MembersManager } from './MembersManager';
import styles from './CanvasHome.module.css';

// ─── Props ───────────────────────────────────────────
interface CanvasHomeProps {
  canvasList: CanvasInfo[];
  onSelectCanvas: (id: string) => void;
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

  // ── Space Entrance Animation ──
  const [isEnteringSpace, setIsEnteringSpace] = useState<boolean>(false);

  const handleSpaceEnter = useCallback((id: string) => {
    setIsEnteringSpace(true);
    setTimeout(() => {
      onSelectCanvas(id);
      setIsEnteringSpace(false);
    }, 1000);
  }, [onSelectCanvas]);
  const [showMembersManager, setShowMembersManager] = useState(false);
  
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
    return getCanvasData(id)?.nodes?.length || 0;
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
    (action: 'rename' | 'duplicate' | 'delete' | 'change_cover' | 'change_icon') => {
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
        <div className={styles.workspaceHeaderTop}>
          <div className={styles.workspaceIcon}>
            {activeSpace?.icon ? (
              <DynamicIcon name={activeSpace.icon} size={24} />
            ) : (
              'Á'
            )}
            <div className={styles.workspaceIconBadge}>
              <Home size={12} />
            </div>
          </div>
          <div className={styles.workspaceTitleArea}>
            <div className={styles.workspaceTitleRow}>
              <h1>{activeSpace ? activeSpace.name : 'Área de trabalho principal'}</h1>
              <ChevronDown size={18} className="text-theme-text-muted" />
            </div>
            <p className={styles.workspaceSubtitle}>
              {activeSpace?.description || (activeSpace ? 'Espaço de trabalho' : 'Adicionar descrição da área de trabalho')}
            </p>
        </div>

        {/* Desktop Workspace Actions */}
        <div className={styles.workspaceActions}>
          <button className={styles.workspaceActionBtn}>
            <MessageSquare size={14} /> Feedback
          </button>
          <button className={styles.workspaceActionBtn}>
            <Users size={14} /> Agentes
          </button>
          <button className={styles.workspaceActionBtn} onClick={() => setShowMembersManager(true)}>
            Membros
          </button>
          <button className={styles.workspaceActionBtn} style={{ padding: '6px' }}>
            <MoreHorizontal size={16} />
          </button>
        </div>

        {/* Mobile-only compact actions */}
        <div className={styles.workspaceHeaderMobileActions}>
          <button className={styles.workspaceActionBtn} style={{ padding: '6px' }}>
            <MoreHorizontal size={16} />
          </button>
        </div>
        </div>

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
      <div className={styles.content} style={{ position: 'relative', zIndex: 1 }}>
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
          />
        )}

        {otherItems.length === 0 && spaces.length === 0 && folders.length === 0 ? (
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
            {/* Highlight Criar Objeto when inside a folder/space */}
            {!search && activeSpaceId && (
              <button className={styles.workspaceActionBtn} style={{ marginTop: '12px', justifyContent: 'center', padding: '10px 16px', background: 'transparent', border: '1px solid #e5e7eb', color: '#6b7280', fontSize: '14px' }} onClick={() => onCreateItem && onCreateItem('page')}>
                <Plus size={16} /> Criar Objeto
              </button>
            )}
          </div>
        ) : (folders.length > 0 || regularItems.length > 0) && (
          <>
            {folders.length > 0 && (
              <>
                <h2 className={styles.sectionTitle} style={{ marginTop: activeSpaceId ? '0px' : '24px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  <FolderOpen size={18} /> Pastas
                </h2>
                {renderItemList(folders)}
              </>
            )}
            
            {regularItems.length > 0 && (
              <>
                <h2 className={styles.sectionTitle} style={{ marginTop: '24px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  <FileText size={18} /> {folders.length > 0 || activeSpaceId ? 'Conteúdo' : 'Outros Arquivos'}
                </h2>
                {renderItemList(regularItems)}
              </>
            )}
          </>
        )}
      </div>
      </>
      ) : (
        <div className={styles.content}>
          <div className={styles.emptyState}>
             <div className={styles.emptyIcon}>
              <Layout size={32} />
            </div>
            <h3 className={styles.emptyTitle}>
              {activeTab} em construção
            </h3>
            <p className={styles.emptySubtitle}>
              Esta área está reservada para futuras funcionalidades da área de trabalho.
            </p>
          </div>
        </div>
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
    </div>
  );
};

export default CanvasHome;
