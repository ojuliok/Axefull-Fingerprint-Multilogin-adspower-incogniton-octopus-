import { v4 as uuidv4 } from 'uuid';

export type MarketingPriority = 'Alta' | 'Média' | 'Baixa';

export interface MarketingSpace {
    id: string;
    title: string;
    description?: string;
    color?: string;
    isPrivate?: boolean;
    createdAt: number;
}

export interface MarketingFolder {
    id: string;
    spaceId: string;
    title: string;
    createdAt: number;
}

export interface MarketingBoard {
    id: string;
    spaceId: string; // the board must belong to a space
    folderId?: string | null; // optionally belongs to a folder
    title: string;
    columns: string[]; // e.g., 'status', 'deadline', 'priority', 'notes', 'budget', 'files', 'assignee'
    customColumnNames?: Record<string, string>;
    createdAt: number;
}

export interface MarketingGroup {
    id: string;
    boardId: string;
    title: string;
    color: string;
    order: number;
}

export interface LeadUpdate {
    id: string;
    author: string;
    content: string;
    createdAt: number;
}

export interface MarketingCardData {
    id: string;
    boardId: string;
    groupId: string;
    title: string;
    description: string;
    status: string;
    priority?: MarketingPriority;
    deadline?: number | null;
    budget?: number;
    notes?: string;
    assignee?: string;
    value?: number;
    company?: string;
    contact?: string;
    updates?: LeadUpdate[];
    tags?: string[];
    timeSpent?: number;
    profileId?: string;
    subtasks?: { id: string; title: string; done: boolean }[];
    updatedAt: number;
    createdAt: number;
}

interface CRMDataPayload {
    spaces: MarketingSpace[];
    folders: MarketingFolder[];
    boards: MarketingBoard[];
    groups: MarketingGroup[];
    leads: MarketingCardData[];
}

const STORAGE_KEY = 'axe_marketing_crm_data_v3'; // Migration to v3 for Space/Folder
const OLD_STORAGE_KEY_V2 = 'axe_marketing_crm_data_v2';
const OLD_STORAGE_KEY_V1 = 'axe_marketing_crm_data';

const DEFAULT_COLUMNS = ['status', 'assignee', 'deadline', 'priority', 'notes', 'budget', 'files'];

const DEFAULT_SPACE: MarketingSpace = {
    id: 'default-space',
    title: 'Meu Espaço',
    createdAt: Date.now()
};

const DEFAULT_BOARD: MarketingBoard = {
    id: 'default-board',
    spaceId: 'default-space',
    folderId: null,
    title: 'Pipeline Principal',
    columns: DEFAULT_COLUMNS,
    createdAt: Date.now()
};

const DEFAULT_GROUPS: MarketingGroup[] = [
    { id: 'group-novo', boardId: 'default-board', title: 'Novo', color: '#0ea5e9', order: 0 },
    { id: 'group-contato', boardId: 'default-board', title: 'Em Contato', color: '#f59e0b', order: 1 },
    { id: 'group-proposta', boardId: 'default-board', title: 'Proposta', color: '#8b5cf6', order: 2 },
    { id: 'group-parado', boardId: 'default-board', title: 'Parado', color: '#ef4444', order: 3 },
    { id: 'group-ganho', boardId: 'default-board', title: 'Ganho', color: '#10b981', order: 4 },
];

