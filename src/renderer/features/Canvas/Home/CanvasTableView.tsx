import React, { useState, useMemo } from 'react';
import { MoreHorizontal, FolderOpen, ArrowDown, ArrowUp } from 'lucide-react';
import { CanvasInfo } from '../canvasStorage';
import { DynamicIcon, getDefaultIconForType } from '../CanvasIcons';
import styles from '../CanvasHome.module.css';

interface CanvasTableViewProps {
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
}

type SortColumn = 'name' | 'description' | 'updatedAt' | 'childCount' | 'nodeCount' | string;
type SortDirection = 'asc' | 'desc';

export const CanvasTableView: React.FC<CanvasTableViewProps> = ({
  filteredCanvases,
  renamingId,
  renameValue,
  setRenameValue,
  commitRename,
  startRename,
  setActivePreviewId,
  handleContextMenu,
  onSelectCanvas,
  openEmojiPicker,
  getChildCount,
  getNodeCount,
  formatDate,
}) => {
  const [sortColumn, setSortColumn] = useState<SortColumn>('updatedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // 1. Extract all unique dynamic property keys from the entire filtered canvas list
  const dynamicPropertyKeys = useMemo(() => {
    const keys = new Set<string>();
    filteredCanvases.forEach(canvas => {
      if (canvas.properties) {
        Object.keys(canvas.properties).forEach(key => keys.add(key));
      }
    });
    return Array.from(keys);
  }, [filteredCanvases]);

  // 2. Sort the canvases based on the active sort column
  const sortedCanvases = useMemo(() => {
    return [...filteredCanvases].sort((a, b) => {
      let valA: any;
      let valB: any;

      if (sortColumn === 'name') { valA = a.name.toLowerCase(); valB = b.name.toLowerCase(); }
      else if (sortColumn === 'description') { valA = (a.description || '').toLowerCase(); valB = (b.description || '').toLowerCase(); }
      else if (sortColumn === 'updatedAt') { valA = a.updatedAt; valB = b.updatedAt; }
      else if (sortColumn === 'childCount') { valA = getChildCount(a.id); valB = getChildCount(b.id); }
      else if (sortColumn === 'nodeCount') { valA = getNodeCount(a.id); valB = getNodeCount(b.id); }
      else {
        // It's a dynamic property
        valA = (a.properties?.[sortColumn] || '').toLowerCase();
        valB = (b.properties?.[sortColumn] || '').toLowerCase();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredCanvases, sortColumn, sortDirection, getChildCount, getNodeCount]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />;
  };

  return (
    <div style={{ overflowX: 'auto', width: '100%', paddingBottom: '20px' }}>
      <table className={styles.table}>
        <thead className={styles.tableHeader}>
          <tr>
            <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Nome {renderSortIcon('name')}</div>
            </th>
            <th onClick={() => handleSort('description')} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Descrição {renderSortIcon('description')}</div>
            </th>
            
            {/* Dynamic Columns rendered here */}
            {dynamicPropertyKeys.map(key => (
              <th key={key} onClick={() => handleSort(key)} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {key} {renderSortIcon(key)}
                </div>
              </th>
            ))}

            <th onClick={() => handleSort('updatedAt')} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Atualizado {renderSortIcon('updatedAt')}</div>
            </th>
            <th onClick={() => handleSort('childCount')} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Sub-páginas {renderSortIcon('childCount')}</div>
            </th>
            <th onClick={() => handleSort('nodeCount')} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Nós {renderSortIcon('nodeCount')}</div>
            </th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {sortedCanvases.map((canvas) => {
            const childCount = getChildCount(canvas.id);
            const nodeCount = getNodeCount(canvas.id);
            const isContainer = canvas.type === 'folder' || canvas.type === 'space';
            const icon = canvas.icon || getDefaultIconForType(canvas.type);

            return (
              <tr
                key={canvas.id}
                className={styles.tableRow}
                onClick={() => !renamingId && setActivePreviewId(canvas.id)}
                onContextMenu={(e) => handleContextMenu(e, canvas.id)}
                onDoubleClick={() => startRename(canvas.id, canvas.name)}
              >
                <td>
                  <div className={styles.tableNameCell}>
                    <span
                      className={styles.tableIcon}
                      onClick={(e) => { e.stopPropagation(); openEmojiPicker(e, canvas.id); }}
                    >
                      <DynamicIcon name={icon} size={14} />
                    </span>
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
                      <span className={styles.tableName}>{canvas.name}</span>
                    )}
                  </div>
                </td>
                <td>{canvas.description || '—'}</td>

                {/* Dynamic Columns Data rendered here */}
                {dynamicPropertyKeys.map(key => (
                  <td key={key} style={{ color: 'var(--text-primary)' }}>
                    {canvas.properties?.[key] || '—'}
                  </td>
                ))}

                <td>{formatDate(canvas.updatedAt)}</td>
                <td>{childCount}</td>
                <td>{nodeCount}</td>
                <td style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <button
                    className={styles.tableMoreBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCanvas(canvas.id);
                    }}
                    title="Abrir editor diretamente"
                  >
                    <FolderOpen size={14} />
                  </button>
                  <button
                    className={styles.tableMoreBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContextMenu(e, canvas.id);
                    }}
                  >
                    <MoreHorizontal size={15} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
