import React, { useState, useEffect } from 'react';
import { X, Puzzle, Plus, Trash2, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ExtensionInfo } from '../../../preload/preload';
import styles from './ExtensionsModal.module.css';

interface Props {
    onClose: () => void;
}

const ExtensionsModal: React.FC<Props> = ({ onClose }) => {
    const [extensions, setExtensions] = useState<ExtensionInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [installing, setInstalling] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        loadExtensions();
    }, []);

    const loadExtensions = async () => {
        setLoading(true);
        try {
            const result = await window.api.extensions.list();
            if (result.success) {
                setExtensions(result.data as ExtensionInfo[]);
            }
        } finally {
            setLoading(false);
        }
    };

    const showMsg = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 4000);
    };

    const handleInstall = async () => {
        setInstalling(true);
        try {
            const result = await window.api.extensions.install();
            if (result.success) {
                const ext = result.data as ExtensionInfo;
                showMsg('success', `Extensão "${ext.name}" instalada com sucesso.`);
                await loadExtensions();
            } else if ((result.error as string) !== 'cancelled') {
                showMsg('error', result.error as string);
            }
        } finally {
            setInstalling(false);
        }
    };

    const handleDelete = async (extensionId: string, name: string) => {
        if (!confirm(`Remover a extensão "${name}"? Ela não será mais carregada nos perfis.`)) return;
        const result = await window.api.extensions.delete(extensionId);
        if (result.success) {
            showMsg('success', `"${name}" removida.`);
            setExtensions(prev => prev.filter(e => e.id !== extensionId));
        } else {
            showMsg('error', result.error as string);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-violet-500/15 rounded-xl flex items-center justify-center">
                            <Puzzle size={18} className="text-violet-400" />
                        </div>
                        <div>
                            <h2 className={styles.title}>Gerenciador de Extensões</h2>
                            <p className={styles.subtitle}>Extensões são carregadas em todos os perfis ao iniciar</p>
                        </div>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
                </div>

                {message && (
                    <div className={`${styles.message} ${message.type === 'success' ? styles.messageSuccess : styles.messageError}`}>
                        {message.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                        {message.text}
                    </div>
                )}

                <div className={styles.notice}>
                    <AlertCircle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-theme-text-muted leading-relaxed">
                        Apenas extensões <strong className="text-slate-300">desempacotadas</strong> (pasta com manifest.json) são suportadas.
                        Perfis ativos precisam ser reiniciados para aplicar mudanças.
                    </p>
                </div>

                <div className={styles.body}>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-8 h-8 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
                        </div>
                    ) : extensions.length === 0 ? (
                        <div className={styles.empty}>
                            <Puzzle size={32} className="text-slate-600 mb-3" />
                            <p className="text-theme-text-muted font-medium">Nenhuma extensão instalada</p>
                            <p className="text-slate-600 text-sm mt-1">Instale extensões desempacotadas para carregar em todos os perfis.</p>
                        </div>
                    ) : (
                        <div className={styles.list}>
                            {extensions.map(ext => (
                                <div key={ext.id} className={styles.extItem}>
                                    <div className={styles.extIcon}>
                                        <Puzzle size={20} className="text-violet-400" />
                                    </div>
                                    <div className={styles.extInfo}>
                                        <div className={styles.extName}>{ext.name}</div>
                                        <div className={styles.extMeta}>v{ext.version}</div>
                                        {ext.description && (
                                            <div className={styles.extDesc}>{ext.description}</div>
                                        )}
                                    </div>
                                    <button
                                        className={styles.deleteBtn}
                                        onClick={() => handleDelete(ext.id, ext.name)}
                                        title="Remover extensão">
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className={styles.footer}>
                    <button className={styles.refreshBtn} onClick={loadExtensions} disabled={loading}>
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Atualizar
                    </button>
                    <button className={styles.installBtn} onClick={handleInstall} disabled={installing}>
                        <Plus size={16} /> {installing ? 'Instalando...' : 'Instalar Extensão'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExtensionsModal;
