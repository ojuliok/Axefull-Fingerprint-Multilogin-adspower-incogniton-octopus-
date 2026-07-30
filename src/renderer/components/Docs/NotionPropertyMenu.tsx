import React, { useState, useEffect, useRef } from 'react';
import { 
    AlignLeft, Hash, CircleDot, ListOrdered, Sparkles, Calendar, Users, 
    Paperclip, CheckSquare, Link, Phone, Mail, ArrowUpRight, Search, 
    Calculator, MousePointerClick, FileDigit, MapPin, Clock, User, Smile, X
} from 'lucide-react';
import { PostgresDataType, PostgresColumnSchema } from '../../../shared/postgres-types';

export interface PropertyTypeOption {
    id: string;
    label: string;
    postgresType: PostgresDataType;
    icon: React.ReactNode;
}

export const PROPERTY_TYPE_OPTIONS: PropertyTypeOption[] = [
    { id: 'text', label: 'Text', postgresType: 'text', icon: <AlignLeft className="w-3.5 h-3.5 text-zinc-300" /> },
    { id: 'number', label: 'Number', postgresType: 'int8', icon: <Hash className="w-3.5 h-3.5 text-blue-400" /> },
    { id: 'select', label: 'Select', postgresType: 'text', icon: <CircleDot className="w-3.5 h-3.5 text-purple-400" /> },
    { id: 'multi_select', label: 'Multi-select', postgresType: 'jsonb', icon: <ListOrdered className="w-3.5 h-3.5 text-pink-400" /> },
    { id: 'status', label: 'Status', postgresType: 'varchar', icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'date', label: 'Date', postgresType: 'timestamp', icon: <Calendar className="w-3.5 h-3.5 text-emerald-400" /> },
    { id: 'person', label: 'Person', postgresType: 'text', icon: <Users className="w-3.5 h-3.5 text-indigo-400" /> },
    { id: 'files', label: 'Files & media', postgresType: 'bytea', icon: <Paperclip className="w-3.5 h-3.5 text-sky-400" /> },
    { id: 'checkbox', label: 'Checkbox', postgresType: 'bool', icon: <CheckSquare className="w-3.5 h-3.5 text-emerald-400" /> },
    { id: 'url', label: 'URL', postgresType: 'text', icon: <Link className="w-3.5 h-3.5 text-sky-400" /> },
    { id: 'phone', label: 'Phone', postgresType: 'text', icon: <Phone className="w-3.5 h-3.5 text-teal-400" /> },
    { id: 'email', label: 'Email', postgresType: 'text', icon: <Mail className="w-3.5 h-3.5 text-violet-400" /> },
    { id: 'relation', label: 'Relation', postgresType: 'uuid', icon: <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" /> },
    { id: 'rollup', label: 'Rollup', postgresType: 'jsonb', icon: <Search className="w-3.5 h-3.5 text-amber-300" /> },
    { id: 'formula', label: 'Formula', postgresType: 'text', icon: <Calculator className="w-3.5 h-3.5 text-cyan-400" /> },
    { id: 'button', label: 'Button', postgresType: 'text', icon: <MousePointerClick className="w-3.5 h-3.5 text-zinc-300" /> },
    { id: 'id', label: 'ID', postgresType: 'int8', icon: <FileDigit className="w-3.5 h-3.5 text-blue-400" /> },
    { id: 'place', label: 'Place', postgresType: 'text', icon: <MapPin className="w-3.5 h-3.5 text-red-400" /> },
    { id: 'created_time', label: 'Created time', postgresType: 'timestamptz', icon: <Clock className="w-3.5 h-3.5 text-zinc-400" /> },
    { id: 'last_edited_time', label: 'Last edited time', postgresType: 'timestamptz', icon: <Clock className="w-3.5 h-3.5 text-zinc-400" /> },
    { id: 'created_by', label: 'Created by', postgresType: 'text', icon: <User className="w-3.5 h-3.5 text-zinc-400" /> },
    { id: 'last_edited_by', label: 'Last edited by', postgresType: 'text', icon: <User className="w-3.5 h-3.5 text-zinc-400" /> },
];

interface NotionPropertyMenuProps {
    isOpen: boolean;
    position: { x: number; y: number } | null;
    column?: PostgresColumnSchema;
    onClose: () => void;
    onSaveColumn: (col: PostgresColumnSchema) => void;
}

export const NotionPropertyMenu: React.FC<NotionPropertyMenuProps> = ({
    isOpen,
    position,
    column,
    onClose,
    onSaveColumn,
}) => {
    const [name, setName] = useState(column?.name || 'Nova Propriedade');
    const [selectedType, setSelectedType] = useState<PropertyTypeOption>(() => {
        const found = PROPERTY_TYPE_OPTIONS.find(p => p.postgresType === column?.type);
        return found || PROPERTY_TYPE_OPTIONS[0];
    });
    const [searchQuery, setSearchQuery] = useState('');
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (column) {
            setName(column.name);
            const found = PROPERTY_TYPE_OPTIONS.find(p => p.postgresType === column.type);
            if (found) setSelectedType(found);
        }
    }, [column]);

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

    const filteredOptions = PROPERTY_TYPE_OPTIONS.filter(opt =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opt.postgresType.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelectType = (option: PropertyTypeOption) => {
        setSelectedType(option);
        onSaveColumn({
            id: column?.id || `col_${Date.now()}`,
            name: name.trim() || 'propriedade',
            type: option.postgresType,
        });
        onClose();
    };

    const adjustedX = Math.min(position.x, window.innerWidth - 340);
    const adjustedY = Math.min(position.y, window.innerHeight - 440);

    return (
        <div
            ref={menuRef}
            style={{ top: `${adjustedY}px`, left: `${adjustedX}px` }}
            className="fixed z-50 w-80 bg-[#1c1c20] border border-white/10 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden font-sans select-none animate-in fade-in zoom-in-95 text-xs text-zinc-200"
        >
            {/* Header: Type property name input matching Image 4 & 5 */}
            <div className="p-3 border-b border-white/10 flex items-center gap-2 bg-white/[0.02]">
                <Smile className="w-4 h-4 text-zinc-400 shrink-0" />
                <input
                    type="text"
                    placeholder="Type property name..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => {
                        if (name.trim() && column && name !== column.name) {
                            onSaveColumn({ ...column, name: name.trim() });
                        }
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            if (name.trim() && column && name !== column.name) {
                                onSaveColumn({ ...column, name: name.trim() });
                            }
                            onClose();
                        }
                    }}
                    className="w-full bg-transparent text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none font-medium"
                    autoFocus
                />
            </div>

            {/* Sub-header search & Select type section matching Image 3 & 4 */}
            <div className="px-3.5 py-2 flex items-center justify-between border-b border-white/5 bg-white/[0.01]">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Select type</span>
                <div className="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                    <Search className="w-3 h-3 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Filter..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-20 bg-transparent text-[11px] text-zinc-200 placeholder-zinc-500 focus:outline-none"
                    />
                </div>
            </div>

            {/* Grid of Property Options matching Images 3, 4, 5 */}
            <div className="max-h-72 overflow-y-auto scrollbar-thin p-2 grid grid-cols-2 gap-1">
                {filteredOptions.map((opt) => (
                    <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectType(opt)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all cursor-pointer ${
                            selectedType.id === opt.id
                                ? 'bg-white/15 text-white font-bold border border-white/20'
                                : 'hover:bg-white/5 text-zinc-300'
                        }`}
                    >
                        <div className="shrink-0">{opt.icon}</div>
                        <span className="truncate text-xs">{opt.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};
