import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { CustomThemeProvider } from './theme/ThemeContext';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { AppRoutes } from './routes';
import { AuthProvider } from './contexts/AuthContext';

function App() {
    return (
        <CustomThemeProvider>
            <CssBaseline />
            <Router>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <AuthProvider>
                        <AppRoutes />
                    </AuthProvider>
                </LocalizationProvider>
            </Router>
        </CustomThemeProvider>
    );
}

export default App;
