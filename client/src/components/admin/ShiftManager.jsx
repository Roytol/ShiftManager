import { useState, useEffect } from 'react';
import ShiftEditModal from './ShiftEditModal';
import ShiftCreateModal from './ShiftCreateModal';
import { formatDate, formatTime, formatDuration } from '../../utils/formatters';
import LoadingSpinner from '../LoadingSpinner';
import API_BASE_URL from '../../config';

export default function ShiftManager() {
    const [shifts, setShifts] = useState([]);
    const [filteredShifts, setFilteredShifts] = useState([]);
    const [groupedShifts, setGroupedShifts] = useState({});
    const [users, setUsers] = useState([]); // Renamed from employees
    const [filters, setFilters] = useState({
        user_id: '', // Renamed from employeeId
        start_date: '', // New filter
        end_date: '' // New filter
    });
    const [editingShift, setEditingShift] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    const [sortOption, setSortOption] = useState('date_desc'); // Default: Newest First

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchShifts();
        fetchUsers(); // Renamed from fetchEmployees
    }, []);

    useEffect(() => {
        applyFilters();
    }, [shifts, filters, sortOption]);

    const handleDeleteShift = async (id) => {
        if (!window.confirm('Are you sure you want to delete this shift?')) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/shifts/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                fetchShifts();
            } else {
                alert('Failed to delete shift');
                setLoading(false);
            }
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let result = shifts;
        if (filters.user_id) { // Changed from employeeId
            result = result.filter(s => s.user_id === parseInt(filters.user_id)); // Changed from employeeId
        }

        // Date filtering is now handled by the API, so this client-side filtering is removed
        // const startOfMonth = new Date(filters.year, filters.month, 1);
        // const endOfMonth = new Date(filters.year, parseInt(filters.month) + 1, 0, 23, 59, 59, 999);

        // result = result.filter(s => {
        //     const shiftDate = new Date(s.start_time);
        //     return shiftDate >= startOfMonth && shiftDate <= endOfMonth;
        // });

        // Sorting Logic
        result.sort((a, b) => {
            const nameA = a.user_name || '';
            const nameB = b.user_name || '';
            const durationA = parseFloat(a.total_hours) || 0;
            const durationB = parseFloat(b.total_hours) || 0;
            const dateA = new Date(a.start_time || 0);
            const dateB = new Date(b.start_time || 0);

            switch (sortOption) {
                case 'date_desc':
                    return dateB - dateA;
                case 'date_asc':
                    return dateA - dateB;
                case 'name_asc':
                    return nameA.localeCompare(nameB);
                case 'name_desc':
                    return nameB.localeCompare(nameA);
                case 'duration_desc':
                    return durationB - durationA;
                case 'duration_asc':
                    return durationA - durationB;
                default:
                    return dateB - dateA;
            }
        });

        // Grouping Logic
        const groups = {};
        result.forEach(shift => {
            const shiftDate = new Date(shift.start_time);
            const date = `${shiftDate.getFullYear()}-${String(shiftDate.getMonth() + 1).padStart(2, '0')}-${String(shiftDate.getDate()).padStart(2, '0')}`;
            const key = `${date}_${shift.user_id}`;

            if (!groups[key]) {
                groups[key] = {
                    id: key,
                    date: shift.start_time,
                    user_id: shift.user_id,
                    user_name: shift.user_name,
                    shifts: [],
                    total_hours: 0
                };
            }

            groups[key].shifts.push(shift);
            groups[key].total_hours += parseFloat(shift.total_hours || 0);
        });

        setFilteredShifts(result); // Keep flat list for other uses if needed, but we use groupedShifts for render
        setGroupedShifts(groups);
    };

    const fetchShifts = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        const queryParams = new URLSearchParams(filters).toString(); // Use filters for query params
        try {
            const res = await fetch(`${API_BASE_URL}/shifts?${queryParams}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                throw new Error('Failed to fetch shifts');
            }
            const data = await res.json();
            if (Array.isArray(data)) {
                setShifts(data);
            } else {
                console.error('Received invalid data format for shifts:', data);
                setShifts([]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE_URL}/users`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                throw new Error('Failed to fetch users');
            }
            const data = await res.json();
            if (Array.isArray(data)) {
                setUsers(data);
            } else {
                setUsers([]);
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div>
            <div className="card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3>Shift Management</h3>
                    <button
                        className="btn btn-secondary"
                        onClick={() => setShowFilters(!showFilters)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                        </svg>
                        Filter & Sort
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={() => setIsCreating(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Add Shift
                    </button>
                </div>

                <div className={`collapsible ${showFilters ? 'open' : ''}`}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                        <div className="form-group">
                            <label className="form-label">Sort By</label>
                            <select
                                className="form-input"
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value)}
                            >
                                <option value="date_desc">Date (Newest First)</option>
                                <option value="date_asc">Date (Oldest First)</option>
                                <option value="name_asc">Employee (A-Z)</option>
                                <option value="name_desc">Employee (Z-A)</option>
                                <option value="duration_desc">Duration (Longest)</option>
                                <option value="duration_asc">Duration (Shortest)</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Filter by Employee</label>
                            <select
                                className="form-input"
                                value={filters.employeeId}
                                onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })}
                            >
                                <option value="">All Employees</option>
                                {users.map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Month</label>
                            <select
                                className="form-input"
                                value={filters.month}
                                onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                            >
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i} value={i}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Year</label>
                            <input
                                type="number"
                                className="form-input"
                                value={filters.year}
                                onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="table-container">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                                <th style={{ padding: '0.5rem' }}>Group / Employee</th>
                                <th style={{ padding: '0.5rem' }}>Date</th>
                                <th style={{ padding: '0.5rem' }}>Shifts</th>
                                <th style={{ padding: '0.5rem' }}>Total Duration</th>
                                <th style={{ padding: '0.5rem' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && Object.keys(groupedShifts).length === 0 ? (
                                <tr>
                                    <td colSpan="5">
                                        <LoadingSpinner />
                                    </td>
                                </tr>
                            ) : Object.keys(groupedShifts).length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                                        No shifts found matching your filters.
                                    </td>
                                </tr>
                            ) : (
                                Object.values(groupedShifts).map(group => (
                                    <GroupedShiftRow
                                        key={group.id}
                                        group={group}
                                        onEdit={setEditingShift}
                                        onDelete={handleDeleteShift}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {editingShift && (
                <ShiftEditModal
                    shift={editingShift}
                    onClose={() => setEditingShift(null)}
                    onUpdate={() => {
                        setEditingShift(null);
                        fetchShifts();
                    }}
                />
            )}

            {isCreating && (
                <ShiftCreateModal
                    onClose={() => setIsCreating(false)}
                    onCreate={() => {
                        setIsCreating(false);
                        fetchShifts();
                    }}
                />
            )}
        </div>
    );
}

function GroupedShiftRow({ group, onEdit, onDelete }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <>
            <tr
                style={{
                    borderBottom: expanded ? 'none' : '1px solid var(--border-color)',
                    cursor: 'pointer',
                    backgroundColor: expanded ? 'rgba(0,0,0,0.02)' : 'transparent'
                }}
                onClick={() => setExpanded(!expanded)}
            >
                <td style={{ padding: '1rem 0.5rem', fontWeight: '600' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s'
                        }}>▶</span>
                        {group.user_name}
                    </div>
                </td>
                <td style={{ padding: '1rem 0.5rem' }}>{formatDate(group.date)}</td>
                <td style={{ padding: '1rem 0.5rem' }}>{group.shifts.length} shifts</td>
                <td style={{ padding: '1rem 0.5rem', fontWeight: '600', color: 'var(--primary-color)' }}>
                    {formatDuration(group.total_hours)}
                </td>
                <td style={{ padding: '1rem 0.5rem' }}>
                    <button className="btn btn-sm btn-secondary">
                        {expanded ? 'Collapse' : 'Expand'}
                    </button>
                </td>
            </tr>
            {expanded && (
                <tr>
                    <td colSpan="5" style={{ padding: '0 0 1rem 0', borderBottom: '1px solid var(--border-color)' }}>
                        <div style={{ backgroundColor: 'rgba(0,0,0,0.02)', padding: '0.5rem 2rem' }}>
                            <table style={{ width: '100%', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr style={{ color: 'var(--text-secondary)' }}>
                                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Task</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Time</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Duration</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {group.shifts.map(shift => (
                                        <tr key={shift.id} style={{ borderTop: '1px solid var(--border-color-light)' }}>
                                            <td style={{ padding: '0.5rem' }}>{shift.task_name}</td>
                                            <td style={{ padding: '0.5rem' }}>
                                                {formatTime(shift.start_time)} - {shift.end_time ? formatTime(shift.end_time) : 'Active'}
                                            </td>
                                            <td style={{ padding: '0.5rem' }}>{formatDuration(shift.total_hours)}</td>
                                            <td style={{ padding: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    className="btn btn-secondary btn-icon"
                                                    onClick={(e) => { e.stopPropagation(); onEdit(shift); }}
                                                    title="Edit"
                                                    style={{ padding: '0.25rem' }}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                                                        <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    className="btn btn-danger btn-icon"
                                                    onClick={(e) => { e.stopPropagation(); onDelete(shift.id); }}
                                                    title="Delete"
                                                    style={{ padding: '0.25rem' }}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                                                        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z" />
                                                        <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}
