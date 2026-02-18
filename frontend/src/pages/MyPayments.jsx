import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { motion } from 'framer-motion';
import { CreditCard, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function MyPayments() {
    const { user } = useAuth();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [totalPaid, setTotalPaid] = useState(0);

    useEffect(() => {
        if (!user?.boarder_id) {
            setLoading(false);
            return;
        }

        api.get(`/payments/boarder/${user.boarder_id}`, { params: { month, year } })
            .then(res => {
                setPayments(res.data.data);
                setTotalPaid(res.data.totalPaid);
            })
            .catch(() => toast.error('Failed to load payments'))
            .finally(() => setLoading(false));
    }, [user, month, year]);

    if (!user?.boarder_id) return (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>Profile Not Linked</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Your account is not yet linked to a boarder profile. Please contact your hostel administrator.</p>
        </div>
    );

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>My Payments</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>View your payment history and total deposits</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <select
                        className="input-field"
                        value={month}
                        onChange={e => { setMonth(Number(e.target.value)); setLoading(true); }}
                        style={{ width: 130 }}
                    >
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                                {new Date(0, i).toLocaleString('default', { month: 'long' })}
                            </option>
                        ))}
                    </select>
                    <input
                        type="number"
                        className="input-field"
                        value={year}
                        onChange={e => { setYear(Number(e.target.value)); setLoading(true); }}
                        style={{ width: 100 }}
                    />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="metric-card">
                    <div className="metric-icon" style={{ background: '#d1fae5', color: '#10b981' }}>
                        <CreditCard size={20} />
                    </div>
                    <div>
                        <p className="metric-value">৳{totalPaid.toLocaleString()}</p>
                        <p className="metric-label">Total Paid (This Month)</p>
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon" style={{ background: '#e0f2fe', color: '#0ea5e9' }}>
                        <Calendar size={20} />
                    </div>
                    <div>
                        <p className="metric-value">{payments.length}</p>
                        <p className="metric-label">Transactions</p>
                    </div>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'auto' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Method</th>
                            <th>Reference</th>
                            <th>Added By</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? [...Array(5)].map((_, i) => (
                            <tr key={i}>{[...Array(5)].map((_, j) => <td key={j}><div className="skeleton" style={{ height: 36 }} /></td>)}</tr>
                        )) : payments.length === 0 ? (
                            <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No payment records found for this period.</td></tr>
                        ) : payments.map((p, i) => (
                            <motion.tr key={p._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                                <td>{new Date(p.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                <td style={{ fontWeight: 600 }}>৳{p.amount.toLocaleString()}</td>
                                <td><span className="badge badge-info">{p.method}</span></td>
                                <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{p.reference || '—'}</td>
                                <td style={{ fontSize: '0.8125rem' }}>{p.addedBy?.name || 'System'}</td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
