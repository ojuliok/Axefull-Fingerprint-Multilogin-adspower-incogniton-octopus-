import React from 'react';
import { Plus, X, Folder } from 'lucide-react';

export interface TabItem {
    canvasId: string;
    canvasName: string;
    canvasType?: string;
    splitViewCanvasId?: string;
    splitViewCanvasName?: string;
    splitViewCanvasType?: string;
}

interface CanvasTabBarProps {
    openTabs: TabItem[];
    activeTabIndex: number;
    activePane: 'main' | 'split';
    styles: Record<string, string>;
    showNewTabMenu: boolean;
    onSelectTab: (index: number, pane?: 'main' | 'split') => void;
    onCloseTab: (index: number) => void;
    onToggleNewTabMenu: () => void;
    onCreateNewTab: () => void;
    onSelectExistingTab: () => void;
}

export const CanvasTabBar: React.FC<CanvasTabBarProps> = React.memo(({
    openTabs,
    activeTabIndex,
    activePane,
    styles,
    showNewTabMenu,
    onSelectTab,
    onCloseTab,
    onToggleNewTabMenu,
    onCreateNewTab,
    onSelectExistingTab
}) => {
    if (!openTabs || openTabs.length === 0) return null;

    return (
        <div className={styles.tabsStrip}>
            <div className={styles.tabsList}>
                {openTabs.map((tab, idx) => {
                    const isActive = idx === activeTabIndex;
                    return (
                        <div
                            key={`${tab.canvasId}-${idx}`}
                            className={`${styles.tabItem} ${isActive ? styles.tabItemActive : ''}`}
                            onClick={() => onSelectTab(idx, 'main')}
                        >
                            <span className={styles.tabTitle}>{tab.canvasName || 'Sem Título'}</span>
                            <button
                                className={styles.tabCloseBtn}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onCloseTab(idx);
                                }}
                                title="Fechar aba"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    );
                })}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <button
                        className={styles.tabAddBtn}
                        onClick={onToggleNewTabMenu}
                        title="Nova aba"
                    >
                        <Plus size={14} />
                    </button>
                    {showNewTabMenu && (
                        <div className={styles.newTabMenuContainer}>
                            <button className={styles.newTabMenuItem} onClick={onCreateNewTab}>
                                <Plus size={14} /> Criar Novo
                            </button>
                            <button className={styles.newTabMenuItem} onClick={onSelectExistingTab}>
                                <Folder size={14} /> Selecionar Existente
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

CanvasTabBar.displayName = 'CanvasTabBar';
