import React from 'react';
import { MoreHorizontal, Layers, Folder, Plus } from 'lucide-react';
import { CanvasInfo } from '../canvasStorage';
import { DynamicIcon, getDefaultIconForType } from '../CanvasIcons';
import styles from './CanvasSpaces.module.css';

interface CanvasSpacesGridProps {
  spaces: CanvasInfo[];
  renamingId: string | null;
  renameValue: string;
  setRenameValue: (val: string) => void;
  commitRename: () => void;
  startRename: (id: string, name: string) => void;
  setActivePreviewId: (id: string) => void;
  onSelectCanvas: (id: string) => void;
  handleContextMenu: (e: React.MouseEvent, id: string) => void;
  openEmojiPicker: (e: React.MouseEvent, id: string) => void;
  getChildCount: (id: string) => number;
  editingDescId: string | null;
  descValue: string;
  setDescValue: (val: string) => void;
  commitDescEdit: () => void;
  startDescEdit: (id: string, desc: string) => void;
  onCreateSpace?: () => void;
}

export const CanvasSpacesGrid: React.FC<CanvasSpacesGridProps> = ({
  spaces,
  renamingId, renameValue, setRenameValue, commitRename, startRename,
  setActivePreviewId, onSelectCanvas, handleContextMenu, openEmojiPicker,
  getChildCount,
  editingDescId, descValue, setDescValue, commitDescEdit, startDescEdit,
  onCreateSpace
}) => {

  return (
    <div style={{ marginBottom: '32px' }}>
      <h2 className={styles.sectionTitle}>
        <Folder size={18} /> Meus Espaços
      </h2>
      <div className={styles.spacesGrid}>
        {spaces.map((space) => {
          const childCount = getChildCount(space.id);
          const icon = space.icon || getDefaultIconForType(space.type);
          
          // Generate a background color based on coverPosition or fallback to default
          const hasColor = space.color && space.color.trim() !== '';
          const gradientColor = hasColor ? `rgba(${space.color}, 1)` : '#a1a1aa';

          return (
            <div
              key={space.id}
              className={styles.folderCard}
              onClick={() => !renamingId && setActivePreviewId(space.id)}
              onContextMenu={(e) => handleContextMenu(e, space.id)}
              onDoubleClick={(e) => {
                  e.stopPropagation();
                  startRename(space.id, space.name);
              }}
            >
              {/* The "Tab" of the folder */}
              <div className={styles.folderTab}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#71717a' }}>Espaço</span>
              </div>

              {/* The main body of the folder */}
              <div className={styles.folderBody}>
                <div 
                  className={styles.folderCoverGradient} 
                  style={{ background: `linear-gradient(135deg, ${gradientColor} 0%, transparent 100%)` }}
                />

                <div className={styles.folderHeader}>
                  <div
                    className={styles.folderIcon}
                    onClick={(e) => { e.stopPropagation(); openEmojiPicker(e, space.id); }}
                    title="Alterar ícone"
                    style={hasColor ? { color: gradientColor } : {}}
                  >
                    <DynamicIcon name={icon} size={22} />
                  </div>
                  
                  <button
                    className={styles.folderMoreBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContextMenu(e, space.id);
                    }}
                  >
                    <MoreHorizontal size={16} />
                  </button>
                </div>

                <div>
                  {renamingId === space.id ? (
                    <input
                      autoFocus
                      className={styles.folderName}
                      style={{ width: '100%', border: '1px solid #e4e4e7', borderRadius: '4px', padding: '2px 4px', fontSize: '16px', fontWeight: 600, marginTop: '12px' }}
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
                    <h3 className={styles.folderName}>{space.name}</h3>
                  )}

                  {editingDescId === space.id ? (
                    <textarea
                      autoFocus
                      className={styles.folderDescription}
                      style={{ width: '100%', border: '1px solid #e4e4e7', borderRadius: '4px', padding: '4px', fontSize: '13px', resize: 'none', background: 'transparent' }}
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
                      rows={2}
                    />
                  ) : (
                    <p
                      className={styles.folderDescription}
                      onClick={(e) => {
                        e.stopPropagation();
                        startDescEdit(space.id, space.description || '');
                      }}
                    >
                      {space.description || 'Adicionar descrição do espaço...'}
                    </p>
                  )}
                </div>

                <div className={styles.folderFooter}>
                  <div className={styles.folderMeta}>
                    <Layers size={14} />
                    {childCount} {childCount === 1 ? 'item' : 'itens'}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Card for creating a new space directly in the grid */}
        {onCreateSpace && (
          <div className={styles.createFolderCard} onClick={onCreateSpace}>
            <div className={styles.createFolderTab}></div>
            <div className={styles.createFolderBody}>
              <div className={styles.createFolderIcon}>
                <Plus size={24} />
              </div>
              <h3 className={styles.createFolderName}>Criar Espaço</h3>
              <p className={styles.createFolderDescription}>Novo ambiente de trabalho</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
