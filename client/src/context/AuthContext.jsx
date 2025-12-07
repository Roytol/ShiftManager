import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

import API_BASE_URL from '../config';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetch(`${API_BASE_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then((res) => {
                    if (res.ok) return res.json();
                    throw new Error('Invalid token');
                })
                .then((userData) => setUser(userData))
                .catch(() => localStorage.removeItem('token'))
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message);
        }

        const data = await res.json();
        localStorage.setItem('token', data.token);
        setUser(data.user);
        return data.user;
    };

    const register = async (name, email, password) => {
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password }),
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message);
        }

        const data = await res.json();
        localStorage.setItem('token', data.token);
        setUser(data.user);
        return data.user;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
