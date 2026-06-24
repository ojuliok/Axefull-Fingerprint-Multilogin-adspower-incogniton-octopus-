import React, { useState } from 'react';
import { useTheme, Theme, ButtonStyle, Layout } from '../context/ThemeContext';
import { 
    Sliders, Sparkles, Palette, HelpCircle, AlertCircle, 
    Heart, Star, Check, Info, ArrowRight, User, Settings, Layers,
    AlignLeft, AlignCenter, AlignRight, AlignJustify
} from 'lucide-react';

const THEMES: { id: Theme; name: string; desc: string }[] = [
    { id: 'dark', name: 'Dark Mode', desc: 'Preto puro com acentos violeta' },
    { id: 'light', name: 'Light Mode', desc: 'Interface limpa e contrastante' },
    { id: 'retro-vintage', name: 'Retro Vintage', desc: 'Tons terra, bege e laranja retrô' },
    { id: 'cyber-retro', name: 'Cyber Retro', desc: 'Visual retrowave com acentos néon' },
    { id: 'luxury-supreme', name: 'Luxury Supreme', desc: 'Luxo em tons de ouro e preto' },
    { id: 'cool-tech', name: 'Cool Tech', desc: 'Acentos em verde laser tecnológico' },
    { id: 'pool-vibe', name: 'Pool Vibe', desc: 'Refrescante azul turquesa piscina' },
    { id: 'custom', name: 'Custom Theme', desc: 'Cores personalizadas do usuário' }
];

const BUTTON_STYLES: { id: ButtonStyle; name: string }[] = [
    { id: 'default', name: 'Default (Estilo Tema)' },
    { id: 'retro-striped', name: 'Retro Striped' },
    { id: 'gold-gradient', name: 'Gold Gradient' },
    { id: 'cyber-neon', name: 'Cyber Neon' },
    { id: 'glossy-pill', name: 'Glossy Pill' },
    { id: 'glass-card', name: 'Glass Card' }
];

const LAYOUTS: { id: Layout; name: string }[] = [
    { id: 'classic-sidebar', name: 'Classic Sidebar' },
    { id: 'top-navigation', name: 'Top Navigation' },
    { id: 'floating-dock', name: 'Floating Dock' },
    { id: 'split-panel', name: 'Split Panel' },
    { id: 'futuristic-console', name: 'Futuristic Console' }
];

