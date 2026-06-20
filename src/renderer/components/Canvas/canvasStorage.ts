/**
 * Canvas Storage — localStorage persistence for canvas pages and nodes
 */

export interface CanvasNode {
    id: string;
    type: 'text' | 'freetext' | 'image' | 'document' | 'emoji' | 'icon' | 'profile' | 'social' | 'embed' | 'card' | 'table' | 'page' | 'checklist' | 'frame' | 'shape';
    x: number;
    y: number;
    width: number;
    height: number;
    content: string;
    fileName?: string;
    fileType?: string;
    color?: string;
    textColor?: string;
    fontSize?: number;
    zIndex: number;
    profileId?: string;
    socialPlatform?: string;
    tableData?: string[][];
    checklistData?: { id: string; text: string; checked: boolean }[];
    targetCanvasId?: string;
    layerName?: string;
    isLocked?: boolean;
    shapeType?: 'rectangle' | 'diamond' | 'ellipse' | 'line' | 'arrow' | 'triangle' | 'blockArrow' | 'elbowArrow';
    shapeStrokeWidth?: number;
    shapeStrokeStyle?: 'solid' | 'dashed' | 'dotted';
    shapeFillColor?: string;
    shapeRoughness?: number;
    flipped?: boolean;
}

export interface Stroke {
    id: string;
    points: { x: number; y: number }[];
    color: string;
    width: number;
    isArrow?: boolean;
}

export interface CanvasConnection {
    id: string;
    fromId: string;
    fromSide: 'n' | 'e' | 's' | 'w';
    toId: string;
    toSide: 'n' | 'e' | 's' | 'w';
    color?: string;
    label?: string;
    hasArrow?: boolean;
}

export interface CanvasData {
    nodes: CanvasNode[];
    strokes?: Stroke[];
    connections?: CanvasConnection[];
    viewport: { x: number; y: number; zoom: number };
}

export interface CanvasInfo {
    id: string;
    name: string;
    createdAt: number;
    updatedAt: number;
    parentId?: string;
    type?: 'canvas' | 'page' | 'card' | 'folder' | 'table' | 'space';
    color?: string;
    isDeleted?: boolean;
    deletedAt?: number;
    isFavorite?: boolean;
    coverImage?: string;
    description?: string;
    icon?: string;
    properties?: Record<string, string>;
    notes?: string;
}

const CANVAS_LIST_KEY = 'axe-canvas-list';
const CANVAS_DATA_PREFIX = 'axe-canvas-data-';

// ── List Operations ──

