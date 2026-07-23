# Contratos e Interfaces TypeScript

## Visão Geral
Este documento especifica os contratos de dados e abstrações de serviços (*Interfaces*) que servem como fronteiras rígidas entre os domínios. A implementação concreta de cada serviço pode variar (LocalStorage, Supabase ou IPC), mas todos os componentes de UI consomem estritamente estas interfaces.

---

## 1. Contrato do Domínio Canvas (`ICanvasService`)

```typescript
export interface ICanvasService {
    getCanvasData(id: string): Promise<VersionedCanvasData | null>;
    saveCanvasData(id: string, data: CanvasData, expectedRevision?: number): Promise<SaveResult>;
    debouncedSaveCanvasData(id: string, data: CanvasData, delayMs?: number): void;
    flushPendingSave(id: string): void;
    createCanvas(workspaceId: string, ownerId: string, name: string, parentId?: string): Promise<CanvasInfo>;
    deleteCanvas(id: string): Promise<void>;
}

export interface VersionedCanvasData {
    revision: number;
    updatedAt: string;
    updatedBy: string;
    data: CanvasData;
    nodes: CanvasNode[];
    viewport: Viewport;
    strokes: Stroke[];
    connections: CanvasConnection[];
}

export interface SaveResult {
    success: boolean;
    revision: number;
    hasConflict?: boolean;
}
```

---

## 2. Contrato do Domínio CRM (`ICRMService`)

```typescript
export interface ICRMService {
    getLeads(boardId: string): Promise<MarketingCardData[]>;
    addLead(boardId: string, groupId: string, title: string): Promise<MarketingCardData>;
    updateLead(id: string, updates: Partial<MarketingCardData>, immediate?: boolean): void;
    deleteLead(id: string): Promise<void>;
    moveLead(id: string, targetGroupId: string): Promise<void>;
    flushPendingLeadUpdate(id: string): void;
}

export interface MarketingCardData {
    id: string;
    boardId: string;
    groupId: string;
    title: string;
    description?: string;
    status: string;
    priority: 'Alta' | 'Média' | 'Baixa';
    deadline?: string | null;
    budget?: number;
    notes?: string;
    assignee?: string;
    timeSpent?: number;
    createdAt: number;
    updatedAt: number;
}
```

---

## 3. Contrato do Domínio de Árvore de Pastas (`IFolderService`)

```typescript
export interface IFolderService {
    getCanvasList(workspaceId: string): Promise<CanvasInfo[]>;
    createFolder(workspaceId: string, ownerId: string, name: string, parentId?: string): Promise<CanvasInfo>;
    moveCanvas(id: string, targetId: string, position: 'inside' | 'before' | 'after', workspaceId: string): Promise<void>;
    softDeleteCanvas(id: string): Promise<void>;
}

export interface CanvasInfo {
    id: string;
    name: string;
    title?: string;
    createdAt: number;
    updatedAt: number;
    parentId?: string;
    type: 'canvas' | 'folder' | 'document';
    revision?: number;
}
```

---

## 4. Contrato de Comunicação entre Domínios (`IEventBus`)

```typescript
export interface AppEventMap {
    'canvas:node-selected': { canvasId: string; nodeId: string; nodeType: string };
    'canvas:request-open-document': { documentId: string };
    'crm:lead-updated': { leadId: string; updates: Partial<MarketingCardData> };
    'crm:reload-leads': { boardId?: string };
    'workspace:changed': { newWorkspaceId: string };
}

export interface IEventBus {
    emit<K extends keyof AppEventMap>(event: K, payload: AppEventMap[K]): void;
    on<K extends keyof AppEventMap>(event: K, handler: (payload: AppEventMap[K]) => void): () => void;
    off<K extends keyof AppEventMap>(event: K, handler: (payload: AppEventMap[K]) => void): void;
}
```
