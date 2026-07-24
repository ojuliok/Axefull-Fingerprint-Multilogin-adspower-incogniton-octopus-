import React, { useEffect, useRef } from 'react';
import { 
    Table, Kanban, LayoutGrid, LayoutList, PieChart, LayoutDashboard, 
    Clock, Rss, MapPin, Calendar, FileText, Plus, X 
} from 'lucide-react';

export interface ViewTypeOption {
    id: 'table' | 'board' | 'gallery' | 'list' | 'chart' | 'dashboard' | 'timeline' | 'feed' | 'map' | 'calendar' | 'form';
    label: string;
    icon: React.ReactNode;
}

export const VIEW_TYPE_OPTIONS: ViewTypeOption[] = [
    { id: 'table', label: 'Table', icon: <Table className="w-5 h-5 text-emerald-400" /> },
    { id: 'board', label: 'Board', icon: <Kanban className="w-5 h-5 text-purple-400" /> },
    { id: 'gallery', label: 'Gallery', icon: <LayoutGrid className="w-5 h-5 text-amber-400" /> },
    { id: 'list', label: 'List', icon: <LayoutList className="w-5 h-5 text-sky-400" /> },
    { id: 'chart', label: 'Chart', icon: <PieChart className="w-5 h-5 text-rose-400" /> },
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5 text-indigo-400" /> },
    { id: 'timeline', label: 'Timeline', icon: <Clock className="w-5 h-5 text-teal-400" /> },
    { id: 'feed', label: 'Feed', icon: <Rss className="w-5 h-5 text-orange-400" /> },
    { id: 'map', label: 'Map', icon: <MapPin className="w-5 h-5 text-red-400" /> },
    { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-5 h-5 text-emerald-400" /> },
    { id: 'form', label: 'Form', icon: <FileText className="w-5 h-5 text-cyan-400" /> },
];

interface NotionAddViewMenuProps {
    isOpen: boolean;
    position: { x: number; y: number } | null;
    onClose: () => void;
    onSelectViewType: (type: ViewTypeOption['id'], label: string) => void;
}

export const NotionAddViewMenu: React.FC<NotionAddViewMenuProps> = ({
    isOpen,
    position,
    onClose,
    onSelectViewType,
}) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen || !position) return null;

    const adjustedX = Math.min(position.x, window.innerWidth - 360);
    const adjustedY = Math.min(position.y, window.innerHeight - 380);

    return (
        <div
            ref={menuRef}
            style={{ top: `${adjustedY}px`, left: `${adjustedX}px` }}
            className="fixed z-50 w-80 bg-[#1c1c20] border border-white/10 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden font-sans select-none animate-in fade-in zoom-in-95 text-xs text-zinc-200"
        >
            {/* Header matching Image 5 */}
            <div className="p-3 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                <span className="font-bold text-xs text-zinc-200">Add a new view</span>
                <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Grid of View Types matching Image 5 */}
            <div className="p-3 grid grid-cols-4 gap-2 border-b border-white/10">
                {VIEW_TYPE_OPTIONS.map((opt) => (
                    <button
                        key={opt.id}
                        type="button"
                        onClick={() => onSelectViewType(opt.id, opt.label)}
                        className="p-2.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/10 hover:border-emerald-500/30 flex flex-col items-center justify-center gap-1.5 transition-all text-center group cursor-pointer"
                    >
                        <div className="group-hover:scale-110 transition-transform">{opt.icon}</div>
                        <span className="text-[10px] font-semibold text-zinc-300 group-hover:text-white">{opt.label}</span>
                    </button>
                ))}
            </div>

            {/* Footer New Data Source matching Image 5 */}
            <div className="p-2 bg-white/[0.01]">
                <button
                    type="button"
                    onClick={() => {
                        onSelectViewType('table', 'Tabela Customizada');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-white/10 transition-colors text-zinc-300 font-semibold cursor-pointer"
                >
                    <Plus className="w-4 h-4 text-emerald-400" />
                    <span>New data source</span>
                </button>
            </div>
        </div>
    );
};
