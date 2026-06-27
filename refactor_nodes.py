import re

with open('src/renderer/features/Canvas/InfiniteCanvas.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Add import for useCanvasNodes
if "import { useCanvasNodes }" not in code:
    code = code.replace(
        "import { CanvasContext } from './hooks/CanvasContext';",
        "import { CanvasContext } from './hooks/CanvasContext';\nimport { useCanvasNodes } from './hooks/useCanvasNodes';"
    )

# Find the start of the insertion functions block, typically around `const addFrameNode =`
# We'll just replace the whole block by finding the start of addFrameNode and the end of duplicateNode

start_marker = "const addFrameNode = useCallback((canvasX?: number, canvasY?: number) => {"
end_marker_str = "    const downloadNode = useCallback((id: string) => {"

start_idx = code.find(start_marker)
end_idx = code.find(end_marker_str)

if start_idx != -1 and end_idx != -1:
    hook_injection = """
    const {
        addFrameNode, addTableNode, addPageNode, addChecklistNode, addCardNode,
        addImageNode, addDocumentNode, addBrowserNode, addEmojiOrIconNode,
        addFreeTextAt, duplicateNode
    } = useCanvasNodes(
        containerRef, workspaceId, ownerId, canvasId, onCanvasCreated, 
        setShowPickerPopover, setEditingNodeId, setContextMenu
    );

"""
    code = code[:start_idx] + hook_injection + code[end_idx:]
    
    with open('src/renderer/features/Canvas/InfiniteCanvas.tsx', 'w', encoding='utf-8') as f:
        f.write(code)
    print("Successfully replaced node insertion functions.")
else:
    print("Could not find start or end markers for node functions.")
