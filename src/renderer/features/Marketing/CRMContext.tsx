import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MarketingSpace, MarketingFolder, MarketingBoard, MarketingGroup, MarketingCardData } from './marketingStorage';
import { useWorkspace } from '../../context/WorkspaceContext';
import { getCanvasList, getCanvasData, saveCanvasData, CanvasInfo } from '../Canvas/canvasStorage';

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
    
    // Groups
    addGroup: (boardId: string, title: string, color: string) => void;
    updateGroup: (id: string, updates: Partial<MarketingGroup>) => void;
    deleteGroup: (id: string) => void;

    // Leads
    addLead: (boardId: string, groupId: string, title: string) => void;
    updateLead: (id: string, updates: Partial<MarketingCardData>) => void;
    deleteLead: (id: string) => void;
    moveLead: (id: string, groupId: string) => void;
    
    // Spreadsheets / Columns
    addImportedData: (boardId: string, newColumns: string[], newCustomColumnNames: Record<string, string>, newGroups: MarketingGroup[], newLeads: MarketingCardData[]) => void;

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

    const [groups, setGroups] = useState<MarketingGroup[]>([]);
    const [leads, setLeads] = useState<MarketingCardData[]>([]);
    const [columns, setColumns] = useState<string[]>(['status', 'assignee', 'deadline', 'priority', 'notes', 'budget', 'files']);
    const [customColumnNames, setCustomColumnNames] = useState<Record<string, string>>({});
    
    const [activeSpaceId, setActiveSpaceId] = useState<string | null>(null);
    const [activeBoardId, setActiveBoardId] = useState<string | null>(forcedBoardId || null);
    const [viewMode, setViewMode] = useState<'board' | 'list'>('list');
    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [filterAssignee, setFilterAssignee] = useState<string | null>(null);
    const [filterPriority, setFilterPriority] = useState<string | null>(null);

    // Track initialization to prevent saving default data back to Supabase unnecessarily
    const isInitialized = useRef(false);

    useEffect(() => {
        if (currentWorkspace?.id) {
            getCanvasList(currentWorkspace.id).then(list => setCanvasList(list));
        }
    }, [currentWorkspace?.id]);

    useEffect(() => {
        if (forcedBoardId) {
            setActiveBoardId(forcedBoardId);
        }
    }, [forcedBoardId]);

    useEffect(() => {
        if (!activeBoardId) return;

        let isMounted = true;
        isInitialized.current = false;

        getCanvasData(activeBoardId).then(data => {
            if (!isMounted) return;

            if (data && data.groups && data.groups.length > 0) {
                setGroups(data.groups);
                setLeads(data.leads || []);
                setColumns(data.columns || ['status', 'assignee', 'deadline', 'priority', 'notes', 'budget', 'files']);
                setCustomColumnNames(data.customColumnNames || {});
            } else {
                // Initialize default
                const defaultGroups: MarketingGroup[] = [
                    { id: 'group-novo', boardId: activeBoardId, title: 'Novo', color: '#0ea5e9', order: 0 },
                    { id: 'group-contato', boardId: activeBoardId, title: 'Em Contato', color: '#f59e0b', order: 1 },
                    { id: 'group-proposta', boardId: activeBoardId, title: 'Proposta', color: '#8b5cf6', order: 2 },
                    { id: 'group-parado', boardId: activeBoardId, title: 'Parado', color: '#ef4444', order: 3 },
                    { id: 'group-ganho', boardId: activeBoardId, title: 'Ganho', color: '#10b981', order: 4 },
                ];
                setGroups(defaultGroups);
                setLeads([]);
                setColumns(['status', 'assignee', 'deadline', 'priority', 'notes', 'budget', 'files']);
                setCustomColumnNames({});
                
                // Immediately save the defaults to Supabase
                saveCanvasData(activeBoardId, {
                    ...data,
                    groups: defaultGroups,
                    leads: [],
                    columns: ['status', 'assignee', 'deadline', 'priority', 'notes', 'budget', 'files'],
                    customColumnNames: {}
                });
            }
            isInitialized.current = true;
        });

        return () => { isMounted = false; };
    }, [activeBoardId]);

    const saveStateToSupabase = (newGroups: MarketingGroup[], newLeads: MarketingCardData[], newColumns?: string[], newCustomColumnNames?: Record<string, string>) => {
        if (!activeBoardId || !isInitialized.current) return;
        getCanvasData(activeBoardId).then(data => {
            saveCanvasData(activeBoardId, {
                ...data,
                groups: newGroups,
                leads: newLeads,
                columns: newColumns || columns,
                customColumnNames: newCustomColumnNames || customColumnNames
            });
        });
    };

    // Group Actions
    const addGroup = (boardId: string, title: string, color: string) => {
        const newGroup = { id: uuidv4(), boardId, title, color, order: groups.length };
        const newGroups = [...groups, newGroup];
        setGroups(newGroups);
        saveStateToSupabase(newGroups, leads);
    };
    const updateGroup = (id: string, updates: Partial<MarketingGroup>) => {
        const newGroups = groups.map(g => g.id === id ? { ...g, ...updates } : g);
        setGroups(newGroups);
        saveStateToSupabase(newGroups, leads);
    };
    const deleteGroup = (id: string) => {
        const newGroups = groups.filter(g => g.id !== id);
        const newLeads = leads.filter(l => l.groupId !== id);
        setGroups(newGroups);
        setLeads(newLeads);
        saveStateToSupabase(newGroups, newLeads);
    };

    // Lead Actions
    const addLead = (boardId: string, groupId: string, title: string) => {
        const newCard: MarketingCardData = {
            id: uuidv4(), boardId, groupId, title, description: '', status: 'Novo', priority: 'Média',
            deadline: null, budget: 0, notes: '', assignee: 'Não atribuído', createdAt: Date.now(), updatedAt: Date.now()
        };
        const newLeads = [...leads, newCard];
        setLeads(newLeads);
        saveStateToSupabase(groups, newLeads);
    };
    const updateLead = (id: string, updates: Partial<MarketingCardData>) => {
        const newLeads = leads.map(lead => lead.id === id ? { ...lead, ...updates, updatedAt: Date.now() } : lead);
        setLeads(newLeads);
        saveStateToSupabase(groups, newLeads);
    };
    const deleteLead = (id: string) => {
        const newLeads = leads.filter(lead => lead.id !== id);
        setLeads(newLeads);
        if (selectedLeadId === id) setSelectedLeadId(null);
        saveStateToSupabase(groups, newLeads);
    };
    const moveLead = (id: string, groupId: string) => {
        const newLeads = leads.map(lead => lead.id === id ? { ...lead, groupId, updatedAt: Date.now() } : lead);
        setLeads(newLeads);
        saveStateToSupabase(groups, newLeads);
    };

    // Spreadsheet Import
    const addImportedData = (boardId: string, newColumns: string[], newCustomColumnNames: Record<string, string>, newGroups: MarketingGroup[], newLeads: MarketingCardData[]) => {
        const updatedColumns = Array.from(new Set([...columns, ...newColumns]));
        const updatedCustomColumnNames = { ...customColumnNames, ...newCustomColumnNames };
        
        // Merge groups by title (or just add new ones)
        const updatedGroups = [...groups];
        for (const ng of newGroups) {
            if (!updatedGroups.find(g => g.title === ng.title)) {
                updatedGroups.push(ng);
            }
        }
        
        const updatedLeads = [...leads, ...newLeads];
        
        setColumns(updatedColumns);
        setCustomColumnNames(updatedCustomColumnNames);
        setGroups(updatedGroups);
        setLeads(updatedLeads);
        
        saveStateToSupabase(updatedGroups, updatedLeads, updatedColumns, updatedCustomColumnNames);
    };

    const selectedLead = leads.find(l => l.id === selectedLeadId);
    
    // Mapped from CanvasList
    let activeBoard: MarketingBoard | undefined = undefined;
    let activeSpace: MarketingSpace | undefined = undefined;
    
    if (activeBoardId) {
        const canvas = canvasList.find(c => c.id === activeBoardId);
        if (canvas) {
            activeBoard = {
                id: canvas.id,
                title: canvas.name,
                spaceId: canvas.parentId || '',
                folderId: null,
                createdAt: canvas.createdAt,
                columns: columns,
                customColumnNames: customColumnNames,
                updatedAt: canvas.updatedAt || canvas.createdAt
            };
            
            if (canvas.parentId) {
                const spaceCanvas = canvasList.find(c => c.id === canvas.parentId);
                if (spaceCanvas) {
                    activeSpace = {
                        id: spaceCanvas.id,
                        title: spaceCanvas.name,
                        createdAt: spaceCanvas.createdAt
                    };
                }
            }
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
            spaces: [], folders: [], boards: activeBoard ? [activeBoard] : [], groups, leads,
            activeSpaceId, setActiveSpaceId,
            activeBoardId, setActiveBoardId,
            viewMode, setViewMode,
            selectedLeadId, setSelectedLeadId,
            searchQuery, setSearchQuery,
            filterAssignee, setFilterAssignee,
            filterPriority, setFilterPriority,
            addGroup, updateGroup, deleteGroup,
            addLead, updateLead, deleteLead, moveLead,
            addImportedData,
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
