import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useState, useCallback } from 'react';
import { NotionDatabase } from './NotionDatabase';

interface DatabaseNodeViewProps {
    node: {
        attrs: {
            viewType: 'table' | 'kanban' | 'list';
            dbId: string;
        };
    };
    deleteNode: () => void;
    editor: any;
    getPos: () => number;
}

const DatabaseNodeView: React.FC<DatabaseNodeViewProps> = ({
    node,
    deleteNode,
    editor,
    getPos,
}) => {
    const [showTextAbove, setShowTextAbove] = useState(false);
    const [showTextBelow, setShowTextBelow] = useState(false);

    const handleAddTextAbove = useCallback(() => {
        if (!editor || editor.isDestroyed || !editor.view) return;
        try {
            const pos = getPos();
            editor.chain()
                .insertContentAt(pos, { type: 'paragraph' })
                .setTextSelection(pos)
                .focus()
                .run();
        } catch (e) {
            console.warn('[DatabaseNodeView] addTextAbove error:', e);
        }
    }, [editor, getPos]);

    const handleAddTextBelow = useCallback(() => {
        if (!editor || editor.isDestroyed || !editor.view) return;
        try {
            const pos = getPos();
            const nodeSize = node.attrs ? 1 : 1;
            const afterPos = pos + nodeSize + 1;
            editor.chain()
                .insertContentAt(afterPos, { type: 'paragraph' })
                .setTextSelection(afterPos)
                .focus()
                .run();
        } catch (e) {
            console.warn('[DatabaseNodeView] addTextBelow error:', e);
        }
    }, [editor, getPos, node]);

    return (
        <NodeViewWrapper
            as="div"
            className="database-node-wrapper"
            data-drag-handle=""
            contentEditable={false}
        >
            <NotionDatabase
                id={node.attrs.dbId}
                initialViewType={node.attrs.viewType}
                onDelete={deleteNode}
                onAddTextAbove={handleAddTextAbove}
                onAddTextBelow={handleAddTextBelow}
            />
        </NodeViewWrapper>
    );
};

export const DatabaseBlockNode = Node.create({
    name: 'databaseBlock',
    group: 'block',
    atom: true,
    draggable: true,
    selectable: true,

    addAttributes() {
        return {
            viewType: {
                default: 'table',
            },
            dbId: {
                default: () => `db-${Date.now()}`,
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="databaseBlock"]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes({ 'data-type': 'databaseBlock' }, HTMLAttributes)];
    },

    addNodeView() {
        return ReactNodeViewRenderer(DatabaseNodeView);
    },
});
