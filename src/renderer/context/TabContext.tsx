import React, { createContext, useContext, useState, useEffect } from 'react';

export interface DocTab {
    id: string;
    title: string;
    icon?: string;
    isPinned?: boolean;
    isDirty?: boolean;
}

interface TabContextValue {
    tabs: DocTab[];
    activeTabId: string | null;
    openTab: (tab: DocTab) => void;
    closeTab: (tabId: string) => void;
    setActiveTabId: (tabId: string) => void;
    togglePinTab: (tabId: string) => void;
    updateTabTitle: (tabId: string, title: string, icon?: string) => void;
}

const TabContext = createContext<TabContextValue | null>(null);

export const TabProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [tabs, setTabs] = useState<DocTab[]>(() => {
        const saved = localStorage.getItem('axe_doc_tabs');
        return saved ? JSON.parse(saved) : [];
    });
    
    const [activeTabId, setActiveTabIdState] = useState<string | null>(() => {
        return localStorage.getItem('axe_active_doc_tab') || null;
    });

    useEffect(() => {
        localStorage.setItem('axe_doc_tabs', JSON.stringify(tabs));
    }, [tabs]);

    useEffect(() => {
        if (activeTabId) {
            localStorage.setItem('axe_active_doc_tab', activeTabId);
        } else {
            localStorage.removeItem('axe_active_doc_tab');
        }
    }, [activeTabId]);

    const openTab = (tab: DocTab) => {
        setTabs(prev => {
            const exists = prev.find(t => t.id === tab.id);
            if (exists) return prev;
            return [...prev, tab];
        });
        setActiveTabIdState(tab.id);
    };

    const closeTab = (tabId: string) => {
        setTabs(prev => {
            const newTabs = prev.filter(t => t.id !== tabId);
            if (activeTabId === tabId) {
                const closedIdx = prev.findIndex(t => t.id === tabId);
                const nextActive = newTabs[closedIdx] || newTabs[closedIdx - 1] || null;
                setActiveTabIdState(nextActive ? nextActive.id : null);
            }
            return newTabs;
        });
    };

    const setActiveTabId = (tabId: string) => {
        setActiveTabIdState(tabId);
    };

    const togglePinTab = (tabId: string) => {
        setTabs(prev => prev.map(t => t.id === tabId ? { ...t, isPinned: !t.isPinned } : t));
    };

    const updateTabTitle = (tabId: string, title: string, icon?: string) => {
        setTabs(prev => prev.map(t => t.id === tabId ? { ...t, title, ...(icon !== undefined ? { icon } : {}) } : t));
    };

    return (
        <TabContext.Provider value={{
            tabs,
            activeTabId,
            openTab,
            closeTab,
            setActiveTabId,
            togglePinTab,
            updateTabTitle
        }}>
            {children}
        </TabContext.Provider>
    );
};

export const useTabs = () => {
    const ctx = useContext(TabContext);
    if (!ctx) {
        throw new Error('useTabs must be used within a TabProvider');
    }
    return ctx;
};
