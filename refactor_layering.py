import re

# Update useCanvasNodes.ts
with open('src/renderer/features/Canvas/hooks/useCanvasNodes.ts', 'r', encoding='utf-8') as f:
    hook_code = f.read()

bring_front_str = """
    const bringToFront = useCallback((id: string) => {
        setNodes(prev => {
            const max = Math.max(...prev.map(n => n.zIndex || 0));
            const updated = prev.map(n => n.id === id ? { ...n, zIndex: max + 1 } : n);
            saveData(updated, strokes, viewport);
            return updated;
        });
        setContextMenu?.(null);
    }, [setNodes, saveData, strokes, viewport, setContextMenu]);

    const sendToBack = useCallback((id: string) => {
        setNodes(prev => {
            const min = Math.min(...prev.map(n => n.zIndex || 0));
            const updated = prev.map(n => n.id === id ? { ...n, zIndex: min - 1 } : n);
            saveData(updated, strokes, viewport);
            return updated;
        });
        setContextMenu?.(null);
    }, [setNodes, saveData, strokes, viewport, setContextMenu]);

"""

if "bringToFront" not in hook_code:
    return_str = "    return {\n        addFrameNode,"
    idx = hook_code.find(return_str)
    if idx != -1:
        hook_code = hook_code[:idx] + bring_front_str + hook_code[idx:]
        hook_code = hook_code.replace("duplicateNode\n    };", "duplicateNode,\n        bringToFront,\n        sendToBack\n    };")
        with open('src/renderer/features/Canvas/hooks/useCanvasNodes.ts', 'w', encoding='utf-8') as f:
            f.write(hook_code)
        print("Updated useCanvasNodes.ts")

# Update InfiniteCanvas.tsx
with open('src/renderer/features/Canvas/InfiniteCanvas.tsx', 'r', encoding='utf-8') as f:
    canvas_code = f.read()

if "bringToFront" not in canvas_code:
    canvas_code = canvas_code.replace(
        "addFreeTextAt, duplicateNode",
        "addFreeTextAt, duplicateNode, bringToFront, sendToBack"
    )
    
    ctx_menu_jsx = """
                                <button className={styles.ctxMenuItem} onClick={() => bringToFront(contextMenu.nodeId)}><Lucide.ArrowUp size={14} />Trazer para Frente</button>
                                <button className={styles.ctxMenuItem} onClick={() => sendToBack(contextMenu.nodeId)}><Lucide.ArrowDown size={14} />Enviar para Trás</button>
"""
    # Insert it right before duplicateNode
    dup_str = "<button className={styles.ctxMenuItem} onClick={() => duplicateNode(contextMenu.nodeId)}><Copy size={14} />Duplicar</button>"
    if dup_str in canvas_code:
        canvas_code = canvas_code.replace(dup_str, ctx_menu_jsx + "                                " + dup_str)
        with open('src/renderer/features/Canvas/InfiniteCanvas.tsx', 'w', encoding='utf-8') as f:
            f.write(canvas_code)
        print("Updated InfiniteCanvas.tsx")

