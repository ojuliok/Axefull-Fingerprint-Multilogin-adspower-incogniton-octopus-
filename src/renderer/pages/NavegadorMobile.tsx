import React, { useState } from 'react';
import { Search, Globe, Shield, RefreshCw, Lock } from 'lucide-react';

const NavegadorMobile: React.FC = () => {
    const [url, setUrl] = useState('https://google.com');
    const [inputUrl, setInputUrl] = useState('https://google.com');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        let finalUrl = inputUrl.trim();
        if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
            finalUrl = `https://${finalUrl}`;
        }
        setUrl(finalUrl);
        setInputUrl(finalUrl);
    };

    return (
        <div className="flex flex-col w-full h-full bg-theme-base">
            {/* Topbar / Navigation */}
            <div className="flex items-center px-3 py-2 gap-2 shadow-sm z-10 border-b bg-theme-surface border-theme-border">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-theme-base text-theme-text-muted">
                    <Shield size={16} />
                </div>
                
                <form onSubmit={handleSearch} className="flex-1 flex items-center px-3 h-10 rounded-full border bg-theme-base border-theme-border">
                    <Lock size={14} className="text-emerald-500 mr-2" />
                    <input
                        type="text"
                        value={inputUrl}
                        onChange={(e) => setInputUrl(e.target.value)}
                        placeholder="Pesquisar ou digitar URL"
                        className="flex-1 bg-transparent border-none outline-none text-sm w-full text-theme-text"
                    />
                    <button type="submit" className="ml-2 text-theme-text-muted hover:text-blue-500">
                        <Search size={16} />
                    </button>
                </form>

                <button 
                    onClick={() => { setUrl(url); }} 
                    className="flex items-center justify-center w-8 h-8 rounded-full text-theme-text-muted active:bg-theme-border"
                >
                    <RefreshCw size={16} />
                </button>
            </div>

            {/* Browser Content */}
            <div className="flex-1 w-full bg-theme-card relative">
                {url ? (
                    <iframe 
                        src={url}
                        className="w-full h-full border-none"
                        title="Mobile Browser Preview"
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-theme-text-muted">
                        <Globe size={48} className="mb-4 opacity-20" />
                        <p>Nenhuma página carregada</p>
                    </div>
                )}

                {/* Fingerprint / Camouflage Indicator (Fake for now) */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-theme-text text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                    <Shield size={12} />
                    <span>Camuflagem Ativa (User-Agent Móvel)</span>
                </div>
            </div>
        </div>
    );
};

export default NavegadorMobile;
