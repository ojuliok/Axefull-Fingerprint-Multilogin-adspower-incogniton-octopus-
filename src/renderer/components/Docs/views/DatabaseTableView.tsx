import React from 'react';
import { Plus, Trash2, Key, ExternalLink } from 'lucide-react';
import { PostgresColumnSchema, PostgresRowData, ViewSettingsConfig } from '../../../../shared/postgres-types';
import { PropertyCellRenderer } from '../PropertyCellRenderer';

interface DatabaseTableViewProps {
    columns: PostgresColumnSchema[];
    rows: PostgresRowData[];
    config: ViewSettingsConfig;
    onUpdateRowValue: (rowId: string, colId: string, value: any) => void;
    onDeleteRow: (rowId: string) => void;
    onAddRow: () => void;
    onQuickAddProperty: (e: React.MouseEvent) => void;
    onOpenPropertyTypeMenu: (e: React.MouseEvent, col: PostgresColumnSchema) => void;
    onColumnContextMenu: (e: React.MouseEvent, colId: string) => void;
    onRowClick: (row: PostgresRowData) => void;
}

export const DatabaseTableView: React.FC<DatabaseTableViewProps> = ({
    columns,
    rows,
    config,
    onUpdateRowValue,
    onDeleteRow,
    onAddRow,
    onQuickAddProperty,
    onOpenPropertyTypeMenu,
    onColumnContextMenu,
    onRowClick,
}) => {
    const visibleColumns = columns.filter(c => !c.hidden);

    return (
        <div className="overflow-x-auto db-table-scroll">
            <table className={`w-full text-left text-xs border-collapse font-sans ${config.showVerticalLines ? 'divide-x divide-white/10' : ''}`}>
                <thead>
                    <tr className="border-b border-white/10 bg-white/[0.02] text-zinc-400 uppercase text-[10px] tracking-wider font-semibold">
                        {visibleColumns.map((col) => (
                            <th
                                key={col.id}
                                onContextMenu={(e) => onColumnContextMenu(e, col.id)}
                                className={`py-2.5 px-4 hover:bg-white/5 transition-colors cursor-pointer ${config.showVerticalLines ? 'border-r border-white/10' : ''}`}
                            >
                                <div className="flex items-center gap-2">
                                    {col.isPrimaryKey && <Key className="w-3 h-3 text-amber-400 shrink-0" />}
                                    <span className="font-bold text-zinc-200 lowercase font-mono">{col.name}</span>

                                    <button
                                        type="button"
                                        onClick={(e) => onOpenPropertyTypeMenu(e, col)}
                                        className="text-[10px] font-mono text-zinc-400 hover:text-emerald-300 bg-white/5 hover:bg-emerald-500/10 px-1.5 py-0.5 rounded border border-white/10 lowercase transition-colors cursor-pointer"
                                    >
                                        {col.type}
                                    </button>
                                </div>
                            </th>
                        ))}

                        {/* Quick + Button Column Header */}
                        <th className="py-2.5 px-3 w-10 text-center">
                            <button
                                type="button"
                                onClick={onQuickAddProperty}
                                className="p-1 text-zinc-400 hover:text-emerald-400 hover:bg-white/10 rounded-md transition-colors cursor-pointer"
                                title="Adicionar Nova Propriedade (+)"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </th>

                        <th className="py-2.5 px-4 text-right">Ação</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-zinc-300">
                    {rows.slice(0, config.loadLimit).map((row, idx) => (
                        <tr key={row.id} className="hover:bg-white/[0.02] transition-colors group font-mono">
                            {visibleColumns.map((col, colIdx) => (
                                <td key={col.id} className={`py-2 px-4 ${config.showVerticalLines ? 'border-r border-white/10' : ''}`}>
                                    {colIdx === 0 ? (
                                        <div className="flex items-center justify-between gap-2 group/cell">
                                            <PropertyCellRenderer
                                                column={col}
                                                value={row[col.id]}
                                                onChange={(val) => onUpdateRowValue(row.id, col.id, val)}
                                                wrapContent={config.wrapAllContent}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => onRowClick(row)}
                                                className="opacity-0 group-hover/cell:opacity-100 px-1.5 py-0.5 text-[10px] font-sans bg-white/10 hover:bg-emerald-500/20 hover:text-emerald-300 text-zinc-300 rounded transition-all cursor-pointer shrink-0 flex items-center gap-1"
                                                title="Abrir página do registro (Side Peek)"
                                            >
                                                <span>Abrir</span>
                                                <ExternalLink className="w-2.5 h-2.5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <PropertyCellRenderer
                                            column={col}
                                            value={row[col.id]}
                                            onChange={(val) => onUpdateRowValue(row.id, col.id, val)}
                                            wrapContent={config.wrapAllContent}
                                        />
                                    )}
                                </td>
                            ))}
                            <td className="py-2 px-3"></td>
                            <td className="py-2 px-4 text-right">
                                <button
                                    onClick={() => onDeleteRow(row.id)}
                                    className="p-1 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                    title="Excluir linha"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <button
                onClick={onAddRow}
                className="w-full py-2.5 border-t border-white/5 hover:bg-white/[0.02] text-zinc-400 hover:text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
                <Plus className="w-3.5 h-3.5" /> Insert row
            </button>
        </div>
    );
};
