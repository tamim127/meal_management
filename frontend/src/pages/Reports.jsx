import { useState, useEffect } from 'react';
import api from '../lib/api';
import { motion } from 'framer-motion';
import { FileText, Users, Receipt, CreditCard, AlertTriangle, UtensilsCrossed } from 'lucide-react';
import { toast } from 'sonner';

export default function Reports() {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [activeReport, setActiveReport] = useState('summary');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    const reports = [
        { key: 'summary', label: 'Monthly Summary', icon: FileText, endpoint: '/reports/monthly-summary' },
        { key: 'meals', label: 'Meal Summary', icon: UtensilsCrossed, endpoint: '/meals/summary' },
        { key: 'due', label: 'Due List', icon: AlertTriangle, endpoint: '/calculations/due-list' },
    ];

    useEffect(() => {
        setData(null);
        setLoading(true);
        const r = reports.find(r => r.key === activeReport);
        api.get(r.endpoint, { params: { month, year } })
            .then(res => setData(res.data))
            .catch(() => toast.error('Failed to load report'))
            .finally(() => setLoading(false));
    }, [activeReport, month, year]);

    return (
        <div>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Reports</h1>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <select className="input-field" style={{ width: 'auto' }} value={month} onChange={e => setMonth(Number(e.target.value))}>
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i} value={i + 1}>{new Date(2000, i).toLocaleString('default', { month: 'long' })}</option>
                        ))}
                    </select>
                    <select className="input-field" style={{ width: 'auto' }} value={year} onChange={e => setYear(Number(e.target.value))}>
                        {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                {reports.map(r => (
                    <button key={r.key} onClick={() => setActiveReport(r.key)} className={`btn ${activeReport === r.key ? 'btn-primary' : 'btn-secondary'}`}>
                        <r.icon size={16} /> {r.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 60, borderRadius: 'var(--radius)' }} />)}
                </div>
            ) : !data ? (
                <p style={{ color: 'var(--text-muted)' }}>No data</p>
            ) : activeReport === 'summary' ? (
                <SummaryReport data={data.data} />
            ) : activeReport === 'meals' ? (
                <MealReport data={data} />
            ) : (
                <DueReport data={data} />
            )}
        </div>
    );
}

function SummaryReport({ data }) {
    if (!data) return null;
    const info = [
        { label: 'Meal Rate', val: `৳${data.mealRate}` },
        { label: 'Total Expense', val: `৳${data.totalExpense?.toLocaleString()}` },
        { label: 'Total Meals', val: data.totalMeals },
        { label: 'Total Boarders', val: data.totalBoarders },
    ];

    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {info.map(i => (
                    <div key={i.label} className="card"><p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{i.label}</p><p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{i.val}</p></div>
                ))}
            </div>
            {data.statements?.length > 0 && (
                <div className="card" style={{ padding: 0, overflow: 'auto' }}>
                    <table className="data-table">
                        <thead><tr><th>Boarder</th><th>Meals</th><th>Meal Cost</th><th>Seat Rent</th><th>Total Bill</th><th>Paid</th><th>Due/Advance</th></tr></thead>
                        <tbody>
                            {data.statements.map((s, index) => (
                                <tr key={s.boarder?._id || index}>
                                    <td style={{ fontWeight: 500 }}>{s.boarder?.fullName}</td>
                                    <td>{s.totalMeals}</td>
                                    <td>৳{s.mealCost}</td>
                                    <td>৳{s.seatRent}</td>
                                    <td style={{ fontWeight: 600 }}>৳{s.totalBill}</td>
                                    <td>৳{s.totalPayment}</td>
                                    <td>{s.due > 0 ? <span style={{ color: 'var(--danger)', fontWeight: 600 }}>৳{s.due} Due</span> : <span style={{ color: 'var(--success)', fontWeight: 600 }}>৳{s.advance} Advance</span>}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function MealReport({ data }) {
    return (
        <div>
            <div className="card" style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Grand Total Meals: <strong>{data.grandTotal}</strong></p>
            </div>
            <div className="card" style={{ padding: 0, overflow: 'auto' }}>
                <table className="data-table">
                    <thead><tr><th>Boarder</th><th>Room</th><th>Breakfast</th><th>Lunch</th><th>Dinner</th><th>Total</th><th>Days</th></tr></thead>
                    <tbody>
                        {Array.isArray(data.data) && data.data.map((s, index) => (
                            <tr key={s.boarder_id || index}>
                                <td style={{ fontWeight: 500 }}>{s.boarderName}</td>
                                <td>{s.roomNumber || '—'}</td>
                                <td>{s.totalBreakfast}</td>
                                <td>{s.totalLunch}</td>
                                <td>{s.totalDinner}</td>
                                <td style={{ fontWeight: 700 }}>{s.totalMeals}</td>
                                <td>{s.daysPresent}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function DueReport({ data }) {
    return (
        <div>
            <div className="card" style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.875rem' }}>Total Outstanding Due: <strong style={{ color: 'var(--danger)' }}>৳{data.totalDue?.toLocaleString()}</strong></p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Meal Rate: ৳{data.mealRate}</p>
            </div>
            <div className="card" style={{ padding: 0, overflow: 'auto' }}>
                <table className="data-table">
                    <thead><tr><th>Boarder</th><th>Meals</th><th>Meal Cost</th><th>Seat Rent</th><th>Paid</th><th>Due</th></tr></thead>
                    <tbody>
                        {Array.isArray(data.data) && data.data.map((s, index) => (
                            <tr key={s.boarder?._id || index}>
                                <td style={{ fontWeight: 500 }}>{s.boarder?.fullName}</td>
                                <td>{s.totalMeals}</td>
                                <td>৳{s.mealCost}</td>
                                <td>৳{s.seatRent}</td>
                                <td>৳{s.totalPayment}</td>
                                <td style={{ color: 'var(--danger)', fontWeight: 700 }}>৳{s.due}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
