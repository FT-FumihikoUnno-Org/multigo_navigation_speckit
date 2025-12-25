import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './components/ProtectedRoute';
import RoleBasedGuard from './components/RoleBasedGuard'; // Import RoleBasedGuard
import Navbar from './components/Navbar'; // Mount Navbar
import { Typography } from '@mui/material'; // For Forbidden page
import { useTranslation } from 'react-i18next'; // Import useTranslation

// Placeholder for AdminPage
const AdminPage: React.FC = () => {
  const { t } = useTranslation();
  return <Typography variant="h4">{t('userManagementPage')} ({t('protected')})</Typography>;
};

const ForbiddenPage: React.FC = () => {
  const { t } = useTranslation();
  return <Typography variant="h4">{t('forbidden')}</Typography>;
};

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forbidden" element={<ForbiddenPage />} /> {/* Add Forbidden Page */}
        <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        {/* Protected Admin Route */}
        <Route path="/admin/users" element={
          <ProtectedRoute>
            <RoleBasedGuard requiredRole="Administrator">
              <AdminPage /> {/* Placeholder for UserManagementPage */}
            </RoleBasedGuard>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;