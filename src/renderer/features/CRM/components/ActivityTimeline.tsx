import React, { useState, useEffect } from 'react';
import { activityService, Activity } from '../api/activityService';
import { MessageSquare, Mail, Phone, Calendar, Loader2 } from 'lucide-react';

export const ActivityTimeline: React.FC<{ dealId: string }> = ({ dealId }) => {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [newNote, setNewNote] = useState('');

    useEffect(() => {
        loadActivities();
    }, [dealId]);

    const loadActivities = async () => {
        setLoading(true);
        const data = await activityService.getActivitiesByDeal(dealId);
        setActivities(data);
        setLoading(false);
    };

    const handleAddNote = async () => {
        if (!newNote.trim()) return;
        const added = await activityService.createActivity({
            deal_id: dealId,
            contact_id: null,
            account_id: null,
            type: 'note',
            subject: 'Nota',
            body: newNote.trim(),
            due_at: null,
            done_at: new Date().toISOString(),
            meta_json: {}
        });

        if (added) {
            setActivities([added, ...activities]);
            setNewNote('');
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'note': return <MessageSquare size={14} />;
            case 'email': return <Mail size={14} />;
            case 'call': return <Phone size={14} />;
            case 'meeting': return <Calendar size={14} />;
            default: return <MessageSquare size={14} />;
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-default)' }}>
                <textarea 
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Adicionar nota ou registro de atividade..."
                    style={{ width: '100%', minHeight: '60px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-default)', borderRadius: '6px', padding: '8px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', resize: 'vertical' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button 
                        onClick={handleAddNote}
                        disabled={!newNote.trim()}
                        style={{ background: '#0ea5e9', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 500, cursor: newNote.trim() ? 'pointer' : 'not-allowed', opacity: newNote.trim() ? 1 : 0.6 }}
                    >
                        Salvar Nota
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                    <Loader2 size={20} className="animate-spin" style={{ color: 'var(--text-tertiary)' }} />
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {activities.map(act => (
                        <div key={act.id} style={{ display: 'flex', gap: '12px' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', flexShrink: 0 }}>
                                {getIcon(act.type)}
                            </div>
                            <div style={{ flex: 1, background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-default)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{act.type === 'note' ? 'Nota Adicionada' : act.subject}</span>
                                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{new Date(act.created_at).toLocaleString('pt-BR')}</span>
                                </div>
                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                                    {act.body}
                                </div>
                            </div>
                        </div>
                    ))}
                    {activities.length === 0 && (
                        <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '12px', padding: '20px' }}>
                            Nenhuma atividade registrada para esta oportunidade.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
