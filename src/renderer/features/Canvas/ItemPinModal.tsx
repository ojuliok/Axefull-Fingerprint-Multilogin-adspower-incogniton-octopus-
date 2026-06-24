import React, { useState } from 'react';
import { Lock, ShieldAlert, Mail, Trash2, CheckCircle, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ItemPinModalProps {
    itemId: string;
    itemName: string;
    initialPin?: string;
    initialRecoveryEmail?: string;
    onSave: (pin: string | null, recoveryEmail: string | null) => Promise<void>;
    onClose: () => void;
}

export const ItemPinModal: React.FC<ItemPinModalProps> = ({
    itemId,
    itemName,
    initialPin,
    initialRecoveryEmail,
    onSave,
    onClose
}) => {
    const { user } = useAuth();
    const [pin, setPin] = useState(initialPin || '');
    const [recoveryEmail, setRecoveryEmail] = useState(initialRecoveryEmail || user?.email || '');
    const [confirmPin, setConfirmPin] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const hasPin = !!initialPin;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (pin.length !== 4 || !/^\d+$/.test(pin)) {
            setError('O PIN deve conter exatamente 4 números.');
            return;
        }

        if (!recoveryEmail || !recoveryEmail.includes('@')) {
            setError('Por favor, insira um e-mail de recuperação válido.');
            return;
        }

        try {
            await onSave(pin, recoveryEmail);
            setSuccess(true);
            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (err: any) {
            setError(err.message || 'Erro ao salvar o PIN.');
        }
    };

    const handleRemove = async () => {
        setError('');
        if (confirmPin !== initialPin) {
            setError('PIN atual incorreto. Confirme seu PIN para remover a proteção.');
            return;
        }

        try {
            await onSave(null, null);
            setSuccess(true);
            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (err: any) {
            setError(err.message || 'Erro ao remover o PIN.');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-[450px] glass-card rounded-xl p-6 shadow-2xl relative animate-fade-in-scale text-theme-text bg-slate-900 border border-violet-500/20">
                <button onClick={onClose} className="absolute top-4 right-4 text-theme-text-muted hover:text-theme-text">
                    <X size={20} />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-violet-600/20 text-violet-500 flex items-center justify-center">
                        <Lock size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">Proteção por PIN</h3>
                        <p className="text-xs text-theme-text-muted">Item: <span className="text-violet-400 font-medium">{itemName}</span></p>
                    </div>
                </div>

                {success ? (
                    <div className="py-6 flex flex-col items-center justify-center text-emerald-400">
                        <CheckCircle size={48} className="mb-3 animate-bounce" />
                        <p className="text-sm font-semibold">Configurações salvas com sucesso!</p>
                    </div>
                ) : hasPin ? (
                    /* Configured PIN: Unlock to edit / remove */
                    <div className="space-y-5">
                        <div className="p-3 bg-violet-500/5 border border-violet-500/10 rounded-lg flex gap-3 text-xs text-slate-300">
                            <ShieldAlert className="text-violet-500 shrink-0" size={16} />
                            <p>Este item já está protegido. Para remover ou alterar a proteção por PIN, insira o PIN atual de 4 dígitos abaixo.</p>
                        </div>

                        {error && <p className="text-xs text-rose-500 bg-rose-500/10 px-3 py-2 rounded-lg">{error}</p>}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">Confirmar PIN Atual</label>
                                <input
                                    type="password"
                                    maxLength={4}
                                    placeholder="••••"
                                    value={confirmPin}
                                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                                    className="w-full bg-theme-base/50 border border-theme-border rounded-lg px-3 py-2 text-center text-xl tracking-widest outline-none focus:border-violet-500"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={handleRemove}
                                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                                >
                                    <Trash2 size={14} />
                                    Remover Proteção
                                </button>
                                <button
                                    onClick={() => {
                                        // Allow setting a new one if user validated the PIN
                                        if (confirmPin === initialPin) {
                                            onSave(null, null); // Clear old first
                                            initialPin = undefined; // Force edit view
                                            setPin('');
                                            setConfirmPin('');
                                        } else {
                                            setError('PIN atual inválido para alteração.');
                                        }
                                    }}
                                    className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-2 rounded-lg text-xs font-semibold transition-colors"
                                >
                                    Alterar PIN
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Set new PIN view */
                    <form onSubmit={handleSave} className="space-y-5">
                        {error && <p className="text-xs text-rose-500 bg-rose-500/10 px-3 py-2 rounded-lg">{error}</p>}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">Escolha um PIN de 4 Dígitos</label>
                                <input
                                    type="password"
                                    maxLength={4}
                                    required
                                    placeholder="••••"
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                    className="w-full bg-theme-base/50 border border-theme-border rounded-lg px-3 py-2 text-center text-xl tracking-widest outline-none focus:border-violet-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                                    <Mail size={12} />
                                    E-mail de Recuperação
                                </label>
                                <input
                                    type="email"
                                    required
                                    placeholder="email@exemplo.com"
                                    value={recoveryEmail}
                                    onChange={(e) => setRecoveryEmail(e.target.value)}
                                    className="w-full bg-theme-base/50 border border-theme-border rounded-lg px-3 py-2 text-xs outline-none focus:border-violet-500"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-lg text-xs font-semibold transition-colors"
                        >
                            Salvar Proteção
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};
