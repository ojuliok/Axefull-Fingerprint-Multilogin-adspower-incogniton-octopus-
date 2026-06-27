import re

with open('src/renderer/features/Canvas/InfiniteCanvas.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

shortcuts_jsx = """
            // Figma-like Keyboard Shortcuts
            if (!isTyping && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
                switch(e.key.toLowerCase()) {
                    case 'v': e.preventDefault(); setActiveTool('select'); break;
                    case 'h': e.preventDefault(); setActiveTool('hand'); break;
                    case 'r': e.preventDefault(); setActiveTool('rectangle'); break;
                    case 'o': e.preventDefault(); setActiveTool('ellipse'); break;
                    case 'd': e.preventDefault(); setActiveTool('diamond'); break;
                    case 'l': e.preventDefault(); setActiveTool('line'); break;
                    case 'a': e.preventDefault(); setActiveTool('arrow'); break;
                    case 't': e.preventDefault(); setActiveTool('freetext'); break;
                    case 'f': e.preventDefault(); setActiveTool('frame'); break;
                    case 'p': e.preventDefault(); setActiveTool('pen'); break;
                    case ']': 
                        e.preventDefault(); 
                        if (selectedIds.size > 0) {
                            Array.from(selectedIds).forEach(id => bringToFront(id));
                        }
                        break;
                    case '[': 
                        e.preventDefault(); 
                        if (selectedIds.size > 0) {
                            Array.from(selectedIds).forEach(id => sendToBack(id));
                        }
                        break;
                }
            }
            
            // Modifier shortcuts (Ctrl/Meta)
            if ((e.ctrlKey || e.metaKey) && !isTyping) {
                if (e.key.toLowerCase() === 'a') {
                    e.preventDefault();
                    setSelectedIds(new Set(nodes.map(n => n.id)));
                }
                if (e.key.toLowerCase() === 'd') {
                    e.preventDefault();
                    if (selectedIds.size > 0) {
                        Array.from(selectedIds).forEach(id => duplicateNode(id));
                    }
                }
                if (e.key === ']') {
                    e.preventDefault();
                    if (selectedIds.size > 0) {
                        Array.from(selectedIds).forEach(id => bringToFront(id));
                    }
                }
                if (e.key === '[') {
                    e.preventDefault();
                    if (selectedIds.size > 0) {
                        Array.from(selectedIds).forEach(id => sendToBack(id));
                    }
                }
                if (e.key.toLowerCase() === 'g') {
                    e.preventDefault();
                    // Grouping placeholder for future implementation
                    console.log("Grouping triggered");
                }
            }
"""

# Let's insert it right after the isTyping check
target_marker = """
            if (e.code === 'Space' && !e.repeat && !isTyping) {
"""

if target_marker in code:
    code = code.replace(target_marker, shortcuts_jsx + target_marker)
    with open('src/renderer/features/Canvas/InfiniteCanvas.tsx', 'w', encoding='utf-8') as f:
        f.write(code)
    print("Shortcuts added successfully.")
else:
    print("Target marker not found.")
