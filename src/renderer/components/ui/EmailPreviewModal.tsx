import React, { useState, useEffect } from 'react';
import { Mail, Send, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface EmailPreviewModalProps {
    to: string;
    subject: string;
    bodyHtml: string;
    onClose: () => void;
    onSent?: () => void;
}

export const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({
    to,
    subject,
    bodyHtml,
    onClose,
    onSent
}) => {
    const [sendingState, setSendingState] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
    const [statusMessage, setStatusMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const sendStages = [
        'Autenticando na Plataforma Axefull...',
        'Conectando ao gateway de e-mails...',
        'Renderizando template de e-mail...',
        'Disparando mensagem...',
        'Enviado com sucesso!'
    ];

    const handleSend = async () => {
        setSendingState('sending');
        
        // Run through stages for awesome premium micro-animations
        for (let i = 0; i < sendStages.length - 1; i++) {
            setStatusMessage(sendStages[i]);
            await new Promise(r => setTimeout(r, 450));
        }

        try {
            const res = await window.api.email.send({
                to,
                subject,
                body: bodyHtml.replace(/<[^>]*>/g, ''), // Plain text version
                html: bodyHtml
            });

            if (res.success) {
                setStatusMessage(sendStages[sendStages.length - 1]);
                setSendingState('success');
                setTimeout(() => {
                    if (onSent) onSent();
                    onClose();
                }, 1000);
            } else {
                setErrorMessage(res.error || 'Falha ao processar e-mail');
                setSendingState('error');
            }
        } catch (err: any) {
            setErrorMessage(err.message || String(err));
            setSendingState('error');
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-[600px] bg-slate-900 border border-violet-500/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-scale text-slate-100">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                    <div className="flex items-center gap-2">
                        <Mail className="text-violet-400" size={18} />
                        <span className="font-semibold text-sm tracking-wide text-slate-200">
                            PLATAFORMA AXEFULL MAIL SERVICE
                        </span>
                    </div>
                    <button 
                        onClick={onClose} 
                        disabled={sendingState === 'sending'}
                        className="text-slate-400 hover:text-slate-200 disabled:opacity-50 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Sender/Recipient details */}
                <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/40 text-xs space-y-2">
                    <div className="flex">
                        <span className="w-16 text-slate-500 font-medium">De:</span>
                        <span className="text-slate-300 font-mono">Axefull Platform &lt;no-reply@axefull.com&gt;</span>
                    </div>
                    <div className="flex">
                        <span className="w-16 text-slate-500 font-medium">Para:</span>
                        <span className="text-violet-400 font-mono font-semibold">{to}</span>
                    </div>
                    <div className="flex">
                        <span className="w-16 text-slate-500 font-medium">Assunto:</span>
                        <span className="text-slate-200 font-semibold">{subject}</span>
                    </div>
                </div>

                {/* Email Body Preview */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-950/20 min-h-[200px] border-b border-slate-800">
                    <div 
                        className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-inner text-sm text-slate-300 leading-relaxed font-sans"
                        dangerouslySetInnerHTML={{ __html: bodyHtml }}
                    />
                </div>

                {/* Footer with actions / status */}
                <div className="px-6 py-4 bg-slate-950 flex items-center justify-between">
                    <div>
                        {sendingState === 'sending' && (
                            <div className="flex items-center gap-2 text-violet-400 text-xs font-mono">
                                <Loader2 className="animate-spin" size={14} />
                                <span>{statusMessage}</span>
                            </div>
                        )}
                        {sendingState === 'success' && (
                            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                                <CheckCircle size={14} />
                                <span>Enviado com sucesso!</span>
                            </div>
                        )}
                        {sendingState === 'error' && (
                            <div className="flex items-center gap-2 text-rose-400 text-xs">
                                <AlertCircle size={14} />
                                <span className="truncate max-w-[250px]" title={errorMessage}>
                                    Erro: {errorMessage}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={sendingState === 'sending'}
                            className="px-4 py-2 border border-slate-700 hover:border-slate-600 rounded-lg text-slate-400 hover:text-slate-200 text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        
                        {sendingState !== 'success' && (
                            <button
                                onClick={handleSend}
                                disabled={sendingState === 'sending'}
                                className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-lg hover:shadow-violet-600/10 disabled:opacity-50"
                            >
                                <Send size={12} />
                                Enviar E-mail
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