export const getMarketingData = (): CRMDataPayload => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            return JSON.parse(data);
        }

        // Migration from V2
        const dataV2 = localStorage.getItem(OLD_STORAGE_KEY_V2);
        if (dataV2) {
            const parsedV2 = JSON.parse(dataV2);
            // Add default space to all existing boards
            const migratedBoards: MarketingBoard[] = (parsedV2.boards || []).map((b: any) => ({
                ...b,
                spaceId: 'default-space',
                folderId: null
            }));

            const payload: CRMDataPayload = {
                spaces: [DEFAULT_SPACE],
                folders: [],
                boards: migratedBoards,
                groups: parsedV2.groups || [],
                leads: parsedV2.leads || []
            };
            saveMarketingData(payload);
            return payload;
        }

        // Migration from V1
        const oldData = localStorage.getItem(OLD_STORAGE_KEY_V1);
        if (oldData) {
            const oldLeads: any[] = JSON.parse(oldData);
            const migratedLeads: MarketingCardData[] = oldLeads.map(lead => {
                let groupId = 'group-novo';
                let status = lead.stage;
                if (lead.stage === 'Em Contato') groupId = 'group-contato';
                if (lead.stage === 'Proposta') groupId = 'group-proposta';
                if (lead.stage === 'Parado') groupId = 'group-parado';
                if (lead.stage === 'Ganho') groupId = 'group-ganho';

                return {
                    ...lead,
                    boardId: 'default-board',
                    groupId: groupId,
                    status: status
                };
            });

            const payload: CRMDataPayload = {
                spaces: [DEFAULT_SPACE],
                folders: [],
                boards: [DEFAULT_BOARD],
                groups: DEFAULT_GROUPS,
                leads: migratedLeads
            };
            saveMarketingData(payload);
            return payload;
        }
    } catch (e) {
        console.error('Error reading marketing data', e);
    }
    
    // Completely new
    const newPayload: CRMDataPayload = {
        spaces: [DEFAULT_SPACE],
        folders: [],
        boards: [DEFAULT_BOARD],
        groups: DEFAULT_GROUPS,
        leads: []
    };
    saveMarketingData(newPayload);
    return newPayload;
};

export const saveMarketingData = (payload: CRMDataPayload) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
        console.error('Error saving marketing data', e);
    }
};

// SPACE ACTIONS
export const createSpace = (title: string, description?: string, color?: string, isPrivate?: boolean): MarketingSpace => {
    const payload = getMarketingData();
    const newSpace: MarketingSpace = {
        id: uuidv4(),
        title,
        description,
        color,
        isPrivate,
        createdAt: Date.now()
    };
    payload.spaces.push(newSpace);
    saveMarketingData(payload);
    return newSpace;
};

export const deleteSpace = (id: string) => {
    const payload = getMarketingData();
    payload.spaces = payload.spaces.filter(s => s.id !== id);
    payload.folders = payload.folders.filter(f => f.spaceId !== id);
    const boardsToDelete = payload.boards.filter(b => b.spaceId === id).map(b => b.id);
    payload.boards = payload.boards.filter(b => b.spaceId !== id);
    payload.groups = payload.groups.filter(g => !boardsToDelete.includes(g.boardId));
    payload.leads = payload.leads.filter(l => !boardsToDelete.includes(l.boardId));
    saveMarketingData(payload);
};

export const updateSpace = (id: string, updates: Partial<MarketingSpace>) => {
    const payload = getMarketingData();
    const index = payload.spaces.findIndex(s => s.id === id);
    if (index !== -1) {
        payload.spaces[index] = { ...payload.spaces[index], ...updates };
        saveMarketingData(payload);
    }
};

// FOLDER ACTIONS
export const createFolder = (spaceId: string, title: string): MarketingFolder => {
    const payload = getMarketingData();
    const newFolder: MarketingFolder = {
        id: uuidv4(),
        spaceId,
        title,
        createdAt: Date.now()
    };
    payload.folders.push(newFolder);
    saveMarketingData(payload);
    return newFolder;
};

export const deleteFolder = (id: string) => {
    const payload = getMarketingData();
    payload.folders = payload.folders.filter(f => f.id !== id);
    const boardsToDelete = payload.boards.filter(b => b.folderId === id).map(b => b.id);
    payload.boards = payload.boards.filter(b => b.folderId !== id);
    payload.groups = payload.groups.filter(g => !boardsToDelete.includes(g.boardId));
    payload.leads = payload.leads.filter(l => !boardsToDelete.includes(l.boardId));
    saveMarketingData(payload);
};

export const updateFolder = (id: string, updates: Partial<MarketingFolder>) => {
    const payload = getMarketingData();
    const index = payload.folders.findIndex(f => f.id === id);
    if (index !== -1) {
        payload.folders[index] = { ...payload.folders[index], ...updates };
        saveMarketingData(payload);
    }
};

