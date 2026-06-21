import React from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TaskData } from './tasksStorage';

interface TasksCalendarMonthViewProps {
    tasks: TaskData[];
    currentDate: Date;
    onTaskClick: (task: TaskData) => void;
    onCreateTask?: (date: Date) => void;
}

const TasksCalendarMonthView: React.FC<TasksCalendarMonthViewProps> = ({ tasks, currentDate, onTaskClick, onCreateTask }) => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#14141c', borderRadius: '8px', border: '1px solid #27272a', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #27272a', background: '#0f0f13' }}>
                {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map(day => (
                    <div key={day} style={{ padding: '12px 8px', textAlign: 'center', fontSize: '11px', color: '#a1a1aa', fontWeight: 500 }}>
                        {day}
                    </div>
                ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', flex: 1, overflowY: 'auto' }}>
                {days.map(day => {
                    const isCurrentMonth = isSameMonth(day, monthStart);
                    const isTodayDate = isSameDay(day, new Date());
                    const dayTasks = tasks.filter(t => t.date && isSameDay(new Date(t.date), day));

                    return (
                        <div 
                            key={day.toISOString()} 
                            style={{ 
                                borderRight: '1px solid #27272a', 
                                borderBottom: '1px solid #27272a', 
                                padding: '4px',
                                background: isTodayDate ? 'rgba(139, 92, 246, 0.05)' : (isCurrentMonth ? 'transparent' : 'rgba(0,0,0,0.2)'),
                                opacity: isCurrentMonth ? 1 : 0.5,
                                minHeight: '100px',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                            onClick={() => onCreateTask && onCreateTask(day)}
                        >
                            <div style={{ 
                                display: 'flex', justifyContent: 'flex-end', marginBottom: '4px' 
                            }}>
                                <span style={{ 
                                    width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%',
                                    background: isTodayDate ? '#8b5cf6' : 'transparent', color: isTodayDate ? 'white' : '#e2e8f0',
                                    fontSize: '12px', fontWeight: isTodayDate ? 600 : 400
                                }}>
                                    {format(day, 'd')}
                                </span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                                {dayTasks.map(task => (
                                    <div 
                                        key={task.id} 
                                        onClick={(e) => { e.stopPropagation(); onTaskClick(task); }}
                                        style={{ 
                                            background: task.status === 'done' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.8)',
                                            color: task.status === 'done' ? '#a1a1aa' : 'white',
                                            textDecoration: task.status === 'done' ? 'line-through' : 'none',
                                            padding: '2px 6px', borderRadius: '4px', fontSize: '10px',
                                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                        }}
                                    >
                                        {task.title || 'Sem título'}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
export default TasksCalendarMonthView;
