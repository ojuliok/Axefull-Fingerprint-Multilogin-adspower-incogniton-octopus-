import React, { useState, useEffect, useRef } from 'react';
import { CanvasInfo, updateCanvasInfo } from './canvasStorage';
import { Image, Trash2, X, Upload } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import TiptapImage from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';

import styles from './CanvasRichText.module.css';

interface CanvasRichTextProps {
    canvasInfo: CanvasInfo;
    onUpdate: () => void;
    onSelectCanvas?: (id: string) => void;
}

// Helper to convert old JSON blocks to HTML
const convertOldBlocksToHTML = (notes: string) => {
    if (!notes || !notes.trim().startsWith('[')) return notes;
    try {
        const blocks = JSON.parse(notes);
        if (!Array.isArray(blocks)) return notes;
        
        return blocks.map(block => {
            switch (block.type) {
                case 'h1': return `<h1>${block.content || ''}</h1>`;
                case 'h2': return `<h2>${block.content || ''}</h2>`;
                case 'h3': return `<h3>${block.content || ''}</h3>`;
                case 'todo': return `<ul data-type="taskList"><li data-type="taskItem" data-checked="${block.checked ? 'true' : 'false'}"><p>${block.content || ''}</p></li></ul>`;
                case 'bullet': return `<ul><li><p>${block.content || ''}</p></li></ul>`;
                case 'quote': return `<blockquote><p>${block.content || ''}</p></blockquote>`;
                case 'callout': return `<blockquote><p>${block.meta?.emoji || '💡'} ${block.content || ''}</p></blockquote>`;
                case 'code': return `<pre><code>${block.content || ''}</code></pre>`;
                case 'image': return block.meta?.url ? `<img src="${block.meta.url}" />` : '';
                case 'database': return `<p><em>[Banco de Dados Relacionado: ${block.meta?.tableId}]</em></p>`;
                case 'page': return `<p><em>[Página Relacionada: ${block.meta?.pageId}]</em></p>`;
                case 'canvas': return `<p><em>[Quadro Relacionado: ${block.meta?.canvasId}]</em></p>`;
                default: return `<p>${block.content || ''}</p>`;
            }
        }).join('');
    } catch (e) {
        return notes;
    }
};

const CanvasRichText: React.FC<CanvasRichTextProps> = ({ canvasInfo, onUpdate, onSelectCanvas }) => {
    const [title, setTitle] = useState(canvasInfo.name);
    
    // Cover Image States
    const [showCoverMenu, setShowCoverMenu] = useState(false);
    const [coverLinkUrl, setCoverLinkUrl] = useState('');
    const coverFileInputRef = useRef<HTMLInputElement>(null);

    const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target?.result as string;
            updateCanvasInfo(canvasInfo.id, { coverImage: base64 });
            onUpdate();
            setShowCoverMenu(false);
        };
        reader.readAsDataURL(file);
    };

    const handleCoverLinkSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (coverLinkUrl.trim()) {
            updateCanvasInfo(canvasInfo.id, { coverImage: coverLinkUrl.trim() });
            onUpdate();
            setShowCoverMenu(false);
            setCoverLinkUrl('');
        }
    };

    const handleRemoveCover = () => {
        updateCanvasInfo(canvasInfo.id, { coverImage: undefined });
        onUpdate();
    };

    // Save timeout ref
    const saveTimeout = useRef<NodeJS.Timeout | null>(null);

    const triggerSave = (t: string, html: string) => {
        if (saveTimeout.current) clearTimeout(saveTimeout.current);
        saveTimeout.current = setTimeout(() => {
            updateCanvasInfo(canvasInfo.id, { 
                name: t, 
                notes: html 
            });
            onUpdate();
        }, 500);
    };

    // Tiptap Editor setup
    const editor = useEditor({
        extensions: [
            StarterKit,
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
            Placeholder.configure({
                placeholder: 'Comece a digitar texto ou use markdown (# para título, - para lista)...',
            }),
            TiptapImage,
            Link.configure({
                openOnClick: false,
            }),
        ],
        content: convertOldBlocksToHTML(canvasInfo.notes || ''),
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            triggerSave(title, html);
        },
    });

    useEffect(() => {
        setTitle(canvasInfo.name);
        if (editor) {
            const currentHtml = editor.getHTML();
            const newContent = canvasInfo.notes;
            
            // If the note is empty or we are loading a totally different note, set it
            if (!newContent) {
                if (currentHtml !== '<p></p>') editor.commands.setContent('');
            } else if (newContent.trim().startsWith('[')) {
                // If it's old JSON format, convert and set it
                const converted = convertOldBlocksToHTML(newContent);
                if (currentHtml !== converted) editor.commands.setContent(converted);
            } else {
                // It's normal HTML
                // Only update if it's completely different to avoid losing cursor position
                if (currentHtml !== newContent && document.activeElement?.className !== 'tiptap ProseMirror') {
                    editor.commands.setContent(newContent);
                }
            }
        }
    }, [canvasInfo.id, editor]);

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTitle = e.target.value;
        setTitle(newTitle);
        if (editor) {
            triggerSave(newTitle, editor.getHTML());
        }
    };

    return (
        <div className={styles.editorContainer}>
            <div className={styles.editorContentWrapper}>
                {/* Cover Image Section */}
                {canvasInfo.coverImage ? (
                    <div className={styles.coverImageContainer}>
                        <img src={canvasInfo.coverImage} className={styles.coverImage} alt="Cover" />
                        <div className={styles.coverImageActions}>
                            <button onClick={() => setShowCoverMenu(!showCoverMenu)} className={styles.coverActionBtn}>
                                <Image size={14} /> Alterar Capa
                            </button>
                            <button onClick={handleRemoveCover} className={styles.coverActionBtn}>
                                <Trash2 size={14} /> Remover
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className={styles.addCoverWrapper}>
                        <button className={styles.addCoverBtn} onClick={() => setShowCoverMenu(!showCoverMenu)}>
                            <Image size={14} /> Adicionar Capa
                        </button>
                    </div>
                )}

                {showCoverMenu && (
                    <div className={styles.coverMenuPopover}>
                        <div className={styles.coverMenuHeader}>
                            Adicionar capa
                            <button onClick={() => setShowCoverMenu(false)}><X size={14} /></button>
                        </div>
                        <div className={styles.coverMenuBody}>
                            <button 
                                className={styles.coverMenuOption}
                                onClick={() => coverFileInputRef.current?.click()}
                            >
                                <Upload size={14} /> Fazer upload de arquivo
                            </button>
                            <div className={styles.coverMenuDivider} />
                            <form onSubmit={handleCoverLinkSubmit} className={styles.coverLinkForm}>
                                <input 
                                    type="url" 
                                    value={coverLinkUrl}
                                    onChange={(e) => setCoverLinkUrl(e.target.value)}
                                    placeholder="Colar link da imagem..."
                                    className={styles.coverLinkInput}
                                    autoFocus
                                />
                                <button type="submit" className={styles.coverLinkSubmit}>Inserir</button>
                            </form>
                        </div>
                        <input 
                            type="file" 
                            ref={coverFileInputRef} 
                            style={{ display: 'none' }} 
                            accept="image/*"
                            onChange={handleCoverFileChange}
                        />
                    </div>
                )}

                <input
                    type="text"
                    value={title}
                    onChange={handleTitleChange}
                    placeholder="Sem título"
                    className={styles.titleInput}
                />

                <div className={styles.tiptapEditorWrapper}>
                    <EditorContent editor={editor} />
                </div>
            </div>
        </div>
    );
};

export default CanvasRichText;
