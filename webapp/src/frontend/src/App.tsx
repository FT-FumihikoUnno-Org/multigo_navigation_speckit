import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from './context/AuthContext';
import { Role } from './context/AuthContext';
import Layout from './components/Layout';
import Button from '@mui/material/Button'; // Import Button
import UserManagementPage from './pages/UserManagementPage'; // Import UserManagementPage
import './App.css';

// Placeholder components
function DashboardPage() {
  const { t } = useTranslation();
  return <h2>{t('dashboard_title')}</h2>;
}

function LoginPage() {
  const { t } = useTranslation();
  const { isAuthenticated, login } = useAuth(); // Get login function from context
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      // Navigate to the intended page or dashboard
      const state = location.state as { from?: { pathname: string } }; // Type assertion for state
      navigate(state?.from?.pathname || '/');
    }
  }, [isAuthenticated, navigate, location.state]); // Add location.state to dependency array

  if (isAuthenticated) {
    // Optionally show a loading indicator or redirect immediately
    return null;
  }

  return (
    <div>
      <h2>{t('login_page_title')}</h2>
      <p>{t('login_description')}</p>
      <Button variant="contained" color="primary" onClick={login}>
        {t('login_button')}
      </Button>
    </div>
  );
}

// Enhanced ProtectedRoute component using AuthContext
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const { t } = useTranslation();
  const { user, isAuthenticated, isLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      navigate('/login', { state: { from: location }, replace: true });
    } else if (allowedRoles && allowedRoles.length > 0) {
      const userRoles = user?.roles.map((role: Role) => role.name) || [];
      const hasRequiredRole = allowedRoles.some(requiredRole => userRoles.includes(requiredRole));
      if (!hasRequiredRole) {
        // Redirect to dashboard or a forbidden page if role is not met
        navigate('/');
      }
    }
  }, [isAuthenticated, isLoading, navigate, location.state, user, allowedRoles, isAdmin]); // Add location.state to dependency array

  if (isLoading) {
    return <div>{t('loading')}</div>;
  }

  if (isAuthenticated && (!allowedRoles || (user?.roles.some((role: Role) => allowedRoles.includes(role.name))))) {
    return <>{children}</>;
  }

  return null;
}

function App() {
  const { t } = useTranslation();
  const { user, isAuthenticated, isLoading, isAdmin } = useAuth();

  return (
    <Layout> {/* Use the Layout component */}
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}
        />
        <Route
          path="/user-management"
          element={<ProtectedRoute allowedRoles={['Administrator']}><UserManagementPage /></ProtectedRoute>} {/* Render UserManagementPage */}
        />
        {/* Add other routes here */}
      </Routes>
    </Layout>
  );
}

export default App;
