import React, { useState, useEffect, useMemo, useRef } from 'react';
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
    Divider,
    Card,
    CardContent,
    Stack
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Medicine, Stock, StockHistory } from '../types/medicine';
import { medicineApi } from '../services/api';
import { format, parse } from 'date-fns';
import StockHistoryTable from './StockHistoryTable';
import { AddMedicineName } from './AddMedicineName';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import InfoIcon from '@mui/icons-material/Info';
import Tooltip from '@mui/material/Tooltip';

const timeZone = 'Asia/Kolkata';

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
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

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

    const downloadSampleCsv = () => {
        const csvContent = 'Medicine Name,Expiration Date,Quantity,Price\n' +
            'Paracetamol,31-12-2029,100,5.99\n' +
            'Vitamin C,15-10-2029,50,12.50\n' +
            'Aspirin,30-06-2029,75,8.99';
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'stock_template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result as string;
                const lines = text.split('\n').slice(1); // Skip header row

                const stockEntries = lines
                    .filter(line => line.trim())
                    .map(line => {
                        const [medicineName, expDate, quantity, price] = line.split(',').map(field => field.trim());

                        if (!medicineName || !expDate || !quantity || !price) {
                            throw new Error(`Missing required fields in line: ${line}`);
                        }

                        // Convert date from dd-MM-yyyy to yyyy-MM-dd
                        const [day, month, year] = expDate.split('-');
                        const formattedDate = `${year}-${month}-${day}`;

                        return {
                            medicineName,
                            stock: {
                                expDate: formattedDate,
                                quantity: parseInt(quantity),
                                price: parseFloat(price)
                            }
                        };
                    });

                if (stockEntries.length === 0) {
                    throw new Error('No valid data found in CSV');
                }

                setIsSubmitting(true);
                setUploadError(null);

                // Process each entry
                const results = await Promise.all(
                    stockEntries.map(async (entry) => {
                        try {
                            // Find the medicine by name
                            const searchResult = await medicineApi.searchMedicines(entry.medicineName, 'contains');
                            const medicine = searchResult.find(m => 
                                m.name.toLowerCase() === entry.medicineName.toLowerCase()
                            );

                            if (!medicine) {
                                return {
                                    success: false,
                                    name: entry.medicineName,
                                    reason: 'Medicine not found'
                                };
                            }

                            // Add stock
                            await medicineApi.addMedicineWithStock({
                                medicine,
                                stock: entry.stock
                            });

                            return {
                                success: true,
                                name: entry.medicineName
                            };
                        } catch (err: any) {
                            return {
                                success: false,
                                name: entry.medicineName,
                                reason: err.response?.data?.message || err.message
                            };
                        }
                    })
                );

                const successfulUploads = results.filter(r => r.success);
                const failedUploads = results.filter(r => !r.success);

                if (successfulUploads.length > 0) {
                    showNotification(`Successfully added stock for ${successfulUploads.length} medicine(s)`, 'success');
                    loadMedicines();
                }

                if (failedUploads.length > 0) {
                    const errorMessage = failedUploads
                        .map(f => `${f.name}: ${f.reason}`)
                        .join('\n');
                    setUploadError(`Failed to add stock for:\n${errorMessage}`);
                }

                // Reset file input
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }

            } catch (error: any) {
                console.error('Error processing CSV:', error);
                setUploadError(error.message || 'Failed to process CSV file');
            } finally {
                setIsSubmitting(false);
            }
        };

        reader.readAsText(file);
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>
                        Manage Stocks
                </Typography>
                {/* Quick Add Medicine Section */}
                <AddMedicineName onSuccess={() => {
                    showNotification('Medicine added successfully', 'success');
                    loadMedicines();
                }} />

                {/* Add Medicine Stock Section */}
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h5" gutterBottom>
                        Add Medicine Stock (Purchase)
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
                                    format="dd/MM/yy"
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

                {/* Bulk Upload Section */}
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <Typography variant="h6">
                                Bulk Upload
                            </Typography>
                            <Tooltip title="Add New Medicine with/without its Stock or Update existing medicine with its Stock">
                                <InfoIcon color="action" fontSize="small" />
                            </Tooltip>
                        </Box>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Button
                                variant="outlined"
                                startIcon={<UploadFileIcon />}
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isSubmitting}
                            >
                                Upload CSV
                            </Button>
                            <input
                                type="file"
                                accept=".csv"
                                hidden
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                            />
                            <Button
                                variant="text"
                                startIcon={<FileDownloadIcon />}
                                onClick={downloadSampleCsv}
                            >
                                Download Template
                            </Button>
                        </Stack>
                        {uploadError && (
                            <Alert 
                                severity="error" 
                                sx={{ mt: 2 }}
                                onClose={() => setUploadError(null)}
                            >
                                {uploadError}
                            </Alert>
                        )}
                    </CardContent>
                </Card>

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
        </LocalizationProvider>
    );
};

export default StockManagement; 