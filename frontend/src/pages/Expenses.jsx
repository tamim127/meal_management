import { useState, useEffect } from 'react';
import api from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, Receipt } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = ['bazar', 'gas', 'salary', 'utilities', 'others'];
const CAT_COLORS = { bazar: '#6366f1', gas: '#f59e0b', salary: '#ec4899', utilities: '#10b981', others: '#64748b' };

export default function Expenses() {
    const [expenses, setExpenses] = useState([]);
    const [pagination, setPagination] = useState({});
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editExp, setEditExp] = useState(null);
    const [catFilter, setCatFilter] = useState('');
    const [page, setPage] = useState(1);
    const now = new Date();
    const [month] = useState(now.getMonth() + 1);
    const [year] = useState(now.getFullYear());
    const [summary, setSummary] = useState(null);

    const fetchExpenses = async () => {
        setLoading(true);
        try {
            const params = { page, limit: 20, month, year };
            if (catFilter) params.category = catFilter;
            const [expRes, sumRes] = await Promise.all([
                api.get('/expenses', { params }),
                api.get('/expenses/summary', { params: { month, year } })
            ]);
            setExpenses(expRes.data.data);
            setPagination(expRes.data.pagination);
            setSummary(sumRes.data.data);
        } catch (e) { toast.error('Failed to load'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchExpenses(); }, [page, catFilter]);

    const handleDelete = async (id) => {
        if (!confirm('Delete this expense?')) return;
        try { await api.delete(`/expenses/${id}`); toast.success('Deleted'); fetchExpenses(); }
        catch (e) { toast.error('Failed'); }
    };

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Expenses</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total: ৳{(summary?.grandTotal || 0).toLocaleString()}</p>
                </div>
                <button onClick={() => { setEditExp(null); setShowModal(true); }} className="btn btn-primary"><Plus size={16} /> Add Expense</button>
            </div>

            {summary?.categoryBreakdown && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                    {summary.categoryBreakdown.map(cat => (
                        <div key={cat._id} className="card" style={{ cursor: 'pointer', borderLeft: `3px solid ${CAT_COLORS[cat._id] || '#64748b'}` }} onClick={() => setCatFilter(cat._id === catFilter ? '' : cat._id)}>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{cat._id}</p>
                            <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>৳{cat.total.toLocaleString()}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cat.count} entries</p>
                        </div>
                    ))}
                </div>
            )}

            <div className="card" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button className={`btn btn-sm ${!catFilter ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setCatFilter('')}>All</button>
                    {CATEGORIES.map(c => (
                        <button key={c} className={`btn btn-sm ${catFilter === c ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setCatFilter(c)} style={{ textTransform: 'capitalize' }}>{c}</button>
                    ))}
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'auto' }}>
                <table className="data-table">
                    <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th><th>Added By</th><th>Actions</th></tr></thead>
                    <tbody>
                        {loading ? [...Array(5)].map((_, i) => (
                            <tr key={i}>{[...Array(6)].map((_, j) => <td key={j}><div className="skeleton" style={{ height: 16, width: '70%' }} /></td>)}</tr>
                        )) : expenses.length === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No expenses found</td></tr>
                        ) : expenses.map(exp => (
                            <tr key={exp._id}>
                                <td>{new Date(exp.date).toLocaleDateString()}</td>
                                <td><span className="badge badge-info" style={{ textTransform: 'capitalize' }}>{exp.category}</span></td>
                                <td>{exp.description || '—'}</td>
                                <td style={{ fontWeight: 600 }}>৳{exp.amount.toLocaleString()}</td>
                                <td>{exp.addedBy?.name || '—'}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                                        <button onClick={() => { setEditExp(exp); setShowModal(true); }} className="btn btn-secondary btn-sm"><Edit2 size={14} /></button>
                                        <button onClick={() => handleDelete(exp._id)} className="btn btn-danger btn-sm"><Trash2 size={14} /></button>
                                    </div>
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
                {showModal && <ExpenseModal expense={editExp} onClose={() => setShowModal(false)} onSave={fetchExpenses} />}
            </AnimatePresence>
        </div>
    );
}

function ExpenseModal({ expense, onClose, onSave }) {
    const [form, setForm] = useState(expense || { date: new Date().toISOString().split('T')[0], category: 'bazar', description: '', amount: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (expense?._id) {
                await api.put(`/expenses/${expense._id}`, form);
                toast.success('Updated');
            } else {
                await api.post('/expenses', form);
                toast.success('Expense added');
            }
            onSave(); onClose();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
        finally { setLoading(false); }
    };

    return (
        <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
            <motion.div className="modal-content" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{expense?._id ? 'Edit Expense' : 'Add Expense'}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                        <div className="input-group"><label>Date *</label><input className="input-field" type="date" value={form.date?.split('T')[0] || ''} onChange={e => setForm({ ...form, date: e.target.value })} required /></div>
                        <div className="input-group"><label>Category *</label>
                            <select className="input-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                {CATEGORIES.map(c => <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c}</option>)}
                            </select>
                        </div>
                        <div className="input-group" style={{ gridColumn: 'span 2' }}><label>Description</label><input className="input-field" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="e.g. Rice, vegetables..." /></div>
                        <div className="input-group"><label>Amount (৳) *</label><input className="input-field" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} required min={0} /></div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                        <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : expense?._id ? 'Update' : 'Add'}</button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}
