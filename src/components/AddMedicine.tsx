import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    Button,
    TextField,
    Typography,
    Switch,
    FormControlLabel,
    useTheme,
    alpha,
    Alert,
    Collapse,
    IconButton,
    CircularProgress,
    Card,
    CardContent,
    Tooltip,
    Stack,
    Divider,
    Snackbar
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Medicine, MedicineWithStock, Stock } from '../types/medicine';
import { medicineApi } from '../services/api';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/Info';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { format, parse } from 'date-fns';

interface FormErrors {
    name?: string;
    description?: string;
    manufacture?: string;
    expDate?: string;
    quantity?: string;
    price?: string;
}

export const AddMedicine: React.FC = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [includeStock, setIncludeStock] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [toasts, setToasts] = useState<Array<{
        id: number;
        message: string;
        severity: 'success' | 'error' | 'info' | 'warning';
    }>>([]);
    let toastId = 0;

    const [medicine, setMedicine] = useState<Medicine>({
        name: '',
        description: '',
        manufacture: ''
    });
    const [stock, setStock] = useState<Stock>({
        expDate: '',
        quantity: null as unknown as number,
        price: null as unknown as number
    });

    const validateForm = (): boolean => {
        const errors: FormErrors = {};
        let isValid = true;

        if (!medicine.name.trim()) {
            errors.name = 'Medicine name is required';
            isValid = false;
        }

        if (includeStock) {
            if (!stock.expDate) {
                errors.expDate = 'Expiration date is required';
                isValid = false;
            }

            if (stock.quantity <= 0) {
                errors.quantity = 'Quantity must be greater than 0';
                isValid = false;
            }

            if (stock.price <= 0) {
                errors.price = 'Price must be greater than 0';
                isValid = false;
            }
        }

        setFormErrors(errors);
        return isValid;
    };

    const handleMedicineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setMedicine(prev => ({
            ...prev,
            [name]: value
        }));
        if (formErrors[name as keyof FormErrors]) {
            setFormErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setStock(prev => ({
            ...prev,
            [name]: name === 'expDate' ? value : value === '' ? null : Number(value)
        }));
        if (formErrors[name as keyof FormErrors]) {
            setFormErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleDateChange = (date: Date | null) => {
        if (date) {
            const formattedDate = date.toISOString().split('T')[0];
            setStock(prev => ({
                ...prev,
                expDate: formattedDate
            }));
            if (formErrors.expDate) {
                setFormErrors(prev => ({ ...prev, expDate: undefined }));
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        setError(null);

        try {
            if (includeStock) {
                const medicineWithStock: MedicineWithStock = {
                    medicine,
                    stock
                };
                await medicineApi.addMedicineWithStock(medicineWithStock);
                setShowSuccess(true);
                setMedicine({ name: '', description: '', manufacture: '' });
                setStock({ expDate: '', quantity: null as unknown as number, price: null as unknown as number });
                setIncludeStock(false);
            } else {
                await medicineApi.addMedicine(medicine);
                setShowSuccess(true);
                setMedicine({ name: '', description: '', manufacture: '' });
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Failed to add medicine. Please try again.';
            setError(errorMessage);
            console.error('Error adding medicine:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const showToast = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'info') => {
        const id = toastId++;
        setToasts(prev => [...prev, { id, message, severity }]);
        // Auto remove after 6 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== id));
        }, 6000);
    };

    const handleToastClose = (id: number) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    const convertToISODate = (dateStr: string): string => {
        try {
            // Try parsing as DD-MM-YYYY
            const parsedDate = parse(dateStr, 'dd-MM-yyyy', new Date());
            return format(parsedDate, 'yyyy-MM-dd');
        } catch (error) {
            try {
                // If DD-MM-YYYY fails, try parsing as YYYY-MM-DD
                const parsedDate = parse(dateStr, 'yyyy-MM-dd', new Date());
                return format(parsedDate, 'yyyy-MM-dd');
            } catch (error) {
                throw new Error(`Invalid date format. Please use DD-MM-YYYY format (e.g., 31-12-2025)`);
            }
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Reset any previous errors and success state
        setUploadError(null);
        setError(null);
        setShowSuccess(false);

        // Check if it's a CSV file
        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            showToast('Please upload a valid CSV file', 'error');
            return;
        }

        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const text = e.target?.result as string;
                const lines = text.split('\n');
                
                try {
                    // Skip header row and filter out empty lines
                    const medicinesWithStock = lines
                        .slice(1)
                        .filter(line => line.trim())
                        .map(line => {
                            const [name, description, manufacture, expDate, quantity, price] = line.split(',').map(field => field.trim());
                            
                            // Basic medicine data
                            const medicine = { name, description, manufacture };
                            
                            // Check if stock information is complete
                            const hasCompleteStockInfo = expDate && quantity && price;
                            
                            // If all stock fields are present, include stock information
                            if (hasCompleteStockInfo) {
                                try {
                                    // Convert and validate the date
                                    const isoDate = convertToISODate(expDate);
                                    
                                    // Validate date is not in the past
                                    const expDateObj = new Date(isoDate);
                                    if (expDateObj < new Date()) {
                                        throw new Error(`Expiration date for medicine "${name}" cannot be in the past`);
                                    }

                                    // Validate quantity and price
                                    const quantityNum = parseInt(quantity);
                                    const priceNum = parseFloat(price);

                                    if (isNaN(quantityNum) || quantityNum <= 0) {
                                        throw new Error(`Invalid quantity for medicine "${name}". Must be a positive number`);
                                    }

                                    if (isNaN(priceNum) || priceNum <= 0) {
                                        throw new Error(`Invalid price for medicine "${name}". Must be a positive number`);
                                    }

                                    return {
                                        medicine,
                                        stock: {
                                            expDate: isoDate,
                                            quantity: quantityNum,
                                            price: priceNum
                                        }
                                    };
                                } catch (error: any) {
                                    showToast(error.message, 'error');
                                    throw error;
                                }
                            }
                            
                            return { medicine };
                        })
                        .filter(item => {
                            if (!item.medicine.name || !item.medicine.description || !item.medicine.manufacture) {
                                showToast(`Missing required fields for medicine "${item.medicine.name || 'Unknown'}". Name, description, and manufacturer are required.`, 'error');
                                return false;
                            }
                            return true;
                        });

                    if (medicinesWithStock.length === 0) {
                        showToast('No valid data found in CSV. Please ensure the file follows the template format.', 'error');
                        return;
                    }

                    setIsSubmitting(true);
                    
                    // Process each medicine
                    const results = await Promise.all(
                        medicinesWithStock.map(async (item) => {
                            try {
                                if ('stock' in item && item.stock) {
                                    try {
                                        // First try to add medicine with stock
                                        const medicineWithStock: MedicineWithStock = {
                                            medicine: item.medicine,
                                            stock: item.stock
                                        };
                                        const response = await medicineApi.addMedicineWithStock(medicineWithStock);
                                        return { 
                                            success: true, 
                                            name: item.medicine.name,
                                            isNewMedicine: true,
                                            hasStock: true 
                                        };
                                    } catch (err: any) {
                                        // If error is "medicine already exists", try to add stock only
                                        if (err.response?.data?.message?.includes('already exists')) {
                                            try {
                                                // Search for the existing medicine
                                                const searchResult = await medicineApi.searchMedicines(item.medicine.name, 'contains');
                                                const existingMedicine = searchResult.find(m => 
                                                    m.name.toLowerCase() === item.medicine.name.toLowerCase()
                                                );

                                                if (existingMedicine) {
                                                    // Add stock to existing medicine
                                                    const medicineWithStock: MedicineWithStock = {
                                                        medicine: existingMedicine,
                                                        stock: item.stock
                                                    };
                                                    await medicineApi.addMedicineWithStock(medicineWithStock);
                                                    return {
                                                        success: true,
                                                        name: item.medicine.name,
                                                        isNewMedicine: false,
                                                        hasStock: true,
                                                        stockUpdated: true
                                                    };
                                                }
                                            } catch (stockErr: any) {
                                                return {
                                                    success: false,
                                                    name: item.medicine.name,
                                                    reason: `Failed to update stock: ${stockErr.response?.data?.message || stockErr.message}`
                                                };
                                            }
                                        }
                                        return {
                                            success: false,
                                            name: item.medicine.name,
                                            reason: err.response?.data?.message || err.message
                                        };
                                    }
                                } else {
                                    // Add medicine only
                                    const response = await medicineApi.addMedicine(item.medicine);
                                    return { 
                                        success: true, 
                                        name: item.medicine.name,
                                        isNewMedicine: true,
                                        hasStock: false 
                                    };
                                }
                            } catch (err: any) {
                                return {
                                    success: false,
                                    name: item.medicine.name,
                                    reason: err.response?.data?.message || 'Failed to add medicine'
                                };
                            }
                        })
                    );

                    // Process results
                    const successfulUploads = results.filter(r => r.success);
                    const failedUploads = results.filter(r => !r.success);

                    // Count different types of successful operations
                    const newMedicinesWithStock = successfulUploads.filter(r => r.isNewMedicine && r.hasStock).length;
                    const newMedicinesWithoutStock = successfulUploads.filter(r => r.isNewMedicine && !r.hasStock).length;
                    const stockUpdates = successfulUploads.filter(r => !r.isNewMedicine && (r.hasStock || r.stockUpdated)).length;

                    // Show results in order: success first, then failures
                    if (successfulUploads.length > 0) {
                        let successMessage = '';
                        if (newMedicinesWithStock > 0) {
                            successMessage += `${newMedicinesWithStock} new medicine${newMedicinesWithStock > 1 ? 's' : ''} added with stock. `;
                        }
                        if (newMedicinesWithoutStock > 0) {
                            successMessage += `${newMedicinesWithoutStock} new medicine${newMedicinesWithoutStock > 1 ? 's' : ''} added without stock. `;
                        }
                        if (stockUpdates > 0) {
                            successMessage += `Stock updated for ${stockUpdates} existing medicine${stockUpdates > 1 ? 's' : ''}.`;
                        }
                        if (successMessage.trim()) {
                            showToast(successMessage.trim(), 'success');
                        }
                    }

                    if (failedUploads.length > 0) {
                        const failureMessage = failedUploads
                            .map(f => `${f.name}: ${f.reason}`)
                            .join('\n');
                        showToast(`Failed uploads:\n${failureMessage}`, 'error');
                    }

                } catch (err: any) {
                    showToast(err.message || 'Error processing CSV file', 'error');
                } finally {
                    setIsSubmitting(false);
                    if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                    }
                }
            };

            reader.readAsText(file);
        } catch (err) {
            showToast('Error reading CSV file. Please ensure the file is properly formatted.', 'error');
        }
    };

    const downloadSampleCsv = () => {
        const csvContent = 'Name,Description,Manufacture,ExpirationDate,Quantity,Price\n' +
            'Paracetamol,Pain relief medicine,ABC Pharma,31-12-2025,100,5.99\n' +
            'Vitamin C,Immunity booster supplement,XYZ Healthcare,15-10-2024,50,12.50\n' +
            'Aspirin,Pain and fever reducer,MNO Pharmaceuticals,,,' // Example without stock info
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'medicine_template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    return (
        <Box sx={{ backgroundColor: theme.palette.background.default, minHeight: '100vh' }}>
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
                            Add New Medicine
                        </Typography>
                </Box>
            </Box>

            <Box sx={{ 
                maxWidth: 800, 
                mx: 'auto',
                p: 3,
            }}>
                <Collapse in={!!error}>
                    <Alert 
                        severity="error"
                        action={
                            <IconButton
                                aria-label="close"
                                color="inherit"
                                size="small"
                                onClick={() => setError(null)}
                            >
                                <CloseIcon fontSize="inherit" />
                            </IconButton>
                        }
                        sx={{ mb: 2 }}
                    >
                        {error}
                    </Alert>
                </Collapse>

                <Collapse in={showSuccess}>
                    <Alert 
                        severity="success"
                        action={
                            <IconButton
                                aria-label="close"
                                color="inherit"
                                size="small"
                                onClick={() => setShowSuccess(false)}
                            >
                                <CloseIcon fontSize="inherit" />
                            </IconButton>
                        }
                        sx={{ mb: 2 }}
                    >
                        {error ? 'Partially successful!' : 'Medicine added successfully!'}
                    </Alert>
                </Collapse>

                <Card sx={{ 
                    backgroundColor: theme.palette.background.paper,
                    boxShadow: theme.shadows[1],
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    mb: 3
                }}>
                    <CardContent sx={{ p: 3 }}>
                        <form onSubmit={handleSubmit}>
                            <Stack spacing={2.5}>
                                <Typography variant="subtitle1" color="primary" fontWeight="500">
                                    Medicine Information
                                </Typography>
                                
                                <TextField
                                    fullWidth
                                    required
                                    name="name"
                                    label="Medicine Name"
                                    value={medicine.name}
                                    onChange={handleMedicineChange}
                                    error={!!formErrors.name}
                                    helperText={formErrors.name}
                                    size="small"
                                    autoComplete="off"
                                    InputProps={{
                                        sx: {
                                            backgroundColor: 'transparent'
                                        }
                                    }}
                                />
                                
                                <TextField
                                    fullWidth
                                    name="description"
                                    label="Description"
                                    multiline
                                    rows={3}
                                    value={medicine.description}
                                    onChange={handleMedicineChange}
                                    error={!!formErrors.description}
                                    helperText={formErrors.description}
                                    size="small"
                                    autoComplete="off"
                                    InputProps={{
                                        sx: {
                                            backgroundColor: 'transparent'
                                        }
                                    }}
                                />
                                
                                <TextField
                                    fullWidth
                                    name="manufacture"
                                    label="Manufacturer"
                                    value={medicine.manufacture}
                                    onChange={handleMedicineChange}
                                    error={!!formErrors.manufacture}
                                    helperText={formErrors.manufacture}
                                    size="small"
                                    autoComplete="off"
                                    InputProps={{
                                        sx: {
                                            backgroundColor: 'transparent'
                                        }
                                    }}
                                />

                                <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    p: 2,
                                    mt: 1,
                                    borderRadius: 1,
                                    backgroundColor: alpha(theme.palette.primary.main, 0.02)
                                }}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={includeStock}
                                                onChange={(e) => setIncludeStock(e.target.checked)}
                                                color="primary"
                                                size="small"
                                            />
                                        }
                                        label={
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                Add Stock Information As Well
                                            </Typography>
                                        }
                                    />
                                    <Tooltip title="It will add the purchased stock as well for the medicine">
                                        <IconButton size="small" sx={{ ml: 1, color: theme.palette.text.secondary }}>
                                            <InfoIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Box>

                                {includeStock && (
                                    <>
                                        <Typography variant="subtitle1" color="primary" fontWeight="500" sx={{ pt: 1 }}>
                                            Stock Information
                                        </Typography>
                                        
                                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                                            <DatePicker
                                            label="Expiration Date"
                                                value={stock.expDate ? new Date(stock.expDate) : null}
                                                onChange={handleDateChange}
                                                slotProps={{
                                                    textField: {
                                                        fullWidth: true,
                                                        required: true,
                                                        error: !!formErrors.expDate,
                                                        helperText: formErrors.expDate,
                                                        size: "small",
                                                        sx: {
                                                            '& .MuiInputBase-root': {
                                                                backgroundColor: 'transparent'
                                                            },
                                                            '& .MuiPickersPopper-root': {
                                                                '& .MuiPaper-root': {
                                                                    boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.2)',
                                                                },
                                                                '& .MuiPickersDay-root': {
                                                                    fontSize: '1rem',
                                                                    width: '40px',
                                                                    height: '40px',
                                                                },
                                                                '& .MuiDayCalendar-weekDayLabel': {
                                                                    fontSize: '0.875rem',
                                                                    fontWeight: 600,
                                                                },
                                                                '& .MuiPickersCalendarHeader-label': {
                                                                    fontSize: '1.1rem',
                                                                    fontWeight: 600,
                                                                }
                                                            }
                                                        }
                                                    }
                                                }}
                                                sx={{
                                                    '& .MuiPickersCalendar-root': {
                                                        width: '320px',
                                                        height: '300px'
                                                }
                                            }}
                                        />
                                        </LocalizationProvider>
                                        
                                            <TextField
                                                fullWidth
                                                required
                                                type="number"
                                                name="quantity"
                                                label="Quantity"
                                                value={stock.quantity}
                                                onChange={handleStockChange}
                                                error={!!formErrors.quantity}
                                                helperText={formErrors.quantity}
                                                inputProps={{ min: "0" }}
                                                size="small"
                                                autoComplete="off"
                                                InputProps={{
                                                    sx: {
                                                        backgroundColor: 'transparent'
                                                    }
                                                }}
                                            />
                                            
                                            <TextField
                                                fullWidth
                                                required
                                                type="number"
                                                name="price"
                                                label="Price"
                                                value={stock.price}
                                                onChange={handleStockChange}
                                                error={!!formErrors.price}
                                                helperText={formErrors.price}
                                                inputProps={{ min: "0", step: "0.01" }}
                                                size="small"
                                                autoComplete="off"
                                                InputProps={{
                                                    sx: {
                                                        backgroundColor: 'transparent'
                                                    }
                                                }}
                                            />
                                    </>
                                )}
                                
                                <Box sx={{ 
                                    display: 'flex', 
                                    gap: 2, 
                                    justifyContent: 'flex-end',
                                    pt: 1 
                                }}>
                                    <Button
                                        variant="outlined"
                                        onClick={() => navigate('/')}
                                        sx={{
                                            minWidth: 100,
                                            py: 1,
                                            borderColor: alpha(theme.palette.primary.main, 0.5),
                                            color: theme.palette.primary.main,
                                            '&:hover': {
                                                borderColor: theme.palette.primary.main,
                                                backgroundColor: alpha(theme.palette.primary.main, 0.04)
                                            }
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        disabled={isSubmitting}
                                        sx={{
                                            minWidth: 100,
                                            py: 1,
                                            '&:hover': {
                                                transform: 'translateY(-1px)',
                                                boxShadow: '0 4px 8px rgba(37, 99, 235, 0.2)'
                                            },
                                            transition: 'all 0.2s ease-in-out'
                                        }}
                                    >
                                        {isSubmitting ? (
                                            <CircularProgress size={20} color="inherit" />
                                        ) : (
                                            'Add Medicine'
                                        )}
                                    </Button>
                                </Box>
                            </Stack>
                        </form>
                    </CardContent>
                </Card>

                <Divider sx={{ my: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                        OR BULK UPLOAD
                    </Typography>
                </Divider>

                <Card>
                    <CardContent>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            Bulk Upload Medicines
                        </Typography>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Button
                                variant="outlined"
                                startIcon={<UploadFileIcon />}
                                onClick={() => fileInputRef.current?.click()}
                                sx={{ 
                                    borderColor: alpha(theme.palette.primary.main, 0.5),
                                    '&:hover': {
                                        borderColor: theme.palette.primary.main,
                                        backgroundColor: alpha(theme.palette.primary.main, 0.04)
                                    }
                                }}
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
                                sx={{
                                    color: theme.palette.primary.main,
                                    '&:hover': {
                                        backgroundColor: alpha(theme.palette.primary.main, 0.04)
                                    }
                                }}
                            >
                                Download Template
                            </Button>
                        </Stack>
                        {uploadError && (
                            <Alert 
                                severity="error" 
                                sx={{ mt: 2 }}
                                action={
                                    <IconButton
                                        aria-label="close"
                                        color="inherit"
                                        size="small"
                                        onClick={() => setUploadError(null)}
                                    >
                                        <CloseIcon fontSize="inherit" />
                                    </IconButton>
                                }
                            >
                                {uploadError}
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            </Box>

            <Box
                sx={{
                    position: 'fixed',
                    top: theme.spacing(2),
                    right: theme.spacing(2),
                    zIndex: theme.zIndex.snackbar,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1
                }}
            >
                {toasts.map((toast) => (
                    <Snackbar
                        key={toast.id}
                        open={true}
                        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                        sx={{ position: 'relative', mt: 0 }}
                    >
                        <Alert
                            onClose={() => handleToastClose(toast.id)}
                            severity={toast.severity}
                            sx={{
                                width: '100%',
                                whiteSpace: 'pre-wrap',
                                boxShadow: theme.shadows[3]
                            }}
                            variant="filled"
                        >
                            {toast.message}
                        </Alert>
                    </Snackbar>
                ))}
            </Box>
        </Box>
    );
}; 