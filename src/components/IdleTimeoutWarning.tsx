import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    CircularProgress
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../api/auth';
import { useNavigate } from 'react-router-dom';

interface IdleTimeoutWarningProps {
    warningTime: number; // Time in seconds before logout to show warning
    timeoutTime: number; // Total time in seconds before logout
}

export const IdleTimeoutWarning: React.FC<IdleTimeoutWarningProps> = ({ warningTime, timeoutTime }) => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [showWarning, setShowWarning] = useState(false);
    const [timeLeft, setTimeLeft] = useState(warningTime);
    const [lastBackendActivity, setLastBackendActivity] = useState(Date.now());

    // Function to make a backend call to keep session alive
    const keepSessionAlive = async () => {
        try {
            // Call any backend API to keep session alive
            await authApi.getCurrentUser();
            setLastBackendActivity(Date.now());
            setShowWarning(false);
            setTimeLeft(warningTime);
        } catch (error: any) {
            // If the API call fails, it might mean the session is already expired
            if (error.response?.status === 401) {
                handleSessionExpired();
            }
        }
    };

    const handleSessionExpired = () => {
        logout();
        navigate('/login');
    };

    // Check for backend idle timeout
    useEffect(() => {
        const checkIdle = () => {
            const currentTime = Date.now();
            const idleTime = (currentTime - lastBackendActivity) / 1000; // Convert to seconds

            if (idleTime >= timeoutTime - warningTime && !showWarning) {
                setShowWarning(true);
            }

            if (showWarning) {
                const remainingTime = Math.ceil(warningTime - (idleTime - (timeoutTime - warningTime)));
                setTimeLeft(Math.max(0, remainingTime));

                if (remainingTime <= 0) {
                    handleSessionExpired();
                }
            }
        };

        const interval = setInterval(checkIdle, 1000);
        return () => clearInterval(interval);
    }, [lastBackendActivity, showWarning, timeoutTime, warningTime, logout, navigate]);

    const handleStayLoggedIn = () => {
        keepSessionAlive();
    };

    return (
        <Dialog
            open={showWarning}
            onClose={handleStayLoggedIn}
            aria-labelledby="idle-timeout-dialog"
            disableEscapeKeyDown
        >
            <DialogTitle id="idle-timeout-dialog">
                Session Timeout Warning
            </DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 2 }}>
                    <Typography variant="body1">
                        Your session will expire due to inactivity. You will be logged out in:
                    </Typography>
                    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                        <CircularProgress
                            variant="determinate"
                            value={(timeLeft / warningTime) * 100}
                            size={60}
                        />
                        <Box
                            sx={{
                                top: 0,
                                left: 0,
                                bottom: 0,
                                right: 0,
                                position: 'absolute',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Typography variant="caption" component="div" color="text.secondary">
                                {timeLeft}s
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleStayLoggedIn} color="primary" variant="contained">
                    Stay Logged In
                </Button>
            </DialogActions>
        </Dialog>
    );
}; 