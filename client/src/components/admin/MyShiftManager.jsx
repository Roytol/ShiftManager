import { useState, useEffect } from 'react';
import API_BASE_URL from '../../config';
import ClockButton from '../ClockButton';
import TaskSelectorModal from '../TaskSelectorModal';
import ShiftHistory from '../ShiftHistory';

const MyShiftManager = () => {
    const [currentShift, setCurrentShift] = useState(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshHistory, setRefreshHistory] = useState(0);

    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE_URL}/my-shifts/status`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setCurrentShift(data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleClockIn = async (taskId) => {
        setActionLoading(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE_URL}/my-shifts/clock-in`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ task_id: taskId })
            });
            if (res.ok) {
                await fetchStatus();
                setIsTaskModalOpen(false);
                setRefreshHistory(prev => prev + 1);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleClockOut = async () => {
        setActionLoading(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE_URL}/my-shifts/clock-out`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                await fetchStatus();
                setRefreshHistory(prev => prev + 1);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div style={{ maxWidth: '600px', margin: '0 auto 2rem auto' }}>
                <ClockButton
                    currentShift={currentShift}
                    onClockIn={() => setIsTaskModalOpen(true)}
                    onClockOut={handleClockOut}
                    disabled={actionLoading}
                />
            </div>

            <ShiftHistory key={refreshHistory} />

            <TaskSelectorModal
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                onConfirm={handleClockIn}
                loading={actionLoading}
            />
        </div>
    );
}

export default MyShiftManager;
