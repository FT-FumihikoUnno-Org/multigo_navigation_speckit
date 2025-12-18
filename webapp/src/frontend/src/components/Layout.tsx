import React, { ReactNode } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Role } from '../context/AuthContext';
import { AppBar, Toolbar, Typography, Button, IconButton, Drawer, List, ListItem, ListItemButton, ListItemText, Box, Divider, Menu, MenuItem, CssBaseline } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircle from '@mui/icons-material/AccountCircle';
import './Layout.css'; // Assume a CSS file for layout styling

interface LayoutProps {
  children?: ReactNode;
}

// Placeholder for Components that might be imported
function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="language-switcher">
      <button onClick={() => changeLanguage('en')} disabled={i18n.language === 'en'}>EN</button>
      <button onClick={() => changeLanguage('ja')} disabled={i18n.language === 'ja'}>日本語</button>
      <button onClick={() => changeLanguage('zh')} disabled={i18n.language === 'zh'}>中文</button>
    </div>
  );
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading, logout, isAdmin } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(anchorEl);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login'); // Navigate to login after logout
    handleMenuClose();
  };

  // Define navigation items
  const navItems = [
    { path: '/', text: t('dashboard_title'), requiresAdmin: false },
  ];

  // Add User Management link only if the user is an admin
  if (isAdmin) {
    navItems.push({ path: '/user-management', text: t('user_management_title'), requiresAdmin: true });
  }

  // Filter nav items based on authentication and role
  const visibleNavItems = navItems.filter(item => {
    if (item.requiresAdmin) {
      return isAdmin; // Only show if user is admin
    }
    return true; // Show for all authenticated users
  });

  const renderUserMenu = (
    <>
      <IconButton
        size="large"
        edge="end"
        aria-label="account of current user"
        aria-controls={isMenuOpen ? 'account-menu' : undefined}
        aria-haspopup="true"
        onClick={handleMenuOpen}
        color="inherit"
      >
        <AccountCircle />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        id={'account-menu'}
        keepMounted
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={isMenuOpen}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose} disabled>
          {user?.display_name} ({user?.roles.map(r => r.name).join(', ')})
        </MenuItem>
        <MenuItem onClick={handleLogout}>{t('logout')}</MenuItem>
      </Menu>
    </>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }} // Hide on larger screens
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Multi-Go App
          </Typography>
          <Box sx={{ flexGrow: 1 }} /> {/* Spacer */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}> {/* Larger screens */}
            <LanguageSwitcher />
            {isAuthenticated ? renderUserMenu : (
              <Button color="inherit" onClick={() => navigate('/login')}>
                {t('login_page_title')}
              </button>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary" // Use temporary for mobile-like behavior
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', sm: 'none' }, // Show only on small screens
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
        }}
      >
        <Toolbar /> {/* Spacer for AppBar */}
        <Divider />
        <List>
          {visibleNavItems.map((item) => (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                component={Link}
                to={item.path}
                selected={location.pathname === item.path}
                onClick={() => { setDrawerOpen(false); navigate(item.path); }} // Close drawer on item click
              >
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        {/* Mobile specific user menu/logout */}
        {isAuthenticated && (
          <>
            <Divider />
            <List>
              <ListItem disablePadding>
                <ListItemButton onClick={handleMenuOpen} aria-controls={'account-menu'} aria-haspopup="true">
                  <AccountCircle sx={{ mr: 1 }} />
                  <ListItemText primary={user?.display_name} secondary={user?.roles.map(r => r.name).join(', ')} />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton onClick={handleLogout}>
                  <ListItemText primary={t('logout')} />
                </ListItemButton>
              </ListItem>
            </List>
          </>
        )}
      </Drawer>

      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - 240px)` }, mt: { xs: '64px', sm: '64px' } }} // Adjust top margin based on AppBar height
      >
        <Toolbar /> {/* Spacer for AppBar */}
        {children} {/* Render the content of the current route */}
        <Outlet /> {/* This is where nested routes will render */}
      </Box>
    </Box>
  );
};

export default Layout;