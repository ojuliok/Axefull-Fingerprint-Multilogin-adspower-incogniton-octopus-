import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'dark' | 'light' | 'retro-vintage' | 'cyber-retro' | 'luxury-supreme' | 'cool-tech' | 'pool-vibe' | 'custom';
export type Layout = 'classic-sidebar' | 'top-navigation' | 'floating-dock' | 'split-panel' | 'futuristic-console';
export type ButtonStyle = 'default' | 'retro-striped' | 'gold-gradient' | 'cyber-neon' | 'glossy-pill' | 'glass-card';

export interface CustomThemeColors {
    '--bg-primary': string;
    '--bg-secondary': string;
    '--bg-tertiary': string;
    '--bg-card': string;
    '--text-primary': string;
    '--text-secondary': string;
    '--brand-primary': string;
    '--border-default': string;
    '--radius-md': string;
}

export const defaultCustomColors: CustomThemeColors = {
    '--bg-primary': '#F8FAFC',
    '--bg-secondary': '#F1F5F9',
    '--bg-tertiary': '#E2E8F0',
    '--bg-card': '#FFFFFF',
    '--text-primary': '#0F172A',
    '--text-secondary': '#334155',
    '--brand-primary': '#8B5CF6',
    '--border-default': '#E2E8F0',
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
    layout: 'classic-sidebar',
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
        return stored || 'classic-sidebar';
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

