import { useState, useEffect } from 'react';
import TaskEditModal from './TaskEditModal';
import API_BASE_URL from '../../config';
import LoadingSpinner from '../LoadingSpinner';

export default function TaskManager() {
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState({ name: '' });
    const [editingTask, setEditingTask] = useState(null);
    const [showCreateTask, setShowCreateTask] = useState(false);

    const [loading, setLoading] = useState(false);
    const [expandedTaskId, setExpandedTaskId] = useState(null); // For mobile expansion

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
        const action = newStatus === 'active' ? 'activate' : 'deactivate';

        if (!window.confirm(`Are you sure you want to ${action} this task?`)) {
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

    const deleteTask = async (task) => {
        if (!window.confirm(`Are you sure you want to delete the task "${task.name}"?`)) {
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
                fetchTasks();
            } else {
                const data = await res.json();
                alert(data.message || 'Failed to delete task');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showCreateTask ? '1rem' : '0' }}>
                    <h3>Create New Task</h3>
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
                        {showCreateTask ? 'Hide' : 'Show'}
                    </button>
                </div>
                <div className={`collapsible ${showCreateTask ? 'open' : ''}`}>
                    <form onSubmit={handleCreateTask} style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr auto' }}>
                        <input
                            type="text"
                            placeholder="Task Name"
                            className="form-input"
                            value={newTask.name}
                            onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                            required
                            disabled={loading}
                        />
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Adding...' : 'Add Task'}
                        </button>
                    </form>
                </div>
            </div>

            <div className="card">
                <h3>Task List</h3>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Status</th>
                                <th>Actions</th>
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
                                        No tasks found. Create one to get started!
                                    </td>
                                </tr>
                            ) : (
                                tasks.map((task) => (
                                    <tr
                                        key={task.id}
                                        className={expandedTaskId === task.id ? 'mobile-expanded' : 'mobile-collapsed'}
                                        onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                                    >
                                        <td data-label="Name">
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                {task.name}
                                                <span className="mobile-chevron">▼</span>
                                            </div>
                                        </td>
                                        <td data-label="Status">
                                            <span className={`status-badge status-${task.status}`}>
                                                {task.status}
                                            </span>
                                        </td>
                                        <td data-label="Actions">
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task); }}
                                                    className={`btn btn-sm ${task.status === 'active' ? 'btn-secondary' : 'btn-success'}`}
                                                    disabled={loading}
                                                >
                                                    {task.status === 'active' ? 'Deactivate' : 'Activate'}
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setEditingTask(task); }}
                                                    className="btn btn-secondary btn-icon"
                                                    title="Edit Task"
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
                                                    title="Delete Task"
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
