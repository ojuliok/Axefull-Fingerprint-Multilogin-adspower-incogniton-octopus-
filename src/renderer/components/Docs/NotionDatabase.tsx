import React, { useState } from 'react';
import { 
    Table, Kanban, LayoutList, Calendar, Plus, MoreHorizontal, Trash2, Edit3, 
    CheckCircle2, Clock, AlertCircle, User, Tag, ChevronDown, Filter, Hash,
    CheckSquare, Link, Percent, ArrowLeft, ArrowRight, EyeOff, Copy, Type as TypeIcon,
    Database, Key, Shield, ArrowUpDown, Download, Upload, FileSpreadsheet,
    SlidersHorizontal, Maximize2, Minimize2, Settings
} from 'lucide-react';
import { PostgresDataType, PostgresColumnSchema, PostgresRowData, ViewSettingsConfig } from '../../../shared/postgres-types';
import { SupabaseColumnModal } from './SupabaseColumnModal';
import { NotionPropertyMenu } from './NotionPropertyMenu';
import { NotionAddViewMenu, ViewTypeOption } from './NotionAddViewMenu';
import { NotionViewSettingsModal } from './NotionViewSettingsModal';

export interface DatabaseView {
    id: string;
    name: string;
    type: 'table' | 'board' | 'timeline' | 'calendar' | 'list' | 'gallery' | 'chart' | 'feed' | 'map' | 'dashboard' | 'form';
    icon?: React.ReactNode;
}

interface NotionDatabaseProps {
    id: string;
    initialTitle?: string;
    initialViewType?: 'table' | 'kanban' | 'list' | 'calendar';
    onDelete?: () => void;
    onAddTextAbove?: () => void;
    onAddTextBelow?: () => void;
}

// Initial Supabase Table Columns matching the user's Supabase screenshot
const DEFAULT_SUPABASE_COLUMNS: PostgresColumnSchema[] = [
    { id: 'col_id', name: 'id', type: 'int8', isPrimaryKey: true, isNullable: false },
    { id: 'col_created_at', name: 'created_at', type: 'timestamptz', isNullable: false, defaultValue: 'now()' },
    { id: 'col_phone', name: 'phone', type: 'text', isNullable: true },
    { id: 'col_nomewpp', name: 'nomewpp', type: 'text', isNullable: true },
    { id: 'col_bot_message', name: 'bot_message', type: 'jsonb', isNullable: true },
];

// Initial Supabase Rows matching the user's Supabase schema
const DEFAULT_SUPABASE_ROWS: PostgresRowData[] = [
    { id: '1', col_id: 101, col_created_at: '2026-07-23 20:00:00+00', col_phone: '+551199999999', col_nomewpp: 'Fagner', col_bot_message: '{"status": "delivered"}' },
    { id: '2', col_id: 102, col_created_at: '2026-07-23 20:05:12+00', col_phone: '+551188888888', col_nomewpp: 'Julio', col_bot_message: '{"status": "read"}' },
];

const DEFAULT_VIEW_CONFIG: ViewSettingsConfig = {
    layout: 'table',
    showDataSourceTitle: true,
    showVerticalLines: true,
    showPageIcon: true,
    wrapAllContent: false,
    hiddenColumnIds: [],
    openPagesIn: 'side_peek',
    loadLimit: 50,
};

