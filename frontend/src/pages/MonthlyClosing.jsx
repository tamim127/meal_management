import { useState } from 'react';
import api from '../lib/api';
import { motion } from 'framer-motion';
import { Lock, Unlock, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function MonthlyClosing() {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [locking, setLocking] = useState(false);

    const fetchClosing = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/monthly-closing/${month}/${year}`);
            setData(res.data);
        } catch (e) { toast.error('Failed to load'); }
        finally { setLoading(false); }
    };

    const handleLock = async () => {
        if (!confirm(`Lock ${new Date(2000, month - 1).toLocaleString('default', { month: 'long' })} ${year}? This will freeze all data.`)) return;
        setLocking(true);
        try {
            await api.post('/monthly-closing/lock', { month, year });
            toast.success('Month locked!');
            fetchClosing();
        } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
        finally { setLocking(false); }
    };

    const handleUnlock = async () => {
        if (!confirm('Unlock this month? Data can be modified again.')) return;
        setLocking(true);
        try {
            await api.post('/monthly-closing/unlock', { month, year });
            toast.success('Month unlocked');
            fetchClosing();
        } catch (e) { toast.error('Failed'); }
        finally { setLocking(false); }
    };

    return (
        <div>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Monthly Closing</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Lock months to freeze data and generate final statements</p>
            </div>

            <div className="card" style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div className="input-group">
                        <label>Month</label>
                        <select className="input-field" value={month} onChange={e => setMonth(Number(e.target.value))}>
                            {Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{new Date(2000, i).toLocaleString('default', { month: 'long' })}</option>)}
                        </select>
                    </div>
                    <div className="input-group">
                        <label>Year</label>
                        <select className="input-field" value={year} onChange={e => setYear(Number(e.target.value))}>
                            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <button onClick={fetchClosing} className="btn btn-primary" disabled={loading}><FileText size={16} /> {loading ? 'Loading...' : 'Load Data'}</button>
                </div>
            </div>

            {data && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="card" style={{ marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                                <span className={`badge ${data.isLocked ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }}>
                                    {data.isLocked ? '🔒 Locked' : '🔓 Open'}
                                </span>
                                {data.data?.mealRate !== undefined && (
                                    <div style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                                        <div><p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Meal Rate</p><p style={{ fontSize: '1.25rem', fontWeight: 700 }}>৳{data.data.mealRate}</p></div>
                                        <div><p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Expense</p><p style={{ fontSize: '1.25rem', fontWeight: 700 }}>৳{(data.data.totalExpense || 0).toLocaleString()}</p></div>
                                        <div><p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Meals</p><p style={{ fontSize: '1.25rem', fontWeight: 700 }}>{data.data.totalMeals || 0}</p></div>
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {data.isLocked ? (
                                    <button onClick={handleUnlock} className="btn btn-secondary" disabled={locking}><Unlock size={16} /> Unlock</button>
                                ) : (
                                    <button onClick={handleLock} className="btn btn-danger" disabled={locking}><Lock size={16} /> {locking ? 'Locking...' : 'Lock Month'}</button>
                                )}
                            </div>
                        </div>
                    </div>

                    {(data.data?.boarderStatements || data.data?.statements) && (
                        <div className="card" style={{ padding: 0, overflow: 'auto' }}>
                            <table className="data-table">
                                <thead><tr><th>Boarder</th><th>Meals</th><th>Meal Cost</th><th>Seat Rent</th><th>Paid</th><th>Due</th><th>Advance</th></tr></thead>
                                <tbody>
                                    {(data.data.boarderStatements || data.data.statements || []).map((s, i) => (
                                        <tr key={i}>
                                            <td style={{ fontWeight: 500 }}>{s.boarderName || s.boarder?.fullName}</td>
                                            <td>{s.totalMeals}</td>
                                            <td>৳{s.mealCost}</td>
                                            <td>৳{s.seatRent}</td>
                                            <td>৳{s.totalPayment}</td>
                                            <td style={{ color: s.due > 0 ? 'var(--danger)' : 'inherit', fontWeight: s.due > 0 ? 600 : 400 }}>{s.due > 0 ? `৳${s.due}` : '—'}</td>
                                            <td style={{ color: s.advance > 0 ? 'var(--success)' : 'inherit', fontWeight: s.advance > 0 ? 600 : 400 }}>{s.advance > 0 ? `৳${s.advance}` : '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
}
