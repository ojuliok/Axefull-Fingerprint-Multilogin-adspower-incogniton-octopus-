import React, { useState, useEffect, useRef } from 'react';
import { GripHorizontal, X, ExternalLink, StickyNote } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';

const FloatingNotes: React.FC = () => {
    const { isNotesFloating, setIsNotesFloating } = useWorkspace();
    const [position, setPosition] = useState({ x: window.innerWidth - 370, y: 100 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartPos = useRef({ x: 0, y: 0 });
    const initialPos = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const handleResize = () => {
            setPosition(prev => ({
                x: Math.min(prev.x, window.innerWidth - 350),
                y: Math.min(prev.y, window.innerHeight - 500)
            }));
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (!isNotesFloating) return null;

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        setIsDragging(true);
        dragStartPos.current = { x: e.clientX, y: e.clientY };
        initialPos.current = { x: position.x, y: position.y };
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging) return;
        const dx = e.clientX - dragStartPos.current.x;
        const dy = e.clientY - dragStartPos.current.y;
        setPosition({
            x: Math.max(0, Math.min(window.innerWidth - 350, initialPos.current.x + dx)),
            y: Math.max(0, Math.min(window.innerHeight - 500, initialPos.current.y + dy))
        });
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        setIsDragging(false);
        e.currentTarget.releasePointerCapture(e.pointerId);
    };

    const handleExpandToOS = async () => {
        setIsNotesFloating(false);
        try {
            await window.api.app.openNotesWidget();
        } catch (error) {
            console.error('Failed to open Notes OS widget', error);
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: '350px',
                height: '500px',
                backgroundColor: '#18181b',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                zIndex: 9998,
                color: 'white',
                fontFamily: 'Inter, sans-serif',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                transition: isDragging ? 'none' : 'box-shadow 0.2s ease, border-color 0.2s ease'
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    cursor: isDragging ? 'grabbing' : 'grab'
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <GripHorizontal size={16} color="#a1a1aa" />
                    <span style={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <StickyNote size={14} color="#f59e0b" /> Notes Widget
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={handleExpandToOS}
                        style={{
                            background: 'transparent', border: 'none', color: '#f59e0b', cursor: 'pointer',
                            padding: '4px', borderRadius: '4px', display: 'flex'
                        }}
                        title="Expandir para o Windows"
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(245,158,11,0.1)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                        <ExternalLink size={16} />
                    </button>
                    <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => setIsNotesFloating(false)}
                        style={{
                            background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer',
                            padding: '4px', borderRadius: '4px', display: 'flex'
                        }}
                        title="Fechar Widget"
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', backgroundColor: '#18181b' }}>
                <p style={{ fontSize: '12px', color: '#a1a1aa', textAlign: 'center', marginTop: '20px' }}>
                    (Widget simplificado. Clique em <b>Expandir</b> para usar as notas independentes do aplicativo).
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                     <button
                        onClick={handleExpandToOS}
                        style={{
                            padding: '8px 16px',
                            background: '#f59e0b',
                            color: 'black',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <ExternalLink size={14} /> Expandir para Fora
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FloatingNotes;
