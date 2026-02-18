import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('user');
        return saved ? JSON.parse(saved) : null;
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        const savedUser = localStorage.getItem('user');

        if (token) {
            api.get('/auth/me')
                .then(res => {
                    if (res.data?.success && res.data?.data) {
                        setUser(res.data.data);
                        localStorage.setItem('user', JSON.stringify(res.data.data));
                    }
                })
                .catch((err) => {
                    console.error('Initialization error:', err);
                    // Only logout if it is definitely an authentication failure (401)
                    if (err.response?.status === 401) {
                        logout();
                    }
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        setUser(data.data.user);
        return data.data.user;
    };

    const register = async (formData) => {
        const { data } = await api.post('/auth/register', formData);
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        setUser(data.data.user);
        return data.data.user;
    };

    const logout = async () => {
        try { await api.post('/auth/logout'); } catch (e) { /* ignore */ }
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
