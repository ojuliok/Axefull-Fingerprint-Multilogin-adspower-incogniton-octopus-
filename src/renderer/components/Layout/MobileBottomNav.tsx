import React from 'react';
import { Monitor, CheckSquare, Globe } from 'lucide-react';

import { useTheme } from '../../context/ThemeContext';

interface MobileBottomNavProps {
    currentView: string;
    onViewChange: (view: string) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ currentView, onViewChange }) => {
    const { theme } = useTheme();

    const ITEMS = [
        { id: 'navegador', label: 'Navegador', icon: Globe, colorClass: 'text-indigo-500' },
        { id: 'canvas', label: 'Tela', icon: Monitor, colorClass: 'text-amber-500' },
        { id: 'tasks', label: 'Tarefas', icon: CheckSquare, colorClass: 'text-blue-500' }
    ];

    return (
        <div className="md:hidden flex items-center justify-around w-full h-[64px] border-t shrink-0 z-50 pb-safe backdrop-blur-xl bg-theme-surface/80 border-theme-border/50">
            {ITEMS.map(item => {
                const isActive = currentView === item.id;
                const Icon = item.icon;
                return (
                    <button
                        key={item.id}
                        className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${isActive ? 'text-theme-text' : 'text-theme-text-muted hover:text-theme-text'}`}
                        onClick={() => {
                            if (isActive) {
                                // Toggle the sidebar for the current view
                                if (item.id === 'canvas') {
                                    window.dispatchEvent(new CustomEvent('toggle-canvas-sidebar'));
                                } else if (item.id === 'tasks') {
                                    window.dispatchEvent(new CustomEvent('toggle-tasks-sidebar'));
                                }
                                // Can add similar events for other views if needed
                            } else {
                                onViewChange(item.id);
                            }
                        }}
                    >
                        <Icon size={22} className={isActive ? item.colorClass : ''} />
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </button>
                );
            })}
        </div>
    );
};
