import { supabase } from '../../../lib/supabase';

export interface Account {
    id: string;
    owner_id: string;
    name: string;
    industry: string | null;
    website: string | null;
    created_at: string;
}

export const accountService = {
    getAccounts: async (): Promise<Account[]> => {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) return [];

        const { data, error } = await supabase
            .from('accounts')
            .select('*')
            .eq('owner_id', session.session.user.id)
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching accounts:', error);
            return [];
        }
        return data || [];
    },

    createAccount: async (account: Omit<Account, 'id' | 'owner_id' | 'created_at'>): Promise<Account | null> => {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) return null;

        const { data, error } = await supabase
            .from('accounts')
            .insert({ ...account, owner_id: session.session.user.id })
            .select('*')
            .single();

        if (error) {
            console.error('Error creating account:', error);
            return null;
        }
        return data;
    }
};
