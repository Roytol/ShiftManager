import { useState, useEffect } from 'react';

export default function Clock() {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <div style={{
            fontFamily: 'monospace',
            fontSize: '1.1rem',
            fontWeight: '600',
            color: 'var(--primary-color)',
            backgroundColor: 'var(--bg-secondary)',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
        }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            {time.toLocaleTimeString([], { hour12: false })}
        </div>
    );
}
