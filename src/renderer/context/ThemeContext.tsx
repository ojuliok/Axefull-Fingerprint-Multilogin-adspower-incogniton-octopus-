import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'dark' | 'light' | 'retro-vintage' | 'cyber-retro' | 'luxury-supreme' | 'cool-tech' | 'pool-vibe';
export type Layout = 'classic-sidebar' | 'top-navigation' | 'floating-dock' | 'split-panel' | 'futuristic-console';
export type ButtonStyle = 'default' | 'retro-striped' | 'gold-gradient' | 'cyber-neon' | 'glossy-pill' | 'glass-card';

interface ThemeContextValue {
    theme: Theme;
    layout: Layout;
    buttonStyle: ButtonStyle;
    setTheme: (theme: Theme) => void;
    setLayout: (layout: Layout) => void;
    setButtonStyle: (style: ButtonStyle) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
    theme: 'dark',
    layout: 'classic-sidebar',
    buttonStyle: 'default',
    setTheme: () => {},
    setLayout: () => {},
    setButtonStyle: () => {},
    toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(() => {
        const stored = localStorage.getItem('axe-theme') as Theme | null;
        return stored || 'dark';
    });

    const [layout, setLayoutState] = useState<Layout>(() => {
        const stored = localStorage.getItem('axe-layout') as Layout | null;
        return stored || 'classic-sidebar';
    });

    const [buttonStyle, setButtonStyleState] = useState<ButtonStyle>(() => {
        const stored = localStorage.getItem('axe-button-style') as ButtonStyle | null;
        return stored || 'default';
    });

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

    const setTheme = (t: Theme) => setThemeState(t);
    const setLayout = (l: Layout) => setLayoutState(l);
    const setButtonStyle = (s: ButtonStyle) => setButtonStyleState(s);

    const toggleTheme = () => {
        setThemeState(t => {
            if (t === 'dark') return 'light';
            if (t === 'light') return 'retro-vintage';
            if (t === 'retro-vintage') return 'cyber-retro';
            if (t === 'cyber-retro') return 'luxury-supreme';
            if (t === 'luxury-supreme') return 'cool-tech';
            if (t === 'cool-tech') return 'pool-vibe';
            return 'dark';
        });
    };

    return (
        <ThemeContext.Provider value={{ theme, layout, buttonStyle, setTheme, setLayout, setButtonStyle, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);

