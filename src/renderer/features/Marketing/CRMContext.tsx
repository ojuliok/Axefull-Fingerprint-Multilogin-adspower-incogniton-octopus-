import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
    MarketingSpace,
    MarketingFolder,
    MarketingBoard,
    MarketingGroup,
    MarketingCardData,
    getMarketingData, 
    createSpace as createStorageSpace,
    updateSpace as updateStorageSpace,
    deleteSpace as deleteStorageSpace,
    createFolder as createStorageFolder,
    updateFolder as updateStorageFolder,
    deleteFolder as deleteStorageFolder,
    createBoard as createStorageBoard,
    updateBoard as updateStorageBoard,
    deleteBoard as deleteStorageBoard,
    createGroup as createStorageGroup,
    updateGroup as updateStorageGroup,
    deleteGroup as deleteStorageGroup,
    createMarketingCard as createStorageCard, 
    updateMarketingCard as updateStorageCard,
    deleteMarketingCard as deleteStorageCard,
    moveMarketingCard as moveStorageCard
} from './marketingStorage';
import { useWorkspace } from '../../context/WorkspaceContext';
import { getCanvasList, CanvasInfo } from '../Canvas/canvasStorage';

interface CRMContextType {
    spaces: MarketingSpace[];
    folders: MarketingFolder[];
    boards: MarketingBoard[];
    groups: MarketingGroup[];
    leads: MarketingCardData[];
    
    activeSpaceId: string | null;
    setActiveSpaceId: (id: string | null) => void;
    activeBoardId: string | null;
    setActiveBoardId: (id: string | null) => void;
    
    viewMode: 'board' | 'list';
    setViewMode: (mode: 'board' | 'list') => void;
    selectedLeadId: string | null;
    setSelectedLeadId: (id: string | null) => void;
    
    // Spaces
    addSpace: (title: string, description?: string, color?: string, isPrivate?: boolean) => void;
    updateSpace: (id: string, updates: Partial<MarketingSpace>) => void;
    deleteSpace: (id: string) => void;

    // Folders
    addFolder: (spaceId: string, title: string) => void;
    updateFolder: (id: string, updates: Partial<MarketingFolder>) => void;
    deleteFolder: (id: string) => void;

    // Boards
    addBoard: (spaceId: string, folderId: string | null, title: string) => void;
    updateBoard: (id: string, updates: Partial<MarketingBoard>) => void;
    deleteBoard: (id: string) => void;
    
    // Groups
    addGroup: (boardId: string, title: string, color: string) => void;
    updateGroup: (id: string, updates: Partial<MarketingGroup>) => void;
    deleteGroup: (id: string) => void;

    // Leads
    addLead: (boardId: string, groupId: string, title: string) => void;
    updateLead: (id: string, updates: Partial<MarketingCardData>) => void;
    deleteLead: (id: string) => void;
    moveLead: (id: string, groupId: string) => void;
    
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    filterAssignee: string | null;
    setFilterAssignee: (assignee: string | null) => void;
    filterPriority: string | null;
    setFilterPriority: (priority: string | null) => void;

