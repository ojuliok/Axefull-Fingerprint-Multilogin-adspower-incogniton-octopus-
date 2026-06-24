import React from 'react';
import { useTheme, CustomThemeColors, defaultCustomColors } from '../../context/ThemeContext';
import { Palette, RefreshCw } from 'lucide-react';

export const ThemeEditor: React.FC = () => {
    const { theme, setTheme, customColors, setCustomColors } = useTheme();

    const isCustom = theme === 'custom';

    const handleColorChange = (key: keyof CustomThemeColors, value: string) => {
        setCustomColors({
            ...customColors,
            [key]: value
        });
        if (!isCustom) {
            setTheme('custom');
        }
    };

    const handleReset = () => {
        setCustomColors(defaultCustomColors);
    };

    const colorPickers: { label: string; key: keyof CustomThemeColors; description: string }[] = [
        { label: 'Fundo Geral', key: '--bg-primary', description: 'Parte de trás da aplicação' },
        { label: 'Sidebar / Painéis', key: '--bg-secondary', description: 'Menu lateral e modais' },
        { label: 'Cards / Componentes', key: '--bg-card', description: 'Cartões e tabelas' },
        { label: 'Cor Primária', key: '--brand-primary', description: 'Botões e destaques' },
        { label: 'Texto Principal', key: '--text-primary', description: 'Títulos' },
        { label: 'Texto Secundário', key: '--text-secondary', description: 'Descrições' },
        { label: 'Bordas', key: '--border-default', description: 'Linhas divisórias' }
    ];

    return (
        <div className="flex flex-col gap-6 w-full animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-theme-text flex items-center gap-2">
                        <Palette size={20} className="text-[var(--brand-primary)]" />
                        Editor Visual Avançado
                    </h3>
                    <p className="text-sm text-theme-text-muted mt-1">
                        Crie seu próprio tema selecionando as cores de cada estrutura da interface.
                    </p>
                </div>
                {isCustom && (
                    <button 
                        onClick={handleReset}
                        className="btn-secondary text-xs flex items-center gap-2 px-3 py-1.5"
                    >
                        <RefreshCw size={14} /> Resetar
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {colorPickers.map((picker) => (
                    <div 
                        key={picker.key} 
                        className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${
                            isCustom ? 'bg-theme-card border-theme-border' : 'bg-theme-card/50 border-theme-border/50 opacity-70'
                        }`}
                        onClick={() => {
                            if (!isCustom) setTheme('custom');
                        }}
                    >
                        <div className="flex flex-col">
                            <span className="font-semibold text-theme-text text-sm">{picker.label}</span>
                            <span className="text-[10px] text-theme-text-muted mt-0.5">{picker.description}</span>
                        </div>
                        <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-theme-border cursor-pointer shadow-sm group">
                            <input 
                                type="color" 
                                value={customColors[picker.key]} 
                                onChange={(e) => handleColorChange(picker.key, e.target.value)}
                                className="absolute inset-[-10px] w-16 h-16 cursor-pointer opacity-0 z-10"
                            />
                            <div 
                                className="w-full h-full"
                                style={{ backgroundColor: customColors[picker.key] }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Slider de Bordas/Arredondamento */}
            <div className={`p-4 rounded-xl border flex flex-col gap-3 transition-colors ${
                isCustom ? 'bg-theme-card border-theme-border' : 'bg-theme-card/50 border-theme-border/50 opacity-70'
            }`}>
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="font-semibold text-theme-text text-sm">Arredondamento / Contornos</span>
                        <span className="text-[10px] text-theme-text-muted mt-0.5">Ajuste o nível de curva (border-radius) dos painéis e cartões</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-[var(--brand-primary)] bg-[var(--brand-primary)]/10 px-2 py-1 rounded">
                        {customColors['--radius-md']}
                    </span>
                </div>
                <input 
                    type="range" 
                    min="0" 
                    max="24" 
                    step="1"
                    value={parseInt(customColors['--radius-md']) || 0}
                    onChange={(e) => handleColorChange('--radius-md', `${e.target.value}px`)}
                    className="w-full h-2 bg-theme-elevated rounded-lg appearance-none cursor-pointer"
                    style={{ accentColor: 'var(--brand-primary)' }}
                />
            </div>

            <div className="bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/20 rounded-lg p-4 mt-2">
                <p className="text-sm text-theme-text font-medium text-center">
                    {isCustom 
                        ? 'Você está usando o Tema Customizado. Qualquer alteração acima refletirá imediatamente em todo o sistema.' 
                        : 'Clique em qualquer cor acima para ativar o Tema Customizado.'}
                </p>
            </div>
        </div>
    );
};
