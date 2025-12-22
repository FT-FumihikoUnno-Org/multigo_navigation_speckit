import React from 'react';
import { Button, Container, Typography, Box } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // Import useTranslation

const LoginPage: React.FC = () => {
  const { isAuthenticated, login, loading } = useAuth();
  const { t } = useTranslation(); // Initialize useTranslation

  if (loading) {
    return <Typography>{t('loading')}</Typography>;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          {t('login')}
        </Typography>
        <Box sx={{ mt: 1 }}>
          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            onClick={login}
          >
            {t('loginWithOpenID')}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default LoginPage;
