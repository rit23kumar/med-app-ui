import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { CustomThemeProvider } from './theme/ThemeContext';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { AppRoutes } from './routes';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { IdleTimeoutWarning } from './components/IdleTimeoutWarning';
import TabCloseHandler from './components/TabCloseHandler';

const AppContent: React.FC = () => {
    const { isAuthenticated, user } = useAuth();

    return (
        <>
            {isAuthenticated && (
                <IdleTimeoutWarning 
                    warningTime={30} // Show warning 30 seconds before timeout
                    timeoutTime={150} // 2.5 minutes for all users
                />
            )}
            <TabCloseHandler />
            <AppRoutes />
        </>
    );
};

const App: React.FC = () => {
    return (
        <Router>
            <CustomThemeProvider>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <CssBaseline />
                    <AuthProvider>
                        <AppContent />
                    </AuthProvider>
                </LocalizationProvider>
            </CustomThemeProvider>
        </Router>
    );
};

export default App;
