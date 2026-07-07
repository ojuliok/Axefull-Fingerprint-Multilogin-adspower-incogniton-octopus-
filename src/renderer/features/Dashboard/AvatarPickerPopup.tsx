import React from 'react';
import * as Lucide from 'lucide-react';
import styles from '../../pages/Dashboard.module.css';

interface AvatarPickerPopupProps {
    profileId: string;
    currentIcon: string | null;
    currentColor: string | null;
    position: { x: number; y: number };
    onSelect: (profileId: string, updates: { avatar_color: string | null; avatar_icon: string | null }) => void;
    onClose: () => void;
}

export const AVATAR_COLORS = [
    { label: 'Roxo', value: 'linear-gradient(135deg, #6d28d9 0%, #4f46e5 100%)', dot: '#6d28d9' },
    { label: 'Azul', value: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', dot: '#2563eb' },
    { label: 'Teal', value: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)', dot: '#0d9488' },
    { label: 'Esmeralda', value: 'linear-gradient(135deg, #059669 0%, #047857 100%)', dot: '#059669' },
    { label: 'Laranja', value: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)', dot: '#ea580c' },
    { label: 'Rosa', value: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)', dot: '#e11d48' },
    { label: 'Indigo', value: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)', dot: '#4f46e5' },
    { label: 'Pink', value: 'linear-gradient(135deg, #db2777 0%, #be185d 100%)', dot: '#db2777' },
];

export const AVATAR_ICONS = [
    { name: 'Letra', value: null },
    { name: 'User', value: 'User' },
    { name: 'Globe', value: 'Globe' },
    { name: 'Shield', value: 'Shield' },
    { name: 'Star', value: 'Star' },
    { name: 'Zap', value: 'Zap' },
    { name: 'Activity', value: 'Activity' },
    { name: 'Users', value: 'Users' },
    { name: 'Flame', value: 'Flame' },
    { name: 'Heart', value: 'Heart' },
    { name: 'Crown', value: 'Crown' },
];

export const AvatarPickerPopup: React.FC<AvatarPickerPopupProps> = ({
    profileId, currentIcon, currentColor, position, onSelect, onClose
}) => {
    return (
        <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 498 }} onClick={onClose} />
            <div className={styles.pickerPopup} style={{ left: position.x, top: position.y, width: 220, padding: 12 }}>
                <p className={styles.pickerPopupTitle} style={{ marginBottom: 8 }}>Cor do Ícone</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
                    {AVATAR_COLORS.map((color) => (
                        <button
                            key={color.value}
                            style={{
                                height: 28,
                                background: color.value,
                                borderRadius: 6,
                                border: currentColor === color.value ? '2px solid #fff' : '1px solid rgba(255,255,255,0.1)',
                                cursor: 'pointer',
                                transition: 'transform 0.1s ease',
                                boxShadow: currentColor === color.value ? '0 0 6px rgba(255,255,255,0.4)' : 'none',
                            }}
                            title={color.label}
                            onClick={() => onSelect(profileId, { avatar_color: color.value, avatar_icon: currentIcon })}
                        />
                    ))}
                </div>

                <p className={styles.pickerPopupTitle} style={{ marginBottom: 8, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8 }}>Formato / Ícone</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                    {AVATAR_ICONS.map((item) => {
                        const IconComponent = item.value ? (Lucide as any)[item.value] : null;
                        return (
                            <button
                                key={item.name}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: 38,
                                    borderRadius: 6,
                                    background: currentIcon === item.value ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255,255,255,0.03)',
                                    border: currentIcon === item.value ? '1px solid #8b5cf6' : '1px solid transparent',
                                    color: currentIcon === item.value ? '#a78bfa' : 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    fontSize: 10,
                                    gap: 2,
                                    transition: 'all 0.1s ease',
                                }}
                                onClick={() => onSelect(profileId, { avatar_color: currentColor, avatar_icon: item.value })}
                            >
                                {IconComponent ? <IconComponent size={14} /> : <span style={{ fontWeight: 'bold' }}>A</span>}
                                <span>{item.name}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </>
    );
};
