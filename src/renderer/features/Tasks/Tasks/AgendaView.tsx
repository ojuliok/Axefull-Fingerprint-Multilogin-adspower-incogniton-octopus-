import React, { useState, useEffect } from 'react';
import { ChevronRight, Filter, Eye, EyeOff, Calendar, Users, Clock, AlertCircle, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TaskData, getTasksData, updateTask, deleteTask, syncTasksFromSupabase } from './tasksStorage';
import TaskDetailModal from './TaskDetailModal';
import styles from './AgendaView.module.css';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../../../context/WorkspaceContext';

const AgendaView: React.FC = () => {
    const navigate = useNavigate();
    const { currentWorkspace } = useWorkspace();
    const workspaceId = currentWorkspace?.id || 'default-workspace';
    const [tasks, setTasks] = useState<TaskData[]>([]);
    const [selectedTask, setSelectedTask] = useState<TaskData | null>(null);

    // View filter toggles
    const [showEvents, setShowEvents] = useState(true);
    const [showTasks, setShowTasks] = useState(true);
    const [showGuestsField, setShowGuestsField] = useState(true);
    const [showDateField, setShowDateField] = useState(true);
    const [showTimeField, setShowTimeField] = useState(true);

    const [loadingSync, setLoadingSync] = useState(false);

    useEffect(() => {
        // Load initial local data
        setTasks(getTasksData(workspaceId));

        // Perform Supabase Sync
        setLoadingSync(true);
        syncTasksFromSupabase(workspaceId).then((synced) => {
            setTasks(synced);
            setLoadingSync(false);
        }).catch(() => setLoadingSync(false));
    }, [workspaceId]);

    const handleUpdateTask = (taskId: string, updates: Partial<TaskData>) => {
        updateTask(taskId, updates, workspaceId);
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
    };

    const handleDeleteTask = (taskId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('Tem certeza que deseja excluir esta agenda?')) {
            deleteTask(taskId, workspaceId);
            setTasks(prev => prev.filter(t => t.id !== taskId));
        }
    };

    // Filtered items based on toggle switches
    const filteredItems = tasks.filter(item => {
        const type = item.type || item.customFields?.type || 'task';
        if (type === 'event' && !showEvents) return false;
        if (type === 'task' && !showTasks) return false;
        return true;
    });

    return (
        <div className={styles.container}>
            {/* Header section */}
            <header className={styles.header}>
                <div className={styles.titleArea}>
                    <button 
                        className={styles.backBtn}
                        onClick={() => navigate('/tasks')}
                        title="Voltar para Tarefas"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className={styles.title}>Agenda Simplificada</h1>
                        <p className={styles.subtitle}>Visualização direta de todos os seus eventos e tarefas gerados</p>
                    </div>
                </div>

                {loadingSync && (
                    <div className={styles.syncIndicator}>
                        <span className={styles.syncPulse} />
                        Sincronizando...
                    </div>
                )}
            </header>

            {/* Filter controls panel */}
            <section className={styles.filtersCard}>
                <div className={styles.filtersHeader}>
                    <Filter size={16} className={styles.filterIcon} />
                    <span className={styles.filtersTitle}>Configurações de Exibição</span>
                </div>
                <div className={styles.togglesGrid}>
                    <label className={styles.toggleRow}>
                        <input
                            type="checkbox"
                            checked={showEvents}
                            onChange={(e) => setShowEvents(e.target.checked)}
                            className={styles.checkbox}
                        />
                        <span className={styles.toggleLabel}>Mostrar Eventos</span>
                    </label>

                    <label className={styles.toggleRow}>
                        <input
                            type="checkbox"
                            checked={showTasks}
                            onChange={(e) => setShowTasks(e.target.checked)}
                            className={styles.checkbox}
                        />
                        <span className={styles.toggleLabel}>Mostrar Tarefas</span>
                    </label>

                    <label className={styles.toggleRow}>
                        <input
                            type="checkbox"
                            checked={showGuestsField}
                            onChange={(e) => setShowGuestsField(e.target.checked)}
                            className={styles.checkbox}
                        />
                        <span className={styles.toggleLabel}>Exibir Convidados</span>
                    </label>

                    <label className={styles.toggleRow}>
                        <input
                            type="checkbox"
                            checked={showDateField}
                            onChange={(e) => setShowDateField(e.target.checked)}
                            className={styles.checkbox}
                        />
                        <span className={styles.toggleLabel}>Exibir Data</span>
                    </label>

                    <label className={styles.toggleRow}>
                        <input
                            type="checkbox"
                            checked={showTimeField}
                            onChange={(e) => setShowTimeField(e.target.checked)}
                            className={styles.checkbox}
                        />
                        <span className={styles.toggleLabel}>Exibir Horário</span>
                    </label>
                </div>
            </section>

            {/* Main content table / cards list */}
            <main className={styles.contentArea}>
                {filteredItems.length === 0 ? (
                    <div className={styles.emptyState}>
                        <AlertCircle size={40} className={styles.emptyIcon} />
                        <h3>Nenhum item encontrado</h3>
                        <p>Experimente alterar suas configurações de exibição ou crie novas tarefas no calendário.</p>
                    </div>
                ) : (
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th style={{ width: '40%' }}>Nome</th>
                                    <th style={{ width: '15%' }}>Tipo</th>
                                    {showDateField && <th style={{ width: '15%' }}>Data</th>}
                                    {showTimeField && <th style={{ width: '15%' }}>Horário</th>}
                                    {showGuestsField && <th style={{ width: '15%' }}>Convidados</th>}
                                    <th style={{ width: '50px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.map(item => {
                                    const type = item.type || item.customFields?.type || 'task';
                                    const guestsList = item.guests || item.customFields?.guests || [];
                                    
                                    return (
                                        <tr 
                                            key={item.id} 
                                            onClick={() => setSelectedTask(item)}
                                            className={styles.tableRow}
                                        >
                                            {/* Name */}
                                            <td>
                                                <div className={styles.titleCell}>
                                                    <span className={styles.itemName}>{item.title}</span>
                                                    {item.description && (
                                                        <span className={styles.itemDesc} title={item.description}>
                                                            {item.description}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Type */}
                                            <td>
                                                <span className={`${styles.typeBadge} ${type === 'event' ? styles.badgeEvent : styles.badgeTask}`}>
                                                    {type === 'event' ? 'Evento' : 'Tarefa'}
                                                </span>
                                            </td>

                                            {/* Date */}
                                            {showDateField && (
                                                <td>
                                                    {item.date ? (
                                                        <div className={styles.flexCell}>
                                                            <Calendar size={13} className={styles.cellIcon} />
                                                            <span>{format(new Date(item.date), 'dd/MM/yyyy')}</span>
                                                        </div>
                                                    ) : (
                                                        <span className={styles.noData}>Sem data</span>
                                                    )}
                                                </td>
                                            )}

                                            {/* Time */}
                                            {showTimeField && (
                                                <td>
                                                    {item.startTime ? (
                                                        <div className={styles.flexCell}>
                                                            <Clock size={13} className={styles.cellIcon} />
                                                            <span>{item.startTime} {item.endTime && `- ${item.endTime}`}</span>
                                                        </div>
                                                    ) : (
                                                        <span className={styles.noData}>Dia inteiro</span>
                                                    )}
                                                </td>
                                            )}

                                            {/* Guests */}
                                            {showGuestsField && (
                                                <td>
                                                    {guestsList.length > 0 ? (
                                                        <div className={styles.flexCell}>
                                                            <Users size={13} className={styles.cellIcon} />
                                                            <span className={styles.guestsText} title={guestsList.join(', ')}>
                                                                {guestsList.length} {guestsList.length === 1 ? 'convidado' : 'convidados'}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className={styles.noData}>Nenhum</span>
                                                    )}
                                                </td>
                                            )}

                                            {/* Actions */}
                                            <td onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    className={styles.deleteBtn}
                                                    onClick={(e) => handleDeleteTask(item.id, e)}
                                                    title="Excluir item"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            {/* TaskDetailModal to allow edits */}
            {selectedTask && (
                <TaskDetailModal 
                    task={selectedTask}
                    onClose={() => setSelectedTask(null)}
                    onUpdate={handleUpdateTask}
                />
            )}
        </div>
    );
};

export default AgendaView;
