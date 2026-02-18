import { useState, useEffect } from 'react';
import api from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, X } from 'lucide-react';
import { toast } from 'sonner';

const METHODS = ['cash', 'bkash', 'nagad', 'bank_transfer'];

export default function Payments() {
    const [payments, setPayments] = useState([]);
    const [boarders, setBoarders] = useState([]);
    const [pagination, setPagination] = useState({});
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editPay, setEditPay] = useState(null);
    const [page, setPage] = useState(1);
    const now = new Date();

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const [payRes, borRes] = await Promise.all([
                api.get('/payments', { params: { page, limit: 20, month: now.getMonth() + 1, year: now.getFullYear() } }),
                api.get('/boarders', { params: { limit: 100, status: 'active' } }),
            ]);
            setPayments(payRes.data.data);
            setPagination(payRes.data.pagination);
            setBoarders(borRes.data.data);
        } catch (e) { toast.error('Failed to load'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchPayments(); }, [page]);

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Payments</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{pagination.total || 0} payments this month</p>
                </div>
                <button onClick={() => { setEditPay(null); setShowModal(true); }} className="btn btn-primary"><Plus size={16} /> Record Payment</button>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'auto' }}>
                <table className="data-table">
                    <thead><tr><th>Date</th><th>Boarder</th><th>Amount</th><th>Method</th><th>Reference</th><th>Notes</th><th>Actions</th></tr></thead>
                    <tbody>
                        {loading ? [...Array(5)].map((_, i) => (
                            <tr key={i}>{[...Array(7)].map((_, j) => <td key={j}><div className="skeleton" style={{ height: 16, width: '70%' }} /></td>)}</tr>
                        )) : payments.length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No payments recorded</td></tr>
                        ) : payments.map(p => (
                            <tr key={p._id}>
                                <td>{new Date(p.date).toLocaleDateString()}</td>
                                <td style={{ fontWeight: 500 }}>{p.boarder_id?.fullName || '—'}</td>
                                <td style={{ fontWeight: 600, color: 'var(--success)' }}>৳{p.amount.toLocaleString()}</td>
                                <td><span className="badge badge-info">{p.method}</span></td>
                                <td>{p.referenceId || '—'}</td>
                                <td>{p.notes || '—'}</td>
                                <td>
                                    <button onClick={() => { setEditPay(p); setShowModal(true); }} className="btn btn-secondary btn-sm"><Edit2 size={14} /></button>
                                </td>
                            </tr>
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
                {showModal && <PaymentModal payment={editPay} boarders={boarders} onClose={() => setShowModal(false)} onSave={fetchPayments} />}
            </AnimatePresence>
        </div>
    );
}

function PaymentModal({ payment, boarders, onClose, onSave }) {
    const [form, setForm] = useState(payment || { boarder_id: '', amount: '', date: new Date().toISOString().split('T')[0], method: 'cash', referenceId: '', notes: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (payment?._id) {
                await api.put(`/payments/${payment._id}`, form);
                toast.success('Updated');
            } else {
                await api.post('/payments', form);
                toast.success('Payment recorded');
            }
            onSave(); onClose();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
        finally { setLoading(false); }
    };

    return (
        <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
            <motion.div className="modal-content" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{payment?._id ? 'Edit Payment' : 'Record Payment'}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                        <div className="input-group"><label>Boarder *</label>
                            <select className="input-field" value={form.boarder_id?._id || form.boarder_id} onChange={e => setForm({ ...form, boarder_id: e.target.value })} required>
                                <option value="">Select boarder</option>
                                {boarders.map(b => <option key={b._id} value={b._id}>{b.fullName} (Room {b.roomNumber})</option>)}
                            </select>
                        </div>
                        <div className="input-group"><label>Amount (৳) *</label><input className="input-field" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} required min={0} /></div>
                        <div className="input-group"><label>Date *</label><input className="input-field" type="date" value={form.date?.split('T')[0] || ''} onChange={e => setForm({ ...form, date: e.target.value })} required /></div>
                        <div className="input-group"><label>Method</label>
                            <select className="input-field" value={form.method} onChange={e => setForm({ ...form, method: e.target.value })}>
                                {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div className="input-group"><label>Reference ID</label><input className="input-field" value={form.referenceId || ''} onChange={e => setForm({ ...form, referenceId: e.target.value })} placeholder="Transaction ID" /></div>
                        <div className="input-group"><label>Notes</label><input className="input-field" value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" /></div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                        <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : payment?._id ? 'Update' : 'Record'}</button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}
