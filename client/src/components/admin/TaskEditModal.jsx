import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';

export default function TaskEditModal({ task, onClose, onSave }) {
    const [name, setName] = useState('');
    const { t } = useLanguage();

    useEffect(() => {
        if (task) {
            setName(task.name);
        }
    }, [task]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ ...task, name });
    };

    if (!task) return null;

    return (
        <div className="modal-overlay">
            <div className="card" style={{ width: '100%', maxWidth: '400px', position: 'relative' }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '1.5rem',
                        right: '1.5rem',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)'
                    }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>{t('edit_task')}</h2>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">{t('task_name')}</label>
                        <input
                            type="text"
                            className="form-input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            {t('cancel')}
                        </button>
                        <button type="submit" className="btn btn-primary" style={{ minWidth: '100px' }}>
                            {t('save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
