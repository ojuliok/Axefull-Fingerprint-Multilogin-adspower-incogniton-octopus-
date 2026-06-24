import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { createLowlight } from 'lowlight';
import js from 'highlight.js/lib/languages/javascript';
import ts from 'highlight.js/lib/languages/typescript';
import html from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';

const lowlight = createLowlight();
lowlight.register('js', js);
lowlight.register('ts', ts);
lowlight.register('html', html);
lowlight.register('css', css);

interface NoteTiptapEditorProps {
    content: string;
    onChange: (html: string) => void;
    placeholder?: string;
}

// Convert markdown to HTML roughly if needed, or just let Tiptap handle HTML
// Note: If old notes are raw Markdown, they will render as plain text in Tiptap until edited.
const convertMarkdownToHTML = (md: string) => {
    if (!md) return '';
    // If it already looks like HTML, return it
    if (md.includes('<p>') || md.includes('<h1>')) return md;
    
    // Very basic fallback conversion for legacy markdown notes
    let html = md
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*)\*/gim, '<em>$1</em>')
        .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');
    
    // Convert newlines to paragraphs
    const paragraphs = html.split('\n\n').map(p => {
        if (p.startsWith('<h') || p.startsWith('<block')) return p;
        return `<p>${p.replace(/\n/g, '<br/>')}</p>`;
    });
    
    return paragraphs.join('');
};

const NoteTiptapEditor: React.FC<NoteTiptapEditorProps> = ({ content, onChange, placeholder = "Escreva sua nota aqui..." }) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                codeBlock: false, // We'll use lowlight instead
            }),
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
            Placeholder.configure({
                placeholder,
                emptyEditorClass: 'is-editor-empty',
            }),
            CodeBlockLowlight.configure({
                lowlight,
            }),
        ],
        content: content.includes('<') ? content : convertMarkdownToHTML(content),
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose-base prose-invert max-w-none focus:outline-none min-h-[500px] pb-32 text-theme-text font-inter',
            },
        },
    });

    // Update editor content if note changes externally (e.g., selecting another note)
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            const html = content.includes('<') ? content : convertMarkdownToHTML(content);
            if (html !== editor.getHTML()) {
                editor.commands.setContent(html);
            }
        }
    }, [content, editor]);

    return (
        <div className="flex-1 overflow-y-auto px-6 md:px-16 py-8 scrollbar-thin cursor-text">
            <EditorContent editor={editor} className="max-w-3xl mx-auto" />
            <style>{`
                .ProseMirror p.is-editor-empty:first-child::before {
                    content: attr(data-placeholder);
                    float: left;
                    color: var(--text-faint, #a1a1aa);
                    pointer-events: none;
                    height: 0;
                }
                .ProseMirror h1 { font-size: 1.875rem; font-weight: 900; margin-top: 1.5rem; margin-bottom: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem; }
                .ProseMirror h2 { font-size: 1.5rem; font-weight: 800; margin-top: 1.25rem; margin-bottom: 0.5rem; }
                .ProseMirror h3 { font-size: 1.25rem; font-weight: 700; margin-top: 1rem; margin-bottom: 0.5rem; }
                .ProseMirror ul[data-type="taskList"] { list-style: none; padding: 0; }
                .ProseMirror ul[data-type="taskList"] li { display: flex; align-items: start; margin-bottom: 0.5rem; gap: 0.5rem; }
                .ProseMirror ul[data-type="taskList"] li > label { margin-top: 0.25rem; }
                .ProseMirror ul[data-type="taskList"] li > label input { cursor: pointer; accent-color: #f59e0b; }
                .ProseMirror ul { list-style-type: disc; padding-left: 1.5rem; margin-top: 0.5rem; margin-bottom: 0.5rem; }
                .ProseMirror ol { list-style-type: decimal; padding-left: 1.5rem; margin-top: 0.5rem; margin-bottom: 0.5rem; }
                .ProseMirror li p { margin: 0; }
                .ProseMirror code { background-color: rgba(255,255,255,0.1); padding: 0.2rem 0.4rem; border-radius: 0.25rem; font-size: 0.875em; color: #f59e0b; }
                .ProseMirror pre { background-color: #09090b; padding: 1rem; border-radius: 0.5rem; margin-top: 0.5rem; margin-bottom: 0.5rem; overflow-x: auto; border: 1px solid rgba(255,255,255,0.1); }
                .ProseMirror pre code { background-color: transparent; color: inherit; padding: 0; }
                .ProseMirror blockquote { border-left: 3px solid #f59e0b; padding-left: 1rem; margin-left: 0; color: #a1a1aa; font-style: italic; }
            `}</style>
        </div>
    );
};

export default NoteTiptapEditor;
