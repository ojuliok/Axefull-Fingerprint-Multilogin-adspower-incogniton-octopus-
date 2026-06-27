import React from 'react';
import * as Lucide from 'lucide-react';
import { Trash2, Lock, Unlock } from 'lucide-react';
import { useCanvasContext } from '../hooks/CanvasContext';
import styles from '../InfiniteCanvas.module.css';

interface CanvasPropertiesPanelProps {
    isPropSidebarMinimized: boolean;
    setIsPropSidebarMinimized: (v: boolean) => void;
    lockAllSelected: (lock: boolean) => void;
    deleteSelectedElements: (ids: Set<string>) => void;
}

export const CanvasPropertiesPanel: React.FC<CanvasPropertiesPanelProps> = ({
    isPropSidebarMinimized,
    setIsPropSidebarMinimized,
    lockAllSelected,
    deleteSelectedElements
}) => {
    const {
        nodes,
        selectedIds,
        strokes,
        viewport,
        currentStrokeColor, setCurrentStrokeColor,
        currentStrokeWidth, setCurrentStrokeWidth,
        currentStrokeStyle, setCurrentStrokeStyle,
        currentFillColor, setCurrentFillColor,
        currentShapeRoughness, setCurrentShapeRoughness,
        saveData, setNodes
    } = useCanvasContext();

    const selectedNodes = nodes.filter(n => selectedIds.has(n.id));
    const selectedShapes = selectedNodes.filter(n => n.type === 'shape');
    const selectedTexts = selectedNodes.filter(n => n.type === 'freetext' || n.type === 'text');
    
    if (selectedShapes.length === 0 && selectedTexts.length === 0) return null;

    const hasShapes = selectedShapes.length > 0;

    const borderColors = [
        { value: '#a78bfa', label: 'Roxo' },
        { value: '#3b82f6', label: 'Azul' },
        { value: '#10b981', label: 'Verde' },
        { value: '#f59e0b', label: 'Laranja' },
        { value: '#ef4444', label: 'Vermelho' },
        { value: '#e2e8f0', label: 'Branco' },
        { value: '#000000', label: 'Preto' }
    ];

    const fillColors = [
        { value: 'transparent', label: 'Nenhum' },
        { value: 'rgba(167, 139, 250, 0.22)', label: 'Roxo' },
        { value: 'rgba(59, 130, 246, 0.22)', label: 'Azul' },
        { value: 'rgba(16, 185, 129, 0.22)', label: 'Verde' },
        { value: 'rgba(245, 158, 11, 0.22)', label: 'Laranja' },
        { value: 'rgba(239, 68, 68, 0.22)', label: 'Vermelho' },
        { value: 'rgba(255, 255, 255, 0.15)', label: 'Branco' }
    ];

    const updateProp = (key: string, val: any) => {
        setNodes(prev => {
            const updated = prev.map(n => {
                if (selectedIds.has(n.id)) {
                    return { ...n, [key]: val };
                }
                return n;
            });
            saveData(updated, strokes, viewport);
            return updated;
        });
        
        if (key === 'color') setCurrentStrokeColor(val);
        if (key === 'shapeStrokeWidth') setCurrentStrokeWidth(val);
        if (key === 'shapeStrokeStyle') setCurrentStrokeStyle(val);
        if (key === 'shapeFillColor') setCurrentFillColor(val);
        if (key === 'shapeRoughness') setCurrentShapeRoughness(val);
    };

    return (
        <div className={`${styles.propertiesSidebar} ${isPropSidebarMinimized ? styles.propertiesSidebarMinimized : ''}`} onMouseDown={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isPropSidebarMinimized ? '0' : '8px', width: '100%' }}>
                {!isPropSidebarMinimized && <span className={styles.propTitle} style={{ margin: 0 }}>Configurações</span>}
                <button 
                    className={styles.propBtn}
                    style={{ width: isPropSidebarMinimized ? '100%' : '32px', border: isPropSidebarMinimized ? '1px solid rgba(139,92,246,0.3)' : 'none', background: isPropSidebarMinimized ? 'rgba(139,92,246,0.1)' : 'transparent' }}
                    onClick={(e) => { e.stopPropagation(); setIsPropSidebarMinimized(!isPropSidebarMinimized); }}
                    title={isPropSidebarMinimized ? "Abrir configurações do objeto" : "Minimizar configurações"}
                >
                    <Lucide.Settings size={isPropSidebarMinimized ? 20 : 16} color={isPropSidebarMinimized ? '#c4b5fd' : '#94a3b8'} />
                </button>
            </div>
            
            {!isPropSidebarMinimized && (
                <>
                    {/* Contorno / Cor do Texto */}
            <div className={styles.propSection}>
                <span className={styles.propTitle}>
                    {hasShapes ? 'Cor do Contorno' : 'Cor do Texto'}
                </span>
                <div className={styles.colorPalette}>
                    {borderColors.map(c => {
                        const isActive = hasShapes 
                            ? currentStrokeColor === c.value
                            : selectedNodes[0]?.textColor === c.value;
                        return (
                            <div
                                key={c.value}
                                className={`${styles.colorPaletteDot} ${isActive ? styles.colorPaletteDotActive : ''}`}
                                style={{ backgroundColor: c.value === '#000000' ? '#14141c' : c.value, border: c.value === '#000000' ? '1px solid rgba(255,255,255,0.2)' : undefined }}
                                onClick={() => updateProp(hasShapes ? 'color' : 'textColor', c.value)}
                                title={c.label}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Preenchimento */}
            {hasShapes && (
                <div className={styles.propSection}>
                    <span className={styles.propTitle}>Cor do Preenchimento</span>
                    <div className={styles.colorPalette}>
                        {fillColors.map(c => {
                            const isActive = currentFillColor === c.value;
                            return (
                                <div
                                    key={c.value}
                                    className={`${styles.colorPaletteDot} ${isActive ? styles.colorPaletteDotActive : ''}`}
                                    style={{ 
                                        background: c.value === 'transparent' ? 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.1) 4px, rgba(255,255,255,0.1) 8px)' : c.value,
                                        border: '1px solid var(--border-default)'
                                    }}
                                    onClick={() => updateProp('shapeFillColor', c.value)}
                                    title={c.label}
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Espessura do Contorno / Tamanho da Fonte */}
            <div className={styles.propSection}>
                <span className={styles.propTitle}>
                    {hasShapes ? 'Espessura do Contorno' : 'Tamanho do Texto'}
                </span>
                {hasShapes ? (
                    <div className={styles.propButtonGroup}>
                        <button 
                            className={`${styles.propBtn} ${currentStrokeWidth === 2 ? styles.propBtnActive : ''}`}
                            onClick={() => updateProp('shapeStrokeWidth', 2)}
                        >
                            Fina
                        </button>
                        <button 
                            className={`${styles.propBtn} ${currentStrokeWidth === 4 ? styles.propBtnActive : ''}`}
                            onClick={() => updateProp('shapeStrokeWidth', 4)}
                        >
                            Média
                        </button>
                        <button 
                            className={`${styles.propBtn} ${currentStrokeWidth === 6 ? styles.propBtnActive : ''}`}
                            onClick={() => updateProp('shapeStrokeWidth', 6)}
                        >
                            Grossa
                        </button>
                    </div>
                ) : (
                    <div className={styles.propButtonGroup}>
                        <button 
                            className={`${styles.propBtn} ${(selectedNodes[0]?.fontSize || 15) === 14 ? styles.propBtnActive : ''}`}
                            onClick={() => updateProp('fontSize', 14)}
                        >
                            P
                        </button>
                        <button 
                            className={`${styles.propBtn} ${(selectedNodes[0]?.fontSize || 15) === 18 ? styles.propBtnActive : ''}`}
                            onClick={() => updateProp('fontSize', 18)}
                        >
                            M
                        </button>
                        <button 
                            className={`${styles.propBtn} ${(selectedNodes[0]?.fontSize || 15) === 24 ? styles.propBtnActive : ''}`}
                            onClick={() => updateProp('fontSize', 24)}
                        >
                            G
                        </button>
                        <button 
                            className={`${styles.propBtn} ${(selectedNodes[0]?.fontSize || 15) === 36 ? styles.propBtnActive : ''}`}
                            onClick={() => updateProp('fontSize', 36)}
                        >
                            GG
                        </button>
                    </div>
                )}
            </div>

            {/* Estilo do Traço */}
            {hasShapes && (
                <div className={styles.propSection}>
                    <span className={styles.propTitle}>Estilo do Traço</span>
                    <div className={styles.propButtonGroup}>
                        <button 
                            className={`${styles.propBtn} ${currentStrokeStyle === 'solid' ? styles.propBtnActive : ''}`}
                            onClick={() => updateProp('shapeStrokeStyle', 'solid')}
                        >
                            Sólido
                        </button>
                        <button 
                            className={`${styles.propBtn} ${currentStrokeStyle === 'dashed' ? styles.propBtnActive : ''}`}
                            onClick={() => updateProp('shapeStrokeStyle', 'dashed')}
                        >
                            Tracejado
                        </button>
                        <button 
                            className={`${styles.propBtn} ${currentStrokeStyle === 'dotted' ? styles.propBtnActive : ''}`}
                            onClick={() => updateProp('shapeStrokeStyle', 'dotted')}
                        >
                            Pontilhado
                        </button>
                    </div>
                </div>
            )}

            {/* Estilo do Desenho */}
            {hasShapes && (
                <div className={styles.propSection}>
                    <span className={styles.propTitle}>Estilo de Desenho</span>
                    <div className={styles.propButtonGroup}>
                        <button 
                            className={`${styles.propBtn} ${currentShapeRoughness === 1 ? styles.propBtnActive : ''}`}
                            onClick={() => updateProp('shapeRoughness', 1)}
                        >
                            Sketchy
                        </button>
                        <button 
                            className={`${styles.propBtn} ${currentShapeRoughness === 0 ? styles.propBtnActive : ''}`}
                            onClick={() => updateProp('shapeRoughness', 0)}
                        >
                            Clean
                        </button>
                    </div>
                </div>
            )}
            
            {/* Lock / Unlock */}
            <div style={{ marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px', display: 'flex', gap: '6px' }}>
                <button 
                    className={styles.propBtn} 
                    style={{ flex: 1, gap: 4 }}
                    onClick={() => {
                        const allLocked = selectedNodes.every(n => n.isLocked);
                        lockAllSelected(!allLocked);
                    }}
                >
                    {selectedNodes.every(n => n.isLocked) ? <Unlock size={12} /> : <Lock size={12} />}
                    <span>{selectedNodes.every(n => n.isLocked) ? 'Desbloquear' : 'Bloquear'}</span>
                </button>
                <button 
                    className={styles.propBtn} 
                    style={{ flex: 'none', width: '28px', background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}
                    onClick={() => {
                        // Use raw window.confirm since custom dialog logic lives in parent, or pass it up.
                        // We will pass the IDs up so the parent can handle the deletion properly.
                        deleteSelectedElements(new Set(selectedNodes.map(n => n.id)));
                    }}
                    title="Excluir selecionados"
                >
                    <Trash2 size={12} />
                </button>
            </div>
                </>
            )}
        </div>
    );
};
