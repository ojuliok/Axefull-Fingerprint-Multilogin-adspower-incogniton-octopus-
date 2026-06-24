import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Fingerprint, Eye, EyeOff, Loader2, WifiOff, RefreshCw, ArrowLeft, Phone } from 'lucide-react';

export type FormMode = 'login' | 'register' | 'forgot-password';

function OfflineScreen({ onRetry }: { onRetry: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center gap-6 text-center px-8">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                <WifiOff size={32} className="text-red-400" />
            </div>
            <div>
                <h2 className="text-xl font-semibold text-theme-text mb-2">Sem conexão com a internet</h2>
                <p className="text-sm text-zinc-400 max-w-xs">
                    O Axe MultiLogin requer conexão com a internet para verificar sua licença. Conecte-se e tente novamente.
                </p>
            </div>
            <button
                onClick={onRetry}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-theme-text text-sm font-medium transition-colors"
            >
                <RefreshCw size={15} />
                Tentar novamente
            </button>
        </div>
    );
}

function LoadingScreen() {
    return (
        <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 size={32} className="text-blue-400 animate-spin" />
            <p className="text-sm text-zinc-400">Verificando sessão...</p>
        </div>
    );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    icon?: React.ReactNode;
}

function Field({ label, icon, ...props }: InputProps) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{label}</label>
            <div className="relative">
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                        {icon}
                    </div>
                )}
                <input
                    {...props}
                    className={`w-full bg-zinc-800/60 border border-zinc-700/60 rounded-lg ${icon ? 'pl-10' : 'px-3.5'} pr-3.5 py-2.5 text-sm text-theme-text placeholder-zinc-500 outline-none focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/30 transition-all`}
                />
            </div>
        </div>
    );
}

interface FormProps {
    mode: FormMode;
    onChangeMode: (mode: FormMode) => void;
}

