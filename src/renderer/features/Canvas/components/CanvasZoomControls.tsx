import React from 'react';
import { ZoomIn, ZoomOut, Undo2, Redo2 } from 'lucide-react';
import { useCanvasContext } from '../hooks/CanvasContext';
import styles from '../InfiniteCanvas.module.css';

export const CanvasZoomControls: React.FC = () => {
    const { viewport, setViewport, undo, redo, canUndo, canRedo } = useCanvasContext();

    const zoomIn = () => setViewport(prev => ({ ...prev, zoom: Math.min(3, prev.zoom + 0.1) }));
    const zoomOut = () => setViewport(prev => ({ ...prev, zoom: Math.max(0.15, prev.zoom - 0.1) }));
    const resetZoom = () => setViewport(prev => ({ ...prev, zoom: 1 }));

    return (
        <div className={styles.zoomControls} onMouseDown={(e) => e.stopPropagation()}>
            <button onClick={zoomOut} title="Diminuir Zoom"><ZoomOut size={15} /></button>
            <div className={styles.zoomValue} onClick={resetZoom} title="Resetar Zoom (100%)">
                {Math.round(viewport.zoom * 100)}%
            </div>
            <button onClick={zoomIn} title="Aumentar Zoom"><ZoomIn size={15} /></button>
            
            <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
            
            <button onClick={undo} disabled={!canUndo} title="Desfazer (Ctrl+Z)"><Undo2 size={15} /></button>
            <button onClick={redo} disabled={!canRedo} title="Refazer (Ctrl+Y)"><Redo2 size={15} /></button>
        </div>
    );
};
