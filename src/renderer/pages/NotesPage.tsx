import React, { useState, useEffect, useRef } from 'react';
import { 
    StickyNote, Plus, Settings, Star, Trash2, Search, Lock, Unlock, 
    X, Eye, Edit3, Copy, Check, Shield, ChevronLeft,
    Menu, Pin, Key, EyeOff, ExternalLink, ShieldAlert, Shuffle
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useWorkspace } from '../context/WorkspaceContext';
import NoteTiptapEditor from '../features/Notes/NoteTiptapEditor';
import { encryptData, decryptData } from '../utils/crypto';

export interface PasswordEntry {
    id: string;
    title: string;
    username: string;
    password: string;
    url?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

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
    const { setIsNotesFloating } = useWorkspace();

    // Notes Data States
    const [spaces, setSpaces] = useState<Space[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [activeSpaceId, setActiveSpaceId] = useState<string>('');
    const [activeNoteId, setActiveNoteId] = useState<string>('');
    
    // UI Interface States
    const [searchQuery, setSearchQuery] = useState('');
    const [isEditMode, setIsEditMode] = useState(false); // Toggle between raw markdown and Axefull Note preview
    const [inputText, setInputText] = useState('');
    const [copiedBlockKey, setCopiedBlockKey] = useState<string | null>(null);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Dialog / Modal States
    const [isSpaceModalOpen, setIsSpaceModalOpen] = useState(false);
    const [newSpaceName, setNewSpaceName] = useState('');
    const [newSpaceIcon, setNewSpaceIcon] = useState('📁');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Right-Click Context Menu State
    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        visible: boolean;
        noteId?: string;
        spaceId?: string;
    }>({ x: 0, y: 0, visible: false });

    // Security PIN States
    const [isLocked, setIsLocked] = useState(false);
    const [pinEnabled, setPinEnabled] = useState(false);
    const [savedPin, setSavedPin] = useState<string | null>(null);
    const [pinInput, setPinInput] = useState('');
    const [isPinIncorrect, setIsPinIncorrect] = useState(false);
    const [tempPin, setTempPin] = useState('');
    const [tempPinConfirm, setTempPinConfirm] = useState('');

    // Secure Password Vault ("Pass") States
    const [isPassSelected, setIsPassSelected] = useState(false);
    const [isPassUnlocked, setIsPassUnlocked] = useState(false);
    const [passVaultConfigured, setPassVaultConfigured] = useState(false);
    const [passPasswordInput, setPassPasswordInput] = useState('');
    const [passType, setPassType] = useState<'pin' | 'text'>('pin');
    const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
    const [searchPassQuery, setSearchPassQuery] = useState('');
    const [isPassIncorrect, setIsPassIncorrect] = useState(false);
    
    // Add/Edit entry modal states
    const [isPassModalOpen, setIsPassModalOpen] = useState(false);
    const [editingPassEntry, setEditingPassEntry] = useState<PasswordEntry | null>(null);
    const [passFormTitle, setPassFormTitle] = useState('');
    const [passFormUsername, setPassFormUsername] = useState('');
    const [passFormPassword, setPassFormPassword] = useState('');
    const [passFormUrl, setPassFormUrl] = useState('');
    const [passFormNotes, setPassFormNotes] = useState('');

    // Settings / Change Password states
    const [isPassSettingsOpen, setIsPassSettingsOpen] = useState(false);
    const [newPassType, setNewPassType] = useState<'pin' | 'text'>('pin');
    const [newPassInput, setNewPassInput] = useState('');
    const [newPassConfirm, setNewPassConfirm] = useState('');

    // UI state for clipboard & visibility
    const [copiedPassId, setCopiedPassId] = useState<string | null>(null);
    const [visiblePasswordIds, setVisiblePasswordIds] = useState<Record<string, boolean>>({});

    // Password generator states
    const [generatorLength, setGeneratorLength] = useState(16);
    const [generatorOptions, setGeneratorOptions] = useState({
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: true
    });
    
    // Keep reference of current vault password for decrypting/encrypting
    const [vaultPassword, setVaultPassword] = useState<string>('');

    // Refs
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Focus and select end of textarea when entering edit mode
    useEffect(() => {
        if (isEditMode && textareaRef.current) {
            textareaRef.current.focus();
            const length = textareaRef.current.value.length;
            textareaRef.current.setSelectionRange(length, length);
        }
    }, [isEditMode]);

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

        // Pass Vault configuration loading
        const passVerification = localStorage.getItem('axe_pass_verification');
        const passTypeSaved = localStorage.getItem('axe_pass_type') as 'pin' | 'text' | null;
        setPassVaultConfigured(!!passVerification);
        if (passTypeSaved) {
            setPassType(passTypeSaved);
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
                    content: `# Axe Multi Roadmap\n\nEste é o bloco de notas principal do seu espaço. Você pode usar formatação moderna e adicionar anotações rápidas com Axefull Note.\n\n## Funcionalidades a Fazer:\n- [x] Implementar barra lateral dinâmica\n- [ ] Adicionar suporte a múltiplos proxies residenciais\n- [ ] Criar sincronização em nuvem via Supabase\n\n## Exemplo de Código:\n\`\`\`javascript\n// Testando o interpretador de impressões digitais\nconst fingerprint = {\n  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',\n  language: 'pt-BR',\n  canvasSeed: 'axefull_fingerprint_seed_992'\n};\nconsole.log("Perfil iniciado com sucesso!", fingerprint);\n\`\`\``,
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

        // Click listener to close context menu
        const handleWindowClick = () => {
            setContextMenu(prev => prev.visible ? { ...prev, visible: false } : prev);
        };
        window.addEventListener('click', handleWindowClick);
        return () => window.removeEventListener('click', handleWindowClick);
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
            toast.warning('Aviso', 'O nome do espaço não pode estar vazio.');
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
        toast.success('Sucesso', `Espaço "${newSpace.name}" criado com sucesso!`);
    };

    const handleDeleteSpace = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        const spaceToDelete = spaces.find(s => s.id === id);
        const spaceName = spaceToDelete ? spaceToDelete.name : 'este espaço';