export function getCanvasList(): CanvasInfo[] {
    try {
        const raw = localStorage.getItem(CANVAS_LIST_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as CanvasInfo[];
        return Array.isArray(parsed) ? parsed.filter(c => c && c.id && c.name) : [];
    } catch {
        return [];
    }
}

function saveCanvasList(list: CanvasInfo[]): void {
    localStorage.setItem(CANVAS_LIST_KEY, JSON.stringify(list));
}

export function createCanvas(name: string, parentId?: string, type: 'canvas'|'page'|'card'|'table'|'folder'|'space' = 'canvas', forceId?: string): CanvasInfo {
    const list = getCanvasList();
    const info: CanvasInfo = {
        id: forceId || generateId(),
        name,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        parentId,
        type
    };
    list.unshift(info);
    saveCanvasList(list);

    // Initialize empty canvas data
    const emptyData: CanvasData = {
        nodes: [],
        viewport: { x: 0, y: 0, zoom: 1 },
    };
    localStorage.setItem(CANVAS_DATA_PREFIX + info.id, JSON.stringify(emptyData));

    return info;
}

export function createFolder(name: string, parentId?: string): CanvasInfo {
    const list = getCanvasList();
    const info: CanvasInfo = {
        id: generateId(),
        name,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        parentId,
        type: 'folder'
    };
    list.unshift(info);
    saveCanvasList(list);
    return info;
}

export function deleteCanvas(id: string): void {
    const list = getCanvasList();
    
    // Find all children recursively to delete them as well
    const idsToDelete = new Set<string>([id]);
    let added = true;
    while(added) {
        added = false;
        for (const c of list) {
            if (c.parentId && idsToDelete.has(c.parentId) && !idsToDelete.has(c.id)) {
                idsToDelete.add(c.id);
                added = true;
            }
        }
    }

    const remaining = list.filter(c => !idsToDelete.has(c.id));
    saveCanvasList(remaining);
    idsToDelete.forEach(deletedId => {
        localStorage.removeItem(CANVAS_DATA_PREFIX + deletedId);
    });
}

export function softDeleteCanvas(id: string): void {
    const list = getCanvasList();
    const idsToDelete = new Set<string>([id]);
    let added = true;
    while(added) {
        added = false;
        for (const c of list) {
            if (c.parentId && idsToDelete.has(c.parentId) && !idsToDelete.has(c.id)) {
                idsToDelete.add(c.id);
                added = true;
            }
        }
    }

    const now = Date.now();
    for (const c of list) {
        if (idsToDelete.has(c.id)) {
            c.isDeleted = true;
            c.deletedAt = now;
        }
    }
    saveCanvasList(list);
}

export function restoreCanvas(id: string): void {
    const list = getCanvasList();
    const idsToRestore = new Set<string>([id]);
    let added = true;
    while(added) {
        added = false;
        for (const c of list) {
            if (c.parentId && idsToRestore.has(c.parentId) && !idsToRestore.has(c.id)) {
                idsToRestore.add(c.id);
                added = true;
            }
        }
    }

    for (const c of list) {
        if (idsToRestore.has(c.id)) {
            c.isDeleted = false;
            c.deletedAt = undefined;
        }
    }
    saveCanvasList(list);
}

export function renameCanvas(id: string, name: string): void {
    const list = getCanvasList();
    const item = list.find(c => c.id === id);
    if (item) {
        item.name = name;
        item.updatedAt = Date.now();
        saveCanvasList(list);
    }
}

export function updateCanvasInfo(id: string, updates: Partial<CanvasInfo>): void {
    const list = getCanvasList();
    const item = list.find(c => c.id === id);
    if (item) {
        Object.assign(item, updates, { updatedAt: Date.now() });
        saveCanvasList(list);
    }
}

export function moveCanvasItem(id: string, targetId: string, position: 'before' | 'after' | 'inside'): void {
    const list = getCanvasList();
    const itemIndex = list.findIndex(c => c.id === id);
    if (itemIndex === -1) return;

    const item = list[itemIndex];
    list.splice(itemIndex, 1); // remove from current position

    if (position === 'inside') {
        item.parentId = targetId;
        // Place it as the first child of targetId
        const firstChildIndex = list.findIndex(c => c.parentId === targetId);
        if (firstChildIndex !== -1) {
            list.splice(firstChildIndex, 0, item);
        } else {
            // Target has no children yet, just put it right after the target folder
            const targetIndex = list.findIndex(c => c.id === targetId);
            list.splice(targetIndex !== -1 ? targetIndex + 1 : 0, 0, item);
        }
    } else {
        const targetIndex = list.findIndex(c => c.id === targetId);
        if (targetIndex !== -1) {
            // Inherit the parentId from the sibling we're dropping next to
            item.parentId = list[targetIndex].parentId;
            
            if (position === 'before') {
                list.splice(targetIndex, 0, item);
            } else {
                list.splice(targetIndex + 1, 0, item);
            }
        } else {
            list.push(item);
        }
    }
    
    item.updatedAt = Date.now();
    saveCanvasList(list);
}

export function duplicateCanvas(id: string): CanvasInfo | null {
    const list = getCanvasList();
    const original = list.find(c => c.id === id);
    if (!original) return null;

    const data = getCanvasData(id);
    const newInfo: CanvasInfo = {
        id: generateId(),
        name: `${original.name} (cópia)`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };
    list.unshift(newInfo);
    saveCanvasList(list);

    if (data) {
        // Deep-clone nodes with new IDs and keep mapping
        const idMap = new Map<string, string>();
        const clonedNodes = data.nodes.map(n => {
            const newId = generateId();
            idMap.set(n.id, newId);
            return { ...n, id: newId };
        });

        // Clone connections using mapped IDs
        const clonedConnections = (data.connections || []).map(conn => ({
            ...conn,
            id: generateId(),
            fromId: idMap.get(conn.fromId) || conn.fromId,
            toId: idMap.get(conn.toId) || conn.toId,
        }));

        const clonedData: CanvasData = {
            nodes: clonedNodes,
            strokes: data.strokes ? data.strokes.map(s => ({ ...s, id: generateId() })) : undefined,
            connections: clonedConnections,
            viewport: { ...data.viewport },
        };
        localStorage.setItem(CANVAS_DATA_PREFIX + newInfo.id, JSON.stringify(clonedData));
    }

    return newInfo;
}

// ── Canvas Data Operations ──

export function getCanvasData(id: string): CanvasData | null {
    try {
        const raw = localStorage.getItem(CANVAS_DATA_PREFIX + id);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as CanvasData;
        return {
            nodes: parsed.nodes || [],
            strokes: parsed.strokes || [],
            connections: parsed.connections || [],
            viewport: parsed.viewport || { x: 0, y: 0, zoom: 1 }
        };
    } catch {
        return null;
    }
}

export function saveCanvasData(id: string, data: CanvasData): void {
    localStorage.setItem(CANVAS_DATA_PREFIX + id, JSON.stringify(data));

    // Update the updatedAt timestamp
    const list = getCanvasList();
    const item = list.find(c => c.id === id);
    if (item) {
        item.updatedAt = Date.now();
        saveCanvasList(list);
    }
}

// ── Debounced Save ──

const saveTimers: Record<string, ReturnType<typeof setTimeout>> = {};

export function debouncedSaveCanvasData(id: string, data: CanvasData, delay = 500): void {
    if (saveTimers[id]) {
        clearTimeout(saveTimers[id]);
    }
    saveTimers[id] = setTimeout(() => {
        saveCanvasData(id, data);
        delete saveTimers[id];
    }, delay);
}

// ── Helpers ──

function generateId(): string {
    return Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9);
}

