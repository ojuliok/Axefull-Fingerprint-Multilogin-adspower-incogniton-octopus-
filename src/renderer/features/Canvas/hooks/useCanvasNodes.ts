import { useCallback } from 'react';
import { CanvasNode, createCanvas } from '../canvasStorage';

export const useCanvasNodes = (
    containerRef: React.RefObject<HTMLDivElement>,
    workspaceId: string | undefined,
    ownerId: string | undefined,
    canvasId: string,
    onCanvasCreated?: () => void,
    setShowPickerPopover?: (v: boolean) => void,
    setEditingNodeId?: (id: string | null) => void,
    setContextMenu?: (v: any) => void,
    nodes: CanvasNode[],
    setNodes: React.Dispatch<React.SetStateAction<CanvasNode[]>>,
    strokes: any[],
    viewport: any,
    saveData: any,
    setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>
) => {

    const maxZ = useCallback(() => nodes.reduce((m, n) => Math.max(m, n.zIndex || 0), 0), [nodes]);
    const genId = () => crypto.randomUUID();

    const getCenter = (canvasX?: number, canvasY?: number) => {
        const cx = canvasX !== undefined ? canvasX : (-viewport.x + (containerRef.current?.clientWidth ?? 800) / 2) / viewport.zoom;
        const cy = canvasY !== undefined ? canvasY : (-viewport.y + (containerRef.current?.clientHeight ?? 600) / 2) / viewport.zoom;
        return { cx, cy };
    };

    const addFrameNode = useCallback((canvasX?: number, canvasY?: number) => {
        const { cx, cy } = getCenter(canvasX, canvasY);
        const newNode: CanvasNode = {
            id: genId(), type: 'frame', x: cx - 200, y: cy - 150,
            width: 400, height: 300, content: 'Novo Frame', zIndex: maxZ() - 100, // Frames usually stay behind
        };
        const updated = [...nodes, newNode];
        setNodes(updated);
        setSelectedIds(new Set([newNode.id]));
        saveData(updated, strokes, viewport);
    }, [nodes, strokes, viewport, saveData, maxZ, containerRef]);

    const addTableNode = useCallback((canvasX?: number, canvasY?: number) => {
        const { cx, cy } = getCenter(canvasX, canvasY);
        const initialTableData = [
            ['Cabeçalho 1', 'Cabeçalho 2'],
            ['Linha 1', 'Valor 1']
        ];
        const newNode: CanvasNode = {
            id: genId(), type: 'table', x: cx - 150, y: cy - 80,
            width: 300, height: 160, content: '', tableData: initialTableData, zIndex: maxZ() + 1,
            color: '#1e293b', textColor: '#e2e8f0'
        };
        const updated = [...nodes, newNode];
        setNodes(updated);
        setSelectedIds(new Set([newNode.id]));
        saveData(updated, strokes, viewport);
    }, [nodes, strokes, viewport, saveData, maxZ, containerRef]);

    const addPageNode = useCallback((canvasX?: number, canvasY?: number) => {
        const { cx, cy } = getCenter(canvasX, canvasY);
        const pageId = crypto.randomUUID();
        
        createCanvas(workspaceId || '', ownerId || '', 'Página Sem Título', canvasId, 'page', pageId);
        onCanvasCreated?.();

        const newNode: CanvasNode = {
            id: pageId, type: 'page', x: cx - 100, y: cy - 40,
            width: 200, height: 80, content: 'Página Sem Título', targetCanvasId: pageId, zIndex: maxZ() + 1,
            color: '#0f172a', textColor: '#ffffff'
        };
        const updated = [...nodes, newNode];
        setNodes(updated);
        setSelectedIds(new Set([newNode.id]));
        setEditingNodeId?.(newNode.id);
        saveData(updated, strokes, viewport);
    }, [nodes, strokes, viewport, saveData, canvasId, onCanvasCreated, workspaceId, ownerId, maxZ, containerRef, setEditingNodeId]);

    const addChecklistNode = useCallback((canvasX?: number, canvasY?: number) => {
        const { cx, cy } = getCenter(canvasX, canvasY);
        const newNode: CanvasNode = {
            id: genId(), type: 'checklist', x: cx - 130, y: cy - 100,
            width: 260, height: 200, content: 'Novo Checklist', zIndex: maxZ() + 1,
            checklistData: [
                { id: genId(), text: 'Tarefa 1', checked: false },
                { id: genId(), text: 'Tarefa 2', checked: false }
            ]
        };
        const updated = [...nodes, newNode];
        setNodes(updated);
        setSelectedIds(new Set([newNode.id]));
        saveData(updated, strokes, viewport);
    }, [nodes, strokes, viewport, saveData, maxZ, containerRef]);

    const addCardNode = useCallback((canvasX?: number, canvasY?: number) => {
        const { cx, cy } = getCenter(canvasX, canvasY);
        const cardId = crypto.randomUUID();

        createCanvas(workspaceId || '', ownerId || '', 'Novo Card', canvasId, 'card', cardId);
        onCanvasCreated?.();

        const newNode: CanvasNode = {
            id: cardId, type: 'card', x: cx - 130, y: cy - 80,
            width: 260, height: 160, content: 'Novo Card', targetCanvasId: cardId, zIndex: maxZ() + 1,
            color: '#1e293b'
        };
        const updated = [...nodes, newNode];
        setNodes(updated);
        setSelectedIds(new Set([newNode.id]));
        saveData(updated, strokes, viewport);

        if ((window as any).api && (window as any).api.cards) {
            (window as any).api.cards.save(cardId, {
                title: 'Novo Card',
                content: '',
                comments: []
            }).catch((err: any) => console.error("Error saving initial card file:", err));
        }
    }, [nodes, strokes, viewport, saveData, canvasId, onCanvasCreated, workspaceId, ownerId, maxZ, containerRef]);

    const addImageNode = useCallback((base64: string, fileName: string) => {
        const { cx, cy } = getCenter();
        const newNode: CanvasNode = {
            id: genId(), type: 'image', x: cx - 150, y: cy - 100,
            width: 300, height: 220, content: base64, fileName, zIndex: maxZ() + 1,
        };
        const updated = [...nodes, newNode];
        setNodes(updated);
        setSelectedIds(new Set([newNode.id]));
        saveData(updated, strokes, viewport);
    }, [nodes, strokes, viewport, saveData, maxZ, containerRef]);

    const addDocumentNode = useCallback((base64: string, fileName: string, fileType: string) => {
        const { cx, cy } = getCenter();
        const newNode: CanvasNode = {
            id: genId(), type: 'document', x: cx - 130, y: cy - 30,
            width: 260, height: 72, content: base64, fileName, fileType, zIndex: maxZ() + 1,
        };
        const updated = [...nodes, newNode];
        setNodes(updated);
        setSelectedIds(new Set([newNode.id]));
        saveData(updated, strokes, viewport);
    }, [nodes, strokes, viewport, saveData, maxZ, containerRef]);

    const addBrowserNode = useCallback((canvasX?: number, canvasY?: number) => {
        const { cx, cy } = getCenter(canvasX, canvasY);
        const initialTabId = genId();
        const newNode: CanvasNode = {
            id: genId(), type: 'browser', x: cx - 200, y: cy - 150,
            width: 400, height: 300, content: 'Navegador Interno', zIndex: maxZ() + 1,
            browserTabs: [{ id: initialTabId, url: 'https://www.google.com', title: 'Nova Guia' }],
            activeTabId: initialTabId,
            browserProxy: '',
            color: '#1e293b'
        };
        const updated = [...nodes, newNode];
        setNodes(updated);
        setSelectedIds(new Set([newNode.id]));
        saveData(updated, strokes, viewport);
    }, [nodes, strokes, viewport, saveData, maxZ, containerRef]);

    const addEmojiOrIconNode = useCallback((type: 'emoji' | 'icon', content: string) => {
        const { cx, cy } = getCenter();
        const newNode: CanvasNode = {
            id: genId(),
            type: type,
            x: cx - 35,
            y: cy - 35,
            width: 70,
            height: 70,
            content: content,
            zIndex: maxZ() + 1,
            color: type === 'icon' ? 'rgba(139, 92, 246, 0.2)' : undefined,
            textColor: type === 'icon' ? '#a78bfa' : undefined,
        };
        const updated = [...nodes, newNode];
        setNodes(updated);
        setSelectedIds(new Set([newNode.id]));
        saveData(updated, strokes, viewport);
        setShowPickerPopover?.(false);
    }, [nodes, strokes, viewport, saveData, maxZ, containerRef, setShowPickerPopover]);

    const addFreeTextAt = useCallback((x: number, y: number) => {
        const newNode: CanvasNode = {
            id: genId(), type: 'freetext', x: x, y: y,
            width: 150, height: 40, content: 'Novo texto livre', zIndex: maxZ() + 1,
            color: 'transparent', textColor: '#ffffff'
        };
        const updated = [...nodes, newNode];
        setNodes(updated);
        setSelectedIds(new Set([newNode.id]));
        setEditingNodeId?.(newNode.id);
        saveData(updated, strokes, viewport);
    }, [nodes, strokes, viewport, saveData, maxZ, setEditingNodeId]);

    const duplicateNode = useCallback((id: string) => {
        const node = nodes.find(n => n.id === id);
        if (!node) return;
        const dup: CanvasNode = { ...node, id: genId(), x: node.x + 30, y: node.y + 30, zIndex: maxZ() + 1 };
        const updated = [...nodes, dup];
        setNodes(updated);
        setSelectedIds(new Set([dup.id]));
        setContextMenu?.(null);
        saveData(updated, strokes, viewport);
    }, [nodes, strokes, viewport, saveData, maxZ, setContextMenu]);


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

    return {
        addFrameNode,
        addTableNode,
        addPageNode,
        addChecklistNode,
        addCardNode,
        addImageNode,
        addDocumentNode,
        addBrowserNode,
        addEmojiOrIconNode,
        addFreeTextAt,
        duplicateNode,
        bringToFront,
        sendToBack
    };
};
