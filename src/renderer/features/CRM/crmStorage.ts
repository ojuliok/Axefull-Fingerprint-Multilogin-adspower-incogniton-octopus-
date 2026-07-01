import { supabase } from '../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

function getStorageMode(): 'online' | 'offline' {
    try {
        return (localStorage.getItem('axe_storage_mode') as 'online' | 'offline') || 'online';
    } catch {
        return 'online';
    }
}

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
    spaceId: string;
    folderId?: string | null;
    title: string;
    columns: string[];
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

// ── SUPABASE SYNC FUNCTIONS ──

export async function fetchCrmGroups(boardId: string): Promise<MarketingGroup[]> {
    if (getStorageMode() === 'offline') {
        const raw = localStorage.getItem(`axe_offline_crm_groups_${boardId}`);
        return raw ? JSON.parse(raw) : [];
    }
    try {
        const { data, error } = await supabase
            .from('crm_groups')
            .select('*')
            .eq('board_node_id', boardId)
            .order('order_index', { ascending: true });
        
        if (error) throw error;
        
        return (data || []).map(row => ({
            id: row.id,
            boardId: row.board_node_id,
            title: row.title,
            color: row.color,
            order: row.order_index
        }));
    } catch (e) {
        console.error('Error fetching CRM groups', e);
        return [];
    }
}

export async function fetchCrmCards(boardId: string): Promise<MarketingCardData[]> {
    if (getStorageMode() === 'offline') {
        const raw = localStorage.getItem(`axe_offline_crm_cards_${boardId}`);
        return raw ? JSON.parse(raw) : [];
    }
    try {
        const { data, error } = await supabase
            .from('crm_cards')
            .select('*')
            .eq('board_node_id', boardId);
            
        if (error) throw error;
        
        return (data || []).map(row => {
            const custom = row.custom_fields || {};
            const info = row.contact_info || {};
            
            return {
                id: row.id,
                boardId: row.board_node_id,
                groupId: row.group_id || 'unassigned',
                title: row.title,
                description: row.description || '',
                status: row.status || 'Novo',
                value: row.value || 0,
                priority: custom.priority || 'Média',
                deadline: custom.deadline || null,
                budget: custom.budget || 0,
                notes: custom.notes || '',
                assignee: custom.assignee || 'Não atribuído',
                company: info.company || '',
                contact: info.contact || '',
                updates: custom.updates || [],
                tags: custom.tags || [],
                timeSpent: custom.timeSpent || 0,
                profileId: custom.profileId,
                subtasks: custom.subtasks || [],
                createdAt: new Date(row.created_at).getTime(),
                updatedAt: new Date(row.updated_at).getTime(),
            };
        });
    } catch (e) {
        console.error('Error fetching CRM cards', e);
        return [];
    }
}

export async function pushCrmGroupToSupabase(group: MarketingGroup, action: 'insert' | 'update' | 'remove') {
    if (getStorageMode() === 'offline') {
        const boardId = group.boardId;
        const raw = localStorage.getItem(`axe_offline_crm_groups_${boardId}`);
        let groups: MarketingGroup[] = raw ? JSON.parse(raw) : [];
        
        if (action === 'insert') {
            groups.push(group);
        } else if (action === 'update') {
            groups = groups.map(g => g.id === group.id ? group : g);
        } else if (action === 'remove') {
            groups = groups.filter(g => g.id !== group.id);
        }
        
        localStorage.setItem(`axe_offline_crm_groups_${boardId}`, JSON.stringify(groups));
        return;
    }
    try {
        if (action === 'insert') {
            await supabase.from('crm_groups').insert([{
                id: group.id,
                board_node_id: group.boardId,
                title: group.title,
                color: group.color,
                order_index: group.order
            }]);
        } else if (action === 'update') {
            await supabase.from('crm_groups').update({
                title: group.title,
                color: group.color,
                order_index: group.order
            }).eq('id', group.id);
        } else if (action === 'remove') {
            await supabase.from('crm_groups').delete().eq('id', group.id);
        }
    } catch (e) {
        console.error('Supabase Sync Error:', e);
    }
}

export async function pushCrmCardToSupabase(card: MarketingCardData, action: 'insert' | 'update' | 'remove') {
    if (getStorageMode() === 'offline') {
        const boardId = card.boardId;
        const raw = localStorage.getItem(`axe_offline_crm_cards_${boardId}`);
        let cards: MarketingCardData[] = raw ? JSON.parse(raw) : [];
        
        if (action === 'insert') {
            cards.push(card);
        } else if (action === 'update') {
            cards = cards.map(c => c.id === card.id ? card : c);
        } else if (action === 'remove') {
            cards = cards.filter(c => c.id !== card.id);
        }
        
        localStorage.setItem(`axe_offline_crm_cards_${boardId}`, JSON.stringify(cards));
        return;
    }
    try {
        const custom_fields = {
            priority: card.priority,
            deadline: card.deadline,
            budget: card.budget,
            notes: card.notes,
            assignee: card.assignee,
            updates: card.updates,
            tags: card.tags,
            timeSpent: card.timeSpent,
            profileId: card.profileId,
            subtasks: card.subtasks
        };
        
        const contact_info = {
            company: card.company,
            contact: card.contact
        };
        
        if (action === 'insert') {
            await supabase.from('crm_cards').insert([{
                id: card.id,
                board_node_id: card.boardId,
                group_id: card.groupId,
                title: card.title,
                description: card.description,
                status: card.status,
                value: card.value,
                contact_info,
                custom_fields,
                created_at: new Date(card.createdAt).toISOString(),
                updated_at: new Date(card.updatedAt).toISOString()
            }]);
        } else if (action === 'update') {
            await supabase.from('crm_cards').update({
                group_id: card.groupId,
                title: card.title,
                description: card.description,
                status: card.status,
                value: card.value,
                contact_info,
                custom_fields,
                updated_at: new Date(card.updatedAt).toISOString()
            }).eq('id', card.id);
        } else if (action === 'remove') {
            await supabase.from('crm_cards').delete().eq('id', card.id);
        }
    } catch (e) {
        console.error('Supabase Sync Error:', e);
    }
}

// Keep a minimal local storage stub for backward compatibility if something still calls these
const STORAGE_KEY = 'axe_marketing_crm_data_v3';
export const getMarketingData = () => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) return JSON.parse(data);
    } catch (e) {}
    return { spaces: [], folders: [], boards: [], groups: [], leads: [] };
};
export const saveMarketingData = (payload: any) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
};
