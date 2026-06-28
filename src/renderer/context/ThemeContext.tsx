import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'dark' | 'light' | 'retro-vintage' | 'cyber-retro' | 'luxury-supreme' | 'cool-tech' | 'pool-vibe' | 'custom';
export type Layout = 'classic-sidebar' | 'top-navigation' | 'floating-dock' | 'split-panel' | 'futuristic-console';
export type ButtonStyle = 'default' | 'retro-striped' | 'gold-gradient' | 'cyber-neon' | 'glossy-pill' | 'glass-card';

export interface CustomThemeColors {
    [key: string]: string;
}

export const defaultCustomColors: CustomThemeColors = {
    '--bg-primary': '#F8FAFC',
    '--bg-secondary': '#F1F5F9',
    '--bg-tertiary': '#E2E8F0',
    '--bg-card': '#FFFFFF',
    '--bg-card-hover': '#F8FAFC',
    '--bg-elevated': '#FFFFFF',
    '--bg-input': '#FFFFFF',
    '--bg-overlay': 'rgba(15, 23, 42, 0.5)',
    '--glass-bg': 'rgba(255, 255, 255, 0.8)',
    '--glass-border': 'rgba(0, 0, 0, 0.07)',
    '--glass-shadow': '0 8px 32px rgba(0, 0, 0, 0.12)',
    '--text-primary': '#0F172A',
    '--text-secondary': '#334155',
    '--text-tertiary': '#64748B',
    '--text-disabled': '#94A3B8',
    '--text-inverse': '#FFFFFF',
    '--border-default': 'rgba(0, 0, 0, 0.08)',
    '--border-hover': 'rgba(0, 0, 0, 0.18)',
    '--border-focus': 'rgba(124, 58, 237, 0.5)',
    '--shadow-sm': '0 1px 2px rgba(0,0,0,0.07)',
    '--shadow-md': '0 4px 12px rgba(0,0,0,0.10)',
    '--shadow-lg': '0 10px 24px rgba(0,0,0,0.14)',
    '--shadow-xl': '0 20px 48px rgba(0,0,0,0.18)',
    '--shadow-glow': '0 0 24px rgba(124, 58, 237, 0.18)',
    '--shadow-glow-sm': '0 0 12px rgba(124, 58, 237, 0.12)',
    '--brand-primary': '#8B5CF6',
    '--brand-primary-light': '#A78BFA',
    '--brand-primary-dark': '#6D28D9',
    '--brand-secondary': '#3B82F6',
    '--brand-secondary-light': '#60A5FA',
    '--brand-accent': '#EC4899',
    '--brand-accent-light': '#F472B6',
    '--success': '#10B981',
    '--success-light': 'rgba(16, 185, 129, 0.15)',
    '--warning': '#F59E0B',
    '--warning-light': 'rgba(245, 158, 11, 0.15)',
    '--danger': '#EF4444',
    '--danger-light': 'rgba(239, 68, 68, 0.15)',
    '--info': '#3B82F6',
    '--info-light': 'rgba(59, 130, 246, 0.15)',
    '--radius-md': '10px'
};

interface ThemeContextValue {
    theme: Theme;
    layout: Layout;
    buttonStyle: ButtonStyle;
    customColors: CustomThemeColors;
    setTheme: (theme: Theme) => void;
    setLayout: (layout: Layout) => void;
    setButtonStyle: (style: ButtonStyle) => void;
    setCustomColors: (colors: CustomThemeColors) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
    theme: 'cyber-retro',
    layout: 'top-navigation',
    buttonStyle: 'default',
    customColors: defaultCustomColors,
    setTheme: () => {},
    setLayout: () => {},
    setButtonStyle: () => {},
    setCustomColors: () => {},
    toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(() => {
        const stored = localStorage.getItem('axe-theme') as Theme | null;
        return stored || 'cyber-retro';
    });

    const [layout, setLayoutState] = useState<Layout>(() => {
        const stored = localStorage.getItem('axe-layout') as Layout | null;
        return stored || 'top-navigation';
    });

    const [buttonStyle, setButtonStyleState] = useState<ButtonStyle>(() => {
        const stored = localStorage.getItem('axe-button-style') as ButtonStyle | null;
        return stored || 'default';
    });

    const [customColors, setCustomColorsState] = useState<CustomThemeColors>(() => {
        const stored = localStorage.getItem('axe-custom-colors');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                return defaultCustomColors;
            }
        }
        return defaultCustomColors;
    });

    // Handle Custom Theme Style Injection
    useEffect(() => {
        const styleId = 'axe-custom-theme-style';
        let styleEl = document.getElementById(styleId);

        if (theme === 'custom') {
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.id = styleId;
                document.head.appendChild(styleEl);
            }
            
            const cssVars = Object.entries(customColors)
                .map(([key, value]) => `${key}: ${value} !important;`)
                .join('\n  ');
                
            styleEl.textContent = `
[data-theme="custom"] {
  ${cssVars}
}
            `;
        } else {
            if (styleEl) {
                styleEl.remove();
            }
        }
    }, [theme, customColors]);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('axe-theme', theme);
    }, [theme]);

    useEffect(() => {
        document.documentElement.setAttribute('data-layout', layout);
        localStorage.setItem('axe-layout', layout);
    }, [layout]);

    useEffect(() => {
        document.documentElement.setAttribute('data-button-style', buttonStyle);
        localStorage.setItem('axe-button-style', buttonStyle);
    }, [buttonStyle]);

    useEffect(() => {
        localStorage.setItem('axe-custom-colors', JSON.stringify(customColors));
    }, [customColors]);

    const setTheme = (t: Theme) => setThemeState(t);
    const setLayout = (l: Layout) => setLayoutState(l);
    const setButtonStyle = (s: ButtonStyle) => setButtonStyleState(s);
    const setCustomColors = (c: CustomThemeColors) => setCustomColorsState(c);

    const toggleTheme = () => {
        setThemeState(t => {
            if (t === 'dark') return 'light';
            if (t === 'light') return 'custom';
            if (t === 'custom') return 'retro-vintage';
            if (t === 'retro-vintage') return 'cyber-retro';
            if (t === 'cyber-retro') return 'luxury-supreme';
            if (t === 'luxury-supreme') return 'cool-tech';
            if (t === 'cool-tech') return 'pool-vibe';
            return 'dark';
        });
    };

    return (
        <ThemeContext.Provider value={{ theme, layout, buttonStyle, customColors, setTheme, setLayout, setButtonStyle, setCustomColors, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);

