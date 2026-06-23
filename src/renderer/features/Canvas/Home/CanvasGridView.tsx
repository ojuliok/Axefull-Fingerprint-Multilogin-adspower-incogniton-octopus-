import React from 'react';
import { Calendar, Layers, FileText, FolderOpen, MoreHorizontal, ImagePlus, Move, Star } from 'lucide-react';
import { CanvasInfo } from '../canvasStorage';
import { DynamicIcon, getDefaultIconForType } from '../CanvasIcons';
import styles from '../CanvasHome.module.css';

interface CanvasGridViewProps {
  filteredCanvases: CanvasInfo[];
  renamingId: string | null;
  renameValue: string;
  setRenameValue: (val: string) => void;
  commitRename: () => void;
  startRename: (id: string, name: string) => void;
  setActivePreviewId: (id: string) => void;
  handleContextMenu: (e: React.MouseEvent, id: string) => void;
  onSelectCanvas: (id: string) => void;
  openEmojiPicker: (e: React.MouseEvent, id: string) => void;
  getChildCount: (id: string) => number;
  getNodeCount: (id: string) => number;
  formatDate: (ts: number) => string;
  
  // Grid specific
  repositioningId: string | null;
  tempPosition: number;
  handleRepositionStart: (e: React.MouseEvent<HTMLDivElement>, canvasId: string, currentPos: number) => void;
  startReposition: (id: string, currentPos: number) => void;
  saveReposition: (id: string) => void;
  cancelReposition: () => void;
  triggerCoverUpload: (id: string) => void;
  favorites: Record<string, boolean>;
  toggleFavorite: (e: React.MouseEvent, id: string) => void;
  editingDescId: string | null;
  descValue: string;
  setDescValue: (val: string) => void;
  commitDescEdit: () => void;
  startDescEdit: (id: string, desc: string) => void;
}

const getTypeLabel = (type: string | undefined) => {
  switch (type) {
    case 'canvas': return { label: 'Canvas', color: '#8B5CF6' };
    case 'page': return { label: 'Página', color: '#3B82F6' };
    case 'table': return { label: 'CRM', color: '#10B981' };
    case 'folder': return { label: 'Pasta', color: '#6B7280' };
    default: return { label: 'Canvas', color: '#8B5CF6' };
  }
};

