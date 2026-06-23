import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TaskData } from '../components/Tasks/tasksStorage';

export type PomodoroMode = 'work' | 'short' | 'long';

interface PomodoroContextData {
    pomodoroMode: PomodoroMode;
    pomodoroSeconds: number;
    isPomodoroRunning: boolean;
    activeTask: TaskData | null;
    isFloating: boolean;
    setPomodoroMode: (mode: PomodoroMode) => void;
    setPomodoroSeconds: (seconds: number) => void;
    setIsPomodoroRunning: (running: boolean) => void;
    setActiveTask: (task: TaskData | null) => void;
    setIsFloating: (floating: boolean) => void;
    handleModeChange: (mode: PomodoroMode) => void;
    getSecondsForMode: (mode: PomodoroMode) => number;
    formatPomodoroTime: (seconds: number) => string;
}

const PomodoroContext = createContext<PomodoroContextData | undefined>(undefined);

export const PomodoroProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [pomodoroMode, setPomodoroMode] = useState<PomodoroMode>('work');
    const [pomodoroSeconds, setPomodoroSeconds] = useState(25 * 60);
    const [isPomodoroRunning, setIsPomodoroRunning] = useState(false);
    const [activeTask, setActiveTask] = useState<TaskData | null>(null);
    const [isFloating, setIsFloating] = useState(false);

    const getSecondsForMode = (mode: PomodoroMode) => {
        if (mode === 'work') return 25 * 60;
        if (mode === 'short') return 5 * 60;
        return 15 * 60;
    };

    const handleModeChange = (mode: PomodoroMode) => {
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

    return (
        <PomodoroContext.Provider
            value={{
                pomodoroMode,
                pomodoroSeconds,
                isPomodoroRunning,
                activeTask,
                isFloating,
                setPomodoroMode,
                setPomodoroSeconds,
                setIsPomodoroRunning,
                setActiveTask,
                setIsFloating,
                handleModeChange,
                getSecondsForMode,
                formatPomodoroTime
            }}
        >
            {children}
        </PomodoroContext.Provider>
    );
};

export const usePomodoro = () => {
    const context = useContext(PomodoroContext);
    if (context === undefined) {
        throw new Error('usePomodoro must be used within a PomodoroProvider');
    }
    return context;
};
