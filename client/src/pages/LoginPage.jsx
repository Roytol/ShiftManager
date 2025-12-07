import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import API_BASE_URL from '../config';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const { t } = useLanguage();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const user = await login(email, password);
            if (user.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const [showInspectModal, setShowInspectModal] = useState(false);

    const toggleInspectModal = () => {
        if (!showInspectModal) {
            // Log analytics event
            fetch(`${API_BASE_URL}/api/analytics/log`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ event_type: 'inspect_click' })
            }).catch(console.error);
        }
        setShowInspectModal(!showInspectModal);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        // Optional: Show a toast or feedback
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: 'var(--background-color)',
            position: 'relative' // For absolute positioning of the inspect button
        }}>
            <div style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                display: 'flex',
                gap: '10px',
                zIndex: 10
            }}>
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    style={{
                        padding: '8px',
                        backgroundColor: 'var(--card-bg)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '36px',
                        height: '36px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                    title={theme === 'dark' ? t('light_mode') : t('dark_mode')}
                >
                    {theme === 'dark' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="5"></circle>
                            <line x1="12" y1="1" x2="12" y2="3"></line>
                            <line x1="12" y1="21" x2="12" y2="23"></line>
                            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                            <line x1="1" y1="12" x2="3" y2="12"></line>
                            <line x1="21" y1="12" x2="23" y2="12"></line>
                            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                        </svg>
                    )}
                </button>

                {/* Inspect Button */}
                <button
                    onClick={toggleInspectModal}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: 'var(--card-bg)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                >
                    {t('came_to_inspect')}
                </button>
            </div>

            {/* Inspect Modal */}
            {showInspectModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(5px)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 20
                }} onClick={toggleInspectModal}>
                    <div style={{
                        backgroundColor: 'var(--card-bg)',
                        padding: '24px',
                        borderRadius: '12px',
                        width: '90%',
                        maxWidth: '320px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        position: 'relative'
                    }} onClick={e => e.stopPropagation()}>
                        <button
                            onClick={toggleInspectModal}
                            style={{
                                position: 'absolute',
                                top: '10px',
                                right: '10px',
                                background: 'none',
                                border: 'none',
                                fontSize: '1.2rem',
                                cursor: 'pointer',
                                color: 'var(--text-secondary)'
                            }}
                        >
                            ✕
                        </button>
                        <h3 style={{ marginBottom: '16px', color: 'var(--text-primary)', textAlign: 'center' }}>
                            {t('demo_credentials')}
                        </h3>
                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('email')}</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input readOnly value="admin@example.com" className="form-input" style={{ flex: 1 }} />
                                <button onClick={() => copyToClipboard('admin@example.com')} className="btn btn-secondary" style={{ padding: '8px 12px' }}>{t('copy')}</button>
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('password')}</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input readOnly value="admin123" className="form-input" style={{ flex: 1 }} />
                                <button onClick={() => copyToClipboard('admin123')} className="btn btn-secondary" style={{ padding: '8px 12px' }}>{t('copy')}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
                <h1 style={{ textAlign: 'center', marginBottom: '0.5rem', color: 'var(--primary-color)', fontSize: '2.5rem' }}>{t('app_name')}</h1>
                <h2 style={{ marginBottom: '1.5rem', textAlign: 'center', fontSize: '1.25rem', color: 'var(--text-secondary)' }}>{t('sign_in')}</h2>
                {error && <div className="error-text" style={{ marginBottom: '1rem' }}>{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">{t('email')}</label>
                        <input
                            type="email"
                            className="form-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">{t('password')}</label>
                        <input
                            type="password"
                            className="form-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                        {loading ? t('signing_in') : t('sign_in')}
                    </button>
                    {/* <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                        <Link to="/register" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>
                            {t('signup') || "Sign Up"}
                        </Link>
                    </div> */}
                </form>
            </div>
        </div>
    );
}
