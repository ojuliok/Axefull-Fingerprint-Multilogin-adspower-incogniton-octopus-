import React from 'react';
import { Editor } from '@tiptap/react';
import { 
    Bold, Italic, Strikethrough, Code, Link, Heading1, Heading2, 
    CheckSquare, Palette 
} from 'lucide-react';

interface BubbleMenuToolbarProps {
    editor: Editor | null;
    onOpenColorMenu?: (e: React.MouseEvent) => void;
}

export const BubbleMenuToolbar: React.FC<BubbleMenuToolbarProps> = ({ editor, onOpenColorMenu }) => {
    if (!editor || editor.isDestroyed || !editor.view) return null;

    const toggleBold = () => editor.chain().focus().toggleBold().run();
    const toggleItalic = () => editor.chain().focus().toggleItalic().run();
    const toggleStrike = () => editor.chain().focus().toggleStrike().run();
    const toggleCode = () => editor.chain().focus().toggleCode().run();
    const toggleH1 = () => editor.chain().focus().toggleHeading({ level: 1 }).run();
    const toggleH2 = () => editor.chain().focus().toggleHeading({ level: 2 }).run();
    const toggleTaskList = () => editor.chain().focus().toggleTaskList().run();

    const setLink = () => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL do link:', previousUrl);
        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    return (
        <div className="flex items-center gap-0.5 p-1 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl backdrop-blur-md text-xs text-zinc-200 select-none animate-in fade-in zoom-in-95 duration-100">
            <button
                type="button"
                onClick={toggleBold}
                className={`p-1.5 rounded-lg transition-colors ${editor.isActive('bold') ? 'bg-amber-500/20 text-amber-300' : 'hover:bg-white/10 text-zinc-400 hover:text-white'}`}
                title="Negrito (Ctrl+B)"
            >
                <Bold className="w-3.5 h-3.5" />
            </button>

            <button
                type="button"
                onClick={toggleItalic}
                className={`p-1.5 rounded-lg transition-colors ${editor.isActive('italic') ? 'bg-amber-500/20 text-amber-300' : 'hover:bg-white/10 text-zinc-400 hover:text-white'}`}
                title="Itálico (Ctrl+I)"
            >
                <Italic className="w-3.5 h-3.5" />
            </button>

            <button
                type="button"
                onClick={toggleStrike}
                className={`p-1.5 rounded-lg transition-colors ${editor.isActive('strike') ? 'bg-amber-500/20 text-amber-300' : 'hover:bg-white/10 text-zinc-400 hover:text-white'}`}
                title="Tachado"
            >
                <Strikethrough className="w-3.5 h-3.5" />
            </button>

            <button
                type="button"
                onClick={toggleCode}
                className={`p-1.5 rounded-lg transition-colors ${editor.isActive('code') ? 'bg-amber-500/20 text-amber-300' : 'hover:bg-white/10 text-zinc-400 hover:text-white'}`}
                title="Código Inline"
            >
                <Code className="w-3.5 h-3.5" />
            </button>

            <div className="w-px h-4 bg-white/10 my-auto mx-0.5" />

            <button
                type="button"
                onClick={toggleH1}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-amber-500/20 text-amber-300' : 'hover:bg-white/10 text-zinc-400 hover:text-white'}`}
                title="Título 1"
            >
                H1
            </button>

            <button
                type="button"
                onClick={toggleH2}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-amber-500/20 text-amber-300' : 'hover:bg-white/10 text-zinc-400 hover:text-white'}`}
                title="Título 2"
            >
                H2
            </button>

            <button
                type="button"
                onClick={toggleTaskList}
                className={`p-1.5 rounded-lg transition-colors ${editor.isActive('taskList') ? 'bg-amber-500/20 text-amber-300' : 'hover:bg-white/10 text-zinc-400 hover:text-white'}`}
                title="To-Do List"
            >
                <CheckSquare className="w-3.5 h-3.5" />
            </button>

            <div className="w-px h-4 bg-white/10 my-auto mx-0.5" />

            <button
                type="button"
                onClick={setLink}
                className={`p-1.5 rounded-lg transition-colors ${editor.isActive('link') ? 'bg-amber-500/20 text-amber-300' : 'hover:bg-white/10 text-zinc-400 hover:text-white'}`}
                title="Inserir Link"
            >
                <Link className="w-3.5 h-3.5" />
            </button>

            {onOpenColorMenu && (
                <button
                    type="button"
                    onClick={onOpenColorMenu}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-amber-300 transition-colors"
                    title="Cores de Texto e Fundo"
                >
                    <Palette className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    );
};
