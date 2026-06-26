import React, { useState, useEffect, useCallback } from 'react';
import { CanvasInfo, CanvasData, getCanvasData, saveCanvasData } from './canvasStorage';
import InfiniteCanvas from './InfiniteCanvas';
import CanvasRichText from './CanvasRichText';
import { Tag, Plus, X, List, LayoutDashboard, Settings } from 'lucide-react';
import styles from './SpaceOverview.module.css';

interface SpaceOverviewProps {
    activeSpace: CanvasInfo;
    onUpdate: (id: string, updates: Partial<CanvasInfo>) => void;
}

const SpaceOverview: React.FC<SpaceOverviewProps> = ({ activeSpace, onUpdate }) => {
    const [mode, setMode] = useState<'text' | 'canvas'>('text');
    const [canvasData, setCanvasData] = useState<CanvasData | null>(null);

    const [newTag, setNewTag] = useState('');
    const [newPropKey, setNewPropKey] = useState('');
    const [newPropValue, setNewPropValue] = useState('');

    useEffect(() => {
        if (mode === 'canvas') {
            getCanvasData(activeSpace.id).then(data => setCanvasData(data));
        }
    }, [activeSpace.id, mode]);

    const handleCanvasDataChange = useCallback((data: CanvasData) => {
        setCanvasData(data);
        saveCanvasData(activeSpace.id, data);
    }, [activeSpace.id]);

    const handleAddTag = (e: React.KeyboardEvent | React.MouseEvent) => {
        if ((e.type === 'keydown' && (e as React.KeyboardEvent).key !== 'Enter') || !newTag.trim()) return;
        
        const currentTags = activeSpace.tags || [];
        if (!currentTags.includes(newTag.trim())) {
            onUpdate(activeSpace.id, { tags: [...currentTags, newTag.trim()] });
        }
        setNewTag('');
    };

    const handleRemoveTag = (tag: string) => {
        const currentTags = activeSpace.tags || [];
        onUpdate(activeSpace.id, { tags: currentTags.filter(t => t !== tag) });
    };

    const handleAddProperty = () => {
        if (!newPropKey.trim()) return;
        const currentProps = activeSpace.properties || {};
        onUpdate(activeSpace.id, { 
            properties: { ...currentProps, [newPropKey.trim()]: newPropValue.trim() } 
        });
        setNewPropKey('');
        setNewPropValue('');
    };

    const handleRemoveProperty = (key: string) => {
        const currentProps = { ...activeSpace.properties };
        delete currentProps[key];
        onUpdate(activeSpace.id, { properties: currentProps });
    };

    return (
        <div className={styles.container}>
            <div className={styles.mainContent}>
                <div className={styles.header}>
                    <div className={styles.titleSection}>
                        <h2>Visão Geral</h2>
                        <div className={styles.toggleGroup}>
                            <button 
                                className={`${styles.toggleBtn} ${mode === 'text' ? styles.active : ''}`}
                                onClick={() => setMode('text')}
                            >
                                <List size={16} /> Texto
                            </button>
                            <button 
                                className={`${styles.toggleBtn} ${mode === 'canvas' ? styles.active : ''}`}
                                onClick={() => setMode('canvas')}
                            >
                                <LayoutDashboard size={16} /> Canvas
                            </button>
                        </div>
                    </div>
                </div>

                <div className={styles.editorArea}>
                    {mode === 'text' ? (
                        <div className={styles.richTextWrapper}>
                            <CanvasRichText 
                                key={`richtext-${activeSpace.id}`}
                                canvasInfo={activeSpace} 
                                onUpdate={() => onUpdate(activeSpace.id, activeSpace)} 
                            />
                        </div>
                    ) : canvasData ? (
                        <div className={styles.canvasWrapper}>
                            <InfiniteCanvas
                                canvasId={activeSpace.id}
                                data={canvasData}
                                onDataChange={handleCanvasDataChange}
                            />
                        </div>
                    ) : (
                        <div className={styles.loading}>Carregando Canvas...</div>
                    )}
                </div>
            </div>

            <div className={styles.sidebar}>
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}><Tag size={16} /> Tags</h3>
                    <div className={styles.tagsList}>
                        {(activeSpace.tags || []).map(tag => (
                            <span key={tag} className={styles.tag}>
                                {tag}
                                <button onClick={() => handleRemoveTag(tag)} className={styles.removeTagBtn}><X size={12} /></button>
                            </span>
                        ))}
                    </div>
                    <input 
                        type="text" 
                        placeholder="Adicionar tag (Enter)" 
                        value={newTag}
                        onChange={e => setNewTag(e.target.value)}
                        onKeyDown={handleAddTag}
                        className={styles.input}
                    />
                </div>

                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}><Settings size={16} /> Propriedades</h3>
                    <div className={styles.propertiesList}>
                        {Object.entries(activeSpace.properties || {})
                            .filter(([k]) => k !== 'pin' && k !== 'recoveryEmail' && k !== 'pending_invites')
                            .map(([key, val]) => (
                            <div key={key} className={styles.propertyItem}>
                                <div className={styles.propHeader}>
                                    <span className={styles.propKey}>{key}</span>
                                    <button className={styles.removePropBtn} onClick={() => handleRemoveProperty(key)}>
                                        <X size={14} />
                                    </button>
                                </div>
                                <div className={styles.propVal}>{val || '-'}</div>
                            </div>
                        ))}
                    </div>
                    <div className={styles.addProperty}>
                        <div className={styles.addPropertyRow}>
                            <input 
                                type="text" 
                                placeholder="Nome da Propriedade" 
                                value={newPropKey}
                                onChange={e => setNewPropKey(e.target.value)}
                                className={styles.input}
                            />
                        </div>
                        <div className={styles.addPropertyRow}>
                            <input 
                                type="text" 
                                placeholder="Valor" 
                                value={newPropValue}
                                onChange={e => setNewPropValue(e.target.value)}
                                className={styles.input}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddProperty()}
                            />
                            <button onClick={handleAddProperty} className={styles.iconBtn}><Plus size={16} /></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SpaceOverview;
