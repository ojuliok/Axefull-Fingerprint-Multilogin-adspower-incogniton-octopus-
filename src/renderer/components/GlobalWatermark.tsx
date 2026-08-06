import React, { useState } from 'react';
import { Heart, X } from 'lucide-react';

export const GlobalWatermark: React.FC = () => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="fixed bottom-4 right-4 z-[99999] flex flex-col items-end gap-2">
            {isExpanded && (
                <div className="bg-theme-surface border border-theme-border rounded-xl shadow-2xl p-4 w-80 animate-fade-in relative backdrop-blur-md">
                    <button 
                        onClick={() => setIsExpanded(false)}
                        className="absolute top-2 right-2 text-theme-text-muted hover:text-theme-text transition-colors p-1"
                    >
                        <X size={16} />
                    </button>
                    
                    <div className="flex items-center gap-2 mb-3">
                        <Heart size={20} className="text-pink-500 fill-pink-500/20" />
                        <h3 className="font-semibold text-theme-text">Apoie o Projeto</h3>
                    </div>
                    
                    <div className="text-sm text-theme-text-muted space-y-3">
                        <p>
                            Desenvolvido por <a href="https://cultivegrowth.com" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline font-medium">cultivegrowth.com</a>
                        </p>
                        <p className="text-xs leading-relaxed">
                            Nossa ferramenta principal é o uso da fingerprint. As outras telas estão em evolução e ajudam a organizar dados, informações e ter acesso privado aos seus dados.
                        </p>
                        
                        <div className="bg-theme-base p-3 rounded-lg border border-theme-border/50">
                            <span className="block text-xs font-medium text-theme-text mb-1">Chave PIX para apoio:</span>
                            <div className="font-mono text-sm text-pink-400 font-bold tracking-wide select-all">
                                11988103804
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 bg-theme-surface/80 backdrop-blur-md border border-theme-border px-3 py-1.5 rounded-full shadow-lg hover:bg-theme-surface transition-all group"
            >
                <span className="text-xs font-medium text-theme-text-muted group-hover:text-theme-text transition-colors">
                    Powered by <span className="text-blue-400 font-semibold">CultiveGrowth</span>
                </span>
                <Heart size={14} className="text-pink-500 group-hover:fill-pink-500/30 transition-all" />
            </button>
        </div>
    );
};
