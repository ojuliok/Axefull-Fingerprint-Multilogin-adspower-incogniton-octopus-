import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { pipelineService, Pipeline, PipelineStage } from '../api/pipelineService';
import { dealService, Deal } from '../api/dealService';
import { contactService, Contact } from '../api/contactService';
import { accountService, Account } from '../api/accountService';
import { supabase } from '../../../lib/supabase';

interface PipelineContextType {
    pipelines: Pipeline[];
    activePipeline: Pipeline | null;
    stages: PipelineStage[];
    deals: Deal[];
    contacts: Contact[];
    accounts: Account[];
    isLoading: boolean;
    setActivePipeline: (pipeline: Pipeline | null) => void;
    refreshData: () => Promise<void>;
    addDeal: (deal: Omit<Deal, 'id' | 'created_at' | 'updated_at' | 'owner_id' | 'forecast_value'>) => Promise<void>;
    updateDeal: (dealId: string, updates: Partial<Deal>) => Promise<void>;
    moveDeal: (dealId: string, toStageId: string) => Promise<void>;
    deleteDeal: (dealId: string) => Promise<void>;
    addPipeline: (name: string, code: string) => Promise<void>;
    addStage: (stage: Omit<PipelineStage, 'id'>) => Promise<void>;
}

const PipelineContext = createContext<PipelineContextType | undefined>(undefined);

export const PipelineProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [pipelines, setPipelines] = useState<Pipeline[]>([]);
    const [activePipeline, setActivePipeline] = useState<Pipeline | null>(null);
    const [stages, setStages] = useState<PipelineStage[]>([]);
    const [deals, setDeals] = useState<Deal[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const loadPipelines = async () => {
        setIsLoading(true);
        const data = await pipelineService.getPipelines();
        const [loadedContacts, loadedAccounts] = await Promise.all([
            contactService.getContacts(),
            accountService.getAccounts()
        ]);
        setContacts(loadedContacts);
        setAccounts(loadedAccounts);
        setPipelines(data);
        if (data.length > 0 && !activePipeline) {
            setActivePipeline(data[0]);
        }
        setIsLoading(false);
    };

    const loadStagesAndDeals = async () => {
        if (!activePipeline) return;
        setIsLoading(true);
        const [loadedStages, loadedDeals] = await Promise.all([
            pipelineService.getPipelineStages(activePipeline.id),
            dealService.getDealsByPipeline(activePipeline.id)
        ]);
        setStages(loadedStages);
        setDeals(loadedDeals);
        setIsLoading(false);
    };

    useEffect(() => {
        loadPipelines();
    }, []);

    useEffect(() => {
        if (activePipeline) {
            loadStagesAndDeals();
        }
    }, [activePipeline]);

    const refreshData = async () => {
        await loadPipelines();
        if (activePipeline) {
            await loadStagesAndDeals();
        }
    };

    const addDeal = async (dealData: Omit<Deal, 'id' | 'created_at' | 'updated_at' | 'owner_id' | 'forecast_value'>) => {
        const newDeal = await dealService.createDeal(dealData);
        if (newDeal) {
            setDeals(prev => [newDeal, ...prev]);
        }
    };

    const updateDeal = async (dealId: string, updates: Partial<Deal>) => {
        const updated = await dealService.updateDeal(dealId, updates);
        if (updated) {
            setDeals(prev => prev.map(d => d.id === dealId ? updated : d));
        }
    };

    const moveDeal = async (dealId: string, toStageId: string) => {
        const updated = await dealService.moveDealStage(dealId, toStageId);
        if (updated) {
            setDeals(prev => prev.map(d => d.id === dealId ? updated : d));
        }
    };

    const deleteDeal = async (dealId: string) => {
        const success = await dealService.deleteDeal(dealId);
        if (success) {
            setDeals(prev => prev.filter(d => d.id !== dealId));
        }
    };

    const addPipeline = async (name: string, code: string) => {
        const newPipeline = await pipelineService.createPipeline(name, code);
        if (newPipeline) {
            setPipelines(prev => [...prev, newPipeline]);
            setActivePipeline(newPipeline);
        }
    };

    const addStage = async (stageData: Omit<PipelineStage, 'id'>) => {
        const newStage = await pipelineService.createStage(stageData);
        if (newStage) {
            setStages(prev => [...prev, newStage].sort((a, b) => a.position - b.position));
        }
    };

    return (
        <PipelineContext.Provider value={{
            pipelines, activePipeline, stages, deals, contacts, accounts, isLoading,
            setActivePipeline, refreshData, addDeal, updateDeal, moveDeal, deleteDeal,
            addPipeline, addStage
        }}>
            {children}
        </PipelineContext.Provider>
    );
};

export const usePipeline = () => {
    const context = useContext(PipelineContext);
    if (!context) {
        throw new Error('usePipeline must be used within a PipelineProvider');
    }
    return context;
};
