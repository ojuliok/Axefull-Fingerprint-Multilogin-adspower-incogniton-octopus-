import React, { useState } from 'react';
import { 
    Table, Kanban, LayoutList, Calendar, Plus, MoreHorizontal, Trash2, Edit3, 
    CheckCircle2, Clock, AlertCircle, User, Tag, ChevronDown, Filter, Hash,
    CheckSquare, Link, Percent, ArrowLeft, ArrowRight, EyeOff, Copy, Type as TypeIcon,
    Database, Key, Shield, ArrowUpDown, Download, Upload, FileSpreadsheet,
    SlidersHorizontal, Maximize2, Minimize2, Settings, ArrowLeft as ArrowLeftIcon
} from 'lucide-react';
import { PostgresDataType, PostgresColumnSchema, PostgresRowData, ViewSettingsConfig } from '../../../shared/postgres-types';
import { SupabaseColumnModal } from './SupabaseColumnModal';
import { NotionPropertyMenu } from './NotionPropertyMenu';
import { NotionAddViewMenu, ViewTypeOption } from './NotionAddViewMenu';
import { NotionViewSettingsModal } from './NotionViewSettingsModal';
import { RowDetailModal } from './RowDetailModal';
import { DatabaseTableView } from './views/DatabaseTableView';
import { DatabaseBoardView } from './views/DatabaseBoardView';
import { DatabaseGalleryView } from './views/DatabaseGalleryView';
import { DatabaseListView } from './views/DatabaseListView';

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

    // Row Side-Peek Detail Modal State
    const [activeDetailRow, setActiveDetailRow] = useState<PostgresRowData | null>(null);

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
        let viewIcon = <Table className="w-3.5 h-3.5 text-emerald-400" />;
        if (viewTypeId === 'board') viewIcon = <Kanban className="w-3.5 h-3.5 text-purple-400" />;
        if (viewTypeId === 'list') viewIcon = <LayoutList className="w-3.5 h-3.5 text-sky-400" />;
        if (viewTypeId === 'gallery') viewIcon = <LayoutList className="w-3.5 h-3.5 text-amber-400" />;

        const newView: DatabaseView = {
            id: `v-${Date.now()}`,
            name: label,
            type: viewTypeId,
            icon: viewIcon,
        };
        setViews(prev => [...prev, newView]);
        setActiveViewId(newView.id);
        setViewConfig(prev => ({ ...prev, layout: viewTypeId as any }));
        setAddViewMenuState({ isOpen: false, position: null });
    };

    const addRow = () => {
        const newRow: PostgresRowData = {
            id: Date.now().toString(),
            col_id: rows.length + 101,
            col_created_at: new Date().toISOString(),
            col_nomewpp: 'Novo registro',
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
            position: { x: Math.max(10, rect.left - 240), y: rect.bottom + 6 },
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
            position: { x: Math.max(10, rect.left - 240), y: rect.bottom + 6 },
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

    const containerStyle = isFullPage
        ? "fixed inset-0 z-50 p-8 bg-[#0b0c10] overflow-y-auto font-sans select-none animate-in fade-in duration-150 flex flex-col"
        : "relative my-6 border-[5px] border-[#27272a] hover:border-emerald-500/40 rounded-2xl bg-[#141417] shadow-2xl font-sans select-none animate-in fade-in duration-200 group/db";

    return (
        <div className={containerStyle}>
            {/* Full Page Navigation Header Bar with Back/Minimize Button */}
            {isFullPage && (
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10 text-xs">
                    <button
                        onClick={() => setIsFullPage(false)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-emerald-500/20 text-zinc-200 hover:text-emerald-300 font-bold border border-white/10 transition-all cursor-pointer"
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                        <span>Voltar ao Documento</span>
                    </button>
                    <div className="font-mono text-zinc-400 text-xs">Modo Página Inteira (Full Page)</div>
                </div>
            )}

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
                        {isFullPage ? <Minimize2 className="w-3.5 h-3.5 text-amber-400" /> : <Maximize2 className="w-3.5 h-3.5" />}
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

            {/* DEDICATED VIEW RENDERERS */}
            {viewConfig.layout === 'table' && (
                <DatabaseTableView
                    columns={columns}
                    rows={rows}
                    config={viewConfig}
                    onUpdateRowValue={updateRowValue}
                    onDeleteRow={deleteRow}
                    onAddRow={addRow}
                    onQuickAddProperty={handleQuickAddProperty}
                    onOpenPropertyTypeMenu={handleOpenPropertyTypeMenu}
                    onColumnContextMenu={handleColumnContextMenu}
                    onRowClick={(row) => setActiveDetailRow(row)}
                />
            )}

            {viewConfig.layout === 'board' && (
                <DatabaseBoardView
                    columns={columns}
                    rows={rows}
                    config={viewConfig}
                    onRowClick={(row) => setActiveDetailRow(row)}
                    onAddRow={addRow}
                />
            )}

            {viewConfig.layout === 'gallery' && (
                <DatabaseGalleryView
                    columns={columns}
                    rows={rows}
                    config={viewConfig}
                    onRowClick={(row) => setActiveDetailRow(row)}
                    onAddRow={addRow}
                />
            )}

            {viewConfig.layout === 'list' && (
                <DatabaseListView
                    columns={columns}
                    rows={rows}
                    config={viewConfig}
                    onRowClick={(row) => setActiveDetailRow(row)}
                    onAddRow={addRow}
                />
            )}

            {/* Fallback for other view types */}
            {viewConfig.layout !== 'table' && viewConfig.layout !== 'board' && viewConfig.layout !== 'gallery' && viewConfig.layout !== 'list' && (
                <DatabaseListView
                    columns={columns}
                    rows={rows}
                    config={viewConfig}
                    onRowClick={(row) => setActiveDetailRow(row)}
                    onAddRow={addRow}
                />
            )}

            {/* Column Context Menu Popover */}
            {columnMenuState.isOpen && columnMenuState.position && (
                <div
                    style={{ top: `${columnMenuState.position.y}px`, left: `${columnMenuState.position.x}px` }}
                    className="fixed z-50 w-48 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl p-1 text-xs text-zinc-200 animate-in fade-in"
                >
                    <button
                        onClick={() => {
                            const col = columns.find(c => c.id === columnMenuState.columnId);
                            setEditingColumn(col);
                            setShowColumnModal(true);
                            setColumnMenuState({ isOpen: false, position: null, columnId: null });
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                    >
                        <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                        <span>Editar Coluna</span>
                    </button>
                    <button
                        onClick={() => handleInsertColumnAt('left')}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                    >
                        <Plus className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Inserir à esquerda</span>
                    </button>
                    <button
                        onClick={() => handleInsertColumnAt('right')}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                    >
                        <Plus className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Inserir à direita</span>
                    </button>
                    <button
                        onClick={() => {
                            if (columnMenuState.columnId) handleToggleColumnVisibility(columnMenuState.columnId);
                            setColumnMenuState({ isOpen: false, position: null, columnId: null });
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                    >
                        <EyeOff className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Ocultar coluna</span>
                    </button>
                    <div className="my-1 border-t border-white/10" />
                    <button
                        onClick={handleDeleteColumn}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Excluir coluna</span>
                    </button>
                </div>
            )}

            {/* Row Detail Side-Peek Modal */}
            <RowDetailModal
                isOpen={Boolean(activeDetailRow)}
                row={activeDetailRow}
                columns={columns}
                onClose={() => setActiveDetailRow(null)}
                onUpdateRow={(rowId, updatedRow) => {
                    setRows(prev => prev.map(r => r.id === rowId ? updatedRow : r));
                    setActiveDetailRow(updatedRow);
                }}
                onAddProperty={(newCol) => {
                    setColumns(prev => [...prev, newCol]);
                }}
            />

            {/* Notion Add View Dropdown Menu */}
            <NotionAddViewMenu
                isOpen={addViewMenuState.isOpen}
                position={addViewMenuState.position}
                onClose={() => setAddViewMenuState({ isOpen: false, position: null })}
                onSelectViewType={handleSelectNewViewType}
            />

            {/* Notion View Settings Modal */}
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
