import React from 'react';
import { AppBar, Toolbar, Typography, Button, Select, MenuItem, SelectChangeEvent } from '@mui/material'; // Import SelectChangeEvent
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { t, i18n } = useTranslation(); // Initialize useTranslation and i18n instance

  const changeLanguage = (event: SelectChangeEvent) => { // Use SelectChangeEvent
    i18n.changeLanguage(event.target.value);
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
        <Select
          value={i18n.language}
          onChange={changeLanguage}
          sx={{ color: 'white', '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.5)' } }}
        >
          <MenuItem value="en">EN</MenuItem>
          <MenuItem value="ja">JA</MenuItem>
          <MenuItem value="zh">ZH</MenuItem>
        </Select>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
