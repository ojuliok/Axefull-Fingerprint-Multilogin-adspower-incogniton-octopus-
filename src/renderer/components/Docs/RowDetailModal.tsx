import React, { useState } from 'react';
import { 
    X, ChevronRight, ChevronsRight, Share2, Star, MoreHorizontal, Plus, 
    MessageSquare, Clock, User, Tag, Calendar, Hash, Type, CheckSquare, 
    Globe, Mail, Phone, Code, Sparkles
} from 'lucide-react';
import { PostgresColumnSchema, PostgresRowData } from '../../../shared/postgres-types';
import { NotionPropertyMenu } from './NotionPropertyMenu';

interface RowDetailModalProps {
    isOpen: boolean;
    row: PostgresRowData | null;
    columns: PostgresColumnSchema[];
    onClose: () => void;
    onUpdateRow: (rowId: string, updatedData: PostgresRowData) => void;
    onAddProperty?: (newCol: PostgresColumnSchema) => void;
}

export const RowDetailModal: React.FC<RowDetailModalProps> = ({
    isOpen,
    row,
    columns,
    onClose,
    onUpdateRow,
    onAddProperty,
}) => {
    if (!isOpen || !row) return null;

    const titleCol = columns[0] || { id: 'col_nomewpp', name: 'Nome', type: 'text' };
    const rowTitle = row[titleCol.id] || row['col_nomewpp'] || row['name'] || `Registro #${row.id}`;

    const [editingTitle, setEditingTitle] = useState<string>(String(rowTitle));
    const [pageContent, setPageContent] = useState<string>(row['page_content'] || '');
    const [commentText, setCommentText] = useState<string>('');

    const handleTitleBlur = () => {
        onUpdateRow(row.id, { ...row, [titleCol.id]: editingTitle });
    };

    const handlePropValueChange = (colId: string, value: any) => {
        onUpdateRow(row.id, { ...row, [colId]: value });
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Side Peek Modal Drawer */}
            <div className="w-full max-w-2xl h-full bg-[#141417] border-l border-white/10 shadow-2xl flex flex-col font-sans text-zinc-100 animate-in slide-in-from-right duration-250">
                {/* Top Navigation Bar */}
                <div className="px-6 py-3 border-b border-white/10 flex items-center justify-between bg-[#18181b]/50">
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <button 
                            onClick={onClose} 
                            className="p-1 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
                            title="Fechar painel (Side Peek)"
                        >
                            <ChevronsRight className="w-4 h-4" />
                        </button>
                        <span className="text-zinc-600">/</span>
                        <span className="font-semibold text-zinc-300 truncate max-w-[200px]">{editingTitle}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                        <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 cursor-pointer transition-colors">
                            <Share2 className="w-3.5 h-3.5 text-blue-400" />
                            <span>Compartilhar</span>
                        </button>
                        <button className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-yellow-400 border border-white/10 cursor-pointer transition-colors">
                            <Star className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 cursor-pointer transition-colors">
                            <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                        <button 
                            onClick={onClose}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Main Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-10 py-8 scrollbar-thin space-y-8">
                    {/* Document Icon & Title Input */}
                    <div className="space-y-4">
                        <div className="text-4xl select-none">📄</div>
                        <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onBlur={handleTitleBlur}
                            placeholder="Sem título"
                            className="w-full bg-transparent text-3xl font-black text-white placeholder-zinc-600 focus:outline-none border-b border-transparent focus:border-emerald-500/50 pb-1 font-sans"
                        />
                    </div>

                    {/* Properties List Section */}
                    <div className="space-y-2 border-y border-white/10 py-5">
                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-3">
                            Propriedades do Registro
                        </div>

                        <div className="space-y-2 text-xs">
                            {columns.map((col) => {
                                const val = row[col.id];
                                return (
                                    <div key={col.id} className="grid grid-cols-3 items-center gap-4 py-1.5 hover:bg-white/[0.02] px-2 rounded-lg transition-colors group">
                                        <div className="flex items-center gap-2 text-zinc-400 font-mono">
                                            <Tag className="w-3.5 h-3.5 text-zinc-500" />
                                            <span className="truncate">{col.name}</span>
                                        </div>

                                        <div className="col-span-2">
                                            <input
                                                type="text"
                                                value={val !== undefined ? (typeof val === 'object' ? JSON.stringify(val) : String(val)) : ''}
                                                onChange={(e) => handlePropValueChange(col.id, e.target.value)}
                                                placeholder="Vazio"
                                                className="w-full bg-transparent focus:bg-white/5 px-2 py-1 rounded-md text-zinc-200 focus:outline-none focus:border-emerald-500/40 border border-transparent font-mono text-xs transition-colors"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Add Property Button */}
                        <div className="pt-2">
                            <button
                                onClick={() => {
                                    if (onAddProperty) {
                                        onAddProperty({
                                            id: `col_${Date.now()}`,
                                            name: `nova_propriedade`,
                                            type: 'text',
                                        });
                                    }
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-emerald-300 hover:bg-white/5 rounded-lg border border-dashed border-white/10 transition-colors cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>+ Add a property</span>
                            </button>
                        </div>
                    </div>

                    {/* Comments Section */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-zinc-400">
                            <MessageSquare className="w-4 h-4 text-amber-400" />
                            <span>Comentários</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-bold text-xs">
                                JC
                            </div>
                            <input
                                type="text"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="Adicionar um comentário..."
                                className="flex-1 bg-white/5 border border-white/10 focus:border-emerald-500/40 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none transition-colors"
                            />
                        </div>
                    </div>

                    {/* Page Body Notes Area */}
                    <div className="space-y-3 pt-4 border-t border-white/10">
                        <textarea
                            value={pageContent}
                            onChange={(e) => {
                                setPageContent(e.target.value);
                                handlePropValueChange('page_content', e.target.value);
                            }}
                            placeholder="Pressione 'Enter' para continuar com uma página vazia ou digite anotações detalhadas..."
                            rows={8}
                            className="w-full bg-transparent text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none resize-none leading-relaxed"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
