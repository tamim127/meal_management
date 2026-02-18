import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Menu, Sun, Moon, Bell, X, Check, Trash2 } from 'lucide-react';
import api from '../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

export default function Header({ onMenuClick }) {
    const { theme, toggleTheme } = useTheme();
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            if (res.data.success) {
                setNotifications(res.data.data);
                setUnreadCount(res.data.unreadCount);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            fetchNotifications();
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put('/notifications/read-all');
            fetchNotifications();
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    };

    const deleteNotification = async (id) => {
        try {
            await api.delete(`/notifications/${id}`);
            fetchNotifications();
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    return (
        <header className="top-header">
            <button
                onClick={onMenuClick}
                className="md:hidden"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', padding: '0.5rem' }}
            >
                <Menu size={22} />
            </button>
            <div />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                    onClick={toggleTheme}
                    className="btn btn-secondary btn-sm"
                    title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                >
                    {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                </button>

                <div style={{ position: 'relative' }} ref={dropdownRef}>
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        <Bell size={16} />
                        {unreadCount > 0 && (
                            <span style={{
                                position: 'absolute',
                                top: -2,
                                right: -2,
                                minWidth: 16,
                                height: 16,
                                padding: '0 4px',
                                background: 'var(--danger)',
                                color: 'white',
                                borderRadius: 8,
                                fontSize: 10,
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </button>

                    <AnimatePresence>
                        {showNotifications && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                style={{
                                    position: 'absolute',
                                    top: 'calc(100% + 10px)',
                                    right: 0,
                                    width: 320,
                                    background: 'var(--card-bg)',
                                    borderRadius: 'var(--radius)',
                                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                                    border: '1px solid var(--border-color)',
                                    zIndex: 1000,
                                    maxHeight: 480,
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}
                            >
                                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600 }}>Notifications</h3>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}
                                        >
                                            Mark all as read
                                        </button>
                                    )}
                                </div>

                                <div style={{ overflowY: 'auto', flex: 1, minHeight: 60 }}>
                                    {notifications.length === 0 ? (
                                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                            No notifications found
                                        </div>
                                    ) : (
                                        notifications.map(n => (
                                            <div
                                                key={n._id}
                                                style={{
                                                    padding: '0.875rem',
                                                    borderBottom: '1px solid var(--border-color)',
                                                    background: n.isRead ? 'transparent' : 'rgba(var(--primary-rgb), 0.03)',
                                                    position: 'relative'
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                                    <h4 style={{ fontSize: '0.8125rem', fontWeight: n.isRead ? 500 : 700 }}>{n.title}</h4>
                                                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                        {!n.isRead && (
                                                            <button onClick={() => markAsRead(n._id)} className="icon-btn" title="Mark as read">
                                                                <Check size={14} />
                                                            </button>
                                                        )}
                                                        <button onClick={() => deleteNotification(n._id)} className="icon-btn text-danger" title="Delete">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', lineHeight: 1.4 }}>{n.message}</p>
                                                <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
                                                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
}
