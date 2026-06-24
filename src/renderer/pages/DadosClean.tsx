import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    Eraser, Upload,
    CheckCircle2, XCircle, Trash2, AlertTriangle,
    History, Lock, X, RefreshCw, ShieldCheck,
} from 'lucide-react';
import styles from './DadosClean.module.css';

// ─── Types ───────────────────────────────────────────────────────────────────

interface MetaField {
    key: string;
    label: string;
    value: string;
    removable: boolean;
}

interface FileEntry {
    id: string;
    name: string;
    path: string;
    size: number;
    ext: string;
    status: 'pending' | 'reading' | 'ready' | 'cleaning' | 'done' | 'error';
    metadata: MetaField[];
    outputPath?: string;
    error?: string;
    warnings?: string[];
    removedCount?: number;
}

interface HistoryEntry {
    id: string;
    fileName: string;
    fileType: string;
    processedAt: string;
    outputPath: string;
    metadataRemoved: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const EXT_COLORS: Record<string, string> = {
    jpg: '#d97706', jpeg: '#d97706', png: '#2563eb', webp: '#7c3aed',
    pdf: '#dc2626', docx: '#1d4ed8', mp3: '#059669', wav: '#0d9488',
    mp4: '#9333ea', mov: '#9333ea',
};

const EXT_TEXT_COLORS: Record<string, string> = {
    jpg: '#fbbf24', jpeg: '#fbbf24', png: '#60a5fa', webp: '#c4b5fd',
    pdf: '#fca5a5', docx: '#93c5fd', mp3: '#6ee7b7', wav: '#5eead4',
    mp4: '#d8b4fe', mov: '#d8b4fe',
};

function formatDate(iso: string): string {
    try {
        return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return iso; }
}

function uid() { return Math.random().toString(36).slice(2, 10); }

const SUPPORTED = new Set(['jpg', 'jpeg', 'png', 'webp', 'pdf', 'docx', 'mp4', 'mov', 'mp3', 'wav']);

// ─── Component ───────────────────────────────────────────────────────────────

const DadosClean: React.FC = () => {
    const [files, setFiles] = useState<FileEntry[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [tab, setTab] = useState<'cleaner' | 'history'>('cleaner');
    const [isDragging, setIsDragging] = useState(false);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [isCleaningAll, setIsCleaningAll] = useState(false);
    const dropRef = useRef<HTMLDivElement>(null);

    const selected = files.find(f => f.id === selectedId) ?? null;

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        const res = await (window.api as any).metaClean.getHistory();
        if (res.success) setHistory(res.data as HistoryEntry[]);
    };

    // ─── File ingestion ───────────────────────────────────────────────────────

    const ingestPaths = useCallback(async (paths: string[]) => {
        const newEntries: FileEntry[] = [];

        for (const p of paths) {
            const name = p.replace(/\\/g, '/').split('/').pop() ?? p;
            const ext = name.split('.').pop()?.toLowerCase() ?? '';
            if (!SUPPORTED.has(ext)) continue;
            if (files.some(f => f.path === p)) continue;

            const entry: FileEntry = { id: uid(), name, path: p, size: 0, ext, status: 'reading', metadata: [] };
            newEntries.push(entry);
        }

        if (!newEntries.length) return;

        setFiles(prev => {
            const updated = [...prev, ...newEntries];
            if (!selectedId) setTimeout(() => setSelectedId(newEntries[0].id), 0);
            return updated;
        });

        for (const entry of newEntries) {
            const res = await (window.api as any).metaClean.readMetadata(entry.path);
            setFiles(prev => prev.map(f =>
                f.id === entry.id
                    ? { ...f, status: 'ready', metadata: res.success ? (res.data as MetaField[]) : [] }
                    : f
            ));
        }
    }, [files, selectedId]);

    // ─── Drag & Drop ─────────────────────────────────────────────────────────

    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const onDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        if (!dropRef.current?.contains(e.relatedTarget as Node)) setIsDragging(false);
    }, []);

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const paths = Array.from(e.dataTransfer.files).map((f: any) => f.path as string).filter(Boolean);
        ingestPaths(paths);
    }, [ingestPaths]);

    const onBrowse = async () => {
        const res = await (window.api as any).metaClean.openDialog();
        if (res.success && res.data?.length) ingestPaths(res.data);
    };

    // ─── Clean ───────────────────────────────────────────────────────────────

    const cleanFile = async (fileId: string) => {
        const file = files.find(f => f.id === fileId);
        if (!file || file.status === 'cleaning' || file.status === 'done') return;

        setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: 'cleaning' } : f));

        const res = await (window.api as any).metaClean.cleanFile(file.path);
        const result = res.data ?? res;

        setFiles(prev => prev.map(f =>
            f.id === fileId
                ? {
                    ...f,
                    status: res.success ? 'done' : 'error',
                    outputPath: result?.outputPath,
                    removedCount: result?.removedCount,
                    warnings: result?.warnings,
                    error: res.success ? undefined : (res.error ?? result?.error),
                }
                : f
        ));

        if (res.success) loadHistory();
    };

    const cleanAll = async () => {
        const targets = files.filter(f => f.status === 'ready');
        if (!targets.length) return;
        setIsCleaningAll(true);
        for (const f of targets) await cleanFile(f.id);
        setIsCleaningAll(false);
    };

    const removeFile = (id: string) => {
        setFiles(prev => {
            const next = prev.filter(f => f.id !== id);
            if (selectedId === id) setSelectedId(next[0]?.id ?? null);
            return next;
        });
    };

    const clearAll = () => {
        setFiles([]);
        setSelectedId(null);
    };

    const clearHistory = async () => {
        await (window.api as any).metaClean.clearHistory();
        setHistory([]);
    };

    // ─── Render helpers ───────────────────────────────────────────────────────

    const statusDot = (s: FileEntry['status']) => {
        const cls = s === 'done' ? styles.statusDone
            : s === 'error' ? styles.statusError
                : s === 'reading' || s === 'cleaning' ? styles.statusLoading
                    : styles.statusPending;
        return <span className={`${styles.statusDot} ${cls}`} />;
    };

    const readyCount = files.filter(f => f.status === 'ready').length;
    const doneCount  = files.filter(f => f.status === 'done').length;

    // ─── JSX ─────────────────────────────────────────────────────────────────

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <div className={styles.appIcon}>
                        <Eraser size={20} className="text-theme-text" />
                    </div>
                    <div>
                        <div className={styles.appTitle}>MetaClean</div>
                        <div className={styles.appSubtitle}>Remoção de metadados · Processamento 100% local</div>
                    </div>
                </div>

                <div className={styles.headerActions}>
                    <div className={styles.privacyNotice}>
                        <Lock size={11} />
                        Nenhum arquivo enviado a servidores
                    </div>

                    <div className={styles.tabBar}>
                        <button
                            className={`${styles.tabBtn} ${tab === 'cleaner' ? styles.tabBtnActive : ''}`}
                            onClick={() => setTab('cleaner')}
                        >
                            <Eraser size={14} /> Limpador
                        </button>
                        <button
                            className={`${styles.tabBtn} ${tab === 'history' ? styles.tabBtnActive : ''}`}
                            onClick={() => { setTab('history'); loadHistory(); }}
                        >
                            <History size={14} /> Histórico
                            {history.length > 0 && (
                                <span className={styles.metaCount}>{history.length}</span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Cleaner Tab ── */}
            {tab === 'cleaner' && (
                <div className={styles.body}>
                    {/* Left: Drop + File List */}
                    <div className={styles.leftPanel}>
                        <div
                            ref={dropRef}
                            className={`${styles.dropZone} ${isDragging ? styles.dropZoneActive : ''}`}
                            onDragOver={onDragOver}
                            onDragLeave={onDragLeave}
                            onDrop={onDrop}
                            onClick={onBrowse}
                        >
                            <div className={styles.dropZoneIcon}>
                                <Upload size={20} />
                            </div>
                            <div className={styles.dropTitle}>
                                {isDragging ? 'Solte os arquivos aqui' : 'Arraste arquivos aqui'}
                            </div>
                            <div className={styles.dropSub}>
                                JPG · PNG · WEBP · PDF · DOCX · MP3 · WAV · MP4 · MOV
                                <br />
                                <button className={styles.dropBrowse}>ou clique para selecionar</button>
                            </div>
                        </div>

                        {files.length > 0 && (
                            <>
                                <div className={styles.fileListHeader}>
                                    <span className={styles.fileListTitle}>
                                        {files.length} arquivo{files.length !== 1 ? 's' : ''}
                                    </span>
                                    <button className={styles.clearAllBtn} onClick={clearAll}>
                                        Remover todos
                                    </button>
                                </div>

                                <div className={styles.fileList}>
                                    {files.map(f => (
                                        <div
                                            key={f.id}
                                            className={`${styles.fileItem} ${selectedId === f.id ? styles.fileItemActive : ''}`}
                                            onClick={() => setSelectedId(f.id)}
                                        >
                                            <div
                                                className={styles.fileTypeIcon}
                                                style={{
                                                    background: `${EXT_COLORS[f.ext] ?? '#334155'}22`,
                                                    color: EXT_TEXT_COLORS[f.ext] ?? '#94a3b8',
                                                    border: `1px solid ${EXT_COLORS[f.ext] ?? '#334155'}44`,
                                                }}
                                            >
                                                {f.ext.toUpperCase().slice(0, 4)}
                                            </div>
                                            <div className={styles.fileInfo}>
                                                <div className={styles.fileName}>{f.name}</div>
                                                <div className={styles.fileMeta}>
                                                    {f.status === 'reading' && 'Lendo metadados...'}
                                                    {f.status === 'cleaning' && 'Limpando...'}
                                                    {f.status === 'ready' && `${f.metadata.filter(m => m.removable).length} campo(s) detectado(s)`}
                                                    {f.status === 'done' && `${f.removedCount ?? 0} campo(s) removido(s)`}
                                                    {f.status === 'error' && 'Erro'}
                                                </div>
                                            </div>
                                            <div className={styles.fileStatus}>{statusDot(f.status)}</div>
                                            <button
                                                className={styles.removeFileBtn}
                                                onClick={e => { e.stopPropagation(); removeFile(f.id); }}
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Right: Detail */}
                    <div className={styles.rightPanel}>
                        {!selected ? (
                            <div className={styles.emptyState}>
                                <div className={styles.emptyIcon}>
                                    <ShieldCheck size={28} strokeWidth={1.5} />
                                </div>
                                <div className={styles.emptyTitle}>Nenhum arquivo selecionado</div>
                                <div className={styles.emptySub}>
                                    Arraste arquivos para a área esquerda<br />
                                    para visualizar e limpar os metadados.
                                </div>
                            </div>
                        ) : (
                            <div className={styles.detailPanel}>
                                {/* Detail header */}
                                <div className={styles.detailHeader}>
                                    <div className={styles.detailFileInfo}>
                                        <div
                                            className={styles.fileTypeIcon}
                                            style={{
                                                width: 40, height: 40,
                                                background: `${EXT_COLORS[selected.ext] ?? '#334155'}22`,
                                                color: EXT_TEXT_COLORS[selected.ext] ?? '#94a3b8',
                                                border: `1px solid ${EXT_COLORS[selected.ext] ?? '#334155'}44`,
                                                borderRadius: 10, display: 'flex',
                                                alignItems: 'center', justifyContent: 'center',
                                                fontSize: 10, fontWeight: 700, flexShrink: 0,
                                            }}
                                        >
                                            {selected.ext.toUpperCase().slice(0, 4)}
                                        </div>
                                        <div>
                                            <div className={styles.detailFileName}>{selected.name}</div>
                                            <div className={styles.detailFileMeta}>
                                                {selected.ext.toUpperCase()}
                                                {selected.status === 'done' && selected.outputPath && (
                                                    <> · Salvo em: <span style={{ color: '#34d399' }}>arquivos_limpos/</span></>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles.detailActions}>
                                        {selected.status === 'ready' && (
                                            <button
                                                className={styles.btnPrimary}
                                                onClick={() => cleanFile(selected.id)}
                                            >
                                                <Eraser size={14} />
                                                Limpar Metadados
                                            </button>
                                        )}
                                        {selected.status === 'cleaning' && (
                                            <button className={styles.btnPrimary} disabled>
                                                <span className={styles.spinner} />
                                                Limpando...
                                            </button>
                                        )}
                                        {selected.status === 'done' && (
                                            <>
                                                <button
                                                    className={styles.btnSecondary}
                                                    onClick={() => cleanFile(selected.id)}
                                                    title="Reprocessar arquivo"
                                                >
                                                    <RefreshCw size={13} />
                                                </button>
                                            </>
                                        )}
                                        {selected.status === 'error' && (
                                            <button
                                                className={styles.btnSecondary}
                                                onClick={() => {
                                                    setFiles(prev => prev.map(f => f.id === selected.id ? { ...f, status: 'ready', error: undefined } : f));
                                                }}
                                            >
                                                <RefreshCw size={13} /> Tentar novamente
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Premium Progress bar */}
                                <div className="h-2 w-full bg-[#18181b]/50 border border-white/5 rounded-full overflow-hidden relative shadow-inner my-4">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ease-out relative
                                            ${selected.status === 'cleaning' ? 'bg-gradient-to-r from-indigo-600 to-indigo-400 w-[60%]' : 
                                              selected.status === 'done' ? 'bg-gradient-to-r from-emerald-600 to-emerald-400 w-[100%]' : 
                                              selected.status === 'error' ? 'bg-gradient-to-r from-red-600 to-red-400 w-[100%]' : 
                                              'bg-slate-700 w-[0%]'}`}
                                    >
                                        {(selected.status === 'cleaning' || selected.status === 'done') && (
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                                        )}
                                    </div>
                                </div>

                                {/* Success result */}
                                {selected.status === 'done' && (
                                    <div className={`${styles.resultBanner} ${styles.resultSuccess}`}>
                                        <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                                        <div>
                                            <div className={styles.resultTitle}>
                                                Arquivo limpo com sucesso — {selected.removedCount ?? 0} campo(s) removido(s)
                                            </div>
                                            {selected.outputPath && (
                                                <div className={styles.resultBody}>
                                                    Cópia salva em: {selected.outputPath}
                                                </div>
                                            )}
                                            {selected.warnings?.map((w, i) => (
                                                <div key={i} className={styles.resultBody} style={{ color: '#fbbf24', marginTop: 4 }}>
                                                    ⚠ {w}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Error result */}
                                {selected.status === 'error' && (
                                    <div className={`${styles.resultBanner} ${styles.resultError}`}>
                                        <XCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                                        <div>
                                            <div className={styles.resultTitle}>Erro ao processar arquivo</div>
                                            <div className={styles.resultBody}>{selected.error}</div>
                                        </div>
                                    </div>
                                )}

                                {/* Metadata list */}
                                <div className={styles.metaSection}>
                                    {selected.status === 'reading' ? (
                                        <div className={styles.loadingMeta}>
                                            <span className={styles.spinner} style={{ borderTopColor: '#7c3aed', borderColor: 'rgba(124,58,237,0.2)' }} />
                                            Analisando metadados...
                                        </div>
                                    ) : selected.metadata.length === 0 ? (
                                        <div className={styles.emptyState} style={{ paddingTop: 20 }}>
                                            <div className={styles.emptyTitle}>Sem metadados encontrados</div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className={styles.metaSectionTitle}>
                                                Metadados detectados
                                                <span className={styles.metaCount}>
                                                    {selected.metadata.filter(m => m.removable).length}
                                                </span>
                                            </div>

                                            <div className={styles.metaGrid}>
                                                {selected.metadata.map(field => (
                                                    <div key={field.key} className={styles.metaRow}>
                                                        <div className={styles.metaLabel}>{field.label}</div>
                                                        <div className={styles.metaValue}>{field.value}</div>
                                                        {field.removable ? (
                                                            <span className={styles.metaTagRemovable}>REMOVER</span>
                                                        ) : (
                                                            <span className={styles.metaTagSafe}>SEGURO</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            <div className={styles.warningBanner}>
                                                <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                                                <span>
                                                    Aviso: alguns formatos podem manter dados internos dependendo do codec
                                                    ou estrutura do arquivo. Verifique sempre o arquivo gerado antes de compartilhar.
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── History Tab ── */}
            {tab === 'history' && (
                <div className={styles.historyPanel}>
                    <div className={styles.historyHeader}>
                        <div className={styles.historyTitle}>Histórico de Processamentos</div>
                        {history.length > 0 && (
                            <button className={styles.btnDanger} onClick={clearHistory}>
                                <Trash2 size={13} /> Limpar histórico
                            </button>
                        )}
                    </div>

                    {history.length === 0 ? (
                        <div className={styles.emptyHistory}>
                            <History size={32} strokeWidth={1.5} style={{ marginBottom: 8, opacity: 0.3 }} />
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#475569' }}>Nenhum arquivo processado ainda</div>
                            <div style={{ fontSize: 12, color: '#334155' }}>Os arquivos limpos aparecerão aqui</div>
                        </div>
                    ) : (
                        <div className={styles.historyList}>
                            {history.map(h => (
                                <div key={h.id} className={styles.historyItem}>
                                    <div className={styles.historyIcon}>
                                        <CheckCircle2 size={16} />
                                    </div>
                                    <div className={styles.historyInfo}>
                                        <div className={styles.historyName}>{h.fileName}</div>
                                        <div className={styles.historyMeta}>{formatDate(h.processedAt)}</div>
                                    </div>
                                    <span className={styles.historyTypeBadge}>{h.fileType}</span>
                                    <span className={styles.historyBadge}>
                                        {h.metadataRemoved} removido{h.metadataRemoved !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Bottom Bar */}
            <div className={styles.bottomBar}>
                <div className={styles.bottomStats}>
                    {tab === 'cleaner' && files.length > 0 && (
                        <>{files.length} arquivo{files.length !== 1 ? 's' : ''} · {doneCount} processado{doneCount !== 1 ? 's' : ''} · {readyCount} aguardando</>
                    )}
                    {tab === 'history' && (
                        <>{history.length} arquivo{history.length !== 1 ? 's' : ''} no histórico</>
                    )}
                </div>

                <div className={styles.bottomRight}>
                    {tab === 'cleaner' && readyCount > 0 && (
                        <button
                            className={styles.btnPrimary}
                            onClick={cleanAll}
                            disabled={isCleaningAll}
                        >
                            {isCleaningAll ? (
                                <><span className={styles.spinner} /> Limpando tudo...</>
                            ) : (
                                <><Eraser size={14} /> Limpar todos ({readyCount})</>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DadosClean;
