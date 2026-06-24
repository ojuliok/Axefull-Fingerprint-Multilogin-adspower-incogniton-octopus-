import React from 'react';
import { Download, Monitor, ShieldCheck, Zap } from 'lucide-react';

const DownloadPage: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-theme-base text-theme-text">
            <div className="max-w-md p-8 rounded-2xl flex flex-col items-center text-center bg-theme-surface shadow-sm border border-theme-border">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg mb-6">
                    <Monitor size={32} className="text-theme-text" />
                </div>
                
                <h1 className="text-2xl font-bold mb-3 tracking-tight">Baixe o Aplicativo Desktop</h1>
                
                <p className="text-sm mb-8 text-theme-text-muted">
                    Para utilizar recursos avançados como o <strong>MultiLogin</strong> e <strong>MetaClean</strong>, você precisa instalar o aplicativo nativo para o seu sistema.
                </p>

                <div className="flex flex-col gap-3 w-full mb-8">
                    <div className="flex items-center gap-3 p-3 rounded-lg text-left bg-theme-base border border-theme-border">
                        <ShieldCheck size={20} className="text-emerald-500 shrink-0" />
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-theme-text">Fingerprint 100% Nativo</span>
                            <span className="text-[11px] text-theme-text-muted">Proteção anti-detect a nível de sistema operacional</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg text-left bg-theme-base border border-theme-border">
                        <Zap size={20} className="text-amber-500 shrink-0" />
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-theme-text">Desempenho Extremo</span>
                            <span className="text-[11px] text-theme-text-muted">Gestão de multilogin sem travamentos e com aceleração de GPU</span>
                        </div>
                    </div>
                </div>

                <a 
                    href="https://github.com/fagneraxefull/axefull-fingerprint/releases" 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-theme-text font-medium transition-colors"
                >
                    <Download size={18} />
                    <span>Baixar para Windows (MVP)</span>
                </a>
            </div>
        </div>
    );
};

export default DownloadPage;
