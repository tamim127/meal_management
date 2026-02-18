import { useState, useEffect } from 'react';
import api from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCheck, UserX, Clock, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';

export default function PendingUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [actioning, setActioning] = useState(null);

    const fetchPending = async () => {
        try {
            const res = await api.get('/auth/pending-users');
            setUsers(res.data.data);
        } catch (err) {
            toast.error('Failed to load pending users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPending();
    }, []);

    const handleAction = async (userId, action) => {
        setActioning(userId);
        try {
            await api.put(`/auth/${action}/${userId}`);
            toast.success(`User ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
            setUsers(users.filter(u => u._id !== userId));
        } catch (err) {
            toast.error(`Failed to ${action} user`);
        } finally {
            setActioning(null);
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Pending Approvals</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Manage new boarder registrations</p>
                </div>
                <div style={{ position: 'relative', width: '100%', maxWidth: 300 }}>
                    <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        className="input-field"
                        style={{ paddingLeft: '2.5rem' }}
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>User Info</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Registered At</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <AnimatePresence>
                            {loading ? (
                                [...Array(3)].map((_, i) => (
                                    <tr key={i}>
                                        {[...Array(5)].map((_, j) => <td key={j}><div className="skeleton" style={{ height: 40 }} /></td>)}
                                    </tr>
                                ))
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                        <Clock size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
                                        <p>No pending registration requests found.</p>
                                    </td>
                                </tr>
                            ) : filteredUsers.map((u, i) => (
                                <motion.tr
                                    key={u._id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                                    <td><span className="badge badge-info">{u.role}</span></td>
                                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <button
                                                className="btn btn-primary btn-sm"
                                                style={{ background: '#10b981', borderColor: '#10b981' }}
                                                onClick={() => handleAction(u._id, 'approve')}
                                                disabled={actioning === u._id}
                                            >
                                                {actioning === u._id ? '...' : <><UserCheck size={14} style={{ marginRight: 4 }} /> Approve</>}
                                            </button>
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                style={{ color: 'var(--danger)' }}
                                                onClick={() => handleAction(u._id, 'reject')}
                                                disabled={actioning === u._id}
                                            >
                                                {actioning === u._id ? '...' : <><UserX size={14} style={{ marginRight: 4 }} /> Reject</>}
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
