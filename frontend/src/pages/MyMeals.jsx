import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { motion } from 'framer-motion';
import { Calendar, UtensilsCrossed } from 'lucide-react';
import { toast } from 'sonner';

export default function MyMeals() {
    const { user } = useAuth();
    const [meals, setMeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [summary, setSummary] = useState({ totalMeals: 0, totalDays: 0 });

    useEffect(() => {
        if (!user?.boarder_id) {
            setLoading(false);
            return;
        }

        api.get(`/meals/boarder/${user.boarder_id}`, { params: { month, year } })
            .then(res => {
                setMeals(res.data.data);
                setSummary(res.data.summary);
            })
            .catch(() => toast.error('Failed to load meals'))
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
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>My Meals</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>View your meal history for the selected month</p>
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
                    <div className="metric-icon" style={{ background: '#eef2ff', color: '#6366f1' }}>
                        <UtensilsCrossed size={20} />
                    </div>
                    <div>
                        <p className="metric-value">{summary.totalMeals}</p>
                        <p className="metric-label">Total Meals</p>
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon" style={{ background: '#f3e8ff', color: '#8b5cf6' }}>
                        <Calendar size={20} />
                    </div>
                    <div>
                        <p className="metric-value">{summary.totalDays}</p>
                        <p className="metric-label">Days Recorded</p>
                    </div>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'auto' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th style={{ textAlign: 'center' }}>Breakfast</th>
                            <th style={{ textAlign: 'center' }}>Lunch</th>
                            <th style={{ textAlign: 'center' }}>Dinner</th>
                            <th style={{ textAlign: 'center' }}>Total</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? [...Array(5)].map((_, i) => (
                            <tr key={i}>{[...Array(6)].map((_, j) => <td key={j}><div className="skeleton" style={{ height: 36 }} /></td>)}</tr>
                        )) : meals.length === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No meal records found for this period.</td></tr>
                        ) : meals.map((m, i) => (
                            <motion.tr key={m._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                                <td>{new Date(m.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                                <td style={{ textAlign: 'center' }}>{m.breakfast || 0}</td>
                                <td style={{ textAlign: 'center' }}>{m.lunch || 0}</td>
                                <td style={{ textAlign: 'center' }}>{m.dinner || 0}</td>
                                <td style={{ textAlign: 'center', fontWeight: 600 }}>{m.totalMeals}</td>
                                <td>
                                    {m.isOff ? (
                                        <span className="badge badge-warning">Off</span>
                                    ) : (
                                        <span className="badge badge-success">On</span>
                                    )}
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
