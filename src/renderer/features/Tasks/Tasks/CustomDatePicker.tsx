import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import styles from './CustomDatePicker.module.css';

interface CustomDatePickerProps {
    selectedDate: number | null;
    onChange: (date: number | null) => void;
    placeholder?: string;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ selectedDate, onChange, placeholder = 'Definir data' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(selectedDate ? new Date(selectedDate) : new Date());
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Keep currentMonth in sync when selectedDate changes externally
    useEffect(() => {
        if (selectedDate) {
            setCurrentMonth(new Date(selectedDate));
        }
    }, [selectedDate]);

    const handleDayClick = (day: Date) => {
        // Set to local midnight of the selected day
        const localDate = new Date(day.getFullYear(), day.getMonth(), day.getDate());
        onChange(localDate.getTime());
        setIsOpen(false);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(null);
        setIsOpen(false);
    };

    const handleToday = (e: React.MouseEvent) => {
        e.stopPropagation();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        onChange(today.getTime());
        setIsOpen(false);
    };

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
        <div className={styles.datePickerContainer} ref={containerRef}>
            <div 
                className={styles.datePickerTrigger} 
                onClick={() => setIsOpen(!isOpen)}
            >
                <CalendarIcon size={14} className={styles.calendarIcon} />
                <span className={selectedDate ? styles.dateText : styles.placeholderText}>
                    {selectedDate ? format(new Date(selectedDate), 'dd/MM/yyyy') : placeholder}
                </span>
                {selectedDate && (
                    <button type="button" className={styles.clearBtn} onClick={handleClear} title="Limpar data">
                        <X size={12} />
                    </button>
                )}
            </div>

            {isOpen && (
                <div className={styles.calendarDropdown}>
                    <div className={styles.calendarHeader}>
                        <button 
                            type="button"
                            className={styles.navBtn} 
                            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className={styles.monthTitle}>
                            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                        </span>
                        <button 
                            type="button"
                            className={styles.navBtn} 
                            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    <div className={styles.weekdaysGrid}>
                        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
                            <div key={i} className={styles.weekday}>{day}</div>
                        ))}
                    </div>

                    <div className={styles.daysGrid}>
                        {days.map((day, i) => {
                            const isCurrentMonth = isSameMonth(day, currentMonth);
                            const isTodayDate = isToday(day);
                            const isSelected = selectedDate ? isSameDay(day, new Date(selectedDate)) : false;

                            return (
                                <div 
                                    key={i} 
                                    className={`
                                        ${styles.dayCell} 
                                        ${!isCurrentMonth ? styles.outsideDay : ''} 
                                        ${isTodayDate ? styles.todayDay : ''} 
                                        ${isSelected ? styles.selectedDay : ''}
                                    `}
                                    onClick={() => handleDayClick(day)}
                                >
                                    {format(day, 'd')}
                                </div>
                            );
                        })}
                    </div>

                    <div className={styles.calendarFooter}>
                        <button type="button" className={styles.footerBtn} onClick={handleToday}>Hoje</button>
                        <button type="button" className={styles.footerBtn} onClick={handleClear}>Limpar</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomDatePicker;
