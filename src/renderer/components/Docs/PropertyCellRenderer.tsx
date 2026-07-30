import React from 'react';
import { PostgresColumnSchema } from '../../../shared/postgres-types';
import { Check, Calendar, ExternalLink, Mail, Phone, Tag } from 'lucide-react';

interface PropertyCellRendererProps {
    column: PostgresColumnSchema;
    value: any;
    onChange: (newValue: any) => void;
    wrapContent?: boolean;
}

export const PropertyCellRenderer: React.FC<PropertyCellRendererProps> = ({
    column,
    value,
    onChange,
    wrapContent = false,
}) => {
    const colType = column.type || 'text';

    // Checkbox Type
    if (colType === 'bool') {
        const isChecked = Boolean(value);
        return (
            <div className="flex items-center justify-center py-1">
                <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => onChange(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
            </div>
        );
    }

    // Status / Select Type (Render as colored pill)
    if (column.name.toLowerCase().includes('status') || column.name.toLowerCase().includes('tag')) {
        const strVal = String(value || 'Sem status');
        let bgClass = 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30';
        if (strVal.toLowerCase().includes('done') || strVal.toLowerCase().includes('conclu') || strVal.toLowerCase().includes('read')) {
            bgClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
        } else if (strVal.toLowerCase().includes('progress') || strVal.toLowerCase().includes('andamento') || strVal.toLowerCase().includes('delivered')) {
            bgClass = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
        } else if (strVal.toLowerCase().includes('todo') || strVal.toLowerCase().includes('pendente')) {
            bgClass = 'bg-purple-500/20 text-purple-300 border-purple-500/30';
        }

        return (
            <div className="flex items-center gap-1">
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${bgClass} truncate inline-block max-w-full`}>
                    {strVal}
                </span>
            </div>
        );
    }

    // Date / Timestamp Type
    if (colType === 'date' || colType === 'time' || colType === 'timestamp' || colType === 'timestamptz') {
        const displayDate = value ? String(value) : '';
        return (
            <div className="flex items-center gap-1.5 font-mono text-xs text-zinc-300">
                <Calendar className="w-3 h-3 text-zinc-500 shrink-0" />
                <input
                    type="text"
                    value={displayDate}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full bg-transparent focus:outline-none focus:bg-white/5 px-1 py-0.5 rounded text-zinc-200"
                />
            </div>
        );
    }

    // Default Text / Json / Number Input
    const formattedVal = value !== undefined ? (typeof value === 'object' ? JSON.stringify(value) : String(value)) : '';

    return (
        <input
            type="text"
            value={formattedVal}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full bg-transparent focus:outline-none focus:bg-white/5 px-1 py-0.5 rounded text-zinc-200 text-xs font-mono transition-colors ${
                wrapContent ? 'whitespace-normal' : 'truncate'
            }`}
        />
    );
};
