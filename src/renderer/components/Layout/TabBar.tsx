import React from 'react';
import { FileText, X, Pin, Plus } from 'lucide-react';
import { useTabs, DocTab } from '../../context/TabContext';

interface TabBarProps {
    onNewDoc?: () => void;
}

export const TabBar: React.FC<TabBarProps> = ({ onNewDoc }) => {
    const { tabs, activeTabId, setActiveTabId, closeTab, togglePinTab } = useTabs();

    if (!tabs || tabs.length === 0) {
        return null;
    }

    return (
        <div className="flex items-center gap-1 bg-[#121318] border-b border-white/10 px-3 pt-2 overflow-x-auto scrollbar-none select-none">
            {tabs.map((tab: DocTab) => {
                const isActive = tab.id === activeTabId;

                return (
                    <div
                        key={tab.id}
                        onClick={() => setActiveTabId(tab.id)}
                        className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-t-xl text-xs font-medium cursor-pointer transition-all duration-150 border-t border-x ${
                            isActive
                                ? 'bg-[#0b0c10] text-amber-300 border-white/10 border-b-[#0b0c10] z-10 font-semibold shadow-sm'
                                : 'bg-white/[0.02] text-zinc-400 border-transparent hover:bg-white/[0.06] hover:text-zinc-200'
                        }`}
                    >
                        {/* Tab Icon */}
                        <span className="shrink-0 text-sm">
                            {tab.icon ? tab.icon : <FileText className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-zinc-500'}`} />}
                        </span>

                        {/* Tab Title */}
                        <span className="max-w-[120px] truncate">{tab.title || 'Sem título'}</span>

                        {/* Pin / Close Buttons */}
                        <div className="flex items-center gap-0.5 ml-1">
                            {tab.isPinned ? (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        togglePinTab(tab.id);
                                    }}
                                    className="text-amber-400 p-0.5 hover:bg-white/10 rounded"
                                    title="Desafixar Guia"
                                >
                                    <Pin className="w-3 h-3 fill-amber-400" />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        closeTab(tab.id);
                                    }}
                                    className="p-0.5 rounded text-zinc-500 hover:text-zinc-200 hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Fechar Guia"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}

            {onNewDoc && (
                <button
                    type="button"
                    onClick={onNewDoc}
                    className="p-1.5 mb-1 text-zinc-400 hover:text-amber-300 hover:bg-white/5 rounded-lg transition-colors"
                    title="Novo Documento"
                >
                    <Plus className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    );
};
