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
                            {/* Medicine Name and Manufacturer */}
                            <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    {medicine.name}
                                </Typography>
                                <Chip 
                                    label={medicine.manufacture}
                                    size="medium"
                                    sx={{
                                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                        color: theme.palette.primary.main,
                                        fontWeight: 500
                                    }}
                                />
                            </Box>

                            {/* Description */}
                            <Box>
                                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                                    Description
                                </Typography>
                                <Paper 
                                    elevation={0}
                                    sx={{ 
                                        p: 2,
                                        backgroundColor: alpha(theme.palette.primary.main, 0.02),
                                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                        borderRadius: 1
                                    }}
                                >
                                    <Typography variant="body1">
                                        {medicine.description}
                                    </Typography>
                                </Paper>
                            </Box>

                            <Divider />

                            {/* Stock Information */}
                            <Box>
                                <Typography variant="subtitle1" color="primary" sx={{ mb: 2, fontWeight: 500 }}>
                                    Stock Information
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Paper 
                                        elevation={0}
                                        sx={{ 
                                            p: 2,
                                            flex: 1,
                                            backgroundColor: alpha(theme.palette.primary.main, 0.02),
                                            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                            borderRadius: 1
                                        }}
                                    >
                                        <Typography variant="body2" color="text.secondary">
                                            Quantity
                                        </Typography>
                                        <Typography variant="h6" sx={{ mt: 1, fontWeight: 600 }}>
                                            {medicine.stock?.quantity || 'N/A'}
                                        </Typography>
                                    </Paper>
                                    <Paper 
                                        elevation={0}
                                        sx={{ 
                                            p: 2,
                                            flex: 1,
                                            backgroundColor: alpha(theme.palette.primary.main, 0.02),
                                            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                            borderRadius: 1
                                        }}
                                    >
                                        <Typography variant="body2" color="text.secondary">
                                            Price
                                        </Typography>
                                        <Typography variant="h6" sx={{ mt: 1, fontWeight: 600 }}>
                                            ${medicine.stock?.price?.toFixed(2) || 'N/A'}
                                        </Typography>
                                    </Paper>
                                </Box>
                            </Box>
                        </Stack>
                    </CardContent>
                </Card>
            </Box>
        </Box>
    );
}; 