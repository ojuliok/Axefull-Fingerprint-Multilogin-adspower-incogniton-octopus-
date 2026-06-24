import React, { useState, useEffect } from 'react';
import { Lock, Unlock, ShieldAlert, KeyRound, AlertCircle, X, Loader2 } from 'lucide-react';
import { DynamicIcon } from './CanvasIcons';

interface ItemPinUnlockModalProps {
    itemId: string;
    itemName: string;
    itemIcon?: string;
    itemType?: string;
    correctPin: string;
    recoveryEmail: string;
    onUnlock: () => void;
    onClose: () => void;
}

export const ItemPinUnlockModal: React.FC<ItemPinUnlockModalProps> = ({
    itemId,
    itemName,
    itemIcon,
    itemType,
    correctPin,
    recoveryEmail,
    onUnlock,
    onClose
}) => {
    const [inputValue, setInputValue] = useState('');
    const [error, setError] = useState(false);
    const [recovering, setRecovering] = useState(false);
    const [recoveryStatus, setRecoveryStatus] = useState('');

    const handleInput = (val: string) => {
        if (inputValue.length >= 4) return;
        setError(false);
        const newValue = inputValue + val;
        setInputValue(newValue);

        // Auto submit if 4 digits
        if (newValue.length === 4) {
            handleSubmit(newValue);
        }
    };

    const handleClear = () => {
        setInputValue('');
        setError(false);
    };

    const handleSubmit = (val = inputValue) => {
        if (val === correctPin) {
            onUnlock();
        } else {
            setError(true);
            setInputValue('');
        }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key >= '0' && e.key <= '9') {
            handleInput(e.key);
        } else if (e.key === 'Backspace') {
            setInputValue(prev => prev.slice(0, -1));
            setError(false);
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [inputValue]);

    const handleRecovery = async () => {
        if (!recoveryEmail) {
            setError(true);
            setRecoveryStatus('Nenhum e-mail de recuperação configurado.');
            return;
        }

        setRecovering(true);
        setRecoveryStatus('Conectando ao Mail Service Axefull...');
        
        try {
            await new Promise(r => setTimeout(r, 600));
            setRecoveryStatus('Renderizando template...');
            await new Promise(r => setTimeout(r, 400));
            setRecoveryStatus('Disparando e-mail de segurança...');
            
            const htmlContent = `
                <div style="font-family: sans-serif; max-width: 500px; padding: 20px; background-color: #0f172a; color: #f1f5f9; border-radius: 12px; border: 1px solid #334155;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #a78bfa; margin: 0;">Recuperação de PIN - Axefull</h2>
                        <p style="font-size: 12px; color: #94a3b8; margin: 5px 0 0 0;">Plataforma de Multi-Login e Automação</p>
                    </div>
                    <div style="background-color: #1e293b; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <p style="margin: 0 0 10px 0; font-size: 14px;">Olá,</p>
                        <p style="margin: 0 0 15px 0; font-size: 14px; line-height: 1.5;">Você solicitou a recuperação do PIN de acesso para o item protegido <strong>${itemName}</strong> (${itemType || 'objeto'}).</p>
                        <div style="text-align: center; margin: 20px 0; padding: 10px; background-color: #0f172a; border-radius: 6px; border: 1px dashed #7c3aed;">
                            <span style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #c084fc;">${correctPin}</span>
                        </div>
                        <p style="margin: 0; font-size: 12px; color: #94a3b8;">Se você não solicitou este e-mail, por favor ignore-o ou altere suas configurações de segurança.</p>
                    </div>
                    <div style="text-align: center; font-size: 11px; color: #64748b;">
                        Este é um e-mail automático enviado pela Plataforma Axefull.
                    </div>
                </div>
            `;

            const res = await window.api.email.send({
                to: recoveryEmail,
                subject: `Recuperação de PIN - ${itemName}`,
                body: `Seu PIN para ${itemName} é: ${correctPin}`,
                html: htmlContent
            });

            if (res.success) {
                setRecoveryStatus(`E-mail de recuperação enviado para ${recoveryEmail}! Seu PIN é ${correctPin}.`);
            } else {
                setRecoveryStatus(`Falha ao enviar e-mail: ${res.error}`);
            }
        } catch (err: any) {
            setRecoveryStatus(`Erro: ${err.message || String(err)}`);
        } finally {
            setRecovering(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center backdrop-blur-md bg-black/70">
            <div className="w-[380px] bg-slate-900 border border-violet-500/20 rounded-2xl p-8 shadow-2xl flex flex-col items-center relative text-slate-100">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-200">
                    <X size={20} />
                </button>

                <div className="w-16 h-16 bg-violet-600/20 rounded-full flex items-center justify-center mb-6">
                    <Lock size={32} className="text-violet-400 animate-pulse" />
                </div>

                <h2 className="text-xl font-bold mb-2">Item Bloqueado</h2>
                <div className="flex items-center gap-1.5 mb-6 text-sm text-slate-400">
                    <DynamicIcon name={itemIcon || 'FileText'} size={14} className="text-violet-400" />
                    <span className="font-semibold text-slate-200">{itemName}</span>
                </div>

                {error && (
                    <div className="flex items-center gap-2 text-rose-400 bg-rose-500/10 px-4 py-2 rounded-lg mb-6 text-xs w-full justify-center">
                        <AlertCircle size={14} />
                        <span>Código PIN incorreto.</span>
                    </div>
                )}

                {recoveryStatus && (
                    <div className="text-center text-xs text-violet-300 bg-violet-500/10 px-4 py-3 rounded-lg mb-6 w-full leading-normal">
                        {recoveryStatus}
                    </div>
                )}

                <div className="flex flex-col items-center w-full">
                    {/* Dots displaying PIN input progress */}
                    <div className="flex gap-4 mb-8">
                        {[0, 1, 2, 3].map((_, i) => (
                            <div 
                                key={i}
                                className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                                    i < inputValue.length ? 'bg-violet-500 scale-110 shadow-[0_0_8px_rgba(139,92,246,0.8)]' : 'bg-slate-800 border border-slate-700'
                                }`}
                            />
                        ))}
                    </div>

                    {/* Numeric Keyboard */}
                    <div className="grid grid-cols-3 gap-3 w-full">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                            <button
                                key={num}
                                onClick={() => handleInput(num.toString())}
                                className="w-full h-12 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-200 text-lg font-medium transition-colors border border-slate-700/50"
                            >
                                {num}
                            </button>
                        ))}
                        <button
                            onClick={handleClear}
                            className="w-full h-12 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 text-xs font-semibold transition-colors border border-slate-700/50"
                        >
                            LIMPAR
                        </button>
                        <button
                            onClick={() => handleInput('0')}
                            className="w-full h-12 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-200 text-lg font-medium transition-colors border border-slate-700/50"
                        >
                            0
                        </button>
                        <button
                            onClick={() => handleSubmit()}
                            className="w-full h-12 bg-gradient-to-tr from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl font-medium transition-all flex items-center justify-center shadow-lg"
                        >
                            <Unlock size={18} />
                        </button>
                    </div>
                </div>

                {/* Recover PIN Trigger */}
                <button 
                    onClick={handleRecovery}
                    disabled={recovering}
                    className="mt-8 text-xs text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                    {recovering ? (
                        <>
                            <Loader2 className="animate-spin" size={12} />
                            <span>Processando...</span>
                        </>
                    ) : (
                        <>
                            <KeyRound size={12} />
                            <span>Esqueci meu PIN (Recuperar via E-mail)</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
