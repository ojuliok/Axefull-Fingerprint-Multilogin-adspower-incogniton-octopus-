import React, { useState, useEffect } from 'react';
import { useWorkspace, WorkspaceMember } from '../../context/WorkspaceContext';
import { supabase } from '../../lib/supabase';
import { X, UserPlus, Shield, User, Trash2 } from 'lucide-react';

interface MembersManagerProps {
    onClose: () => void;
}

export const MembersManager: React.FC<MembersManagerProps> = ({ onClose }) => {
    const { currentWorkspace } = useWorkspace();
    const [members, setMembers] = useState<WorkspaceMember[]>([]);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('viewer');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentWorkspace) return;
        
        const fetchMembers = async () => {
            setLoading(true);
            try {
                // Fetch members logic here - requires a user details join in real app
                const { data } = await supabase
                    .from('workspace_members')
                    .select('*')
                    .eq('workspace_id', currentWorkspace.id);
                if (data) setMembers(data as WorkspaceMember[]);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchMembers();
    }, [currentWorkspace]);

    const handleInvite = async () => {
        if (!inviteEmail || !currentWorkspace) return;
        
        try {
            // Simulated invite since we don't have the user ID from email yet
            // In a real app, you would call a Supabase Edge Function to invite by email
            alert(`Convite enviado para ${inviteEmail} como ${inviteRole}`);
            setInviteEmail('');
        } catch (err) {
            console.error(err);
        }
    };

    const handleRemoveMember = async (id: string) => {
        try {
            await supabase.from('workspace_members').delete().eq('id', id);
            setMembers(members.filter(m => m.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-[500px] glass-card rounded-xl p-6 shadow-2xl relative animate-fade-in-scale">
                <button onClick={onClose} className="absolute top-4 right-4 text-theme-text-muted hover:text-theme-text">
                    <X size={20} />
                </button>
                
                <h2 className="text-xl font-semibold mb-1">Membros do Workspace</h2>
                <p className="text-sm text-theme-text-muted mb-6">
                    Gerencie quem tem acesso ao workspace "{currentWorkspace?.name}"
                </p>

                {/* Invite Section */}
                <div className="flex gap-2 mb-6">
                    <input 
                        type="email" 
                        placeholder="E-mail do usuário" 
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="flex-1 bg-theme-base/50 border border-theme-border rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500"
                    />
                    <select 
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value)}
                        className="bg-theme-base/50 border border-theme-border rounded-lg px-3 py-2 text-sm outline-none"
                    >
                        <option value="viewer">Visualizador</option>
                        <option value="editor">Editor</option>
                    </select>
                    <button 
                        onClick={handleInvite}
                        className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                    >
                        <UserPlus size={16} />
                        Convidar
                    </button>
                </div>

                {/* Members List */}
                <div className="space-y-3 max-h-60 overflow-y-auto">
                    {/* Owner (Simulated) */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-theme-base/30 border border-theme-border/50">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-violet-600/20 text-violet-500 flex items-center justify-center">
                                <Shield size={16} />
                            </div>
                            <div>
                                <p className="text-sm font-medium">Você (Dono)</p>
                                <p className="text-xs text-theme-text-muted">Proprietário do workspace</p>
                            </div>
                        </div>
                        <span className="text-xs bg-violet-500/10 text-violet-400 px-2 py-1 rounded">Owner</span>
                    </div>

                    {/* Other Members */}
                    {loading ? (
                        <p className="text-sm text-theme-text-muted text-center py-4">Carregando membros...</p>
                    ) : members.map(m => (
                        <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-theme-base/30 border border-theme-border/50">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-theme-border text-theme-text-muted flex items-center justify-center">
                                    <User size={16} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Usuário {m.user_id.substring(0, 4)}</p>
                                    <p className="text-xs text-theme-text-muted">{m.role}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleRemoveMember(m.id)}
                                className="text-red-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                    {!loading && members.length === 0 && (
                        <p className="text-sm text-theme-text-muted text-center py-4">Nenhum membro adicional.</p>
                    )}
                </div>
            </div>
        </div>
    );
};
