import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'sonner';

import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Boarders from './pages/Boarders';
import Meals from './pages/Meals';
import Expenses from './pages/Expenses';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import MonthlyClosing from './pages/MonthlyClosing';
import Settings from './pages/Settings';
import MyMeals from './pages/MyMeals';
import MyPayments from './pages/MyPayments';
import SignUp from './pages/SignUp';
import PendingUsers from './pages/PendingUsers';

function ProtectedRoute({ allowedRoles, requireApproved = true }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><div className="skeleton" style={{ width: 60, height: 60, borderRadius: '50%' }} /></div>;
  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;

  // If route requires approval but user is pending, they can only go to dashboard/settings
  if (requireApproved && user.approvalStatus !== 'approved') return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}

function PublicRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
            </Route>

            {/* Dashboard & Settings (Available to Pending users) */}
            <Route element={<ProtectedRoute requireApproved={false} />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>

            {/* Boarder specific (Approved Only) */}
            <Route element={<ProtectedRoute allowedRoles={['boarder']} />}>
              <Route element={<AppLayout />}>
                <Route path="/my-meals" element={<MyMeals />} />
                <Route path="/my-payments" element={<MyPayments />} />
              </Route>
            </Route>

            {/* Admin Management (Approvals) */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route element={<AppLayout />}>
                <Route path="/pending-users" element={<PendingUsers />} />
              </Route>
            </Route>

            {/* Admin/Manager core routes (Approved Only) */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'manager']} />}>
              <Route element={<AppLayout />}>
                <Route path="/boarders" element={<Boarders />} />
                <Route path="/meals" element={<Meals />} />
                <Route path="/expenses" element={<Expenses />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/monthly-closing" element={<MonthlyClosing />} />
              </Route>
            </Route>

            {/* Catch all */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </ThemeProvider>
  );
}
