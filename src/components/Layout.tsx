import React, { useState, useEffect } from 'react';
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
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Modal,
  Menu,
  MenuItem,
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
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useThemeContext } from '../theme/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { userApi } from '../api/userApi';

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
  const { isAuthenticated, isAdmin, user, logout, login } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);
  const [changePasswordSuccess, setChangePasswordSuccess] = useState<string | null>(null);
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState<null | HTMLElement>(null);

  // Handle focus management when dialog opens
  useEffect(() => {
    // Cleanup function
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [changePasswordDialogOpen]);

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
    setUserMenuAnchorEl(null);
  };

  const handleChangePassword = () => {
    setChangePasswordDialogOpen(true);
    setDrawerOpen(false);
    setUserMenuAnchorEl(null);
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchorEl(null);
  };

  const handleCloseChangePasswordDialog = () => {
    setChangePasswordDialogOpen(false);
    setOldPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setChangePasswordError(null);
    setChangePasswordSuccess(null);
    // Ensure body scroll is restored
    document.body.style.overflow = 'auto';
  };

  const handleConfirmChangePassword = async () => {
    setChangePasswordLoading(true);
    setChangePasswordError(null);
    setChangePasswordSuccess(null);

    // Validation
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      setChangePasswordError('All fields are required.');
      setChangePasswordLoading(false);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setChangePasswordError('New passwords do not match.');
      setChangePasswordLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setChangePasswordError('New password must be at least 6 characters long.');
      setChangePasswordLoading(false);
      return;
    }

    try {
      // First verify old password by attempting to login
      await login(user?.username || '', oldPassword);
      
      // If login succeeds, change the password
      if (user?.id) {
        await userApi.changeUserPassword(user.id, newPassword);
        setChangePasswordSuccess('Password changed successfully!');
        
        // Clear form after success
        setTimeout(() => {
          handleCloseChangePasswordDialog();
        }, 2000);
      }
    } catch (err: any) {
      console.error('Error changing password:', err);
      if (err.message?.includes('Invalid credentials')) {
        setChangePasswordError('Current password is incorrect.');
      } else {
        setChangePasswordError(err.message || 'Failed to change password.');
      }
    } finally {
      setChangePasswordLoading(false);
    }
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
            {isAuthenticated && user && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: theme.palette.text.secondary,
                    display: { xs: 'none', sm: 'block' }
                  }}
                >
                  {user.fullName}
                </Typography>
                <Tooltip title="User Menu">
                  <IconButton
                    onClick={handleUserMenuOpen}
                    sx={{ 
                      color: theme.palette.text.primary,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.1)
                      }
                    }}
                  >
                    <Avatar 
                      sx={{ 
                        width: 32, 
                        height: 32,
                        bgcolor: theme.palette.primary.main,
                        fontSize: '0.875rem'
                      }}
                    >
                      {user.fullName.charAt(0).toUpperCase()}
                    </Avatar>
                  </IconButton>
                </Tooltip>
                <Menu
                  anchorEl={userMenuAnchorEl}
                  open={Boolean(userMenuAnchorEl)}
                  onClose={handleUserMenuClose}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  PaperProps={{
                    sx: {
                      mt: 1,
                      minWidth: 200,
                      boxShadow: theme.shadows[3]
                    }
                  }}
                >
                  <MenuItem onClick={toggleColorMode}>
                    <ListItemIcon>
                      {mode === 'light' ? (
                        <Brightness4Icon fontSize="small" />
                      ) : (
                        <Brightness7Icon fontSize="small" />
                      )}
                    </ListItemIcon>
                    {mode === 'light' ? 'Dark Mode' : 'Light Mode'}
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={handleChangePassword}>
                    <ListItemIcon>
                      <LockIcon fontSize="small" />
                    </ListItemIcon>
                    Change Password
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                      <LogoutIcon fontSize="small" />
                    </ListItemIcon>
                    Logout
                  </MenuItem>
                </Menu>
              </Box>
            )}
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
      <Modal
        open={changePasswordDialogOpen}
        onClose={handleCloseChangePasswordDialog}
        aria-labelledby="change-password-modal-title"
        aria-describedby="change-password-modal-description"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: '1400'
        }}
      >
        <Paper sx={{ p: 4, width: '100%', maxWidth: 500, outline: 'none' }}>
          <Typography id="change-password-modal-title" variant="h6" component="h2" sx={{ mb: 2 }}>
            Change Password
          </Typography>
          <Box id="change-password-modal-description">
            {changePasswordSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {changePasswordSuccess}
              </Alert>
            )}
            {changePasswordError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {changePasswordError}
              </Alert>
            )}
            <TextField
              margin="dense"
              label="Current Password"
              type="password"
              fullWidth
              variant="outlined"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              disabled={changePasswordLoading}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="New Password"
              type="password"
              fullWidth
              variant="outlined"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={changePasswordLoading}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Confirm New Password"
              type="password"
              fullWidth
              variant="outlined"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              disabled={changePasswordLoading}
              sx={{ mb: 2 }}
            />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button 
              onClick={handleCloseChangePasswordDialog} 
              disabled={changePasswordLoading}
              sx={{ mr: 1 }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmChangePassword} 
              variant="contained"
              disabled={changePasswordLoading}
            >
              {changePasswordLoading ? <CircularProgress size={20} /> : 'Change Password'}
            </Button>
          </Box>
        </Paper>
      </Modal>
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