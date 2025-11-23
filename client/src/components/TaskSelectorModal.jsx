import { useState, useEffect } from 'react';
import API_BASE_URL from '../config';
import { useLanguage } from '../context/LanguageContext';

export default function TaskSelectorModal({ isOpen, onClose, onConfirm, loading: actionLoading }) {
    const [tasks, setTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(true);
    const { t } = useLanguage();

    useEffect(() => {
        if (isOpen) {
            const token = localStorage.getItem('token');
            fetch(`${API_BASE_URL}/tasks`, {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then((res) => res.json())
                .then((data) => {
                    setTasks(data);
                    setLoading(false);
                })
                .catch((err) => console.error(err));
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedTask) return;
        onConfirm(selectedTask, notes);
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
            <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
                <h2 style={{ marginBottom: '1rem' }}>{t('clock_in_select_task')}</h2>

                {loading ? (
                    <p>{t('loading_tasks')}</p>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">{t('task_mandatory')}</label>
                            <select
                                className="form-input"
                                value={selectedTask}
                                onChange={(e) => setSelectedTask(e.target.value)}
                                required
                                disabled={actionLoading}
                            >
                                <option value="">{t('select_a_task_placeholder')}</option>
                                {tasks.map((task) => (
                                    <option key={task.id} value={task.id}>
                                        {task.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">{t('notes')}</label>
                            <textarea
                                className="form-input"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows="3"
                                disabled={actionLoading}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={actionLoading}>
                                {t('cancel')}
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={!selectedTask || actionLoading}>
                                {actionLoading ? t('clocking_in') : t('clock_in')}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
