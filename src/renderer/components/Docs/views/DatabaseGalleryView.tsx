import React from 'react';
import { Plus, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { PostgresColumnSchema, PostgresRowData, ViewSettingsConfig } from '../../../../shared/postgres-types';

interface DatabaseGalleryViewProps {
    columns: PostgresColumnSchema[];
    rows: PostgresRowData[];
    config: ViewSettingsConfig;
    onRowClick: (row: PostgresRowData) => void;
    onAddRow: () => void;
}

const PRESET_GALLERY_IMAGES = [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80',
];

export const DatabaseGalleryView: React.FC<DatabaseGalleryViewProps> = ({
    columns,
    rows,
    config,
    onRowClick,
    onAddRow,
}) => {
    const titleCol = columns[0] || { id: 'col_nomewpp', name: 'Nome' };

    return (
        <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {rows.slice(0, config.loadLimit).map((row, idx) => {
                    const rowTitle = row[titleCol.id] || row['col_nomewpp'] || row['phone'] || `Item #${row.id}`;
                    const imgUrl = PRESET_GALLERY_IMAGES[idx % PRESET_GALLERY_IMAGES.length];

                    return (
                        <div
                            key={row.id}
                            onClick={() => onRowClick(row)}
                            className="bg-[#18181b] border border-white/10 hover:border-emerald-500/40 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-200 cursor-pointer group flex flex-col"
                        >
                            {/* Card Banner Image */}
                            <div className="h-32 w-full relative overflow-hidden bg-black/40">
                                <img
                                    src={imgUrl}
                                    alt={String(rowTitle)}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#18181b] via-transparent to-transparent" />
                            </div>

                            {/* Card Content */}
                            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                                <div>
                                    <div className="text-sm font-bold text-zinc-100 group-hover:text-emerald-300 transition-colors">
                                        {String(rowTitle)}
                                    </div>

                                    {/* Preview Properties */}
                                    <div className="mt-2 space-y-1 text-xs font-mono text-zinc-400">
                                        {columns.slice(1, 3).map((col) => (
                                            <div key={col.id} className="flex items-center justify-between text-zinc-500 text-[11px]">
                                                <span className="text-zinc-600 lowercase">{col.name}:</span>
                                                <span className="truncate max-w-[130px] text-zinc-300">{String(row[col.id] || '-')}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center justify-end text-[11px] font-semibold text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                                    <span>Abrir registro</span>
                                    <ExternalLink className="w-3 h-3" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <button
                onClick={onAddRow}
                className="w-full py-3 border border-dashed border-white/10 hover:border-emerald-500/40 rounded-2xl text-xs text-zinc-400 hover:text-emerald-300 font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
                <Plus className="w-4 h-4" />
                <span>Adicionar Nova Página (Galeria)</span>
            </button>
        </div>
    );
};
