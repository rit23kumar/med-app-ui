import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    useTheme,
    alpha,
    Card,
    CardContent,
    Stack,
    IconButton,
    Chip,
    Divider,
    Paper
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { Medicine } from '../types/medicine';
import { medicineApi } from '../services/api';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export const MedicineDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const theme = useTheme();
    const [medicine, setMedicine] = useState<Medicine | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMedicine = async () => {
            try {
                setLoading(true);
                const data = await medicineApi.getMedicineById(Number(id));
                setMedicine(data);
            } catch (err) {
                setError('Failed to fetch medicine details');
                console.error('Error fetching medicine:', err);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchMedicine();
        }
    }, [id]);

    if (loading) {
        return <Box sx={{ p: 3 }}>Loading...</Box>;
    }

    if (error || !medicine) {
        return <Box sx={{ p: 3 }}>Error loading medicine details</Box>;
    }

    return (
        <Box>
            <Box 
                sx={{ 
                    py: 2,
                    px: 3,
                    borderBottom: 1,
                    borderColor: 'divider',
                    backgroundColor: alpha(theme.palette.primary.main, 0.02)
                }}
            >
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2 
                }}>
                    <IconButton 
                        onClick={() => navigate('/')}
                        size="small"
                        sx={{ 
                            backgroundColor: alpha(theme.palette.primary.main, 0.04),
                            '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.08)
                            }
                        }}
                    >
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h5" component="h1" color="primary" sx={{ fontWeight: 500 }}>
                        Medicine Details
                    </Typography>
                </Box>
            </Box>

            <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
                <Card sx={{
                    backgroundColor: theme.palette.background.paper,
                    boxShadow: theme.shadows[1],
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                }}>
                    <CardContent sx={{ p: 3 }}>
                        <Stack spacing={3}>
                            <Box sx={{ p: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    {medicine.name}
                                </Typography>

                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Stock Information
                                    </Typography>
                                    <Box sx={{ mt: 1 }}>
                                        <Typography variant="body2">
                                            Quantity: {medicine.stock?.quantity || 0}
                                        </Typography>
                                        <Typography variant="body2">
                                            Price: ₹{medicine.stock?.price || 0}
                                        </Typography>
                                        <Typography variant="body2">
                                            Expiry Date: {medicine.stock?.expDate || 'N/A'}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Stack>
                    </CardContent>
                </Card>
            </Box>
        </Box>
    );
}; 