    // Derived
    selectedLead: MarketingCardData | undefined;
    activeSpace: MarketingSpace | undefined;
    activeBoard: MarketingBoard | undefined;
    activeGroups: MarketingGroup[];
    activeLeads: MarketingCardData[];
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export const CRMProvider: React.FC<{ children: ReactNode, forcedBoardId?: string }> = ({ children, forcedBoardId }) => {
    const { currentWorkspace } = useWorkspace();
    const [canvasList, setCanvasList] = useState<CanvasInfo[]>([]);

    useEffect(() => {
        if (currentWorkspace?.id) {
            getCanvasList(currentWorkspace.id).then(list => setCanvasList(list));
        }
    }, [currentWorkspace?.id]);

    const [spaces, setSpaces] = useState<MarketingSpace[]>([]);
    const [folders, setFolders] = useState<MarketingFolder[]>([]);
    const [boards, setBoards] = useState<MarketingBoard[]>([]);
    const [groups, setGroups] = useState<MarketingGroup[]>([]);
    const [leads, setLeads] = useState<MarketingCardData[]>([]);
    
    const [activeSpaceId, setActiveSpaceId] = useState<string | null>(null);
    const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'board' | 'list'>('list');
    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [filterAssignee, setFilterAssignee] = useState<string | null>(null);
    const [filterPriority, setFilterPriority] = useState<string | null>(null);

    useEffect(() => {
        const payload = getMarketingData();
        setSpaces(payload.spaces);
        setFolders(payload.folders);
        setBoards(payload.boards);
        setGroups(payload.groups);
        setLeads(payload.leads);
        
        if (payload.spaces.length > 0) {
            setActiveSpaceId(payload.spaces[0].id);
        }
        if (forcedBoardId) {
            setActiveBoardId(forcedBoardId);
        } else if (payload.boards.length > 0) {
            setActiveBoardId(payload.boards[0].id);
        }
    }, [forcedBoardId]);

    // Space Actions
    const addSpace = (title: string, description?: string, color?: string, isPrivate?: boolean) => {
        const newSpace = createStorageSpace(title, description, color, isPrivate);
        setSpaces(prev => [...prev, newSpace]);
        setActiveSpaceId(newSpace.id);
    };
    const updateSpaceAction = (id: string, updates: Partial<MarketingSpace>) => {
        updateStorageSpace(id, updates);
        setSpaces(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    };
    const deleteSpaceAction = (id: string) => {
        deleteStorageSpace(id);
        setSpaces(prev => prev.filter(s => s.id !== id));
        setFolders(prev => prev.filter(f => f.spaceId !== id));
        const deletedBoards = boards.filter(b => b.spaceId === id).map(b => b.id);
        setBoards(prev => prev.filter(b => b.spaceId !== id));
        setGroups(prev => prev.filter(g => !deletedBoards.includes(g.boardId)));
        setLeads(prev => prev.filter(l => !deletedBoards.includes(l.boardId)));
        if (activeSpaceId === id) setActiveSpaceId(null);
    };

    // Folder Actions
    const addFolder = (spaceId: string, title: string) => {
        const newFolder = createStorageFolder(spaceId, title);
        setFolders(prev => [...prev, newFolder]);
    };
    const updateFolderAction = (id: string, updates: Partial<MarketingFolder>) => {
        updateStorageFolder(id, updates);
        setFolders(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    };
    const deleteFolderAction = (id: string) => {
        deleteStorageFolder(id);
        setFolders(prev => prev.filter(f => f.id !== id));
        const deletedBoards = boards.filter(b => b.folderId === id).map(b => b.id);
        setBoards(prev => prev.filter(b => b.folderId !== id));
        setGroups(prev => prev.filter(g => !deletedBoards.includes(g.boardId)));
        setLeads(prev => prev.filter(l => !deletedBoards.includes(l.boardId)));
    };

    // Board Actions
    const addBoard = (spaceId: string, folderId: string | null, title: string) => {
        const newBoard = createStorageBoard(spaceId, folderId, title);
        const payload = getMarketingData(); // Reload to get the default group
        setBoards(payload.boards);
        setGroups(payload.groups);
        setActiveBoardId(newBoard.id);
        setActiveSpaceId(spaceId);
    };
    const updateBoardAction = (id: string, updates: Partial<MarketingBoard>) => {
        updateStorageBoard(id, updates);
        setBoards(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    };
    const deleteBoardAction = (id: string) => {
        deleteStorageBoard(id);
        setBoards(prev => prev.filter(b => b.id !== id));
        setGroups(prev => prev.filter(g => g.boardId !== id));
        setLeads(prev => prev.filter(l => l.boardId !== id));
        if (activeBoardId === id) setActiveBoardId(null);
    };

    // Group Actions
    const addGroup = (boardId: string, title: string, color: string) => {
        const newGroup = createStorageGroup(boardId, title, color);
        setGroups(prev => [...prev, newGroup]);
    };
    const updateGroupAction = (id: string, updates: Partial<MarketingGroup>) => {
        updateStorageGroup(id, updates);
        setGroups(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
    };
    const deleteGroupAction = (id: string) => {
        deleteStorageGroup(id);
        setGroups(prev => prev.filter(g => g.id !== id));
        setLeads(prev => prev.filter(l => l.groupId !== id));
    };

    // Lead Actions
    const addLead = (boardId: string, groupId: string, title: string) => {
        const newCard = createStorageCard(boardId, groupId, title);
        setLeads(prev => [...prev, newCard]);
    };
    const updateLeadAction = (id: string, updates: Partial<MarketingCardData>) => {
        updateStorageCard(id, updates);
        setLeads(prev => prev.map(lead => lead.id === id ? { ...lead, ...updates, updatedAt: Date.now() } : lead));
    };
    const deleteLeadAction = (id: string) => {
        deleteStorageCard(id);
        setLeads(prev => prev.filter(lead => lead.id !== id));
        if (selectedLeadId === id) setSelectedLeadId(null);
    };
    const moveLeadAction = (id: string, groupId: string) => {
        moveStorageCard(id, groupId);
        setLeads(prev => prev.map(lead => lead.id === id ? { ...lead, groupId, updatedAt: Date.now() } : lead));
    };

    const selectedLead = leads.find(l => l.id === selectedLeadId);
    const activeSpace = spaces.find(s => s.id === activeSpaceId);
    let activeBoard = boards.find(b => b.id === activeBoardId);
    
    // Fallback to Canvas Storage if this is a CRM/Table canvas
    if (!activeBoard && activeBoardId) {
        const canvas = canvasList.find(c => c.id === activeBoardId);
        if (canvas) {
            activeBoard = {
                id: canvas.id,
                title: canvas.name,
                spaceId: canvas.parentId || '',
                folderId: null,
                createdAt: canvas.createdAt,
                updatedAt: canvas.updatedAt
            };
        }
    }

    const activeGroups = groups.filter(g => g.boardId === activeBoardId).sort((a, b) => a.order - b.order);
    const activeLeads = leads
        .filter(l => l.boardId === activeBoardId)
        .filter(l => !searchQuery.trim() ? true : l.title.toLowerCase().includes(searchQuery.toLowerCase().trim()))
        .filter(l => !filterAssignee ? true : l.assignee === filterAssignee)
        .filter(l => !filterPriority ? true : l.priority === filterPriority);

    return (
        <CRMContext.Provider value={{
            spaces, folders, boards, groups, leads,
            activeSpaceId, setActiveSpaceId,
            activeBoardId, setActiveBoardId,
            viewMode, setViewMode,
            selectedLeadId, setSelectedLeadId,
            searchQuery, setSearchQuery,
            filterAssignee, setFilterAssignee,
            filterPriority, setFilterPriority,
            addSpace, updateSpace: updateSpaceAction, deleteSpace: deleteSpaceAction,
            addFolder, updateFolder: updateFolderAction, deleteFolder: deleteFolderAction,
            addBoard, updateBoard: updateBoardAction, deleteBoard: deleteBoardAction,
            addGroup, updateGroup: updateGroupAction, deleteGroup: deleteGroupAction,
            addLead, updateLead: updateLeadAction, deleteLead: deleteLeadAction, moveLead: moveLeadAction,
            selectedLead, activeSpace, activeBoard, activeGroups, activeLeads
        }}>
            {children}
        </CRMContext.Provider>
    );
};

export const useCRMState = () => {
    const context = useContext(CRMContext);
    if (!context) {
        throw new Error('useCRMState must be used within a CRMProvider');
    }
    return context;
};
