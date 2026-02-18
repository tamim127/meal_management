import { useState, useEffect } from 'react';
import api from '../lib/api';
import { motion } from 'framer-motion';
import { Calendar, Check, Minus } from 'lucide-react';
import { toast } from 'sonner';

export default function Meals() {
    const [boarders, setBoarders] = useState([]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [meals, setMeals] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        Promise.all([
            api.get('/boarders', { params: { limit: 100, status: 'active' } }),
            api.get('/meals', { params: { date } })
        ]).then(([boarderRes, mealRes]) => {
            setBoarders(boarderRes.data.data);
            const mealMap = {};
            mealRes.data.data.forEach(m => {
                mealMap[m.boarder_id?._id || m.boarder_id] = { _id: m._id, breakfast: m.breakfast, lunch: m.lunch, dinner: m.dinner, isOff: m.isOff };
            });
            setMeals(mealMap);
        }).catch(() => toast.error('Failed to load data'))
            .finally(() => setLoading(false));
    }, [date]);

    const toggleMeal = (boarderId, type) => {
        setMeals(prev => {
            const current = prev[boarderId] || { breakfast: 0, lunch: 0, dinner: 0, isOff: false };
            if (current.isOff) return prev;
            const val = current[type];
            const next = val === 0 ? 1 : val === 1 ? 0.5 : 0;
            return { ...prev, [boarderId]: { ...current, [type]: next } };
        });
    };

    const toggleOff = (boarderId) => {
        setMeals(prev => {
            const current = prev[boarderId] || { breakfast: 0, lunch: 0, dinner: 0, isOff: false };
            return { ...prev, [boarderId]: { ...current, isOff: !current.isOff, breakfast: 0, lunch: 0, dinner: 0 } };
        });
    };

    const selectAll = (type) => {
        setMeals(prev => {
            const updated = { ...prev };
            boarders.forEach(b => {
                const current = updated[b._id] || { breakfast: 0, lunch: 0, dinner: 0, isOff: false };
                if (!current.isOff) updated[b._id] = { ...current, [type]: current[type] === 1 ? 0 : 1 };
            });
            return updated;
        });
    };

    const saveMeals = async () => {
        setSaving(true);
        try {
            const entries = boarders.map(b => ({
                boarder_id: b._id,
                ...(meals[b._id] || { breakfast: 0, lunch: 0, dinner: 0, isOff: false }),
            }));
            await api.post('/meals/bulk', { date, entries });
            toast.success('Meals saved successfully!');
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
        finally { setSaving(false); }
    };

    const getMealDisplay = (val) => {
        if (val === 1) return { label: '1', cls: 'active' };
        if (val === 0.5) return { label: '½', cls: 'half' };
        return { label: '0', cls: '' };
    };

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Daily Meal Entry</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Tap cells to toggle: 0 → 1 → ½ → 0</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <Calendar size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input type="date" className="input-field" style={{ paddingLeft: 32, width: 170 }} value={date} onChange={e => { setDate(e.target.value); setLoading(true); }} />
                    </div>
                    <button onClick={saveMeals} className="btn btn-primary" disabled={saving}>
                        {saving ? 'Saving...' : 'Save All'}
                    </button>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'auto' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Boarder</th>
                            <th>Room</th>
                            <th style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => selectAll('breakfast')}>Breakfast</th>
                            <th style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => selectAll('lunch')}>Lunch</th>
                            <th style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => selectAll('dinner')}>Dinner</th>
                            <th style={{ textAlign: 'center' }}>Total</th>
                            <th style={{ textAlign: 'center' }}>Off</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? [...Array(5)].map((_, i) => (
                            <tr key={i}>{[...Array(7)].map((_, j) => <td key={j}><div className="skeleton" style={{ height: 36 }} /></td>)}</tr>
                        )) : boarders.length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No active boarders. Add boarders first.</td></tr>
                        ) : boarders.map((b, i) => {
                            const m = meals[b._id] || { breakfast: 0, lunch: 0, dinner: 0, isOff: false };
                            const total = m.isOff ? 0 : (m.breakfast || 0) + (m.lunch || 0) + (m.dinner || 0);
                            return (
                                <motion.tr key={b._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} style={{ opacity: m.isOff ? 0.5 : 1 }}>
                                    <td style={{ fontWeight: 500 }}>{b.fullName}</td>
                                    <td>{b.roomNumber || '—'}</td>
                                    {['breakfast', 'lunch', 'dinner'].map(type => {
                                        const d = getMealDisplay(m[type]);
                                        return (
                                            <td key={type} style={{ textAlign: 'center' }}>
                                                <div className={`meal-checkbox ${d.cls}`} onClick={() => toggleMeal(b._id, type)} style={{ margin: '0 auto' }}>
                                                    {d.label}
                                                </div>
                                            </td>
                                        );
                                    })}
                                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{total}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div className={`meal-checkbox ${m.isOff ? 'active' : ''}`} onClick={() => toggleOff(b._id)} style={{ margin: '0 auto', background: m.isOff ? 'var(--danger)' : undefined, borderColor: m.isOff ? 'var(--danger)' : undefined }}>
                                            {m.isOff ? <Minus size={14} /> : '—'}
                                        </div>
                                    </td>
                                </motion.tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
