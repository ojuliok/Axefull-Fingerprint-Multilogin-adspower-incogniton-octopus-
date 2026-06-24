import React, { useState, useEffect, useRef } from 'react';
import { 
    StickyNote, Plus, Settings, Star, Trash2, Search, Lock, Unlock, 
    Folder, Send, X, Eye, Edit3, Copy, Check, Shield, HelpCircle
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

// Interfaces for our Note System
export interface Space {
    id: string;
    name: string;
    icon: string; // Emoji or Lucide icon string
    created_at: string;
}

export interface Note {
    id: string;
    spaceId: string;
    title: string;
    content: string; // Markdown text content
    isStarred: boolean;
    created_at: string;
    updated_at: string;
}

export interface NoteBlock {
    type: 'h1' | 'h2' | 'h3' | 'todo' | 'bullet' | 'code' | 'paragraph';
    content: string;
    checked?: boolean;
    language?: string;
    key: string;
}

// Icon list options for Spaces
const SPACE_ICONS = [
    '📁', '🚀', '💡', '🛡️', '⚙️', '📝', '🧠', '💬', '💻', '🎯', 
    '🎨', '💼', '📊', '📅', '🔑', '⭐️', '🌍', '🏠', '🔥', '📚'
];

const NotesPage: React.FC = () => {
    const { toast } = useToast();

    // Notes Data States
    const [spaces, setSpaces] = useState<Space[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [activeSpaceId, setActiveSpaceId] = useState<string>('');
    const [activeNoteId, setActiveNoteId] = useState<string>('');
    
    // UI Interface States
    const [searchQuery, setSearchQuery] = useState('');
    const [isEditMode, setIsEditMode] = useState(false); // Toggle between raw markdown and ChatGPT preview
    const [inputText, setInputText] = useState('');
    const [copiedBlockKey, setCopiedBlockKey] = useState<string | null>(null);

    // Dialog / Modal States
    const [isSpaceModalOpen, setIsSpaceModalOpen] = useState(false);
    const [newSpaceName, setNewSpaceName] = useState('');
    const [newSpaceIcon, setNewSpaceIcon] = useState('📁');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Security PIN States
    const [isLocked, setIsLocked] = useState(false);
    const [pinEnabled, setPinEnabled] = useState(false);
    const [savedPin, setSavedPin] = useState<string | null>(null);
    const [pinInput, setPinInput] = useState('');
    const [isPinIncorrect, setIsPinIncorrect] = useState(false);
    const [tempPin, setTempPin] = useState('');
    const [tempPinConfirm, setTempPinConfirm] = useState('');

    // Load initial data
    useEffect(() => {
        // Load spaces
        const savedSpaces = localStorage.getItem('axe_notes_spaces');
        const savedNotes = localStorage.getItem('axe_notes_notes');
        
        // Security Settings
        const securityEnabled = localStorage.getItem('axe_notes_pin_enabled') === 'true';
        const pin = localStorage.getItem('axe_notes_pin');

        setPinEnabled(securityEnabled);
        setSavedPin(pin);

        if (securityEnabled && pin) {
            setIsLocked(true);
        }

        let parsedSpaces: Space[] = [];
        let parsedNotes: Note[] = [];

        if (savedSpaces) {
            parsedSpaces = JSON.parse(savedSpaces);
            setSpaces(parsedSpaces);
        } else {
            // Seed default spaces
            parsedSpaces = [
                { id: 'space-1', name: 'Ideias de Projetos', icon: '🚀', created_at: new Date().toISOString() },
                { id: 'space-2', name: 'Notas Gerais', icon: '📝', created_at: new Date().toISOString() },
                { id: 'space-3', name: 'Banco de Conhecimento', icon: '🧠', created_at: new Date().toISOString() },
            ];
            setSpaces(parsedSpaces);
            localStorage.setItem('axe_notes_spaces', JSON.stringify(parsedSpaces));
        }

        if (savedNotes) {
            parsedNotes = JSON.parse(savedNotes);
            setNotes(parsedNotes);
        } else {
            // Seed default notes
            parsedNotes = [
                {
                    id: 'note-1',
                    spaceId: 'space-1',
                    title: 'Axe Multi - Próximas Atualizações',
                    content: `# Axe Multi Roadmap\n\nEste é o bloco de notas principal do seu espaço. Você pode usar formatação moderna e adicionar anotações rápidas no estilo ChatGPT.\n\n## Funcionalidades a Fazer:\n- [x] Implementar barra lateral dinâmica\n- [ ] Adicionar suporte a múltiplos proxies residenciais\n- [ ] Criar sincronização em nuvem via Supabase\n\n## Exemplo de Código:\n\`\`\`javascript\n// Testando o interpretador de impressões digitais\nconst fingerprint = {\n  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',\n  language: 'pt-BR',\n  canvasSeed: 'axefull_fingerprint_seed_992'\n};\nconsole.log("Perfil iniciado com sucesso!", fingerprint);\n\`\`\``,
                    isStarred: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                },
                {
                    id: 'note-2',
                    spaceId: 'space-2',
                    title: 'Ideia de Postagem',
                    content: `# Post de Lançamento\n\nEscrever uma postagem no blog oficial sobre o lançamento da versão 1.0 do Axe Multi.\n\n* Destaques de Segurança\n* Navegação Antidetect avançada\n* Design Glassmorphic moderno`,
                    isStarred: false,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ];
            setNotes(parsedNotes);
            localStorage.setItem('axe_notes_notes', JSON.stringify(parsedNotes));
        }

        // Set active space and note
        if (parsedSpaces.length > 0) {
            setActiveSpaceId(parsedSpaces[0].id);
            const spaceNotes = parsedNotes.filter(n => n.spaceId === parsedSpaces[0].id);
            if (spaceNotes.length > 0) {
                setActiveNoteId(spaceNotes[0].id);
            }
        }
    }, []);

    // Save helpers
    const saveSpacesToStorage = (newSpaces: Space[]) => {
        setSpaces(newSpaces);
        localStorage.setItem('axe_notes_spaces', JSON.stringify(newSpaces));
    };

    const saveNotesToStorage = (newNotes: Note[]) => {
        setNotes(newNotes);
        localStorage.setItem('axe_notes_notes', JSON.stringify(newNotes));
    };

    // Space actions
    const handleCreateSpace = () => {
        if (!newSpaceName.trim()) {
            toast({ title: 'Aviso', message: 'O nome do espaço não pode estar vazio.', type: 'warning' });
            return;
        }

        const newSpace: Space = {
            id: `space-${Date.now()}`,
            name: newSpaceName.trim(),
            icon: newSpaceIcon,
            created_at: new Date().toISOString()
        };

        const updated = [...spaces, newSpace];
        saveSpacesToStorage(updated);
        setActiveSpaceId(newSpace.id);
        setActiveNoteId(''); // Reset selected note in the new space
        setNewSpaceName('');
        setIsSpaceModalOpen(false);
        toast({ title: 'Sucesso', message: `Espaço "${newSpace.name}" criado com sucesso!`, type: 'success' });
    };

    const handleDeleteSpace = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Tem certeza que deseja excluir este espaço e todas as suas notas?')) {
            const updatedSpaces = spaces.filter(s => s.id !== id);
            const updatedNotes = notes.filter(n => n.spaceId !== id);
            
            saveSpacesToStorage(updatedSpaces);
            saveNotesToStorage(updatedNotes);

            if (activeSpaceId === id) {
                if (updatedSpaces.length > 0) {
                    setActiveSpaceId(updatedSpaces[0].id);
                    const spaceNotes = updatedNotes.filter(n => n.spaceId === updatedSpaces[0].id);
                    setActiveNoteId(spaceNotes.length > 0 ? spaceNotes[0].id : '');
                } else {
                    setActiveSpaceId('');
                    setActiveNoteId('');
                }
            }
            toast({ title: 'Excluído', message: 'Espaço e suas notas foram excluídos.', type: 'info' });
        }
    };

    // Note actions
    const handleCreateNote = () => {
        if (!activeSpaceId) {
            toast({ title: 'Erro', message: 'Selecione ou crie um espaço primeiro.', type: 'error' });
            return;
        }

        const newNote: Note = {
            id: `note-${Date.now()}`,
            spaceId: activeSpaceId,
            title: 'Nova Nota',
            content: '# Nova Nota\n\nClique para começar a escrever...',
            isStarred: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const updated = [newNote, ...notes];
        saveNotesToStorage(updated);
        setActiveNoteId(newNote.id);
        setIsEditMode(false);
    };

    const handleUpdateNoteContent = (content: string) => {
        const updated = notes.map(n => {
            if (n.id === activeNoteId) {
                return { ...n, content, updated_at: new Date().toISOString() };
            }
            return n;
        });
        saveNotesToStorage(updated);
    };

    const handleUpdateNoteTitle = (title: string) => {
        const updated = notes.map(n => {
            if (n.id === activeNoteId) {
                return { ...n, title, updated_at: new Date().toISOString() };
            }
            return n;
        });
        saveNotesToStorage(updated);
    };

    const handleToggleStar = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        const updated = notes.map(n => {
            if (n.id === id) {
                const newStarred = !n.isStarred;
                toast({ 
                    title: newStarred ? 'Favoritada' : 'Removida dos favoritos', 
                    message: newStarred ? 'Nota marcada com estrela.' : 'Estrela removida da nota.', 
                    type: 'success' 
                });
                return { ...n, isStarred: newStarred };
            }
            return n;
        });
        saveNotesToStorage(updated);
    };

    const handleDeleteNote = (id: string) => {
        if (confirm('Tem certeza que deseja excluir esta nota?')) {
            const updated = notes.filter(n => n.id !== id);
            saveNotesToStorage(updated);
            if (activeNoteId === id) {
                const spaceNotes = updated.filter(n => n.spaceId === activeSpaceId);
                setActiveNoteId(spaceNotes.length > 0 ? spaceNotes[0].id : '');
            }
            toast({ title: 'Excluída', message: 'A nota foi excluída com sucesso.', type: 'info' });
        }
    };

    // Chatbot-style Easy insertion handler
    const handleInsertText = () => {
        if (!inputText.trim() || !activeNoteId) return;

        const currentNote = notes.find(n => n.id === activeNoteId);
        if (!currentNote) return;

        const appendedContent = currentNote.content + `\n\n${inputText.trim()}`;
        handleUpdateNoteContent(appendedContent);
        setInputText('');

        // Visual feedback
        toast({ title: 'Adicionado', message: 'Texto inserido no bloco de notas.', type: 'success' });
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleInsertText();
        }
    };

    // Security PIN actions
    const handleUnlock = () => {
        if (pinInput === savedPin) {
            setIsLocked(false);
            setPinInput('');
            setIsPinIncorrect(false);
            toast({ title: 'Acesso Liberado', message: 'Identidade verificada com sucesso.', type: 'success' });
        } else {
            setIsPinIncorrect(true);
            setPinInput('');
            toast({ title: 'Erro de Acesso', message: 'Senha PIN incorreta. Tente novamente.', type: 'error' });
        }
    };

    const handlePinPadClick = (num: string) => {
        if (pinInput.length < 6) {
            setIsPinIncorrect(false);
            setPinInput(prev => prev + num);
        }
    };

    const handlePinBackspace = () => {
        setPinInput(prev => prev.slice(0, -1));
    };

    // Auto-submit PIN if it reaches correct length
    useEffect(() => {
        if (isLocked && savedPin && pinInput === savedPin) {
            handleUnlock();
        }
    }, [pinInput, savedPin, isLocked]);

    const handleSaveSecuritySettings = (e: React.FormEvent) => {
        e.preventDefault();

        if (pinEnabled) {
            // Save PIN
            if (!tempPin || tempPin.length < 4) {
                toast({ title: 'Aviso', message: 'O PIN deve conter pelo menos 4 números.', type: 'warning' });
                return;
            }
            if (tempPin !== tempPinConfirm) {
                toast({ title: 'Erro', message: 'As senhas PIN digitadas não coincidem.', type: 'error' });
                return;
            }

            localStorage.setItem('axe_notes_pin_enabled', 'true');
            localStorage.setItem('axe_notes_pin', tempPin);
            setSavedPin(tempPin);
            toast({ title: 'Configuração Salva', message: 'Bloqueio de segurança PIN ativado.', type: 'success' });
        } else {
            // Disable PIN
            localStorage.removeItem('axe_notes_pin_enabled');
            localStorage.removeItem('axe_notes_pin');
            setSavedPin(null);
            setIsLocked(false);
            toast({ title: 'Configuração Salva', message: 'Bloqueio de segurança desativado.', type: 'info' });
        }

        setTempPin('');
        setTempPinConfirm('');
        setIsSettingsOpen(false);
    };

    const handleLockNow = () => {
        if (savedPin) {
            setIsLocked(true);
            setIsSettingsOpen(false);
            setPinInput('');
            toast({ title: 'Bloqueado', message: 'Espaço de notas bloqueado.', type: 'info' });
        } else {
            toast({ title: 'Aviso', message: 'Configure uma senha PIN antes de bloquear.', type: 'warning' });
        }
    };

    // Block parser helper
    const parseMarkdownToBlocks = (text: string): NoteBlock[] => {
        const lines = text.split('\n');
        const blocks: NoteBlock[] = [];
        let currentCodeBlock: { content: string; language: string } | null = null;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Check Code block
            if (line.trim().startsWith('```')) {
                if (currentCodeBlock) {
                    blocks.push({
                        type: 'code',
                        content: currentCodeBlock.content,
                        language: currentCodeBlock.language,
                        key: `code-${i}-${Math.random()}`
                    });
                    currentCodeBlock = null;
                } else {
                    const language = line.trim().slice(3).trim() || 'javascript';
                    currentCodeBlock = { content: '', language };
                }
                continue;
            }
            
            if (currentCodeBlock) {
                currentCodeBlock.content += (currentCodeBlock.content ? '\n' : '') + line;
                continue;
            }
            
            const trimmed = line.trim();
            if (!trimmed) {
                continue;
            }
            
            // Checklist
            if (trimmed.startsWith('- [ ]') || trimmed.startsWith('- [x]')) {
                blocks.push({
                    type: 'todo',
                    content: trimmed.substring(5).trim(),
                    checked: trimmed.startsWith('- [x]'),
                    key: `todo-${i}-${Math.random()}`
                });
            }
            // Bullet list
            else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                blocks.push({
                    type: 'bullet',
                    content: trimmed.substring(2).trim(),
                    key: `bullet-${i}-${Math.random()}`
                });
            }
            // Headings
            else if (trimmed.startsWith('### ')) {
                blocks.push({
                    type: 'h3',
                    content: trimmed.substring(4).trim(),
                    key: `h3-${i}-${Math.random()}`
                });
            } else if (trimmed.startsWith('## ')) {
                blocks.push({
                    type: 'h2',
                    content: trimmed.substring(3).trim(),
                    key: `h2-${i}-${Math.random()}`
                });
            } else if (trimmed.startsWith('# ')) {
                blocks.push({
                    type: 'h1',
                    content: trimmed.substring(2).trim(),
                    key: `h1-${i}-${Math.random()}`
                });
            } else {
                // Paragraph
                blocks.push({
                    type: 'paragraph',
                    content: line,
                    key: `p-${i}-${Math.random()}`
                });
            }
        }
        
        if (currentCodeBlock) {
            blocks.push({
                type: 'code',
                content: currentCodeBlock.content,
                language: currentCodeBlock.language,
                key: `code-unfinished`
            });
        }
        
        return blocks;
    };

    // Inline markdown parser (bold, italic, code spans)
    const renderMarkdownInline = (text: string): React.ReactNode[] => {
        const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
        const matches = text.split(regex);
        
        return matches.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-bold text-theme-text">{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('*') && part.endsWith('*')) {
                return <em key={i} className="italic text-theme-text-muted">{part.slice(1, -1)}</em>;
            }
            if (part.startsWith('`') && part.endsWith('`')) {
                return <code key={i} className="px-1.5 py-0.5 rounded bg-theme-border text-pink-400 font-mono text-[11px] border border-theme-border">{part.slice(1, -1)}</code>;
            }
            return part;
        });
    };

    const handleCopyCode = (codeText: string, blockKey: string) => {
        navigator.clipboard.writeText(codeText);
        setCopiedBlockKey(blockKey);
        toast({ title: 'Copiado', message: 'Código copiado para a área de transferência.', type: 'info' });
        setTimeout(() => {
            setCopiedBlockKey(null);
        }, 2000);
    };

    // Toggle checklist item
    const handleToggleTodo = (blockIndex: number, originalContent: string, isChecked: boolean) => {
        const currentNote = notes.find(n => n.id === activeNoteId);
        if (!currentNote) return;

        // Reconstruct markdown by modifying target list item
        const lines = currentNote.content.split('\n');

        const updatedLines = lines.map(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('- [ ]') || trimmed.startsWith('- [x]')) {
                const textOnly = trimmed.substring(5).trim();
                if (textOnly === originalContent) {
                    return line.replace(isChecked ? '- [x]' : '- [ ]', isChecked ? '- [ ]' : '- [x]');
                }
            }
            return line;
        });

        handleUpdateNoteContent(updatedLines.join('\n'));
    };

    // Filter Notes
    const activeSpace = spaces.find(s => s.id === activeSpaceId);
    
    // Sort notes: Starred notes FIRST, then sorted by update date (newest first)
    const filteredNotes = notes
        .filter(note => note.spaceId === activeSpaceId)
        .filter(note => {
            if (!searchQuery.trim()) return true;
            const query = searchQuery.toLowerCase();
            return note.title.toLowerCase().includes(query) || note.content.toLowerCase().includes(query);
        })
        .sort((a, b) => {
            if (a.isStarred && !b.isStarred) return -1;
            if (!a.isStarred && b.isStarred) return 1;
            return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        });

    const activeNote = notes.find(n => n.id === activeNoteId);
    const parsedBlocks = activeNote ? parseMarkdownToBlocks(activeNote.content) : [];

    // Keyboard lock event
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isLocked) return;
            if (e.key >= '0' && e.key <= '9') {
                handlePinPadClick(e.key);
            } else if (e.key === 'Backspace') {
                handlePinBackspace();
            } else if (e.key === 'Enter') {
                handleUnlock();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isLocked, pinInput, savedPin]);

    // Render Lock Screen if configured and locked
    if (isLocked) {
        return (
            <div className="flex flex-col items-center justify-center h-full w-full bg-theme-base select-none">
                <div className="w-[380px] p-8 rounded-2xl border border-theme-border bg-theme-surface/80 backdrop-blur-xl shadow-2xl flex flex-col items-center relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500" />
                    
                    <div className="w-16 h-16 rounded-full bg-pink-500/10 flex items-center justify-center mb-4 text-pink-400 animate-pulse">
                        <Lock size={32} />
                    </div>

                    <h2 className="text-lg font-bold text-theme-text mb-1">Notas Criptografadas</h2>
                    <p className="text-xs text-theme-text-muted text-center mb-6">Digite seu PIN de segurança para acessar seus arquivos de notas.</p>

                    {/* PIN dots */}
                    <div className="flex gap-4 mb-8">
                        {[0, 1, 2, 3, 4, 5].map((idx) => (
                            <div 
                                key={idx} 
                                className={`w-3.5 h-3.5 rounded-full border transition-all duration-200 ${
                                    pinInput.length > idx 
                                        ? 'bg-pink-500 border-pink-500 scale-110 shadow-[0_0_8px_rgba(236,72,153,0.5)]' 
                                        : 'border-theme-border bg-transparent'
                                } ${isPinIncorrect ? 'border-red-500 animate-bounce' : ''}`}
                            />
                        ))}
                    </div>

                    {/* Pinpad Keyboard */}
                    <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                            <button
                                key={num}
                                onClick={() => handlePinPadClick(num.toString())}
                                className="h-14 rounded-xl border border-theme-border bg-theme-card hover:bg-theme-border text-theme-text font-bold text-lg transition-all active:scale-95 flex items-center justify-center"
                            >
                                {num}
                            </button>
                        ))}
                        <button
                            onClick={() => setPinInput('')}
                            className="h-14 rounded-xl text-xs font-semibold text-theme-text-muted hover:text-theme-text transition-colors flex items-center justify-center"
                        >
                            Limpar
                        </button>
                        <button
                            onClick={() => handlePinPadClick('0')}
                            className="h-14 rounded-xl border border-theme-border bg-theme-card hover:bg-theme-border text-theme-text font-bold text-lg transition-all active:scale-95 flex items-center justify-center"
                        >
                            0
                        </button>
                        <button
                            onClick={handlePinBackspace}
                            className="h-14 rounded-xl text-xs font-semibold text-theme-text-muted hover:text-theme-text transition-colors flex items-center justify-center"
                        >
                            Apagar
                        </button>
                    </div>

                    {isPinIncorrect && (
                        <div className="text-red-500 text-xs font-semibold mt-4 text-center">
                            PIN incorreto. Tente novamente!
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full w-full bg-theme-base overflow-hidden relative">
            
            {/* ─── SIDEBAR ────────────────────────────────────── */}
            <div className="w-[300px] bg-theme-surface/70 backdrop-blur-md border-r border-theme-border flex flex-col h-full shrink-0 select-none">
                
                {/* Search Header */}
                <div className="p-4 border-b border-theme-border flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <StickyNote size={18} className="text-pink-500" />
                            <span className="font-bold text-sm text-theme-text">Bloco de Notas</span>
                        </div>
                        <button 
                            onClick={() => setIsSettingsOpen(true)}
                            className="p-1.5 rounded-lg text-theme-text-muted hover:text-theme-text hover:bg-theme-card transition-all"
                            title="Segurança e Configurações"
                        >
                            <Settings size={16} />
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-text-faint" />
                        <input
                            type="text"
                            placeholder="Buscar notas..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-theme-base/60 text-xs border border-theme-border focus:border-pink-500 focus:outline-none rounded-lg py-2 pl-9 pr-4 text-theme-text placeholder-theme-text-faint transition-all"
                        />
                    </div>
                </div>

                {/* Spaces list */}
                <div className="p-4 border-b border-theme-border bg-theme-base/20">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-theme-text-muted uppercase tracking-wider">Espaços</span>
                        <button 
                            onClick={() => setIsSpaceModalOpen(true)}
                            className="p-1 rounded bg-theme-card hover:bg-theme-border text-theme-text hover:text-pink-500 transition-colors flex items-center gap-1 text-[10px] font-medium"
                        >
                            <Plus size={10} /> Novo
                        </button>
                    </div>

                    <div className="flex flex-col gap-1 max-h-[140px] overflow-y-auto scrollbar-none">
                        {spaces.map(space => {
                            const isSelected = activeSpaceId === space.id;
                            return (
                                <div
                                    key={space.id}
                                    onClick={() => {
                                        setActiveSpaceId(space.id);
                                        const spaceNotes = notes.filter(n => n.spaceId === space.id);
                                        setActiveNoteId(spaceNotes.length > 0 ? spaceNotes[0].id : '');
                                    }}
                                    className={`group flex items-center justify-between px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                                        isSelected 
                                            ? 'bg-gradient-to-r from-pink-500/10 to-transparent border-l-2 border-pink-500 text-theme-text font-semibold' 
                                            : 'text-theme-text-muted hover:bg-theme-card hover:text-theme-text'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 text-xs overflow-hidden">
                                        <span className="text-sm shrink-0">{space.icon}</span>
                                        <span className="truncate">{space.name}</span>
                                    </div>
                                    {spaces.length > 1 && (
                                        <button 
                                            onClick={(e) => handleDeleteSpace(space.id, e)}
                                            className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-500 rounded transition-all"
                                            title="Excluir Espaço"
                                        >
                                            <Trash2 size={10} />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Notes list inside space */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="p-4 py-3 flex items-center justify-between shrink-0">
                        <span className="text-[10px] font-bold text-theme-text-muted uppercase tracking-wider">Notas</span>
                        <button 
                            onClick={handleCreateNote}
                            disabled={!activeSpaceId}
                            className="p-1 rounded bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white transition-colors flex items-center gap-1 text-[10px] font-bold shadow-sm"
                        >
                            <Plus size={10} /> Nova Nota
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1 scrollbar-none">
                        {filteredNotes.length === 0 ? (
                            <div className="text-center py-8 text-theme-text-faint text-xs">
                                Nenhuma nota encontrada.
                            </div>
                        ) : (
                            filteredNotes.map(note => {
                                const isSelected = activeNoteId === note.id;
                                return (
                                    <div
                                        key={note.id}
                                        onClick={() => {
                                            setActiveNoteId(note.id);
                                            setIsEditMode(false);
                                        }}
                                        className={`group relative flex flex-col gap-1 p-3 rounded-lg cursor-pointer transition-all border ${
                                            isSelected 
                                                ? 'bg-theme-card border-theme-border shadow-sm' 
                                                : 'border-transparent hover:bg-theme-card/40 text-theme-text-muted'
                                        } ${note.isStarred ? 'border-amber-500/30 bg-gradient-to-r from-amber-500/[0.04] to-transparent' : ''}`}
                                    >
                                        
                                        {/* Glowing border highlight for starred notes */}
                                        {note.isStarred && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 rounded-l-lg shadow-[0_0_8px_var(--brand-primary)]" />
                                        )}

                                        <div className="flex items-start justify-between gap-2">
                                            <span className={`text-xs truncate font-semibold leading-tight ${
                                                isSelected ? 'text-theme-text' : 'text-theme-text-muted group-hover:text-theme-text'
                                            }`}>
                                                {note.title || 'Sem Título'}
                                            </span>
                                            
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    onClick={(e) => handleToggleStar(note.id, e)}
                                                    className={`transition-colors p-0.5 rounded ${
                                                        note.isStarred 
                                                            ? 'text-amber-500 hover:text-amber-600' 
                                                            : 'text-theme-text-faint hover:text-amber-500 opacity-0 group-hover:opacity-100'
                                                    }`}
                                                >
                                                    <Star size={11} fill={note.isStarred ? 'currentColor' : 'none'} />
                                                </button>
                                            </div>
                                        </div>

                                        <span className="text-[10px] text-theme-text-faint line-clamp-2">
                                            {note.content.replace(/[#*`\-[\]]/g, '').trim() || 'Sem conteúdo...'}
                                        </span>

                                        <span className="text-[8px] text-theme-text-faint text-right mt-1">
                                            {new Date(note.updated_at).toLocaleDateString('pt-BR', {
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* ─── MAIN EDITOR AREA ───────────────────────────── */}
            <div className="flex-1 flex flex-col h-full bg-theme-base overflow-hidden">
                {activeNote ? (
                    <>
                        {/* Note Header */}
                        <div className="h-14 border-b border-theme-border px-6 flex items-center justify-between bg-theme-surface/30 backdrop-blur-sm shrink-0 select-none">
                            <div className="flex items-center gap-3 overflow-hidden flex-1 max-w-xl">
                                <span className="text-lg">{activeSpace?.icon}</span>
                                <input
                                    type="text"
                                    value={activeNote.title}
                                    onChange={(e) => handleUpdateNoteTitle(e.target.value)}
                                    className="bg-transparent font-bold text-sm text-theme-text focus:outline-none border-b border-transparent focus:border-theme-border py-0.5 truncate flex-1"
                                    placeholder="Título da nota"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Toggle view mode */}
                                <button
                                    onClick={() => setIsEditMode(!isEditMode)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                        isEditMode
                                            ? 'bg-pink-500 text-white border-pink-500'
                                            : 'bg-theme-card border-theme-border text-theme-text-muted hover:text-theme-text'
                                    }`}
                                >
                                    {isEditMode ? (
                                        <>
                                            <Eye size={13} />
                                            <span>Visualizar ChatGPT</span>
                                        </>
                                    ) : (
                                        <>
                                            <Edit3 size={13} />
                                            <span>Editar Código Fonte</span>
                                        </>
                                    )}
                                </button>

                                {/* Star Button */}
                                <button
                                    onClick={() => handleToggleStar(activeNote.id)}
                                    className={`p-2 rounded-lg border transition-all ${
                                        activeNote.isStarred
                                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20'
                                            : 'bg-theme-card border-theme-border text-theme-text-muted hover:text-theme-text'
                                    }`}
                                    title={activeNote.isStarred ? 'Remover dos Favoritos' : 'Marcar como Favorita'}
                                >
                                    <Star size={14} fill={activeNote.isStarred ? 'currentColor' : 'none'} />
                                </button>

                                {/* Delete note */}
                                <button
                                    onClick={() => handleDeleteNote(activeNote.id)}
                                    className="p-2 rounded-lg border border-theme-border bg-theme-card text-theme-text-muted hover:text-red-500 hover:border-red-500/30 transition-all"
                                    title="Excluir Nota"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Note Body */}
                        <div className="flex-1 overflow-hidden relative flex flex-col">
                            {isEditMode ? (
                                /* RAW TEXTAREA EDITOR */
                                <textarea
                                    value={activeNote.content}
                                    onChange={(e) => handleUpdateNoteContent(e.target.value)}
                                    className="flex-1 w-full p-8 bg-theme-base text-sm focus:outline-none text-theme-text resize-none font-mono leading-relaxed"
                                    placeholder="Escreva em markdown aqui..."
                                />
                            ) : (
                                /* CHATGPT STYLE THREAD */
                                <div className="flex-1 overflow-y-auto px-6 md:px-16 py-8 space-y-6 scrollbar-thin">
                                    
                                    {/* Simulated System Message */}
                                    <div className="flex gap-4 items-start max-w-3xl mx-auto p-4 rounded-xl bg-theme-surface/40 border border-theme-border/50 text-xs text-theme-text-muted">
                                        <div className="w-6 h-6 rounded-full bg-pink-500/15 flex items-center justify-center shrink-0 text-pink-400">
                                            <Shield size={12} />
                                        </div>
                                        <div>
                                            <span className="font-bold text-theme-text block mb-1">ChatGPT Notas ativado</span>
                                            Adicione novos parágrafos, caixas de código ou listas usando a caixa de inserção facilitada no final da página. Pressione Enter para adicionar instantaneamente.
                                        </div>
                                    </div>

                                    {/* Render Blocks */}
                                    <div className="max-w-3xl mx-auto space-y-6">
                                        {parsedBlocks.map((block, index) => {
                                            switch (block.type) {
                                                case 'h1':
                                                    return <h1 key={block.key} className="text-2xl font-black text-theme-text border-b border-theme-border/60 pb-2 pt-4">{block.content}</h1>;
                                                case 'h2':
                                                    return <h2 key={block.key} className="text-xl font-extrabold text-theme-text pt-3">{block.content}</h2>;
                                                case 'h3':
                                                    return <h3 key={block.key} className="text-base font-bold text-theme-text pt-2">{block.content}</h3>;
                                                case 'todo':
                                                    return (
                                                        <div key={block.key} className="flex items-start gap-2.5 my-1 group/todo">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={block.checked}
                                                                onChange={(e) => handleToggleTodo(index, block.content, block.checked || false)}
                                                                className="mt-1 h-4 w-4 rounded border-theme-border text-pink-500 focus:ring-pink-500/20 cursor-pointer"
                                                            />
                                                            <span className={`text-xs text-theme-text leading-relaxed select-text ${block.checked ? 'line-through text-theme-text-faint' : ''}`}>
                                                                {renderMarkdownInline(block.content)}
                                                            </span>
                                                        </div>
                                                    );
                                                case 'bullet':
                                                    return (
                                                        <div key={block.key} className="flex items-start gap-2 pl-4 my-1">
                                                            <span className="text-pink-500 mt-1 shrink-0 text-[10px]">•</span>
                                                            <span className="text-xs text-theme-text leading-relaxed select-text">{renderMarkdownInline(block.content)}</span>
                                                        </div>
                                                    );
                                                case 'code':
                                                    return (
                                                        <div key={block.key} className="my-4 rounded-xl border border-theme-border overflow-hidden bg-zinc-950 font-mono text-[11px] shadow-md">
                                                            <div className="flex items-center justify-between px-4 py-1.5 bg-zinc-900 border-b border-zinc-800 text-zinc-400 select-none text-[9px] font-semibold">
                                                                <span>{block.language || 'code'}</span>
                                                                <button 
                                                                    onClick={() => handleCopyCode(block.content, block.key)}
                                                                    className="flex items-center gap-1 hover:text-zinc-200 transition-colors"
                                                                >
                                                                    {copiedBlockKey === block.key ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                                                                    <span>{copiedBlockKey === block.key ? 'Copiado!' : 'Copiar'}</span>
                                                                </button>
                                                            </div>
                                                            <pre className="p-4 overflow-x-auto text-zinc-100 leading-relaxed scrollbar-thin select-text">
                                                                <code>{block.content}</code>
                                                            </pre>
                                                        </div>
                                                    );
                                                default:
                                                    return (
                                                        <p key={block.key} className="text-xs text-theme-text leading-relaxed my-2 select-text text-justify">
                                                            {renderMarkdownInline(block.content)}
                                                        </p>
                                                    );
                                            }
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Easy Text Insertion input (ChatGPT Style Prompt Box) */}
                            {!isEditMode && (
                                <div className="p-4 border-t border-theme-border bg-theme-surface/50 backdrop-blur shrink-0 select-none">
                                    <div className="max-w-3xl mx-auto flex items-end gap-2.5 bg-theme-card border border-theme-border rounded-xl p-2.5 shadow-sm focus-within:border-pink-500/60 focus-within:ring-2 focus-within:ring-pink-500/10 transition-all">
                                        <textarea
                                            value={inputText}
                                            onChange={(e) => setInputText(e.target.value)}
                                            onKeyDown={handleKeyPress}
                                            rows={Math.min(5, inputText.split('\n').length || 1)}
                                            placeholder="Inserir nota facilitada... Digite texto ou código (\`\`\`js) e envie. Shift+Enter para nova linha."
                                            className="flex-1 bg-transparent text-xs text-theme-text focus:outline-none resize-none leading-relaxed px-2 py-1 scrollbar-none"
                                        />
                                        <button
                                            onClick={handleInsertText}
                                            disabled={!inputText.trim()}
                                            className="p-2 rounded-lg bg-pink-500 text-white disabled:opacity-30 disabled:bg-theme-border hover:bg-pink-600 transition-all shrink-0 flex items-center justify-center shadow-sm"
                                        >
                                            <Send size={12} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    /* EMPTY STATE */
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none">
                        <div className="w-16 h-16 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-400 mb-4 animate-bounce">
                            <StickyNote size={32} />
                        </div>
                        <h3 className="font-bold text-sm text-theme-text">Nenhuma Nota Aberta</h3>
                        <p className="text-xs text-theme-text-muted max-w-sm mt-1">
                            Selecione uma nota existente na barra lateral ou crie uma nova nota dentro de um Espaço para começar a estruturar suas ideias.
                        </p>
                        {activeSpaceId && (
                            <button
                                onClick={handleCreateNote}
                                className="mt-4 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                            >
                                <Plus size={14} /> Criar Nova Nota
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* ─── MODAL: NEW SPACE ───────────────────────────── */}
            {isSpaceModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none">
                    <div className="w-[360px] p-6 rounded-2xl border border-theme-border bg-theme-surface shadow-2xl flex flex-col gap-4 animate-slide-up relative">
                        <button 
                            onClick={() => setIsSpaceModalOpen(false)}
                            className="absolute top-4 right-4 text-theme-text-muted hover:text-theme-text transition-colors"
                        >
                            <X size={16} />
                        </button>

                        <h3 className="font-bold text-sm text-theme-text">Criar Novo Espaço</h3>
                        
                        <div className="flex flex-col gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-theme-text-muted uppercase tracking-wider block mb-1">Nome do Espaço</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Ideias, Estudos, Trabalho"
                                    value={newSpaceName}
                                    onChange={(e) => setNewSpaceName(e.target.value)}
                                    className="w-full bg-theme-base border border-theme-border focus:border-pink-500 focus:outline-none rounded-lg px-3 py-2 text-xs text-theme-text"
                                    maxLength={24}
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-theme-text-muted uppercase tracking-wider block mb-1.5">Escolha um Ícone / Pasta</label>
                                <div className="grid grid-cols-5 gap-2 bg-theme-base/60 p-2.5 rounded-lg border border-theme-border max-h-[120px] overflow-y-auto scrollbar-thin">
                                    {SPACE_ICONS.map((emoji) => (
                                        <button
                                            key={emoji}
                                            type="button"
                                            onClick={() => setNewSpaceIcon(emoji)}
                                            className={`text-lg p-1.5 rounded-lg hover:bg-theme-card transition-all active:scale-90 ${
                                                newSpaceIcon === emoji ? 'bg-pink-500/20 border border-pink-500/60 scale-105' : 'border border-transparent'
                                            }`}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2.5 mt-2 justify-end">
                            <button
                                onClick={() => setIsSpaceModalOpen(false)}
                                className="px-4 py-2 border border-theme-border bg-theme-card hover:bg-theme-border rounded-xl text-xs font-semibold text-theme-text-muted transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreateSpace}
                                className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
                            >
                                Criar Espaço
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── MODAL: SETTINGS & PIN ──────────────────────── */}
            {isSettingsOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none">
                    <form 
                        onSubmit={handleSaveSecuritySettings}
                        className="w-[400px] p-6 rounded-2xl border border-theme-border bg-theme-surface shadow-2xl flex flex-col gap-4 animate-slide-up relative"
                    >
                        <button 
                            type="button"
                            onClick={() => setIsSettingsOpen(false)}
                            className="absolute top-4 right-4 text-theme-text-muted hover:text-theme-text transition-colors"
                        >
                            <X size={16} />
                        </button>

                        <div className="flex items-center gap-2 text-pink-500 border-b border-theme-border pb-3">
                            <Settings size={18} />
                            <h3 className="font-bold text-sm text-theme-text">Segurança das Notas</h3>
                        </div>

                        <div className="flex flex-col gap-4">
                            
                            {/* Toggle Lock */}
                            <div className="flex items-center justify-between p-3 rounded-xl bg-theme-base/60 border border-theme-border">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-xs font-bold text-theme-text">Proteger com Senha PIN</span>
                                    <span className="text-[10px] text-theme-text-muted">Exigir senha PIN ao acessar as notas.</span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={pinEnabled}
                                    onChange={(e) => {
                                        setPinEnabled(e.target.checked);
                                        if (!e.target.checked) {
                                            setTempPin('');
                                            setTempPinConfirm('');
                                        }
                                    }}
                                    className="h-4.5 w-8 rounded-full border-theme-border text-pink-500 focus:ring-pink-500/20 cursor-pointer"
                                />
                            </div>

                            {/* PIN Form */}
                            {pinEnabled && (
                                <div className="flex flex-col gap-3 p-3.5 rounded-xl border border-theme-border bg-theme-card/30 animate-fade-in">
                                    <span className="text-[10px] font-bold text-theme-text-muted uppercase tracking-wider block">Definir Novo PIN</span>
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[9px] text-theme-text-muted font-semibold block mb-1">Novo PIN (Mín. 4 dig.)</label>
                                            <input
                                                type="password"
                                                pattern="[0-9]*"
                                                inputMode="numeric"
                                                maxLength={6}
                                                placeholder="••••"
                                                value={tempPin}
                                                onChange={(e) => setTempPin(e.target.value.replace(/[^0-9]/g, ''))}
                                                className="w-full text-center bg-theme-base border border-theme-border focus:border-pink-500 focus:outline-none rounded-lg px-2 py-1.5 text-xs text-theme-text tracking-widest font-mono"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] text-theme-text-muted font-semibold block mb-1">Confirmar PIN</label>
                                            <input
                                                type="password"
                                                pattern="[0-9]*"
                                                inputMode="numeric"
                                                maxLength={6}
                                                placeholder="••••"
                                                value={tempPinConfirm}
                                                onChange={(e) => setTempPinConfirm(e.target.value.replace(/[^0-9]/g, ''))}
                                                className="w-full text-center bg-theme-base border border-theme-border focus:border-pink-500 focus:outline-none rounded-lg px-2 py-1.5 text-xs text-theme-text tracking-widest font-mono"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Lock action if PIN exists */}
                            {savedPin && (
                                <button
                                    type="button"
                                    onClick={handleLockNow}
                                    className="w-full py-2.5 border border-pink-500/20 bg-pink-500/5 hover:bg-pink-500/10 text-pink-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                                >
                                    <Lock size={12} /> Bloquear Sessão de Notas Agora
                                </button>
                            )}

                        </div>

                        <div className="flex gap-2.5 mt-2 justify-end">
                            <button
                                type="button"
                                onClick={() => setIsSettingsOpen(false)}
                                className="px-4 py-2 border border-theme-border bg-theme-card hover:bg-theme-border rounded-xl text-xs font-semibold text-theme-text-muted transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
                            >
                                Salvar Configurações
                            </button>
                        </div>
                    </form>
                </div>
            )}

        </div>
    );
};

export default NotesPage;
