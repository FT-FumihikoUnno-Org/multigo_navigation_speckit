import React from 'react';
import { Typography, Container } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next'; // Import useTranslation

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation(); // Initialize useTranslation

  return (
    <Container component="main" maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom>
        {t('welcomeToDashboard', { name: user?.display_name || '' })}
      </Typography>
      <Typography variant="body1">
        {t('yourRole', { role: user?.role || 'N/A' })}
      </Typography>
      {/* More dashboard content will go here */}
    </Container>
  );
};

export default DashboardPage;
