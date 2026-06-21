export const isWebMode = (): boolean => {
    const isElectronAPI = typeof window !== 'undefined' && !!(window as any).api;

    const isElectronProcess = typeof window !== 'undefined' && 
                       (window as any).process && 
                       (window as any).process.versions && 
                       (window as any).process.versions.electron;
                       
    const isLocalhost = typeof window !== 'undefined' && 
                        (window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1');

    return !isElectronAPI && !isElectronProcess && !isLocalhost;
};