export default function VitrinePage() {
    const { 
        theme, setTheme, 
        layout, setLayout, 
        buttonStyle, setButtonStyle, 
        customColors, setCustomColors 
    } = useTheme();

    const [testInput, setTestInput] = useState('');
    const [testToggle, setTestToggle] = useState(false);
    const [testRange, setTestRange] = useState(50);

    return (
        <div className="flex-1 h-full overflow-y-auto p-8 bg-theme-base entrance-zoom-out-container">
            {/* Header */}
            <div className="mb-8 border-b border-theme-border pb-6">
                <div className="flex items-center gap-3 mb-2">
                    <Sliders className="text-theme-brand w-8 h-8" style={{ color: 'var(--brand-primary)' }} />
                    <h1 className="text-3xl font-extrabold tracking-tight gradient-text">Vitrine de Componentes</h1>
                </div>
                <p className="text-theme-text-muted text-sm max-w-2xl">
                    Este é o ambiente Sandbox do Design System da plataforma. Utilize os controles abaixo para alternar temas, estilos de botões e layouts em tempo real, validando o contraste, equilíbrio estético e consistência da UI.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Coluna de Configuração */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Seletor de Temas Globais */}
                    <div className="glass-card p-6 border border-theme-border/40">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-theme-text">
                            <Palette size={18} className="text-theme-brand" style={{ color: 'var(--brand-primary)' }} />
                            Temas do Sistema
                        </h2>
                        <div className="space-y-2">
                            {THEMES.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setTheme(t.id)}
                                    className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between ${
                                        theme === t.id 
                                            ? 'bg-theme-surface border-theme-brand text-theme-text shadow-glow-sm' 
                                            : 'bg-theme-surface/40 border-theme-border/40 text-theme-text-muted hover:bg-theme-surface/70'
                                    }`}
                                    style={theme === t.id ? { borderColor: 'var(--brand-primary)' } : {}}
                                >
                                    <div>
                                        <div className="font-semibold text-xs">{t.name}</div>
                                        <div className="text-[10px] opacity-60 mt-0.5">{t.desc}</div>
                                    </div>
                                    {theme === t.id && <Check size={14} className="text-theme-brand" style={{ color: 'var(--brand-primary)' }} />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Seletor de Estilos de Botão e Layouts */}
                    <div className="glass-card p-6 border border-theme-border/40 space-y-6">
                        <div>
                            <h3 className="text-sm font-bold mb-3 text-theme-text flex items-center gap-2">
                                <Sparkles size={14} /> Estilo de Botão Global
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                {BUTTON_STYLES.map(style => (
                                    <button
                                        key={style.id}
                                        onClick={() => setButtonStyle(style.id)}
                                        className={`p-2 rounded text-[11px] font-semibold border transition-all text-center ${
                                            buttonStyle === style.id 
                                                ? 'bg-theme-surface border-theme-brand text-theme-text' 
                                                : 'bg-theme-surface/30 border-theme-border/30 text-theme-text-muted hover:bg-theme-surface/60'
                                        }`}
                                        style={buttonStyle === style.id ? { borderColor: 'var(--brand-primary)' } : {}}
                                    >
                                        {style.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="border-t border-theme-border/30 pt-4">
                            <h3 className="text-sm font-bold mb-3 text-theme-text flex items-center gap-2">
                                <Layers size={14} /> Layout do Console
                            </h3>
                            <div className="space-y-1.5">
                                {LAYOUTS.map(l => (
                                    <button
                                        key={l.id}
                                        onClick={() => setLayout(l.id)}
                                        className={`w-full text-left p-2 rounded text-xs font-medium transition-all flex items-center justify-between ${
                                            layout === l.id 
                                                ? 'bg-theme-surface border-l-2 border-theme-brand pl-3 text-theme-text' 
                                                : 'bg-transparent text-theme-text-muted hover:bg-theme-surface/30 pl-2'
                                        }`}
                                        style={layout === l.id ? { borderLeftColor: 'var(--brand-primary)' } : {}}
                                    >
                                        {l.name}
                                        {layout === l.id && <div className="w-1.5 h-1.5 rounded-full bg-theme-brand" style={{ backgroundColor: 'var(--brand-primary)' }} />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Coluna da Vitrine Interativa */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Botões Showcase */}
                    <div className="glass-card p-6 border border-theme-border/40">
                        <h2 className="text-lg font-bold mb-4 text-theme-text border-b border-theme-border/30 pb-2">Botões Interativos e Estados</h2>
                        <p className="text-[11px] text-theme-text-muted mb-4">Os botões abaixo herdam o estilo ativo global (<strong>{buttonStyle}</strong>). Passe o mouse e clique para sentir a resposta tátil (micro-animações e transformações de escala).</p>
                        
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xs font-bold text-theme-text-muted mb-3 uppercase tracking-wider">Variantes de Ação</h3>
                                <div className="flex flex-wrap gap-3">
                                    <button className="btn btn-primary">Botão Primário <ArrowRight size={14} /></button>
                                    <button className="btn btn-secondary">Botão Secundário</button>
                                    <button className="btn btn-danger">Ação Perigosa</button>
                                    <button className="btn btn-primary" disabled>Desabilitado</button>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xs font-bold text-theme-text-muted mb-3 uppercase tracking-wider font-mono">Classes Customizadas (.btn-* / overrides)</h3>
                                <div className="flex flex-wrap gap-3">
                                    <button className="primaryBtn">primaryBtn</button>
                                    <button className="secondaryBtn">secondaryBtn</button>
                                    <button className="saveBtn">saveBtn (Salvar)</button>
                                    <button className="cancelBtn">cancelBtn (Cancelar)</button>
                                    <button className="deletePropBtn">deletePropBtn</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Inputs e Formulários Showcase */}
                    <div className="glass-card p-6 border border-theme-border/40">
                        <h2 className="text-lg font-bold mb-4 text-theme-text border-b border-theme-border/30 pb-2">Controles de Formulário e Inputs</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-theme-text-muted mb-1.5 uppercase">Input de Texto Comum</label>
                                    <input 
                                        type="text" 
                                        placeholder="Digite algo..." 
                                        className="w-full bg-theme-base border border-theme-border rounded-lg px-3 py-2 text-sm text-theme-text focus:outline-none"
                                        value={testInput}
                                        onChange={(e) => setTestInput(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-theme-text-muted mb-1.5 uppercase">Dropdown / Selector</label>
                                    <select className="w-full bg-theme-base border border-theme-border rounded-lg px-3 py-2 text-sm text-theme-text focus:outline-none">
                                        <option>Opção Recomendada A</option>
                                        <option>Opção Secundária B</option>
                                        <option>Opção de Desenvolvedor C</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-theme-text-muted mb-1.5 uppercase">Controle de Intervalo (Slider)</label>
                                    <div className="flex items-center gap-3">
                                        <input 
                                            type="range" 
                                            min="0" 
                                            max="100" 
                                            value={testRange} 
                                            onChange={(e) => setTestRange(parseInt(e.target.value))}
                                            className="flex-1 accent-theme-brand"
                                            style={{ accentColor: 'var(--brand-primary)' }}
                                        />
                                        <span className="text-xs font-mono text-theme-text-muted min-w-[30px]">{testRange}%</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-theme-text-muted mb-2 uppercase">Custom Toggle Switch</label>
                                    <label className="inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={testToggle} 
                                            onChange={(e) => setTestToggle(e.target.checked)} 
                                            className="sr-only peer"
                                        />
                                        <div className="relative w-11 h-6 bg-theme-elevated peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-theme-brand" style={testToggle ? { backgroundColor: 'var(--brand-primary)' } : {}}></div>
                                        <span className="ms-3 text-xs font-medium text-theme-text-muted">Estado: {testToggle ? 'Ligado' : 'Desligado'}</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Vidro e Brilhos Showcase */}
                    <div className="glass-card p-6 border border-theme-border/40">
                        <h2 className="text-lg font-bold mb-4 text-theme-text border-b border-theme-border/30 pb-2">Vidros & Sombras Néon (Glow)</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Níveis de Glassmorfismo */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-theme-text-muted uppercase">Efeito Acrílico (Glassmorphism)</h3>
                                <div className="glass-blur-sm bg-theme-card/30 p-4 border border-theme-border/20 rounded-lg">
                                    <div className="text-xs font-bold">glass-blur-sm</div>
                                    <div className="text-[10px] text-theme-text-muted mt-0.5">Desfocagem leve (4px). Perfeito para inputs ou cartões leves.</div>
                                </div>
                                <div className="glass-blur-md bg-theme-card/50 p-4 border border-theme-border/30 rounded-lg">
                                    <div className="text-xs font-bold">glass-blur-md</div>
                                    <div className="text-[10px] text-theme-text-muted mt-0.5">Desfocagem padrão (12px). Recomendado para painéis e barras.</div>
                                </div>
                                <div className="glass-blur-lg bg-theme-card/75 p-4 border border-theme-border/40 rounded-lg">
                                    <div className="text-xs font-bold">glass-blur-lg</div>
                                    <div className="text-[10px] text-theme-text-muted mt-0.5">Desfocagem profunda (24px). Ideal para popovers e menus contextuais.</div>
                                </div>
                            </div>

                            {/* Sombras Glow */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-theme-text-muted uppercase">Brilho Néon (Theme Glows)</h3>
                                <div className="bg-theme-surface/50 p-3 rounded-lg border border-theme-border/30 shadow-glow-violet flex items-center justify-between">
                                    <span className="text-xs font-bold">Glow Violeta</span>
                                    <span className="text-[10px] text-theme-text-muted font-mono">.shadow-glow-violet</span>
                                </div>
                                <div className="bg-theme-surface/50 p-3 rounded-lg border border-theme-border/30 shadow-glow-emerald flex items-center justify-between">
                                    <span className="text-xs font-bold text-green-400">Glow Esmeralda</span>
                                    <span className="text-[10px] text-theme-text-muted font-mono">.shadow-glow-emerald</span>
                                </div>
                                <div className="bg-theme-surface/50 p-3 rounded-lg border border-theme-border/30 shadow-glow-rose flex items-center justify-between">
                                    <span className="text-xs font-bold text-pink-400">Glow Rosa</span>
                                    <span className="text-[10px] text-theme-text-muted font-mono">.shadow-glow-rose</span>
                                </div>
                                <div className="bg-theme-surface/50 p-3 rounded-lg border border-theme-border/30 shadow-glow-blue flex items-center justify-between">
                                    <span className="text-xs font-bold text-blue-400">Glow Azul</span>
                                    <span className="text-[10px] text-theme-text-muted font-mono">.shadow-glow-blue</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
