import React, { useState } from 'react';
import { usePipeline } from '../context/PipelineContext';
import { Building2, Users, Mail, Phone, Briefcase } from 'lucide-react';

export const ContactsAccounts: React.FC = () => {
    const { contacts, accounts } = usePipeline();
    const [view, setView] = useState<'contacts' | 'accounts'>('contacts');

    return (
        <div style={{ padding: '20px', background: 'var(--bg-primary)', flex: 1, overflow: 'auto' }}>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid var(--border-default)', paddingBottom: '16px' }}>
                <button
                    onClick={() => setView('contacts')}
                    style={{
                        background: view === 'contacts' ? 'var(--bg-card)' : 'transparent',
                        border: '1px solid',
                        borderColor: view === 'contacts' ? 'var(--border-default)' : 'transparent',
                        padding: '8px 16px', borderRadius: '6px', cursor: 'pointer',
                        color: view === 'contacts' ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontWeight: view === 'contacts' ? 600 : 400,
                        display: 'flex', alignItems: 'center', gap: '8px'
                    }}
                >
                    <Users size={16} /> Contatos ({contacts.length})
                </button>
                <button
                    onClick={() => setView('accounts')}
                    style={{
                        background: view === 'accounts' ? 'var(--bg-card)' : 'transparent',
                        border: '1px solid',
                        borderColor: view === 'accounts' ? 'var(--border-default)' : 'transparent',
                        padding: '8px 16px', borderRadius: '6px', cursor: 'pointer',
                        color: view === 'accounts' ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontWeight: view === 'accounts' ? 600 : 400,
                        display: 'flex', alignItems: 'center', gap: '8px'
                    }}
                >
                    <Building2 size={16} /> Empresas ({accounts.length})
                </button>
            </div>

            {view === 'contacts' && (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}>
                            <th style={{ padding: '10px 12px', fontWeight: 500 }}>Nome</th>
                            <th style={{ padding: '10px 12px', fontWeight: 500 }}>Cargo</th>
                            <th style={{ padding: '10px 12px', fontWeight: 500 }}>E-mail</th>
                            <th style={{ padding: '10px 12px', fontWeight: 500 }}>Telefone</th>
                            <th style={{ padding: '10px 12px', fontWeight: 500 }}>Empresa Vinculada</th>
                        </tr>
                    </thead>
                    <tbody>
                        {contacts.map(c => {
                            const account = accounts.find(a => a.id === c.account_id);
                            return (
                                <tr key={c.id} style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-primary)' }}>
                                    <td style={{ padding: '10px 12px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                                            <Users size={14} />
                                        </div>
                                        {c.name}
                                    </td>
                                    <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Briefcase size={12}/> {c.job_title || '-'}</div>
                                    </td>
                                    <td style={{ padding: '10px 12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={12} color="var(--text-secondary)"/> {c.email || '-'}</div>
                                    </td>
                                    <td style={{ padding: '10px 12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={12} color="var(--text-secondary)"/> {c.phone || '-'}</div>
                                    </td>
                                    <td style={{ padding: '10px 12px' }}>
                                        {account ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-secondary)', padding: '4px 8px', borderRadius: '4px', width: 'fit-content' }}>
                                                <Building2 size={12} color="var(--text-secondary)" /> {account.name}
                                            </div>
                                        ) : '-'}
                                    </td>
                                </tr>
                            );
                        })}
                        {contacts.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                                    Nenhum contato encontrado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}

            {view === 'accounts' && (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}>
                            <th style={{ padding: '10px 12px', fontWeight: 500 }}>Nome da Empresa</th>
                            <th style={{ padding: '10px 12px', fontWeight: 500 }}>Indústria</th>
                            <th style={{ padding: '10px 12px', fontWeight: 500 }}>Website</th>
                            <th style={{ padding: '10px 12px', fontWeight: 500 }}>Contatos Vinculados</th>
                        </tr>
                    </thead>
                    <tbody>
                        {accounts.map(a => {
                            const linkedContacts = contacts.filter(c => c.account_id === a.id);
                            return (
                                <tr key={a.id} style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-primary)' }}>
                                    <td style={{ padding: '10px 12px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: 28, height: 28, borderRadius: '6px', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                                            <Building2 size={14} />
                                        </div>
                                        {a.name}
                                    </td>
                                    <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{a.industry || '-'}</td>
                                    <td style={{ padding: '10px 12px' }}>
                                        {a.website ? <a href={a.website} target="_blank" rel="noreferrer" style={{ color: '#0ea5e9' }}>{a.website}</a> : '-'}
                                    </td>
                                    <td style={{ padding: '10px 12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Users size={14} color="var(--text-secondary)" /> {linkedContacts.length} pessoa(s)
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {accounts.length === 0 && (
                            <tr>
                                <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                                    Nenhuma empresa encontrada.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}
        </div>
    );
};
