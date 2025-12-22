import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next'; // Import useTranslation

interface RoleBasedGuardProps {
  children: React.ReactNode;
  requiredRole: string;
}

const RoleBasedGuard: React.FC<RoleBasedGuardProps> = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();
  const { t } = useTranslation(); // Initialize useTranslation

  if (loading) {
    return <Typography>{t('loading')}</Typography>;
  }

  if (!user || user.role !== requiredRole) {
    // Optionally redirect to a forbidden page or just render nothing/an error message
    return <Navigate to="/forbidden" replace />; // Assuming a /forbidden route exists
  }

  return <>{children}</>;
};

export default RoleBasedGuard;