function AuthForm({ mode, onChangeMode }: FormProps) {
    const { login, register } = useAuth();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resetSent, setResetSent] = useState(false);

    // Format phone number as user types: (99) 99999-9999
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.slice(0, 11);
        if (value.length > 7) {
            value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
        } else if (value.length > 2) {
            value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
        } else if (value.length > 0) {
            value = `(${value}`;
        }
        setPhone(value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // ── Forgot password ──
        if (mode === 'forgot-password') {
            if (!email.trim()) {
                setError('Informe seu email');
                return;
            }
            setLoading(true);
            try {
                if (window.api && window.api.auth && (window.api.auth as any).resetPassword) {
                    const res = await (window.api.auth as any).resetPassword(email);
                    if (!res.success) {
                        setError(res.error ?? 'Erro ao enviar email');
                        return;
                    }
                }
                setResetSent(true);
            } catch (err: any) {
                setError(err.message || 'Erro ao enviar email de recuperação');
            } finally {
                setLoading(false);
            }
            return;
        }

        // ── Register validations ──
        if (mode === 'register') {
            if (password !== confirmPassword) {
                setError('As senhas não coincidem');
                return;
            }
            if (password.length < 8) {
                setError('A senha deve ter pelo menos 8 caracteres');
                return;
            }
        }

        setLoading(true);
        try {
            const result = mode === 'login'
                ? await login(email, password)
                : await register(email, password, name || undefined);

            if (!result.success) {
                setError(result.error ?? 'Ocorreu um erro');
            }
        } finally {
            setLoading(false);
        }
    };

    // ── Forgot password: success state ──
    if (mode === 'forgot-password' && resetSent) {
        return (
            <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center">
                    <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-theme-text mb-1">Email enviado!</h3>
                    <p className="text-sm text-zinc-400 max-w-xs">
                        Enviamos um link de recuperação para <span className="text-theme-text font-medium">{email}</span>. Verifique sua caixa de entrada e spam.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => { setResetSent(false); onChangeMode('login'); }}
                    className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors mt-2"
                >
                    <ArrowLeft size={14} />
                    Voltar ao login
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
            {mode === 'register' && (
                <Field
                    label="Nome (opcional)"
                    type="text"
                    placeholder="Seu nome"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    autoComplete="name"
                />
            )}

            <Field
                label="Email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
            />

            {mode === 'register' && (
                <Field
                    label="Telefone Celular"
                    type="tel"
                    placeholder="(99) 99999-9999"
                    value={phone}
                    onChange={handlePhoneChange}
                    autoComplete="tel"
                    icon={<Phone size={15} />}
                />
            )}

            {mode !== 'forgot-password' && (
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Senha</label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                            className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-lg px-3.5 py-2.5 pr-10 text-sm text-theme-text placeholder-zinc-500 outline-none focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/30 transition-all"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                    </div>
                </div>
            )}

            {mode === 'register' && (
                <Field
                    label="Confirmar senha"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                />
            )}

            {mode === 'login' && (
                <div className="flex justify-end -mt-1">
                    <button
                        type="button"
                        onClick={() => onChangeMode('forgot-password')}
                        className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                    >
                        Esqueceu sua senha?
                    </button>
                </div>
            )}

            {error && (
                <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-theme-text text-sm font-semibold transition-colors flex items-center justify-center gap-2 mt-1"
            >
                {loading && <Loader2 size={15} className="animate-spin" />}
                {mode === 'login' ? 'Entrar' : mode === 'register' ? 'Criar conta' : 'Enviar link de recuperação'}
            </button>

            <div className="text-center text-xs text-zinc-500 pt-1">
                {mode === 'login' && (
                    <>
                        Não tem uma conta?{' '}
                        <button
                            type="button"
                            onClick={() => onChangeMode('register')}
                            className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                        >
                            Criar conta gratuita
                        </button>
                    </>
                )}
                {mode === 'register' && (
                    <>
                        Já tem uma conta?{' '}
                        <button
                            type="button"
                            onClick={() => onChangeMode('login')}
                            className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                        >
                            Fazer login
                        </button>
                    </>
                )}
                {mode === 'forgot-password' && (
                    <button
                        type="button"
                        onClick={() => onChangeMode('login')}
                        className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-medium transition-colors mx-auto"
                    >
                        <ArrowLeft size={13} />
                        Voltar ao login
                    </button>
                )}
            </div>
        </form>
    );
}

export interface LoginPageProps {
    initialMode?: FormMode;
    onBack?: () => void;
}

export default function LoginPage({ initialMode = 'login', onBack }: LoginPageProps) {
    const { state, retryConnection } = useAuth();
    const [mode, setMode] = useState<FormMode>(initialMode);

    const getTitle = () => {
        switch (mode) {
            case 'login': return 'Bem-vindo de volta';
            case 'register': return 'Criar conta';
            case 'forgot-password': return 'Recuperar senha';
        }
    };

    const getSubtitle = () => {
        switch (mode) {
            case 'login': return 'Entre com suas credenciais para continuar';
            case 'register': return 'Comece gratuitamente, sem cartão de crédito';
            case 'forgot-password': return 'Informe seu email para receber o link de recuperação';
        }
    };

    return (
        <div className="flex h-screen bg-zinc-950 overflow-hidden">
            {/* Left panel — branding */}
            <div className="hidden lg:flex flex-col justify-between w-2/5 bg-zinc-900 border-r border-zinc-800/60 p-10">
                <div className="flex items-center gap-2.5">
                    <Fingerprint size={22} className="text-blue-400" />
                    <span className="text-theme-text font-bold text-lg tracking-tight">Axe MultiLogin</span>
                </div>

                <div>
                    <h1 className="text-3xl font-bold text-theme-text leading-tight mb-4">
                        Múltiplas identidades.<br />
                        Uma ferramenta.
                    </h1>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                        Gerencie perfis de navegador isolados com fingerprints únicos, proxies dedicados e proteção anti-detecção de nível profissional.
                    </p>

                    <div className="mt-8 flex flex-col gap-3">
                        {[
                            { title: 'Fingerprint Generator', desc: 'Identidades únicas e consistentes' },
                            { title: 'Proxy por perfil', desc: 'Isolamento total de rede' },
                            { title: 'MetaClean', desc: 'Remova metadados de arquivos' },
                        ].map(item => (
                            <div key={item.title} className="flex items-start gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                                <div>
                                    <span className="text-sm font-medium text-theme-text">{item.title}</span>
                                    <span className="text-xs text-zinc-500 ml-2">{item.desc}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <p className="text-xs text-zinc-600">© 2025 Axe MultiLogin. Todos os direitos reservados.</p>
            </div>

            {/* Right panel — form */}
            <div className="flex-1 flex items-center justify-center p-8 relative">
                {onBack && (
                    <button 
                        onClick={onBack} 
                        className="absolute top-8 left-8 flex items-center gap-2 text-sm text-zinc-400 hover:text-theme-text transition-colors"
                    >
                        <ArrowLeft size={16} /> Voltar para a página principal
                    </button>
                )}
                
                <div className="w-full max-w-sm">
                    {/* Mobile logo */}
                    <div className="flex lg:hidden items-center gap-2 justify-center mb-8">
                        <Fingerprint size={22} className="text-blue-400" />
                        <span className="text-theme-text font-bold text-lg tracking-tight">Axe MultiLogin</span>
                    </div>

                    {state === 'loading' && <LoadingScreen />}

                    {state === 'offline' && <OfflineScreen onRetry={retryConnection} />}

                    {(state === 'unauthenticated') && (
                        <div className="flex flex-col gap-6">
                            <div>
                                <h2 className="text-xl font-bold text-theme-text">
                                    {getTitle()}
                                </h2>
                                <p className="text-sm text-zinc-400 mt-1">
                                    {getSubtitle()}
                                </p>
                            </div>

                            <AuthForm mode={mode} onChangeMode={setMode} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

