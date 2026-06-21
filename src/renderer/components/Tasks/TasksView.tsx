import React, { useState, useEffect, useRef } from 'react';
import { Menu as MenuIcon, ChevronLeft, ChevronRight, Plus, Search, Settings, Grid, CheckCircle2, Circle, MoreVertical, Calendar as CalendarIcon, List as ListIcon, Maximize2, Minimize2, Play, Pause, RotateCcw, Edit, PlayCircle, Trash2 } from 'lucide-react';
import { format, addMonths, subMonths, addDays, addWeeks, subWeeks, subDays, isSameDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import styles from './TasksView.module.css';
import { TaskData, TaskSpace, getTasksData, createTask, updateTask, getTasksSpaces, createSpace, deleteSpace, updateSpace } from './tasksStorage';
import TaskDetailModal from './TaskDetailModal';
import TasksCalendarTimeline from './TasksCalendarTimeline';
import TasksCalendarMonthView from './TasksCalendarMonthView';
import TasksKanbanView from './TasksKanbanView';
import CustomDatePicker from './CustomDatePicker';

const TasksView: React.FC = () => {
    const [tasks, setTasks] = useState<TaskData[]>([]);
    const [spaces, setSpaces] = useState<TaskSpace[]>([]);
    const [activeSpaceId, setActiveSpaceId] = useState<string>('all');
    
    const [currentDate, setCurrentDate] = useState(new Date());
    const [calendarViewMode, setCalendarViewMode] = useState<'day' | 'week' | 'month'>('month');
    
    // Sub-header tabs inside tasks view (Board, List, Timeline, Due tasks)
    const [activeTab, setActiveTab] = useState<'board' | 'list' | 'timeline' | 'due'>('list');
    
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth > 768);
    const [selectedTask, setSelectedTask] = useState<TaskData | null>(null);
    const [contextMenu, setContextMenu] = useState<{ type: 'task' | 'space', id: string, x: number, y: number } | null>(null);

    const [isCreatingInline, setIsCreatingInline] = useState(false);
    const [inlineTaskTitle, setInlineTaskTitle] = useState('');
    const [inlineTaskDate, setInlineTaskDate] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCompletedCollapsed, setIsCompletedCollapsed] = useState(true);
    const [promptDialog, setPromptDialog] = useState<{
        isOpen: boolean;
        title: string;
        placeholder: string;
        defaultValue: string;
        onSubmit: (val: string) => void;
    } | null>(null);

    const [miniCalDate, setMiniCalDate] = useState(new Date());

    useEffect(() => {
        setMiniCalDate(currentDate);
    }, [currentDate]);

    const getMiniCalDays = () => {
        const monthStart = startOfMonth(miniCalDate);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);
        return eachDayOfInterval({ start: startDate, end: endDate });
    };

    const miniCalDays = getMiniCalDays();

    const [pomodoroMode, setPomodoroMode] = useState<'work' | 'short' | 'long'>('work');
    const [pomodoroSeconds, setPomodoroSeconds] = useState(25 * 60);
    const [isPomodoroRunning, setIsPomodoroRunning] = useState(false);

    const getSecondsForMode = (mode: 'work' | 'short' | 'long') => {
        if (mode === 'work') return 25 * 60;
        if (mode === 'short') return 5 * 60;
        return 15 * 60;
    };

    const handleModeChange = (mode: 'work' | 'short' | 'long') => {
        setPomodoroMode(mode);
        setIsPomodoroRunning(false);
        setPomodoroSeconds(getSecondsForMode(mode));
    };

    const formatPomodoroTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isPomodoroRunning) {
            interval = setInterval(() => {
                setPomodoroSeconds(prev => {
                    if (prev <= 1) {
                        setIsPomodoroRunning(false);
                        alert(pomodoroMode === 'work' ? 'Hora de descansar!' : 'Hora de focar!');
                        return getSecondsForMode(pomodoroMode);
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (interval) clearInterval(interval);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isPomodoroRunning, pomodoroMode]);

    useEffect(() => {
        setTasks(getTasksData());
        const loadedSpaces = getTasksSpaces();
        setSpaces(loadedSpaces);
        if (loadedSpaces.length > 0) {
            setActiveSpaceId(loadedSpaces[0].id);
        }
    }, []);

    useEffect(() => {
        const handleGlobalClick = () => setContextMenu(null);
        window.addEventListener('click', handleGlobalClick);
        return () => window.removeEventListener('click', handleGlobalClick);
    }, []);

    // Listen for toggle-tasks-sidebar event from MobileBottomNav
    useEffect(() => {
        const handleToggle = () => {
            setIsSidebarOpen(prev => !prev);
        };
        window.addEventListener('toggle-tasks-sidebar', handleToggle);
        return () => window.removeEventListener('toggle-tasks-sidebar', handleToggle);
    }, []);

    const filteredTasks = (activeSpaceId === 'all' 
        ? tasks 
        : tasks.filter(t => t.spaceId === activeSpaceId))
        .filter(t => t.title?.toLowerCase().includes(searchQuery.toLowerCase()) || t.description?.toLowerCase().includes(searchQuery.toLowerCase()));

    const startInlineCreation = () => {
        setIsCreatingInline(true);
        setInlineTaskTitle('');
        setInlineTaskDate(null);
    };

    const handleSaveInlineTask = () => {
        if (!inlineTaskTitle.trim()) return;
        const targetSpace = activeSpaceId === 'all' ? (spaces[0]?.id || 'default') : activeSpaceId;
        
        const newTask = createTask(inlineTaskTitle.trim(), targetSpace, inlineTaskDate);
        setTasks([...tasks, newTask]);
        
        setIsCreatingInline(false);
        setInlineTaskTitle('');
        setInlineTaskDate(null);
    };

    const handleCancelInlineCreation = () => {
        setIsCreatingInline(false);
        setInlineTaskTitle('');
        setInlineTaskDate(null);
    };

    const handleCreateTaskInColumn = (status: any) => {
        setPromptDialog({
            isOpen: true,
            title: 'Nome da tarefa',
            placeholder: 'Digite o nome da tarefa...',
            defaultValue: '',
            onSubmit: (title) => {
                const targetSpace = activeSpaceId === 'all' ? (spaces[0]?.id || 'default') : activeSpaceId;
                const newTask = createTask(title, targetSpace, null, status);
                setTasks(prev => [...prev, newTask]);
            }
        });
    };

    const handleCreateTaskFromCalendar = (date: Date, hour?: number) => {
        setPromptDialog({
            isOpen: true,
            title: hour !== undefined ? `Nova tarefa para ${format(date, 'dd/MM/yyyy')} às ${hour}h` : `Nova tarefa para ${format(date, 'dd/MM/yyyy')}`,
            placeholder: 'Digite o nome da tarefa...',
            defaultValue: '',
            onSubmit: (title) => {
                const targetSpace = activeSpaceId === 'all' ? (spaces[0]?.id || 'default') : activeSpaceId;
                const newTask = createTask(title, targetSpace, date.getTime(), 'todo');
                
                if (hour !== undefined) {
                    const startTime = `${hour.toString().padStart(2, '0')}:00`;
                    const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
                    newTask.startTime = startTime;
                    newTask.endTime = endTime;
                    import('./tasksStorage').then(m => m.updateTask(newTask.id, { startTime, endTime }));
                }
                
                setTasks(prev => [...prev, newTask]);
            }
        });
    };

    const handleNext = () => {
        if (calendarViewMode === 'day') setCurrentDate(addDays(currentDate, 1));
        else if (calendarViewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
        else if (calendarViewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
    };
    const handlePrev = () => {
        if (calendarViewMode === 'day') setCurrentDate(subDays(currentDate, 1));
        else if (calendarViewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
        else if (calendarViewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
    };
    const goToday = () => setCurrentDate(new Date());

    const handleUpdateTaskTime = (taskId: string, updates: Partial<TaskData>) => {
        updateTask(taskId, updates);
        setTasks(prevTasks => prevTasks.map(t => t.id === taskId ? { ...t, ...updates } : t));
    };

    const handleToggleTaskStatus = (task: TaskData, e: React.MouseEvent) => {
        e.stopPropagation();
        const newStatus = task.status === 'done' ? 'todo' : 'done';
        updateTask(task.id, { status: newStatus });
        setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    };

    return (
        <div className={styles.googleContainer}>
            <header className={styles.todoistHeader}>
                <div className={styles.headerLeft}>
                    <button className={styles.hamburgerBtn} onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                        <MenuIcon size={20} />
                    </button>
                    <span className={styles.todoistHeaderTitle}>Meus Projetos</span>
                </div>

                <div className={styles.headerRight}>
                    <div className={styles.searchWrapper}>
                        <Search size={16} className={styles.searchIcon} />
                        <input 
                            type="text" 
                            placeholder="Buscar tarefas..." 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className={styles.searchInput} 
                        />
                    </div>
                </div>
            </header>

            <div className={styles.googleBody}>
                {isSidebarOpen && (
                    <div className={styles.sidebarOverlay} onClick={() => setIsSidebarOpen(false)} />
                )}
                <aside className={`${styles.googleSidebar} ${!isSidebarOpen ? styles.collapsed : ''}`}>
                    <div className={styles.calendarsSection}>
                        <div className={styles.sectionTitle}>
                            <span>Meus Projetos</span>
                            <Plus size={16} onClick={(e) => {
                                e.stopPropagation();
                                setPromptDialog({
                                    isOpen: true,
                                    title: 'Nome do novo projeto',
                                    placeholder: 'Digite o nome do projeto...',
                                    defaultValue: '',
                                    onSubmit: (title) => {
                                        const ns = createSpace(title);
                                        setSpaces(prev => [...prev, ns]);
                                        setActiveSpaceId(ns.id);
                                    }
                                });
                            }}/>
                        </div>
                        
                        <div 
                            className={styles.spaceItem}
                            onClick={() => {
                                setActiveSpaceId('all');
                                if (window.innerWidth <= 768) setIsSidebarOpen(false);
                            }}
                            style={activeSpaceId === 'all' ? { background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc' } : {}}
                        >
                            <Grid size={18} color="#a1a1aa" />
                            <span>Todos os Projetos</span>
                        </div>

                        {spaces.map(space => (
                            <div 
                                key={space.id} 
                                className={styles.spaceItem}
                                onClick={() => {
                                    setActiveSpaceId(space.id);
                                    if (window.innerWidth <= 768) setIsSidebarOpen(false);
                                }}
                                onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    setPromptDialog({
                                        isOpen: true,
                                        title: 'Novo nome do projeto',
                                        placeholder: 'Digite o nome do projeto...',
                                        defaultValue: space.title,
                                        onSubmit: (newName) => {
                                            updateSpace(space.id, { title: newName });
                                            setSpaces(prev => prev.map(s => s.id === space.id ? { ...s, title: newName } : s));
                                        }
                                    });
                                }}
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    setContextMenu({ type: 'space', id: space.id, x: e.clientX, y: e.clientY });
                                }}
                                style={activeSpaceId === space.id ? { background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc' } : {}}
                            >
                                <div className={styles.spaceItemLeft}>
                                    <ListIcon size={18} color={space.color} />
                                    <span>{space.title}</span>
                                </div>
                                <button 
                                    className={styles.spaceOptionsBtn}
                                    title="Opções do projeto"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setContextMenu({ type: 'space', id: space.id, x: e.clientX, y: e.clientY });
                                    }}
                                >
                                    <MoreVertical size={14} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Month Mini-Calendar */}
                    <div className={styles.miniCalendar}>
                        <div className={styles.miniCalHeader}>
                            <span>{format(miniCalDate, 'MMMM yyyy', { locale: ptBR })}</span>
                            <div style={{display:'flex', gap: '8px'}}>
                                <ChevronLeft size={16} cursor="pointer" onClick={() => setMiniCalDate(subMonths(miniCalDate, 1))} />
                                <ChevronRight size={16} cursor="pointer" onClick={() => setMiniCalDate(addMonths(miniCalDate, 1))} />
                            </div>
                        </div>
                        <div className={styles.miniCalGrid}>
                            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
                                <div key={i} className={styles.miniCalDayHeader}>{day}</div>
                            ))}
                            {miniCalDays.map((day, i) => {
                                const isCurrentMonth = isSameMonth(day, miniCalDate);
                                const isTodayDate = isToday(day);
                                const isSelected = isSameDay(day, currentDate);
                                return (
                                    <div 
                                        key={i} 
                                        className={`${styles.miniCalDayCell} ${!isCurrentMonth ? styles.outside : ''} ${isTodayDate ? styles.today : ''} ${isSelected ? styles.selected : ''}`}
                                        onClick={() => setCurrentDate(day)}
                                    >
                                        {format(day, 'd')}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Pomodoro Timer */}
                    <div className={styles.pomodoroSidebarSection}>
                        <div className={styles.pomodoroSidebarHeader}>
                            <span>⏱️ Pomodoro</span>
                            <span style={{ fontSize: '11px', color: '#a1a1aa' }}>
                                {pomodoroMode === 'work' ? 'Foco' : pomodoroMode === 'short' ? 'Pausa Curta' : 'Pausa Longa'}
                            </span>
                        </div>
                        <div className={styles.pomodoroSidebarTimer}>
                            {formatPomodoroTime(pomodoroSeconds)}
                        </div>
                        <div className={styles.pomodoroSidebarModes}>
                            <button 
                                className={`${styles.pomodoroSidebarModeBtn} ${pomodoroMode === 'work' ? styles.active : ''}`}
                                onClick={() => handleModeChange('work')}
                            >
                                25 Min
                            </button>
                            <button 
                                className={`${styles.pomodoroSidebarModeBtn} ${pomodoroMode === 'short' ? styles.active : ''}`}
                                onClick={() => handleModeChange('short')}
                            >
                                5 Min
                            </button>
                            <button 
                                className={`${styles.pomodoroSidebarModeBtn} ${pomodoroMode === 'long' ? styles.active : ''}`}
                                onClick={() => handleModeChange('long')}
                            >
                                15 Min
                            </button>
                        </div>
                        <div className={styles.pomodoroSidebarControls}>
                            <button 
                                className={`${styles.pomodoroSidebarControlBtn} ${isPomodoroRunning ? styles.pause : styles.play}`}
                                onClick={() => setIsPomodoroRunning(!isPomodoroRunning)}
                            >
                                {isPomodoroRunning ? <Pause size={12} /> : <Play size={12} />}
                                {isPomodoroRunning ? 'Pausar' : 'Iniciar'}
                            </button>
                            <button 
                                className={`${styles.pomodoroSidebarControlBtn} ${styles.reset}`}
                                onClick={() => {
                                    setIsPomodoroRunning(false);
                                    setPomodoroSeconds(getSecondsForMode(pomodoroMode));
                                }}
                            >
                                <RotateCcw size={12} />
                                Reiniciar
                            </button>
                        </div>
                    </div>
                </aside>

                <main className={styles.googleMain}>
                    <div className={styles.kanbanSubHeader}>
                        <div className={styles.breadcrumb}>
                            <span>Tarefas</span>
                            <ChevronRight size={10} />
                            <span className={styles.breadcrumbActive}>
                                {spaces.find(s => s.id === activeSpaceId)?.title || 'Geral'}
                            </span>
                        </div>
                        <div className={styles.kanbanProjectHeader}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <h2 className={styles.kanbanProjectTitle}>
                                    {spaces.find(s => s.id === activeSpaceId)?.title || 'Todas as Tarefas'}
                                </h2>
                                {activeSpaceId !== 'all' && (
                                    <button 
                                        className={styles.editProjectHeaderBtn}
                                        title="Editar nome do projeto"
                                        onClick={() => {
                                            const currentSpace = spaces.find(s => s.id === activeSpaceId);
                                            if (currentSpace) {
                                                setPromptDialog({
                                                    isOpen: true,
                                                    title: 'Novo nome do projeto',
                                                    placeholder: 'Digite o nome do projeto...',
                                                    defaultValue: currentSpace.title,
                                                    onSubmit: (newName) => {
                                                        updateSpace(activeSpaceId, { title: newName });
                                                        setSpaces(prev => prev.map(s => s.id === activeSpaceId ? { ...s, title: newName } : s));
                                                    }
                                                });
                                            }
                                        }}
                                    >
                                        <Edit size={14} />
                                    </button>
                                )}
                            </div>

                            {activeTab === 'timeline' && (
                                <div className={styles.calendarNav}>
                                    <button className={styles.todayBtn} onClick={goToday}>Hoje</button>
                                    <div className={styles.navArrows}>
                                        <button className={styles.navArrowBtn} onClick={handlePrev}><ChevronLeft size={16} /></button>
                                        <button className={styles.navArrowBtn} onClick={handleNext}><ChevronRight size={16} /></button>
                                    </div>
                                    <span className={styles.calendarDateTitle}>
                                        {format(currentDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                    </span>
                                    <div className={styles.viewToggle}>
                                        <button 
                                            className={`${styles.toggleBtn} ${calendarViewMode === 'day' ? styles.toggleActive : ''}`} 
                                            onClick={() => setCalendarViewMode('day')}
                                        >
                                            Dia
                                        </button>
                                        <button 
                                            className={`${styles.toggleBtn} ${calendarViewMode === 'week' ? styles.toggleActive : ''}`} 
                                            onClick={() => setCalendarViewMode('week')}
                                        >
                                            Semana
                                        </button>
                                        <button 
                                            className={`${styles.toggleBtn} ${calendarViewMode === 'month' ? styles.toggleActive : ''}`} 
                                            onClick={() => setCalendarViewMode('month')}
                                        >
                                            Mês
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab !== 'timeline' && (
                                <button className={styles.createBtnInline} onClick={startInlineCreation}>
                                    <Plus size={16} /> Nova Tarefa
                                </button>
                            )}
                        </div>
                        
                        {/* Subheader tabs bar */}
                        <div className={styles.kanbanTabs}>
                            <button 
                                className={`${styles.kanbanTab} ${activeTab === 'list' ? styles.kanbanTabActive : ''}`}
                                onClick={() => setActiveTab('list')}
                            >
                                Lista
                            </button>
                            <button 
                                className={`${styles.kanbanTab} ${activeTab === 'board' ? styles.kanbanTabActive : ''}`}
                                onClick={() => setActiveTab('board')}
                            >
                                Quadro
                            </button>
                            <button 
                                className={`${styles.kanbanTab} ${activeTab === 'timeline' ? styles.kanbanTabActive : ''}`}
                                onClick={() => setActiveTab('timeline')}
                            >
                                Calendário
                            </button>
                            <button 
                                className={`${styles.kanbanTab} ${activeTab === 'due' ? styles.kanbanTabActive : ''}`}
                                onClick={() => setActiveTab('due')}
                            >
                                Pendentes
                            </button>
                        </div>
                    </div>

                    {activeTab === 'board' && (
                        <TasksKanbanView 
                            tasks={filteredTasks} 
                            onTaskClick={setSelectedTask}
                            onUpdate={(updated) => {
                                updateTask(updated.id, updated);
                                setTasks(tasks.map(t => t.id === updated.id ? updated : t));
                            }}
                            onAddTask={handleCreateTaskInColumn}
                        />
                    )}

                    {activeTab === 'list' && (
                        <div className={styles.tasksListContainer}>
                            {filteredTasks.length === 0 ? (
                                <div className={styles.emptyTasksWrapper}>
                                    <div className={styles.allTasksComplete}>
                                        <div style={{ fontSize: '64px', marginBottom: '20px', filter: 'drop-shadow(0 0 10px rgba(139, 92, 246, 0.4))' }}>🎉</div>
                                        <h3>Todas as tarefas concluídas</h3>
                                        <p>Bom trabalho! Que tal criar uma nova tarefa?</p>
                                    </div>
                                    {!isCreatingInline ? (
                                        <button className={styles.centerGlowBtn} onClick={startInlineCreation}>
                                            <Plus size={20} /> Criar Tarefa
                                        </button>
                                    ) : (
                                        <div className={styles.inlineCreationCard}>
                                            <input 
                                                type="text" 
                                                placeholder="O que precisa ser feito?" 
                                                value={inlineTaskTitle} 
                                                onChange={e => setInlineTaskTitle(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleSaveInlineTask()}
                                                className={styles.inlineInputTitle}
                                                autoFocus
                                            />
                                            <div className={styles.inlineCardActions}>
                                                <div style={{ width: '150px' }}>
                                                    <CustomDatePicker 
                                                        selectedDate={inlineTaskDate}
                                                        onChange={setInlineTaskDate}
                                                        placeholder="Prazo"
                                                    />
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button className={styles.inlineCancelBtn} onClick={handleCancelInlineCreation}>
                                                        Cancelar
                                                    </button>
                                                    <button 
                                                        className={styles.inlineAddBtn} 
                                                        onClick={handleSaveInlineTask}
                                                        disabled={!inlineTaskTitle.trim()}
                                                    >
                                                        Adicionar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className={styles.tasksListWrapper}>
                                    {filteredTasks.filter(t => t.status !== 'done').map(task => {
                                        const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;
                                        const totalSubtasks = task.subtasks?.length || 0;
                                        return (
                                            <div 
                                                key={task.id} 
                                                className={styles.taskListItem}
                                                onClick={() => setSelectedTask(task)}
                                                onContextMenu={(e) => { e.preventDefault(); setContextMenu({ type: 'task', id: task.id, x: e.clientX, y: e.clientY }); }}
                                            >
                                                <div className={styles.customCheckbox} onClick={(e) => handleToggleTaskStatus(task, e)}>
                                                    <Circle size={18} className={styles.checkboxCircle} />
                                                </div>
                                                <div className={styles.taskListItemContent}>
                                                    <div className={styles.taskListItemTitle}>{task.title || 'Sem título'}</div>
                                                    {totalSubtasks > 0 && (
                                                        <div className={styles.subtaskProgressBarWrapper}>
                                                            <div className={styles.subtaskProgressText}>{completedSubtasks}/{totalSubtasks}</div>
                                                            <div className={styles.subtaskProgressTrack}>
                                                                <div className={styles.subtaskProgressFill} style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }} />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                <div className={styles.taskQuickActions}>
                                                    <button 
                                                        className={styles.quickActionBtn} 
                                                        title="Focar nesta tarefa (Pomodoro)"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setIsPomodoroRunning(true);
                                                            setPomodoroMode('work');
                                                        }}
                                                    >
                                                        <PlayCircle size={16} />
                                                    </button>
                                                    <button 
                                                        className={styles.quickActionBtn} 
                                                        title="Excluir"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if(window.confirm('Excluir tarefa?')) {
                                                                import('./tasksStorage').then(m => m.deleteTask(task.id));
                                                                setTasks(tasks.filter(t => t.id !== task.id));
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>

                                                {task.date && (
                                                    <div className={styles.taskListDateBadge}>
                                                        {format(new Date(task.date), 'dd MMM', { locale: ptBR })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {/* Inline creation form at the bottom of active tasks list */}
                                    {isCreatingInline ? (
                                        <div className={styles.inlineCreationCard} style={{ marginTop: '12px' }}>
                                            <input 
                                                type="text" 
                                                placeholder="O que precisa ser feito?" 
                                                value={inlineTaskTitle} 
                                                onChange={e => setInlineTaskTitle(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleSaveInlineTask()}
                                                className={styles.inlineInputTitle}
                                                autoFocus
                                            />
                                            <div className={styles.inlineCardActions}>
                                                <div style={{ width: '150px' }}>
                                                    <CustomDatePicker 
                                                        selectedDate={inlineTaskDate}
                                                        onChange={setInlineTaskDate}
                                                        placeholder="Prazo"
                                                    />
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button className={styles.inlineCancelBtn} onClick={handleCancelInlineCreation}>
                                                        Cancelar
                                                    </button>
                                                    <button 
                                                        className={styles.inlineAddBtn} 
                                                        onClick={handleSaveInlineTask}
                                                        disabled={!inlineTaskTitle.trim()}
                                                    >
                                                        Adicionar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <button className={styles.centerGlowBtn} onClick={startInlineCreation} style={{ marginTop: '16px', width: '100%', maxWidth: 'none', borderRadius: '8px' }}>
                                            <Plus size={16} /> Adicionar tarefa
                                        </button>
                                    )}
                                    
                                    {filteredTasks.filter(t => t.status === 'done').length > 0 && (
                                        <div className={styles.completedSectionWrapper} style={{ marginTop: '32px' }}>
                                            <div 
                                                className={styles.completedHeader} 
                                                onClick={() => setIsCompletedCollapsed(!isCompletedCollapsed)}
                                            >
                                                <ChevronRight 
                                                    size={16} 
                                                    className={`${styles.collapseChevron} ${!isCompletedCollapsed ? styles.expanded : ''}`} 
                                                />
                                                <span>Concluídas ({filteredTasks.filter(t => t.status === 'done').length})</span>
                                            </div>
                                            
                                            {!isCompletedCollapsed && (
                                                <div className={styles.completedList}>
                                                    {filteredTasks.filter(t => t.status === 'done').map(task => (
                                                        <div 
                                                            key={task.id} 
                                                            className={styles.taskListItem}
                                                            onClick={() => setSelectedTask(task)}
                                                            onContextMenu={(e) => { e.preventDefault(); setContextMenu({ type: 'task', id: task.id, x: e.clientX, y: e.clientY }); }}
                                                        >
                                                            <div className={styles.customCheckbox} onClick={(e) => handleToggleTaskStatus(task, e)}>
                                                                <CheckCircle2 size={18} className={styles.checkboxChecked} />
                                                            </div>
                                                            <div className={`${styles.taskListItemTitle} ${styles.done}`}>{task.title || 'Sem título'}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'timeline' && calendarViewMode !== 'month' && (
                        <TasksCalendarTimeline 
                            tasks={filteredTasks} 
                            currentDate={currentDate} 
                            viewMode={calendarViewMode as 'week' | 'day'} 
                            onTaskClick={setSelectedTask}
                            onUpdateTask={handleUpdateTaskTime}
                            onCreateTask={handleCreateTaskFromCalendar}
                        />
                    )}
                    {activeTab === 'timeline' && calendarViewMode === 'month' && (
                        <TasksCalendarMonthView
                            tasks={filteredTasks}
                            currentDate={currentDate}
                            onTaskClick={setSelectedTask}
                            onCreateTask={(date) => handleCreateTaskFromCalendar(date)}
                        />
                    )}

                    {activeTab === 'due' && (
                        <div className={styles.dueTasksContainer}>
                            <h3 className={styles.dueTasksTitle}>Tarefas Ordenadas por Prazo</h3>
                            {filteredTasks.filter(t => t.date !== null).length === 0 ? (
                                <div className={styles.allTasksComplete}>
                                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>📅</div>
                                    <h3>Nenhum prazo definido</h3>
                                    <p>Suas tarefas agendadas aparecerão aqui.</p>
                                </div>
                            ) : (
                                <div>
                                    {filteredTasks
                                        .filter(t => t.date !== null)
                                        .sort((a, b) => (a.date || 0) - (b.date || 0))
                                        .map(task => (
                                            <div 
                                                key={task.id} 
                                                className={styles.taskListItem}
                                                onClick={() => setSelectedTask(task)}
                                                onContextMenu={(e) => { e.preventDefault(); setContextMenu({ type: 'task', id: task.id, x: e.clientX, y: e.clientY }); }}
                                            >
                                                <div className={styles.customCheckbox} onClick={(e) => handleToggleTaskStatus(task, e)}>
                                                    {task.status === 'done' ? <CheckCircle2 size={18} className={styles.checkboxChecked} /> : <Circle size={18} className={styles.checkboxCircle} />}
                                                </div>
                                                <div className={`${styles.taskListItemTitle} ${task.status === 'done' ? styles.done : ''}`}>{task.title || 'Sem título'}</div>
                                                {task.date && (
                                                    <div style={{ fontSize: '12px', color: '#a1a1aa', marginRight: '16px', background: 'rgba(139, 92, 246, 0.12)', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                                                        {format(new Date(task.date), 'dd/MM/yyyy')} {task.endDate && ` até ${format(new Date(task.endDate), 'dd/MM/yyyy')}`}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    }
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {contextMenu && contextMenu.type === 'task' && (
                <div className={styles.contextMenu} style={{ top: contextMenu.y, left: contextMenu.x }}>
                    <div className={styles.contextMenuItem} onClick={() => handleUpdateTaskTime(contextMenu.id, { priority: 'high' })}>🔥 Prioridade Alta</div>
                    <div className={styles.contextMenuItem} onClick={() => handleUpdateTaskTime(contextMenu.id, { priority: 'medium' })}>⚡ Prioridade Média</div>
                    <div className={styles.contextMenuItem} onClick={() => handleUpdateTaskTime(contextMenu.id, { priority: 'low' })}>🟢 Prioridade Baixa</div>
                    <div className={styles.contextMenuDivider} />
                    <div className={styles.contextMenuItem} onClick={() => handleUpdateTaskTime(contextMenu.id, { status: 'todo' })}>📋 Mover para A fazer</div>
                    <div className={styles.contextMenuItem} onClick={() => handleUpdateTaskTime(contextMenu.id, { status: 'in-progress' })}>⚡ Mover para Em progresso</div>
                    <div className={styles.contextMenuItem} onClick={() => handleUpdateTaskTime(contextMenu.id, { status: 'in-review' })}>🔍 Mover para Em revisão</div>
                    <div className={styles.contextMenuItem} onClick={() => handleUpdateTaskTime(contextMenu.id, { status: 'done' })}>✅ Mover para Concluído</div>
                    <div className={styles.contextMenuDivider} />
                    <div className={styles.contextMenuItem} onClick={() => {
                        if(window.confirm('Excluir tarefa?')) {
                            import('./tasksStorage').then(m => m.deleteTask(contextMenu.id));
                            setTasks(tasks.filter(t => t.id !== contextMenu.id));
                        }
                    }}>🗑️ Excluir Tarefa</div>
                </div>
            )}

            {contextMenu && contextMenu.type === 'space' && (
                                <div className={styles.contextMenu} style={{ top: contextMenu.y, left: contextMenu.x }}>
                                    <div className={styles.contextMenuItem} onClick={() => {
                                        const spaceToRename = spaces.find(s => s.id === contextMenu.id);
                                        if (spaceToRename) {
                                            setPromptDialog({
                                                isOpen: true,
                                                title: 'Renomear projeto',
                                                placeholder: 'Digite o nome do projeto...',
                                                defaultValue: spaceToRename.title,
                                                onSubmit: (newName) => {
                                                    updateSpace(contextMenu.id, { title: newName });
                                                    setSpaces(prev => prev.map(s => s.id === contextMenu.id ? { ...s, title: newName } : s));
                                                }
                                            });
                                        }
                                    }}>✏️ Renomear</div>
                                    <div className={styles.contextMenuItem} onClick={() => {
                                        if(window.confirm('Excluir lista?')) {
                                            deleteSpace(contextMenu.id);
                                            setSpaces(spaces.filter(s => s.id !== contextMenu.id));
                                        }
                                    }}>🗑️ Excluir Lista</div>
                                </div>
                            )}

            {selectedTask && (
                <TaskDetailModal 
                    task={selectedTask} 
                    onClose={() => setSelectedTask(null)}
                    onUpdate={handleUpdateTaskTime}
                />
            )}

            {promptDialog && promptDialog.isOpen && (
                <PromptModal 
                    title={promptDialog.title}
                    placeholder={promptDialog.placeholder}
                    defaultValue={promptDialog.defaultValue}
                    onClose={() => setPromptDialog(null)}
                    onSubmit={(val) => {
                        promptDialog.onSubmit(val);
                        setPromptDialog(null);
                    }}
                />
            )}
        </div>
    );
};

interface PromptModalProps {
    title: string;
    placeholder?: string;
    defaultValue?: string;
    onClose: () => void;
    onSubmit: (value: string) => void;
}

const PromptModal: React.FC<PromptModalProps> = ({ title, placeholder = '', defaultValue = '', onClose, onSubmit }) => {
    const [value, setValue] = useState(defaultValue);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
    }, []);

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (value.trim()) {
            onSubmit(value.trim());
        }
    };

    return (
        <div className={styles.promptOverlay} onClick={onClose}>
            <div className={styles.promptContent} onClick={e => e.stopPropagation()}>
                <h3 className={styles.promptTitle}>{title}</h3>
                <form onSubmit={handleFormSubmit} className={styles.promptForm}>
                    <input 
                        ref={inputRef}
                        type="text" 
                        placeholder={placeholder}
                        value={value} 
                        onChange={e => setValue(e.target.value)} 
                        className={styles.promptInput}
                    />
                    <div className={styles.promptActions}>
                        <button type="button" className={styles.promptCancelBtn} onClick={onClose}>Cancelar</button>
                        <button type="submit" className={styles.promptSubmitBtn} disabled={!value.trim()}>Confirmar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TasksView;