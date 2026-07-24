import React, { useState } from 'react';
import { X, Key, Check, Database, Hash, Type, Calendar, Shield, Code2 } from 'lucide-react';
import { PostgresDataType, PostgresColumnSchema, POSTGRES_TYPE_GROUPS } from '../../../shared/postgres-types';

interface SupabaseColumnModalProps {
    isOpen: boolean;
    initialColumn?: PostgresColumnSchema;
    onClose: () => void;
    onSave: (column: PostgresColumnSchema) => void;
}

export const SupabaseColumnModal: React.FC<SupabaseColumnModalProps> = ({
    isOpen,
    initialColumn,
    onClose,
    onSave,
}) => {
    const [name, setName] = useState(initialColumn?.name || '');
    const [type, setType] = useState<PostgresDataType>(initialColumn?.type || 'text');
    const [isPrimaryKey, setIsPrimaryKey] = useState(initialColumn?.isPrimaryKey || false);
    const [isNullable, setIsNullable] = useState(initialColumn?.isNullable ?? true);
    const [defaultValue, setDefaultValue] = useState(initialColumn?.defaultValue || '');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        onSave({
            id: initialColumn?.id || `col_${Date.now()}`,
            name: name.trim(),
            type,
            isPrimaryKey,
            isNullable,
            defaultValue: defaultValue.trim() || undefined,
        });

        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in">
            <div className="w-full max-w-md bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden font-sans text-zinc-200 animate-in zoom-in-95">
                {/* Header */}
                <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-2 font-bold text-sm text-zinc-100">
                        <Database className="w-4 h-4 text-emerald-400" />
                        <span>{initialColumn ? 'Editar Coluna Postgres' : 'Adicionar Nova Coluna (PostgreSQL)'}</span>
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 cursor-pointer">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4 text-xs">
                    {/* Name */}
                    <div>
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                            Nome da Coluna (Name)
                        </label>
                        <input
                            type="text"
                            placeholder="ex: created_at, phone, user_id"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-400 transition-colors font-mono"
                            autoFocus
                            required
                        />
                    </div>

                    {/* Postgres Data Type Dropdown */}
                    <div>
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                            Postgres Data Type
                        </label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value as PostgresDataType)}
                            className="w-full bg-[#202024] border border-white/10 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-400 font-mono text-xs cursor-pointer"
                        >
                            {Object.entries(POSTGRES_TYPE_GROUPS).map(([groupKey, group]) => (
                                <optgroup key={groupKey} label={group.label}>
                                    {group.types.map((t) => (
                                        <option key={t} value={t}>
                                            {t}
                                        </option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </div>

                    {/* Checkboxes & Switches */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                        <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] cursor-pointer transition-colors">
                            <input
                                type="checkbox"
                                checked={isPrimaryKey}
                                onChange={(e) => setIsPrimaryKey(e.target.checked)}
                                className="accent-emerald-500 w-4 h-4 rounded"
                            />
                            <div className="flex items-center gap-1.5">
                                <Key className="w-3.5 h-3.5 text-amber-400" />
                                <span className="font-semibold text-zinc-200">Primary Key</span>
                            </div>
                        </label>

                        <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] cursor-pointer transition-colors">
                            <input
                                type="checkbox"
                                checked={isNullable}
                                onChange={(e) => setIsNullable(e.target.checked)}
                                className="accent-emerald-500 w-4 h-4 rounded"
                            />
                            <span className="font-semibold text-zinc-200">Allow NULL</span>
                        </label>
                    </div>

                    {/* Default Value */}
                    <div>
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                            Valor Padrão (Default Value)
                        </label>
                        <input
                            type="text"
                            placeholder="ex: now(), NULL, 0, 'exemplo'"
                            value={defaultValue}
                            onChange={(e) => setDefaultValue(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-400 font-mono text-xs"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 font-semibold transition-colors cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold shadow transition-all active:scale-95 cursor-pointer"
                        >
                            Salvar Coluna
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
