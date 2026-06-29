import { supabase } from '../../../lib/supabase';

export interface Pipeline {
    id: string;
    owner_id: string;
    name: string;
    code: string;
    is_default: boolean;
    currency: string;
    created_at: string;
}

export interface PipelineStage {
    id: string;
    pipeline_id: string;
    name: string;
    slug: string;
    position: number;
    color: string;
    win_probability_default: number;
    is_open: boolean;
    is_won: boolean;
    is_lost: boolean;
}

export const pipelineService = {
    getPipelines: async (): Promise<Pipeline[]> => {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) return [];

        const { data, error } = await supabase
            .from('pipelines')
            .select('*')
            .eq('owner_id', session.session.user.id)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching pipelines:', error);
            return [];
        }
        return data || [];
    },

    createPipeline: async (name: string, code: string): Promise<Pipeline | null> => {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) return null;

        const { data, error } = await supabase
            .from('pipelines')
            .insert({ owner_id: session.session.user.id, name, code, is_default: true })
            .select('*')
            .single();

        if (error) {
            console.error('Error creating pipeline:', error);
            return null;
        }
        return data;
    },

    getPipelineStages: async (pipelineId: string): Promise<PipelineStage[]> => {
        const { data, error } = await supabase
            .from('pipeline_stages')
            .select('*')
            .eq('pipeline_id', pipelineId)
            .order('position', { ascending: true });

        if (error) {
            console.error('Error fetching stages:', error);
            return [];
        }
        return data || [];
    },

    createStage: async (stage: Omit<PipelineStage, 'id'>): Promise<PipelineStage | null> => {
        const { data, error } = await supabase
            .from('pipeline_stages')
            .insert(stage)
            .select('*')
            .single();

        if (error) {
            console.error('Error creating stage:', error);
            return null;
        }
        return data;
    },

    updateStage: async (stageId: string, updates: Partial<PipelineStage>): Promise<PipelineStage | null> => {
        const { data, error } = await supabase
            .from('pipeline_stages')
            .update(updates)
            .eq('id', stageId)
            .select('*')
            .single();

        if (error) {
            console.error('Error updating stage:', error);
            return null;
        }
        return data;
    },

    deleteStage: async (stageId: string): Promise<boolean> => {
        const { error } = await supabase
            .from('pipeline_stages')
            .delete()
            .eq('id', stageId);

        if (error) {
            console.error('Error deleting stage:', error);
            return false;
        }
        return true;
    }
};
