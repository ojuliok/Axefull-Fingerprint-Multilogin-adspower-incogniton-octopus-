import React, { useMemo, useState } from 'react';
import { CanvasInfo } from './canvasStorage';
import { 
    ChevronRight, ChevronDown, FolderOpen, FileText, LayoutDashboard, 
    KanbanSquare, Box
} from 'lucide-react';
import styles from './GlobalOverview.module.css';

interface GlobalOverviewProps {
    canvasList: CanvasInfo[];
    onSelectCanvas: (id: string) => void;
    setActivePreviewId: (id: string | null) => void;
}

export const GlobalOverview: React.FC<GlobalOverviewProps> = ({ 
    canvasList, 
    onSelectCanvas, 
    setActivePreviewId 
}) => {
    const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

    const toggleExpand = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // Build hierarchy
    const spaces = useMemo(() => {
        const notDeleted = canvasList.filter(c => !c.isDeleted);
        const topLevelSpaces = notDeleted.filter(c => c.type === 'space' && !c.parentId);
        
        return topLevelSpaces.sort((a, b) => b.updatedAt - a.updatedAt);
    }, [canvasList]);

    const getChildren = (parentId: string) => {
        return canvasList
            .filter(c => c.parentId === parentId && !c.isDeleted)
            .sort((a, b) => {
                // Folders first
                if (a.type === 'folder' && b.type !== 'folder') return -1;
                if (b.type === 'folder' && a.type !== 'folder') return 1;
                return b.updatedAt - a.updatedAt;
            });
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'space': return <Box size={16} className={styles.iconYellow} />;
            case 'folder': return <FolderOpen size={16} className={styles.iconGray} />;
            case 'canvas': return <LayoutDashboard size={16} className={styles.iconPurple} />;
            case 'page': return <FileText size={16} className={styles.iconBlue} />;
            case 'table': return <KanbanSquare size={16} className={styles.iconGreen} />;
            default: return <FileText size={16} className={styles.iconGray} />;
        }
    };

    const renderItem = (item: CanvasInfo, depth: number = 0, visited: Set<string> = new Set()) => {
        if (visited.has(item.id)) {
            return null; // Cycle prevention
        }
        const nextVisited = new Set(visited);
        nextVisited.add(item.id);

        const children = getChildren(item.id);
        const hasChildren = children.length > 0;
        const isExpanded = expandedIds[item.id];
        const isContainer = item.type === 'space' || item.type === 'folder';

        return (
            <div key={item.id} className={styles.treeNode}>
                <div 
                    className={styles.itemRow} 
                    style={{ paddingLeft: `${depth * 24}px` }}
                    onClick={() => {
                        if (isContainer) {
                            setExpandedIds(prev => ({ ...prev, [item.id]: !prev[item.id] }));
                        } else {
                            onSelectCanvas(item.id);
                        }
                    }}
                    onMouseEnter={() => {
                        if (!isContainer) setActivePreviewId(item.id);
                    }}
                    onMouseLeave={() => {
                        if (!isContainer) setActivePreviewId(null);
                    }}
                >
                    <div className={styles.itemExpander} onClick={(e) => hasChildren && toggleExpand(item.id, e)}>
                        {hasChildren ? (
                            isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                        ) : (
                            <span style={{ width: 14 }} /> // spacer
                        )}
                    </div>
                    <div className={styles.itemIcon}>
                        {getIcon(item.type)}
                    </div>
                    <div className={styles.itemName}>
                        {item.name}
                    </div>
                    <div className={styles.itemMeta}>
                        <span className={styles.itemType}>{item.type === 'table' ? 'CRM' : item.type}</span>
                    </div>
                </div>

                {isExpanded && hasChildren && (
                    <div className={styles.childrenContainer}>
                        {children.map(child => renderItem(child, depth + 1, nextVisited))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={styles.overviewContainer}>
            <div className={styles.overviewHeader}>
                <h2 className={styles.overviewTitle}>
                    <LayoutDashboard size={20} />
                    Visão Geral
                </h2>
                <p className={styles.overviewSubtitle}>
                    Visualize todos os seus espaços, pastas e objetos de forma hierárquica. Passe o mouse sobre os itens para uma pré-visualização.
                </p>
            </div>
            
            <div className={styles.treeContainer}>
                {spaces.length > 0 ? (
                    spaces.map(space => renderItem(space))
                ) : (
                    <div className={styles.emptyState}>
                        <Box size={24} />
                        <p>Nenhum espaço criado ainda.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
