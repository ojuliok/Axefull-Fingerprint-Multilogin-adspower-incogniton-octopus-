import { supabase } from '../../../lib/supabase';

export interface Deal {
    id: string;
    owner_id: string;
    pipeline_id: string;
    stage_id: string;
    account_id: string | null;
    primary_contact_id: string | null;
    title: string;
    description: string | null;
    deal_value: number;
    close_probability: number;
    forecast_value: number;
    expected_close_date: string | null;
    status: 'open' | 'won' | 'lost';
    source: string | null;
    created_at: string;
    updated_at: string;
    closed_at: string | null;
}

export const dealService = {
    getDealsByPipeline: async (pipelineId: string): Promise<Deal[]> => {
        const { data, error } = await supabase
            .from('deals')
            .select('*')
            .eq('pipeline_id', pipelineId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching deals:', error);
            return [];
        }
        return data || [];
    },

    createDeal: async (deal: Omit<Deal, 'id' | 'created_at' | 'updated_at' | 'owner_id' | 'forecast_value'>): Promise<Deal | null> => {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) return null;

        const forecast_value = deal.deal_value * (deal.close_probability / 100);

        const { data, error } = await supabase
            .from('deals')
            .insert({
                ...deal,
                owner_id: session.session.user.id,
                forecast_value
            })
            .select('*')
            .single();

        if (error) {
            console.error('Error creating deal:', error);
            return null;
        }
        return data;
    },

    updateDeal: async (dealId: string, updates: Partial<Deal>): Promise<Deal | null> => {
        const { data: current, error: fetchError } = await supabase
            .from('deals')
            .select('*')
            .eq('id', dealId)
            .single();

        if (fetchError || !current) return null;

        const merged = { ...current, ...updates };
        const newForecast = merged.deal_value * (merged.close_probability / 100);

        const { data, error } = await supabase
            .from('deals')
            .update({
                ...updates,
                forecast_value: newForecast,
                updated_at: new Date().toISOString()
            })
            .eq('id', dealId)
            .select('*')
            .single();

        if (error) {
            console.error('Error updating deal:', error);
            return null;
        }
        return data;
    },

    moveDealStage: async (dealId: string, toStageId: string, movedByReason?: string): Promise<Deal | null> => {
        // Obter deal atual para o histórico
        const { data: currentDeal } = await supabase
            .from('deals')
            .select('stage_id')
            .eq('id', dealId)
            .single();

        // Atualizar deal
        const { data, error } = await supabase
            .from('deals')
            .update({ stage_id: toStageId, updated_at: new Date().toISOString() })
            .eq('id', dealId)
            .select('*')
            .single();

        if (error) {
            console.error('Error moving deal stage:', error);
            return null;
        }

        // Registrar no histórico
        if (currentDeal) {
            const { data: session } = await supabase.auth.getSession();
            await supabase
                .from('deal_stage_history')
                .insert({
                    deal_id: dealId,
                    from_stage_id: currentDeal.stage_id,
                    to_stage_id: toStageId,
                    moved_by: session?.session?.user.id,
                    reason: movedByReason
                });
        }

        return data;
    },

    deleteDeal: async (dealId: string): Promise<boolean> => {
        const { error } = await supabase
            .from('deals')
            .delete()
            .eq('id', dealId);

        if (error) {
            console.error('Error deleting deal:', error);
            return false;
        }
        return true;
    }
};