export const NotionDatabase: React.FC<NotionDatabaseProps> = ({
    id,
    initialTitle = 'chat_messages',
    initialViewType = 'table',
    onDelete,
    onAddTextAbove,
    onAddTextBelow,
}) => {
    const [title, setTitle] = useState(initialTitle);
    const [isFullPage, setIsFullPage] = useState(false);

    // Dynamic Views
    const [views, setViews] = useState<DatabaseView[]>(() => {
        if (initialViewType === 'kanban') {
            return [{ id: 'v1', name: 'Quadro (Kanban)', type: 'board', icon: <Kanban className="w-3.5 h-3.5 text-purple-400" /> }];
        } else if (initialViewType === 'list') {
            return [{ id: 'v1', name: 'Lista', type: 'list', icon: <LayoutList className="w-3.5 h-3.5 text-sky-400" /> }];
        }
        return [{ id: 'v1', name: 'chat_messages', type: 'table', icon: <Table className="w-3.5 h-3.5 text-emerald-400" /> }];
    });

    const [activeViewId, setActiveViewId] = useState<string>('v1');
    const [viewConfig, setViewConfig] = useState<ViewSettingsConfig>(DEFAULT_VIEW_CONFIG);

    // Column & Data States (PostgreSQL/Supabase Types)
    const [columns, setColumns] = useState<PostgresColumnSchema[]>(DEFAULT_SUPABASE_COLUMNS);
    const [rows, setRows] = useState<PostgresRowData[]>(DEFAULT_SUPABASE_ROWS);

    // Column Context Menu State
    const [columnMenuState, setColumnMenuState] = useState<{
        isOpen: boolean;
        position: { x: number; y: number } | null;
        columnId: string | null;
    }>({ isOpen: false, position: null, columnId: null });

    // Notion/AppFlowy Property Menu State (Matching Images 3, 4, 5)
    const [propertyMenuState, setPropertyMenuState] = useState<{
        isOpen: boolean;
        position: { x: number; y: number } | null;
        column?: PostgresColumnSchema;
    }>({ isOpen: false, position: null });

    // Notion Add View Menu State (Image 5)
    const [addViewMenuState, setAddViewMenuState] = useState<{
        isOpen: boolean;
        position: { x: number; y: number } | null;
    }>({ isOpen: false, position: null });

    // Notion View Settings Modal State (Images 2, 3, 4)
    const [viewSettingsState, setViewSettingsState] = useState<{
        isOpen: boolean;
        position: { x: number; y: number } | null;
    }>({ isOpen: false, position: null });

    // Supabase Column Modal State
    const [showColumnModal, setShowColumnModal] = useState(false);
    const [editingColumn, setEditingColumn] = useState<PostgresColumnSchema | undefined>(undefined);
    const [insertPosition, setInsertPosition] = useState<{ targetId: string; direction: 'left' | 'right' } | null>(null);

    // Insert Dropdown Menu State
    const [showInsertDropdown, setShowInsertDropdown] = useState(false);

    const activeView = views.find(v => v.id === activeViewId) || views[0];

    const handleSelectNewViewType = (viewTypeId: ViewTypeOption['id'], label: string) => {
        const newView: DatabaseView = {
            id: `v-${Date.now()}`,
            name: label,
            type: viewTypeId,
            icon: viewTypeId === 'table' ? <Table className="w-3.5 h-3.5 text-emerald-400" /> : <Kanban className="w-3.5 h-3.5 text-purple-400" />,
        };
        setViews(prev => [...prev, newView]);
        setActiveViewId(newView.id);
        setViewConfig(prev => ({ ...prev, layout: viewTypeId }));
        setAddViewMenuState({ isOpen: false, position: null });
    };

    const addRow = () => {
        const newRow: PostgresRowData = {
            id: Date.now().toString(),
            col_id: rows.length + 100,
            col_created_at: new Date().toISOString(),
        };
        setRows(prev => [...prev, newRow]);
    };

    const updateRowValue = (rowId: string, colId: string, value: any) => {
        setRows(prev => prev.map(r => r.id === rowId ? { ...r, [colId]: value } : r));
    };

    const deleteRow = (rowId: string) => {
        setRows(prev => prev.filter(r => r.id !== rowId));
    };

    // Quick + Icon Button in Header Row
    const handleQuickAddProperty = (e: React.MouseEvent) => {
        e.preventDefault();
        const newColNum = columns.length + 1;
        const newCol: PostgresColumnSchema = {
            id: `col_${Date.now()}`,
            name: `propriedade_${newColNum}`,
            type: 'text',
        };
        setColumns(prev => [...prev, newCol]);

        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setPropertyMenuState({
            isOpen: true,
            position: { x: rect.left - 240, y: rect.bottom + 6 },
            column: newCol,
        });
    };

    const handleColumnContextMenu = (e: React.MouseEvent, columnId: string) => {
        e.preventDefault();
        setColumnMenuState({
            isOpen: true,
            position: { x: e.clientX, y: e.clientY },
            columnId,
        });
    };

    const handleOpenPropertyTypeMenu = (e: React.MouseEvent, col: PostgresColumnSchema) => {
        e.stopPropagation();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setPropertyMenuState({
            isOpen: true,
            position: { x: rect.left, y: rect.bottom + 6 },
            column: col,
        });
    };

    const handleOpenAddViewMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setAddViewMenuState({
            isOpen: true,
            position: { x: rect.left, y: rect.bottom + 6 },
        });
    };

    const handleOpenViewSettings = (e: React.MouseEvent) => {
        e.stopPropagation();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setViewSettingsState({
            isOpen: true,
            position: { x: rect.left - 240, y: rect.bottom + 6 },
        });
    };

    const handleInsertColumnAt = (direction: 'left' | 'right') => {
        if (!columnMenuState.columnId) return;
        setInsertPosition({ targetId: columnMenuState.columnId, direction });
        setEditingColumn(undefined);
        setShowColumnModal(true);
        setColumnMenuState({ isOpen: false, position: null, columnId: null });
    };

    const handleSaveColumnSchema = (colSchema: PostgresColumnSchema) => {
        if (editingColumn) {
            setColumns(prev => prev.map(c => c.id === colSchema.id ? colSchema : c));
        } else if (insertPosition) {
            const index = columns.findIndex(c => c.id === insertPosition.targetId);
            const updated = [...columns];
            const insertIdx = insertPosition.direction === 'left' ? index : index + 1;
            updated.splice(insertIdx, 0, colSchema);
            setColumns(updated);
        } else {
            setColumns(prev => {
                const exists = prev.some(c => c.id === colSchema.id);
                if (exists) {
                    return prev.map(c => c.id === colSchema.id ? colSchema : c);
                }
                return [...prev, colSchema];
            });
        }
        setInsertPosition(null);
        setEditingColumn(undefined);
    };

    const handleDeleteColumn = () => {
        if (!columnMenuState.columnId) return;
        setColumns(prev => prev.filter(c => c.id !== columnMenuState.columnId));
        setColumnMenuState({ isOpen: false, position: null, columnId: null });
    };

    const handleToggleColumnVisibility = (colId: string) => {
        setColumns(prev => prev.map(c => c.id === colId ? { ...c, hidden: !c.hidden } : c));
    };

    const handleHideAllColumns = () => {
        setColumns(prev => prev.map(c => ({ ...c, hidden: true })));
    };

    const visibleColumns = columns.filter(c => !c.hidden);

    const containerStyle = isFullPage
        ? "fixed inset-0 z-50 p-8 bg-[#0b0c10] overflow-y-auto font-sans select-none animate-in fade-in"
        : "relative my-6 border-[5px] border-[#27272a] hover:border-emerald-500/40 rounded-2xl bg-[#141417] shadow-2xl font-sans select-none animate-in fade-in duration-200 group/db";

    return (
        <div className={containerStyle}>
            {/* Top Hover Action Bar for Adding Text Above & Below */}
            {!isFullPage && (
                <div className="absolute -top-9 right-2 z-30 flex items-center gap-1.5 opacity-0 group-hover/db:opacity-100 transition-all duration-150 bg-[#18181b] border border-white/10 px-2 py-1 rounded-xl shadow-xl">
                    {onAddTextAbove && (
                        <button
                            onClick={onAddTextAbove}
                            className="px-2.5 py-1 bg-white/10 hover:bg-amber-500/20 hover:text-amber-300 text-zinc-300 rounded-md text-[10px] font-bold border border-white/10 transition-all cursor-pointer"
                            title="Adicionar parágrafo de texto acima"
                        >
                            + Texto Acima
                        </button>
                    )}
                    {onAddTextBelow && (
                        <button
                            onClick={onAddTextBelow}
                            className="px-2.5 py-1 bg-white/10 hover:bg-amber-500/20 hover:text-amber-300 text-zinc-300 rounded-md text-[10px] font-bold border border-white/10 transition-all cursor-pointer"
                            title="Adicionar parágrafo de texto abaixo"
                        >
                            + Texto Abaixo
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={onDelete}
                            className="p-1 text-zinc-500 hover:text-red-400 hover:bg-white/10 rounded-md transition-colors cursor-pointer"
                            title="Excluir Base de Dados"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            )}

            {/* Supabase Table Header Title Bar */}
            <div className="px-5 pt-4 pb-2 flex items-center justify-between bg-white/[0.01]">
                <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-400" />
                    {viewConfig.showDataSourceTitle && (
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="bg-transparent font-bold text-sm text-zinc-100 focus:outline-none hover:bg-white/5 px-2 py-0.5 rounded-lg transition-colors font-mono"
                        />
                    )}
                </div>

                {/* Supabase Toolbar Action Buttons */}
                <div className="flex items-center gap-2 text-xs">
                    <button
                        onClick={handleOpenViewSettings}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 cursor-pointer transition-colors"
                        title="View settings (Configurações da Visão)"
                    >
                        <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
                        <span className="font-semibold">View settings</span>
                    </button>

                    <button
                        onClick={() => setIsFullPage(!isFullPage)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 cursor-pointer transition-colors"
                        title={isFullPage ? "Sair da Tela Cheia" : "Abrir Página Inteira"}
                    >
                        {isFullPage ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    </button>

                    <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 border border-white/10 cursor-pointer">
                        <ArrowUpDown className="w-3 h-3" /> Sort
                    </button>
                    <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 border border-white/10 cursor-pointer">
                        <Shield className="w-3 h-3 text-amber-400" /> Add RLS policy
                    </button>

                    {/* Supabase Insert Dropdown Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setShowInsertDropdown(!showInsertDropdown)}
                            className="flex items-center gap-1 px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg shadow transition-all active:scale-95 cursor-pointer"
                        >
                            <span>Insert</span>
                            <ChevronDown className="w-3.5 h-3.5" />
                        </button>

                        {showInsertDropdown && (
                            <div className="absolute right-0 top-9 z-30 w-48 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl p-1 text-xs text-zinc-200 animate-in fade-in">
                                <button
                                    onClick={() => {
                                        addRow();
                                        setShowInsertDropdown(false);
                                    }}
                                    className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                                >
                                    <span>Insert row</span>
                                    <span className="text-[10px] font-mono text-zinc-500">I then R</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setInsertPosition(null);
                                        setEditingColumn(undefined);
                                        setShowColumnModal(true);
                                        setShowInsertDropdown(false);
                                    }}
                                    className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                                >
                                    <span>Insert column</span>
                                    <span className="text-[10px] font-mono text-zinc-500">I then C</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Dynamic View Tabs Header */}
            <div className="px-5 border-b border-white/10 flex items-center gap-1 bg-white/[0.01]">
                {views.map((view) => (
                    <button
                        key={view.id}
                        onClick={() => {
                            setActiveViewId(view.id);
                            setViewConfig(prev => ({ ...prev, layout: view.type as any }));
                        }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-t-xl text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                            activeViewId === view.id
                                ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10'
                                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                        }`}
                    >
                        {view.icon}
                        <span>{view.name}</span>
                    </button>
                ))}

                {/* Plus (+) Button to Add View matching Image 5 */}
                <button
                    onClick={handleOpenAddViewMenu}
                    className="p-1.5 text-zinc-400 hover:text-emerald-400 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                    title="Add a new view (+)"
                >
                    <Plus className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* TABLE VIEW */}
            {viewConfig.layout === 'table' && (
                <div className="overflow-x-auto">
                    <table className={`w-full text-left text-xs border-collapse font-sans ${viewConfig.showVerticalLines ? 'divide-x divide-white/10' : ''}`}>
                        <thead>
                            <tr className="border-b border-white/10 bg-white/[0.02] text-zinc-400 uppercase text-[10px] tracking-wider font-semibold">
                                {visibleColumns.map((col) => (
                                    <th
                                        key={col.id}
                                        onContextMenu={(e) => handleColumnContextMenu(e, col.id)}
                                        className={`py-2.5 px-4 hover:bg-white/5 transition-colors cursor-pointer ${viewConfig.showVerticalLines ? 'border-r border-white/10' : ''}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            {col.isPrimaryKey && <Key className="w-3 h-3 text-amber-400 shrink-0" />}
                                            <span className="font-bold text-zinc-200 lowercase font-mono">{col.name}</span>

                                            <button
                                                type="button"
                                                onClick={(e) => handleOpenPropertyTypeMenu(e, col)}
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
                                        onClick={handleQuickAddProperty}
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
                            {rows.slice(0, viewConfig.loadLimit).map((row) => (
                                <tr key={row.id} className="hover:bg-white/[0.02] transition-colors group font-mono">
                                    {visibleColumns.map((col) => (
                                        <td key={col.id} className={`py-2 px-4 ${viewConfig.showVerticalLines ? 'border-r border-white/10' : ''}`}>
                                            <input
                                                type="text"
                                                value={row[col.id] !== undefined ? (typeof row[col.id] === 'object' ? JSON.stringify(row[col.id]) : row[col.id]) : ''}
                                                onChange={(e) => updateRowValue(row.id, col.id, e.target.value)}
                                                className={`w-full bg-transparent focus:outline-none text-zinc-200 text-xs font-mono ${viewConfig.wrapAllContent ? 'whitespace-normal' : 'truncate'}`}
                                            />
                                        </td>
                                    ))}
                                    <td className="py-2 px-3"></td>
                                    <td className="py-2 px-4 text-right">
                                        <button
                                            onClick={() => deleteRow(row.id)}
                                            className="p-1 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button
                        onClick={() => addRow()}
                        className="w-full py-2.5 border-t border-white/5 hover:bg-white/[0.02] text-zinc-400 hover:text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                        <Plus className="w-3.5 h-3.5" /> Insert row
                    </button>
                </div>
            )}

            {/* OTHER VIEWS (BOARD, LIST, GALLERY, etc.) */}
            {viewConfig.layout !== 'table' && (
                <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4 bg-black/20 font-mono">
                    {rows.slice(0, viewConfig.loadLimit).map((item) => (
                        <div key={item.id} className="p-4 bg-[#18181b] border border-white/10 rounded-2xl shadow-lg flex flex-col gap-2">
                            <div className="text-xs font-bold text-emerald-400">ID #{item.col_id || item.id}</div>
                            <div className="text-xs text-zinc-200 truncate">{item.col_phone || item.col_nomewpp || 'Registro'}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Notion Add View Dropdown Menu (Matching Image 5) */}
            <NotionAddViewMenu
                isOpen={addViewMenuState.isOpen}
                position={addViewMenuState.position}
                onClose={() => setAddViewMenuState({ isOpen: false, position: null })}
                onSelectViewType={handleSelectNewViewType}
            />

            {/* Notion View Settings Modal (Matching Images 2, 3, 4) */}
            <NotionViewSettingsModal
                isOpen={viewSettingsState.isOpen}
                position={viewSettingsState.position}
                currentViewName={activeView.name}
                columns={columns}
                config={viewConfig}
                onClose={() => setViewSettingsState({ isOpen: false, position: null })}
                onUpdateConfig={setViewConfig}
                onUpdateViewName={(newName) => {
                    setViews(prev => prev.map(v => v.id === activeView.id ? { ...v, name: newName } : v));
                }}
                onToggleColumnVisibility={handleToggleColumnVisibility}
                onHideAllColumns={handleHideAllColumns}
            />

            {/* Property Menu Modal */}
            <NotionPropertyMenu
                isOpen={propertyMenuState.isOpen}
                position={propertyMenuState.position}
                column={propertyMenuState.column}
                onClose={() => setPropertyMenuState({ isOpen: false, position: null, column: undefined })}
                onSaveColumn={handleSaveColumnSchema}
            />

            {/* Supabase Column Modal */}
            <SupabaseColumnModal
                isOpen={showColumnModal}
                initialColumn={editingColumn}
                onClose={() => {
                    setShowColumnModal(false);
                    setEditingColumn(undefined);
                    setInsertPosition(null);
                }}
                onSave={handleSaveColumnSchema}
            />
        </div>
    );
};
