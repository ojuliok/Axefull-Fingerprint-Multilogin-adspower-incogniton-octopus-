import re

with open('src/renderer/features/Canvas/InfiniteCanvas.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

bounding_box_jsx = """
            {/* Figma-like Multi-Selection Bounding Box */}
            {(() => {
                if (selectedIds.size > 1 && viewMode === 'canvas') {
                    const selectedNodes = nodes.filter(n => selectedIds.has(n.id));
                    if (selectedNodes.length > 0) {
                        const minX = Math.min(...selectedNodes.map(n => n.x));
                        const minY = Math.min(...selectedNodes.map(n => n.y));
                        const maxX = Math.max(...selectedNodes.map(n => n.x + (n.width || 0)));
                        const maxY = Math.max(...selectedNodes.map(n => n.y + (n.height || 0)));
                        const bw = (maxX - minX) * viewport.zoom;
                        const bh = (maxY - minY) * viewport.zoom;
                        const left = (minX + viewport.x) * viewport.zoom; # wait, transform is applied to canvasSurface
                        
                        // We are rendering inside a div that is NOT scaled, but maybe we can render inside canvasSurface
                        // Actually, selectionRect is rendered outside the scaled surface (it uses absolute page coords).
                        // If we render inside canvasSurface, we just use minX, minY, bw, bh natively!
                        return null;
                    }
                }
                return null;
            })()}
"""
# Wait, let's just make it simpler.
bounding_box_jsx_clean = """
                        {/* Figma-like Multi-Selection Bounding Box */}
                        {(() => {
                            if (selectedIds.size > 1 && viewMode === 'canvas') {
                                const selectedNodes = nodes.filter(n => selectedIds.has(n.id));
                                if (selectedNodes.length > 0) {
                                    const minX = Math.min(...selectedNodes.map(n => n.x));
                                    const minY = Math.min(...selectedNodes.map(n => n.y));
                                    const maxX = Math.max(...selectedNodes.map(n => n.x + (n.width || 0)));
                                    const maxY = Math.max(...selectedNodes.map(n => n.y + (n.height || 0)));
                                    const bw = maxX - minX;
                                    const bh = maxY - minY;
                                    
                                    return (
                                        <div style={{
                                            position: 'absolute',
                                            left: minX,
                                            top: minY,
                                            width: bw,
                                            height: bh,
                                            border: '2px dashed #a78bfa',
                                            pointerEvents: 'none',
                                            zIndex: 9999
                                        }}>
                                            {/* Corner Handles */}
                                            <div style={{ position: 'absolute', left: -4, top: -4, width: 8, height: 8, background: '#a78bfa', border: '1px solid #14141c', cursor: 'nwse-resize', pointerEvents: 'auto' }} />
                                            <div style={{ position: 'absolute', right: -4, top: -4, width: 8, height: 8, background: '#a78bfa', border: '1px solid #14141c', cursor: 'nesw-resize', pointerEvents: 'auto' }} />
                                            <div style={{ position: 'absolute', left: -4, bottom: -4, width: 8, height: 8, background: '#a78bfa', border: '1px solid #14141c', cursor: 'nesw-resize', pointerEvents: 'auto' }} />
                                            <div style={{ position: 'absolute', right: -4, bottom: -4, width: 8, height: 8, background: '#a78bfa', border: '1px solid #14141c', cursor: 'nwse-resize', pointerEvents: 'auto' }} />
                                        </div>
                                    );
                                }
                            }
                            return null;
                        })()}
"""

# Let's insert this into canvasSurface, right before SVG layer
svg_start = "<svg className={styles.drawingLayer}"
if svg_start in code:
    code = code.replace(svg_start, bounding_box_jsx_clean + "\n                        " + svg_start)
    with open('src/renderer/features/Canvas/InfiniteCanvas.tsx', 'w', encoding='utf-8') as f:
        f.write(code)
    print("Bounding box added to canvasSurface")
else:
    print("Could not find SVG start")
