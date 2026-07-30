import { Node, mergeAttributes } from '@tiptap/core';

// Single Column Item Node
export const ColumnNode = Node.create({
    name: 'columnNode',
    content: 'block+',
    isolating: true,

    parseHTML() {
        return [{ tag: 'div[data-type="columnNode"]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            'div',
            mergeAttributes(
                {
                    'data-type': 'columnNode',
                    class: 'column-node-item border border-dashed border-white/15 hover:border-white/30 focus-within:border-emerald-500/50 rounded-xl p-3 bg-white/[0.01] transition-all min-h-[80px]'
                },
                HTMLAttributes
            ),
            0,
        ];
    },
});

// Container Column Block Node
export const ColumnBlockNode = Node.create({
    name: 'columnBlock',
    group: 'block',
    content: 'columnNode+',
    draggable: true,
    selectable: true,

    addAttributes() {
        return {
            columns: {
                default: 2,
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="columnBlock"]',
                getAttrs: (element) => {
                    const el = element as HTMLElement;
                    return {
                        columns: parseInt(el.getAttribute('data-columns') || '2', 10),
                    };
                },
            },
        ];
    },

    renderHTML({ HTMLAttributes, node }) {
        const cols = node.attrs.columns || 2;
        return [
            'div',
            mergeAttributes(
                {
                    'data-type': 'columnBlock',
                    'data-columns': cols,
                    style: `display: grid; grid-template-columns: repeat(${cols}, 1fr); gap: 16px; margin: 16px 0;`,
                    class: 'column-block-grid relative group/cols'
                },
                HTMLAttributes
            ),
            0,
        ];
    },
});
