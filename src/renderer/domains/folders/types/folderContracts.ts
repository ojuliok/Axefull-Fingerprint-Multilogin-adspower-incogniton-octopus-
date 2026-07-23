// src/renderer/domains/folders/types/folderContracts.ts
// Interfaces e contratos formais do Domínio de Árvore de Pastas e Navegação

export interface CanvasInfo {
    id: string;
    name: string;
    title?: string;
    createdAt: number;
    updatedAt: number;
    parentId?: string;
    type: 'canvas' | 'folder' | 'document';
    revision?: number;
    isDeleted?: boolean;
    deletedAt?: number;
}

export interface IFolderService {
    getCanvasList(workspaceId: string): Promise<CanvasInfo[]>;
    createFolder(workspaceId: string, ownerId: string, name: string, parentId?: string): Promise<CanvasInfo>;
    moveCanvas(id: string, targetId: string, position: 'inside' | 'before' | 'after', workspaceId: string): Promise<void>;
    softDeleteCanvas(id: string): Promise<void>;
}
