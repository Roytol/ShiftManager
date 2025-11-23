import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function RequestEditModal({ shift, onClose, onRequest }) {
    // Helper to split ISO string into date and time
    const splitDateTime = (isoString) => {
        if (!isoString) return { date: '', time: '' };
        const dateObj = new Date(isoString);
        return {
            date: dateObj.toISOString().split('T')[0],
            time: dateObj.toTimeString().slice(0, 5) // HH:MM
        };
    };

    // Initial state setup
    const start = splitDateTime(shift.start_time);
    const end = splitDateTime(shift.end_time);

    const [startDate, setStartDate] = useState(start.date);
    const [startTime, setStartTime] = useState(start.time);
    const [endDate, setEndDate] = useState(end.date);
    const [endTime, setEndTime] = useState(end.time);
    const [reason, setReason] = useState('');
    const { t } = useLanguage();

    const handleSubmit = (e) => {
        e.preventDefault();

        // Combine date and time back to ISO string
        const newStart = new Date(`${startDate}T${startTime}`).toISOString();
        const newEnd = new Date(`${endDate}T${endTime}`).toISOString();

        onRequest({
            id: shift.id,
            new_start_time: newStart,
            new_end_time: newEnd,
            reason
        });
    };

    return (
        <div className="modal-overlay">
            <div className="card" style={{ width: '100%', maxWidth: '500px', position: 'relative' }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        background: 'none',
                        border: 'none',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)'
                    }}
                >
                    &times;
                </button>
                <h2 style={{ marginBottom: '1.5rem' }}>{t('request_shift_edit')}</h2>
                <form onSubmit={handleSubmit}>
                    {/* Start Time Section */}
                    <div className="form-group">
                        <label className="form-label">{t('start_time')}</label>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <input
                                type="date"
                                className="form-input"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                required
                                style={{ flex: 2 }}
                            />
                            <input
                                type="time"
                                className="form-input"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                required
                                style={{ flex: 1 }}
                            />
                        </div>
                    </div>

                    {/* End Time Section */}
                    <div className="form-group">
                        <label className="form-label">{t('end_time')}</label>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <input
                                type="date"
                                className="form-input"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                required
                                style={{ flex: 2 }}
                            />
                            <input
                                type="time"
                                className="form-input"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                required
                                style={{ flex: 1 }}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t('reason_for_change')}</label>
                        <textarea
                            className="form-input"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows="3"
                            placeholder={t('reason_placeholder')}
                            required
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            {t('cancel')}
                        </button>
                        <button type="submit" className="btn btn-primary">
                            {t('submit_request')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
