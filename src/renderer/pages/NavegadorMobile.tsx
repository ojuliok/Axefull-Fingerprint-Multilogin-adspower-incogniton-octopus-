import React, { useState } from 'react';
import { Search, Globe, Shield, RefreshCw, Lock } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const NavegadorMobile: React.FC = () => {
    const { theme } = useTheme();
    const isLight = theme === 'light';
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
        <div className={`flex flex-col w-full h-full ${isLight ? 'bg-slate-50' : 'bg-[#09090b]'}`}>
            {/* Topbar / Navigation */}
            <div className={`flex items-center px-3 py-2 gap-2 shadow-sm z-10 border-b ${isLight ? 'bg-white border-slate-200' : 'bg-[#18181b] border-white/10'}`}>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${isLight ? 'bg-slate-100 text-slate-600' : 'bg-white/5 text-slate-400'}`}>
                    <Shield size={16} />
                </div>
                
                <form onSubmit={handleSearch} className={`flex-1 flex items-center px-3 h-10 rounded-full border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/50 border-white/10'}`}>
                    <Lock size={14} className={isLight ? 'text-emerald-500 mr-2' : 'text-emerald-400 mr-2'} />
                    <input
                        type="text"
                        value={inputUrl}
                        onChange={(e) => setInputUrl(e.target.value)}
                        placeholder="Pesquisar ou digitar URL"
                        className="flex-1 bg-transparent border-none outline-none text-sm w-full"
                        style={{ color: isLight ? '#334155' : '#e2e8f0' }}
                    />
                    <button type="submit" className="ml-2 text-slate-400 hover:text-blue-500">
                        <Search size={16} />
                    </button>
                </form>

                <button 
                    onClick={() => { setUrl(url); }} 
                    className={`flex items-center justify-center w-8 h-8 rounded-full ${isLight ? 'text-slate-600 active:bg-slate-100' : 'text-slate-400 active:bg-white/5'}`}
                >
                    <RefreshCw size={16} />
                </button>
            </div>

            {/* Browser Content */}
            <div className="flex-1 w-full bg-white relative">
                {url ? (
                    <iframe 
                        src={url}
                        className="w-full h-full border-none"
                        title="Mobile Browser Preview"
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
                        <Globe size={48} className="opacity-20" />
                        <p className="text-sm">Navegação Segura Mobile</p>
                    </div>
                )}

                {/* Fingerprint / Camouflage Indicator (Fake for now) */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                    <Shield size={12} />
                    <span>Camuflagem Ativa (User-Agent Móvel)</span>
                </div>
            </div>
        </div>
    );
};

export default NavegadorMobile;
