import React, { useState, useRef } from 'react';
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
    Divider
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

    const [medicine, setMedicine] = useState<Medicine>({
        name: '',
        description: '',
        manufacture: ''
    });
    const [stock, setStock] = useState<Stock>({
        expDate: '',
        quantity: 0,
        price: 0
    });

    const validateForm = (): boolean => {
        const errors: FormErrors = {};
        let isValid = true;

        if (!medicine.name.trim()) {
            errors.name = 'Medicine name is required';
            isValid = false;
        }

        if (!medicine.description.trim()) {
            errors.description = 'Description is required';
            isValid = false;
        }

        if (!medicine.manufacture.trim()) {
            errors.manufacture = 'Manufacturer is required';
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
            [name]: name === 'expDate' ? value : Number(value)
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

    const handleFocusInput = (e: React.FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (Number(value) === 0) {
            setStock(prev => ({
                ...prev,
                [name]: ''
            }));
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
            } else {
                await medicineApi.addMedicine(medicine);
            }
            setShowSuccess(true);
            setTimeout(() => {
                navigate('/');
            }, 2000);
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Failed to add medicine. Please try again.';
            setError(errorMessage);
            console.error('Error adding medicine:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Reset any previous errors
        setUploadError(null);
        setError(null);

        // Check if it's a CSV file
        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            setUploadError('Please upload a valid CSV file');
            return;
        }

        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const text = e.target?.result as string;
                const lines = text.split('\n');
                
                // Skip header row and filter out empty lines
                const medicines = lines
                    .slice(1)
                    .filter(line => line.trim())
                    .map(line => {
                        const [name, description, manufacture] = line.split(',').map(field => field.trim());
                        return { name, description, manufacture };
                    })
                    .filter(medicine => medicine.name && medicine.description && medicine.manufacture); // Ensure all fields are present

                if (medicines.length === 0) {
                    setUploadError('No valid data found in CSV. Please ensure the file follows the template format.');
                    return;
                }

                try {
                    setIsSubmitting(true);
                    const response = await medicineApi.addMedicines(medicines);
                    
                    if (response.totalFailed > 0) {
                        // Create a formatted message for partial success/failure
                        const successMessage = response.totalSuccess > 0 
                            ? `Successfully added ${response.totalSuccess} medicine${response.totalSuccess > 1 ? 's' : ''}.`
                            : '';
                        
                        const failureDetails = response.failedMedicines
                            .map(f => `• ${f.name}: ${f.reason}`)
                            .join('\n');

                        const message = `${successMessage}\n\n${response.totalFailed} medicine${response.totalFailed > 1 ? 's' : ''} failed to add:\n${failureDetails}`;
                        
                        if (response.totalSuccess > 0) {
                            // Show success for partial success
                            setShowSuccess(true);
                            // But also show the failure details
                            setError(message);
                            // Navigate after a delay only if there were some successes
                            setTimeout(() => {
                                navigate('/');
                            }, 3000);
                        } else {
                            // If nothing succeeded, just show the error
                            setError(message);
                        }
                    } else {
                        // Complete success
                        setShowSuccess(true);
                        setTimeout(() => {
                            navigate('/');
                        }, 2000);
                    }
                } catch (err: any) {
                    const errorMessage = err.response?.data?.message || 'Failed to upload medicines. Please try again.';
                    setError(errorMessage);
                    console.error('Error uploading medicines:', err);
                } finally {
                    setIsSubmitting(false);
                    // Reset file input
                    if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                    }
                }
            };

            reader.readAsText(file);
        } catch (err) {
            setUploadError('Error reading CSV file. Please ensure the file is properly formatted.');
            console.error('Error reading file:', err);
        }
    };

    const downloadSampleCsv = () => {
        const csvContent = 'Name,Description,Manufacture\nParacetamol,Pain relief medicine,ABC Pharma\nVitamin C,Immunity booster supplement,XYZ Healthcare';
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
                        sx={{ mb: 2 }}
                    >
                        Medicine added successfully! Redirecting to medicine list...
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
                                    required
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
                                    required
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
                                                onFocus={handleFocusInput}
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
                                                onFocus={handleFocusInput}
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
        </Box>
    );
}; 