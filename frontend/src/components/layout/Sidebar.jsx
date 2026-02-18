import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import {
    LayoutDashboard, Users, UtensilsCrossed, Receipt, CreditCard,
    BarChart3, Lock, Settings, LogOut, X, Building2, Clock
} from 'lucide-react';

const adminLinks = [
    {
        section: 'Overview', links: [
            { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        ]
    },
    {
        section: 'Management', links: [
            { to: '/pending-users', label: 'Pending Approvals', icon: Clock },
            { to: '/boarders', label: 'Boarders', icon: Users },
            { to: '/meals', label: 'Meal Entry', icon: UtensilsCrossed },
            { to: '/expenses', label: 'Expenses', icon: Receipt },
            { to: '/payments', label: 'Payments', icon: CreditCard },
        ]
    },
    {
        section: 'Reports', links: [
            { to: '/reports', label: 'Reports', icon: BarChart3 },
            { to: '/monthly-closing', label: 'Monthly Closing', icon: Lock },
        ]
    },
    {
        section: 'Settings', links: [
            { to: '/settings', label: 'Hostel Settings', icon: Settings },
        ]
    },
];

const boarderLinks = [
    {
        section: 'Overview', links: [
            { to: '/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
            { to: '/my-meals', label: 'My Meals', icon: UtensilsCrossed },
            { to: '/my-payments', label: 'My Payments', icon: CreditCard },
        ]
    },
];

export default function Sidebar({ isOpen, onClose }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Filter links based on role and approval status
    let links = user?.role === 'boarder' ? boarderLinks : adminLinks;

    if (user?.approvalStatus === 'pending') {
        // Pending users ONLY get dashboard
        links = [
            {
                section: 'Overview', links: [
                    { to: '/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
                ]
            }
        ];
    }

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <>
            {isOpen && <div className="fixed inset-0 bg-black/30 z-30 md:hidden" onClick={onClose} />}
            <motion.aside
                className={`sidebar ${isOpen ? 'open' : ''}`}
                initial={false}
            >
                <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, var(--accent), #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Building2 size={20} color="white" />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, lineHeight: 1.2 }}>HostelMeals</h2>
                            <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{user?.role?.toUpperCase()}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="md:hidden" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <X size={20} />
                    </button>
                </div>

                <nav style={{ padding: '0.75rem 0', flex: 1 }}>
                    {links.map((section) => (
                        <div key={section.section}>
                            <p className="sidebar-section-title">{section.section}</p>
                            {section.links.map((link) => (
                                <NavLink
                                    key={link.to}
                                    to={link.to}
                                    className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                                    onClick={onClose}
                                >
                                    <link.icon size={18} />
                                    {link.label}
                                </NavLink>
                            ))}
                        </div>
                    ))}
                </nav>

                <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.75rem' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.75rem', fontWeight: 700 }}>
                            {user?.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                            <p style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{user?.name}</p>
                            <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{user?.email}</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </motion.aside>
        </>
    );
}
