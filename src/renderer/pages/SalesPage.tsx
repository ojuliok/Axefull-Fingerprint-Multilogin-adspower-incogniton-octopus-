import React, { useState, useEffect } from 'react';
import { 
    Fingerprint, Shield, Cpu, Zap, Lock, EyeOff, FileDigit, 
    ArrowRight, CheckCircle2, Globe, Activity, UploadCloud
} from 'lucide-react';

interface SalesPageProps {
    onLogin: () => void;
    onRegister: () => void;
}

export default function SalesPage({ onLogin, onRegister }: SalesPageProps) {
    const [scrolled, setScrolled] = useState(false);
    
    // Interactive MetaClean widget state
    const [metaStatus, setMetaStatus] = useState<'idle' | 'cleaning' | 'clean'>('idle');

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleMetaCleanDemo = () => {
        if (metaStatus !== 'idle') return;
        setMetaStatus('cleaning');
        setTimeout(() => setMetaStatus('clean'), 2000);
        setTimeout(() => setMetaStatus('idle'), 5000);
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-blue-500/30 overflow-x-hidden">
            {/* Header / Nav */}
            <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800/50 py-3' : 'bg-transparent py-5'}`}>
                <div className="container mx-auto px-6 max-w-7xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="relative">
                            <Fingerprint size={28} className="text-blue-500 relative z-10" />
                            <div className="absolute inset-0 bg-blue-500 blur-md opacity-50 z-0"></div>
                        </div>
                        <span className="text-xl font-bold tracking-tight text-white">Axe<span className="text-blue-500">Full</span></span>
                    </div>
                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-300">
                        <a href="#features" className="hover:text-white transition-colors">Recursos</a>
                        <a href="#technology" className="hover:text-white transition-colors">Tecnologia</a>
                        <a href="#security" className="hover:text-white transition-colors">Segurança</a>
                    </nav>
                    <div className="flex items-center gap-4">
                        <button onClick={onLogin} className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">
                            Entrar
                        </button>
                        <button onClick={onRegister} className="px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-sm font-bold shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all hover:shadow-[0_0_25px_rgba(37,99,235,0.6)]">
                            Criar Conta
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
                {/* Background effects */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>
                
                <div className="container mx-auto px-6 max-w-7xl relative z-10">
                    <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-xs font-medium text-blue-400 mb-8 backdrop-blur-sm">
                            <Zap size={14} className="animate-pulse" />
                            <span>Motor Anti-Detect Avançado v1.0</span>
                        </div>
                        
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
                            Controle Absoluto.<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-600">
                                Múltiplas Identidades.
                            </span><br />
                            Um Só Sistema.
                        </h1>
                        
                        <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl leading-relaxed">
                            O Axe Full é o motor definitivo para contingência avançada. 
                            Proteja suas operações com fingerprints consistentes, proxies isolados e remoção nativa de metadados.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                            <button onClick={onRegister} className="w-full sm:w-auto px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] group">
                                Começar Agora
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button onClick={onLogin} className="w-full sm:w-auto px-8 py-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 text-white font-bold text-lg transition-all flex items-center justify-center gap-2">
                                Fazer Login
                            </button>
                        </div>
                        
                        <div className="mt-12 flex items-center gap-6 text-sm text-zinc-500">
                            <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> Sem cartão de crédito</div>
                            <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> Setup instantâneo</div>
                            <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> Suporte VIP</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Interactive Demo Section */}
            <section id="technology" className="py-20 bg-zinc-900/30 border-y border-zinc-800/50">
                <div className="container mx-auto px-6 max-w-7xl">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-3xl font-bold mb-6">Engenharia de Consistência e <span className="text-blue-400">Privacidade Total</span>.</h2>
                            <p className="text-zinc-400 leading-relaxed mb-8">
                                Não usamos simples randomizações. O Axe Full constrói identidades digitais coesas em todas as camadas de hardware e software: Canvas, WebGL, Áudio, Bateria, e Fontes. 
                                Nenhuma API escapa da nossa blindagem.
                            </p>
                            <ul className="space-y-4">
                                {[
                                    { icon: Cpu, text: 'Spoofing de Hardware (CPU, GPU, RAM)' },
                                    { icon: Globe, text: 'Isolamento de Rede (WebRTC, Proxies)' },
                                    { icon: EyeOff, text: 'Proteção contra rastreamento avançado' }
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-zinc-300">
                                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                            <item.icon size={20} className="text-blue-400" />
                                        </div>
                                        {item.text}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        
                        {/* Interactive Widget */}
                        <div className="relative p-1 rounded-2xl bg-gradient-to-b from-zinc-800 to-zinc-950">
                            <div className="absolute inset-0 bg-blue-500/5 blur-xl"></div>
                            <div className="relative bg-zinc-950 rounded-xl p-6 border border-zinc-800/80 shadow-2xl">
                                <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
                                    <div className="flex items-center gap-2">
                                        <Activity size={18} className="text-blue-400" />
                                        <span className="font-semibold text-sm tracking-wide">Live Fingerprint Analysis</span>
                                    </div>
                                    <span className="flex h-2 w-2 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                    </span>
                                </div>
                                
                                <div className="space-y-3 font-mono text-xs">
                                    <div className="flex justify-between items-center p-2 rounded bg-zinc-900/50">
                                        <span className="text-zinc-500">User-Agent</span>
                                        <span className="text-green-400 truncate max-w-[200px]">Mozilla/5.0 (Windows NT 10.0)...</span>
                                    </div>
                                    <div className="flex justify-between items-center p-2 rounded bg-zinc-900/50">
                                        <span className="text-zinc-500">WebGL Vendor</span>
                                        <span className="text-green-400">Google Inc. (NVIDIA)</span>
                                    </div>
                                    <div className="flex justify-between items-center p-2 rounded bg-zinc-900/50">
                                        <span className="text-zinc-500">Canvas Hash</span>
                                        <span className="text-green-400">e2a6b9f8d...</span>
                                    </div>
                                    <div className="flex justify-between items-center p-2 rounded bg-zinc-900/50">
                                        <span className="text-zinc-500">AudioContext</span>
                                        <span className="text-green-400">Suspended (Spoofed)</span>
                                    </div>
                                </div>
                                
                                <div className="mt-6 pt-4 border-t border-zinc-800 text-center">
                                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-500 bg-green-500/10 px-3 py-1 rounded-full">
                                        <Shield size={12} />
                                        Status: Indetectável (100% Coeso)
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-24">
                <div className="container mx-auto px-6 max-w-7xl">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Ferramentas Projetadas para Escala</h2>
                        <p className="text-zinc-400 text-lg">
                            Tudo o que você precisa para gerenciar dezenas ou centenas de operações simultâneas sem cruzamento de dados.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Feature 1 */}
                        <div className="p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800 hover:border-blue-500/50 transition-colors group">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Fingerprint size={24} className="text-blue-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Spoofing Realista</h3>
                            <p className="text-zinc-400 text-sm leading-relaxed">
                                Geração de fingerprints matematicamente prováveis, evitando anomalias que acionam bloqueios nos sistemas de segurança modernos.
                            </p>
                        </div>

                        {/* Feature 2 - MetaClean Widget */}
                        <div className="p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800 hover:border-indigo-500/50 transition-colors group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <FileDigit size={100} />
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <FileDigit size={24} className="text-indigo-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">MetaClean Nativo</h3>
                            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                                Remova dados EXIF, metadados ocultos e rastros de mídia antes de fazer upload em suas campanhas, direto no painel.
                            </p>
                            
                            <button 
                                onClick={handleMetaCleanDemo}
                                disabled={metaStatus !== 'idle'}
                                className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                                    metaStatus === 'idle' ? 'bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30' :
                                    metaStatus === 'cleaning' ? 'bg-zinc-800 text-zinc-400' :
                                    'bg-green-500/20 text-green-400'
                                }`}
                            >
                                {metaStatus === 'idle' && <><UploadCloud size={16} /> Limpar Arquivo Teste</>}
                                {metaStatus === 'cleaning' && <><Activity size={16} className="animate-spin" /> Processando...</>}
                                {metaStatus === 'clean' && <><CheckCircle2 size={16} /> 100% Limpo</>}
                            </button>
                        </div>

                        {/* Feature 3 */}
                        <div className="p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800 hover:border-emerald-500/50 transition-colors group">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Lock size={24} className="text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Isolamento Seguro</h3>
                            <p className="text-zinc-400 text-sm leading-relaxed">
                                Cada perfil executa em seu próprio container lógico. Cookies, LocalStorage e Cache nunca se comunicam, prevenindo vazamentos.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-600/5"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-[400px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>
                
                <div className="container mx-auto px-6 max-w-4xl relative z-10 text-center">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">Pronto para blindar suas operações?</h2>
                    <p className="text-xl text-zinc-300 mb-10 max-w-2xl mx-auto">
                        Junte-se a profissionais de tráfego, agências e operadores que exigem o máximo de performance e segurança.
                    </p>
                    <button onClick={onRegister} className="px-10 py-5 rounded-2xl bg-white text-zinc-950 font-bold text-xl hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                        Criar Minha Conta Gratuita
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 border-t border-zinc-800/50 bg-zinc-950 text-center text-zinc-500 text-sm">
                <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Fingerprint size={18} />
                        <span className="font-semibold text-zinc-400">Axe MultiLogin</span>
                    </div>
                    <p>© 2026 Axe MultiLogin. Todos os direitos reservados.</p>
                </div>
            </footer>
        </div>
    );
}
