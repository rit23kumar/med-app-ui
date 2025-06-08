import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Box,
    Typography,
    Grid,
    Divider,
    CircularProgress,
    FormControlLabel,
    Switch,
    IconButton,
    alpha,
    useTheme,
    Paper
} from '@mui/material';
import { Medicine, StockHistory } from '../types/medicine';
import { medicineApi } from '../services/api';
import StockHistoryTable from './StockHistoryTable';
import CloseIcon from '@mui/icons-material/Close';
import { format } from 'date-fns';
import { formatIndianCurrency } from '../utils/formatCurrency';

interface MedicineDetailsDialogProps {
    open: boolean;
    onClose: () => void;
    medicineId: number;
}

const MedicineDetailsDialog: React.FC<MedicineDetailsDialogProps> = ({ open, onClose, medicineId }) => {
    const theme = useTheme();
    const [medicine, setMedicine] = useState<Medicine | null>(null);
    const [stockHistory, setStockHistory] = useState<StockHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [includeFinished, setIncludeFinished] = useState(false);

    useEffect(() => {
        if (open && medicineId) {
            loadMedicineDetails(medicineId);
            loadStockHistory(medicineId);
        }
    }, [open, medicineId]);

    useEffect(() => {
        if (medicineId) {
            loadStockHistory(medicineId);
        }
    }, [includeFinished]);

    const loadMedicineDetails = async (id: number) => {
        setLoading(true);
        try {
            const data = await medicineApi.getMedicineById(id);
            setMedicine(data);
        } catch (error) {
            console.error('Error loading medicine details:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStockHistory = async (id: number) => {
        setLoadingHistory(true);
        try {
            const history = await medicineApi.getStockHistory(id, includeFinished);
            setStockHistory(history);
        } catch (error) {
            console.error('Error loading stock history:', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleIncludeFinishedChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setIncludeFinished(event.target.checked);
    };

    // Calculate current stock information
    const currentStock = useMemo(() => {
        if (stockHistory.length === 0) return null;

        const totalQuantity = stockHistory.reduce((sum, entry) => sum + entry.availableQuantity, 0);
        const latestPrice = stockHistory[0]?.price || 0;

        return {
            totalQuantity,
            latestPrice
        };
    }, [stockHistory]);

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    boxShadow: theme.shadows[3]
                }
            }}
        >
            <DialogTitle sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                borderBottom: 1,
                borderColor: 'divider',
                pb: 2
            }}>
                <Typography variant="h6" component="div">
                    Medicine Details
                </Typography>
                <IconButton
                    edge="end"
                    color="inherit"
                    onClick={onClose}
                    aria-label="close"
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                    </Box>
                ) : medicine ? (
                    <Box>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Paper 
                                    elevation={0} 
                                    sx={{ 
                                        p: 2, 
                                        backgroundColor: alpha(theme.palette.primary.main, 0.05),
                                        borderRadius: 2
                                    }}
                                >
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="subtitle2" color="text.secondary">
                                                Medicine Name
                                            </Typography>
                                            <Typography variant="h6">
                                                {medicine.name}
                                            </Typography>
                                        </Grid>
                                        {currentStock && (
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="subtitle2" color="text.secondary">
                                                    Current Stock
                                                </Typography>
                                                <Box>
                                                    <Typography variant="body1">
                                                        Total Quantity: {currentStock.totalQuantity}
                                                    </Typography>
                                                    <Typography variant="subtitle1">
                                                        Latest Price: ₹{formatIndianCurrency(currentStock.latestPrice)}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        )}
                                    </Grid>
                                </Paper>
                            </Grid>
                            
                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6">Stock History</Typography>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={includeFinished}
                                                onChange={handleIncludeFinishedChange}
                                                color="primary"
                                            />
                                        }
                                        label="Include Finished Stock"
                                    />
                                </Box>
                                <Divider sx={{ mb: 2 }} />
                                {loadingHistory ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                        <CircularProgress />
                                    </Box>
                                ) : (
                                    <StockHistoryTable 
                                        stockHistory={stockHistory}
                                        loading={loadingHistory}
                                    />
                                )}
                            </Grid>
                        </Grid>
                    </Box>
                ) : (
                    <Typography color="error">Medicine not found</Typography>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default MedicineDetailsDialog; 