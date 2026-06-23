import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

export interface AccessLog {
    id: string;
    ip: string;
    device: string;
    timestamp: string;
}

interface SecurityContextValue {
    isLocked: boolean;
    pin: string | null;
    secondPassword: string | null;
    timeoutMinutes: number; // 0 means never
    accessLogs: AccessLog[];
    
    setPin: (pin: string | null) => void;
    setSecondPassword: (password: string | null) => void;
    setTimeoutMinutes: (minutes: number) => void;
    
    unlock: (input: string) => boolean;
    lockNow: () => void;
    clearLogs: () => void;
}

const SecurityContext = createContext<SecurityContextValue | null>(null);

export function SecurityProvider({ children }: { children: React.ReactNode }) {
    const [pin, setPinState] = useState<string | null>(localStorage.getItem('security_pin'));
    const [secondPassword, setSecondPasswordState] = useState<string | null>(localStorage.getItem('security_password'));
    const [timeoutMinutes, setTimeoutMinutesState] = useState<number>(() => {
        const val = localStorage.getItem('security_timeout');
        return val ? parseInt(val, 10) : 0;
    });
    
    const [accessLogs, setAccessLogs] = useState<AccessLog[]>(() => {
        const val = localStorage.getItem('security_logs');
        return val ? JSON.parse(val) : [];
    });

    // If there is any security configured, start locked.
    const [isLocked, setIsLocked] = useState<boolean>(() => {
        return !!(localStorage.getItem('security_pin') || localStorage.getItem('security_password'));
    });

    const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

    const setPin = useCallback((newPin: string | null) => {
        if (newPin) localStorage.setItem('security_pin', newPin);
        else localStorage.removeItem('security_pin');
        setPinState(newPin);
    }, []);

    const setSecondPassword = useCallback((newPassword: string | null) => {
        if (newPassword) localStorage.setItem('security_password', newPassword);
        else localStorage.removeItem('security_password');
        setSecondPasswordState(newPassword);
    }, []);

    const setTimeoutMinutes = useCallback((minutes: number) => {
        localStorage.setItem('security_timeout', minutes.toString());
        setTimeoutMinutesState(minutes);
    }, []);

    const clearLogs = useCallback(() => {
        localStorage.removeItem('security_logs');
        setAccessLogs([]);
    }, []);

    const lockNow = useCallback(() => {
        if (pin || secondPassword) {
            setIsLocked(true);
        }
    }, [pin, secondPassword]);

    const recordAccess = useCallback(async () => {
        try {
            const res = await fetch('https://api.ipify.org?format=json');
            const data = await res.json();
            const ip = data.ip || 'Desconhecido';
            
            const newLog: AccessLog = {
                id: crypto.randomUUID(),
                ip,
                device: navigator.userAgent,
                timestamp: new Date().toISOString()
            };
            
            setAccessLogs(prev => {
                const updated = [newLog, ...prev].slice(0, 100); // keep last 100
                localStorage.setItem('security_logs', JSON.stringify(updated));
                return updated;
            });
            
            // TODO: Sincronizar com Supabase através de uma chamada IPC
            
        } catch (err) {
            console.error('Erro ao registrar acesso:', err);
        }
    }, []);

    const unlock = useCallback((input: string) => {
        // Unlock if input matches pin OR second password
        const isValid = (pin && input === pin) || (secondPassword && input === secondPassword);
        if (isValid) {
            setIsLocked(false);
            recordAccess();
            return true;
        }
        return false;
    }, [pin, secondPassword, recordAccess]);

    // Setup idle timer
    useEffect(() => {
        if (timeoutMinutes <= 0 || isLocked) {
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            return;
        }

        const resetTimer = () => {
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            idleTimerRef.current = setTimeout(() => {
                lockNow();
            }, timeoutMinutes * 60 * 1000);
        };

        const events = ['mousemove', 'keydown', 'click', 'scroll'];
        events.forEach(evt => window.addEventListener(evt, resetTimer));
        
        resetTimer();

        return () => {
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            events.forEach(evt => window.removeEventListener(evt, resetTimer));
        };
    }, [timeoutMinutes, isLocked, lockNow]);

    return (
        <SecurityContext.Provider value={{
            isLocked, pin, secondPassword, timeoutMinutes, accessLogs,
            setPin, setSecondPassword, setTimeoutMinutes, unlock, lockNow, clearLogs
        }}>
            {children}
        </SecurityContext.Provider>
    );
}

export function useSecurity() {
    const ctx = useContext(SecurityContext);
    if (!ctx) throw new Error('useSecurity must be used within SecurityProvider');
    return ctx;
}
