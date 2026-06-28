import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Clock, AlignLeft, Users, Folder, Check } from 'lucide-react';
import { format } from 'date-fns';
import { TaskSpace } from './tasksStorage';
import styles from './CreateTaskCalendarModal.module.css';

interface CreateTaskCalendarModalProps {
    isOpen: boolean;
    initialDate: Date;
    initialHour?: number;
    spaces: TaskSpace[];
    activeSpaceId: string;
    onClose: () => void;
    onSave: (data: {
        title: string;
        type: 'task' | 'event';
        date: Date;
        startTime: string;
        endTime: string;
        description: string;
        guests: string[];
        spaceId: string;
    }) => void;
}

const CreateTaskCalendarModal: React.FC<CreateTaskCalendarModalProps> = ({
    isOpen,
    initialDate,
    initialHour,
    spaces,
    activeSpaceId,
    onClose,
    onSave,
}) => {
    const [title, setTitle] = useState('');
    const [type, setType] = useState<'task' | 'event'>('task');
    const [dateStr, setDateStr] = useState(format(initialDate, 'yyyy-MM-dd'));
    
    // Set default times
    const defaultStartHour = initialHour !== undefined ? initialHour : 9;
    const defaultEndHour = initialHour !== undefined ? initialHour + 1 : 10;
    
    const [startTime, setStartTime] = useState(`${defaultStartHour.toString().padStart(2, '0')}:00`);
    const [endTime, setEndTime] = useState(`${defaultEndHour.toString().padStart(2, '0')}:00`);
    
    const [description, setDescription] = useState('');
    const [spaceId, setSpaceId] = useState(activeSpaceId === 'all' ? (spaces[0]?.id || 'default') : activeSpaceId);
    
    // Guests tag input states
    const [guests, setGuests] = useState<string[]>([]);
    const [guestInput, setGuestInput] = useState('');
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setType('task');
            setDateStr(format(initialDate, 'yyyy-MM-dd'));
            setStartTime(`${defaultStartHour.toString().padStart(2, '0')}:00`);
            setEndTime(`${defaultEndHour.toString().padStart(2, '0')}:00`);
            setDescription('');
            setGuests([]);
            setGuestInput('');
            setSpaceId(activeSpaceId === 'all' ? (spaces[0]?.id || 'default') : activeSpaceId);
        }
    }, [isOpen, initialDate, initialHour, activeSpaceId, spaces]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleAddGuest = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if ((e.key === 'Enter' || e.key === ',') && guestInput.trim()) {
            e.preventDefault();
            const newGuest = guestInput.trim().replace(/,$/, '');
            if (newGuest && !guests.includes(newGuest)) {
                setGuests([...guests, newGuest]);
            }
            setGuestInput('');
        }
    };

    const handleRemoveGuest = (indexToRemove: number) => {
        setGuests(guests.filter((_, i) => i !== indexToRemove));
    };

    const handleSave = () => {
        if (!title.trim()) return;
        const [year, month, day] = dateStr.split('-').map(Number);
        // Create date object aligned to local day
        const finalDate = new Date(year, month - 1, day);
        onSave({
            title: title.trim(),
            type,
            date: finalDate,
            startTime,
            endTime,
            description: description.trim(),
            guests,
            spaceId,
        });
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent} ref={modalRef}>
                {/* Header */}
                <div className={styles.modalHeader}>
                    <h3 className={styles.modalTitle}>Criar no Calendário</h3>
                    <button className={styles.closeBtn} onClick={onClose} title="Fechar">
                        <X size={18} />
                    </button>
                </div>

                {/* Body Form */}
                <div className={styles.modalBody}>
                    {/* Title Input */}
                    <div className={styles.formGroup}>
                        <input
                            type="text"
                            className={styles.titleInput}
                            placeholder="Adicione um título..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            autoFocus
                            required
                        />
                    </div>

                    {/* Toggle Type (Task vs Event) */}
                    <div className={styles.formGroup}>
                        <div className={styles.typeToggleWrapper}>
                            <button
                                type="button"
                                className={`${styles.typeToggleBtn} ${type === 'task' ? styles.active : ''}`}
                                onClick={() => setType('task')}
                            >
                                Tarefa
                            </button>
                            <button
                                type="button"
                                className={`${styles.typeToggleBtn} ${type === 'event' ? styles.active : ''}`}
                                onClick={() => setType('event')}
                            >
                                Evento
                            </button>
                        </div>
                    </div>

                    {/* Date and Times Grid */}
                    <div className={styles.dateTimeGrid}>
                        <div className={styles.formIconRow}>
                            <Calendar size={16} className={styles.fieldIcon} />
                            <div className={styles.fieldContent}>
                                <label className={styles.fieldLabel}>Data</label>
                                <input
                                    type="date"
                                    className={styles.dateInput}
                                    value={dateStr}
                                    onChange={(e) => setDateStr(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className={styles.formIconRow}>
                            <Clock size={16} className={styles.fieldIcon} />
                            <div className={styles.fieldContent}>
                                <label className={styles.fieldLabel}>Horário</label>
                                <div className={styles.timeInputsWrapper}>
                                    <input
                                        type="time"
                                        className={styles.timeInput}
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                    />
                                    <span className={styles.timeSeparator}>até</span>
                                    <input
                                        type="time"
                                        className={styles.timeInput}
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Project / Space Selection */}
                    <div className={styles.formIconRow}>
                        <Folder size={16} className={styles.fieldIcon} />
                        <div className={styles.fieldContent}>
                            <label className={styles.fieldLabel}>Espaço / Projeto</label>
                            <select
                                className={styles.selectInput}
                                value={spaceId}
                                onChange={(e) => setSpaceId(e.target.value)}
                            >
                                {spaces.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Description Textarea */}
                    <div className={styles.formIconRow}>
                        <AlignLeft size={16} className={styles.fieldIcon} />
                        <div className={styles.fieldContent}>
                            <label className={styles.fieldLabel}>Descrição</label>
                            <textarea
                                className={styles.textareaInput}
                                placeholder="Adicione uma descrição detalhada..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>

                    {/* Guests / Convidados Tag Input */}
                    <div className={styles.formIconRow}>
                        <Users size={16} className={styles.fieldIcon} />
                        <div className={styles.fieldContent}>
                            <label className={styles.fieldLabel}>Convidados (e-mails ou nomes)</label>
                            <div className={styles.tagInputContainer}>
                                <div className={styles.tagsWrapper}>
                                    {guests.map((guest, index) => (
                                        <span key={index} className={styles.guestTag}>
                                            {guest}
                                            <button
                                                type="button"
                                                className={styles.removeTagBtn}
                                                onClick={() => handleRemoveGuest(index)}
                                            >
                                                &times;
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    className={styles.tagInput}
                                    placeholder="Digite e pressione Enter..."
                                    value={guestInput}
                                    onChange={(e) => setGuestInput(e.target.value)}
                                    onKeyDown={handleAddGuest}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className={styles.modalFooter}>
                    <button className={styles.cancelBtn} onClick={onClose}>
                        Cancelar
                    </button>
                    <button
                        className={styles.confirmBtn}
                        onClick={handleSave}
                        disabled={!title.trim()}
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateTaskCalendarModal;
