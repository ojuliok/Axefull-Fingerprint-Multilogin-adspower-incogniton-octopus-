import React from 'react';
import { Star, FolderOpen, MoreHorizontal } from 'lucide-react';
import { CanvasInfo } from '../canvasStorage';
import { DynamicIcon } from '../CanvasIcons';
import styles from '../CanvasHome.module.css';

interface CanvasListViewProps {
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
  favorites: Record<string, boolean>;
  toggleFavorite: (e: React.MouseEvent, id: string) => void;
}

const getTypeLabel = (type: string | undefined) => {
  switch (type) {
    case 'canvas': return { label: 'Canvas', color: '#8B5CF6' };
    case 'page': return { label: 'Página', color: '#3B82F6' };
    case 'table': return { label: 'CRM', color: '#10B981' };
    case 'folder': return { label: 'Pasta', color: '#6B7280' };
    default: return { label: 'Canvas', color: '#8B5CF6' }; // Default to canvas if undefined for legacy items
  }
};

export const CanvasListView: React.FC<CanvasListViewProps> = ({
  filteredCanvases, renamingId, renameValue, setRenameValue, commitRename, startRename,
  setActivePreviewId, handleContextMenu, onSelectCanvas, openEmojiPicker, favorites, toggleFavorite
}) => {
  return (
    <div className={styles.list}>
      {filteredCanvases.map((canvas) => {
        const icon = canvas.icon || '📋';

        return (
          <div
            key={canvas.id}
            className={styles.listCard}
            onClick={() => !renamingId && setActivePreviewId(canvas.id)}
            onContextMenu={(e) => handleContextMenu(e, canvas.id)}
            onDoubleClick={() => startRename(canvas.id, canvas.name)}
          >
            <div
              className={styles.listCardIcon}
              onClick={(e) => { e.stopPropagation(); openEmojiPicker(e, canvas.id); }}
            >
              <DynamicIcon name={icon} size={16} />
            </div>

            <div className={styles.listCardBody}>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1, overflow: 'hidden' }}>
                  <div className={styles.listCardName} title={canvas.name}>{canvas.name}</div>
                  <span style={{
                    flexShrink: 0,
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: `${getTypeLabel(canvas.type).color}15`,
                    color: getTypeLabel(canvas.type).color,
                    border: `1px solid ${getTypeLabel(canvas.type).color}30`
                  }}>
                    {getTypeLabel(canvas.type).label}
                  </span>
                </div>
              )}
            </div>

            <button
              className={`${styles.favoriteBtn} ${favorites[canvas.id] ? styles.favoriteBtnActive : ''}`}
              onClick={(e) => toggleFavorite(e, canvas.id)}
            >
              <Star size={16} fill={favorites[canvas.id] ? '#fbbf24' : 'none'} />
            </button>

            <button
              className={styles.listCardMoreBtn}
              onClick={(e) => {
                e.stopPropagation();
                onSelectCanvas(canvas.id);
              }}
              style={{ marginRight: '4px' }}
              title="Abrir editor diretamente"
            >
              <FolderOpen size={14} />
            </button>

            <button
              className={styles.listCardMoreBtn}
              onClick={(e) => {
                e.stopPropagation();
                handleContextMenu(e, canvas.id);
              }}
            >
              <MoreHorizontal size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
