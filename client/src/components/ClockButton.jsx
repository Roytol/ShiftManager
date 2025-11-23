import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function ClockButton({ currentShift, onClockIn, onClockOut, disabled }) {
    const isClockedIn = !!currentShift;
    const [elapsedTime, setElapsedTime] = useState('00:00:00');
    const { t } = useLanguage();

    useEffect(() => {
        let interval;
        if (isClockedIn && currentShift.start_time) {
            const startTime = new Date(currentShift.start_time).getTime();

            const updateTimer = () => {
                const now = new Date().getTime();
                const diff = now - startTime;

                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);

                setElapsedTime(
                    `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                );
            };

            updateTimer(); // Initial call
            interval = setInterval(updateTimer, 1000);
        } else {
            setElapsedTime('00:00:00');
        }

        return () => clearInterval(interval);
    }, [isClockedIn, currentShift]);

    return (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            {isClockedIn ? (
                <>
                    <h2 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                        {t('currently_working_on')}
                    </h2>
                    <h1 style={{ marginBottom: '0.5rem', fontSize: '2rem', color: 'var(--primary-color)' }}>
                        {currentShift.task_name}
                    </h1>
                    <div className="pulse-animation" style={{
                        fontSize: '3rem',
                        fontWeight: 'bold',
                        marginBottom: '2rem',
                        fontFamily: 'monospace',
                        display: 'inline-block',
                        padding: '0.5rem 2rem',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'rgba(52, 199, 89, 0.1)',
                        color: 'var(--success-color)'
                    }}>
                        {elapsedTime}
                    </div>
                    <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
                        {t('started_at')} {new Date(currentShift.start_time).toLocaleTimeString()}
                    </p>
                    <button
                        onClick={onClockOut}
                        className="btn btn-clock-large btn-clock-out"
                        disabled={disabled}
                    >
                        {disabled ? t('clocking_out') : t('clock_out')}
                    </button>
                </>
            ) : (
                <>
                    <h2 style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
                        {t('ready_to_start')}
                    </h2>
                    <button
                        onClick={onClockIn}
                        className="btn btn-clock-large btn-clock-in"
                        disabled={disabled}
                    >
                        {t('clock_in')}
                    </button>
                </>
            )}
        </div>
    );
}
