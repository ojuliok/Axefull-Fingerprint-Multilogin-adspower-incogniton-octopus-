import React, { useState, useEffect } from 'react';
import { GripHorizontal, X, StickyNote } from 'lucide-react';
import { ThemeProvider } from '../context/ThemeContext';

declare global {
  interface Window {
    electron: any;
  }
}

const NotesWidgetWindow: React.FC = () => {
    // Basic state for the standalone widget
    const [notes, setNotes] = useState<any[]>([]);

    useEffect(() => {
        // Here we could listen to IPC or load from a shared db
        const savedNotes = localStorage.getItem('axe_notes_notes');
        if (savedNotes) {
            setNotes(JSON.parse(savedNotes));
        }
        
        // Add a handler to allow dragging the window by clicking the header
        // Electron supports -webkit-app-region: drag for frameless windows
    }, []);

    const handleClose = async () => {
        try {
            await window.api.app.closeNotesWidget();
        } catch (e) {
            console.error('Failed to close widget window', e);
        }
    };

    return (
        <ThemeProvider>
            <div className="flex flex-col h-screen bg-theme-base text-theme-text overflow-hidden rounded-xl border border-theme-border/30">
                {/* Header - Draggable by OS */}
                <div 
                    className="flex items-center justify-between p-3 bg-theme-surface/50 border-b border-theme-border/50 select-none"
                    style={{ WebkitAppRegion: 'drag' } as any}
                >
                    <div className="flex items-center gap-2">
                        <GripHorizontal size={14} className="text-theme-text-muted" />
                        <span className="text-sm font-bold flex items-center gap-2">
                            <StickyNote size={14} className="text-amber-500" />
                            Axe Note
                        </span>
                    </div>
                    
                    {/* Exclude buttons from drag region */}
                    <div style={{ WebkitAppRegion: 'no-drag' } as any}>
                        <button 
                            onClick={handleClose}
                            className="p-1 rounded hover:bg-red-500/20 hover:text-red-500 transition-colors text-theme-text-muted"
                            title="Fechar"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                    {notes.length === 0 ? (
                        <div className="text-center mt-10 text-theme-text-faint text-sm">
                            Nenhuma nota encontrada.
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {notes.map(note => (
                                <div key={note.id} className="p-3 bg-theme-card border border-theme-border rounded-lg">
                                    <h3 className="text-sm font-bold">{note.title || 'Sem Título'}</h3>
                                    <p className="text-xs text-theme-text-muted mt-1 line-clamp-3">
                                        {note.content}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </ThemeProvider>
    );
};

export default NotesWidgetWindow;
