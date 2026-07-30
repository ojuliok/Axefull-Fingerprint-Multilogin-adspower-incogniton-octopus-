import React from 'react';
import { Plus, MoreHorizontal, FileText, ChevronRight } from 'lucide-react';
import { PostgresColumnSchema, PostgresRowData, ViewSettingsConfig } from '../../../../shared/postgres-types';

interface DatabaseBoardViewProps {
    columns: PostgresColumnSchema[];
    rows: PostgresRowData[];
    config: ViewSettingsConfig;
    onRowClick: (row: PostgresRowData) => void;
    onAddRow: () => void;
}

const DEFAULT_BOARD_COLUMNS = [
    { id: 'todo', title: 'A Fazer', color: 'border-purple-500/40 bg-purple-500/10 text-purple-300' },
    { id: 'in_progress', title: 'Em Progresso', color: 'border-amber-500/40 bg-amber-500/10 text-amber-300' },
    { id: 'done', title: 'Concluído', color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' },
];

export const DatabaseBoardView: React.FC<DatabaseBoardViewProps> = ({
    columns,
    rows,
    config,
    onRowClick,
    onAddRow,
}) => {
    const titleCol = columns[0] || { id: 'col_nomewpp', name: 'Nome' };

    // Divide rows into board columns based on status or index
    const getColumnRows = (colId: string, idx: number) => {
        return rows.filter((r, rIdx) => {
            const statusStr = String(r['status'] || r['bot_message'] || '').toLowerCase();
            if (colId === 'done') return statusStr.includes('done') || statusStr.includes('read') || rIdx % 3 === 2;
            if (colId === 'in_progress') return statusStr.includes('progress') || statusStr.includes('delivered') || rIdx % 3 === 1;
            return statusStr.includes('todo') || rIdx % 3 === 0;
        });
    };

    return (
        <div className="p-6 overflow-x-auto scrollbar-thin">
            <div className="flex gap-4 min-w-max">
                {DEFAULT_BOARD_COLUMNS.map((col, colIdx) => {
                    const colRows = getColumnRows(col.id, colIdx);
                    return (
                        <div key={col.id} className="w-72 bg-[#18181b]/60 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
                            {/* Column Header */}
                            <div className="flex items-center justify-between pb-2 border-b border-white/10">
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded-lg text-xs font-bold border ${col.color}`}>
                                        {col.title}
                                    </span>
                                    <span className="text-xs font-mono text-zinc-500 font-bold">{colRows.length}</span>
                                </div>
                                <button className="text-zinc-500 hover:text-zinc-300 p-1 rounded hover:bg-white/5">
                                    <MoreHorizontal className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {/* Cards Stack */}
                            <div className="flex-1 space-y-3 min-h-[150px]">
                                {colRows.map((row) => {
                                    const rowTitle = row[titleCol.id] || row['col_nomewpp'] || row['phone'] || `Item #${row.id}`;
                                    return (
                                        <div
                                            key={row.id}
                                            onClick={() => onRowClick(row)}
                                            className="p-3.5 bg-[#202024] hover:bg-[#27272a] border border-white/10 hover:border-emerald-500/40 rounded-xl shadow-md transition-all duration-150 cursor-pointer group space-y-2"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="text-xs font-bold text-zinc-100 group-hover:text-emerald-300 transition-colors line-clamp-2">
                                                    {String(rowTitle)}
                                                </div>
                                            </div>

                                            {/* Preview Secondary Columns */}
                                            <div className="space-y-1 pt-1 border-t border-white/5 text-[11px] font-mono text-zinc-400">
                                                {columns.slice(1, 3).map((c) => (
                                                    <div key={c.id} className="flex items-center justify-between text-zinc-500">
                                                        <span className="text-[10px] text-zinc-600 lowercase">{c.name}:</span>
                                                        <span className="truncate max-w-[120px] text-zinc-300">{String(row[c.id] || '-')}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Add Card Button Footer */}
                            <button
                                onClick={onAddRow}
                                className="w-full py-2 border border-dashed border-white/10 hover:border-emerald-500/40 rounded-xl text-xs text-zinc-400 hover:text-emerald-300 font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Nova página</span>
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
