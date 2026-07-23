import { useCallback } from 'react';
import { CanvasNode, createCanvas } from '../services/canvasStorage';

export const useCanvasNodes = (
    containerRef: React.RefObject<HTMLDivElement>,
    workspaceId: string | undefined,
    ownerId: string | undefined,
    canvasId: string,
    onCanvasCreated: (() => void) | undefined,
    setShowPickerPopover: ((v: boolean) => void) | undefined,
    setEditingNodeId: ((id: string | null) => void) | undefined,
    setContextMenu: ((v: any) => void) | undefined,
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
        } as any;
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
        } as any;
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
        } as any;
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
            id: cardId, type: 'card', x: cx - 140, y: cy - 100,
            width: 280, height: 200, content: 'Novo Card', targetCanvasId: cardId, cardId, zIndex: maxZ() + 1,
            color: '#1e1b4b', textColor: '#ffffff'
        } as any;
        const updated = [...nodes, newNode];
        setNodes(updated);
        setSelectedIds(new Set([newNode.id]));
        saveData(updated, strokes, viewport);
    }, [nodes, strokes, viewport, saveData, canvasId, onCanvasCreated, workspaceId, ownerId, maxZ, containerRef]);

    const addTextNode = useCallback((canvasX?: number, canvasY?: number) => {
        const { cx, cy } = getCenter(canvasX, canvasY);
        const newNode: CanvasNode = {
            id: genId(), type: 'text', x: cx - 100, y: cy - 50,
            width: 200, height: 100, content: 'Novo Texto', zIndex: maxZ() + 1,
            color: '#1e293b', textColor: '#ffffff'
        };
        const updated = [...nodes, newNode];
        setNodes(updated);
        setSelectedIds(new Set([newNode.id]));
        setEditingNodeId?.(newNode.id);
        saveData(updated, strokes, viewport);
    }, [nodes, strokes, viewport, saveData, maxZ, containerRef, setEditingNodeId]);

    const addShapeNode = useCallback((shapeType: string, canvasX?: number, canvasY?: number) => {
        const { cx, cy } = getCenter(canvasX, canvasY);
        const newNode: CanvasNode = {
            id: genId(), type: 'shape', shapeType, x: cx - 75, y: cy - 75,
            width: 150, height: 150, content: '', zIndex: maxZ() + 1,
            color: '#8b5cf6', strokeColor: '#a78bfa', textColor: '#ffffff'
        } as any;
        const updated = [...nodes, newNode];
        setNodes(updated);
        setSelectedIds(new Set([newNode.id]));
        saveData(updated, strokes, viewport);
    }, [nodes, strokes, viewport, saveData, maxZ, containerRef]);

    const addStickyNode = useCallback((color = '#fef08a', canvasX?: number, canvasY?: number) => {
        const { cx, cy } = getCenter(canvasX, canvasY);
        const newNode: CanvasNode = {
            id: genId(), type: 'text', x: cx - 90, y: cy - 90,
            width: 180, height: 180, content: 'Nota...', zIndex: maxZ() + 1,
            color, textColor: '#1e293b'
        };
        const updated = [...nodes, newNode];
        setNodes(updated);
        setSelectedIds(new Set([newNode.id]));
        setEditingNodeId?.(newNode.id);
        saveData(updated, strokes, viewport);
    }, [nodes, strokes, viewport, saveData, maxZ, containerRef, setEditingNodeId]);

    const addVoiceNode = useCallback((canvasX?: number, canvasY?: number) => {
        const { cx, cy } = getCenter(canvasX, canvasY);
        const newNode: CanvasNode = {
            id: genId(), type: 'voice', x: cx - 150, y: cy - 40,
            width: 300, height: 80, content: 'Nota de Voz', zIndex: maxZ() + 1,
            color: '#0f172a', textColor: '#ffffff'
        };
        const updated = [...nodes, newNode];
        setNodes(updated);
        setSelectedIds(new Set([newNode.id]));
        saveData(updated, strokes, viewport);
    }, [nodes, strokes, viewport, saveData, maxZ, containerRef]);

    const addGenericNode = useCallback((type: string, title: string, color: string, w = 220, h = 120, canvasX?: number, canvasY?: number) => {
        const { cx, cy } = getCenter(canvasX, canvasY);
        const newNode: CanvasNode = {
            id: genId(), type: type as any, x: cx - w / 2, y: cy - h / 2,
            width: w, height: h, content: title, zIndex: maxZ() + 1,
            color, textColor: '#ffffff'
        };
        const updated = [...nodes, newNode];
        setNodes(updated);
        setSelectedIds(new Set([newNode.id]));
        saveData(updated, strokes, viewport);
    }, [nodes, strokes, viewport, saveData, maxZ, containerRef]);

    const addImageNode = useCallback((url: string, fileName?: string, canvasX?: number, canvasY?: number) => {
        const { cx, cy } = getCenter(canvasX, canvasY);
        const newNode: CanvasNode = {
            id: genId(), type: 'image', x: cx - 150, y: cy - 100,
            width: 300, height: 200, content: url, fileName, zIndex: maxZ() + 1
        };
        const updated = [...nodes, newNode];
        setNodes(updated);
        setSelectedIds(new Set([newNode.id]));
        saveData(updated, strokes, viewport);
    }, [nodes, strokes, viewport, saveData, maxZ, containerRef]);

    const addDocumentNode = useCallback((content: string, fileName?: string, fileType?: string, canvasX?: number, canvasY?: number) => {
        const { cx, cy } = getCenter(canvasX, canvasY);
        const newNode: CanvasNode = {
            id: genId(), type: 'document', x: cx - 120, y: cy - 80,
            width: 240, height: 160, content, fileName, fileType, zIndex: maxZ() + 1,
            color: '#0f172a', textColor: '#e2e8f0'
        };
        const updated = [...nodes, newNode];
        setNodes(updated);
        setSelectedIds(new Set([newNode.id]));
        saveData(updated, strokes, viewport);
    }, [nodes, strokes, viewport, saveData, maxZ, containerRef]);

    const addBrowserNode = useCallback((canvasXOrUrl?: number | string, canvasY?: number, initialUrl?: string) => {
        let posX: number | undefined;
        let posY: number | undefined;
        let url = 'https://google.com';

        if (typeof canvasXOrUrl === 'string') {
            url = canvasXOrUrl;
        } else if (typeof canvasXOrUrl === 'number') {
            posX = canvasXOrUrl;
            posY = canvasY;
            if (initialUrl) url = initialUrl;
        }

        const { cx, cy } = getCenter(posX, posY);
        const firstTabId = genId();
        const newNode: CanvasNode = {
            id: genId(), type: 'browser', x: cx - 400, y: cy - 250,
            width: 800, height: 500, content: url, browserUrl: url,
            browserTabs: [{ id: firstTabId, url, title: 'Navegador' }],
            activeTabId: firstTabId, zIndex: maxZ() + 1
        } as any;
        const updated = [...nodes, newNode];
        setNodes(updated);
        setSelectedIds(new Set([newNode.id]));
        saveData(updated, strokes, viewport);
    }, [nodes, strokes, viewport, saveData, maxZ, containerRef]);

    const addEmojiOrIconNode = useCallback((kind: 'emoji' | 'icon' | string, symbol: string, canvasX?: number, canvasY?: number) => {
        const { cx, cy } = getCenter(canvasX, canvasY);
        const isIcon = kind === 'icon';
        const newNode: CanvasNode = {
            id: genId(), type: isIcon ? 'icon' : 'emoji', x: cx - 40, y: cy - 40,
            width: 80, height: 80, content: symbol, zIndex: maxZ() + 1
        };
        const updated = [...nodes, newNode];
        setNodes(updated);
        setSelectedIds(new Set([newNode.id]));
        saveData(updated, strokes, viewport);
    }, [nodes, strokes, viewport, saveData, maxZ, containerRef]);

    const addFreeTextAt = useCallback((canvasX: number, canvasY: number, initialText = '') => {
        const newNode: CanvasNode = {
            id: genId(), type: 'freetext', x: canvasX, y: canvasY,
            width: 200, height: 40, content: initialText, zIndex: maxZ() + 1,
            color: 'transparent', textColor: '#ffffff'
        };
        const updated = [...nodes, newNode];
        setNodes(updated);
        setSelectedIds(new Set([newNode.id]));
        setEditingNodeId?.(newNode.id);
        saveData(updated, strokes, viewport);
    }, [nodes, strokes, viewport, saveData, maxZ, setEditingNodeId]);

    const duplicateNode = useCallback((nodeId: string) => {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return;
        const newNode: CanvasNode = {
            ...node, id: genId(), x: node.x + 30, y: node.y + 30, zIndex: maxZ() + 1
        };
        const updated = [...nodes, newNode];
        setNodes(updated);
        setSelectedIds(new Set([newNode.id]));
        saveData(updated, strokes, viewport);
    }, [nodes, strokes, viewport, saveData, maxZ]);

    const bringToFront = useCallback((nodeId: string) => {
        const highestZ = maxZ();
        const updated = nodes.map(n => n.id === nodeId ? { ...n, zIndex: highestZ + 1 } : n);
        setNodes(updated);
        saveData(updated, strokes, viewport);
    }, [nodes, strokes, viewport, saveData, maxZ]);

    const sendToBack = useCallback((nodeId: string) => {
        const lowestZ = nodes.reduce((m, n) => Math.min(m, n.zIndex || 0), 0);
        const updated = nodes.map(n => n.id === nodeId ? { ...n, zIndex: lowestZ - 1 } : n);
        setNodes(updated);
        saveData(updated, strokes, viewport);
    }, [nodes, strokes, viewport, saveData]);

    const handleQuickAdd = useCallback((type: string, canvasX?: number, canvasY?: number) => {
        setShowPickerPopover?.(false);
        setContextMenu?.(null);
        switch (type) {
            case 'page': addPageNode(canvasX, canvasY); break;
            case 'card': addCardNode(canvasX, canvasY); break;
            case 'text': addTextNode(canvasX, canvasY); break;
            case 'sticky': addStickyNode('#fef08a', canvasX, canvasY); break;
            case 'sticky-blue': addStickyNode('#bae6fd', canvasX, canvasY); break;
            case 'sticky-green': addStickyNode('#bbf7d0', canvasX, canvasY); break;
            case 'sticky-pink': addStickyNode('#fbcfe8', canvasX, canvasY); break;
            case 'frame': addFrameNode(canvasX, canvasY); break;
            case 'table': addTableNode(canvasX, canvasY); break;
            case 'checklist': addChecklistNode(canvasX, canvasY); break;
            case 'voice': addVoiceNode(canvasX, canvasY); break;
            case 'rectangle': addShapeNode('rectangle', canvasX, canvasY); break;
            case 'circle': addShapeNode('circle', canvasX, canvasY); break;
            case 'diamond': addShapeNode('diamond', canvasX, canvasY); break;
            default: addGenericNode(type, type.toUpperCase(), '#3b82f6', 200, 100, canvasX, canvasY); break;
        }
    }, [addPageNode, addCardNode, addTextNode, addStickyNode, addFrameNode, addTableNode, addChecklistNode, addVoiceNode, addShapeNode, addGenericNode, setShowPickerPopover, setContextMenu]);

    return {
        addFrameNode,
        addTableNode,
        addPageNode,
        addChecklistNode,
        addCardNode,
        addTextNode,
        addShapeNode,
        addStickyNode,
        addVoiceNode,
        addGenericNode,
        addImageNode,
        addDocumentNode,
        addBrowserNode,
        addEmojiOrIconNode,
        addFreeTextAt,
        duplicateNode,
        bringToFront,
        sendToBack,
        handleQuickAdd
    };
};
