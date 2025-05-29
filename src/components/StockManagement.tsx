import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    TextField,
    Button,
    Typography,
    Paper,
    Grid,
    Autocomplete,
    Alert,
    Snackbar,
    FormControlLabel,
    Switch,
    Divider
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { Medicine, Stock, StockHistory } from '../types/medicine';
import { medicineApi } from '../services/api';
import { format } from 'date-fns';
import StockHistoryTable from './StockHistoryTable';

const StockManagement: React.FC = () => {
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
    const [expDate, setExpDate] = useState<Date | null>(null);
    const [quantity, setQuantity] = useState<string>('');
    const [price, setPrice] = useState<string>('');
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
    const [stockHistory, setStockHistory] = useState<StockHistory[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [includeFinished, setIncludeFinished] = useState(false);

    // Calculate total available quantity
    const totalAvailable = useMemo(() => {
        return stockHistory.reduce((sum, entry) => sum + entry.availableQuantity, 0);
    }, [stockHistory]);

    useEffect(() => {
        loadMedicines();
    }, []);

    useEffect(() => {
        if (selectedMedicine?.id) {
            loadStockHistory(selectedMedicine.id);
        } else {
            setStockHistory([]);
        }
    }, [selectedMedicine, includeFinished]);

    const loadMedicines = async () => {
        try {
            const response = await medicineApi.getAllMedicines(0, 100);
            setMedicines(response.content);
        } catch (error) {
            console.error('Error loading medicines:', error);
            showNotification('Error loading medicines', 'error');
        }
    };

    const loadStockHistory = async (medicineId: number) => {
        setLoadingHistory(true);
        try {
            const history = await medicineApi.getStockHistory(medicineId, includeFinished);
            setStockHistory(history);
        } catch (error) {
            console.error('Error loading stock history:', error);
            showNotification('Error loading stock history', 'error');
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMedicine || !expDate || !quantity || !price) {
            showNotification('Please fill all required fields', 'error');
            return;
        }

        const stockData: Stock = {
            expDate: format(expDate, 'yyyy-MM-dd'),
            quantity: parseInt(quantity),
            price: parseFloat(price)
        };

        try {
            await medicineApi.addMedicineWithStock({
                medicine: selectedMedicine,
                stock: stockData
            });
            showNotification('Stock updated successfully', 'success');
            if (selectedMedicine.id) {
                loadStockHistory(selectedMedicine.id);
            }
            resetForm();
        } catch (error) {
            console.error('Error updating stock:', error);
            showNotification('Error updating stock', 'error');
        }
    };

    const resetForm = () => {
        setSelectedMedicine(null);
        setExpDate(null);
        setQuantity('');
        setPrice('');
    };

    const showNotification = (message: string, severity: 'success' | 'error') => {
        setNotification({
            open: true,
            message,
            severity
        });
    };

    return (
        <Box sx={{ p: 3 }}>
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h5" gutterBottom>
                    Add Medicine Stock
                </Typography>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Autocomplete
                                options={medicines}
                                getOptionLabel={(option) => option.name}
                                value={selectedMedicine}
                                onChange={(_, newValue) => setSelectedMedicine(newValue)}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Select Medicine"
                                        required
                                        fullWidth
                                        autoComplete="off"
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <DatePicker
                                label="Expiration Date"
                                value={expDate}
                                onChange={(newValue) => setExpDate(newValue)}
                                slotProps={{
                                    textField: {
                                        required: true,
                                        fullWidth: true
                                    }
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                label="Quantity"
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                required
                                fullWidth
                                autoComplete="off"
                                inputProps={{ min: 0 }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                label="Unit Price"
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                required
                                fullWidth
                                autoComplete="off"
                                inputProps={{ min: 0, step: "0.01" }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                                <Button
                                    type="button"
                                    variant="outlined"
                                    onClick={resetForm}
                                >
                                    Reset
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                >
                                    Update Stock
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </form>
            </Paper>

            {selectedMedicine && (
                <Paper sx={{ p: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6">
                            Stock History - {selectedMedicine.name} (Total Available: {totalAvailable})
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
                    />
                </Paper>
            )}

            <Snackbar
                open={notification.open}
                autoHideDuration={6000}
                onClose={() => setNotification({ ...notification, open: false })}
            >
                <Alert
                    onClose={() => setNotification({ ...notification, open: false })}
                    severity={notification.severity}
                    sx={{ width: '100%' }}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default StockManagement; 