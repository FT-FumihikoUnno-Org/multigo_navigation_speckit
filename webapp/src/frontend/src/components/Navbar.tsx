import React from 'react';
import { AppBar, Toolbar, Typography, Button, ButtonGroup } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { t, i18n } = useTranslation(); // Initialize useTranslation and i18n instance

  const setLang = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Multi-Go App
        </Typography>
        {isAuthenticated && (
          <>
            <Button color="inherit" component={Link} to="/dashboard">
              {t('dashboard')}
            </Button>
            {user?.role === 'Administrator' && (
              <Button color="inherit" component={Link} to="/admin/users">
                {t('userManagement')}
              </Button>
            )}
            <Button color="inherit" onClick={logout}>
              {t('logout')} ({user?.display_name})
            </Button>
          </>
        )}
        {!isAuthenticated && (
          <Button color="inherit" component={Link} to="/login">
            {t('login')}
          </Button>
        )}

        {/* Always-visible language buttons */}
        <ButtonGroup variant="text" color="inherit" sx={{ ml: 2 }}>
          <Button onClick={() => setLang('en')}>EN</Button>
          <Button onClick={() => setLang('ja')}>JA</Button>
          <Button onClick={() => setLang('zh')}>ZH</Button>
        </ButtonGroup>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
