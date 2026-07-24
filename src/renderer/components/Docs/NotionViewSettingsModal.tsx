import React, { useState, useEffect, useRef } from 'react';
import { 
    X, ArrowLeft, Table, Kanban, Clock, Calendar, LayoutList, LayoutGrid, 
    PieChart, Rss, MapPin, Eye, EyeOff, Filter, ArrowUpDown, Layers, 
    Palette, Link, Search, Check, GripVertical 
} from 'lucide-react';
import { PostgresColumnSchema, ViewSettingsConfig } from '../../../shared/postgres-types';
import { VIEW_TYPE_OPTIONS } from './NotionAddViewMenu';

interface NotionViewSettingsModalProps {
    isOpen: boolean;
    position: { x: number; y: number } | null;
    currentViewName: string;
    columns: PostgresColumnSchema[];
    config: ViewSettingsConfig;
    onClose: () => void;
    onUpdateConfig: (newConfig: ViewSettingsConfig) => void;
    onUpdateViewName: (name: string) => void;
    onToggleColumnVisibility: (colId: string) => void;
    onHideAllColumns: () => void;
}

export const NotionViewSettingsModal: React.FC<NotionViewSettingsModalProps> = ({
    isOpen,
    position,
    currentViewName,
    columns,
    config,
    onClose,
    onUpdateConfig,
    onUpdateViewName,
    onToggleColumnVisibility,
    onHideAllColumns,
}) => {
    const [activeSubpanel, setActiveSubpanel] = useState<'main' | 'layout' | 'properties'>('main');
    const [searchPropertyQuery, setSearchPropertyQuery] = useState('');
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
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

    const adjustedX = Math.min(position.x, window.innerWidth - 340);
    const adjustedY = Math.min(position.y, window.innerHeight - 440);

    const visibleCount = columns.filter(c => !c.hidden).length;
    const filteredColumns = columns.filter(c => c.name.toLowerCase().includes(searchPropertyQuery.toLowerCase()));

    return (
        <div
            ref={modalRef}
            style={{ top: `${adjustedY}px`, left: `${adjustedX}px` }}
            className="fixed z-50 w-80 bg-[#1c1c20] border border-white/10 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden font-sans select-none animate-in fade-in zoom-in-95 text-xs text-zinc-200"
        >
            {/* SUBPANEL 1: MAIN MENU (Matching Image 2) */}
            {activeSubpanel === 'main' && (
                <div>
                    {/* Header */}
                    <div className="p-3 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                        <span className="font-bold text-xs text-zinc-200">View settings</span>
                        <button
                            onClick={onClose}
                            className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>

                    {/* View Name Input Header matching Image 2 */}
                    <div className="p-3 border-b border-white/10 flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                            <Table className="w-4 h-4 text-emerald-400" />
                        </div>
                        <input
                            type="text"
                            value={currentViewName}
                            onChange={(e) => onUpdateViewName(e.target.value)}
                            placeholder="View name..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-400 font-medium"
                        />
                    </div>

                    {/* Main Menu Options matching Image 2 */}
                    <div className="p-1 space-y-0.5">
                        <button
                            type="button"
                            onClick={() => setActiveSubpanel('layout')}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-white/10 transition-colors text-zinc-300 cursor-pointer"
                        >
                            <div className="flex items-center gap-2.5">
                                <Table className="w-4 h-4 text-zinc-400" />
                                <span>Layout</span>
                            </div>
                            <span className="text-zinc-500 capitalize">{config.layout} ›</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveSubpanel('properties')}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-white/10 transition-colors text-zinc-300 cursor-pointer"
                        >
                            <div className="flex items-center gap-2.5">
                                <Eye className="w-4 h-4 text-zinc-400" />
                                <span>Property visibility</span>
                            </div>
                            <span className="text-zinc-500">{visibleCount} ›</span>
                        </button>

                        <button
                            type="button"
                            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-white/10 transition-colors text-zinc-300 cursor-pointer"
                        >
                            <div className="flex items-center gap-2.5">
                                <Filter className="w-4 h-4 text-zinc-400" />
                                <span>Filter</span>
                            </div>
                            <span className="text-zinc-500">›</span>
                        </button>

                        <button
                            type="button"
                            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-white/10 transition-colors text-zinc-300 cursor-pointer"
                        >
                            <div className="flex items-center gap-2.5">
                                <ArrowUpDown className="w-4 h-4 text-zinc-400" />
                                <span>Sort</span>
                            </div>
                            <span className="text-zinc-500">›</span>
                        </button>

                        <button
                            type="button"
                            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-white/10 transition-colors text-zinc-300 cursor-pointer"
                        >
                            <div className="flex items-center gap-2.5">
                                <Layers className="w-4 h-4 text-zinc-400" />
                                <span>Group</span>
                            </div>
                            <span className="text-zinc-500">›</span>
                        </button>

                        <button
                            type="button"
                            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-white/10 transition-colors text-zinc-300 cursor-pointer"
                        >
                            <div className="flex items-center gap-2.5">
                                <Palette className="w-4 h-4 text-zinc-400" />
                                <span>Conditional color</span>
                            </div>
                            <span className="text-zinc-500">›</span>
                        </button>

                        <div className="my-1 border-t border-white/10" />

                        <button
                            type="button"
                            onClick={() => {
                                navigator.clipboard.writeText(window.location.href);
                                onClose();
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-white/10 transition-colors text-zinc-300 cursor-pointer"
                        >
                            <Link className="w-4 h-4 text-zinc-400" />
                            <span>Copy link to view</span>
                        </button>
                    </div>
                </div>
            )}

            {/* SUBPANEL 2: LAYOUT (Matching Image 3) */}
            {activeSubpanel === 'layout' && (
                <div>
                    {/* Header with Back Arrow */}
                    <div className="p-3 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                        <button
                            onClick={() => setActiveSubpanel('main')}
                            className="flex items-center gap-2 text-zinc-400 hover:text-white font-bold transition-colors cursor-pointer"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Layout</span>
                        </button>
                        <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 cursor-pointer">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* View Modes Grid matching Image 3 */}
                    <div className="p-3 grid grid-cols-3 gap-2 border-b border-white/10 max-h-56 overflow-y-auto scrollbar-thin">
                        {VIEW_TYPE_OPTIONS.slice(0, 9).map((opt) => (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() => onUpdateConfig({ ...config, layout: opt.id })}
                                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center cursor-pointer ${
                                    config.layout === opt.id
                                        ? 'bg-blue-500/20 border-blue-400 text-blue-300 font-bold'
                                        : 'bg-white/[0.02] border-white/5 hover:bg-white/10 text-zinc-400 hover:text-white'
                                }`}
                            >
                                <div>{opt.icon}</div>
                                <span className="text-[10px]">{opt.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Toggles matching Image 3 */}
                    <div className="p-3 space-y-3">
                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-zinc-300 text-xs font-medium">Show data source title</span>
                            <input
                                type="checkbox"
                                checked={config.showDataSourceTitle}
                                onChange={(e) => onUpdateConfig({ ...config, showDataSourceTitle: e.target.checked })}
                                className="accent-blue-500 w-4 h-4 rounded"
                            />
                        </label>

                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-zinc-300 text-xs font-medium">Show vertical lines</span>
                            <input
                                type="checkbox"
                                checked={config.showVerticalLines}
                                onChange={(e) => onUpdateConfig({ ...config, showVerticalLines: e.target.checked })}
                                className="accent-blue-500 w-4 h-4 rounded"
                            />
                        </label>

                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-zinc-300 text-xs font-medium">Show page icon</span>
                            <input
                                type="checkbox"
                                checked={config.showPageIcon}
                                onChange={(e) => onUpdateConfig({ ...config, showPageIcon: e.target.checked })}
                                className="accent-blue-500 w-4 h-4 rounded"
                            />
                        </label>

                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-zinc-300 text-xs font-medium">Wrap all content</span>
                            <input
                                type="checkbox"
                                checked={config.wrapAllContent}
                                onChange={(e) => onUpdateConfig({ ...config, wrapAllContent: e.target.checked })}
                                className="accent-blue-500 w-4 h-4 rounded"
                            />
                        </label>

                        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-zinc-400">
                            <span>Open pages in</span>
                            <span className="text-zinc-200 capitalize font-medium">{config.openPagesIn.replace('_', ' ')} ›</span>
                        </div>

                        <div className="flex items-center justify-between text-zinc-400">
                            <span>Load limit</span>
                            <span className="text-zinc-200 font-mono font-medium">{config.loadLimit} ›</span>
                        </div>
                    </div>
                </div>
            )}

            {/* SUBPANEL 3: PROPERTY VISIBILITY (Matching Image 4) */}
            {activeSubpanel === 'properties' && (
                <div>
                    {/* Header with Back Arrow */}
                    <div className="p-3 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                        <button
                            onClick={() => setActiveSubpanel('main')}
                            className="flex items-center gap-2 text-zinc-400 hover:text-white font-bold transition-colors cursor-pointer"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Property visibility</span>
                        </button>
                        <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 cursor-pointer">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Search property input matching Image 4 */}
                    <div className="p-3 border-b border-white/10">
                        <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-blue-400/60 shadow-sm">
                            <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                            <input
                                type="text"
                                placeholder="Search for a property..."
                                value={searchPropertyQuery}
                                onChange={(e) => setSearchPropertyQuery(e.target.value)}
                                className="w-full bg-transparent text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Header line matching Image 4 */}
                    <div className="px-3.5 py-2 flex items-center justify-between border-b border-white/5 bg-white/[0.01]">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Shown in table</span>
                        <button
                            type="button"
                            onClick={onHideAllColumns}
                            className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                        >
                            Hide all
                        </button>
                    </div>

                    {/* Columns List with Eye Icons matching Image 4 */}
                    <div className="p-1 max-h-60 overflow-y-auto scrollbar-thin space-y-0.5">
                        {filteredColumns.map((col) => (
                            <div
                                key={col.id}
                                className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer"
                                onClick={() => onToggleColumnVisibility(col.id)}
                            >
                                <div className="flex items-center gap-2.5 text-zinc-300">
                                    <GripVertical className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400" />
                                    <span className="font-semibold text-xs lowercase font-mono">{col.name}</span>
                                    <span className="text-[10px] text-zinc-500 font-mono lowercase">({col.type})</span>
                                </div>
                                <button type="button" className="text-zinc-400 hover:text-white transition-colors">
                                    {col.hidden ? <EyeOff className="w-4 h-4 text-zinc-600" /> : <Eye className="w-4 h-4 text-blue-400" />}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
