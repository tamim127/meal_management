import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { UserPlus, Building } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';

export default function SignUp() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [hostels, setHostels] = useState([]);
    const [form, setForm] = useState({ name: '', email: '', password: '', hostel_id: '' });
    const [loading, setLoading] = useState(false);
    const [fetchingHostels, setFetchingHostels] = useState(true);

    useEffect(() => {
        api.get('/hostels/public')
            .then(res => {
                setHostels(res.data.data);
                if (res.data.data.length > 0) {
                    setForm(prev => ({ ...prev, hostel_id: res.data.data[0]._id }));
                }
            })
            .catch(err => {
                toast.error('Failed to load hostels');
            })
            .finally(() => setFetchingHostels(false));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.hostel_id) {
            return toast.error('Please select a hostel');
        }
        setLoading(true);
        try {
            await register({ ...form, role: 'boarder' });
            toast.success('Registration successful! Please wait for admin approval.');
            navigate('/login');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="glass-card" style={{ padding: '2.5rem', width: '100%', maxWidth: 420, background: 'var(--bg-secondary)' }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg, #10b981, #3b82f6)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                        <UserPlus size={28} color="white" />
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Join a Hostel</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Create your boarder account</p>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="input-group" style={{ marginBottom: '0.875rem' }}>
                        <label>Full Name</label>
                        <input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="John Doe" required />
                    </div>
                    <div className="input-group" style={{ marginBottom: '0.875rem' }}>
                        <label>Email</label>
                        <input className="input-field" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" required />
                    </div>
                    <div className="input-group" style={{ marginBottom: '0.875rem' }}>
                        <label>Select Hostel</label>
                        <select className="input-field" value={form.hostel_id} onChange={e => setForm({ ...form, hostel_id: e.target.value })} required>
                            {fetchingHostels ? (
                                <option>Loading hostels...</option>
                            ) : hostels.length === 0 ? (
                                <option disabled>No hostels available</option>
                            ) : (
                                hostels.map(h => (
                                    <option key={h._id} value={h._id}>{h.name}</option>
                                ))
                            )}
                        </select>
                    </div>
                    <div className="input-group" style={{ marginBottom: '1.25rem' }}>
                        <label>Password</label>
                        <input className="input-field" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min 6 characters" required minLength={6} />
                    </div>
                    <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', background: '#10b981', borderColor: '#10b981' }} disabled={loading || fetchingHostels}>
                        {loading ? 'Processing...' : 'Sign Up'}
                    </button>
                </form>
                <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        Already have an account? <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
                    </p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        Want to register your hostel? <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Click Here</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}