// BOARD ACTIONS
export const createBoard = (spaceId: string, folderId: string | null, title: string): MarketingBoard => {
    const payload = getMarketingData();
    const newBoard: MarketingBoard = {
        id: uuidv4(),
        spaceId,
        folderId,
        title,
        columns: ['status'], // Zerada by default
        createdAt: Date.now()
    };
    const defaultGroup: MarketingGroup = {
        id: uuidv4(),
        boardId: newBoard.id,
        title: 'Grupo de Tarefas',
        color: '#0ea5e9',
        order: 0
    };
    payload.boards.push(newBoard);
    payload.groups.push(defaultGroup);
    saveMarketingData(payload);
    return newBoard;
};

export const updateBoard = (id: string, updates: Partial<MarketingBoard>) => {
    const payload = getMarketingData();
    const index = payload.boards.findIndex(b => b.id === id);
    if (index !== -1) {
        payload.boards[index] = { ...payload.boards[index], ...updates };
        saveMarketingData(payload);
    }
};

export const deleteBoard = (id: string) => {
    const payload = getMarketingData();
    payload.boards = payload.boards.filter(b => b.id !== id);
    payload.groups = payload.groups.filter(g => g.boardId !== id);
    payload.leads = payload.leads.filter(l => l.boardId !== id);
    saveMarketingData(payload);
};

// GROUP ACTIONS
export const createGroup = (boardId: string, title: string, color: string): MarketingGroup => {
    const payload = getMarketingData();
    const newGroup: MarketingGroup = {
        id: uuidv4(),
        boardId,
        title,
        color,
        order: payload.groups.filter(g => g.boardId === boardId).length
    };
    payload.groups.push(newGroup);
    saveMarketingData(payload);
    return newGroup;
};

export const updateGroup = (id: string, updates: Partial<MarketingGroup>) => {
    const payload = getMarketingData();
    const index = payload.groups.findIndex(g => g.id === id);
    if (index !== -1) {
        payload.groups[index] = { ...payload.groups[index], ...updates };
        saveMarketingData(payload);
    }
};

export const deleteGroup = (id: string) => {
    const payload = getMarketingData();
    payload.groups = payload.groups.filter(g => g.id !== id);
    payload.leads = payload.leads.filter(l => l.groupId !== id);
    saveMarketingData(payload);
};

// CARD ACTIONS
export const createMarketingCard = (boardId: string, groupId: string, title: string, status: string = 'Novo'): MarketingCardData => {
    const payload = getMarketingData();
    const board = payload.boards.find(b => b.id === boardId);
    
    const newCard: MarketingCardData = {
        id: uuidv4(),
        boardId,
        groupId,
        title,
        description: '',
        status,
        priority: 'Média',
        deadline: null,
        budget: 0,
        notes: '',
        assignee: 'Não atribuído',
        createdAt: Date.now(),
        updatedAt: Date.now()
    };

    if (board && board.columns) {
        board.columns.forEach(col => {
            if (col.startsWith('custom_status_')) {
                (newCard as any)[col] = 'Novo';
            } else if (col.startsWith('custom_dropdown_')) {
                (newCard as any)[col] = 'Opção 1';
            } else if (col.startsWith('custom_text_')) {
                (newCard as any)[col] = '';
            } else if (col.startsWith('custom_date_')) {
                (newCard as any)[col] = null;
            } else if (col.startsWith('custom_people_')) {
                (newCard as any)[col] = '';
            } else if (col.startsWith('custom_number_')) {
                (newCard as any)[col] = 0;
            }
        });
    }

    payload.leads.push(newCard);
    saveMarketingData(payload);
    return newCard;
};

export const updateMarketingCard = (id: string, updates: Partial<MarketingCardData>) => {
    const payload = getMarketingData();
    const index = payload.leads.findIndex(c => c.id === id);
    if (index !== -1) {
        payload.leads[index] = { ...payload.leads[index], ...updates, updatedAt: Date.now() };
        saveMarketingData(payload);
    }
};

export const deleteMarketingCard = (id: string) => {
    const payload = getMarketingData();
    payload.leads = payload.leads.filter(c => c.id !== id);
    saveMarketingData(payload);
};

export const moveMarketingCard = (cardId: string, newGroupId: string) => {
    const payload = getMarketingData();
    const index = payload.leads.findIndex(c => c.id === cardId);
    if (index !== -1) {
        payload.leads[index].groupId = newGroupId;
        payload.leads[index].updatedAt = Date.now();
        saveMarketingData(payload);
    }
};
