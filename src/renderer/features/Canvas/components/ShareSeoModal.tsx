import React, { useState, useEffect } from 'react';
import { CanvasInfo } from '../canvasStorage';
import { X, Globe, Copy, Check, ExternalLink, HelpCircle } from 'lucide-react';

interface ShareSeoModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: CanvasInfo;
    onUpdateCanvasInfo?: (id: string, updates: Partial<CanvasInfo>) => void;
}

export const ShareSeoModal: React.FC<ShareSeoModalProps> = ({
    isOpen,
    onClose,
    item,
    onUpdateCanvasInfo
}) => {
    // Read existing properties
    const properties = item.properties || {};
    
    const [isPublic, setIsPublic] = useState<boolean>(properties.isPublic === 'true');
    const [seoTitle, setSeoTitle] = useState<string>(properties.seoTitle || item.name || '');
    const [seoDescription, setSeoDescription] = useState<string>(properties.seoDescription || item.description || '');
    const [customSlug, setCustomSlug] = useState<string>(properties.customSlug || '');
    const [copied, setCopied] = useState<boolean>(false);

    // Sync input when item changes
    useEffect(() => {
        const props = item.properties || {};
        setIsPublic(props.isPublic === 'true');
        setSeoTitle(props.seoTitle || item.name || '');
        setSeoDescription(props.seoDescription || item.description || '');
        setCustomSlug(props.customSlug || '');
    }, [item]);

    if (!isOpen) return null;

    // Helper to generate a clean URL slug from the title
    const handleGenerateSlug = () => {
        const titleToConvert = seoTitle || item.name || '';
        const generated = titleToConvert
            .toLowerCase()
            .normalize('NFD') // Remove accents
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '') // Keep alphanumeric, space, hyphen
            .trim()
            .replace(/\s+/g, '-') // Spaces to hyphens
            .replace(/-+/g, '-'); // Duplicate hyphens
        setCustomSlug(generated);
    };

    const handleSave = () => {
        if (onUpdateCanvasInfo) {
            const updatedProps = {
                ...properties,
                isPublic: isPublic ? 'true' : 'false',
                seoTitle: seoTitle.trim(),
                seoDescription: seoDescription.trim(),
                customSlug: customSlug.trim()
            };
            onUpdateCanvasInfo(item.id, { properties: updatedProps });
        }
        onClose();
    };

    // Calculate public url
    const displaySlug = customSlug.trim() || item.id;
    const publicUrl = `https://axefull.com/shared/${displaySlug}`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(publicUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleOpenLink = () => {
        window.open(publicUrl, '_blank');
    };

    // Filter slug characters to only allow lowercase, numbers, hyphens
    const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const filtered = e.target.value
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '');
        setCustomSlug(filtered);
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="w-[580px] bg-slate-900 border border-violet-500/20 rounded-xl p-6 shadow-2xl relative text-slate-100 flex flex-col gap-4 animate-slide-up">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-violet-600/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
                            <Globe size={18} />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold leading-none">Configurações de Compartilhamento & SEO</h2>
                            <p className="text-xs text-slate-400 mt-1">Defina como este item será indexado e exibido no Google.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-1 font-sans">
                    {/* General Public Share Toggle */}
                    <div className="flex items-center justify-between p-4 bg-slate-950/40 border border-slate-800 rounded-lg">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-medium">Indexar no Google (Tornar Público)</span>
                            <span className="text-xs text-slate-400">Permite que motores de busca encontrem e indexem esta página.</span>
                        </div>
                        <button
                            onClick={() => setIsPublic(!isPublic)}
                            className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 outline-none ${
                                isPublic ? 'bg-violet-600' : 'bg-slate-700'
                            }`}
                        >
                            <span
                                className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                                    isPublic ? 'translate-x-5' : 'translate-x-0'
                                }`}
                            />
                        </button>
                    </div>

                    {isPublic && (
                        <>
                            {/* Google Preview Container */}
                            <div className="flex flex-col gap-1.5">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Visualização no Google (Search Preview)</span>
                                <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-4 font-sans select-none">
                                    <div className="text-xs text-slate-400 flex items-center gap-1 mb-1.5 overflow-hidden text-ellipsis whitespace-nowrap">
                                        <span>https://axefull.com</span>
                                        <span>›</span>
                                        <span>shared</span>
                                        <span>›</span>
                                        <span className="text-slate-300 font-medium">{displaySlug}</span>
                                    </div>
                                    <div className="text-lg text-blue-400 font-medium hover:underline cursor-pointer leading-tight mb-1 overflow-hidden text-ellipsis whitespace-nowrap">
                                        {seoTitle || 'Sem título'} - Axefull
                                    </div>
                                    <div className="text-sm text-slate-300 leading-snug line-clamp-2">
                                        {seoDescription || 'Adicione uma descrição abaixo para ver o snippet de resultado de pesquisa atualizado.'}
                                    </div>
                                </div>
                            </div>

                            {/* SEO Title Input */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    Título de SEO
                                    <span className="text-slate-500 hover:text-slate-300 cursor-help" title="Recomendado: 50-60 caracteres.">
                                        <HelpCircle size={12} />
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    value={seoTitle}
                                    onChange={(e) => setSeoTitle(e.target.value)}
                                    placeholder={item.name || 'Título de SEO'}
                                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500 text-slate-200 transition-colors"
                                />
                            </div>

                            {/* SEO Description TextArea */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    Descrição de SEO
                                    <span className="text-slate-500 hover:text-slate-300 cursor-help" title="Recomendado: 120-160 caracteres para otimizar os resultados de busca.">
                                        <HelpCircle size={12} />
                                    </span>
                                </label>
                                <textarea
                                    value={seoDescription}
                                    onChange={(e) => setSeoDescription(e.target.value)}
                                    placeholder={item.description || 'Descrição detalhada para aparecer nos resultados do Google.'}
                                    rows={3}
                                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500 text-slate-200 transition-colors resize-none"
                                />
                            </div>

                            {/* Custom URL Slug Input */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">URL Amigável (Slug)</label>
                                <div className="flex gap-2">
                                    <div className="flex-1 flex bg-slate-950 border border-slate-800 rounded-lg overflow-hidden focus-within:border-violet-500 transition-colors">
                                        <span className="bg-slate-900 border-r border-slate-800 text-slate-400 text-xs flex items-center px-3 select-none font-mono">
                                            axefull.com/shared/
                                        </span>
                                        <input
                                            type="text"
                                            value={customSlug}
                                            onChange={handleSlugChange}
                                            placeholder={item.id}
                                            className="bg-transparent flex-1 px-3 py-2 text-sm outline-none text-slate-200 font-mono"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleGenerateSlug}
                                        className="bg-slate-800 hover:bg-slate-750 text-slate-200 px-3 py-2 rounded-lg text-xs font-medium transition-colors border border-slate-750"
                                    >
                                        Gerar Slug
                                    </button>
                                </div>
                            </div>

                            {/* Link Copy Options */}
                            <div className="flex items-center justify-between p-3.5 bg-slate-950/30 border border-slate-850 rounded-lg mt-1">
                                <span className="text-xs text-slate-400 max-w-[70%] truncate font-mono select-all">
                                    {publicUrl}
                                </span>
                                <div className="flex gap-1.5">
                                    <button
                                        type="button"
                                        onClick={handleCopyLink}
                                        className="bg-violet-600 hover:bg-violet-700 text-white p-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shadow-md shadow-violet-600/10"
                                    >
                                        {copied ? <Check size={14} /> : <Copy size={14} />}
                                        <span>{copied ? 'Copiado!' : 'Copiar Link'}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleOpenLink}
                                        className="bg-slate-800 hover:bg-slate-750 text-slate-200 p-2 rounded-lg text-xs font-medium transition-colors"
                                        title="Abrir no Navegador"
                                    >
                                        <ExternalLink size={14} />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800 mt-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-850 hover:bg-slate-800 rounded-lg text-xs font-medium transition-colors text-slate-300"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-750 hover:to-indigo-750 text-white rounded-lg text-xs font-medium transition-all shadow-lg shadow-violet-600/20"
                    >
                        Salvar Configurações
                    </button>
                </div>
            </div>
        </div>
    );
};
