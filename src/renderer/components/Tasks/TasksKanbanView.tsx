import React from 'react';
import { Clock, MessageSquare, CheckSquare, Plus, MoreVertical, Folder } from 'lucide-react';
import { TaskData, TaskStatus } from './tasksStorage';
import styles from './TasksKanbanView.module.css';

interface TasksKanbanViewProps {
    tasks: TaskData[];
    onTaskClick: (task: TaskData) => void;
    onUpdate: (task: TaskData) => void;
    onAddTask: (status: TaskStatus) => void;
}

const TasksKanbanView: React.FC<TasksKanbanViewProps> = ({ tasks, onTaskClick, onUpdate, onAddTask }) => {

    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        e.dataTransfer.setData('taskId', taskId);
    };

    const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        const task = tasks.find(t => t.id === taskId);
        if (task && task.status !== status) {
            const updated = { ...task, status, updatedAt: Date.now() };
            onUpdate(updated);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const columns: { id: TaskStatus; title: string; color: string }[] = [
        { id: 'todo', title: 'A fazer', color: '#3b82f6' },
        { id: 'in-progress', title: 'Em progresso', color: '#f59e0b' },
        { id: 'in-review', title: 'Em revisão', color: '#8b5cf6' },
        { id: 'done', title: 'Concluído', color: '#10b981' }
    ];

    // Helper to format date range like "24 Sep - 5 Oct"
    const formatDateRange = (start: number | null, end: number | null | undefined) => {
        if (!start) return '';
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const startDate = new Date(start);
        const startDay = startDate.getDate();
        const startMonth = months[startDate.getMonth()];
        
        if (end) {
            const endDate = new Date(end);
            const endDay = endDate.getDate();
            const endMonth = months[endDate.getMonth()];
            return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
        }
        return `${startDay} ${startMonth}`;
    };

    // Helper to get tag style colors dynamically
    const getTagStyles = (tag: string) => {
        const lower = tag.toLowerCase();
        if (lower.includes('saas')) return { bg: 'rgba(139, 92, 246, 0.12)', text: '#a78bfa', border: '1px solid rgba(139, 92, 246, 0.2)' };
        if (lower.includes('web')) return { bg: 'rgba(59, 130, 246, 0.12)', text: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.2)' };
        if (lower.includes('research') || lower.includes('pesquisa')) return { bg: 'rgba(20, 184, 166, 0.12)', text: '#2dd4bf', border: '1px solid rgba(20, 184, 166, 0.2)' };
        if (lower.includes('app') || lower.includes('mobile')) return { bg: 'rgba(244, 63, 94, 0.12)', text: '#fb7185', border: '1px solid rgba(244, 63, 94, 0.2)' };
        if (lower.includes('redesign') || lower.includes('design')) return { bg: 'rgba(245, 158, 11, 0.12)', text: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.2)' };
        if (lower.includes('copy')) return { bg: 'rgba(16, 185, 129, 0.12)', text: '#34d399', border: '1px solid rgba(16, 185, 129, 0.2)' };
        
        // Default fallbacks based on string hashing for consistency
        let hash = 0;
        for (let i = 0; i < tag.length; i++) {
            hash = tag.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = Math.abs(hash % 360);
        return { 
            bg: `hsla(${hue}, 70%, 50%, 0.12)`, 
            text: `hsla(${hue}, 80%, 75%, 1)`,
            border: `1px solid hsla(${hue}, 70%, 50%, 0.2)`
        };
    };

    // Helper to get initials
    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    return (
        <div className={styles.kanbanBoard}>
            {columns.map(col => {
                const columnTasks = tasks.filter(t => t.status === col.id);
                return (
                    <div 
                        key={col.id} 
                        className={styles.kanbanColumn}
                        onDrop={(e) => handleDrop(e, col.id)}
                        onDragOver={handleDragOver}
                    >
                        <div className={styles.columnHeader}>
                            <div className={styles.columnTitle}>
                                <div className={styles.columnBar} style={{ backgroundColor: col.color }} />
                                <span className={styles.columnName}>{col.title}</span>
                                <span className={styles.taskCount}>{columnTasks.length}</span>
                            </div>
                            <div className={styles.columnActions}>
                                <button className={styles.actionBtn} onClick={() => onAddTask(col.id)} title="Adicionar Tarefa">
                                    <Plus size={16} />
                                </button>
                                <button className={styles.actionBtn} title="Mais Opções">
                                    <MoreVertical size={16} />
                                </button>
                            </div>
                        </div>
                        <div className={styles.columnBody}>
                            {columnTasks.map(task => {
                                const totalSubtasks = task.subtasks?.length || 0;
                                const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;
                                const commentsCount = task.comments?.length || 0;
                                const docsCount = task.linkedCanvasIds?.length || 0;
                                
                                return (
                                    <div 
                                        key={task.id} 
                                        className={styles.kanbanCard}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, task.id)}
                                        onClick={() => onTaskClick(task)}
                                    >
                                        {/* Date range header */}
                                        {task.date && (
                                            <div className={styles.cardDateHeader}>
                                                <Clock size={12} className={styles.clockIcon} />
                                                <span>{formatDateRange(task.date, task.endDate)}</span>
                                            </div>
                                        )}

                                        {/* Card Title */}
                                        <div className={styles.cardTitle}>{task.title || 'Sem título'}</div>
                                        
                                        {/* Card Description */}
                                        {task.description && (
                                            <div className={styles.cardDescription}>{task.description}</div>
                                        )}

                                        {/* Tags/Categories Badges */}
                                        {task.tags && task.tags.length > 0 && (
                                            <div className={styles.cardTags}>
                                                {task.tags.map((tag, idx) => {
                                                    const tagStyle = getTagStyles(tag);
                                                    return (
                                                        <span 
                                                            key={idx} 
                                                            className={styles.tagBadge} 
                                                            style={{ 
                                                                backgroundColor: tagStyle.bg, 
                                                                color: tagStyle.text,
                                                                border: tagStyle.border
                                                            }}
                                                        >
                                                            {tag}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Card Footer metrics */}
                                        <div className={styles.cardFooter}>
                                            <div className={styles.cardMetrics}>
                                                {commentsCount > 0 && (
                                                    <span className={styles.metricItem} title="Comentários">
                                                        <MessageSquare size={12} /> {commentsCount}
                                                    </span>
                                                )}
                                                {docsCount > 0 && (
                                                    <span className={styles.metricItem} title="Documentos Vinculados">
                                                        <Folder size={12} /> {docsCount}
                                                    </span>
                                                )}
                                                {totalSubtasks > 0 && (
                                                    <span className={styles.metricItem} title="Checklist">
                                                        <CheckSquare size={12} /> {completedSubtasks}/{totalSubtasks}
                                                    </span>
                                                )}
                                            </div>
                                            
                                            {/* Avatars */}
                                            <div className={styles.cardAvatars}>
                                                <div className={`${styles.avatarCircle} ${styles.avatar1}`} style={{ backgroundColor: '#8b5cf6' }}>US</div>
                                                <div className={`${styles.avatarCircle} ${styles.avatar2}`} style={{ backgroundColor: '#3b82f6' }}>AD</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default TasksKanbanView;
