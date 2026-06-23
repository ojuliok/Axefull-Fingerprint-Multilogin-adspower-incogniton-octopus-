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
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
            <div className="w-[380px] bg-[#0c0d0e] border border-white/10 rounded-2xl p-8 shadow-2xl flex flex-col items-center">
                
                <div className="w-16 h-16 bg-violet-500/20 rounded-full flex items-center justify-center mb-6">
                    <Lock size={32} className="text-violet-400" />
                </div>
                
                <h2 className="text-xl font-bold text-white mb-2">Plataforma Bloqueada</h2>
                <p className="text-sm text-slate-400 mb-8 text-center">
                    {mode === 'pin' ? 'Digite seu PIN de segurança' : 'Digite sua senha secundária'}
                </p>

                {error && (
                    <div className="flex items-center gap-2 text-rose-400 bg-rose-500/10 px-4 py-2 rounded-lg mb-6 text-sm">
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
                                        i < inputValue.length ? 'bg-violet-400 scale-110 shadow-[0_0_10px_rgba(139,92,246,0.5)]' : 'bg-white/10'
                                    }`}
                                />
                            ))}
                        </div>

                        <div className="grid grid-cols-3 gap-4 w-full px-4">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                <button
                                    key={num}
                                    onClick={() => handleInput(num.toString())}
                                    className="w-full h-14 bg-white/5 hover:bg-white/10 rounded-xl text-white text-xl font-medium transition-colors"
                                >
                                    {num}
                                </button>
                            ))}
                            <button
                                onClick={handleClear}
                                className="w-full h-14 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 text-sm font-medium transition-colors"
                            >
                                LIMPAR
                            </button>
                            <button
                                onClick={() => handleInput('0')}
                                className="w-full h-14 bg-white/5 hover:bg-white/10 rounded-xl text-white text-xl font-medium transition-colors"
                            >
                                0
                            </button>
                            <button
                                onClick={() => handleSubmit()}
                                className="w-full h-14 bg-violet-600 hover:bg-violet-500 rounded-xl text-white text-sm font-medium transition-colors flex items-center justify-center"
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
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors"
                            autoFocus
                        />
                        <button
                            type="submit"
                            className="w-full h-12 bg-violet-600 hover:bg-violet-500 rounded-xl text-white font-medium transition-colors flex items-center justify-center gap-2"
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
                        className="mt-8 text-sm text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-2"
                    >
                        <KeyRound size={14} />
                        {mode === 'pin' ? 'Usar Senha Secundária' : 'Usar PIN'}
                    </button>
                )}
            </div>
        </div>
    );
};