        if (confirm(`Tem certeza que deseja excluir "${spaceName}" e todas as suas notas?`)) {
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
            toast.info('Excluído', 'Espaço e suas notas foram excluídos.');
        }
    };

    // Note actions
    const handleCreateNote = () => {
        if (!activeSpaceId) {
            toast.error('Erro', 'Selecione ou crie um espaço primeiro.');
            return;
        }

        const newNote: Note = {
            id: `note-${Date.now()}`,
            spaceId: activeSpaceId,
            title: 'Nova Nota',
            content: '<h1>Nova Nota</h1><hr><p>Clique para começar a escrever...</p>',
            isStarred: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const updated = [newNote, ...notes];
        saveNotesToStorage(updated);
        setActiveNoteId(newNote.id);
        setIsEditMode(false);
        setIsPassSelected(false);
        if (window.innerWidth < 768) {
            setIsSidebarCollapsed(true);
        }
    };

    const handleUpdateNoteContent = (content: string) => {
        const updated = notes.map(n => {
            if (n.id === activeNoteId) {
                let newTitle = n.title;
                const match = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
                if (match && match[1] !== undefined) {
                    const text = match[1].replace(/<[^>]+>/g, '').trim();
                    if (text || text === '') newTitle = text || 'Sem Título';
                }
                return { ...n, content, title: newTitle, updated_at: new Date().toISOString() };
            }
            return n;
        });
        saveNotesToStorage(updated);
    };

    const handleUpdateNoteTitle = (title: string) => {
        const updated = notes.map(n => {
            if (n.id === activeNoteId) {
                let newContent = n.content;
                if (/<h1[^>]*>.*?<\/h1>/i.test(newContent)) {
                    newContent = newContent.replace(/(<h1[^>]*>)(.*?)(<\/h1>)/i, `$1${title}$3`);
                } else {
                    newContent = `<h1>${title}</h1><hr><p></p>` + newContent;
                }
                return { ...n, title, content: newContent, updated_at: new Date().toISOString() };
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
                if (newStarred) {
                    toast.success('Favoritada', 'Nota marcada com estrela.');
                } else {
                    toast.info('Favorito removido', 'Estrela removida da nota.');
                }
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
            toast.info('Excluída', 'A nota foi excluída com sucesso.');
        }
    };

    // Move Note Action
    const handleMoveNote = (noteId: string, targetSpaceId: string) => {
        const updated = notes.map(n => {
            if (n.id === noteId) {
                return { ...n, spaceId: targetSpaceId, updated_at: new Date().toISOString() };
            }
            return n;
        });
        saveNotesToStorage(updated);
        
        // If moving the currently selected note, update UI focus
        if (noteId === activeNoteId) {
            setActiveSpaceId(targetSpaceId);
        }

        const destSpace = spaces.find(s => s.id === targetSpaceId);
        toast.success('Movida', `Nota movida para o espaço "${destSpace?.name || 'Destino'}".`);
    };

    // Chatbot-style Easy insertion handler
    const handleInsertText = () => {
        if (!inputText.trim() || !activeNoteId) return;

        const currentNote = notes.find(n => n.id === activeNoteId);
        if (!currentNote) return;

        const appendedContent = currentNote.content + `\n\n${inputText.trim()}`;
        handleUpdateNoteContent(appendedContent);
        setInputText('');

        toast.success('Adicionado', 'Texto inserido no bloco de notas.');
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleInsertText();
        }
    };

    // Markdown insertion helper
    const handleInsertMarkdown = (syntax: 'bold' | 'italic' | 'heading' | 'code' | 'bullet' | 'todo') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selectedText = text.substring(start, end);

        let replacement = '';
        let newCursorPos = start;

        switch (syntax) {
            case 'bold':
                replacement = `**${selectedText || 'texto'}**`;
                newCursorPos = start + 2 + (selectedText ? selectedText.length : 5);
                break;
            case 'italic':
                replacement = `*${selectedText || 'texto'}*`;
                newCursorPos = start + 1 + (selectedText ? selectedText.length : 5);
                break;
            case 'heading':
                replacement = `\n## ${selectedText || 'Título'}`;
                newCursorPos = start + replacement.length;
                break;
            case 'code':
                replacement = `\n\`\`\`javascript\n${selectedText || '// código aqui'}\n\`\`\`\n`;
                newCursorPos = start + replacement.length;
                break;
            case 'bullet':
                replacement = `\n- ${selectedText || 'item'}`;
                newCursorPos = start + replacement.length;
                break;
            case 'todo':
                replacement = `\n- [ ] ${selectedText || 'tarefa'}`;
                newCursorPos = start + replacement.length;
                break;
        }

        const newContent = text.substring(0, start) + replacement + text.substring(end);
        handleUpdateNoteContent(newContent);
        
        // Restore focus and selection position
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    // Right-Click Context Menu Triggers
    const handleNoteContextMenu = (e: React.MouseEvent, noteId: string) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            visible: true,
            noteId
        });
    };

    const handleSpaceContextMenu = (e: React.MouseEvent, spaceId: string) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            visible: true,
            spaceId
        });
    };

    // Security PIN actions
    const handleUnlock = () => {
        if (pinInput === savedPin) {
            setIsLocked(false);
            setPinInput('');
            setIsPinIncorrect(false);
            toast.success('Acesso Liberado', 'Identidade verificada com sucesso.');
        } else {
            setIsPinIncorrect(true);
            setPinInput('');
            toast.error('Erro de Acesso', 'Senha PIN incorreta. Tente novamente.');
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
                toast.warning('Aviso', 'O PIN deve conter pelo menos 4 números.');
                return;
            }
            if (tempPin !== tempPinConfirm) {
                toast.error('Erro', 'As senhas PIN digitadas não coincidem.');
                return;
            }

            localStorage.setItem('axe_notes_pin_enabled', 'true');
            localStorage.setItem('axe_notes_pin', tempPin);
            setSavedPin(tempPin);
            toast.success('Configuração Salva', 'Bloqueio de segurança PIN ativado.');
        } else {
            // Disable PIN
            localStorage.removeItem('axe_notes_pin_enabled');
            localStorage.removeItem('axe_notes_pin');
            setSavedPin(null);
            setIsLocked(false);
            toast.info('Configuração Salva', 'Bloqueio de segurança desativado.');
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
            toast.info('Bloqueado', 'Espaço de notas bloqueado.');
        } else {
            toast.warning('Aviso', 'Configure uma senha PIN antes de bloquear.');
        }
    };

    // ─── COFRE PASS VAULT ACTIONS ─────────────────────────────────

    const handleSetupPassVault = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPassInput || newPassInput.length < 4) {
            toast.warning('Aviso', 'A senha deve conter pelo menos 4 caracteres.');
            return;
        }
        if (newPassInput !== newPassConfirm) {
            toast.error('Erro', 'As senhas digitadas não coincidem.');
            return;
        }
        if (newPassType === 'pin' && /[^0-9]/.test(newPassInput)) {
            toast.warning('Aviso', 'O PIN deve conter apenas números.');
            return;
        }

        try {
            const verificationEncrypted = await encryptData("AXEFULL_SECURE_VERIFICATION", newPassInput);
            const emptyDataEncrypted = await encryptData("[]", newPassInput);

            localStorage.setItem('axe_pass_verification', verificationEncrypted);
            localStorage.setItem('axe_pass_type', newPassType);
            localStorage.setItem('axe_pass_encrypted_data', emptyDataEncrypted);

            setPassType(newPassType);
            setVaultPassword(newPassInput);
            setPassVaultConfigured(true);
            setIsPassUnlocked(true);
            setPasswords([]);

            setNewPassInput('');
            setNewPassConfirm('');
            toast.success('Cofre Criado', 'Seu cofre de senhas "Pass" foi criado e ativado com sucesso.');
        } catch (err) {
            toast.error('Erro', 'Ocorreu um erro ao configurar o cofre.');
            console.error(err);
        }
    };

    const handleUnlockPassVault = async () => {
        if (!passPasswordInput) return;
        const verificationEncrypted = localStorage.getItem('axe_pass_verification');
        if (!verificationEncrypted) return;

        try {
            const decryptedVerif = await decryptData(verificationEncrypted, passPasswordInput);
            if (decryptedVerif === "AXEFULL_SECURE_VERIFICATION") {
                setVaultPassword(passPasswordInput);
                setIsPassUnlocked(true);
                setIsPassIncorrect(false);
                setPassPasswordInput('');

                // Load and decrypt passwords list
                const encryptedData = localStorage.getItem('axe_pass_encrypted_data');
                if (encryptedData) {
                    const decryptedListStr = await decryptData(encryptedData, passPasswordInput);
                    setPasswords(JSON.parse(decryptedListStr));
                } else {
                    setPasswords([]);
                }
                toast.success('Desbloqueado', 'Acesso ao Cofre Pass liberado.');
            } else {
                throw new Error("Invalid decryption output");
            }
        } catch (err) {
            setIsPassIncorrect(true);
            setPassPasswordInput('');
            toast.error('Erro de Acesso', 'Senha ou PIN incorreto. Tente novamente.');
            console.error(err);
        }
    };

    const handleLockPassVault = () => {
        setIsPassUnlocked(false);
        setVaultPassword('');
        setPasswords([]);
        setPassPasswordInput('');
        toast.info('Cofre Bloqueado', 'Seu cofre de senhas foi bloqueado.');
    };

    const savePasswordsToVault = async (updatedList: PasswordEntry[]) => {
        if (!vaultPassword) return;
        try {
            const encrypted = await encryptData(JSON.stringify(updatedList), vaultPassword);
            localStorage.setItem('axe_pass_encrypted_data', encrypted);
            setPasswords(updatedList);
        } catch (err) {
            toast.error('Erro ao Salvar', 'Não foi possível salvar os dados criptografados.');
            console.error(err);
        }
    };

    const handleAddOrEditPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!passFormTitle.trim() || !passFormPassword.trim()) {
            toast.warning('Campos obrigatórios', 'Preencha o Título e a Senha.');
            return;
        }

        let updatedList: PasswordEntry[] = [];
        if (editingPassEntry) {
            updatedList = passwords.map(entry => {
                if (entry.id === editingPassEntry.id) {
                    return {
                        ...entry,
                        title: passFormTitle.trim(),
                        username: passFormUsername.trim(),
                        password: passFormPassword.trim(),
                        url: passFormUrl.trim(),
                        notes: passFormNotes.trim(),
                        updated_at: new Date().toISOString()
                    };
                }
                return entry;
            });
            toast.success('Atualizado', 'Registro atualizado com sucesso.');
        } else {
            const newEntry: PasswordEntry = {
                id: `pass-${Date.now()}`,
                title: passFormTitle.trim(),
                username: passFormUsername.trim(),
                password: passFormPassword.trim(),
                url: passFormUrl.trim(),
                notes: passFormNotes.trim(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            updatedList = [newEntry, ...passwords];
            toast.success('Adicionado', 'Nova senha salva com sucesso.');
        }

        await savePasswordsToVault(updatedList);
        setIsPassModalOpen(false);
        setEditingPassEntry(null);
        setPassFormTitle('');
        setPassFormUsername('');
        setPassFormPassword('');
        setPassFormUrl('');
        setPassFormNotes('');
    };

    const handleDeletePassword = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (confirm('Tem certeza que deseja excluir esta senha permanentemente?')) {
            const updated = passwords.filter(entry => entry.id !== id);
            await savePasswordsToVault(updated);
            toast.info('Excluído', 'A senha foi removida do cofre.');
        }
    };

    const handleWipeVault = () => {
        if (confirm('ATENÇÃO CRÍTICA:\n\nIsso apagará permanentemente todas as senhas salvas neste cofre e removerá as chaves de criptografia. Esta ação NÃO pode ser desfeita.\n\nDeseja realmente redefinir seu cofre?')) {
            localStorage.removeItem('axe_pass_verification');
            localStorage.removeItem('axe_pass_type');
            localStorage.removeItem('axe_pass_encrypted_data');
            setPassVaultConfigured(false);
            setIsPassUnlocked(false);
            setVaultPassword('');
            setPasswords([]);
            setPassPasswordInput('');
            setIsPassSettingsOpen(false);
            toast.warning('Redefinido', 'Cofre Pass apagado e redefinido para o padrão.');
        }
    };

    const handlePassPinPadClick = (num: string) => {
        if (passPasswordInput.length < 6) {
            setIsPassIncorrect(false);
            setPassPasswordInput(prev => prev + num);
        }
    };

    const handlePassPinBackspace = () => {
        setPassPasswordInput(prev => prev.slice(0, -1));
    };

    // Auto unlock if PIN input reaches length
    useEffect(() => {
        if (isPassSelected && !isPassUnlocked && passVaultConfigured && passType === 'pin') {
            if (passPasswordInput.length === 6) {
                handleUnlockPassVault();
            }
        }
    }, [passPasswordInput, isPassSelected, isPassUnlocked, passVaultConfigured, passType]);

    // Keyboard lock event for Pass Vault (PIN type)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isPassSelected || isPassUnlocked || !passVaultConfigured || passType !== 'pin') return;
            if (e.key >= '0' && e.key <= '9') {
                handlePassPinPadClick(e.key);
            } else if (e.key === 'Backspace') {
                handlePassPinBackspace();
            } else if (e.key === 'Enter') {
                handleUnlockPassVault();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPassSelected, isPassUnlocked, passVaultConfigured, passType, passPasswordInput]);

    // Strong Password Generator Helper
    const generateStrongPassword = () => {
        const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
        const numberChars = '0123456789';
        const symbolChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

        let allowedChars = '';
        if (generatorOptions.uppercase) allowedChars += uppercaseChars;
        if (generatorOptions.lowercase) allowedChars += lowercaseChars;
        if (generatorOptions.numbers) allowedChars += numberChars;
        if (generatorOptions.symbols) allowedChars += symbolChars;

        if (!allowedChars) {
            toast.warning('Aviso', 'Selecione pelo menos um tipo de caractere.');
            return;
        }

        let generatedPassword = '';
        for (let i = 0; i < generatorLength; i++) {
            const randomIndex = Math.floor(Math.random() * allowedChars.length);
            generatedPassword += allowedChars.charAt(randomIndex);
        }

        setPassFormPassword(generatedPassword);
        toast.info('Senha Gerada', 'Uma senha forte foi inserida no campo.');
    };

        }
        setIsEditMode(true);
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
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500" />
                    
                    <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4 text-amber-500 animate-pulse">
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
                                        ? 'bg-amber-500 border-amber-500 scale-110 shadow-[0_0_8px_rgba(245,158,11,0.5)]' 
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

    const renderPassVaultView = () => {
        // CASE 1: VAULT NOT CONFIGURED (SETUP FLOW)
        if (!passVaultConfigured) {
            return (
                <div className="flex-1 flex items-center justify-center p-8 select-none bg-theme-base overflow-y-auto">
                    <form 
                        onSubmit={handleSetupPassVault}
                        className="w-[420px] p-8 rounded-2xl border border-theme-border bg-theme-surface/80 backdrop-blur-xl shadow-2xl flex flex-col gap-5 relative overflow-hidden"
                    >
                        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500" />
                        
                        <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                            <Key size={26} />
                        </div>
                        
                        <div>
                            <h3 className="font-bold text-base text-theme-text">Configurar Cofre Pass</h3>
                            <p className="text-xs text-theme-text-muted mt-1 leading-relaxed">
                                Crie uma senha secundária para proteger suas senhas e dados confidenciais de forma segura e criptografada localmente.
                            </p>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="text-[10px] font-bold text-theme-text-muted uppercase tracking-wider block mb-1.5">
                                    Tipo de Senha
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setNewPassType('pin');
                                            setNewPassInput('');
                                            setNewPassConfirm('');
                                        }}
                                        className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                                            newPassType === 'pin'
                                                ? 'bg-amber-500/10 border-amber-500 text-amber-500 font-bold'
                                                : 'bg-theme-card border-theme-border text-theme-text-muted hover:text-theme-text'
                                        }`}
                                    >
                                        PIN (4 a 6 Números)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setNewPassType('text');
                                            setNewPassInput('');
                                            setNewPassConfirm('');
                                        }}
                                        className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                                            newPassType === 'text'
                                                ? 'bg-amber-500/10 border-amber-500 text-amber-500 font-bold'
                                                : 'bg-theme-card border-theme-border text-theme-text-muted hover:text-theme-text'
                                        }`}
                                    >
                                        Caracteres (Texto)
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-theme-text-muted uppercase tracking-wider block mb-1">
                                    {newPassType === 'pin' ? 'Digite o PIN Numérico' : 'Digite a Senha'}
                                </label>
                                <input
                                    type="password"
                                    pattern={newPassType === 'pin' ? '[0-9]*' : undefined}
                                    inputMode={newPassType === 'pin' ? 'numeric' : undefined}
                                    maxLength={newPassType === 'pin' ? 6 : undefined}
                                    placeholder={newPassType === 'pin' ? 'Ex: 123456' : 'Digite uma senha forte'}
                                    value={newPassInput}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setNewPassInput(newPassType === 'pin' ? val.replace(/[^0-9]/g, '') : val);
                                    }}
                                    className="w-full bg-theme-base border border-theme-border focus:border-amber-500 focus:outline-none rounded-lg px-3 py-2 text-xs text-theme-text tracking-wider"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-theme-text-muted uppercase tracking-wider block mb-1">
                                    Confirme a Senha
                                </label>
                                <input
                                    type="password"
                                    pattern={newPassType === 'pin' ? '[0-9]*' : undefined}
                                    inputMode={newPassType === 'pin' ? 'numeric' : undefined}
                                    maxLength={newPassType === 'pin' ? 6 : undefined}
                                    placeholder={newPassType === 'pin' ? 'Repita o PIN' : 'Repita a senha'}
                                    value={newPassConfirm}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setNewPassConfirm(newPassType === 'pin' ? val.replace(/[^0-9]/g, '') : val);
                                    }}
                                    className="w-full bg-theme-base border border-theme-border focus:border-amber-500 focus:outline-none rounded-lg px-3 py-2 text-xs text-theme-text tracking-wider"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full mt-2 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
                        >
                            <Shield size={14} /> Criar e Configurar Cofre
                        </button>
                    </form>
                </div>
            );
        }

        // CASE 2: VAULT CONFIGURED BUT LOCKED (UNLOCK SCREEN)
        if (!isPassUnlocked) {
            return (
                <div className="flex-1 flex flex-col items-center justify-center p-8 bg-theme-base select-none">
                    <div className="w-[380px] p-8 rounded-2xl border border-theme-border bg-theme-surface/80 backdrop-blur-xl shadow-2xl flex flex-col items-center relative overflow-hidden">
                        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500" />
                        
                        <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4 text-amber-500 animate-pulse">
                            <Key size={32} />
                        </div>

                        <h2 className="text-lg font-bold text-theme-text mb-1">Cofre Pass Bloqueado</h2>
                        <p className="text-xs text-theme-text-muted text-center mb-6">
                            Insira sua senha secundária para acessar seu cofre.
                        </p>

                        {passType === 'pin' ? (
                            /* PIN INPUT INTERFACE */
                            <>
                                {/* PIN dots */}
                                <div className="flex gap-4 mb-8">
                                    {[0, 1, 2, 3, 4, 5].map((idx) => (
                                        <div 
                                            key={idx} 
                                            className={`w-3.5 h-3.5 rounded-full border transition-all duration-200 ${
                                                passPasswordInput.length > idx 
                                                    ? 'bg-amber-500 border-amber-500 scale-110 shadow-[0_0_8px_rgba(245,158,11,0.5)]' 
                                                    : 'border-theme-border bg-transparent'
                                            } ${isPassIncorrect ? 'border-red-500 animate-bounce' : ''}`}
                                        />
                                    ))}
                                </div>

                                {/* Pinpad Keyboard */}
                                <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                        <button
                                            key={num}
                                            type="button"
                                            onClick={() => handlePassPinPadClick(num.toString())}
                                            className="h-14 rounded-xl border border-theme-border bg-theme-card hover:bg-theme-border text-theme-text font-bold text-lg transition-all active:scale-95 flex items-center justify-center"
                                        >
                                            {num}
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => setPassPasswordInput('')}
                                        className="h-14 rounded-xl text-xs font-semibold text-theme-text-muted hover:text-theme-text transition-colors flex items-center justify-center"
                                    >
                                        Limpar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handlePassPinPadClick('0')}
                                        className="h-14 rounded-xl border border-theme-border bg-theme-card hover:bg-theme-border text-theme-text font-bold text-lg transition-all active:scale-95 flex items-center justify-center"
                                    >
                                        0
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handlePassPinBackspace}
                                        className="h-14 rounded-xl text-xs font-semibold text-theme-text-muted hover:text-theme-text transition-colors flex items-center justify-center"
                                    >
                                        Apagar
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleUnlockPassVault}
                                    className="w-full mt-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                                >
                                    <Unlock size={14} /> Desbloquear
                                </button>
                            </>
                        ) : (
                            /* TEXT PASSWORD INPUT INTERFACE */
                            <div className="w-full flex flex-col gap-4">
                                <div className="relative">
                                    <input
                                        type="password"
                                        placeholder="Sua senha do cofre"
                                        value={passPasswordInput}
                                        onChange={(e) => setPassPasswordInput(e.target.value)}
                                        className="w-full bg-theme-base border border-theme-border focus:border-amber-500 focus:outline-none rounded-xl px-4 py-3 text-xs text-theme-text"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleUnlockPassVault();
                                        }}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleUnlockPassVault}
                                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                                >
                                    <Unlock size={14} /> Desbloquear Cofre
                                </button>
                            </div>
                        )}

                        <div className="border-t border-theme-border/50 w-full mt-6 pt-4 flex justify-between items-center text-[10px]">
                            <button
                                type="button"
                                onClick={handleWipeVault}
                                className="text-red-500 hover:text-red-600 hover:underline transition-colors font-semibold"
                            >
                                Redefinir Cofre (Apagar Tudo)
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        // CASE 3: VAULT UNLOCKED - PASSWORD DASHBOARD
        const filteredPasswords = passwords.filter(entry => {
            if (!searchPassQuery.trim()) return true;
            const q = searchPassQuery.toLowerCase();
            return entry.title.toLowerCase().includes(q) || 
                   entry.username.toLowerCase().includes(q) || 
                   (entry.notes && entry.notes.toLowerCase().includes(q));
        });

        return (
            <div className="flex-1 flex flex-col h-full bg-theme-base overflow-hidden">
                {/* Dashboard Header */}
                <div className="h-14 border-b border-theme-border px-6 flex items-center justify-between bg-theme-surface/30 backdrop-blur-sm shrink-0 select-none">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                            <Key size={16} />
                        </div>
                        <span className="font-bold text-sm text-theme-text">Cofre de Senhas</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setIsPassModalOpen(true);
                                setEditingPassEntry(null);
                                setPassFormTitle('');
                                setPassFormUsername('');
                                setPassFormPassword('');
                                setPassFormUrl('');
                                setPassFormNotes('');
                            }}
                            className="p-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold transition-colors flex items-center gap-1.5 text-xs shadow-sm"
                        >
                            <Plus size={14} /> Nova Senha
                        </button>
                        <button
                            type="button"
                            onClick={handleLockPassVault}
                            className="p-1.5 px-3 rounded-xl border border-theme-border bg-theme-card hover:bg-theme-border text-theme-text-muted hover:text-amber-500 transition-colors flex items-center gap-1.5 text-xs font-semibold"
                        >
                            <Lock size={12} /> Bloquear
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsPassSettingsOpen(true)}
                            className="p-2 rounded-xl border border-theme-border bg-theme-card text-theme-text-muted hover:text-theme-text hover:bg-theme-border transition-all"
                            title="Configurações do Cofre"
                        >
                            <Settings size={14} />
                        </button>
                    </div>
                </div>

                {/* Dashboard Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Search Bar for Passwords */}
                    <div className="relative max-w-md">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-text-faint" />
                        <input
                            type="text"
                            placeholder="Buscar nos registros do cofre..."
                            value={searchPassQuery}
                            onChange={(e) => setSearchPassQuery(e.target.value)}
                            className="w-full bg-theme-surface/50 border border-theme-border focus:border-amber-500 focus:outline-none rounded-xl py-2 pl-9 pr-4 text-xs text-theme-text placeholder-theme-text-faint transition-all"
                        />
                    </div>

                    {/* Passwords list */}
                    {filteredPasswords.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center select-none border border-dashed border-theme-border rounded-2xl bg-theme-surface/10">
                            <Key size={32} className="text-theme-text-faint mb-3 animate-pulse" />
                            <h4 className="font-bold text-sm text-theme-text">Nenhum registro encontrado</h4>
                            <p className="text-xs text-theme-text-muted max-w-xs mt-1 leading-relaxed">
                                {searchPassQuery.trim() 
                                    ? "Nenhum item corresponde aos critérios de busca informados." 
                                    : "Comece adicionando seu primeiro registro de conta ou senha clicando em Nova Senha."}
                            </p>
                            {!searchPassQuery.trim() && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsPassModalOpen(true);
                                        setEditingPassEntry(null);
                                        setPassFormTitle('');
                                        setPassFormUsername('');
                                        setPassFormPassword('');
                                        setPassFormUrl('');
                                        setPassFormNotes('');
                                    }}
                                    className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                                >
                                    <Plus size={14} /> Adicionar Senha
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredPasswords.map(entry => {
                                const showPass = !!visiblePasswordIds[entry.id];
                                return (
                                    <div 
                                        key={entry.id} 
                                        className="p-5 rounded-2xl border border-theme-border bg-theme-surface/40 hover:bg-theme-surface/70 transition-all flex flex-col justify-between gap-4 shadow-sm relative group"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-2.5 overflow-hidden">
                                                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 font-bold text-sm">
                                                    {entry.title.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="overflow-hidden">
                                                    <h4 className="font-bold text-xs text-theme-text truncate leading-snug">{entry.title}</h4>
                                                    {entry.url && (
                                                        <a 
                                                            href={entry.url.startsWith('http') ? entry.url : 'http://' + entry.url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="text-[10px] text-amber-500/80 hover:text-amber-500 hover:underline flex items-center gap-0.5 mt-0.5 truncate"
                                                        >
                                                            {entry.url.replace(/^https?:\/\/(www\.)?/, '')}
                                                            <ExternalLink size={8} />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditingPassEntry(entry);
                                                        setPassFormTitle(entry.title);
                                                        setPassFormUsername(entry.username);
                                                        setPassFormPassword(entry.password);
                                                        setPassFormUrl(entry.url || '');
                                                        setPassFormNotes(entry.notes || '');
                                                        setIsPassModalOpen(true);
                                                    }}
                                                    className="p-1 rounded bg-theme-card border border-theme-border text-theme-text-muted hover:text-theme-text"
                                                    title="Editar registro"
                                                >
                                                    <Edit3 size={11} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleDeletePassword(entry.id, e)}
                                                    className="p-1 rounded bg-theme-card border border-theme-border text-theme-text-muted hover:text-red-500 hover:border-red-500/20"
                                                    title="Excluir registro"
                                                >
                                                    <Trash2 size={11} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2.5 bg-theme-base/40 p-3 rounded-xl border border-theme-border/50 text-[11px]">
                                            {/* Username Field */}
                                            <div className="flex items-center justify-between gap-1 overflow-hidden">
                                                <div className="truncate flex-1">
                                                    <span className="text-[9px] text-theme-text-faint block uppercase tracking-wider font-semibold">Usuário / E-mail</span>
                                                    <span className="text-theme-text truncate block font-medium mt-0.5">{entry.username || 'Não informado'}</span>
                                                </div>
                                                {entry.username && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(entry.username);
                                                            setCopiedPassId(entry.id + '_user');
                                                            toast.success('Copiado', 'Usuário copiado.');
                                                            setTimeout(() => setCopiedPassId(null), 2000);
                                                        }}
                                                        className="p-1 text-theme-text-muted hover:text-theme-text shrink-0"
                                                        title="Copiar usuário"
                                                    >
                                                        {copiedPassId === entry.id + '_user' ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                                                    </button>
                                                )}
                                            </div>

                                            {/* Password Field */}
                                            <div className="flex items-center justify-between gap-1 overflow-hidden">
                                                <div className="truncate flex-1">
                                                    <span className="text-[9px] text-theme-text-faint block uppercase tracking-wider font-semibold">Senha</span>
                                                    <span className="text-theme-text font-mono truncate block mt-0.5 text-xs font-semibold tracking-wider">
                                                        {showPass ? entry.password : '••••••••••••'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-0.5 shrink-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setVisiblePasswordIds(prev => ({
                                                                ...prev,
                                                                [entry.id]: !prev[entry.id]
                                                            }));
                                                        }}
                                                        className="p-1 text-theme-text-muted hover:text-theme-text"
                                                        title={showPass ? "Ocultar senha" : "Exibir senha"}
                                                    >
                                                        {showPass ? <EyeOff size={11} /> : <Eye size={11} />}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(entry.password);
                                                            setCopiedPassId(entry.id + '_pass');
                                                            toast.success('Copiado', 'Senha copiada.');
                                                            setTimeout(() => setCopiedPassId(null), 2000);
                                                        }}
                                                        className="p-1 text-theme-text-muted hover:text-theme-text"
                                                        title="Copiar senha"
                                                    >
                                                        {copiedPassId === entry.id + '_pass' ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {entry.notes && (
                                            <div className="text-[10px] text-theme-text-muted/90 bg-theme-card/30 p-2.5 rounded-lg border border-theme-border/30 line-clamp-2">
                                                {entry.notes}
                                            </div>
                                        )}

                                        <div className="text-[8px] text-theme-text-faint text-right">
                                            Atualizado em: {new Date(entry.updated_at).toLocaleDateString('pt-BR', {
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-full w-full bg-theme-base overflow-hidden relative">
            
            {/* ─── SIDEBAR ────────────────────────────────────── */}
            <div className={`
                bg-theme-surface/70 backdrop-blur-md border-r border-theme-border flex flex-col h-full shrink-0 select-none
                transition-all duration-300 ease-in-out
                ${isSidebarCollapsed ? 'w-0 border-r-0 opacity-0 overflow-hidden' : 'w-[300px]'}
            `}>
                
                {/* Search Header */}
                <div className="p-4 border-b border-theme-border flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <StickyNote size={18} className="text-amber-500" />
                            <span className="font-bold text-sm text-theme-text">Bloco de Notas</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button 
                                onClick={() => setIsSettingsOpen(true)}
                                className="p-1.5 rounded-lg text-theme-text-muted hover:text-theme-text hover:bg-theme-card transition-all"
                                title="Segurança e Configurações"
                            >
                                <Settings size={15} />
                            </button>
                            <button 
                                onClick={() => setIsSidebarCollapsed(true)}
                                className="p-1.5 rounded-lg text-theme-text-muted hover:text-theme-text hover:bg-theme-card transition-all"
                                title="Recolher Menu"
                            >
                                <ChevronLeft size={15} />
                            </button>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-text-faint" />
                        <input
                            type="text"
                            placeholder="Buscar notas..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-theme-base/60 text-xs border border-theme-border focus:border-amber-500 focus:outline-none rounded-lg py-2 pl-9 pr-4 text-theme-text placeholder-theme-text-faint transition-all"
                        />
                    </div>
                </div>

                {/* Spaces list */}
                <div className="p-4 border-b border-theme-border bg-theme-base/20 flex flex-col shrink-0">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-theme-text-muted uppercase tracking-wider">Espaços</span>
                        <button 
                            onClick={() => setIsSpaceModalOpen(true)}
                            className="p-1 rounded bg-theme-card hover:bg-theme-border text-theme-text hover:text-amber-500 transition-colors flex items-center gap-1 text-[10px] font-medium"
                        >
                            <Plus size={10} /> Novo
                        </button>
                    </div>

                    <div className="flex flex-col gap-1 max-h-[160px] overflow-y-auto scrollbar-thin scrollbar-thumb-amber-500/20 hover:scrollbar-thumb-amber-500/40 pr-1">
                        {spaces.map(space => {
                            const isSelected = activeSpaceId === space.id && !isPassSelected;
                            return (
                                <div
                                    key={space.id}
                                    onClick={() => {
                                        setActiveSpaceId(space.id);
                                        const spaceNotes = notes.filter(n => n.spaceId === space.id);
                                        setActiveNoteId(spaceNotes.length > 0 ? spaceNotes[0].id : '');
                                        setIsPassSelected(false);
                                    }}
                                    onContextMenu={(e) => handleSpaceContextMenu(e, space.id)}
                                    className={`group flex items-center justify-between px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                                        isSelected 
                                            ? 'bg-gradient-to-r from-amber-500/10 to-transparent border-l-2 border-amber-500 text-theme-text font-semibold' 
                                            : 'text-theme-text-muted hover:bg-theme-card hover:text-theme-text'
                                    }`}
                                    title="Clique com o botão direito para opções"
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

                {/* ─── COFRE PASS SECTION ───────────────────────── */}
                <div className="p-3 border-b border-theme-border bg-theme-base/5 flex flex-col shrink-0">
                    <div
                        onClick={() => {
                            setIsPassSelected(true);
                            setActiveNoteId('');
                        }}
                        className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all ${
                            isPassSelected 
                                ? 'bg-gradient-to-r from-amber-500/20 to-transparent border-l-2 border-amber-500 text-theme-text font-bold shadow-sm' 
                                : 'text-theme-text-muted hover:bg-theme-card hover:text-theme-text'
                        }`}
                        title="Acesse suas senhas com segurança"
                    >
                        <div className="flex items-center gap-2 text-xs">
                            <Key size={14} className={isPassSelected ? 'text-amber-500' : 'text-theme-text-faint'} />
                            <span>Cofre Pass</span>
                        </div>
                        {isPassUnlocked ? (
                            <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-0.5 font-semibold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                                Aberto
                            </span>
                        ) : (
                            <span className="text-[8px] px-1.5 py-0.5 rounded bg-theme-border text-theme-text-muted border border-theme-border font-semibold">
                                Bloqueado
                            </span>
                        )}
                    </div>
                </div>

                {/* Notes list inside space */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="p-4 py-3 flex items-center justify-between shrink-0">
                        <span className="text-[10px] font-bold text-theme-text-muted uppercase tracking-wider">Notas</span>
                        <button 
                            onClick={handleCreateNote}
                            disabled={!activeSpaceId}
                            className="p-1.5 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black font-bold transition-colors flex items-center gap-1 text-[10px] shadow-sm"
                        >
                            <Plus size={10} strokeWidth={2.5} /> Nova Nota
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1 scrollbar-thin scrollbar-thumb-amber-500/20 hover:scrollbar-thumb-amber-500/40 pr-1">
                        {filteredNotes.length === 0 ? (
                            <div className="text-center py-8 text-theme-text-faint text-xs">
                                Nenhuma nota encontrada.
                            </div>
                        ) : (
                            filteredNotes.map(note => {
                                const isSelected = activeNoteId === note.id && !isPassSelected;
                                return (
                                    <div
                                        key={note.id}
                                        onClick={() => {
                                            setActiveNoteId(note.id);
                                            setIsEditMode(false);
                                            setIsPassSelected(false);
                                            if (window.innerWidth < 768) {
                                                setIsSidebarCollapsed(true);
                                            }
                                        }}
                                        onContextMenu={(e) => handleNoteContextMenu(e, note.id)}
                                        className={`group relative flex flex-col gap-1 p-3 rounded-lg cursor-pointer transition-all border ${
                                            isSelected 
                                                ? 'bg-theme-card border-theme-border shadow-sm' 
                                                : 'border-transparent hover:bg-theme-card/40 text-theme-text-muted'
                                        } ${note.isStarred ? 'border-amber-500/30 bg-gradient-to-r from-amber-500/[0.04] to-transparent' : ''}`}
                                        title="Botão direito para Mover ou Excluir"
                                    >
                                        
                                        {/* Glowing border highlight for starred notes */}
                                        {note.isStarred && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 rounded-l-lg shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
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
                                            {note.content.replace(/<[^>]*>?/gm, '').replace(/[#*`\-[\]]/g, '').trim() || 'Sem conteúdo...'}
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

            {/* ─── SIDEBAR EXPAND TOGGLE ──────────────────────── */}
            {isSidebarCollapsed && (
                <button
                    onClick={() => setIsSidebarCollapsed(false)}
                    className="absolute top-4 left-4 z-40 p-2 rounded-xl bg-theme-surface border border-theme-border text-theme-text-muted hover:text-theme-text shadow-md hover:bg-theme-card transition-all"
                    title="Expandir Menu"
                >
                    <Menu size={16} />
                </button>
            )}

            {/* ─── MAIN EDITOR AREA ───────────────────────────── */}
            <div className="flex-1 flex flex-col h-full bg-theme-base overflow-hidden">
                {isPassSelected ? (
                    renderPassVaultView()
                ) : activeNote ? (
                    <>
                        {/* Note Header */}
                        <div className="h-14 border-b border-theme-border px-6 flex items-center justify-between bg-theme-surface/30 backdrop-blur-sm shrink-0 select-none">
                            <div className="flex items-center gap-3 overflow-hidden flex-1 max-w-xl">
                                {isSidebarCollapsed && <div className="w-8" /> /* Spacing for the floating Menu button */}
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

                                {/* Pin / Float Button */}
                                <button
                                    onClick={() => setIsNotesFloating(true)}
                                    className="p-2 rounded-lg border bg-theme-card border-theme-border text-theme-text-muted hover:text-amber-500 hover:border-amber-500/50 transition-all"
                                    title="Fixar como Widget Flutuante"
                                >
                                    <Pin size={14} />
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
                        <div className="flex-1 overflow-hidden relative flex flex-col bg-theme-base">
                            <NoteTiptapEditor 
                                content={activeNote.content} 
                                onChange={handleUpdateNoteContent} 
                            />
                        </div>
                    </>
                ) : (
                    /* EMPTY STATE */
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none">
                        <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 mb-4 animate-bounce">
                            <StickyNote size={32} />
                        </div>
                        <h3 className="font-bold text-sm text-theme-text">Nenhuma Nota Aberta</h3>
                        <p className="text-xs text-theme-text-muted max-w-sm mt-1">
                            Selecione uma nota existente na barra lateral ou crie uma nova nota dentro de um Espaço para começar a estruturar suas ideias.
                        </p>
                        {activeSpaceId && (
                            <button
                                onClick={handleCreateNote}
                                className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
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
                                    className="w-full bg-theme-base border border-theme-border focus:border-amber-500 focus:outline-none rounded-lg px-3 py-2 text-xs text-theme-text"
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
                                                newSpaceIcon === emoji ? 'bg-amber-500/20 border border-amber-500/60 scale-105' : 'border border-transparent'
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
                                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
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

                        <div className="flex items-center gap-2 text-amber-500 border-b border-theme-border pb-3">
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
                                    className="h-4.5 w-8 rounded-full border-theme-border text-amber-500 focus:ring-amber-500/20 cursor-pointer"
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
                                                className="w-full text-center bg-theme-base border border-theme-border focus:border-amber-500 focus:outline-none rounded-lg px-2 py-1.5 text-xs text-theme-text tracking-widest font-mono"
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
                                                className="w-full text-center bg-theme-base border border-theme-border focus:border-amber-500 focus:outline-none rounded-lg px-2 py-1.5 text-xs text-theme-text tracking-widest font-mono"
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
                                    className="w-full py-2.5 border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 text-amber-500 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
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
                                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
                            >
                                Salvar Configurações
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ─── MODAL: ADD/EDIT PASSWORD ENTRY ────────────── */}
            {isPassModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none">
                    <form 
                        onSubmit={handleAddOrEditPassword}
                        className="w-[450px] p-6 rounded-2xl border border-theme-border bg-theme-surface shadow-2xl flex flex-col gap-4 animate-slide-up relative max-h-[90vh] overflow-y-auto"
                    >
                        <button 
                            type="button"
                            onClick={() => setIsPassModalOpen(false)}
                            className="absolute top-4 right-4 text-theme-text-muted hover:text-theme-text transition-colors"
                        >
                            <X size={16} />
                        </button>

                        <h3 className="font-bold text-sm text-theme-text border-b border-theme-border pb-2">
                            {editingPassEntry ? 'Editar Registro de Senha' : 'Salvar Nova Senha'}
                        </h3>
                        
                        <div className="flex flex-col gap-3.5">
                            <div>
                                <label className="text-[10px] font-bold text-theme-text-muted uppercase tracking-wider block mb-1">Título / Serviço *</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Google, Facebook, Servidor VPN"
                                    value={passFormTitle}
                                    onChange={(e) => setPassFormTitle(e.target.value)}
                                    className="w-full bg-theme-base border border-theme-border focus:border-amber-500 focus:outline-none rounded-lg px-3 py-2 text-xs text-theme-text"
                                    required
                                    maxLength={32}
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-theme-text-muted uppercase tracking-wider block mb-1">Usuário / E-mail / Login</label>
                                <input
                                    type="text"
                                    placeholder="Ex: fagner@gmail.com"
                                    value={passFormUsername}
                                    onChange={(e) => setPassFormUsername(e.target.value)}
                                    className="w-full bg-theme-base border border-theme-border focus:border-amber-500 focus:outline-none rounded-lg px-3 py-2 text-xs text-theme-text"
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-[10px] font-bold text-theme-text-muted uppercase tracking-wider">Senha *</label>
                                    <span className="text-[9px] text-amber-500 font-semibold">Mantenha segura</span>
                                </div>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Insira a senha da conta"
                                        value={passFormPassword}
                                        onChange={(e) => setPassFormPassword(e.target.value)}
                                        className="w-full bg-theme-base border border-theme-border focus:border-amber-500 focus:outline-none rounded-lg px-3 py-2 text-xs text-theme-text pr-10 font-mono"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password Generator Accordion/Panel */}
                            <div className="p-3 bg-theme-base/40 border border-theme-border rounded-xl flex flex-col gap-3">
                                <div className="flex items-center justify-between text-[10px] font-bold text-theme-text uppercase tracking-wider">
                                    <span>Gerador de Senha Forte</span>
                                    <button
                                        type="button"
                                        onClick={generateStrongPassword}
                                        className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-600 text-black text-[9px] font-bold flex items-center gap-1 transition-all active:scale-95"
                                    >
                                        <Shuffle size={10} /> Gerar Senha
                                    </button>
                                </div>

                                <div className="flex flex-col gap-2.5 text-xs">
                                    <div className="flex items-center justify-between text-[10px] text-theme-text-muted">
                                        <span>Comprimento: {generatorLength}</span>
                                        <input
                                            type="range"
                                            min={8}
                                            max={32}
                                            value={generatorLength}
                                            onChange={(e) => setGeneratorLength(parseInt(e.target.value))}
                                            className="w-1/2 accent-amber-500 h-1 rounded bg-theme-border cursor-pointer"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-[10px] text-theme-text-muted">
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={generatorOptions.uppercase}
                                                onChange={(e) => setGeneratorOptions(p => ({ ...p, uppercase: e.target.checked }))}
                                                className="accent-amber-500 cursor-pointer rounded"
                                            />
                                            MAIÚSCULAS
                                        </label>
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={generatorOptions.lowercase}
                                                onChange={(e) => setGeneratorOptions(p => ({ ...p, lowercase: e.target.checked }))}
                                                className="accent-amber-500 cursor-pointer rounded"
                                            />
                                            minúsculas
                                        </label>
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={generatorOptions.numbers}
                                                onChange={(e) => setGeneratorOptions(p => ({ ...p, numbers: e.target.checked }))}
                                                className="accent-amber-500 cursor-pointer rounded"
                                            />
                                            Números
                                        </label>
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={generatorOptions.symbols}
                                                onChange={(e) => setGeneratorOptions(p => ({ ...p, symbols: e.target.checked }))}
                                                className="accent-amber-500 cursor-pointer rounded"
                                            />
                                            Símbolos
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-theme-text-muted uppercase tracking-wider block mb-1">Link do Site / URL (Opcional)</label>
                                <input
                                    type="text"
                                    placeholder="Ex: https://accounts.google.com"
                                    value={passFormUrl}
                                    onChange={(e) => setPassFormUrl(e.target.value)}
                                    className="w-full bg-theme-base border border-theme-border focus:border-amber-500 focus:outline-none rounded-lg px-3 py-2 text-xs text-theme-text"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-theme-text-muted uppercase tracking-wider block mb-1">Notas / Observações (Opcional)</label>
                                <textarea
                                    placeholder="Detalhes adicionais, perguntas de segurança, etc."
                                    value={passFormNotes}
                                    onChange={(e) => setPassFormNotes(e.target.value)}
                                    className="w-full bg-theme-base border border-theme-border focus:border-amber-500 focus:outline-none rounded-lg px-3 py-2 text-xs text-theme-text h-16 resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2.5 mt-2 justify-end">
                            <button
                                type="button"
                                onClick={() => setIsPassModalOpen(false)}
                                className="px-4 py-2 border border-theme-border bg-theme-card hover:bg-theme-border rounded-xl text-xs font-semibold text-theme-text-muted transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
                            >
                                Salvar Registro
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ─── MODAL: COFRE SETTINGS ──────────────────────── */}
            {isPassSettingsOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none">
                    <div className="w-[400px] p-6 rounded-2xl border border-theme-border bg-theme-surface shadow-2xl flex flex-col gap-4 animate-slide-up relative">
                        <button 
                            type="button"
                            onClick={() => setIsPassSettingsOpen(false)}
                            className="absolute top-4 right-4 text-theme-text-muted hover:text-theme-text transition-colors"
                        >
                            <X size={16} />
                        </button>

                        <div className="flex items-center gap-2 text-amber-500 border-b border-theme-border pb-3">
                            <Settings size={18} />
                            <h3 className="font-bold text-sm text-theme-text">Configurações do Cofre</h3>
                        </div>

                        <div className="flex flex-col gap-4">
                            
                            {/* Reset / Wipe vault button */}
                            <div className="flex items-center justify-between p-3 rounded-xl bg-theme-base/60 border border-theme-border">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-xs font-bold text-theme-text">Limpar Todos os Dados</span>
                                    <span className="text-[10px] text-theme-text-muted">Apagar permanentemente todas as senhas.</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleWipeVault}
                                    className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-[10px] font-bold transition-colors"
                                >
                                    Redefinir Cofre
                                </button>
                            </div>

                            {/* Helpful Info Alert */}
                            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 flex gap-2.5 text-[11px] text-theme-text-muted leading-relaxed">
                                <ShieldAlert size={16} className="text-amber-500 shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-bold text-theme-text block mb-0.5">Segurança Avançada</span>
                                    Todos os registros de senhas armazenados neste cofre são protegidos por criptografia simétrica AES-GCM-256 localmente em seu computador. Nem a equipe Axefull nem terceiros têm acesso a essas informações.
                                </div>
                            </div>

                        </div>

                        <div className="flex gap-2.5 mt-2 justify-end">
                            <button
                                type="button"
                                onClick={() => setIsPassSettingsOpen(false)}
                                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-xl text-xs font-bold transition-all active:scale-95"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── CUSTOM CONTEXT MENU (RIGHT-CLICK) ───────────── */}
            {contextMenu.visible && (
                <div 
                    style={{ 
                        position: 'fixed', 
                        left: contextMenu.x, 
                        top: contextMenu.y, 
                        zIndex: 1000 
                    }}
                    className="w-48 bg-theme-surface/95 border border-theme-border/80 backdrop-blur-xl rounded-xl shadow-2xl p-1.5 flex flex-col gap-0.5 animate-fade-in"
                >
                    {contextMenu.noteId && (
                        <>
                            {/* Option: Toggle Star */}
                            <button
                                onClick={() => handleToggleStar(contextMenu.noteId!)}
                                className="w-full px-3 py-2 text-left text-xs font-medium text-theme-text hover:bg-theme-border hover:text-amber-500 rounded-lg flex items-center gap-2 transition-all"
                            >
                                <Star size={13} className="text-amber-500" fill={notes.find(n => n.id === contextMenu.noteId)?.isStarred ? 'currentColor' : 'none'} />
                                <span>
                                    {notes.find(n => n.id === contextMenu.noteId)?.isStarred ? 'Desfavoritar Nota' : 'Favoritar Nota'}
                                </span>
                            </button>

                            {/* Option: Move Note Header */}
                            <div className="border-t border-theme-border/60 my-1" />
                            <div className="px-3 py-1 text-[9px] font-bold text-theme-text-faint uppercase tracking-wider">Mover para Espaço</div>
                            
                            {/* List target spaces */}
                            {spaces
                                .filter(s => s.id !== notes.find(n => n.id === contextMenu.noteId)?.spaceId)
                                .map(space => (
                                    <button
                                        key={space.id}
                                        onClick={() => handleMoveNote(contextMenu.noteId!, space.id)}
                                        className="w-full px-4 py-1.5 text-left text-[11px] text-theme-text-muted hover:bg-theme-border hover:text-theme-text rounded-md flex items-center gap-1.5 transition-all truncate"
                                    >
                                        <span>{space.icon}</span>
                                        <span>{space.name}</span>
                                    </button>
                                ))
                            }
                            {spaces.filter(s => s.id !== notes.find(n => n.id === contextMenu.noteId)?.spaceId).length === 0 && (
                                <div className="px-4 py-1.5 text-[10px] text-theme-text-faint italic">Sem outros espaços</div>
                            )}

                            {/* Option: Delete Note */}
                            <div className="border-t border-theme-border/60 my-1" />
                            <button
                                onClick={() => handleDeleteNote(contextMenu.noteId!)}
                                className="w-full px-3 py-2 text-left text-xs font-medium text-red-400 hover:bg-red-500/10 hover:text-red-500 rounded-lg flex items-center gap-2 transition-all"
                            >
                                <Trash2 size={13} />
                                <span>Excluir Nota</span>
                            </button>
                        </>
                    )}

                    {contextMenu.spaceId && (
                        <>
                            {/* Option: Delete Space */}
                            <button
                                onClick={() => handleDeleteSpace(contextMenu.spaceId!)}
                                className="w-full px-3 py-2 text-left text-xs font-medium text-red-400 hover:bg-red-500/10 hover:text-red-500 rounded-lg flex items-center gap-2 transition-all"
                            >
                                <Trash2 size={13} />
                                <span>Excluir Espaço</span>
                            </button>
                        </>
                    )}
                </div>
            )}

        </div>
    );
};

export default NotesPage;
