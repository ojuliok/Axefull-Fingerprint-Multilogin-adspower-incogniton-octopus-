const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'renderer', 'pages', 'CanvasPage.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// Import useWorkspace
code = code.replace(
  "import { useToast } from '../context/ToastContext';",
  "import { useAuth } from '../context/AuthContext';\nimport { useToast } from '../context/ToastContext';\nimport { useWorkspace } from '../context/WorkspaceContext';"
);

// Add currentWorkspace to component
code = code.replace(
  "const [isTrashView, setIsTrashView] = useState(false);",
  "const [isTrashView, setIsTrashView] = useState(false);\n    const { currentWorkspace } = useWorkspace();\n    const { user } = useAuth();"
);


// 1. Refactor useEffect load
code = code.replace(
  "useEffect(() => {\n        setCanvasList(getCanvasList());\n    }, []);",
  `const reloadCanvasList = useCallback(async () => {
        if (currentWorkspace) {
            const list = await getCanvasList(currentWorkspace.id);
            setCanvasList(list);
        } else {
            setCanvasList([]);
        }
    }, [currentWorkspace]);

    useEffect(() => {
        reloadCanvasList();
    }, [reloadCanvasList]);`
);

// 2. Replace all synchronous getCanvasList() calls with reloadCanvasList() where it's just setting the list
// E.g., setCanvasList(getCanvasList()); -> reloadCanvasList();
code = code.replace(/setCanvasList\(getCanvasList\(\)\);/g, "reloadCanvasList();");
code = code.replace(/const remaining = getCanvasList\(\);/g, "await reloadCanvasList(); const remaining = canvasList; // TODO Fix sync logic");

// 3. Make handlers async
code = code.replace(/const handleUpdateCanvasInfo = useCallback\(\(id: string, updates: Partial<CanvasInfo>\) => {/g, "const handleUpdateCanvasInfo = useCallback(async (id: string, updates: Partial<CanvasInfo>) => {");
code = code.replace(/updateCanvasInfo\(id, updates\);/g, "await updateCanvasInfo(id, updates);");

code = code.replace(/const handleToggleFavorite = useCallback\(\(id: string\) => {/g, "const handleToggleFavorite = useCallback(async (id: string) => {");

code = code.replace(/const handleConfirmCreateModal = useCallback\(\(\) => {/g, "const handleConfirmCreateModal = useCallback(async () => {");
code = code.replace(/createFolder\(name, parentId\);/g, "await createFolder(currentWorkspace?.id || '', user?.id || '', name, parentId);");
code = code.replace(/const info = createCanvas\(name, parentId, showCreateModal\.type\);/g, "const info = await createCanvas(currentWorkspace?.id || '', user?.id || '', name, parentId, showCreateModal.type);");

code = code.replace(/const handleSoftDeleteCanvas = useCallback\(\(id: string\) => {/g, "const handleSoftDeleteCanvas = useCallback(async (id: string) => {");
code = code.replace(/softDeleteCanvas\(id\);/g, "await softDeleteCanvas(id);");

code = code.replace(/const handlePermanentDeleteCanvas = useCallback\(\(id: string\) => {/g, "const handlePermanentDeleteCanvas = useCallback(async (id: string) => {");
code = code.replace(/deleteCanvas\(id\);/g, "await deleteCanvas(id);");

code = code.replace(/const handleRestoreCanvas = useCallback\(\(id: string\) => {/g, "const handleRestoreCanvas = useCallback(async (id: string) => {");
code = code.replace(/restoreCanvas\(id\);/g, "await restoreCanvas(id);");

code = code.replace(/const handleConfirmRename = useCallback\(\(\) => {/g, "const handleConfirmRename = useCallback(async () => {");
code = code.replace(/renameCanvas\(renamingId, renameValue\.trim\(\)\);/g, "await renameCanvas(renamingId, renameValue.trim());");

code = code.replace(/const handleDuplicate = useCallback\(\(id: string\) => {/g, "const handleDuplicate = useCallback(async (id: string) => {");
code = code.replace(/const newInfo = duplicateCanvas\(id\);/g, "const newInfo = await duplicateCanvas(id, currentWorkspace?.id || '', user?.id || '');");

code = code.replace(/const handleCreateFolder = useCallback\(\(\) => {/g, "const handleCreateFolder = useCallback(async () => {");

code = code.replace(/const handleDrop = useCallback\(\(e: React\.DragEvent, targetId: string\) => {/g, "const handleDrop = useCallback(async (e: React.DragEvent, targetId: string) => {");
code = code.replace(/moveCanvasItem\(draggedId, targetId, dropPosition\);/g, "await moveCanvasItem(draggedId, targetId, dropPosition, currentWorkspace?.id || '');");

code = code.replace(/const selectSidebarEmoji = useCallback\(\(emoji: string\) => {/g, "const selectSidebarEmoji = useCallback(async (emoji: string) => {");


// 4. Handle getCanvasData
code = code.replace(/const data = getCanvasData\(id\);/g, "const data = await getCanvasData(id);");
code = code.replace(/const data = getCanvasData\(targetCanvasId\);/g, "const data = await getCanvasData(targetCanvasId);");
code = code.replace(/const handleSelectCanvas = useCallback\(\(id: string\) => {/g, "const handleSelectCanvas = useCallback(async (id: string) => {");
code = code.replace(/const handleOpenPage = useCallback\(\(targetCanvasId: string, pageName: string\) => {/g, "const handleOpenPage = useCallback(async (targetCanvasId: string, pageName: string) => {");
code = code.replace(/const handleBreadcrumbClick = useCallback\(\(index: number\) => {/g, "const handleBreadcrumbClick = useCallback(async (index: number) => {");

// 5. Update dependencies
code = code.replace(/\[activeCanvasId\]\)/g, "[activeCanvasId, reloadCanvasList])");
code = code.replace(/\[canvasList, handleUpdateCanvasInfo\]\)/g, "[canvasList, handleUpdateCanvasInfo, reloadCanvasList])");
code = code.replace(/\[showCreateModal, createModalName\]\)/g, "[showCreateModal, createModalName, reloadCanvasList, currentWorkspace, user])");
code = code.replace(/\[activeCanvasId\]\)/g, "[activeCanvasId, reloadCanvasList])");
code = code.replace(/\[canvasList\]\)/g, "[canvasList, reloadCanvasList, currentWorkspace, user])");
code = code.replace(/\[renamingId, renameValue\]\)/g, "[renamingId, renameValue, reloadCanvasList])");
code = code.replace(/\[draggedId, dropPosition\]\)/g, "[draggedId, dropPosition, reloadCanvasList, currentWorkspace])");


fs.writeFileSync(filePath, code);
console.log('Done refactoring CanvasPage.tsx');
