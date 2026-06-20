import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Circle, Plus, Link as LinkIcon, Unlink } from 'lucide-react';
import styles from './PageTasksSidebar.module.css';
import { TaskData, getTasksByCanvasId, getTasksData, linkTaskToCanvas, unlinkTaskFromCanvas, updateTask, createTask } from './tasksStorage';
import TaskDetailModal from './TaskDetailModal';

interface PageTasksSidebarProps {
    canvasId: string;
    canvasName: string;
    onClose: () => void;
}

const PageTasksSidebar: React.FC<PageTasksSidebarProps> = ({ canvasId, canvasName, onClose }) => {
    const [linkedTasks, setLinkedTasks] = useState<TaskData[]>([]);
    const [allTasks, setAllTasks] = useState<TaskData[]>([]);
    const [isLinking, setIsLinking] = useState(false);
    const [selectedTask, setSelectedTask] = useState<TaskData | null>(null);

    const loadData = () => {
        setLinkedTasks(getTasksByCanvasId(canvasId));
        setAllTasks(getTasksData().filter(t => !t.linkedCanvasIds?.includes(canvasId)));
    };

    useEffect(() => {
        loadData();
    }, [canvasId]);

    const handleToggleTaskStatus = (task: TaskData, e: React.MouseEvent) => {
        e.stopPropagation();
        const newStatus = task.status === 'done' ? 'todo' : 'done';
        updateTask(task.id, { status: newStatus });
        loadData();
    };

    const handleCreateTask = () => {
        const title = window.prompt('Nova tarefa para esta página:');
        if (title) {
            const newTask = createTask(title, 'default');
            linkTaskToCanvas(newTask.id, canvasId);
            loadData();
        }
    };

    return (
        <div className={styles.sidebarContainer}>
            <div className={styles.sidebarHeader}>
                <div className={styles.headerTitle}>
                    Tarefas: {canvasName}
                </div>
                <button className={styles.iconBtn} onClick={onClose}>
                    <X size={18} />
                </button>
            </div>

            <div className={styles.sidebarBody}>
                {isLinking ? (
                    <div className={styles.linkSection}>
                        <div className={styles.sectionHeader}>
                            <span>Vincular Tarefa Existente</span>
                            <button className={styles.textBtn} onClick={() => setIsLinking(false)}>Voltar</button>
                        </div>
                        <div className={styles.taskList}>
                            {allTasks.map(task => (
                                <div key={task.id} className={styles.linkTaskItem}>
                                    <div className={styles.taskTitle}>{task.title || 'Sem Título'}</div>
                                    <button 
                                        className={styles.linkBtn}
                                        onClick={() => {
                                            linkTaskToCanvas(task.id, canvasId);
                                            loadData();
                                            setIsLinking(false);
                                        }}
                                    >
                                        <LinkIcon size={14} /> Vincular
                                    </button>
                                </div>
                            ))}
                            {allTasks.length === 0 && (
                                <div className={styles.emptyText}>Nenhuma outra tarefa disponível para vincular.</div>
                            )}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className={styles.taskList}>
                            {linkedTasks.map(task => (
                                <div key={task.id} className={styles.taskItem} onClick={() => setSelectedTask(task)}>
                                    <div 
                                        className={styles.customCheckbox} 
                                        onClick={(e) => handleToggleTaskStatus(task, e)}
                                    >
                                        {task.status === 'done' ? <CheckCircle2 size={18} color="#10b981" /> : <Circle size={18} color="#52525b" />}
                                    </div>
                                    <div className={`${styles.taskTitle} ${task.status === 'done' ? styles.taskDone : ''}`}>
                                        {task.title || 'Tarefa sem título'}
                                    </div>
                                    <button 
                                        className={styles.unlinkBtn}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            unlinkTaskFromCanvas(task.id, canvasId);
                                            loadData();
                                        }}
                                        title="Desvincular"
                                    >
                                        <Unlink size={14} />
                                    </button>
                                </div>
                            ))}
                            {linkedTasks.length === 0 && (
                                <div className={styles.emptyText}>Nenhuma tarefa vinculada a esta página.</div>
                            )}
                        </div>

                        <div className={styles.actionRow}>
                            <button className={styles.actionBtn} onClick={handleCreateTask}>
                                <Plus size={14} /> Nova Tarefa
                            </button>
                            <button className={styles.actionBtnSecondary} onClick={() => setIsLinking(true)}>
                                <LinkIcon size={14} /> Vincular Existente
                            </button>
                        </div>
                    </>
                )}
            </div>

            {selectedTask && (
                <TaskDetailModal 
                    task={selectedTask}
                    onClose={() => setSelectedTask(null)}
                    onUpdate={(updated) => {
                        loadData();
                        setSelectedTask(updated);
                    }}
                />
            )}
        </div>
    );
};

export default PageTasksSidebar;
