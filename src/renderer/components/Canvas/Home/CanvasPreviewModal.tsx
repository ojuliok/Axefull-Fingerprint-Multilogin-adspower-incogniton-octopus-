import React from 'react';
import { Plus, Trash2, FolderOpen, Maximize2, Minimize2, X } from 'lucide-react';
import { CanvasInfo } from '../canvasStorage';
import { DynamicIcon } from '../CanvasIcons';
import styles from '../CanvasHome.module.css';

interface CanvasPreviewModalProps {
  previewCanvas: CanvasInfo;
  previewLayout: 'center' | 'side';
  setActivePreviewId: (id: string | null) => void;
  setPreviewLayout: (layout: 'center' | 'side' | ((prev: 'center' | 'side') => 'center' | 'side')) => void;
  openEmojiPicker: (e: React.MouseEvent, id: string) => void;
  onRenameCanvas: (id: string, name: string) => void;
  onUpdateCanvasInfo: (id: string, updates: Partial<CanvasInfo>) => void;
  onSelectCanvas: (id: string) => void;
  handleAddProperty: () => void;
  handleUpdatePropertyKey: (oldKey: string, newKey: string) => void;
  handleUpdatePropertyValue: (key: string, value: string) => void;
  handleDeleteProperty: (key: string) => void;
  handleUpdateNotes: (notes: string) => void;
  canvasList?: CanvasInfo[];
  onMoveCanvasItem?: (sourceId: string, targetId: string, position: 'before' | 'after') => void;
}

