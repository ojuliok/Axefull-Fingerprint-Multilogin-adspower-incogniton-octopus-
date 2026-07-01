import React, { useState, useEffect } from 'react';
import { useWorkspace, WorkspaceMember } from '../../context/WorkspaceContext';
import { supabase } from '../../lib/supabase';
import { X, UserPlus, Shield, User, Trash2, Mail, Loader2 } from 'lucide-react';
import { EmailPreviewModal } from '../../components/ui/EmailPreviewModal';

interface MembersManagerProps {
    onClose: () => void;
}

export const MembersManager: React.FC<MembersManagerProps> = ({ onClose }) => {
    const { currentWorkspace } = useWorkspace();
    const [members, setMembers] = useState<WorkspaceMember[]>([]);
    const [teamMembers, setTeamMembers] = useState<any[]>([]);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('viewer');
    const [loading, setLoading] = useState(true);
    const [teamLoading, setTeamLoading] = useState(true);

    // Email Preview Modal States
    const [showEmailPreview, setShowEmailPreview] = useState(false);
    const [previewEmailData, setPreviewEmailData] = useState<{ to: string; subject: string; html: string } | null>(null);

    // Fetch team members from local server to resolve emails
    const fetchTeamMembers = async () => {
        setTeamLoading(true);
        try {
            const res = await window.api.team.me();
            const data = res.data as any;
            if (res.success && data && data.members) {
                setTeamMembers(data.members);
            }
        } catch (err) {
            console.error('Error fetching team members:', err);
        } finally {
            setTeamLoading(false);
        }
    };

    // Fetch workspace members from Supabase
    const fetchWorkspaceMembers = async () => {
        if (!currentWorkspace) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('workspace_members')
                .select('*')
                .eq('workspace_id', currentWorkspace.id);
            if (error) throw error;
            if (data) setMembers(data as WorkspaceMember[]);
        } catch (err) {
            console.error('Error fetching workspace members:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeamMembers();
    }, []);

    useEffect(() => {
        fetchWorkspaceMembers();
    }, [currentWorkspace]);

    const handleInviteClick = () => {
        if (!inviteEmail || !currentWorkspace) return;

        const emailHtml = `
            <div style="font-family: sans-serif; max-width: 500px; padding: 20px; background-color: #0f172a; color: #f1f5f9; border-radius: 12px; border: 1px solid #334155;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="color: #a78bfa; margin: 0;">Convite de Workspace - Axefull</h2>
                    <p style="font-size: 12px; color: #94a3b8; margin: 5px 0 0 0;">Plataforma de Multi-Login e Automação</p>
                </div>
                <div style="background-color: #1e293b; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <p style="margin: 0 0 10px 0; font-size: 14px;">Olá,</p>
                    <p style="margin: 0 0 15px 0; font-size: 14px; line-height: 1.5;">Você foi convidado para colaborar no workspace <strong>${currentWorkspace.name}</strong> como <strong>${inviteRole === 'editor' ? 'Editor' : 'Visualizador'}</strong>.</p>
                    <div style="text-align: center; margin: 25px 0;">
                        <a href="https://axefull.com" style="background: linear-gradient(135deg, #8b5cf6, #6366f1); color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">Acessar Workspace</a>
                    </div>
                    <p style="margin: 0; font-size: 12px; color: #94a3b8;">Se você não possui uma conta, crie uma usando este e-mail para ter acesso ao workspace.</p>
                </div>
                <div style="text-align: center; font-size: 11px; color: #64748b;">
                    Este é um e-mail automático enviado pela Plataforma Axefull.
                </div>
            </div>
        `;

        setPreviewEmailData({
            to: inviteEmail.trim(),
            subject: `Convite para Workspace - ${currentWorkspace.name}`,
            html: emailHtml
        });
        setShowEmailPreview(true);
    };

    const handleEmailSent = async () => {
        if (!currentWorkspace || !inviteEmail) return;

        try {
            // Find user in team members to get their UID
            const matchedTeamMember = teamMembers.find(
                m => m.email.toLowerCase() === inviteEmail.trim().toLowerCase()
            );

            if (matchedTeamMember) {
                // User is already on the team, add directly to workspace
                const { error } = await supabase.from('workspace_members').insert([
                    {
                        id: crypto.randomUUID(),
                        workspace_id: currentWorkspace.id,
                        user_id: matchedTeamMember.uid,
                        role: inviteRole
                    }
                ]);
                if (error) throw error;
                alert(`Membro adicionado com sucesso ao workspace!`);
            } else {
                // User not in team, invite to team first
                await window.api.team.invite(inviteEmail.trim());
                alert(`Convite enviado para o e-mail. Assim que ele aceitar o convite da equipe, você poderá adicioná-lo a este Workspace.`);
            }

            setInviteEmail('');
            fetchWorkspaceMembers();
        } catch (err: any) {
            console.error(err);
            alert(`Erro ao adicionar membro: ${err.message || String(err)}`);
        }
    };

    const handleRemoveMember = async (id: string) => {
        try {
            const { error } = await supabase.from('workspace_members').delete().eq('id', id);
            if (error) throw error;
            setMembers(members.filter(m => m.id !== id));
        } catch (err: any) {
            console.error(err);
            alert(`Erro ao remover membro: ${err.message || String(err)}`);
        }
    };

    const resolveMemberEmail = (userId: string) => {
        const match = teamMembers.find(tm => tm.uid === userId);
        return match ? match.email : `ID: ${userId.substring(0, 8)}`;
    };

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-[520px] bg-slate-900 border border-violet-500/20 rounded-xl p-6 shadow-2xl relative animate-fade-in-scale text-slate-100">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-200">
                    <X size={20} />
                </button>
                
                <h2 className="text-xl font-semibold mb-1">Membros do Workspace</h2>
                <p className="text-xs text-slate-400 mb-6">
                    Gerencie quem tem acesso ao workspace "{currentWorkspace?.name || 'Carregando...'}"
                </p>

                {/* Invite Section */}
                <div className="flex gap-2 mb-6">
                    <input 
                        type="email" 
                        placeholder="E-mail do usuário" 
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500 text-slate-200"
                    />
                    <select 
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value)}
                        className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none text-slate-200"
                    >
                        <option value="viewer">Visualizador</option>
                        <option value="editor">Editor</option>
                    </select>
                    <button 
                        onClick={handleInviteClick}
                        disabled={!inviteEmail}
                        className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                        <UserPlus size={16} />
                        Convidar
                    </button>
                </div>

                {/* Members List */}
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {/* Owner (Simulated) */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/40 border border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-violet-600/20 text-violet-400 flex items-center justify-center">
                                <Shield size={16} />
                            </div>
                            <div>
                                <p className="text-sm font-medium">Você (Dono)</p>
                                <p className="text-xs text-slate-400">Proprietário do workspace</p>
                            </div>
                        </div>
                        <span className="text-xs bg-violet-500/10 text-violet-400 px-2 py-1 rounded">Owner</span>
                    </div>

                    {/* Other Members */}
                    {loading || teamLoading ? (
                        <div className="flex items-center justify-center gap-2 py-6 text-xs text-slate-400">
                            <Loader2 size={16} className="animate-spin" />
                            <span>Carregando membros...</span>
                        </div>
                    ) : (
                        members.map(m => (
                            <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-950/40 border border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-850 text-slate-400 flex items-center justify-center border border-slate-700">
                                        <User size={16} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium font-mono">{resolveMemberEmail(m.user_id)}</p>
                                        <p className="text-xs text-slate-400 capitalize">{m.role}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleRemoveMember(m.id)}
                                    className="text-rose-500 hover:text-rose-400 p-2 rounded-lg hover:bg-rose-500/10 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))
                    )}
                    
                    {!loading && !teamLoading && members.length === 0 && (
                        <p className="text-xs text-slate-400 text-center py-6">Nenhum membro adicional no workspace.</p>
                    )}
                </div>
            </div>

            {/* Email Preview Modal */}
            {showEmailPreview && previewEmailData && (
                <EmailPreviewModal
                    to={previewEmailData.to}
                    subject={previewEmailData.subject}
                    bodyHtml={previewEmailData.html}
                    onClose={() => setShowEmailPreview(false)}
                    onSent={handleEmailSent}
                />
            )}
        </div>
    );
};
