// src/renderer/domains/crm/types/crmContracts.ts
// Interfaces e contratos formais do Domínio CRM & Leads

export type MarketingPriority = 'Alta' | 'Média' | 'Baixa';

export interface MarketingCardData {
    id: string;
    boardId: string;
    groupId: string;
    title: string;
    description?: string;
    status: string;
    priority: MarketingPriority;
    deadline?: string | null;
    budget?: number;
    notes?: string;
    assignee?: string;
    timeSpent?: number;
    createdAt: number;
    updatedAt: number;
}

export interface MarketingGroup {
    id: string;
    boardId: string;
    title: string;
    color: string;
    order: number;
}

export interface MarketingBoard {
    id: string;
    workspaceId: string;
    title: string;
    columns: string[];
    customColumnNames?: Record<string, string>;
}

export interface ICRMService {
    getLeads(boardId: string): Promise<MarketingCardData[]>;
    addLead(boardId: string, groupId: string, title: string): Promise<MarketingCardData>;
    updateLead(id: string, updates: Partial<MarketingCardData>, immediate?: boolean): void;
    deleteLead(id: string): Promise<void>;
    moveLead(id: string, targetGroupId: string): Promise<void>;
    flushPendingLeadUpdate(id: string): void;
}
