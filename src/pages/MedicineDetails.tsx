import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Divider,
    CircularProgress,
    FormControlLabel,
    Switch,
    IconButton,
    alpha,
    Snackbar,
    Alert
} from '@mui/material';
import { Medicine, StockHistory } from '../types/medicine';
import { medicineApi } from '../services/api';
import StockHistoryTable from '../components/StockHistoryTable';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const MedicineDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [medicine, setMedicine] = useState<Medicine | null>(null);
    const [stockHistory, setStockHistory] = useState<StockHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [includeFinished, setIncludeFinished] = useState(false);

    useEffect(() => {
        if (id) {
            loadMedicineDetails(parseInt(id));
        }
    }, [id]);

    useEffect(() => {
        if (id) {
            loadStockHistory(parseInt(id));
        }
    }, [id, includeFinished]);

    const loadMedicineDetails = async (medicineId: number) => {
        try {
            const data = await medicineApi.getMedicineById(medicineId);
            setMedicine(data);
        } catch (error) {
            console.error('Error loading medicine details:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStockHistory = async (medicineId: number) => {
        setLoadingHistory(true);
        try {
            const data = await medicineApi.getStockHistory(medicineId, includeFinished);
            setStockHistory(data);
        } catch (error) {
            console.error('Error loading stock history:', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    // Calculate current stock and latest price from stock history
    const currentStock = useMemo(() => {
        if (stockHistory.length === 0) return null;

        const totalQuantity = stockHistory.reduce((sum, entry) => sum + entry.quantity, 0);
        const latestPrice = stockHistory[0].price;

        return {
            quantity: totalQuantity,
            price: latestPrice
        };
    }, [stockHistory]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" p={3}>
                <CircularProgress />
            </Box>
        );
    }

    if (!medicine) {
        return (
            <Box p={3}>
                <Typography variant="h6" color="error">
                    Medicine not found
                </Typography>
            </Box>
        );
    }

    return (
        <Box>
            <Box 
                sx={{ 
                    py: 2,
                    px: 3,
                    borderBottom: 1,
                    borderColor: 'divider',
                    backgroundColor: alpha('#000', 0.02),
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                }}
            >
                <IconButton 
                    onClick={() => navigate('/')}
                    size="small"
                    sx={{ 
                        backgroundColor: alpha('#000', 0.04),
                        '&:hover': {
                            backgroundColor: alpha('#000', 0.08)
                        }
                    }}
                >
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h5" component="h1" sx={{ fontWeight: 500 }}>
                    Medicine Details
                </Typography>
            </Box>

            <Box p={3}>
                <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Typography variant="h5" gutterBottom>
                                {medicine.name}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="h6" color="textSecondary" gutterBottom>
                                Current Stock
                            </Typography>
                            {loadingHistory ? (
                                <CircularProgress size={20} />
                            ) : currentStock ? (
                                <>
                                    <Typography variant="body1" sx={{ mb: 1 }}>
                                        Total Quantity: {currentStock.quantity}
                                    </Typography>
                                    <Typography variant="body1">
                                        Latest Unit Price: ₹{currentStock.price.toFixed(2)}
                                    </Typography>
                                </>
                            ) : (
                                <Typography variant="body1" color="error">
                                    No stock history available
                                </Typography>
                            )}
                        </Grid>
                    </Grid>
                </Paper>

                <Paper sx={{ p: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6">
                            Stock History
                        </Typography>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={includeFinished}
                                    onChange={(e) => setIncludeFinished(e.target.checked)}
                                    color="primary"
                                    size="small"
                                />
                            }
                            label="Include Finished Batches"
                        />
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    <StockHistoryTable 
                        stockHistory={stockHistory}
                        loading={loadingHistory}
                        onDeleteBatch={() => {}}
                    />
                </Paper>
            </Box>
        </Box>
    );
};

export default MedicineDetails; 