import React, { useState, useEffect } from 'react';
import { CheckSquare, Maximize2, X, CheckCircle2, Circle } from 'lucide-react';
import { getPinnedTaskId, getTasksData, setPinnedTaskId, updateTask, TaskData } from './Tasks/tasksStorage';
import TaskDetailModal from './Tasks/TaskDetailModal';

const GlobalTaskWidget: React.FC = () => {
    const [pinnedTaskId, setPinnedTaskIdState] = useState<string | null>(getPinnedTaskId());
    const [task, setTask] = useState<TaskData | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [showFullModal, setShowFullModal] = useState(false);

    useEffect(() => {
        const handlePinnedTaskChange = () => {
            const id = getPinnedTaskId();
            setPinnedTaskIdState(id);
            if (id) {
                const tasks = getTasksData();
                const found = tasks.find(t => t.id === id) || null;
                setTask(found);
            } else {
                setTask(null);
                setIsExpanded(false);
            }
        };

        window.addEventListener('pinnedTaskChanged', handlePinnedTaskChange);
        handlePinnedTaskChange();

        return () => window.removeEventListener('pinnedTaskChanged', handlePinnedTaskChange);
    }, []);

    if (!pinnedTaskId || !task) return null;

    const toggleStatus = () => {
        const newStatus = task.status === 'done' ? 'todo' : 'done';
        updateTask(task.id, { status: newStatus });
        setTask({ ...task, status: newStatus });
    };

    const unpin = (e: React.MouseEvent) => {
        e.stopPropagation();
        setPinnedTaskId(null);
    };

    return (
        <>
            <div 
                style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '8px'
                }}
            >
                {isExpanded ? (
                    <div style={{
                        background: '#18181b',
                        border: '1px solid #27272a',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        width: '280px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <div style={{ cursor: 'pointer', display: 'flex' }} onClick={toggleStatus}>
                            {task.status === 'done' ? <CheckCircle2 size={20} color="#10b981" /> : <Circle size={20} color="#71717a" />}
                        </div>
                        <div 
                            style={{ flex: 1, fontSize: '13px', color: task.status === 'done' ? '#71717a' : '#e4e4e7', textDecoration: task.status === 'done' ? 'line-through' : 'none', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}
                            onClick={() => setIsExpanded(false)}
                        >
                            {task.title}
                        </div>
                        <button onClick={() => setShowFullModal(true)} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex' }} title="Expandir Tarefa">
                            <Maximize2 size={14} />
                        </button>
                        <button onClick={unpin} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex' }} title="Desafixar">
                            <X size={14} />
                        </button>
                    </div>
                ) : (
                    <button 
                        onClick={() => setIsExpanded(true)}
                        title="Ver Tarefa Fixada"
                        style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: '#8b5cf6',
                            border: 'none',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 4px 16px rgba(139, 92, 246, 0.4)',
                            transition: 'transform 0.2s'
                        }}
                    >
                        <CheckSquare size={20} />
                    </button>
                )}
            </div>

            {showFullModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '80%', height: '80%', maxWidth: '1000px', background: '#09090b', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '16px', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'flex-end', background: '#0f0f13' }}>
                            <button onClick={() => setShowFullModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                            <TaskDetailModal 
                                task={task} 
                                onClose={() => setShowFullModal(false)}
                                onUpdate={(taskId, updates) => {
                                    setTask(prev => prev ? { ...prev, ...updates } : null);
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default GlobalTaskWidget;