export const CanvasPreviewModal: React.FC<CanvasPreviewModalProps> = ({
  previewCanvas,
  previewLayout,
  setActivePreviewId,
  setPreviewLayout,
  openEmojiPicker,
  onRenameCanvas,
  onUpdateCanvasInfo,
  onSelectCanvas,
  handleAddProperty,
  handleUpdatePropertyKey,
  handleUpdatePropertyValue,
  handleDeleteProperty,
  handleUpdateNotes,
  canvasList = [],
  onMoveCanvasItem,
}) => {
  const properties = previewCanvas.properties || {};
  const notes = previewCanvas.notes || '';
  const icon = previewCanvas.icon || (previewCanvas.type === 'space' || previewCanvas.type === 'folder' ? 'Folder' : '📋');
  
  const isContainer = previewCanvas.type === 'space' || previewCanvas.type === 'folder';
  const children = canvasList.filter((c) => c.parentId === previewCanvas.id && !c.isDeleted);

  return (
    <div className={`${styles.previewModalContainer} ${previewLayout === 'side' ? styles.previewLayoutSide : styles.previewLayoutCenter}`}>
      <div className={styles.previewBackdrop} onClick={() => setActivePreviewId(null)} />
      <div className={styles.previewPanel}>
        {/* Header */}
        <div className={styles.previewHeader}>
          <div className={styles.previewTitleArea}>
            <span className={styles.previewEmoji} onClick={(e) => openEmojiPicker(e, previewCanvas.id)}>
              <DynamicIcon name={icon} size={22} />
            </span>
            <input
              className={styles.previewTitleInput}
              value={previewCanvas.name}
              onChange={(e) => onRenameCanvas(previewCanvas.id, e.target.value)}
              placeholder="Sem nome"
            />
          </div>
          
          <div className={styles.previewActions}>
            <button 
              className={styles.previewActionBtnPrimary}
              onClick={() => {
                onSelectCanvas(previewCanvas.id);
                setActivePreviewId(null);
              }}
              title="Abrir tela cheia"
            >
              <FolderOpen size={14} />
              <span>Abrir Editor</span>
            </button>

            <button
              className={styles.previewActionBtn}
              onClick={() => setPreviewLayout(prev => prev === 'center' ? 'side' : 'center')}
              title={previewLayout === 'center' ? 'Lateralizar painel' : 'Centralizar painel'}
            >
              {previewLayout === 'center' ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
            </button>

            <button
              className={styles.previewCloseBtn}
              onClick={() => setActivePreviewId(null)}
              title="Fechar"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className={styles.previewBody}>
          {/* Description */}
          <div className={styles.previewSection}>
            <div className={styles.sectionTitle}>Descrição</div>
            <textarea
              className={styles.previewDescTextarea}
              value={previewCanvas.description || ''}
              onChange={(e) => onUpdateCanvasInfo(previewCanvas.id, { description: e.target.value })}
              placeholder="Adicionar descrição..."
              rows={2}
            />
          </div>

          {/* Properties Table */}
          <div className={styles.previewSection}>
            <div className={styles.sectionHeaderRow}>
              <div className={styles.sectionTitle}>Propriedades</div>
              <button className={styles.addPropertyBtn} onClick={handleAddProperty}>
                <Plus size={12} />
                <span>Adicionar propriedade</span>
              </button>
            </div>

            <div className={styles.propertiesTableContainer}>
              {Object.keys(properties).length === 0 ? (
                <div className={styles.propertiesEmptyState} onClick={handleAddProperty}>
                  Clique para adicionar metadados e propriedades personalizadas.
                </div>
              ) : (
                <table className={styles.propertiesTable}>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Valor</th>
                      <th style={{ width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(properties).map(([key, val]) => (
                      <tr key={key}>
                        <td className={styles.propKeyCell}>
                          <input
                            className={styles.propKeyInput}
                            defaultValue={key}
                            onBlur={(e) => handleUpdatePropertyKey(key, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.currentTarget.blur();
                              }
                            }}
                            placeholder="Nome da propriedade"
                          />
                        </td>
                        <td className={styles.propValCell}>
                          <input
                            className={styles.propValInput}
                            value={val}
                            onChange={(e) => handleUpdatePropertyValue(key, e.target.value)}
                            placeholder="Valor"
                          />
                        </td>
                        <td className={styles.propActionCell}>
                          <button
                            className={styles.deletePropBtn}
                            onClick={() => handleDeleteProperty(key)}
                            title="Remover propriedade"
                          >
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Container Contents */}
          {isContainer && (
            <div className={styles.previewSection} style={{ marginTop: '0', marginBottom: '16px', background: 'rgba(244,244,245,0.4)', border: '1px solid #d4d4d8', borderRadius: '12px', padding: '16px' }}>
              <div className={styles.sectionTitle} style={{ color: '#18181b', fontWeight: 600, borderBottom: '1px solid #e4e4e7', paddingBottom: '8px', marginBottom: '12px' }}>Conteúdo</div>
              {children.length === 0 ? (
                <div className={styles.propertiesEmptyState}>
                  Esta pasta está vazia.
                </div>
              ) : (
                <div className={styles.containerChildrenList} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {children.map((child) => (
                    <div 
                      key={child.id} 
                      draggable={!!onMoveCanvasItem}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', child.id);
                        e.currentTarget.style.opacity = '0.5';
                      }}
                      onDragEnd={(e) => {
                        e.currentTarget.style.opacity = '1';
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.style.borderTop = '2px solid #8B5CF6';
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.style.borderTop = '1px solid rgba(0,0,0,0.05)';
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.style.borderTop = '1px solid rgba(0,0,0,0.05)';
                        const sourceId = e.dataTransfer.getData('text/plain');
                        if (sourceId && sourceId !== child.id && onMoveCanvasItem) {
                          onMoveCanvasItem(sourceId, child.id, 'before');
                        }
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#ffffff', borderRadius: '6px', cursor: 'grab', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}
                      onClick={() => {
                        onSelectCanvas(child.id);
                        setActivePreviewId(null);
                      }}
                    >
                      <DynamicIcon name={child.icon || (child.type === 'space' || child.type === 'folder' ? 'Folder' : child.type === 'page' ? 'FileText' : child.type === 'table' ? 'KanbanSquare' : 'LayoutDashboard')} size={16} />
                      <span style={{ fontSize: '13px', fontWeight: 500, color: '#3f3f46' }}>{child.name}</span>
                      <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#a1a1aa', textTransform: 'capitalize', background: '#f4f4f5', padding: '2px 6px', borderRadius: '4px' }}>
                        {child.type}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Notes Section */}
          <div className={styles.previewSection} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className={styles.sectionTitle}>Notas / Registro de Informações</div>
            <textarea
              className={styles.previewNotesTextarea}
              value={notes}
              onChange={(e) => handleUpdateNotes(e.target.value)}
              placeholder="Escreva anotações, atas de reunião, links importantes..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};
