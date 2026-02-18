import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { motion } from 'framer-motion';
import { Building2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/auth/forgot-password', { email });
            setSent(true);
            toast.success('Reset email sent!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: '2.5rem', width: '100%', maxWidth: 420, background: 'var(--bg-secondary)' }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                        <Building2 size={28} color="white" />
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{sent ? 'Check Your Email' : 'Forgot Password'}</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        {sent ? 'We sent a password reset link to your email' : 'Enter your email to reset your password'}
                    </p>
                </div>
                {!sent ? (
                    <form onSubmit={handleSubmit}>
                        <div className="input-group" style={{ marginBottom: '1.25rem' }}>
                            <label>Email Address</label>
                            <input className="input-field" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required />
                        </div>
                        <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </form>
                ) : null}
                <p style={{ textAlign: 'center', marginTop: '1.25rem' }}>
                    <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <ArrowLeft size={14} /> Back to Login
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
