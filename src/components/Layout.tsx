import React, { useState } from 'react';
import {
  AppBar,
  Box,
  Container,
  IconButton,
  Toolbar,
  Typography,
  Button,
  useTheme,
  Paper,
  Tooltip,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  alpha,
  CssBaseline,
  Avatar
} from '@mui/material';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import InventoryIcon from '@mui/icons-material/Inventory';
import HistoryIcon from '@mui/icons-material/History';
import ReceiptIcon from '@mui/icons-material/Receipt';
import LogoutIcon from '@mui/icons-material/Logout';
import LockIcon from '@mui/icons-material/Lock';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import { useThemeContext } from '../theme/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

interface MenuItem {
  text: string;
  path: string;
  icon: React.ReactNode;
  role: string;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, toggleColorMode } = useThemeContext();
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const menuItems: MenuItem[] = [
    { text: 'Sales', path: '/', icon: <ShoppingCartIcon />, role: 'USER' },
    { text: 'Inventory', path: '/medicine-inventory', icon: <DashboardIcon />, role: 'USER' },
    { text: 'Manage Stock', path: '/manage-stock', icon: <InventoryIcon />, role: 'ADMIN' },
    { text: 'Sale History', path: '/sales-history', icon: <ReceiptIcon />, role: 'USER' },
    { text: 'Purchase History', path: '/purchase-history', icon: <HistoryIcon />, role: 'ADMIN' },
    { text: 'User Management', path: '/user-management', icon: <PeopleAltIcon />, role: 'ADMIN' }
  ];

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    setDrawerOpen(false);
  };

  const handleChangePassword = () => {
    navigate('/user-management');
    setDrawerOpen(false);
  };

  const isMenuItemVisible = (item: MenuItem) => {
    // Admin can see all items
    if (user?.role === 'ADMIN') return true;
    // Regular users can only see items with role 'USER'
    return item.role === 'USER';
  };

  const drawer = (
    <Box sx={{ width: 240 }}>
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        <LocalHospitalIcon sx={{ color: theme.palette.primary.main }} />
        <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>
          Dev Medical Hall
        </Typography>
      </Box>
      <List>
        {menuItems.map((item) => (
          isMenuItemVisible(item) && (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.15),
                    }
                  }
                }}
              >
                <ListItemIcon sx={{ 
                  color: location.pathname === item.path ? theme.palette.primary.main : theme.palette.text.secondary 
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  sx={{
                    '& .MuiTypography-root': {
                      color: location.pathname === item.path ? theme.palette.primary.main : theme.palette.text.primary,
                      fontWeight: location.pathname === item.path ? 600 : 400
                    }
                  }}
                />
              </ListItemButton>
            </ListItem>
          )
        ))}
        {isAuthenticated && user && (
          <>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Avatar sx={{ 
                width: 56, 
                height: 56, 
                mx: 'auto', 
                mb: 1,
                bgcolor: theme.palette.primary.main,
                fontSize: '1.5rem'
              }}>
                {user.fullName.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                {user.fullName}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {user.role}
              </Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <ListItem disablePadding>
              <ListItemButton onClick={handleChangePassword}>
                <ListItemIcon sx={{ color: theme.palette.text.secondary }}>
                  <LockIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Change Password" 
                  sx={{
                    '& .MuiTypography-root': {
                      color: theme.palette.text.primary,
                      fontWeight: 400
                    }
                  }}
                />
              </ListItemButton>
            </ListItem>
          </>
        )}
        {isAuthenticated && (
          <>
            <Divider sx={{ my: 1 }} />
            <ListItem disablePadding>
              <ListItemButton onClick={handleLogout}>
                <ListItemIcon sx={{ color: theme.palette.text.secondary }}>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Logout" 
                  sx={{
                    '& .MuiTypography-root': {
                      color: theme.palette.text.primary,
                      fontWeight: 400
                    }
                  }}
                />
              </ListItemButton>
            </ListItem>
          </>
        )}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: theme.palette.background.paper,
          borderBottom: 1,
          borderColor: 'divider',
          boxShadow: theme.shadows[1]
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters>
            {isAuthenticated && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2 }}
              >
                <MenuIcon sx={{ color: theme.palette.text.primary }} />
              </IconButton>
            )}
            <LocalHospitalIcon 
              sx={{ 
                color: theme.palette.primary.main,
                fontSize: '2rem',
                marginRight: 2 
              }} 
            />
            <Typography
              variant="h6"
              component={Link}
              to="/"
              sx={{
                color: theme.palette.text.primary,
                textDecoration: 'none',
                fontWeight: 600,
                flexGrow: 1
              }}
            >
              Dev Medical Hall
            </Typography>
            {isAuthenticated && (
              <Button
                color="inherit"
                onClick={handleLogout}
                sx={{
                  color: theme.palette.text.primary,
                  textTransform: 'none',
                  fontWeight: 600,
                  ml: 2
                }}
              >
                Logout
              </Button>
            )}
            <Tooltip title={`Toggle ${mode === 'light' ? 'dark' : 'light'} mode`}>
              <IconButton onClick={toggleColorMode} color="inherit" sx={{ ml: 1 }}>
                {mode === 'light' ? (
                  <Brightness4Icon sx={{ color: theme.palette.text.primary }} />
                ) : (
                  <Brightness7Icon sx={{ color: theme.palette.text.primary }} />
                )}
              </IconButton>
            </Tooltip>
          </Toolbar>
        </Container>
      </AppBar>
      <Drawer
        variant="temporary"
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box',
            width: 250,
            backgroundColor: theme.palette.background.paper,
            borderRight: 1,
            borderColor: 'divider'
          },
        }}
      >
        {drawer}
      </Drawer>
      <Toolbar /> {/* This is for spacing below the fixed AppBar */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          backgroundColor: theme.palette.background.default,
          minHeight: '100vh',
          pt: 3
        }}
      >
        <Container maxWidth="lg">
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              overflow: 'hidden',
              boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
            }}
          >
            {children}
          </Paper>
        </Container>
      </Box>
    </Box>
  );
}; 