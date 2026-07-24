import React, { useState, useEffect } from 'react';
import { CanvasInfo, updateCanvasInfo } from './canvasStorage';
import { DocEditor } from '../../components/Docs/DocEditor';

interface CanvasRichTextProps {
    canvasInfo: CanvasInfo;
    onUpdate: () => void;
    onSelectCanvas?: (id: string) => void;
}

export const CanvasRichText: React.FC<CanvasRichTextProps> = ({ canvasInfo, onUpdate }) => {
    const [title, setTitle] = useState(canvasInfo.name);
    const [icon, setIcon] = useState(canvasInfo.icon || '📝');
    const [content, setContent] = useState(canvasInfo.notes || '');

    useEffect(() => {
        setTitle(canvasInfo.name);
        setIcon(canvasInfo.icon || '📝');
        setContent(canvasInfo.notes || '');
    }, [canvasInfo.id, canvasInfo.name, canvasInfo.icon, canvasInfo.notes]);

    const handleTitleChange = (newTitle: string) => {
        setTitle(newTitle);
        updateCanvasInfo(canvasInfo.id, { name: newTitle });
        onUpdate();
    };

    const handleIconChange = (newIcon: string) => {
        setIcon(newIcon);
        updateCanvasInfo(canvasInfo.id, { icon: newIcon });
        onUpdate();
    };

    const handleContentChange = (newContent: string) => {
        setContent(newContent);
        updateCanvasInfo(canvasInfo.id, { notes: newContent });
        onUpdate();
    };

    return (
        <div className="w-full h-full bg-[#0b0c10] overflow-hidden flex flex-col">
            <DocEditor
                noteId={canvasInfo.id}
                title={title}
                icon={icon}
                content={content}
                updatedAt={canvasInfo.updatedAt ? new Date(canvasInfo.updatedAt).toISOString() : undefined}
                onTitleChange={handleTitleChange}
                onIconChange={handleIconChange}
                onContentChange={handleContentChange}
            />
        </div>
    );
};

export default CanvasRichText;
