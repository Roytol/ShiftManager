import { useState, useEffect } from 'react';
import TaskEditModal from './TaskEditModal';
import API_BASE_URL from '../../config';
import LoadingSpinner from '../LoadingSpinner';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';

export default function TaskManager() {
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState({ name: '' });
    const [editingTask, setEditingTask] = useState(null);
    const [showCreateTask, setShowCreateTask] = useState(false);

    const [loading, setLoading] = useState(false);
    const [expandedTaskId, setExpandedTaskId] = useState(null); // For mobile expansion
    const { t } = useLanguage();

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE_URL}/tasks`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setTasks(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        setLoading(true);
        const token = localStorage.getItem('token');

        try {
            const res = await fetch(`${API_BASE_URL}/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(newTask),
            });
            if (res.ok) {
                setNewTask({ name: '' });
                fetchTasks();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateTask = async (updatedTask) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE_URL}/tasks/${updatedTask.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(updatedTask),
            });
            if (res.ok) {
                fetchTasks();
                setEditingTask(null);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const toggleTaskStatus = async (task) => {
        const newStatus = task.status === 'active' ? 'inactive' : 'active';
        const confirmMsg = newStatus === 'active' ? t('confirm_activate_task') : t('confirm_deactivate_task');

        if (!window.confirm(confirmMsg)) {
            return;
        }

        setLoading(true);
        const token = localStorage.getItem('token');

        try {
            const res = await fetch(`${API_BASE_URL}/tasks/${task.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ ...task, status: newStatus }),
            });
            if (res.ok) fetchTasks();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const { showToast } = useToast();

    const deleteTask = async (task) => {
        if (!window.confirm(t('confirm_delete_task_generic'))) {
            return;
        }

        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE_URL}/tasks/${task.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                showToast(t('task_deleted_success'), 'success');
                fetchTasks();
            } else {
                const data = await res.json();
                showToast(data.message || t('failed_delete_task'), 'error');
            }
        } catch (err) {
            console.error(err);
            showToast(t('error_occurred'), 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showCreateTask ? '1rem' : '0' }}>
                    <h3>{t('create_new_task')}</h3>
                    <button
                        className="btn btn-secondary"
                        onClick={() => setShowCreateTask(!showCreateTask)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            {showCreateTask ? (
                                <polyline points="18 15 12 9 6 15"></polyline>
                            ) : (
                                <polyline points="6 9 12 15 18 9"></polyline>
                            )}
                        </svg>
                        {showCreateTask ? t('hide') : t('show')}
                    </button>
                </div>
                <div className={`collapsible ${showCreateTask ? 'open' : ''}`}>
                    <form onSubmit={handleCreateTask} style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr auto' }}>
                        <input
                            type="text"
                            placeholder={t('task_name')}
                            className="form-input"
                            value={newTask.name}
                            onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                            required
                            disabled={loading}
                        />
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? t('adding') : t('add_task')}
                        </button>
                    </form>
                </div>
            </div>

            <div className="card">
                <h3>{t('task_list')}</h3>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>{t('name')}</th>
                                <th>{t('status')}</th>
                                <th>{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && tasks.length === 0 ? (
                                <tr>
                                    <td colSpan="3">
                                        <LoadingSpinner />
                                    </td>
                                </tr>
                            ) : tasks.length === 0 ? (
                                <tr>
                                    <td colSpan="3" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                                        {t('no_tasks_found')}
                                    </td>
                                </tr>
                            ) : (
                                tasks.map((task) => (
                                    <tr
                                        key={task.id}
                                        className={expandedTaskId === task.id ? 'mobile-expanded' : 'mobile-collapsed'}
                                        onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                                    >
                                        <td data-label={t('name')}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                {task.name}
                                                <span className="mobile-chevron">▼</span>
                                            </div>
                                        </td>
                                        <td data-label={t('status')}>
                                            <span className={`status-badge status-${task.status}`}>
                                                {task.status === 'active' ? t('active') : t('inactive')}
                                            </span>
                                        </td>
                                        <td data-label={t('actions')}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task); }}
                                                    className={`btn btn-sm ${task.status === 'active' ? 'btn-secondary' : 'btn-success'}`}
                                                    disabled={loading}
                                                >
                                                    {task.status === 'active' ? t('deactivate') : t('activate')}
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setEditingTask(task); }}
                                                    className="btn btn-secondary btn-icon"
                                                    title={t('edit_task')}
                                                    disabled={loading}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deleteTask(task); }}
                                                    className="btn btn-danger btn-icon"
                                                    title={t('delete_task')}
                                                    disabled={loading}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="3 6 5 6 21 6"></polyline>
                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                        <line x1="10" y1="11" x2="10" y2="17"></line>
                                                        <line x1="14" y1="11" x2="14" y2="17"></line>
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {editingTask && (
                <TaskEditModal
                    task={editingTask}
                    onClose={() => setEditingTask(null)}
                    onSave={handleUpdateTask}
                />
            )}
        </div>
    );
}
