import { useState, useEffect } from 'react';
import API_BASE_URL from '../config';

export default function TaskSelectorModal({ isOpen, onClose, onConfirm, loading: actionLoading }) {
    const [tasks, setTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(true);

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
                <h2 style={{ marginBottom: '1rem' }}>Clock In - Select Task</h2>

                {loading ? (
                    <p>Loading tasks...</p>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Task (Mandatory)</label>
                            <select
                                className="form-input"
                                value={selectedTask}
                                onChange={(e) => setSelectedTask(e.target.value)}
                                required
                                disabled={actionLoading}
                            >
                                <option value="">-- Select a Task --</option>
                                {tasks.map((task) => (
                                    <option key={task.id} value={task.id}>
                                        {task.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Notes (Optional)</label>
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
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={!selectedTask || actionLoading}>
                                {actionLoading ? 'Clocking In...' : 'Clock In'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
