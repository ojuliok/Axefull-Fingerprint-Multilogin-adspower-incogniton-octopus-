import React, { useState, useEffect } from 'react';

/**
 * Componente Principal do Módulo Multi (Painel de Gestão Multi-Perfil / Multi-Login)
 */
export const MultiDashboard: React.FC = () => {
    const [runningProfiles, setRunningProfiles] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchStatus = async () => {
        try {
            if (window.electron?.ipcRenderer) {
                const status = await window.electron.ipcRenderer.invoke('multi:get-status');
                setRunningProfiles(status?.activeIds || []);
            }
        } catch (err) {
            console.error('Erro ao buscar status do Multi:', err);
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleStopAll = async () => {
        setLoading(true);
        try {
            if (window.electron?.ipcRenderer) {
                await window.electron.ipcRenderer.invoke('multi:stop-all');
                await fetchStatus();
            }
        } catch (err) {
            console.error('Erro ao encerrar perfis:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '24px', color: '#fff', fontFamily: 'sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Domínio Multi — Painel de Controle</h1>
                    <p style={{ color: '#888', marginTop: '4px' }}>Gestão de múltiplos perfis e contas em execução isolada.</p>
                </div>
                <button
                    onClick={handleStopAll}
                    disabled={loading || runningProfiles.length === 0}
                    style={{
                        padding: '10px 18px',
                        backgroundColor: runningProfiles.length > 0 ? '#ef4444' : '#333',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: runningProfiles.length > 0 ? 'pointer' : 'not-allowed',
                        fontWeight: 'bold'
                    }}
                >
                    {loading ? 'Encerrando...' : `Parar Todos (${runningProfiles.length})`}
                </button>
            </div>

            <div style={{ background: '#1e1e2e', padding: '20px', borderRadius: '10px', border: '1px solid #333' }}>
                <h3 style={{ marginTop: 0 }}>Perfis Ativos em Execução</h3>
                {runningProfiles.length === 0 ? (
                    <p style={{ color: '#aaa' }}>Nenhum perfil ativo no momento.</p>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {runningProfiles.map((id) => (
                            <li key={id} style={{ background: '#2a2a3d', padding: '10px 14px', borderRadius: '6px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>ID do Perfil: <code>{id}</code></span>
                                <span style={{ color: '#22c55e', fontSize: '13px', fontWeight: 'bold' }}>🟢 Ativo (Fingerprint Core)</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};
