export interface BrowserTab {
    id: string;
    url: string;
    title: string;
}

export interface CanvasNode {
    id: string;
    type: 'text' | 'freetext' | 'image' | 'document' | 'emoji' | 'icon' | 'profile' | 'social' | 'embed' | 'card' | 'table' | 'page' | 'checklist' | 'frame' | 'shape' | 'browser';
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
    browserUrl?: string;
    browserTabs?: BrowserTab[];
    activeTabId?: string;
    browserProxy?: string;
    opacity?: number;
    borderRadius?: number;
    borderWidth?: number;
    borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
    borderColor?: string;
    shadowIntensity?: 'none' | 'sm' | 'md' | 'lg' | 'glow';
    padding?: number;
    blurBackground?: boolean;
    fontFamily?: 'sans' | 'serif' | 'mono';
    textAlignment?: 'left' | 'center' | 'right' | 'justify';
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
    tags?: string[];
    notes?: string;
}
