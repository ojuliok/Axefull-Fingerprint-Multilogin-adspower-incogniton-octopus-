import React from 'react';
import * as Lucide from 'lucide-react';
import {
    MousePointer2, Pencil, Eraser, Minus, ArrowUpRight,
    Square, Globe, FileText, ListTodo, Table, LayoutTemplate, Type,
    Image, Users, Smile, Share2, Filter, Grid, ScrollText,
    Lock, Unlock, Plus
} from 'lucide-react';
import { useCanvasContext } from '../hooks/CanvasContext';
import styles from '../InfiniteCanvas.module.css';

interface CanvasToolbarProps {
    clearStrokes: () => void;
    addFreeTextAt: (x: number, y: number) => void;
    addFrameNode: () => void;
    addBrowserNode: () => void;
    addPageNode: () => void;
    addCardNode: () => void;
    addChecklistNode: () => void;
    addTableNode: () => void;
    fileInputRef: React.RefObject<HTMLInputElement>;
    docInputRef: React.RefObject<HTMLInputElement>;
    setShowProfilePicker: (v: boolean) => void;
    setShowPickerPopover: (v: boolean) => void;
    setShowSocialPicker: (v: boolean) => void;
    setShowFunnelPicker: (v: boolean) => void;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
    clearStrokes,
    addFreeTextAt,
    addFrameNode,
    addBrowserNode,
    addPageNode,
    addCardNode,
    addChecklistNode,
    addTableNode,
    fileInputRef,
    docInputRef,
    setShowProfilePicker,
    setShowPickerPopover,
    setShowSocialPicker,
    setShowFunnelPicker
}) => {
    const {
        activeTool, setActiveTool,
        isToolLocked, setIsToolLocked,
        strokes,
        gridSnap, setGridSnap,
        viewMode, setViewMode,
        viewport
    } = useCanvasContext();

    return (
        <div className={styles.canvasDock}>
            {/* Lock Tool toggle */}
            <button 
                onClick={() => setIsToolLocked(!isToolLocked)} 
                className={isToolLocked ? styles.toolActive : ''} 
                title={isToolLocked ? "Ferramenta travada (clique para destravar)" : "Travar ferramenta após desenhar"}
            >
                {isToolLocked ? <Lock size={16} /> : <Unlock size={16} />}
            </button>

            <div className={styles.dockDivider} />

            {/* 1. Seleção e Mão */}
            <button 
                onClick={() => setActiveTool('select')} 
                className={activeTool === 'select' ? styles.toolActive : ''} 
                title="Cursor / Selecionar (V)"
            >
                <MousePointer2 size={18} />
            </button>
            <button 
                onClick={() => setActiveTool('hand')} 
                className={activeTool === 'hand' ? styles.toolActive : ''} 
                title="Mão / Pan (H)"
            >
                <Lucide.Hand size={18} />
            </button>

            <div className={styles.dockDivider} />

            {/* 2. Formas Geométricas */}
            <div className={styles.dockPopoverContainer}>
                <button 
                    className={['rectangle', 'diamond', 'ellipse', 'line', 'arrow', 'triangle', 'blockArrow', 'elbowArrow'].includes(activeTool) ? styles.toolActive : ''} 
                    title="Formas Geométricas"
                >
                    <Lucide.Shapes size={18} />
                </button>
                <div className={styles.dockPopover} style={{ minWidth: '180px', flexDirection: 'column', gap: '2px', padding: '6px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#a78bfa', padding: '4px 8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Formas</div>
                    
                    <button className={`${styles.ctxMenuItem} ${activeTool === 'rectangle' ? styles.toolActive : ''}`} style={{ width: '100%', justifyContent: 'flex-start', height: '28px', fontSize: '12px' }} onClick={() => setActiveTool('rectangle')}><Square size={14} style={{ marginRight: 8 }} /> Retângulo <span style={{ marginLeft: 'auto', opacity: 0.5 }}>R</span></button>
                    <button className={`${styles.ctxMenuItem} ${activeTool === 'ellipse' ? styles.toolActive : ''}`} style={{ width: '100%', justifyContent: 'flex-start', height: '28px', fontSize: '12px' }} onClick={() => setActiveTool('ellipse')}><Lucide.Circle size={14} style={{ marginRight: 8 }} /> Elipse <span style={{ marginLeft: 'auto', opacity: 0.5 }}>O</span></button>
                    <button className={`${styles.ctxMenuItem} ${activeTool === 'diamond' ? styles.toolActive : ''}`} style={{ width: '100%', justifyContent: 'flex-start', height: '28px', fontSize: '12px' }} onClick={() => setActiveTool('diamond')}><Lucide.Triangle size={14} style={{ marginRight: 8, transform: 'rotate(45deg)' }} /> Losango <span style={{ marginLeft: 'auto', opacity: 0.5 }}>D</span></button>
                    <button className={`${styles.ctxMenuItem} ${activeTool === 'line' ? styles.toolActive : ''}`} style={{ width: '100%', justifyContent: 'flex-start', height: '28px', fontSize: '12px' }} onClick={() => setActiveTool('line')}><Minus size={14} style={{ marginRight: 8, transform: 'rotate(-45deg)' }} /> Linha <span style={{ marginLeft: 'auto', opacity: 0.5 }}>L</span></button>
                    <button className={`${styles.ctxMenuItem} ${activeTool === 'arrow' ? styles.toolActive : ''}`} style={{ width: '100%', justifyContent: 'flex-start', height: '28px', fontSize: '12px' }} onClick={() => setActiveTool('arrow')}><ArrowUpRight size={14} style={{ marginRight: 8 }} /> Seta <span style={{ marginLeft: 'auto', opacity: 0.5 }}>A</span></button>
                    <button className={`${styles.ctxMenuItem} ${activeTool === 'elbowArrow' ? styles.toolActive : ''}`} style={{ width: '100%', justifyContent: 'flex-start', height: '28px', fontSize: '12px' }} onClick={() => setActiveTool('elbowArrow')}><Lucide.CornerDownRight size={14} style={{ marginRight: 8 }} /> Seta em cotovelo</button>
                    <button className={`${styles.ctxMenuItem} ${activeTool === 'blockArrow' ? styles.toolActive : ''}`} style={{ width: '100%', justifyContent: 'flex-start', height: '28px', fontSize: '12px' }} onClick={() => setActiveTool('blockArrow')}><ArrowUpRight size={14} style={{ marginRight: 8, strokeWidth: 3 }} /> Seta em bloco</button>
                    <div style={{ height: 1, background: '#ffffff1a', margin: '4px 0' }} />
                    <button className={`${styles.ctxMenuItem} ${activeTool === 'triangle' ? styles.toolActive : ''}`} style={{ width: '100%', justifyContent: 'flex-start', height: '28px', fontSize: '12px' }} onClick={() => setActiveTool('triangle')}><Lucide.Triangle size={14} style={{ marginRight: 8 }} /> Triângulo</button>
                </div>
            </div>

            {/* 3. Desenho Livre & Texto */}
            <div className={styles.dockPopoverContainer}>
                <button 
                    className={['pen', 'arrowPen'].includes(activeTool) ? styles.toolActive : ''} 
                    title="Canetas e Desenho Livre"
                >
                    <Pencil size={18} />
                </button>
                <div className={styles.dockPopover} style={{ minWidth: '180px', flexDirection: 'column', gap: '2px', padding: '6px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#a78bfa', padding: '4px 8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Desenho</div>
                    
                    <button className={`${styles.ctxMenuItem} ${activeTool === 'pen' ? styles.toolActive : ''}`} style={{ width: '100%', justifyContent: 'flex-start', height: '28px', fontSize: '12px' }} onClick={() => setActiveTool('pen')}><Pencil size={14} style={{ marginRight: 8 }} /> Caneta Livre <span style={{ marginLeft: 'auto', opacity: 0.5 }}>P</span></button>
                    <button className={`${styles.ctxMenuItem} ${activeTool === 'arrowPen' ? styles.toolActive : ''}`} style={{ width: '100%', justifyContent: 'flex-start', height: '28px', fontSize: '12px' }} onClick={() => setActiveTool('arrowPen')}><Lucide.ChevronRightSquare size={14} style={{ marginRight: 8 }} /> Caneta com Seta</button>
                    
                    {strokes.length > 0 && (
                        <>
                            <div className={styles.ctxMenuDivider} />
                            <button className={styles.ctxMenuItem} style={{ width: '100%', justifyContent: 'flex-start', height: '28px', fontSize: '12px', color: '#ef4444' }} onClick={clearStrokes}><Eraser size={14} style={{ marginRight: 8 }} /> Apagar desenhos</button>
                        </>
                    )}
                </div>
            </div>

            <button 
                onClick={() => {
                    const pos = { x: -viewport.x/viewport.zoom + 200, y: -viewport.y/viewport.zoom + 200 };
                    addFreeTextAt(pos.x, pos.y);
                }} 
                title="Adicionar Texto (T)"
            >
                <Type size={18} />
            </button>

            <div className={styles.dockDivider} />

            {/* 4. Componentes Axe Workspace */}
            <div className={styles.dockPopoverContainer}>
                <button title="Inserir Componentes (Notion, Tabelas, Perfis...)"><Plus size={18} /><Lucide.ChevronDown size={10} style={{ marginLeft: 2 }} /></button>
                <div className={styles.dockPopover} style={{ minWidth: '220px', flexDirection: 'column', gap: '2px', padding: '6px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#a78bfa', padding: '4px 8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Componentes</div>
                    <button className={styles.ctxMenuItem} style={{ width: '100%', justifyContent: 'flex-start', height: '28px', fontSize: '12px' }} onClick={() => addFrameNode()}><LayoutTemplate size={14} style={{ marginRight: 8 }} /> Frame Agrupador</button>
                    <button className={styles.ctxMenuItem} style={{ width: '100%', justifyContent: 'flex-start', height: '28px', fontSize: '12px' }} onClick={() => addBrowserNode()}><Globe size={14} style={{ marginRight: 8 }} /> Navegador Interno</button>
                    <button className={styles.ctxMenuItem} style={{ width: '100%', justifyContent: 'flex-start', height: '28px', fontSize: '12px' }} onClick={() => addPageNode()}><FileText size={14} style={{ marginRight: 8 }} /> Página Notion</button>
                    <button className={styles.ctxMenuItem} style={{ width: '100%', justifyContent: 'flex-start', height: '28px', fontSize: '12px' }} onClick={() => addCardNode()}><Lucide.Notebook size={14} style={{ marginRight: 8 }} /> Card Notion</button>
                    <button className={styles.ctxMenuItem} style={{ width: '100%', justifyContent: 'flex-start', height: '28px', fontSize: '12px' }} onClick={() => addChecklistNode()}><ListTodo size={14} style={{ marginRight: 8 }} /> Lista de Tarefas</button>
                    <button className={styles.ctxMenuItem} style={{ width: '100%', justifyContent: 'flex-start', height: '28px', fontSize: '12px' }} onClick={() => addTableNode()}><Table size={14} style={{ marginRight: 8 }} /> Tabela Flexível</button>
                    <div className={styles.ctxMenuDivider} />
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#a78bfa', padding: '4px 8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Arquivos</div>
                    <button className={styles.ctxMenuItem} style={{ width: '100%', justifyContent: 'flex-start', height: '28px', fontSize: '12px' }} onClick={() => fileInputRef.current?.click()}><Image size={14} style={{ marginRight: 8 }} /> Imagem</button>
                    <button className={styles.ctxMenuItem} style={{ width: '100%', justifyContent: 'flex-start', height: '28px', fontSize: '12px' }} onClick={() => docInputRef.current?.click()}><FileText size={14} style={{ marginRight: 8 }} /> Documento</button>
                    <div className={styles.ctxMenuDivider} />
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#a78bfa', padding: '4px 8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Ativos</div>
                    <button className={styles.ctxMenuItem} style={{ width: '100%', justifyContent: 'flex-start', height: '28px', fontSize: '12px' }} onClick={() => { setShowProfilePicker(true); setShowPickerPopover(false); setShowSocialPicker(false); setShowFunnelPicker(false); }}><Users size={14} style={{ marginRight: 8 }} /> Perfil</button>
                    <button className={styles.ctxMenuItem} style={{ width: '100%', justifyContent: 'flex-start', height: '28px', fontSize: '12px' }} onClick={() => { setShowPickerPopover(true); setShowProfilePicker(false); setShowSocialPicker(false); setShowFunnelPicker(false); }}><Smile size={14} style={{ marginRight: 8 }} /> Emoji</button>
                    <button className={styles.ctxMenuItem} style={{ width: '100%', justifyContent: 'flex-start', height: '28px', fontSize: '12px' }} onClick={() => { setShowSocialPicker(true); setShowProfilePicker(false); setShowPickerPopover(false); setShowFunnelPicker(false); }}><Share2 size={14} style={{ marginRight: 8 }} /> Rede Social</button>
                    <button className={styles.ctxMenuItem} style={{ width: '100%', justifyContent: 'flex-start', height: '28px', fontSize: '12px' }} onClick={() => { setShowFunnelPicker(true); setShowProfilePicker(false); setShowPickerPopover(false); setShowSocialPicker(false); }}><Filter size={14} style={{ marginRight: 8 }} /> Funil de Vendas</button>
                </div>
            </div>

            <div className={styles.dockDivider} />

            {/* 5. Ações de Visualização e Grade */}
            <button onClick={() => setGridSnap(!gridSnap)} className={gridSnap ? styles.toolActive : ''} title="Ajustar à Grade"><Grid size={18} /></button>
            <button onClick={() => setViewMode(viewMode === 'canvas' ? 'page' : 'canvas')} className={viewMode === 'page' ? styles.toolActive : ''} title="Modo Documento (Página)"><ScrollText size={18} /></button>
        </div>
    );
};
