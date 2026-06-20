import React, { useState, useEffect, useRef } from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TaskData } from './tasksStorage';
import styles from './TasksCalendarTimeline.module.css';

interface TasksCalendarTimelineProps {
    tasks: TaskData[];
    currentDate: Date;
    viewMode: 'week' | 'day';
    onTaskClick: (task: TaskData) => void;
    onCreateTask?: (date: Date, hour: number) => void;
    onUpdateTask?: (taskId: string, updates: Partial<TaskData>) => void;
    visibleFields?: string[];
}

const TasksCalendarTimeline: React.FC<TasksCalendarTimelineProps> = ({ 
    tasks, currentDate, viewMode, onTaskClick, onCreateTask, onUpdateTask, visibleFields = ['Tags', 'Prioridade'] 
}) => {
    const [now, setNow] = useState(new Date());
    const timelineRef = useRef<HTMLDivElement>(null);
    const [resizingTask, setResizingTask] = useState<{ id: string; startY: number; startHeight: number; initialTop: number } | null>(null);
    const [localTasks, setLocalTasks] = useState<TaskData[]>(tasks);

    useEffect(() => { setLocalTasks(tasks); }, [tasks]);

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 60000);
        if (timelineRef.current) timelineRef.current.scrollTop = now.getHours() * 60 - 100;
        return () => clearInterval(interval);
    }, []);

    const startDate = viewMode === 'day' ? currentDate : startOfWeek(currentDate);
    const numDays = viewMode === 'day' ? 1 : 7;
    const weekDays = Array.from({ length: numDays }).map((_, i) => addDays(startDate, i));
    const hours = Array.from({ length: 24 }).map((_, i) => i);
    const getNowTopPosition = () => (now.getHours() * 60) + now.getMinutes();

    const handleResizeStart = (e: React.MouseEvent, task: TaskData, top: number, height: number) => {
        e.stopPropagation();
        e.preventDefault();
        setResizingTask({ id: task.id, startY: e.clientY, startHeight: height, initialTop: top });
    };

    useEffect(() => {
        if (!resizingTask) return;
        const handleMouseMove = (e: MouseEvent) => {
            let newHeight = resizingTask.startHeight + (e.clientY - resizingTask.startY);
            newHeight = Math.max(15, Math.round(newHeight / 15) * 15); 
            setLocalTasks(prev => prev.map(t => t.id === resizingTask.id ? { ...t, _tempHeight: newHeight } as any : t));
        };
        const handleMouseUp = () => {
            if (onUpdateTask) {
                const task = localTasks.find(t => t.id === resizingTask.id) as any;
                if (task && task._tempHeight) {
                    const endMinutes = resizingTask.initialTop + task._tempHeight;
                    const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;
                    onUpdateTask(task.id, { endTime });
                }
            }
            setResizingTask(null);
        };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => { document.removeEventListener('mousemove', handleMouseMove); document.removeEventListener('mouseup', handleMouseUp); };
    }, [resizingTask, localTasks, onUpdateTask]);

    return (
        <div className={styles.timelineContainer}>
            <div className={styles.headerRow}>
                <div className={styles.timeGutterHeader}>Hora</div>
                {weekDays.map(day => (
                    <div key={day.toISOString()} className={`${styles.dayHeader} ${isSameDay(day, now) ? styles.today : ''}`}>
                        <div className={styles.dayName}>{format(day, 'E', { locale: ptBR })}</div>
                        <div className={styles.dayNumber}>{format(day, 'd')}</div>
                    </div>
                ))}
            </div>
            <div className={styles.bodyScroll} ref={timelineRef}>
                <div className={styles.gridOverlay}>
                    <div className={styles.timeGutter}>
                        {hours.map(hour => (<div key={hour} className={styles.timeLabel}>{hour.toString().padStart(2, '0')}:00</div>))}
                    </div>

                    {weekDays.map(day => {
                        const dayTasks = localTasks.filter(t => t.date && isSameDay(new Date(t.date), day));
                        
                        return (
                            <div 
                                key={day.toISOString()} className={`${styles.dayColumn} ${isSameDay(day, now) ? styles.todayColumn : ''}`}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    const taskId = e.dataTransfer.getData('text/plain');
                                    if (taskId && onUpdateTask) {
                                        const y = e.clientY - e.currentTarget.getBoundingClientRect().top;
                                        const snappedY = Math.max(0, Math.round(y / 15) * 15);
                                        const startT = `${Math.floor(snappedY / 60).toString().padStart(2, '0')}:${(snappedY % 60).toString().padStart(2, '0')}`;
                                        const task = tasks.find(t => t.id === taskId);
                                        let endT = `${Math.floor((snappedY + 60) / 60).toString().padStart(2, '0')}:${((snappedY + 60) % 60).toString().padStart(2, '0')}`;
                                        
                                        if (task?.startTime && task?.endTime) {
                                            const [sh, sm] = task.startTime.split(':').map(Number);
                                            const [eh, em] = task.endTime.split(':').map(Number);
                                            const endMinutes = snappedY + (((eh * 60) + em) - ((sh * 60) + sm));
                                            endT = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;
                                        }
                                        onUpdateTask(taskId, { date: day.getTime(), startTime: startT, endTime: endT });
                                    }
                                }}
                            >
                                {hours.map(hour => (<div key={hour} className={styles.hourCell} onClick={() => onCreateTask && onCreateTask(day, hour)} />))}
                                {isSameDay(day, now) && (<div className={styles.currentTimeMarker} style={{ top: `${getNowTopPosition()}px` }}><div className={styles.currentTimeDot} /><div className={styles.currentTimeLine} /></div>)}

                                {dayTasks.map(task => {
                                    let top = 9 * 60; let height = 60; 
                                    if (task.startTime) {
                                        const [sh, sm] = task.startTime.split(':').map(Number);
                                        top = (sh * 60) + sm;
                                        if (task.endTime) {
                                            const [eh, em] = task.endTime.split(':').map(Number);
                                            height = Math.max(15, ((eh * 60) + em) - top);
                                        }
                                    }
                                    const tempTask = task as any;
                                    if (tempTask._tempHeight) height = tempTask._tempHeight;

                                    return (
                                        <div 
                                            key={task.id} className={`${styles.taskBlock} ${resizingTask?.id === task.id ? styles.isResizing : ''}`}
                                            style={{ top: `${top}px`, height: `${height}px` }}
                                            onClick={(e) => { e.stopPropagation(); onTaskClick(task); }}
                                            draggable onDragStart={(e) => { e.dataTransfer.setData('text/plain', task.id); e.stopPropagation(); }}
                                        >
                                            <div className={styles.taskTitle}>{task.title || 'Sem título'}</div>
                                            {visibleFields.length > 0 && task.customFields && (
                                                <div className={styles.customFieldsList}>
                                                    {visibleFields.map(field => task.customFields![field] ? (
                                                        <div key={field} className={styles.customFieldBadge}>{field}: {task.customFields![field]}</div>
                                                    ) : null)}
                                                </div>
                                            )}
                                            <div className={styles.resizeHandle} onMouseDown={(e) => handleResizeStart(e, task, top, height)} />
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
export default TasksCalendarTimeline;
