import React from 'react';
import { Plus, FileText, ChevronRight, ExternalLink } from 'lucide-react';
import { PostgresColumnSchema, PostgresRowData, ViewSettingsConfig } from '../../../../shared/postgres-types';

interface DatabaseListViewProps {
    columns: PostgresColumnSchema[];
    rows: PostgresRowData[];
    config: ViewSettingsConfig;
    onRowClick: (row: PostgresRowData) => void;
    onAddRow: () => void;
}

export const DatabaseListView: React.FC<DatabaseListViewProps> = ({
    columns,
    rows,
    config,
    onRowClick,
    onAddRow,
}) => {
    const titleCol = columns[0] || { id: 'col_nomewpp', name: 'Nome' };

    return (
        <div className="p-4 space-y-1">
            <div className="divide-y divide-white/5 border border-white/10 rounded-2xl overflow-hidden bg-[#141417]">
                {rows.slice(0, config.loadLimit).map((row) => {
                    const rowTitle = row[titleCol.id] || row['col_nomewpp'] || row['phone'] || `Item #${row.id}`;

                    return (
                        <div
                            key={row.id}
                            onClick={() => onRowClick(row)}
                            className="px-5 py-3 flex items-center justify-between hover:bg-white/[0.03] transition-colors cursor-pointer group"
                        >
                            {/* Left: Icon & Title */}
                            <div className="flex items-center gap-3">
                                <FileText className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
                                <span className="text-xs font-bold text-zinc-100 group-hover:text-emerald-300 font-mono transition-colors">
                                    {String(rowTitle)}
                                </span>
                            </div>

                            {/* Right: Key Properties Summary */}
                            <div className="flex items-center gap-6 text-xs font-mono text-zinc-400">
                                {columns.slice(1, 4).map((col) => (
                                    <div key={col.id} className="hidden sm:flex items-center gap-1.5 text-[11px]">
                                        <span className="text-zinc-600 lowercase">{col.name}:</span>
                                        <span className="text-zinc-300 truncate max-w-[140px]">
                                            {String(row[col.id] || '-')}
                                        </span>
                                    </div>
                                ))}

                                <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all" />
                            </div>
                        </div>
                    );
                })}
            </div>

            <button
                onClick={onAddRow}
                className="w-full py-2.5 mt-2 border border-dashed border-white/10 hover:border-emerald-500/40 rounded-xl text-xs text-zinc-400 hover:text-emerald-300 font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Nova página em lista</span>
            </button>
        </div>
    );
};