// ── Vault (Cofre) Backup / Import / Export Operations ──

export function exportBackupData(): string {
    const list = getCanvasList();
    const backup: Record<string, any> = {
        version: '1.0',
        list,
        canvases: {},
    };
    list.forEach(c => {
        const data = getCanvasData(c.id);
        if (data) backup.canvases[c.id] = data;
    });
    return JSON.stringify(backup, null, 2);
}

export function importBackupData(jsonString: string): boolean {
    try {
        const backup = JSON.parse(jsonString);
        if (!backup.list || !backup.canvases) return false;

        const currentList = getCanvasList();
        const newList = [...backup.list];

        newList.forEach(item => {
            // Check if active ID or duplicate canvas name already exists in current list
            const exists = currentList.some(c => c.id === item.id);
            const finalId = exists ? generateId() : item.id;
            const finalName = exists ? `${item.name} (importado)` : item.name;

            const canvasData = backup.canvases[item.id];
            if (canvasData) {
                const info: CanvasInfo = {
                    id: finalId,
                    name: finalName,
                    createdAt: item.createdAt || Date.now(),
                    updatedAt: Date.now(),
                };

                // Add to start of list
                currentList.unshift(info);

                // Save data under new ID
                localStorage.setItem(CANVAS_DATA_PREFIX + finalId, JSON.stringify(canvasData));
            }
        });

        localStorage.setItem(CANVAS_LIST_KEY, JSON.stringify(currentList));
        return true;
    } catch (e) {
        console.error('Erro ao importar cofre:', e);
        return false;
    }
}

export function exportCanvas(id: string): { name: string; content: string } | null {
    const list = getCanvasList();
    const info = list.find(c => c.id === id);
    const data = getCanvasData(id);
    if (!info || !data) return null;

    const exportData = {
        type: 'axecanvas',
        version: '1.0',
        info,
        data,
    };
    return {
        name: `${info.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.axecanvas`,
        content: JSON.stringify(exportData, null, 2),
    };
}

export function importCanvas(jsonString: string): CanvasInfo | null {
    try {
        const parsed = JSON.parse(jsonString);
        if (parsed.type !== 'axecanvas' || !parsed.info || !parsed.data) return null;

        const list = getCanvasList();
        const id = generateId(); // Always assign a fresh unique ID
        const info: CanvasInfo = {
            id,
            name: `${parsed.info.name} (importado)`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        list.unshift(info);
        localStorage.setItem(CANVAS_LIST_KEY, JSON.stringify(list));
        localStorage.setItem(CANVAS_DATA_PREFIX + id, JSON.stringify(parsed.data));

        return info;
    } catch (e) {
        console.error('Erro ao importar canvas individual:', e);
        return null;
    }
}

