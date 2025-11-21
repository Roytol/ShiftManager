import { useState, useEffect } from 'react';
import ClockButton from '../ClockButton';
import TaskSelectorModal from '../TaskSelectorModal';
import ShiftHistory from '../ShiftHistory';

export default function MyShiftManager() {
    const [currentShift, setCurrentShift] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshHistory, setRefreshHistory] = useState(0);

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = () => {
        const token = localStorage.getItem('token');
        fetch('http://localhost:3001/api/shifts/status', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                setCurrentShift(data);
                setLoading(false);
            })
            .catch((err) => console.error(err));
    };

    const handleClockIn = (taskId, notes) => {
        const token = localStorage.getItem('token');
        fetch('http://localhost:3001/api/shifts/clock-in', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ task_id: taskId, notes }),
        })
            .then((res) => {
                if (res.ok) {
                    setIsModalOpen(false);
                    fetchStatus();
                    setRefreshHistory(prev => prev + 1);
                }
            })
            .catch((err) => console.error(err));
    };

    const handleClockOut = () => {
        const token = localStorage.getItem('token');
        fetch('http://localhost:3001/api/shifts/clock-out', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => {
                if (res.ok) {
                    setCurrentShift(null);
                    setRefreshHistory(prev => prev + 1);
                }
            })
            .catch((err) => console.error(err));
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div style={{ maxWidth: '600px', margin: '0 auto 2rem auto' }}>
                <ClockButton
                    currentShift={currentShift}
                    onClockIn={() => setIsModalOpen(true)}
                    onClockOut={handleClockOut}
                />
            </div>

            <ShiftHistory key={refreshHistory} />

            <TaskSelectorModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleClockIn}
            />
        </div>
    );
}
