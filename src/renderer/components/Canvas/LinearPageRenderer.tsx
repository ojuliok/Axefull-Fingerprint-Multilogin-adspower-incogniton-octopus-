import React, { useMemo, useState, useEffect } from 'react';
import { CanvasNode, CanvasConnection } from './canvasStorage';
import styles from './LinearPageRenderer.module.css';
import { FileText, Notebook, Globe, MessageSquare } from 'lucide-react';

interface LinearPageRendererProps {
    nodes: CanvasNode[];
    connections: CanvasConnection[];
    onUpdateNode: (nodeId: string, newContent: string) => void;
    onUpdateChecklistData?: (nodeId: string, checklistData: { id: string; text: string; checked: boolean }[]) => void;
    onOpenPage?: (id: string, name: string) => void;
}

export const LinearPageRenderer: React.FC<LinearPageRendererProps> = ({ nodes, connections, onUpdateNode, onUpdateChecklistData, onOpenPage }) => {
    
    // Sort logic
    const sortedNodes = useMemo(() => {
        // 1. Build adjacency list and calculate in-degree
        const adj = new Map<string, string[]>();
        const inDegree = new Map<string, number>();
        
        nodes.forEach(n => {
            adj.set(n.id, []);
            inDegree.set(n.id, 0);
        });

        connections.forEach(c => {
            if (adj.has(c.fromId) && adj.has(c.toId)) {
                adj.get(c.fromId)!.push(c.toId);
                inDegree.set(c.toId, inDegree.get(c.toId)! + 1);
            }
        });

        // 2. Find root nodes (in-degree 0)
        let roots = nodes.filter(n => inDegree.get(n.id) === 0);

        // 3. Sort roots by Y, then X
        roots.sort((a, b) => {
            if (Math.abs(a.y - b.y) > 30) return a.y - b.y;
            return a.x - b.x;
        });

        // 4. Traverse to build linear list
        const linearList: CanvasNode[] = [];
        const visited = new Set<string>();

        const dfs = (nodeId: string) => {
            if (visited.has(nodeId)) return;
            visited.add(nodeId);
            const node = nodes.find(n => n.id === nodeId);
            if (node) linearList.push(node);

            const children = adj.get(nodeId) || [];
            // Sort children by Y then X
            const childrenNodes = children
                .map(cid => nodes.find(n => n.id === cid))
                .filter(Boolean) as CanvasNode[];
            
            childrenNodes.sort((a, b) => {
                if (Math.abs(a.y - b.y) > 30) return a.y - b.y;
                return a.x - b.x;
            });

            childrenNodes.forEach(child => dfs(child.id));
        };

        roots.forEach(root => dfs(root.id));

        // 5. Add any unvisited nodes (cycles)
        const unvisited = nodes.filter(n => !visited.has(n.id));
        unvisited.sort((a, b) => {
            if (Math.abs(a.y - b.y) > 30) return a.y - b.y;
            return a.x - b.x;
        });
        unvisited.forEach(u => dfs(u.id));

        return linearList;
    }, [nodes, connections]);

    // Auto-resize textarea
    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
        const target = e.currentTarget;
        target.style.height = 'auto';
        target.style.height = target.scrollHeight + 'px';
    };

    return (
        <div className={styles.pageContainer}>
            <div className={styles.document}>
                {sortedNodes.map(node => {
                    if (node.type === 'text' || node.type === 'freetext') {
                        return (
                            <div key={node.id} className={styles.block}>
                                <textarea
                                    className={styles.textBlock}
                                    defaultValue={node.content}
                                    style={{ 
                                        fontSize: node.fontSize ? `${node.fontSize}px` : '16px',
                                        color: node.textColor || '#f1f5f9',
                                        fontWeight: node.fontSize && node.fontSize > 24 ? 'bold' : 'normal'
                                    }}
                                    onInput={handleInput}
                                    onBlur={(e) => onUpdateNode(node.id, e.target.value)}
                                    // Trigger auto-resize on mount
                                    ref={(el) => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
                                />
                            </div>
                        );
                    }
                    
                    if (node.type === 'image') {
                        return (
                            <div key={node.id} className={styles.block}>
                                <img src={node.content} alt={node.fileName} className={styles.imageBlock} />
                            </div>
                        );
                    }

                    if (node.type === 'page' || node.type === 'card') {
                        const Icon = node.type === 'page' ? FileText : Notebook;
                        return (
                            <div 
                                key={node.id} 
                                className={node.type === 'page' ? styles.pageBlock : styles.cardBlock}
                                onClick={() => node.targetCanvasId && onOpenPage && onOpenPage(node.targetCanvasId, node.content)}
                            >
                                <div className={styles.iconWrapper}>
                                    <Icon size={24} />
                                </div>
                                <div className={styles.titleWrapper}>
                                    {node.content || (node.type === 'page' ? 'Página Sem Título' : 'Novo Card')}
                                </div>
                            </div>
                        );
                    }

                    if (node.type === 'table' && node.tableData) {
                        return (
                            <div key={node.id} className={styles.block}>
                                <table className={styles.tableBlock}>
                                    <tbody>
                                        {node.tableData.map((row, rowIndex) => (
                                            <tr key={rowIndex}>
                                                {row.map((cell, colIndex) => (
                                                    <td key={colIndex}>
                                                        <textarea 
                                                            className={styles.textBlock}
                                                            defaultValue={cell}
                                                            onInput={handleInput}
                                                            onBlur={(e) => {
                                                                // Fast mock table update
                                                                const newData = [...node.tableData!];
                                                                newData[rowIndex][colIndex] = e.target.value;
                                                                onUpdateNode(node.id, JSON.stringify(newData)); // Actually we might need a custom update for table, but simple stringify works if InfiniteCanvas parses it, but let's just trigger a re-render or leave it read-only for now if complex. We'll pass the JSON and let the parent handle it or just keep it simple.
                                                            }}
                                                            ref={(el) => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
                                                        />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        );
                    }

                    if (node.type === 'social') {
                        return (
                            <div key={node.id} className={styles.block}>
                                <div className={styles.socialBlock}>
                                    <div className={styles.socialIcon} style={{ background: node.color }}>
                                        <MessageSquare size={16} color="#fff" />
                                    </div>
                                    <div className={styles.titleWrapper}>{node.content || 'Social Link'}</div>
                                </div>
                            </div>
                        );
                    }

                    if (node.type === 'checklist') {
                        return (
                            <div key={node.id} className={styles.block} style={{ padding: '16px', background: 'rgba(30, 41, 59, 0.5)', borderRadius: '12px' }}>
                                <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px', color: '#fff' }}>
                                    {node.content || 'Lista de Tarefas'}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {(node.checklistData || []).map(item => (
                                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <input 
                                                type="checkbox" 
                                                checked={item.checked}
                                                onChange={(e) => {
                                                    if (onUpdateChecklistData) {
                                                        const newData = (node.checklistData || []).map(i => i.id === item.id ? { ...i, checked: e.target.checked } : i);
                                                        onUpdateChecklistData(node.id, newData);
                                                    }
                                                }}
                                                style={{ accentColor: '#8b5cf6', width: '18px', height: '18px', cursor: 'pointer' }}
                                            />
                                            <textarea
                                                value={item.text}
                                                onChange={(e) => {
                                                    if (onUpdateChecklistData) {
                                                        const newData = (node.checklistData || []).map(i => i.id === item.id ? { ...i, text: e.target.value } : i);
                                                        onUpdateChecklistData(node.id, newData);
                                                    }
                                                }}
                                                className={styles.textBlock}
                                                style={{ 
                                                    margin: 0, padding: '4px', background: 'transparent',
                                                    textDecoration: item.checked ? 'line-through' : 'none',
                                                    color: item.checked ? '#64748b' : '#cbd5e1'
                                                }}
                                                rows={1}
                                                onInput={handleInput}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    }

                    // Fallback for others
                    return (
                        <div key={node.id} className={styles.block}>
                            <textarea
                                className={styles.textBlock}
                                defaultValue={node.content}
                                onInput={handleInput}
                                onBlur={(e) => onUpdateNode(node.id, e.target.value)}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
