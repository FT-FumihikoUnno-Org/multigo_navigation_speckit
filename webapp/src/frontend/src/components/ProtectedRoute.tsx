import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next'; // Import useTranslation

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const { t } = useTranslation(); // Initialize useTranslation

  if (loading) {
    return <Typography>{t('loadingAuthentication')}</Typography>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
