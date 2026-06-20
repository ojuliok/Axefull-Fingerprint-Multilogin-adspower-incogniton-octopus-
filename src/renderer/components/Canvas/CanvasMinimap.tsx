import React, { useMemo, useRef, useState, useEffect } from 'react';
import { CanvasNode } from './canvasStorage';

interface Viewport {
    x: number;
    y: number;
    zoom: number;
}

interface CanvasMinimapProps {
    nodes: CanvasNode[];
    viewport: Viewport;
    setViewport: React.Dispatch<React.SetStateAction<Viewport>>;
    containerRef: React.RefObject<HTMLDivElement>;
}

export const CanvasMinimap: React.FC<CanvasMinimapProps> = ({ nodes, viewport, setViewport, containerRef }) => {
    const minimapRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Calculate bounds of all nodes
    const bounds = useMemo(() => {
        if (nodes.length === 0) return { minX: 0, maxX: 1000, minY: 0, maxY: 1000 };
        
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        nodes.forEach(n => {
            if (n.x < minX) minX = n.x;
            if (n.x + (n.width || 200) > maxX) maxX = n.x + (n.width || 200);
            if (n.y < minY) minY = n.y;
            if (n.y + (n.height || 100) > maxY) maxY = n.y + (n.height || 100);
        });

        // Add padding
        const padding = 500;
        return {
            minX: minX - padding,
            maxX: maxX + padding,
            minY: minY - padding,
            maxY: maxY + padding
        };
    }, [nodes]);

    const mapWidth = 200;
    const mapHeight = 150;
    
    const scaleX = mapWidth / (bounds.maxX - bounds.minX);
    const scaleY = mapHeight / (bounds.maxY - bounds.minY);
    const scale = Math.min(scaleX, scaleY);

    const offsetX = (mapWidth - (bounds.maxX - bounds.minX) * scale) / 2;
    const offsetY = (mapHeight - (bounds.maxY - bounds.minY) * scale) / 2;

    const getMinimapCoords = (cx: number, cy: number) => {
        return {
            x: (cx - bounds.minX) * scale + offsetX,
            y: (cy - bounds.minY) * scale + offsetY
        };
    };

    // Calculate viewport rect on minimap
    const vw = containerRef.current ? containerRef.current.clientWidth / viewport.zoom : 800;
    const vh = containerRef.current ? containerRef.current.clientHeight / viewport.zoom : 600;
    const vx = -viewport.x / viewport.zoom;
    const vy = -viewport.y / viewport.zoom;

    const vRectStart = getMinimapCoords(vx, vy);
    const vRectEnd = getMinimapCoords(vx + vw, vy + vh);

    const handlePointerDown = (e: React.PointerEvent) => {
        e.stopPropagation();
        setIsDragging(true);
        updateViewportFromEvent(e);
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return;
        updateViewportFromEvent(e);
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        setIsDragging(false);
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    };

    const updateViewportFromEvent = (e: React.PointerEvent) => {
        if (!minimapRef.current || !containerRef.current) return;
        const rect = minimapRef.current.getBoundingClientRect();
        
        // Calculate click position relative to minimap content
        const clickX = e.clientX - rect.left - offsetX;
        const clickY = e.clientY - rect.top - offsetY;

        // Convert minimap position to canvas coordinates
        const targetCanvasX = (clickX / scale) + bounds.minX;
        const targetCanvasY = (clickY / scale) + bounds.minY;

        // We want targetCanvasX/Y to be the center of the viewport
        const cw = containerRef.current.clientWidth;
        const ch = containerRef.current.clientHeight;

        setViewport(v => ({
            ...v,
            x: -(targetCanvasX * v.zoom - cw / 2),
            y: -(targetCanvasY * v.zoom - ch / 2)
        }));
    };

    return (
        <div 
            className="fixed bottom-6 right-6 z-50 bg-[#18181b]/90 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-2xl transition-opacity hover:opacity-100 opacity-60"
            style={{ width: mapWidth, height: mapHeight }}
        >
            <div 
                ref={minimapRef}
                style={{ width: '100%', height: '100%', position: 'relative', cursor: isDragging ? 'grabbing' : 'grab' }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
            >
                {/* Nodes */}
                {nodes.map(n => {
                    const start = getMinimapCoords(n.x, n.y);
                    const w = (n.width || 200) * scale;
                    const h = (n.height || 100) * scale;
                    return (
                        <div 
                            key={n.id}
                            style={{
                                position: 'absolute',
                                left: start.x,
                                top: start.y,
                                width: Math.max(2, w),
                                height: Math.max(2, h),
                                background: n.color || '#3b82f6',
                                opacity: 0.5,
                                borderRadius: 2
                            }}
                        />
                    );
                })}

                {/* Viewport Outline */}
                <div 
                    style={{
                        position: 'absolute',
                        left: vRectStart.x,
                        top: vRectStart.y,
                        width: Math.max(0, vRectEnd.x - vRectStart.x),
                        height: Math.max(0, vRectEnd.y - vRectStart.y),
                        border: '2px solid #8b5cf6',
                        background: 'rgba(139, 92, 246, 0.1)',
                        boxSizing: 'border-box',
                        pointerEvents: 'none'
                    }}
                />
            </div>
        </div>
    );
};
