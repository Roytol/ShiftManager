import { useState, useEffect } from 'react';
import API_BASE_URL from '../../config';
import ClockButton from '../ClockButton';
import TaskSelectorModal from '../TaskSelectorModal';
import ShiftHistory from '../ShiftHistory';
import LoadingSpinner from '../LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';

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
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE_URL}/shifts/status`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setCurrentShift(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const { showToast } = useToast();
    const { t } = useLanguage();

    const handleClockIn = async (taskId) => {
        // Optimistic Update
        const previousShift = currentShift;
        const tempShift = {
            id: 'temp-id',
            task_id: taskId,
            task_name: 'Loading...', // Ideally we'd get the task name from the modal, but this is okay for a split second
            start_time: new Date().toISOString(),
            status: 'active'
        };
        setCurrentShift(tempShift);
        setIsTaskModalOpen(false);
        setActionLoading(true);

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE_URL}/shifts/clock-in`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ task_id: taskId })
            });
            if (res.ok) {
                showToast(t('clock_in_success'), 'success');
                await fetchStatus();
                setRefreshHistory(prev => prev + 1);
            } else {
                throw new Error('Failed to clock in');
            }
        } catch (err) {
            console.error(err);
            setCurrentShift(previousShift); // Revert
            showToast(t('failed_clock_in'), 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleClockOut = async () => {
        // Optimistic Update
        const previousShift = currentShift;
        setCurrentShift(null);
        setActionLoading(true);

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE_URL}/shifts/clock-out`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                showToast(t('clock_out_success'), 'success');
                await fetchStatus();
                setRefreshHistory(prev => prev + 1);
            } else {
                throw new Error('Failed to clock out');
            }
        } catch (err) {
            console.error(err);
            setCurrentShift(previousShift); // Revert
            showToast(t('failed_clock_out'), 'error');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <LoadingSpinner />
        </div>
    );

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
