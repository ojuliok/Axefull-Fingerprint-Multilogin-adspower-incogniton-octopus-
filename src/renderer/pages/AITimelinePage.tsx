import React, { useEffect, useState } from 'react';
import { Activity, Shield, Hash, Clock, Server, CheckCircle2, ChevronLeft } from 'lucide-react';
import styles from './AITimelinePage.module.css';

interface AuditLog {
    id: string;
    timestamp: string;
    action_type: string;
    profile_id: string | null;
    details: string;
    integrity_hash: string;
}

export const AITimelinePage: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchLogs = async () => {
            try {
                const res = await window.api.ai.getAuditLogs(100);
                if (isMounted && res.success && res.data) {
                    setLogs(res.data as AuditLog[]);
                }
            } catch (err) {
                console.error('Error fetching audit logs:', err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchLogs();
        return () => { isMounted = false; };
    }, []);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                {onBack && (
                    <button className={styles.backBtn} onClick={onBack}>
                        <ChevronLeft size={20} />
                    </button>
                )}
                <div>
                    <h1 className={styles.title}>Auditoria Blockchain IA</h1>
                    <p className={styles.subtitle}>Registro imutável de atividades e aprendizado da IA</p>
                </div>
            </div>

            <div className={styles.content}>
                {loading ? (
                    <div className={styles.loading}>Carregando auditoria...</div>
                ) : logs.length === 0 ? (
                    <div className={styles.empty}>Nenhum registro encontrado.</div>
                ) : (
                    <div className={styles.timeline}>
                        {logs.map((log) => (
                            <div key={log.id} className={styles.timelineItem}>
                                <div className={styles.timelineLine} />
                                <div className={styles.timelineIcon}>
                                    <Shield size={16} />
                                </div>
                                <div className={styles.timelineContent}>
                                    <div className={styles.logHeader}>
                                        <span className={styles.logAction}>{log.action_type}</span>
                                        <span className={styles.logTime}>
                                            <Clock size={12} /> {new Date(log.timestamp).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className={styles.logDetails}>
                                        <Server size={14} /> Perfil: {log.profile_id || 'Global'}
                                        <br/>
                                        <Activity size={14} /> Detalhes: {log.details}
                                    </div>
                                    <div className={styles.logHash}>
                                        <Hash size={12} /> Hash: <code>{log.integrity_hash ? `${log.integrity_hash.substring(0, 32)}...` : 'N/A'}</code>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
