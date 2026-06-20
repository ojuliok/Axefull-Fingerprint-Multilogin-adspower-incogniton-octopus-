import React, { useState } from 'react';
import { TagTemplate, SOCIAL_TAG_COLORS } from '../../utils/constants';
import styles from '../../pages/Dashboard.module.css';

interface TagPickerPopupProps {
    profileId: string;
    currentTags: string[];
    position: { x: number; y: number };
    templates: TagTemplate[];
    onAdd: (profileId: string, tag: string) => void;
    onRemove: (profileId: string, tag: string) => void;
    onClose: () => void;
}

export const TagPickerPopup: React.FC<TagPickerPopupProps> = ({
    profileId, currentTags, position, templates, onAdd, onRemove, onClose
}) => {
    const [input, setInput] = useState('');

    const submit = () => {
        const t = input.trim().toLowerCase();
        if (t) {
            if (currentTags.includes(t)) onRemove(profileId, t);
            else onAdd(profileId, t);
            setInput('');
        }
    };

    return (
        <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 498 }} onClick={onClose} />
            <div className={styles.pickerPopup} style={{ left: position.x, top: position.y, minWidth: 220 }}>
                <p className={styles.pickerPopupTitle}>Adicionar Tag</p>

                <div className={styles.tagPickerInput}>
                    <input
                        autoFocus
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') onClose(); }}
                        placeholder="Tag personalizada..."
                        className={styles.tagPickerInputField}
                    />
                    <button className={styles.tagPickerInputBtn} onClick={submit}>+</button>
                </div>

                {templates.map(tpl => (
                    <div key={tpl.id} className={styles.tagPickerGroup}>
                        <p className={styles.tagPickerGroupLabel} style={{ color: tpl.color }}>
                            <span className={styles.tagPickerGroupDot} style={{ background: tpl.color }} />
                            {tpl.name}
                        </p>
                        <div className={styles.tagPickerGroupTags}>
                            {tpl.tags.map(tag => {
                                const active = currentTags.includes(tag);
                                const isSocial = SOCIAL_TAG_COLORS[tag.toLowerCase()];
                                const customStyle = isSocial
                                    ? (active
                                        ? { borderColor: isSocial.borderActive, color: isSocial.color, backgroundColor: isSocial.bgActive, fontWeight: 700 }
                                        : { borderColor: isSocial.border, color: isSocial.color, backgroundColor: isSocial.bg, opacity: 0.6 })
                                    : (active ? { borderColor: tpl.color, color: tpl.color } : {});
                                return (
                                    <button
                                        key={tag}
                                        className={`${styles.tagPickerTag} ${active ? styles.tagPickerTagActive : ''}`}
                                        style={customStyle}
                                        onClick={() => active ? onRemove(profileId, tag) : onAdd(profileId, tag)}>
                                        {tag}
                                        {active && ' ✓'}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
};
