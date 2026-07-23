// src/renderer/domains/canvas/types/canvasContracts.ts
// Interfaces e contratos formais do Domínio Canvas 2D

export interface Viewport {
    x: number;
    y: number;
    zoom: number;
}

export interface CanvasNode {
    id: string;
    type: 'text' | 'freetext' | 'shape' | 'card' | 'image' | 'video' | 'embed' | 'document' | 'voice';
    x: number;
    y: number;
    width: number;
    height: number;
    content?: string;
    color?: string;
    title?: string;
    isLocked?: boolean;
    zIndex?: number;
    properties?: Record<string, any>;
    url?: string;
    cardId?: string;
}

export interface Stroke {
    id: string;
    points: { x: number; y: number }[];
    color: string;
    width: number;
}

export interface CanvasConnection {
    id: string;
    fromId: string;
    fromSide: 'n' | 'e' | 's' | 'w';
    toId: string;
    toSide: 'n' | 'e' | 's' | 'w';
    color?: string;
    label?: string;
}

export interface CanvasData {
    nodes: CanvasNode[];
    viewport: Viewport;
    strokes?: Stroke[];
    connections?: CanvasConnection[];
}

export interface VersionedCanvasData {
    revision: number;
    updatedAt: string;
    updatedBy: string;
    data: CanvasData;
    nodes: CanvasNode[];
    viewport: Viewport;
    strokes?: Stroke[];
    connections?: CanvasConnection[];
}

export interface ICanvasService {
    getCanvasData(id: string): Promise<VersionedCanvasData | null>;
    saveCanvasData(id: string, data: CanvasData, expectedRevision?: number): Promise<void>;
    debouncedSaveCanvasData(id: string, data: CanvasData, delayMs?: number): void;
    flushPendingSave(id: string): void;
}
