import { useState, useEffect } from 'react';
import API_BASE_URL from '../../config';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';

export default function ShiftCreateModal({ onClose, onCreate }) {
    const [formData, setFormData] = useState({
        user_id: '',
        task_id: '',
        start_time: '',
        end_time: '',
        notes: ''
    });
    const [users, setUsers] = useState([]);
    const [tasks, setTasks] = useState([]);
    const { t } = useLanguage();

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('token');

            try {
                const [usersRes, tasksRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/users`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    fetch(`${API_BASE_URL}/tasks`, {
                        headers: { Authorization: `Bearer ${token}` },
                    })
                ]);

                const usersData = await usersRes.json();
                setUsers(usersData);

                const tasksData = await tasksRes.json();
                setTasks(tasksData);
            } catch (error) {
                console.error('Failed to fetch data:', error);
            }
        };

        fetchData();
    }, []);

    const [loading, setLoading] = useState(false);

    const { showToast } = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const token = localStorage.getItem('token');

        const payload = {
            ...formData,
            start_time: new Date(formData.start_time).toISOString(),
            end_time: formData.end_time ? new Date(formData.end_time).toISOString() : null
        };

        fetch(`${API_BASE_URL}/shifts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        })
            .then((res) => {
                if (res.ok) {
                    showToast(t('shift_created_success'), 'success');
                    onCreate();
                } else {
                    showToast(t('failed_create_shift'), 'error');
                }
            })
            .catch((err) => {
                console.error(err);
                showToast(t('error_occurred'), 'error');
            })
            .finally(() => setLoading(false));
    };

    return (
        <div className="modal-overlay">
            <div className="card" style={{ width: '100%', maxWidth: '500px', position: 'relative' }}>
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

                <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>{t('add_new_shift')}</h2>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">{t('employee')}</label>
                        <select
                            className="form-input"
                            value={formData.user_id}
                            onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                            required
                            disabled={loading}
                        >
                            <option value="">{t('select_employee')}</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">{t('task')}</label>
                        <select
                            className="form-input"
                            value={formData.task_id}
                            onChange={(e) => setFormData({ ...formData, task_id: e.target.value })}
                            required
                            disabled={loading}
                        >
                            <option value="">{t('select_task')}</option>
                            {tasks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">{t('start_time')}</label>
                            <input
                                type="datetime-local"
                                className="form-input"
                                value={formData.start_time}
                                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                required
                                disabled={loading}
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">{t('end_time')}</label>
                            <input
                                type="datetime-local"
                                className="form-input"
                                value={formData.end_time}
                                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                disabled={loading}
                            />
                        </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">{t('notes')}</label>
                        <textarea
                            className="form-input"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows="3"
                            disabled={loading}
                        />
                    </div>
                    <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>{t('cancel')}</button>
                        <button type="submit" className="btn btn-primary" style={{ minWidth: '120px' }} disabled={loading}>
                            {loading ? t('creating') : t('create_shift')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
