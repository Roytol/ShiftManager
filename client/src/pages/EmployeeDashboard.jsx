import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ClockButton from '../components/ClockButton';
import TaskSelectorModal from '../components/TaskSelectorModal';
import ShiftHistory from '../components/ShiftHistory';
import Clock from '../components/Clock';
import LoadingSpinner from '../components/LoadingSpinner';

import UserDropdown from '../components/UserDropdown';
import API_BASE_URL from '../config';

export default function EmployeeDashboard() {
    const { user, logout } = useAuth();
    const [currentShift, setCurrentShift] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshHistory, setRefreshHistory] = useState(0);

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
                setIsModalOpen(false);
                setRefreshHistory(prev => prev + 1);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleClockOut = async () => {
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
        }
    };

    if (loading) return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <LoadingSpinner />
        </div>
    );

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