export const CanvasGridView: React.FC<CanvasGridViewProps> = ({
  filteredCanvases, renamingId, renameValue, setRenameValue, commitRename, startRename,
  setActivePreviewId, handleContextMenu, onSelectCanvas, openEmojiPicker,
  getChildCount, getNodeCount, formatDate,
  repositioningId, tempPosition, handleRepositionStart, startReposition, saveReposition, cancelReposition,
  triggerCoverUpload, favorites, toggleFavorite,
  editingDescId, descValue, setDescValue, commitDescEdit, startDescEdit
}) => {
  return (
    <div className={styles.grid}>
      {filteredCanvases.map((canvas) => {
        const childCount = getChildCount(canvas.id);
        const nodeCount = getNodeCount(canvas.id);
        const isContainer = canvas.type === 'folder' || canvas.type === 'space';
        const icon = canvas.icon || getDefaultIconForType(canvas.type);
        const hasColor = canvas.color && canvas.color.trim() !== '';
        const isRepositioning = repositioningId === canvas.id;

        return (
          <div
            key={canvas.id}
            className={styles.card}
            onClick={() => !renamingId && !isRepositioning && setActivePreviewId(canvas.id)}
            onContextMenu={(e) => !isRepositioning && handleContextMenu(e, canvas.id)}
            onDoubleClick={() => !isRepositioning && startRename(canvas.id, canvas.name)}
          >
            {/* Cover Wrapper */}
            <div
              className={styles.cardCoverWrapper}
              onMouseDown={isRepositioning ? (e) => handleRepositionStart(e, canvas.id, canvas.coverPosition ?? 50) : undefined}
              style={{ cursor: isRepositioning ? 'ns-resize' : 'default' }}
            >
              {canvas.coverImage ? (
                <img
                  src={canvas.coverImage}
                  alt=""
                  className={styles.cardCover}
                  style={{
                    objectPosition: `center ${isRepositioning ? tempPosition : (canvas.coverPosition ?? 50)}%`
                  }}
                />
              ) : (
                <div className={styles.cardCoverPlaceholder}>
                  <div className={styles.cardCoverPattern} />
                </div>
              )}

              {/* Overlays */}
              {isRepositioning ? (
                <div className={styles.repositionOverlay}>
                  <span className={styles.repositionText}>Arraste para ajustar verticalmente</span>
                </div>
              ) : (
                <div className={styles.coverEditOverlay} onClick={(e) => e.stopPropagation()}>
                  <button
                    className={styles.coverEditBtn}
                    onClick={() => triggerCoverUpload(canvas.id)}
                  >
                    <ImagePlus size={14} />
                    <span>{canvas.coverImage ? 'Alterar Capa' : 'Adicionar Capa'}</span>
                  </button>
                  {canvas.coverImage && (
                    <button
                      className={styles.coverRepositionBtn}
                      onClick={() => startReposition(canvas.id, canvas.coverPosition ?? 50)}
                    >
                      <Move size={12} />
                      <span>Reposicionar</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Icon */}
            <div className={styles.cardIconWrapper}>
              <div
                className={styles.cardIcon}
                onClick={(e) => !isRepositioning && openEmojiPicker(e, canvas.id)}
                title="Alterar ícone"
              >
                <DynamicIcon name={icon} size={20} />
              </div>
            </div>

            {/* Favorite & More Button */}
            <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 3, display: 'flex', gap: 6, opacity: 0, transition: 'opacity 0.2s ease' }} className="gridActions">
              <button
                className={styles.favoriteBtn}
                style={{ width: 28, height: 28, background: 'rgba(255,255,255,0.9)', border: '1px solid #e5e7eb', color: '#4b5563', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={(e) => { e.stopPropagation(); onSelectCanvas(canvas.id); }}
                title="Abrir editor diretamente"
              >
                <FolderOpen size={14} />
              </button>
              <button
                className={`${styles.favoriteBtn} ${favorites[canvas.id] ? styles.favoriteBtnActive : ''}`}
                style={{ width: 28, height: 28, background: 'rgba(255,255,255,0.9)', border: '1px solid #e5e7eb', color: favorites[canvas.id] ? '#fbbf24' : '#4b5563' }}
                onClick={(e) => toggleFavorite(e, canvas.id)}
              >
                <Star size={15} fill={favorites[canvas.id] ? '#fbbf24' : 'none'} />
              </button>
              {!isRepositioning && (
                <button
                  className={styles.cardMoreBtn}
                  style={{ position: 'static', opacity: 1 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContextMenu(e, canvas.id);
                  }}
                >
                  <MoreHorizontal size={16} />
                </button>
              )}
            </div>
            <style>{`.${styles.card}:hover .gridActions { opacity: 1 !important; }`}</style>

            {/* Body */}
            <div className={styles.cardBody}>
              {renamingId === canvas.id ? (
                <input
                  autoFocus
                  className={styles.renameInput}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename();
                    if (e.key === 'Escape') setRenameValue('');
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <h3 className={styles.cardName} style={{ margin: 0 }}>{canvas.name}</h3>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: '8px',
                    backgroundColor: `${getTypeLabel(canvas.type).color}15`,
                    color: getTypeLabel(canvas.type).color,
                    border: `1px solid ${getTypeLabel(canvas.type).color}30`
                  }}>
                    {getTypeLabel(canvas.type).label}
                  </span>
                </div>
              )}

              {editingDescId === canvas.id ? (
                <textarea
                  autoFocus
                  className={styles.descriptionInput}
                  value={descValue}
                  onChange={(e) => setDescValue(e.target.value)}
                  onBlur={commitDescEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      commitDescEdit();
                    }
                    if (e.key === 'Escape') setDescValue('');
                  }}
                  onClick={(e) => e.stopPropagation()}
                  rows={1}
                />
              ) : (
                <p
                  className={styles.cardDescription}
                  onClick={(e) => {
                    e.stopPropagation();
                    startDescEdit(canvas.id, canvas.description || '');
                  }}
                >
                  {canvas.description || 'Adicionar descrição...'}
                </p>
              )}

              <div className={styles.cardMeta}>
                <span className={styles.cardMetaItem}>
                  <Calendar size={12} />
                  {formatDate(canvas.updatedAt)}
                </span>
                {childCount > 0 && (
                  <span className={styles.cardMetaItem}>
                    <Layers size={12} />
                    {childCount}
                  </span>
                )}
                <span className={styles.cardMetaItem}>
                  <FileText size={12} />
                  {nodeCount}
                </span>
              </div>
            </div>

            {/* Reposition Mode Controls */}
            {isRepositioning && (
              <div className={styles.repositionControls} onClick={(e) => e.stopPropagation()}>
                <button className={styles.repositionBtnSave} onClick={() => saveReposition(canvas.id)}>
                  Salvar
                </button>
                <button className={styles.repositionBtnCancel} onClick={cancelReposition}>
                  Cancelar
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
