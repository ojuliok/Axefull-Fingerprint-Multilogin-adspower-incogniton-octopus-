import React from 'react';
import { Stroke } from '../types/canvasTypes';

interface CanvasStrokesLayerProps {
    strokes: Stroke[];
    selectedIds: Set<string>;
    strokeToPath: (points: { x: number; y: number }[]) => string;
    onStrokeMouseDown: (e: React.MouseEvent, strokeId: string) => void;
    onStrokeContextMenu: (e: React.MouseEvent, strokeId: string) => void;
}

export const CanvasStrokesLayer: React.FC<CanvasStrokesLayerProps> = React.memo(({
    strokes,
    selectedIds,
    strokeToPath,
    onStrokeMouseDown,
    onStrokeContextMenu
}) => {
    if (!strokes || strokes.length === 0) return null;

    return (
        <g className="canvas-strokes-layer">
            {strokes.map(s => {
                const isSelected = selectedIds.has(s.id);
                return (
                    <g key={s.id}>
                        <path 
                            d={strokeToPath(s.points)} 
                            stroke={isSelected ? '#c4b5fd' : s.color} 
                            strokeWidth={isSelected ? s.width + 1.5 : s.width} 
                            fill="none" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            markerEnd={s.isArrow ? "url(#arrowhead)" : undefined}
                            style={{ cursor: 'pointer' }}
                            onMouseDown={(e) => onStrokeMouseDown(e, s.id)}
                            onContextMenu={(e) => onStrokeContextMenu(e, s.id)}
                        />
                    </g>
                );
            })}
        </g>
    );
});

CanvasStrokesLayer.displayName = 'CanvasStrokesLayer';
