import { useState, useEffect } from 'react';
import { formatDate, formatTime } from '../../utils/formatters';
import API_BASE_URL from '../../config';
import LoadingSpinner from '../LoadingSpinner';

export default function ChangeRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/admin/change-requests`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setRequests(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        if (!window.confirm('Are you sure you want to approve this change?')) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE_URL}/admin/change-requests/${id}/approve`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                alert('Request approved.');
                fetchRequests();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleReject = (id) => {
        if (!window.confirm('Are you sure you want to reject this request?')) return;

        const token = localStorage.getItem('token');
        fetch(`${API_BASE_URL}/admin/change-requests/${id}/reject`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => {
                if (res.ok) {
                    alert('Request rejected.');
                    fetchRequests();
                }
            })
            .catch((err) => console.error(err));
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <LoadingSpinner />
        </div>
    );

    return (
        <div className="card">
            <h2 style={{ marginBottom: '1.5rem' }}>Shift Change Requests</h2>
            <div className="table-container">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                            <th style={{ padding: '0.5rem' }}>Employee</th>
                            <th style={{ padding: '0.5rem' }}>Task</th>
                            <th style={{ padding: '0.5rem' }}>Original Time</th>
                            <th style={{ padding: '0.5rem' }}>Requested Time</th>
                            <th style={{ padding: '0.5rem' }}>Reason</th>
                            <th style={{ padding: '0.5rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                                    No pending requests.
                                </td>
                            </tr>
                        ) : (
                            requests.map((req) => (
                                <tr key={req.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '0.5rem' }}>{req.user_name}</td>
                                    <td style={{ padding: '0.5rem' }}>{req.task_name}</td>
                                    <td style={{ padding: '0.5rem' }}>
                                        <div style={{ fontSize: '0.9rem' }}>{formatDate(req.original_start_time)}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            {formatTime(req.original_start_time)} - {formatTime(req.original_end_time)}
                                        </div>
                                    </td>
                                    <td style={{ padding: '0.5rem' }}>
                                        <div style={{ fontSize: '0.9rem' }}>{formatDate(req.new_start_time)}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--primary-color)', fontWeight: '500' }}>
                                            {formatTime(req.new_start_time)} - {formatTime(req.new_end_time)}
                                        </div>
                                    </td>
                                    <td style={{ padding: '0.5rem', maxWidth: '200px' }}>{req.reason}</td>
                                    <td style={{ padding: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            className="btn btn-primary"
                                            style={{ backgroundColor: 'var(--success-color)', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                                            onClick={() => handleApprove(req.id)}
                                        >
                                            Approve
                                        </button>
                                        <button
                                            className="btn btn-danger"
                                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                                            onClick={() => handleReject(req.id)}
                                        >
                                            Reject
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
