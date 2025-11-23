import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import EmployeeManager from '../components/admin/EmployeeManager';
import TaskManager from '../components/admin/TaskManager';
import ShiftManager from '../components/admin/ShiftManager';
import MyShiftManager from '../components/admin/MyShiftManager';
import Reports from '../components/admin/Reports';
import ChangeRequests from '../components/admin/ChangeRequests';
import Clock from '../components/Clock';

import UserDropdown from '../components/UserDropdown';

export default function AdminDashboard() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('myshift');

    return (
        <div className="container">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0' }}>
                <h1 style={{ color: 'var(--primary-color)', margin: 0 }}>{t('app_name')}</h1>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <Clock />
                    <UserDropdown />
                </div>
            </header>

            <div style={{ marginBottom: '2rem' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <div className="admin-tabs">
                        <button
                            className={`btn admin-tab-btn ${activeTab === 'myshift' ? 'btn-primary' : ''}`}
                            onClick={() => setActiveTab('myshift')}
                        >
                            {t('my_shift')}
                        </button>
                        <button
                            className={`btn admin-tab-btn ${activeTab === 'employees' ? 'btn-primary' : ''}`}
                            onClick={() => setActiveTab('employees')}
                        >
                            {t('employees')}
                        </button>
                        <button
                            className={`btn admin-tab-btn ${activeTab === 'tasks' ? 'btn-primary' : ''}`}
                            onClick={() => setActiveTab('tasks')}
                        >
                            {t('tasks')}
                        </button>
                        <button
                            className={`btn admin-tab-btn ${activeTab === 'shifts' ? 'btn-primary' : ''}`}
                            onClick={() => setActiveTab('shifts')}
                        >
                            {t('shifts')}
                        </button>
                        <button
                            className={`btn admin-tab-btn ${activeTab === 'requests' ? 'btn-primary' : ''}`}
                            onClick={() => setActiveTab('requests')}
                        >
                            {t('requests')}
                        </button>
                        <button
                            className={`btn admin-tab-btn ${activeTab === 'reports' ? 'btn-primary' : ''}`}
                            onClick={() => setActiveTab('reports')}
                        >
                            {t('reports')}
                        </button>
                    </div>
                </div>
            </div>

            <div>
                {activeTab === 'myshift' && <MyShiftManager />}
                {activeTab === 'employees' && <EmployeeManager />}
                {activeTab === 'tasks' && <TaskManager />}
                {activeTab === 'shifts' && <ShiftManager />}
                {activeTab === 'requests' && <ChangeRequests />}
                {activeTab === 'reports' && <Reports />}
            </div>
        </div>
    );
}
