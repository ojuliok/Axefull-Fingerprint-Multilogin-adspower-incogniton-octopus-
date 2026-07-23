import React from 'react';
import { CanvasConnection, CanvasNode } from '../types/canvasTypes';

interface CanvasConnectionsLayerProps {
    connections: CanvasConnection[];
    nodes: CanvasNode[];
    selectedIds: Set<string>;
    getBezierPath: (fromNode: CanvasNode, fromSide: string, toNode: CanvasNode, toSide: string) => { path: string; midX: number; midY: number };
    onConnectionMouseDown: (e: React.MouseEvent, connectionId: string) => void;
    onConnectionContextMenu: (e: React.MouseEvent, connectionId: string) => void;
}

export const CanvasConnectionsLayer: React.FC<CanvasConnectionsLayerProps> = React.memo(({
    connections,
    nodes,
    selectedIds,
    getBezierPath,
    onConnectionMouseDown,
    onConnectionContextMenu
}) => {
    if (!connections || connections.length === 0) return null;

    return (
        <g className="canvas-connections-layer">
            {connections.map(c => {
                const fromNode = nodes.find(n => n.id === c.fromId);
                const toNode = nodes.find(n => n.id === c.toId);
                if (!fromNode || !toNode) return null;
                const isSelected = selectedIds.has(c.id);
                const curveData = getBezierPath(fromNode, c.fromSide, toNode, c.toSide);
                return (
                    <g key={c.id}>
                        <path
                            d={curveData.path}
                            stroke={isSelected ? '#c4b5fd' : (c.color || '#8b5cf6')}
                            strokeWidth={isSelected ? '4' : '2.5'}
                            fill="none"
                            markerEnd={c.hasArrow !== false ? "url(#arrowhead)" : undefined}
                            style={{ cursor: 'pointer' }}
                            onMouseDown={(e) => onConnectionMouseDown(e, c.id)}
                            onContextMenu={(e) => onConnectionContextMenu(e, c.id)}
                        />
                        {c.label && (
                            <text
                                x={curveData.midX}
                                y={curveData.midY}
                                fill="#e2e8f0"
                                fontSize="12"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                style={{ pointerEvents: 'none', userSelect: 'none' }}
                            >
                                {c.label}
                            </text>
                        )}
                    </g>
                );
            })}
        </g>
    );
});

CanvasConnectionsLayer.displayName = 'CanvasConnectionsLayer';
