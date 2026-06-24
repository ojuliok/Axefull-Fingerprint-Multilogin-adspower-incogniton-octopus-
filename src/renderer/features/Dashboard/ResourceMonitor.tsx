import React, { useState, useEffect } from 'react';
import { Cpu, Activity, HardDrive } from 'lucide-react';

export const ResourceMonitor: React.FC = () => {
    const [cpuUsage, setCpuUsage] = useState(0);
    const [ramUsage, setRamUsage] = useState(0);

    // Mocking real-time updates for the visual widget
    // In a real Electron app, this would use IPC: window.api.system.getMetrics()
    useEffect(() => {
        const interval = setInterval(() => {
            setCpuUsage(Math.floor(Math.random() * 20) + 10); // 10% - 30% mock
            setRamUsage(Math.floor(Math.random() * 15) + 40); // 40% - 55% mock
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-[#18181b]/50 border border-white/5 rounded-2xl p-4 mt-auto backdrop-blur-md relative overflow-hidden group">
            {/* Background Glow */}
            <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500/10 to-emerald-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            
            <div className="flex items-center gap-2 mb-4">
                <Activity size={16} className="text-emerald-400" />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Monitor do Sistema</span>
            </div>

            <div className="flex flex-col gap-3 relative">
                {/* CPU */}
                <div>
                    <div className="flex justify-between items-center mb-1.5">
                        <span className="flex items-center gap-1.5 text-xs text-theme-text-muted"><Cpu size={12} /> CPU</span>
                        <span className="text-xs font-mono text-slate-300">{cpuUsage}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${cpuUsage}%` }}
                        />
                    </div>
                </div>

                {/* RAM */}
                <div>
                    <div className="flex justify-between items-center mb-1.5">
                        <span className="flex items-center gap-1.5 text-xs text-theme-text-muted"><HardDrive size={12} /> RAM</span>
                        <span className="text-xs font-mono text-slate-300">{ramUsage}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${ramUsage}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
