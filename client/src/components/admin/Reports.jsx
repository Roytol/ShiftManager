import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { formatDate, formatTime, formatDuration } from '../../utils/formatters';
import LoadingSpinner from '../LoadingSpinner';
import API_BASE_URL from '../../config';
import { useLanguage } from '../../context/LanguageContext';

export default function Reports() {
    const [shifts, setShifts] = useState([]);
    const [filteredShifts, setFilteredShifts] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [filters, setFilters] = useState({
        employeeId: '',
        month: new Date().getMonth(),
        year: new Date().getFullYear()
    });
    const [exportFormat, setExportFormat] = useState('csv');
    const [stats, setStats] = useState({ totalHours: 0, taskDistribution: {} });
    const [loading, setLoading] = useState(false);
    const { t } = useLanguage();

    useEffect(() => {
        fetchShifts();
        fetchEmployees(); // Keeping original name
    }, []);

    useEffect(() => {
        applyFilters();
    }, [shifts, filters]);

    const fetchShifts = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        // Original filters were employeeId, month, year. New snippet suggests user_id, start_date, end_date.
        // For now, I'll adapt to the existing filters structure while replacing the URL.
        // If the user intends a full filter change, they'll need to provide more context.
        const queryParams = new URLSearchParams({
            employeeId: filters.employeeId,
            month: filters.month,
            year: filters.year
        }).toString();

        try {
            const res = await fetch(`${API_BASE_URL}/shifts?${queryParams}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setShifts(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => { // Keeping original name
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE_URL}/users`, { // Changed to /users as per snippet
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setEmployees(data); // Keeping original state variable name
        } catch (err) {
            console.error(err);
        }
    };

    const applyFilters = () => {
        let result = shifts;
        if (filters.employeeId) {
            result = result.filter(s => s.user_id === parseInt(filters.employeeId));
        }

        const startOfMonth = new Date(filters.year, filters.month, 1);
        const endOfMonth = new Date(filters.year, parseInt(filters.month) + 1, 0, 23, 59, 59, 999);

        result = result.filter(s => {
            const shiftDate = new Date(s.start_time);
            return shiftDate >= startOfMonth && shiftDate <= endOfMonth;
        });

        setFilteredShifts(result);
        calculateStats(result);
    };

    const calculateStats = (data) => {
        let total = 0;
        const distribution = {};

        data.forEach(shift => {
            const hours = parseFloat(shift.total_hours) || 0;
            total += hours;

            if (!distribution[shift.task_name]) {
                distribution[shift.task_name] = 0;
            }
            distribution[shift.task_name] += hours;
        });

        setStats({ totalHours: total, taskDistribution: distribution });
    };

    const processExportData = (shiftsToExport) => {
        const grouped = {};
        shiftsToExport.forEach(shift => {
            if (!grouped[shift.user_name]) {
                grouped[shift.user_name] = { shifts: [], tasks: {}, totalHours: 0 };
            }
            grouped[shift.user_name].shifts.push(shift);

            const hours = parseFloat(shift.total_hours) || 0;
            grouped[shift.user_name].totalHours += hours;

            if (!grouped[shift.user_name].tasks[shift.task_name]) {
                grouped[shift.user_name].tasks[shift.task_name] = 0;
            }
            grouped[shift.user_name].tasks[shift.task_name] += hours;
        });
        return grouped;
    };

    const handleExportXLSX = () => {
        const groupedData = processExportData(filteredShifts);
        const wsData = [];

        Object.keys(groupedData).sort().forEach(employee => {
            const data = groupedData[employee];
            wsData.push([`${t('employee')}: ${employee}`]);
            wsData.push([]);
            wsData.push([t('date'), t('task'), t('start_time'), t('end_time'), t('duration')]);
            data.shifts.sort((a, b) => new Date(a.start_time) - new Date(b.start_time)).forEach(shift => {
                wsData.push([
                    formatDate(shift.start_time),
                    shift.task_name,
                    formatTime(shift.start_time),
                    shift.end_time ? formatTime(shift.end_time) : t('active'),
                    formatDuration(shift.total_hours)
                ]);
            });
            wsData.push(['', '', '', `${t('total_hours')}:`, formatDuration(data.totalHours)]);
            wsData.push([]);
            wsData.push([t('task_distribution_summary')]);
            wsData.push([t('task_name'), t('total_hours'), t('percentage')]);
            Object.keys(data.tasks).sort().forEach(taskName => {
                const hours = data.tasks[taskName];
                const percentage = data.totalHours > 0 ? ((hours / data.totalHours) * 100).toFixed(2) + '%' : '0%';
                wsData.push([taskName, formatDuration(hours), percentage]);
            });
            wsData.push([]);
            wsData.push([]);
        });

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, t('shifts_report'));
        XLSX.writeFile(wb, "shifts_report.xlsx");
    };

    const handleExportCSV = () => {
        const groupedData = processExportData(filteredShifts);
        let csvContent = "data:text/csv;charset=utf-8,";

        Object.keys(groupedData).sort().forEach(employee => {
            const data = groupedData[employee];
            csvContent += `${t('employee')}: ${employee}\n\n`;
            csvContent += `${t('date')},${t('task')},${t('start_time')},${t('end_time')},${t('duration')}\n`;
            data.shifts.sort((a, b) => new Date(a.start_time) - new Date(b.start_time)).forEach(shift => {
                const row = [
                    formatDate(shift.start_time),
                    shift.task_name,
                    formatTime(shift.start_time),
                    shift.end_time ? formatTime(shift.end_time) : t('active'),
                    formatDuration(shift.total_hours)
                ].map(item => `"${item}"`).join(",");
                csvContent += row + "\n";
            });
            csvContent += `,,,${t('total_hours')}:,${formatDuration(data.totalHours)}\n\n`;
            csvContent += `${t('task_distribution_summary')}\n`;
            csvContent += `${t('task_name')},${t('total_hours')},${t('percentage')}\n`;
            Object.keys(data.tasks).sort().forEach(taskName => {
                const hours = data.tasks[taskName];
                const percentage = data.totalHours > 0 ? ((hours / data.totalHours) * 100).toFixed(2) + '%' : '0%';
                const row = [taskName, formatDuration(hours), percentage].map(item => `"${item}"`).join(",");
                csvContent += row + "\n";
            });
            csvContent += "\n\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "shifts_report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExport = () => {
        if (exportFormat === 'csv') {
            handleExportCSV();
        } else {
            handleExportXLSX();
        }
    };

    return (
        <div>
            <div className="card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3>{t('reports_exports')}</h3>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <select
                            className="form-input"
                            style={{ width: 'auto' }}
                            value={exportFormat}
                            onChange={(e) => setExportFormat(e.target.value)}
                        >
                            <option value="csv">CSV</option>
                            <option value="xlsx">Excel (XLSX)</option>
                        </select>
                        <button className="btn btn-secondary" onClick={handleExport}>
                            {t('export_report')}
                        </button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div className="form-group">
                        <label className="form-label">{t('filter_by_employee')}</label>
                        <select
                            className="form-input"
                            value={filters.employeeId}
                            onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })}
                        >
                            <option value="">{t('all_employees')}</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">{t('month')}</label>
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
                        <label className="form-label">{t('year')}</label>
                        <input
                            type="number"
                            className="form-input"
                            value={filters.year}
                            onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            <div className="card">
                <h3>{t('task_distribution_summary')}</h3>
                <div style={{ marginTop: '1rem', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600' }}>
                    {t('total_hours')}: {formatDuration(stats.totalHours)}
                </div>
                <div className="table-container">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                                <th style={{ padding: '0.5rem' }}>{t('task_name')}</th>
                                <th style={{ padding: '0.5rem' }}>{t('total_hours')}</th>
                                <th style={{ padding: '0.5rem' }}>{t('percentage')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr className="loading-row">
                                    <td colSpan="3" className="loading-cell">
                                        <LoadingSpinner />
                                    </td>
                                </tr>
                            ) : Object.keys(stats.taskDistribution).length > 0 ? (
                                Object.keys(stats.taskDistribution).sort().map(taskName => {
                                    const hours = stats.taskDistribution[taskName];
                                    const percentage = stats.totalHours > 0 ? ((hours / stats.totalHours) * 100).toFixed(2) + '%' : '0%';
                                    return (
                                        <tr key={taskName} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '0.5rem' }}>{taskName}</td>
                                            <td style={{ padding: '0.5rem' }}>{formatDuration(hours)}</td>
                                            <td style={{ padding: '0.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ flex: 1, height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden', maxWidth: '100px' }}>
                                                        <div style={{ width: percentage, height: '100%', backgroundColor: 'var(--primary-color)' }}></div>
                                                    </div>
                                                    {percentage}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="3" style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                        {t('no_data_found')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
