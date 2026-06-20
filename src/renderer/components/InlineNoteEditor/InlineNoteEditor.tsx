import React, { useState, useRef, useEffect } from 'react';

interface InlineNoteEditorProps {
    value: string | null;
    onChange: (value: string) => void;
    placeholder?: string;
}

const InlineNoteEditor: React.FC<InlineNoteEditorProps> = ({
    value,
    onChange,
    placeholder = 'Add notes...',
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value || '');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleStartEdit = () => {
        setEditValue(value || '');
        setIsEditing(true);
    };

    const handleSave = () => {
        onChange(editValue.trim());
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            setEditValue(value || '');
            setIsEditing(false);
        }
    };

    if (isEditing) {
        return (
            <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className="w-full px-2 py-1 text-sm bg-dark-700 border border-primary-500 rounded text-white focus:outline-none"
                placeholder={placeholder}
            />
        );
    }

    return (
        <div
            onClick={handleStartEdit}
            className={`px-2 py-1 text-sm rounded cursor-pointer transition-all duration-200 hover:bg-dark-700/50 ${value ? 'text-dark-200' : 'text-dark-500 italic'
                }`}
        >
            {value || placeholder}
        </div>
    );
};

export default InlineNoteEditor;
