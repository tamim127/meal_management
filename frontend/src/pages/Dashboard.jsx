import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { motion } from 'framer-motion';
import { Users, UtensilsCrossed, Receipt, TrendingUp, AlertCircle, Percent } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#64748b'];

export default function Dashboard() {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const now = new Date();
    const [month] = useState(now.getMonth() + 1);
    const [year] = useState(now.getFullYear());

    useEffect(() => {
        if (user?.approvalStatus === 'pending') {
            setLoading(false);
            return;
        }
        const endpoint = user?.role === 'boarder' ? '/reports/boarder-dashboard' : '/reports/dashboard';
        api.get(endpoint, { params: { month, year } })
            .then(res => setData(res.data.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [month, year, user]);

    if (loading) return <DashboardSkeleton />;

    if (user?.approvalStatus === 'pending') return <PendingDashboard user={user} />;

    if (!data) return <p style={{ color: 'var(--text-secondary)' }}>No data available. Start by adding boarders and meals.</p>;

    if (user?.role === 'boarder') return <BoarderDashboard data={data} />;

    const metrics = [
        { label: 'Total Boarders', value: data.totalBoarders || 0, icon: Users, color: '#6366f1', bg: '#eef2ff' },
        { label: 'Total Meals', value: data.totalMeals || 0, icon: UtensilsCrossed, color: '#8b5cf6', bg: '#f3e8ff' },
        { label: 'Total Expense', value: `৳${(data.totalExpense || 0).toLocaleString()}`, icon: Receipt, color: '#ec4899', bg: '#fce7f3' },
        { label: 'Meal Rate', value: `৳${data.mealRate || 0}`, icon: TrendingUp, color: '#10b981', bg: '#d1fae5' },
        { label: 'Total Due', value: `৳${(data.totalDue || 0).toLocaleString()}`, icon: AlertCircle, color: '#f59e0b', bg: '#fef3c7' },
        { label: 'Collection Rate', value: `${data.collectionRate || 0}%`, icon: Percent, color: '#0ea5e9', bg: '#e0f2fe' },
    ];

    return (
        <div>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Dashboard</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    Overview for {new Date(year, month - 1).toLocaleString('default', { month: 'long' })} {year}
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                {metrics.map((m, i) => (
                    <motion.div key={m.label} className="metric-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                        <div className="metric-icon" style={{ background: m.bg, color: m.color }}>
                            <m.icon size={22} />
                        </div>
                        <div>
                            <p className="metric-value" style={{ color: m.color }}>{m.value}</p>
                            <p className="metric-label">{m.label}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1rem' }}>
                <div className="card">
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem' }}>Quick Summary</h3>
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                        {[
                            { label: 'Total Payment Received', val: `৳${(data.totalPayment || 0).toLocaleString()}` },
                            { label: 'Meal Rate (per meal)', val: `৳${data.mealRate || 0}` },
                            { label: 'Outstanding Due', val: `৳${(data.totalDue || 0).toLocaleString()}` },
                        ].map(item => (
                            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{item.label}</span>
                                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.val}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function BoarderDashboard({ data }) {
    const metrics = [
        { label: 'My Meals', value: data.totalMeals || 0, icon: UtensilsCrossed, color: '#6366f1', bg: '#eef2ff' },
        { label: 'Meal Cost', value: `৳${data.mealCost || 0}`, icon: Receipt, color: '#8b5cf6', bg: '#f3e8ff' },
        { label: 'Seat Rent', value: `৳${data.seatRent || 0}`, icon: TrendingUp, color: '#ec4899', bg: '#fce7f3' },
        { label: data.due > 0 ? 'Due' : 'Advance', value: `৳${data.due || data.advance || 0}`, icon: AlertCircle, color: data.due > 0 ? '#f59e0b' : '#10b981', bg: data.due > 0 ? '#fef3c7' : '#d1fae5' },
    ];

    return (
        <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>My Dashboard</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                {metrics.map((m, i) => (
                    <motion.div key={m.label} className="metric-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                        <div className="metric-icon" style={{ background: m.bg, color: m.color }}><m.icon size={22} /></div>
                        <div>
                            <p className="metric-value" style={{ color: m.color }}>{m.value}</p>
                            <p className="metric-label">{m.label}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
            {data.recentPayments?.length > 0 && (
                <div className="card">
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem' }}>Recent Payments</h3>
                    <table className="data-table">
                        <thead><tr><th>Date</th><th>Amount</th><th>Method</th></tr></thead>
                        <tbody>
                            {data.recentPayments.map(p => (
                                <tr key={p._id}>
                                    <td>{new Date(p.date).toLocaleDateString()}</td>
                                    <td>৳{p.amount}</td>
                                    <td><span className="badge badge-info">{p.method}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function PendingDashboard({ user }) {
    return (
        <div style={{ maxWidth: 600, margin: '2rem auto', textAlign: 'center' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card" style={{ padding: '3rem 2rem' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fef3c7', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                    <AlertCircle size={32} />
                </div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>Approval Pending</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
                    Hello <strong>{user.name}</strong>, your account has been registered successfully.
                    An administrator needs to approve your account before you can access meals, payments, and reports.
                </p>
                <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius)', textAlign: 'left', marginBottom: '1.5rem' }}>
                    <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}><strong>Status:</strong> <span className="badge badge-warning">Pending Approval</span></p>
                    <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}><strong>Email:</strong> {user.email}</p>
                    <p style={{ fontSize: '0.875rem' }}><strong>Joined:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Please check back later or contact your hostel manager.
                </p>
            </motion.div>
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div>
            <div className="skeleton" style={{ width: 200, height: 28, marginBottom: '0.5rem' }} />
            <div className="skeleton" style={{ width: 300, height: 16, marginBottom: '1.5rem' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 'var(--radius)' }} />)}
            </div>
        </div>
    );
}

