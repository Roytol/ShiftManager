import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ClockButton from '../components/ClockButton';
import TaskSelectorModal from '../components/TaskSelectorModal';
import ShiftHistory from '../components/ShiftHistory';
import Clock from '../components/Clock';

import UserDropdown from '../components/UserDropdown';

export default function EmployeeDashboard() {
    const { user } = useAuth();
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

    if (loading) return <div className="container">Loading...</div>;

    return (
        <div className="container">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0' }}>
                <h1 style={{ color: 'var(--primary-color)', margin: 0 }}>ShiftManager</h1>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <Clock />
                    <UserDropdown />
                </div>
            </header>

            <div style={{ maxWidth: '600px', margin: '2rem auto' }}>
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
