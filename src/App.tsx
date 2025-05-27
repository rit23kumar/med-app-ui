import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { CustomThemeProvider } from './theme/ThemeContext';
import { AppRoutes } from './routes';

function App() {
    return (
        <CustomThemeProvider>
            <CssBaseline />
            <Router>
                <AppRoutes />
            </Router>
        </CustomThemeProvider>
    );
}

export default App;
