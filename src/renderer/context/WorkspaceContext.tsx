import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export interface Workspace {
    id: string;
    name: string;
    owner_id: string;
    created_at: string;
}

export interface WorkspaceMember {
    id: string;
    workspace_id: string;
    user_id: string;
    role: string;
}

interface WorkspaceContextValue {
    workspaces: Workspace[];
    currentWorkspace: Workspace | null;
    isLoading: boolean;
    setCurrentWorkspace: (ws: Workspace | null) => void;
    createWorkspace: (name: string) => Promise<Workspace | null>;
    refreshWorkspaces: () => Promise<void>;
    isNotesFloating: boolean;
    setIsNotesFloating: (val: boolean) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isNotesFloating, setIsNotesFloating] = useState(false);

    const refreshWorkspaces = useCallback(async () => {
        const isOffline = (() => {
            try { return localStorage.getItem('axe_storage_mode') === 'offline'; }
            catch { return false; }
        })();

        if (isOffline) {
            setIsLoading(true);
            try {
                const saved = localStorage.getItem('axe_offline_workspaces');
                let localWs: Workspace[] = saved ? JSON.parse(saved) : [];
                if (localWs.length === 0) {
                    const defaultWs: Workspace = {
                        id: 'offline-workspace',
                        name: 'Meu Workspace (Local)',
                        owner_id: 'offline-owner',
                        created_at: new Date().toISOString()
                    };
                    localWs = [defaultWs];
                    localStorage.setItem('axe_offline_workspaces', JSON.stringify(localWs));
                }
                setWorkspaces(localWs);
                if (!currentWorkspace) {
                    setCurrentWorkspace(localWs[0]);
                } else {
                    const stillExists = localWs.find(w => w.id === currentWorkspace.id);
                    if (!stillExists) setCurrentWorkspace(localWs[0]);
                }
            } catch (err) {
                console.error('Error loading offline workspaces:', err);
            } finally {
                setIsLoading(false);
            }
            return;
        }

        if (!user) {
            setWorkspaces([]);
            setCurrentWorkspace(null);
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            // Get workspaces where user is owner
            const { data: ownedWorkspaces, error: err1 } = await supabase
                .from('workspaces')
                .select('*')
                .eq('owner_id', user.id);

            // Get workspaces where user is a member
            const { data: memberOf, error: err2 } = await supabase
                .from('workspace_members')
                .select('workspace_id')
                .eq('user_id', user.id);

            let invitedWorkspaces: Workspace[] = [];
            if (memberOf && memberOf.length > 0) {
                const workspaceIds = memberOf.map(m => m.workspace_id);
                const { data: invited, error: err3 } = await supabase
                    .from('workspaces')
                    .select('*')
                    .in('id', workspaceIds);
                if (invited) invitedWorkspaces = invited;
            }

            const allWorkspaces = [...(ownedWorkspaces || []), ...invitedWorkspaces];
            
            // Remove duplicates just in case
            const unique = Array.from(new Map(allWorkspaces.map(item => [item.id, item])).values());
            
            setWorkspaces(unique);

            // Select the first one if none selected
            if (!currentWorkspace && unique.length > 0) {
                setCurrentWorkspace(unique[0]);
            } else if (unique.length === 0) {
                // Auto create a default workspace
                const { data: newWs, error } = await supabase
                    .from('workspaces')
                    .insert([{ name: 'Meu Workspace', owner_id: user.id }])
                    .select()
                    .single();
                
                if (newWs) {
                    setWorkspaces([newWs]);
                    setCurrentWorkspace(newWs);
                }
            } else if (currentWorkspace) {
                const stillExists = unique.find(w => w.id === currentWorkspace.id);
                if (!stillExists) setCurrentWorkspace(unique[0]);
            }
        } catch (err) {
            console.error('Error fetching workspaces:', err);
        } finally {
            setIsLoading(false);
        }
    }, [user, currentWorkspace]);

    useEffect(() => {
        refreshWorkspaces();
    }, [refreshWorkspaces]);

    const createWorkspace = async (name: string) => {
        const isOffline = (() => {
            try { return localStorage.getItem('axe_storage_mode') === 'offline'; }
            catch { return false; }
        })();

        if (isOffline) {
            const newWs: Workspace = {
                id: crypto.randomUUID(),
                name,
                owner_id: 'offline-owner',
                created_at: new Date().toISOString()
            };
            try {
                const saved = localStorage.getItem('axe_offline_workspaces');
                const localWs: Workspace[] = saved ? JSON.parse(saved) : [];
                localWs.push(newWs);
                localStorage.setItem('axe_offline_workspaces', JSON.stringify(localWs));
                setWorkspaces(localWs);
                setCurrentWorkspace(newWs);
                return newWs;
            } catch (err) {
                console.error('Error creating offline workspace:', err);
                return null;
            }
        }

        if (!user) return null;
        try {
            const { data, error } = await supabase
                .from('workspaces')
                .insert([{ name, owner_id: user.id }])
                .select()
                .single();
            if (data) {
                await refreshWorkspaces();
                setCurrentWorkspace(data);
                return data;
            }
            return null;
        } catch (err) {
            console.error('Error creating workspace', err);
            return null;
        }
    };

    return (
        <WorkspaceContext.Provider value={{ 
            workspaces, currentWorkspace, isLoading, setCurrentWorkspace, 
            createWorkspace, refreshWorkspaces, isNotesFloating, setIsNotesFloating 
        }}>
            {children}
        </WorkspaceContext.Provider>
    );
}

export function useWorkspace() {
    const context = useContext(WorkspaceContext);
    if (!context) throw new Error('useWorkspace must be used within WorkspaceProvider');
    return context;
}
