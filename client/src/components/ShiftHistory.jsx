import { useState, useEffect } from 'react';
import { formatDate, formatTime, formatDuration } from '../utils/formatters';
import RequestEditModal from './RequestEditModal';
import API_BASE_URL from '../config';
import LoadingSpinner from './LoadingSpinner';
import TableSkeleton from './TableSkeleton';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

const ShiftHistory = () => {
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingShift, setEditingShift] = useState(null);
    const { t } = useLanguage();
    const { showToast } = useToast();

    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    useEffect(() => {
        fetchHistory(1, true);
    }, []);

    const fetchHistory = async (currentPage = 1, isReset = false) => {
        if (currentPage === 1) setLoading(true);
        else setIsLoadingMore(true);

        const token = localStorage.getItem('token');
        const limit = 20;
        const offset = (currentPage - 1) * limit;

        try {
            const res = await fetch(`${API_BASE_URL}/shifts/my-history?page=${currentPage}&limit=${limit}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const responseData = await res.json();

            // Handle both old array format and new pagination format for safety
            const newShifts = Array.isArray(responseData) ? responseData : (responseData.data || []);
            const pagination = responseData.pagination;

            if (isReset) {
                setShifts(newShifts);
            } else {
                setShifts(prev => [...prev, ...newShifts]);
            }

            if (pagination) {
                setHasMore(pagination.page < pagination.totalPages);
            } else {
                setHasMore(false); // Fallback if API doesn't return pagination info
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setIsLoadingMore(false);
        }
    };

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchHistory(nextPage, false);
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
                    showToast(t('request_submitted_success'), 'success');
                    setEditingShift(null);
                    fetchHistory();
                } else {
                    showToast(t('request_submitted_fail'), 'error');
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
            <h2 style={{ marginBottom: '1rem' }}>{t('my_shift_history')}</h2>
            <div className="table-container">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                            <th style={{ padding: '0.5rem' }}>{t('date')}</th>
                            <th style={{ padding: '0.5rem' }}>{t('shifts')}</th>
                            <th style={{ padding: '0.5rem' }}>{t('total_duration')}</th>
                            <th style={{ padding: '0.5rem' }}>{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr className="loading-row">
                                <td colSpan="4" className="loading-cell">
                                    <LoadingSpinner />
                                </td>
                            </tr>
                        ) : Object.keys(groupedShifts).length === 0 ? (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                    {t('no_history_found')}
                                </td>
                            </tr>
                        ) : (
                            Object.values(groupedShifts).map((group, index) => (
                                <GroupedHistoryRow
                                    key={index}
                                    group={group}
                                    onRequestEdit={(shift) => setEditingShift(shift)}
                                    t={t}
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
                    onRequest={handleRequestChange}
                />
            )}

            {hasMore && (
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <button
                        className="btn btn-secondary"
                        onClick={handleLoadMore}
                        disabled={isLoadingMore}
                    >
                        {isLoadingMore ? <LoadingSpinner size="small" /> : t('load_more')}
                    </button>
                </div>
            )}
        </div>
    );
}

function GroupedHistoryRow({ group, onRequestEdit, t }) {
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
                <td data-label={t('date')} style={{ padding: '1rem 0.5rem', fontWeight: '600' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-start' }}>
                        <span style={{
                            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s'
                        }}>▶</span>
                        {formatDate(group.date)}
                    </div>
                </td>
                <td data-label={t('shifts')} style={{ padding: '1rem 0.5rem' }}>{group.shifts.length} {t('shifts')}</td>
                <td data-label={t('total_duration')} style={{ padding: '1rem 0.5rem', fontWeight: '600', color: 'var(--primary-color)' }}>
                    {formatDuration(group.total_hours)}
                </td>
                <td data-label={t('actions')} style={{ padding: '1rem 0.5rem' }}>
                    <button className="btn btn-sm btn-secondary">
                        {expanded ? t('collapse') : t('expand')}
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
                                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>{t('task')}</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>{t('time')}</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>{t('duration')}</th>
                                        <th style={{ padding: '0.5rem', textAlign: 'left' }}>{t('actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {group.shifts.map(shift => (
                                        <tr key={shift.id} style={{ borderTop: '1px solid var(--border-color-light)' }}>
                                            <td data-label={t('task')} style={{ padding: '0.5rem' }}>{shift.task_name}</td>
                                            <td data-label={t('time')} style={{ padding: '0.5rem' }}>
                                                {formatTime(shift.start_time)} - {shift.end_time ? formatTime(shift.end_time) : <span style={{ color: 'var(--success-color)' }}>{t('active')}</span>}
                                            </td>
                                            <td data-label={t('duration')} style={{ padding: '0.5rem' }}>{formatDuration(shift.total_hours)}</td>
                                            <td data-label={t('actions')} style={{ padding: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                                                {shift.request_status === 'pending' ? (
                                                    <span style={{
                                                        backgroundColor: 'rgba(255, 149, 0, 0.1)',
                                                        color: '#FF9500',
                                                        padding: '0.25rem 0.75rem',
                                                        borderRadius: '1rem',
                                                        fontSize: '0.85rem',
                                                        fontWeight: '500'
                                                    }}>
                                                        {t('pending')}
                                                    </span>
                                                ) : (
                                                    <button
                                                        className="btn btn-secondary"
                                                        style={{ fontSize: '0.85rem', padding: '0.3rem 0.6rem' }}
                                                        onClick={(e) => { e.stopPropagation(); onRequestEdit(shift); }}
                                                        disabled={!shift.end_time}
                                                    >
                                                        {t('edit')}
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
