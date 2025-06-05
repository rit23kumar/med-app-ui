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
  alpha
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
import { useThemeContext } from '../theme/ThemeContext';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, toggleColorMode } = useThemeContext();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const menuItems = [
    { text: 'Sell Medicine', path: '/', icon: <ShoppingCartIcon /> },
    { text: 'Medicine Inventory', path: '/medicine-inventory', icon: <DashboardIcon /> },
    { text: 'Manage Stock', path: '/manage-stock', icon: <InventoryIcon /> },
    { text: 'Sales History', path: '/sales-history', icon: <ReceiptIcon /> },
    { text: 'Purchase History', path: '/purchase-history', icon: <HistoryIcon /> }
  ];

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
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
          Medicine Shop
        </Typography>
      </Box>
      <List>
        {menuItems.map((item) => (
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
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
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
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon sx={{ color: theme.palette.text.primary }} />
            </IconButton>
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
              Medicine Shop
            </Typography>
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