import { useState, useEffect } from 'react';
import API_BASE_URL from '../config';
import { useLanguage } from '../context/LanguageContext';

const UserSettingsModal = ({ user, onClose, onUpdate }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        employee_code: '',
        birthdate: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(true);
    const { t } = useLanguage();

    useEffect(() => {
        const fetchUserData = async () => {
            if (!user) {
                setLoading(false);
                return;
            }
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE_URL}/users/${user.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!res.ok) {
                    throw new Error('Failed to fetch user data');
                }
                const data = await res.json();
                setFormData({
                    name: data.name,
                    email: data.email,
                    password: '',
                    confirmPassword: '',
                    employee_code: data.employee_code || '',
                    birthdate: data.birthdate || ''
                });
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError(t('failed_load_user_data'));
                setLoading(false);
            }
        }
        fetchUserData();
    }, [user]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (formData.password && formData.password !== formData.confirmPassword) {
            setError(t('passwords_do_not_match'));
            return;
        }

        const token = localStorage.getItem('token');
        const { confirmPassword, ...payload } = formData;

        fetch(`${API_BASE_URL}/users/${user.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        })
            .then(async (res) => {
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.message);
                }
                setSuccess(t('profile_updated_success'));
                setTimeout(onClose, 1500);
            })
            .catch((err) => setError(err.message));
    };

    return (
        <div className="modal-overlay">
            <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '2rem', position: 'relative' }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '1.5rem',
                        right: '1.5rem',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)'
                    }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>{t('user_settings')}</h2>

                {error && <div className="error-text" style={{ textAlign: 'center', marginBottom: '1rem' }}>{error}</div>}
                {success && <div style={{ color: 'var(--success-color)', marginBottom: '1rem', textAlign: 'center' }}>{success}</div>}

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                        {t('loading')}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">{t('name')}</label>
                                <input
                                    className="form-input"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">{t('email')}</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">{t('employee_id')}</label>
                                <input
                                    className="form-input"
                                    value={formData.employee_code}
                                    onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">{t('birthdate')}</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={formData.birthdate}
                                    onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
                                />
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid var(--border-color)', margin: '0.5rem 0' }}></div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">{t('new_password')}</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    placeholder={t('leave_blank_to_keep')}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">{t('confirm_password')}</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    placeholder={t('confirm_new_password')}
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                            <button type="button" className="btn btn-secondary" onClick={onClose}>
                                {t('cancel')}
                            </button>
                            <button type="submit" className="btn btn-primary" style={{ minWidth: '120px' }}>
                                {t('save_changes')}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

export default UserSettingsModal;
