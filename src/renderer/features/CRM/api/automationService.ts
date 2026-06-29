import { supabase } from '../../../lib/supabase';

export interface DealStageHistory {
    id: string;
    deal_id: string;
    from_stage_id: string | null;
    to_stage_id: string;
    moved_by: string;
    moved_at: string;
    reason: string | null;
}

export const automationService = {
    getDealHistory: async (dealId: string): Promise<DealStageHistory[]> => {
        const { data, error } = await supabase
            .from('deal_stage_history')
            .select('*')
            .eq('deal_id', dealId)
            .order('moved_at', { ascending: false });

        if (error) {
            console.error('Error fetching deal history:', error);
            return [];
        }
        return data || [];
    }
};
