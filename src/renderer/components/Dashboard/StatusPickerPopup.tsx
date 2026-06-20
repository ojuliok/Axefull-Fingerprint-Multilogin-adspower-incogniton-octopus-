import React from 'react';
import { STATUS_CONFIG } from '../../utils/constants';
import styles from '../../pages/Dashboard.module.css';

interface StatusPickerPopupProps {
    profileId: string;
    currentStatus: string;
    position: { x: number; y: number };
    onSelect: (profileId: string, status: string) => void;
    onClose: () => void;
}

export const StatusPickerPopup: React.FC<StatusPickerPopupProps> = ({
    profileId, currentStatus, position, onSelect, onClose
}) => (
    <>
        <div style={{ position: 'fixed', inset: 0, zIndex: 498 }} onClick={onClose} />
        <div className={styles.pickerPopup} style={{ left: position.x, top: position.y }}>
            <p className={styles.pickerPopupTitle}>Status do Perfil</p>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <button
                    key={key}
                    className={`${styles.pickerPopupItem} ${currentStatus === key ? styles.pickerPopupItemActive : ''}`}
                    onClick={() => { onSelect(profileId, key); onClose(); }}>
                    <span className={styles.statusDotLg} style={{ background: cfg.dot }} />
                    {cfg.label}
                    {currentStatus === key && <span className={styles.pickerCheck}>✓</span>}
                </button>
            ))}
        </div>
    </>
);
