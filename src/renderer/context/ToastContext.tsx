import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
}

interface ToastContextValue {
    toast: {
        success: (title: string, message?: string) => void;
        error: (title: string, message?: string) => void;
        warning: (title: string, message?: string) => void;
        info: (title: string, message?: string) => void;
    };
}

const ToastContext = createContext<ToastContextValue>({
    toast: { success: () => {}, error: () => {}, warning: () => {}, info: () => {} },
});

const ICONS: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 size={16} />,
    error: <XCircle size={16} />,
    warning: <AlertTriangle size={16} />,
    info: <Info size={16} />,
};

const COLORS: Record<ToastType, { border: string; icon: string; bar: string }> = {
    success: { border: 'rgba(16,185,129,0.2)', icon: '#34d399', bar: '#10b981' },
    error:   { border: 'rgba(239,68,68,0.2)',  icon: '#f87171', bar: '#ef4444' },
    warning: { border: 'rgba(245,158,11,0.2)', icon: '#fbbf24', bar: '#f59e0b' },
    info:    { border: 'rgba(99,102,241,0.2)', icon: '#818cf8', bar: '#6366f1' },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const add = useCallback((type: ToastType, title: string, message?: string) => {
        const id = Math.random().toString(36).slice(2);
        setToasts(prev => [...prev.slice(-4), { id, type, title, message }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
    }, []);

    const dismiss = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const toast = {
        success: (title: string, message?: string) => add('success', title, message),
        error:   (title: string, message?: string) => add('error',   title, message),
        warning: (title: string, message?: string) => add('warning', title, message),
        info:    (title: string, message?: string) => add('info',    title, message),
    };

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}

            {/* Toast Container */}
            <div style={{
                position: 'fixed',
                bottom: 24,
                right: 24,
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                pointerEvents: 'none',
                maxWidth: 360,
            }}>
                {toasts.map(t => {
                    const c = COLORS[t.type];
                    return (
                        <div
                            key={t.id}
                            style={{
                                pointerEvents: 'all',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 12,
                                padding: '12px 14px 12px 16px',
                                borderRadius: 16,
                                background: 'rgba(15,23,42,0.97)',
                                border: `1px solid ${c.border}`,
                                boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
                                backdropFilter: 'blur(16px)',
                                animation: 'toastIn 0.3s cubic-bezier(0.4,0,0.2,1)',
                                position: 'relative',
                                overflow: 'hidden',
                                minWidth: 260,
                            }}
                        >
                            {/* Bottom progress bar */}
                            <div style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                height: 2,
                                background: c.bar,
                                borderRadius: '0 0 16px 16px',
                                animation: 'toastProgress 4.5s linear forwards',
                                opacity: 0.6,
                            }} />

                            <span style={{ color: c.icon, flexShrink: 0, marginTop: 1 }}>
                                {ICONS[t.type]}
                            </span>

                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: '#f1f5f9',
                                    lineHeight: 1.4,
                                    margin: 0,
                                }}>{t.title}</p>
                                {t.message && (
                                    <p style={{
                                        fontSize: 12,
                                        color: '#64748b',
                                        marginTop: 3,
                                        lineHeight: 1.5,
                                    }}>{t.message}</p>
                                )}
                            </div>

                            <button
                                onClick={() => dismiss(t.id)}
                                style={{
                                    flexShrink: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 22,
                                    height: 22,
                                    borderRadius: 6,
                                    color: '#475569',
                                    cursor: 'pointer',
                                    background: 'none',
                                    border: 'none',
                                    transition: 'color 0.15s',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
                                onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
                            >
                                <X size={13} />
                            </button>
                        </div>
                    );
                })}
            </div>

            <style>{`
                @keyframes toastIn {
                    from { opacity: 0; transform: translateX(20px) scale(0.97); }
                    to   { opacity: 1; transform: translateX(0) scale(1); }
                }
                @keyframes toastProgress {
                    from { width: 100%; }
                    to   { width: 0%; }
                }
            `}</style>
        </ToastContext.Provider>
    );
}

export const useToast = () => useContext(ToastContext);
