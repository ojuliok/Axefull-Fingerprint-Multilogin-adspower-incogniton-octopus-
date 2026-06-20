import React from 'react';
import ReactDOM from 'react-dom/client';

// Register global crash debugging listeners to capture module evaluation or async errors
window.addEventListener('error', (event) => {
    const msg = `Global Error: ${event.message}\nAt: ${event.filename}:${event.lineno}\nStack: ${event.error?.stack || 'no stack'}`;
    console.error(msg);
    alert(msg);
});

window.addEventListener('unhandledrejection', (event) => {
    const msg = `Unhandled Rejection: ${event.reason?.message || event.reason}\nStack: ${event.reason?.stack || 'no stack'}`;
    console.error(msg);
    alert(msg);
});

import { injectWebBridge } from './lib/web-bridge';
injectWebBridge();

import App from './App';
import './styles/index.css';

// Custom ErrorBoundary to prevent screen from turning black on render crashes
class LocalErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: any) {
        return { hasError: true, error };
    }

    componentDidCatch(error: any, errorInfo: any) {
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '24px',
                    background: '#09090b',
                    color: '#f87171',
                    fontFamily: 'monospace',
                    height: '100vh',
                    overflow: 'auto',
                    border: '2px solid #ef4444',
                    borderRadius: '8px'
                }}>
                    <h1 style={{ fontSize: '20px', marginBottom: '12px' }}>⚠️ Ops! Ocorreu um erro crítico no aplicativo</h1>
                    <pre style={{ background: '#18181b', padding: '16px', borderRadius: '6px', whiteSpace: 'pre-wrap', color: '#fda4af' }}>
                        {this.state.error?.stack || this.state.error?.toString()}
                    </pre>
                    <button 
                        onClick={() => window.location.reload()} 
                        style={{
                            marginTop: '16px',
                            padding: '8px 16px',
                            background: '#7c3aed',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        Recarregar Aplicativo
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <LocalErrorBoundary>
            <App />
        </LocalErrorBoundary>
    </React.StrictMode>
);
