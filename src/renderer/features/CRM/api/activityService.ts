import { supabase } from '../../../lib/supabase';

export interface Activity {
    id: string;
    owner_id: string;
    deal_id: string | null;
    contact_id: string | null;
    account_id: string | null;
    type: 'note' | 'email' | 'call' | 'meeting';
    subject: string | null;
    body: string | null;
    due_at: string | null;
    done_at: string | null;
    meta_json: any;
    created_at: string;
}

export const activityService = {
    getActivitiesByDeal: async (dealId: string): Promise<Activity[]> => {
        const { data, error } = await supabase
            .from('activities')
            .select('*')
            .eq('deal_id', dealId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching activities:', error);
            return [];
        }
        return data || [];
    },

    createActivity: async (activity: Omit<Activity, 'id' | 'owner_id' | 'created_at'>): Promise<Activity | null> => {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) return null;

        const { data, error } = await supabase
            .from('activities')
            .insert({ ...activity, owner_id: session.session.user.id })
            .select('*')
            .single();

        if (error) {
            console.error('Error creating activity:', error);
            return null;
        }
        return data;
    }
};
