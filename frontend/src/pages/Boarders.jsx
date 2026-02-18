import { useState, useEffect } from 'react';
import api from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, X, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

export default function Boarders() {
    const [boarders, setBoarders] = useState([]);
    const [pagination, setPagination] = useState({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editBoarder, setEditBoarder] = useState(null);
    const [page, setPage] = useState(1);

    const fetchBoarders = async () => {
        setLoading(true);
        try {
            const params = { page, limit: 20 };
            if (search) params.search = search;
            if (statusFilter) params.status = statusFilter;
            const { data } = await api.get('/boarders', { params });
            setBoarders(data.data);
            setPagination(data.pagination);
        } catch (e) { toast.error('Failed to load boarders'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchBoarders(); }, [page, statusFilter]);

    const handleSearch = (e) => { e.preventDefault(); setPage(1); fetchBoarders(); };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to remove this boarder?')) return;
        try {
            await api.delete(`/boarders/${id}`);
            toast.success('Boarder removed');
            fetchBoarders();
        } catch (e) { toast.error('Failed to delete'); }
    };

    const openEdit = (boarder) => { setEditBoarder(boarder); setShowModal(true); };
    const openAdd = () => { setEditBoarder(null); setShowModal(true); };

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Boarders</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{pagination.total || 0} total boarders</p>
                </div>
                <button onClick={openAdd} className="btn btn-primary"><Plus size={16} /> Add Boarder</button>
            </div>

            <div className="card" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <form onSubmit={handleSearch} style={{ flex: 1, minWidth: 200, position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input className="input-field" style={{ paddingLeft: 36 }} placeholder="Search by name, phone, room..." value={search} onChange={e => setSearch(e.target.value)} />
                    </form>
                    <select className="input-field" style={{ width: 'auto' }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'auto' }}>
                <table className="data-table">
                    <thead>
                        <tr><th>Name</th><th>Room</th><th>Phone</th><th>Seat Rent</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                        {loading ? [...Array(5)].map((_, i) => (
                            <tr key={i}>{[...Array(6)].map((_, j) => <td key={j}><div className="skeleton" style={{ height: 16, width: '80%' }} /></td>)}</tr>
                        )) : boarders.length === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No boarders found. Click "Add Boarder" to get started.</td></tr>
                        ) : boarders.map((b, i) => (
                            <motion.tr key={b._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                                <td style={{ fontWeight: 500 }}>{b.fullName}</td>
                                <td>{b.roomNumber || '—'}</td>
                                <td>{b.phone || '—'}</td>
                                <td>৳{b.seatRent || 0}</td>
                                <td><span className={`badge ${b.status === 'active' ? 'badge-success' : 'badge-warning'}`}>{b.status}</span></td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                                        <button onClick={() => openEdit(b)} className="btn btn-secondary btn-sm"><Edit2 size={14} /></button>
                                        <button onClick={() => handleDelete(b._id)} className="btn btn-danger btn-sm"><Trash2 size={14} /></button>
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {pagination.pages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                    {Array.from({ length: pagination.pages }, (_, i) => (
                        <button key={i} className={`btn btn-sm ${page === i + 1 ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPage(i + 1)}>{i + 1}</button>
                    ))}
                </div>
            )}

            <AnimatePresence>
                {showModal && <BoarderModal boarder={editBoarder} onClose={() => setShowModal(false)} onSave={fetchBoarders} />}
            </AnimatePresence>
        </div>
    );
}

function BoarderModal({ boarder, onClose, onSave }) {
    const [form, setForm] = useState(boarder || { fullName: '', phone: '', email: '', roomNumber: '', seatRent: 0, joinDate: new Date().toISOString().split('T')[0], openingBalance: 0, status: 'active' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (boarder?._id) {
                await api.put(`/boarders/${boarder._id}`, form);
                toast.success('Boarder updated');
            } else {
                await api.post('/boarders', form);
                toast.success('Boarder added');
            }
            onSave();
            onClose();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
        finally { setLoading(false); }
    };

    return (
        <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
            <motion.div className="modal-content" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{boarder?._id ? 'Edit Boarder' : 'Add New Boarder'}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                        <div className="input-group"><label>Full Name *</label><input className="input-field" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} required /></div>
                        <div className="input-group"><label>Phone</label><input className="input-field" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                        <div className="input-group"><label>Email</label><input className="input-field" type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                        <div className="input-group"><label>Room Number</label><input className="input-field" value={form.roomNumber || ''} onChange={e => setForm({ ...form, roomNumber: e.target.value })} /></div>
                        <div className="input-group"><label>Seat Rent (৳)</label><input className="input-field" type="number" value={form.seatRent} onChange={e => setForm({ ...form, seatRent: Number(e.target.value) })} /></div>
                        <div className="input-group"><label>Join Date</label><input className="input-field" type="date" value={form.joinDate?.split('T')[0] || ''} onChange={e => setForm({ ...form, joinDate: e.target.value })} /></div>
                        <div className="input-group"><label>Opening Balance (৳)</label><input className="input-field" type="number" value={form.openingBalance} onChange={e => setForm({ ...form, openingBalance: Number(e.target.value) })} /></div>
                        <div className="input-group"><label>Status</label>
                            <select className="input-field" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                                <option value="active">Active</option><option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                        <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : boarder?._id ? 'Update' : 'Add Boarder'}</button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}
