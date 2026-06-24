import React, { useState } from 'react';
import { useSecurity } from '../../context/SecurityContext';
import { Lock, Unlock, KeyRound, AlertCircle } from 'lucide-react';

export const LockScreen: React.FC = () => {
    const { isLocked, pin, secondPassword, unlock } = useSecurity();
    const [inputValue, setInputValue] = useState('');
    const [error, setError] = useState(false);
    const [mode, setMode] = useState<'pin' | 'password'>(pin ? 'pin' : 'password');

    if (!isLocked) return null;

    const handleInput = (val: string) => {
        setError(false);
        setInputValue(prev => prev + val);
    };

    const handleClear = () => {
        setInputValue('');
        setError(false);
    };

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        
        const success = unlock(inputValue);
        if (!success) {
            setError(true);
            setInputValue('');
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center backdrop-blur-md" style={{ backgroundColor: 'var(--bg-overlay)' }}>
            <div className="w-[380px] bg-theme-card border border-theme-border rounded-2xl p-8 shadow-2xl flex flex-col items-center">
                
                <div className="w-16 h-16 bg-[var(--brand-primary)]/20 rounded-full flex items-center justify-center mb-6">
                    <Lock size={32} className="text-[var(--brand-primary-light)]" />
                </div>
                
                <h2 className="text-xl font-bold text-theme-text mb-2">Plataforma Bloqueada</h2>
                <p className="text-sm text-theme-text-muted mb-8 text-center">
                    {mode === 'pin' ? 'Digite seu PIN de segurança' : 'Digite sua senha secundária'}
                </p>

                {error && (
                    <div className="flex items-center gap-2 text-[var(--danger)] bg-[var(--danger-light)] px-4 py-2 rounded-lg mb-6 text-sm">
                        <AlertCircle size={14} />
                        <span>Código incorreto. Tente novamente.</span>
                    </div>
                )}

                {mode === 'pin' && (
                    <div className="flex flex-col items-center w-full">
                        <div className="flex gap-4 mb-8">
                            {[0, 1, 2, 3].map((_, i) => (
                                <div 
                                    key={i}
                                    className={`w-4 h-4 rounded-full transition-all duration-300 ${
                                        i < inputValue.length ? 'bg-[var(--brand-primary)] scale-110 shadow-[0_0_10px_var(--brand-primary)]' : 'bg-theme-elevated border border-theme-border'
                                    }`}
                                />
                            ))}
                        </div>

                        <div className="grid grid-cols-3 gap-4 w-full px-4">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                <button
                                    key={num}
                                    onClick={() => handleInput(num.toString())}
                                    className="w-full h-14 bg-theme-elevated hover:bg-theme-border rounded-xl text-theme-text text-xl font-medium transition-colors border border-theme-border"
                                >
                                    {num}
                                </button>
                            ))}
                            <button
                                onClick={handleClear}
                                className="w-full h-14 bg-theme-elevated hover:bg-theme-border rounded-xl text-theme-text-muted text-sm font-medium transition-colors border border-theme-border"
                            >
                                LIMPAR
                            </button>
                            <button
                                onClick={() => handleInput('0')}
                                className="w-full h-14 bg-theme-elevated hover:bg-theme-border rounded-xl text-theme-text text-xl font-medium transition-colors border border-theme-border"
                            >
                                0
                            </button>
                            <button
                                onClick={() => handleSubmit()}
                                className="w-full h-14 rounded-xl text-theme-inverse font-medium transition-colors flex items-center justify-center shadow-lg"
                                style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-dark))', color: 'var(--bg-primary)' }}
                            >
                                <Unlock size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {mode === 'password' && (
                    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
                        <input 
                            type="password"
                            value={inputValue}
                            onChange={(e) => {
                                setInputValue(e.target.value);
                                setError(false);
                            }}
                            placeholder="Sua senha..."
                            className="w-full bg-theme-elevated border border-theme-border rounded-xl px-4 py-3 text-theme-text focus:outline-none focus:border-[var(--brand-primary)] transition-colors"
                            autoFocus
                        />
                        <button
                            type="submit"
                            className="w-full h-12 rounded-xl text-theme-inverse font-medium transition-colors flex items-center justify-center gap-2 shadow-lg"
                            style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-dark))', color: 'var(--bg-primary)' }}
                        >
                            <Unlock size={16} /> Desbloquear
                        </button>
                    </form>
                )}

                {pin && secondPassword && (
                    <button 
                        onClick={() => {
                            setMode(mode === 'pin' ? 'password' : 'pin');
                            setInputValue('');
                            setError(false);
                        }}
                        className="mt-8 text-sm text-[var(--brand-primary)] hover:text-[var(--brand-primary-dark)] transition-colors flex items-center gap-2"
                    >
                        <KeyRound size={14} />
                        {mode === 'pin' ? 'Usar Senha Secundária' : 'Usar PIN'}
                    </button>
                )}
            </div>
        </div>
    );
};
