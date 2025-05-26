import React from 'react';
import {
  AppBar,
  Box,
  Container,
  Toolbar,
  Typography,
  Button,
  useTheme,
  Paper
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar 
        position="fixed" 
        sx={{
          backgroundColor: 'white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters>
            <LocalHospitalIcon 
              sx={{ 
                color: theme.palette.primary.main,
                fontSize: '2rem',
                marginRight: 2 
              }} 
            />
            <Typography
              variant="h6"
              component="div"
              sx={{
                flexGrow: 1,
                color: theme.palette.primary.main,
                fontWeight: 600,
                letterSpacing: '0.5px'
              }}
            >
              MedShop Manager
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                color="primary"
                onClick={() => navigate('/')}
                variant={location.pathname === '/' ? 'contained' : 'text'}
              >
                Medicines
              </Button>
              <Button
                color="primary"
                onClick={() => navigate('/add-medicine')}
                variant={location.pathname === '/add-medicine' ? 'contained' : 'text'}
              >
                Add Medicine
              </Button>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          backgroundColor: '#f5f5f5',
          minHeight: '100vh',
          pt: 10,
          pb: 4
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