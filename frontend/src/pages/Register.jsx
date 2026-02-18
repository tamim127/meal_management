import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Building2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', password: '', hostelName: '', hostelAddress: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await register({ ...form, role: 'admin' });
            toast.success('Account created successfully!');
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="glass-card" style={{ padding: '2.5rem', width: '100%', maxWidth: 460, background: 'var(--bg-secondary)' }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                        <Building2 size={28} color="white" />
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Create Your Hostel</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Setup your hostel management account</p>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="input-group" style={{ marginBottom: '0.875rem' }}>
                        <label>Your Name</label>
                        <input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="John Doe" required />
                    </div>
                    <div className="input-group" style={{ marginBottom: '0.875rem' }}>
                        <label>Email</label>
                        <input className="input-field" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="admin@hostel.com" required />
                    </div>
                    <div className="input-group" style={{ marginBottom: '0.875rem' }}>
                        <label>Password</label>
                        <input className="input-field" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min 6 characters" required minLength={6} />
                    </div>
                    <div className="input-group" style={{ marginBottom: '0.875rem' }}>
                        <label>Hostel Name</label>
                        <input className="input-field" value={form.hostelName} onChange={e => setForm({ ...form, hostelName: e.target.value })} placeholder="Sunrise Hostel" required />
                    </div>
                    <div className="input-group" style={{ marginBottom: '1.25rem' }}>
                        <label>Address (Optional)</label>
                        <input className="input-field" value={form.hostelAddress} onChange={e => setForm({ ...form, hostelAddress: e.target.value })} placeholder="123 Main St" />
                    </div>
                    <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                        {loading ? 'Creating...' : 'Create Account & Hostel'}
                    </button>
                </form>
                <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Want to join an existing hostel? <Link to="/signup" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Sign Up here</Link>
                </p>
            </motion.div>
        </div>
    );
}
