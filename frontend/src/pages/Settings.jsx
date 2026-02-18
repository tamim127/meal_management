import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

export default function Settings() {
    const { user } = useAuth();
    const [hostel, setHostel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user?.hostel_id) {
            const id = typeof user.hostel_id === 'object' ? user.hostel_id._id : user.hostel_id;
            api.get(`/hostels/${id}`)
                .then(res => setHostel(res.data.data))
                .catch(() => toast.error('Failed to load settings'))
                .finally(() => setLoading(false));
        } else { setLoading(false); }
    }, [user]);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const id = typeof user.hostel_id === 'object' ? user.hostel_id._id : user.hostel_id;
            await api.put(`/hostels/${id}`, hostel);
            toast.success('Settings saved');
        } catch (e) { toast.error('Failed to save'); }
        finally { setSaving(false); }
    };

    if (loading) return <div className="skeleton" style={{ height: 200, borderRadius: 'var(--radius)' }} />;
    if (!hostel) return <p style={{ color: 'var(--text-muted)' }}>No hostel assigned</p>;

    return (
        <div>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Hostel Settings</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Manage your hostel configuration</p>
            </div>
            <form onSubmit={handleSave}>
                <div className="card" style={{ maxWidth: 600 }}>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div className="input-group"><label>Hostel Name</label><input className="input-field" value={hostel.name || ''} onChange={e => setHostel({ ...hostel, name: e.target.value })} /></div>
                        <div className="input-group"><label>Address</label><input className="input-field" value={hostel.address || ''} onChange={e => setHostel({ ...hostel, address: e.target.value })} /></div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="input-group"><label>Total Seats</label><input className="input-field" type="number" value={hostel.totalSeats || 0} onChange={e => setHostel({ ...hostel, totalSeats: Number(e.target.value) })} /></div>
                            <div className="input-group"><label>Monthly Rent (Default)</label><input className="input-field" type="number" value={hostel.monthlyRent || 0} onChange={e => setHostel({ ...hostel, monthlyRent: Number(e.target.value) })} /></div>
                        </div>
                        <div className="input-group"><label>Currency</label><input className="input-field" value={hostel.currency || 'BDT'} onChange={e => setHostel({ ...hostel, currency: e.target.value })} /></div>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ marginTop: '1.25rem' }} disabled={saving}>
                        <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </form>
        </div>
    );
}
