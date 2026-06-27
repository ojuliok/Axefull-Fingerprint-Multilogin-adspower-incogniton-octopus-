import re

with open('src/renderer/features/Canvas/InfiniteCanvas.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Add imports
imports = """
import { CanvasContext } from './hooks/CanvasContext';
import { CanvasToolbar } from './components/CanvasToolbar';
import { CanvasPropertiesPanel } from './components/CanvasPropertiesPanel';
import { CanvasZoomControls } from './components/CanvasZoomControls';
"""
code = code.replace("import styles from './InfiniteCanvas.module.css';", "import styles from './InfiniteCanvas.module.css';\n" + imports)

# Find the start of the return statement for InfiniteCanvas
# It is preceded by `const mapBounds = getMinimapData();`
match_str = "const mapBounds = getMinimapData();\n\n    return ("
return_start = code.find(match_str)
if return_start != -1:
    context_val = """
    const contextValue = {
        canvasId, nodes, setNodes, strokes, setStrokes, connections, setConnections, viewport, setViewport,
        activeTool, setActiveTool, isToolLocked, setIsToolLocked,
        selectedIds, setSelectedIds,
        currentStrokeColor, setCurrentStrokeColor, currentStrokeWidth, setCurrentStrokeWidth, currentStrokeStyle, setCurrentStrokeStyle, currentFillColor, setCurrentFillColor, currentShapeRoughness, setCurrentShapeRoughness,
        gridSnap, setGridSnap, viewMode, setViewMode,
        saveData, undo: handleUndo, redo: handleRedo, canUndo: historyIndexRef.current > 0, canRedo: historyIndexRef.current < history.length - 1
    };
    """
    
    replace_str = context_val + "\n    return (\n        <CanvasContext.Provider value={contextValue}>"
    code = code.replace(match_str, replace_str)
    
    # We also need to close the provider at the very end. 
    # Find the last "    );" which belongs to InfiniteCanvas
    last_paren = code.rfind("    );")
    if last_paren != -1:
        code = code[:last_paren] + "        </CanvasContext.Provider>\n" + code[last_paren:]

# Replace Central Dock
dock_start = code.find("{/* ── Central Dock (Grouped Toolbars) ── */}")
dock_end = code.find("{/* ── Left Properties Panel (Excalidraw properties) ── */}")
if dock_start != -1 and dock_end != -1:
    toolbar_jsx = """
            <CanvasToolbar 
                clearStrokes={clearStrokes}
                addFreeTextAt={addFreeTextAt}
                addFrameNode={addFrameNode}
                addBrowserNode={addBrowserNode}
                addPageNode={addPageNode}
                addCardNode={addCardNode}
                addChecklistNode={addChecklistNode}
                addTableNode={addTableNode}
                fileInputRef={fileInputRef}
                docInputRef={docInputRef}
                setShowProfilePicker={setShowProfilePicker}
                setShowPickerPopover={setShowPickerPopover}
                setShowSocialPicker={setShowSocialPicker}
                setShowFunnelPicker={setShowFunnelPicker}
            />
"""
    code = code[:dock_start] + toolbar_jsx + code[dock_end:]

# Replace Left Properties Panel
prop_start = code.find("{/* ── Left Properties Panel (Excalidraw properties) ── */}")
prop_end = code.find("{/* ── Right Text Editor Sidebar ── */}")
if prop_start != -1 and prop_end != -1:
    prop_jsx = """
            <CanvasPropertiesPanel 
                isPropSidebarMinimized={isPropSidebarMinimized}
                setIsPropSidebarMinimized={setIsPropSidebarMinimized}
                lockAllSelected={lockAllSelected}
                deleteSelectedElements={deleteSelectedElements}
            />
"""
    code = code[:prop_start] + prop_jsx + code[prop_end:]

# Replace Zoom Controls
zoom_start = code.find("{/* ── Zoom and History Bottom-Left Controls ── */}")
zoom_end = code.find("{/* ── Searchable Profiles Picker Panel ── */}")
if zoom_start != -1 and zoom_end != -1:
    zoom_jsx = "            <CanvasZoomControls />\n"
    code = code[:zoom_start] + zoom_jsx + code[zoom_end:]

with open('src/renderer/features/Canvas/InfiniteCanvas.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Refactor script completed.")
