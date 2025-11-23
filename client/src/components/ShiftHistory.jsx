import { useState, useEffect } from 'react';
import { formatDate, formatTime, formatDuration } from '../utils/formatters';
import RequestEditModal from './RequestEditModal';
import API_BASE_URL from '../config';
import LoadingSpinner from './LoadingSpinner';

const ShiftHistory = () => {
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingShift, setEditingShift] = useState(null);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/shifts/my-history`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                setShifts(data);
                setLoading(false);
            })
            .catch((err) => console.error(err));
    };

    const handleRequestChange = async (requestData) => {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/shifts/${requestData.id}/request-change`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(requestData),
        })
            .then((res) => {
                if (res.ok) {
                    alert('Request submitted successfully!');
                    setEditingShift(null);
                    fetchHistory();
                } else {
                    alert('Failed to submit request.');
                }
            })
            .catch((err) => console.error(err));
    };

    // Group shifts by date
    const groupedShifts = shifts.reduce((groups, shift) => {
        const shiftDate = new Date(shift.start_time);
        const date = `${shiftDate.getFullYear()}-${String(shiftDate.getMonth() + 1).padStart(2, '0')}-${String(shiftDate.getDate()).padStart(2, '0')}`;
        if (!groups[date]) {
            groups[date] = {
                date: shift.start_time,
                shifts: [],
                total_hours: 0
            };
        }
        groups[date].shifts.push(shift);
        groups[date].total_hours += parseFloat(shift.total_hours || 0);
        return groups;
    }, {});



    return (
        <div className="card" style={{ marginTop: '2rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>My Shift History</h2>
            <div className="table-container">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                            <th style={{ padding: '0.5rem' }}>Date</th>
                            <th style={{ padding: '0.5rem' }}>Shifts</th>
                            <th style={{ padding: '0.5rem' }}>Total Duration</th>
                            <th style={{ padding: '0.5rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="4">
                                    <LoadingSpinner />
                                </td>
                            </tr>
                        ) : Object.keys(groupedShifts).length === 0 ? (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                    No history found.
                                </td>
                            </tr>
                        ) : (
                            Object.values(groupedShifts).map((group, index) => (
                                <GroupedHistoryRow
                                    key={index}
                                    group={group}
                                    onRequestEdit={(shift) => setEditingShift(shift)}
                                />
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {editingShift && (
                <RequestEditModal
                    shift={editingShift}
                    onClose={() => setEditingShift(null)}
                    onRequest={handleRequestEdit}
                />
            )}
        </div>
    );
}

function GroupedHistoryRow({ group, onRequestEdit }) {
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
                <td data-label="Date" style={{ padding: '1rem 0.5rem', fontWeight: '600' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <span style={{
                            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s'
                        }}>▶</span>
                        {formatDate(group.date)}
                    </div>
                </td>
                <td data-label="Shifts" style={{ padding: '1rem 0.5rem' }}>{group.shifts.length} shifts</td>
                <td data-label="Total Duration" style={{ padding: '1rem 0.5rem', fontWeight: '600', color: 'var(--primary-color)' }}>
                    {formatDuration(group.total_hours)}
                </td>
                <td data-label="Actions" style={{ padding: '1rem 0.5rem' }}>
                    <button className="btn btn-sm btn-secondary">
                        {expanded ? 'Collapse' : 'Expand'}
                    </button>
                </td>
            </tr>
            {expanded && (
                <tr className="expanded-row-content">
                    <td colSpan="4" className="expanded-details-cell" style={{ padding: '0 0 1rem 0', borderBottom: '1px solid var(--border-color)' }}>
                        <div style={{ backgroundColor: 'rgba(0,0,0,0.02)', padding: '0.5rem 1rem' }}>
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
                                            <td data-label="Task" style={{ padding: '0.5rem' }}>{shift.task_name}</td>
                                            <td data-label="Time" style={{ padding: '0.5rem' }}>
                                                {formatTime(shift.start_time)} - {shift.end_time ? formatTime(shift.end_time) : <span style={{ color: 'var(--success-color)' }}>Active</span>}
                                            </td>
                                            <td data-label="Duration" style={{ padding: '0.5rem' }}>{formatDuration(shift.total_hours)}</td>
                                            <td data-label="Actions" style={{ padding: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                                                {shift.request_status === 'pending' ? (
                                                    <span style={{
                                                        backgroundColor: 'rgba(255, 149, 0, 0.1)',
                                                        color: '#FF9500',
                                                        padding: '0.25rem 0.75rem',
                                                        borderRadius: '1rem',
                                                        fontSize: '0.85rem',
                                                        fontWeight: '500'
                                                    }}>
                                                        Pending
                                                    </span>
                                                ) : (
                                                    <button
                                                        className="btn btn-secondary"
                                                        style={{ fontSize: '0.85rem', padding: '0.3rem 0.6rem' }}
                                                        onClick={(e) => { e.stopPropagation(); onRequestEdit(shift); }}
                                                        disabled={!shift.end_time}
                                                    >
                                                        Edit
                                                    </button>
                                                )}
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

export default ShiftHistory;
