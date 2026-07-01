import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, X, GripHorizontal, CheckCircle2, Search, Plus } from 'lucide-react';
import { usePomodoro } from '../../context/PomodoroContext';
import { getTasksData, createTask, TaskData } from './Tasks/tasksStorage';

const FloatingPomodoro: React.FC = () => {
    const {
        isFloating,
        setIsFloating,
        pomodoroMode,
        pomodoroSeconds,
        isPomodoroRunning,
        setIsPomodoroRunning,
        activeTask,
        setActiveTask,
        handleModeChange,
        getSecondsForMode,
        formatPomodoroTime,
        setPomodoroSeconds
    } = usePomodoro();

    const [position, setPosition] = useState({ x: window.innerWidth - 320, y: window.innerHeight - 250 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartPos = useRef({ x: 0, y: 0 });
    const initialPos = useRef({ x: 0, y: 0 });
    const [isDragOver, setIsDragOver] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<TaskData[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (searchQuery.trim().length > 0) {
            const allTasks = getTasksData();
            const results = allTasks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()) && t.status !== 'done');
            setSearchResults(results.slice(0, 5));
        } else {
            setSearchResults([]);
        }
    }, [searchQuery]);

    const handleSelectTask = (task: TaskData) => {
        setActiveTask(task);
        setIsPomodoroRunning(true);
        handleModeChange('work');
        setSearchQuery('');
        setIsSearching(false);
    };

    const handleCreateNewTask = () => {
        if (!searchQuery.trim()) return;
        const newTask = createTask(searchQuery.trim());
        setActiveTask(newTask);
        setIsPomodoroRunning(true);
        handleModeChange('work');
        setSearchQuery('');
        setIsSearching(false);
    };

    useEffect(() => {
        const handleResize = () => {
            // Keep within bounds if window resizes
            setPosition(prev => ({
                x: Math.min(prev.x, window.innerWidth - 300),
                y: Math.min(prev.y, window.innerHeight - 200)
            }));
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (!isFloating) return null;

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        setIsDragging(true);
        dragStartPos.current = { x: e.clientX, y: e.clientY };
        initialPos.current = { x: position.x, y: position.y };
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging) return;
        const dx = e.clientX - dragStartPos.current.x;
        const dy = e.clientY - dragStartPos.current.y;
        setPosition({
            x: Math.max(0, Math.min(window.innerWidth - 300, initialPos.current.x + dx)),
            y: Math.max(0, Math.min(window.innerHeight - 200, initialPos.current.y + dy))
        });
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        setIsDragging(false);
        e.currentTarget.releasePointerCapture(e.pointerId);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        try {
            const taskDataStr = e.dataTransfer.getData('application/json');
            if (taskDataStr) {
                const task = JSON.parse(taskDataStr);
                setActiveTask(task);
                setIsPomodoroRunning(true);
                handleModeChange('work');
            }
        } catch (err) {
            console.error('Failed to parse dropped task', err);
        }
    };

    const handleTaskComplete = () => {
        if (activeTask) {
            // Here we would ideally update the task status in the storage/context
            // But for simplicity in the widget, we can dispatch an event or just remove it from Pomodoro
            setActiveTask(null);
            setIsPomodoroRunning(false);
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: '300px',
                backgroundColor: '#18181b', // dark background
                border: `1px solid ${isDragOver ? '#8b5cf6' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '16px',
                boxShadow: isDragOver ? '0 0 15px rgba(139, 92, 246, 0.4)' : '0 10px 25px rgba(0,0,0,0.5)',
                zIndex: 9999,
                color: 'white',
                fontFamily: 'Inter, sans-serif',
                overflow: 'hidden',
                transition: isDragging ? 'none' : 'box-shadow 0.2s ease, border-color 0.2s ease'
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Header (Draggable) */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    cursor: isDragging ? 'grabbing' : 'grab'
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <GripHorizontal size={16} color="#a1a1aa" />
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>Pomodoro</span>
                </div>
                <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => setIsFloating(false)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-tertiary)',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                    <X size={16} />
                </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: '48px', fontWeight: 700, color: '#8b5cf6', letterSpacing: '2px', textShadow: '0 0 20px rgba(139, 92, 246, 0.3)', marginBottom: '16px' }}>
                    {formatPomodoroTime(pomodoroSeconds)}
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                    <button
                        onClick={() => handleModeChange('work')}
                        style={{
                            background: pomodoroMode === 'work' ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                            color: pomodoroMode === 'work' ? '#c084fc' : '#a1a1aa',
                            border: `1px solid ${pomodoroMode === 'work' ? '#8b5cf6' : 'rgba(255,255,255,0.1)'}`,
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        Trabalho
                    </button>
                    <button
                        onClick={() => handleModeChange('short')}
                        style={{
                            background: pomodoroMode === 'short' ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                            color: pomodoroMode === 'short' ? '#c084fc' : '#a1a1aa',
                            border: `1px solid ${pomodoroMode === 'short' ? '#8b5cf6' : 'rgba(255,255,255,0.1)'}`,
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        Curta
                    </button>
                    <button
                        onClick={() => handleModeChange('long')}
                        style={{
                            background: pomodoroMode === 'long' ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                            color: pomodoroMode === 'long' ? '#c084fc' : '#a1a1aa',
                            border: `1px solid ${pomodoroMode === 'long' ? '#8b5cf6' : 'rgba(255,255,255,0.1)'}`,
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        Longa
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                    <button
                        onClick={() => setIsPomodoroRunning(!isPomodoroRunning)}
                        style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            padding: '10px',
                            background: isPomodoroRunning ? 'rgba(239, 68, 68, 0.1)' : '#10b981',
                            color: isPomodoroRunning ? '#ef4444' : '#ffffff',
                            border: `1px solid ${isPomodoroRunning ? '#ef4444' : '#10b981'}`,
                            borderRadius: '8px',
                            fontWeight: 600,
                            fontSize: '14px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        {isPomodoroRunning ? <Pause size={16} /> : <Play size={16} />}
                        {isPomodoroRunning ? 'Pausar' : 'Iniciar'}
                    </button>
                    <button
                        onClick={() => {
                            setIsPomodoroRunning(false);
                            setPomodoroSeconds(getSecondsForMode(pomodoroMode));
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '10px',
                            background: 'transparent',
                            color: 'var(--text-tertiary)',
                            border: '1px solid var(--border-default)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        title="Reiniciar"
                    >
                        <RotateCcw size={16} />
                    </button>
                </div>

                {activeTask ? (
                    <div style={{ 
                        marginTop: '20px', 
                        width: '100%', 
                        padding: '12px', 
                        backgroundColor: 'rgba(139, 92, 246, 0.1)', 
                        border: '1px solid rgba(139, 92, 246, 0.2)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <span style={{ fontSize: '11px', color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Focando em</span>
                            <span style={{ fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeTask.title}</span>
                        </div>
                        <button
                            onClick={handleTaskComplete}
                            title="Desvincular Tarefa"
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#10b981',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex'
                            }}
                        >
                            <CheckCircle2 size={18} />
                        </button>
                    </div>
                ) : (
                    <div style={{ marginTop: '20px', width: '100%', position: 'relative' }}>
                        {isSearching ? (
                            <div style={{ position: 'relative', width: '100%' }}>
                                <div style={{ display: 'flex', alignItems: 'center', background: '#27272a', borderRadius: '8px', padding: '8px 12px' }}>
                                    <Search size={14} color="#a1a1aa" />
                                    <input 
                                        autoFocus
                                        type="text" 
                                        placeholder="Buscar ou criar tarefa..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                if (searchResults.length > 0) {
                                                    handleSelectTask(searchResults[0]);
                                                } else {
                                                    handleCreateNewTask();
                                                }
                                            } else if (e.key === 'Escape') {
                                                setIsSearching(false);
                                                setSearchQuery('');
                                            }
                                        }}
                                        style={{ background: 'transparent', border: 'none', color: 'white', marginLeft: '8px', outline: 'none', width: '100%', fontSize: '13px' }}
                                    />
                                </div>
                                {searchQuery.trim().length > 0 && (
                                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', marginTop: '4px', zIndex: 10, maxHeight: '150px', overflowY: 'auto' }}>
                                        {searchResults.map(t => (
                                            <div 
                                                key={t.id} 
                                                onClick={() => handleSelectTask(t)}
                                                style={{ padding: '8px 12px', fontSize: '12px', cursor: 'pointer', borderBottom: '1px solid #27272a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#27272a'}
                                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                {t.title}
                                            </div>
                                        ))}
                                        <div 
                                            onClick={handleCreateNewTask}
                                            style={{ padding: '8px 12px', fontSize: '12px', cursor: 'pointer', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '6px' }}
                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#27272a'}
                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <Plus size={12} /> Criar "{searchQuery}"
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div 
                                onClick={() => setIsSearching(true)}
                                style={{
                                    padding: '16px',
                                    border: '1px dashed rgba(255,255,255,0.2)',
                                    borderRadius: '8px',
                                    textAlign: 'center',
                                    color: 'var(--text-tertiary)',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                Arraste ou clique para focar numa tarefa
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FloatingPomodoro;
