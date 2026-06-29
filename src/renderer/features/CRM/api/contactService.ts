import { supabase } from '../../../lib/supabase';

export interface Contact {
    id: string;
    owner_id: string;
    account_id: string | null;
    name: string;
    email: string | null;
    phone: string | null;
    job_title: string | null;
    created_at: string;
}

export const contactService = {
    getContacts: async (): Promise<Contact[]> => {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) return [];

        const { data, error } = await supabase
            .from('contacts')
            .select('*')
            .eq('owner_id', session.session.user.id)
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching contacts:', error);
            return [];
        }
        return data || [];
    },

    createContact: async (contact: Omit<Contact, 'id' | 'owner_id' | 'created_at'>): Promise<Contact | null> => {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) return null;

        const { data, error } = await supabase
            .from('contacts')
            .insert({ ...contact, owner_id: session.session.user.id })
            .select('*')
            .single();

        if (error) {
            console.error('Error creating contact:', error);
            return null;
        }
        return data;
    }
};
