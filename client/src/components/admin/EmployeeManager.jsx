import { useState, useEffect } from 'react';
import API_BASE_URL from '../../config';
import LoadingSpinner from '../LoadingSpinner';

const EmployeeManager = () => {
    const [employees, setEmployees] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [currentEmployee, setCurrentEmployee] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'employee',
        status: 'active',
        employee_code: '',
        birthdate: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [expandedEmployeeId, setExpandedEmployeeId] = useState(null); // For mobile expansion

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE_URL}/users`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message);
            }
            const data = await res.json();
            setEmployees(data);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };



    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!isEditing && formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (isEditing && formData.password && formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        const token = localStorage.getItem('token');
        const url = isEditing
            ? `${API_BASE_URL}/users/${currentEmployee.id}`
            : `${API_BASE_URL}/users`;
        const method = isEditing ? 'PUT' : 'POST';

        // Remove confirmPassword before sending
        const { confirmPassword, ...payload } = formData;

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message);
            }
            fetchEmployees();
            resetForm();
            setIsModalOpen(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (employee) => {
        setIsEditing(true);
        setCurrentEmployee(employee);
        setFormData({
            name: employee.name,
            email: employee.email,
            password: '',
            confirmPassword: '',
            role: employee.role,
            status: employee.status,
            employee_code: employee.employee_code || '',
            birthdate: employee.birthdate || ''
        });
    };

    const resetForm = () => {
        setIsEditing(false);
        setCurrentEmployee(null);
        setFormData({
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
            role: 'employee',
            status: 'active',
            employee_code: '',
            birthdate: ''
        });
        setError('');
    };

    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleAdd = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const handleEditClick = (employee) => {
        handleEdit(employee);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        resetForm();
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }
        if (!currentEmployee) return;

        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE_URL}/users/${currentEmployee.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                fetchEmployees();
                handleCloseModal();
            } else {
                const data = await res.json();
                setError(data.message);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3>Employee Management</h3>
                <button className="btn btn-primary" onClick={handleAdd}>
                    Add New Employee
                </button>
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="card" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
                        <button
                            onClick={handleCloseModal}
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

                        <h3 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>{isEditing ? 'Edit Employee' : 'Add New Employee'}</h3>
                        {error && <div className="error-text" style={{ textAlign: 'center', marginBottom: '1rem' }}>{error}</div>}
                        <form onSubmit={(e) => {
                            handleSubmit(e);
                        }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Name</label>
                                    <input
                                        className="form-input"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Employee ID</label>
                                    <input
                                        className="form-input"
                                        value={formData.employee_code}
                                        onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                                        disabled={loading}
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Birthdate</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={formData.birthdate}
                                        onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div style={{ borderTop: '1px solid var(--border-color)', margin: '0.5rem 0' }}></div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Password {isEditing && '(Optional)'}</label>
                                    <input
                                        type="password"
                                        className="form-input"
                                        placeholder={isEditing ? "Leave blank to keep" : ""}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required={!isEditing}
                                        disabled={loading}
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Confirm Password</label>
                                    <input
                                        type="password"
                                        className="form-input"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        required={!isEditing || formData.password.length > 0}
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Role</label>
                                    <select
                                        className="form-input"
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        disabled={loading}
                                    >
                                        <option value="employee">Employee</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Status</label>
                                    <select
                                        className="form-input"
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        disabled={loading}
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                                {isEditing && (
                                    <button
                                        type="button"
                                        className="btn"
                                        style={{ color: 'var(--error-color)', paddingLeft: 0 }}
                                        onClick={handleDelete}
                                        disabled={loading}
                                    >
                                        {loading ? 'Deleting...' : 'Delete User'}
                                    </button>
                                )}
                                <div style={{ display: 'flex', gap: '1rem', marginLeft: 'auto' }}>
                                    <button type="button" className="btn btn-secondary" onClick={handleCloseModal} disabled={loading}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary" style={{ minWidth: '120px' }} disabled={loading}>
                                        {loading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create User')}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="card">
                <h3>Employee List</h3>
                <div className="table-container">
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                                <th style={{ padding: '0.5rem' }}>Name</th>
                                <th style={{ padding: '0.5rem' }}>Role</th>
                                <th style={{ padding: '0.5rem', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && employees.length === 0 ? (
                                { loading && employees.length === 0 ? (
                                    <tr className="loading-row">
                                        <td colSpan="3" className="loading-cell">
                                            <LoadingSpinner />
                                        </td>
                                    </tr>
                                ) : employees.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                                            No employees found.
                                        </td>
                                    </tr>
                                ) : (
                                    employees.map((emp) => (
                                        <tr
                                            key={emp.id}
                                            style={{ borderBottom: '1px solid var(--border-color)' }}
                                            className={expandedEmployeeId === emp.id ? 'mobile-expanded' : 'mobile-collapsed'}
                                            onClick={() => setExpandedEmployeeId(expandedEmployeeId === emp.id ? null : emp.id)}
                                        >
                                            <td data-label="Name" style={{ padding: '0.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-start' }}>
                                                    <span style={{
                                                        width: '10px',
                                                        height: '10px',
                                                        borderRadius: '50%',
                                                        backgroundColor: emp.is_clocked_in ? 'var(--success-color)' : 'var(--error-color)',
                                                        display: 'inline-block'
                                                    }}></span>
                                                    {emp.name}
                                                    <span className="mobile-chevron">▼</span>
                                                </div>
                                            </td>
                                            <td data-label="Role" style={{ padding: '0.5rem' }}>{emp.role}</td>
                                            <td data-label="Actions" style={{ padding: '0.5rem', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                <button
                                                    className="btn btn-secondary btn-icon"
                                                    onClick={(e) => { e.stopPropagation(); handleEditClick(emp); }}
                                                    title="Edit"
                                                    disabled={loading}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                        <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    className="btn btn-danger btn-icon"
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
                                                            setLoading(true);
                                                            const token = localStorage.getItem('token');
                                                            try {
                                                                const res = await fetch(`${API_BASE_URL}/users/${emp.id}`, {
                                                                    method: 'DELETE',
                                                                    headers: { Authorization: `Bearer ${token}` }
                                                                });
                                                                const data = await res.json();
                                                                if (res.ok) {
                                                                    setEmployees(employees.filter(e => e.id !== emp.id));
                                                                } else {
                                                                    alert(data.message);
                                                                }
                                                            } catch (err) {
                                                                console.error(err);
                                                                alert('Failed to delete user');
                                                            } finally {
                                                                setLoading(false);
                                                            }
                                                        }
                                                    }}
                                                    title="Delete"
                                                    disabled={loading}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z" />
                                                        <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    );
}

export default EmployeeManager;
