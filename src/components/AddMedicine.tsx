import React, { useState } from 'react';
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
    Stack
} from '@mui/material';
import { Medicine, MedicineWithStock, Stock } from '../types/medicine';
import { medicineApi } from '../services/api';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/Info';

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
    const [includeStock, setIncludeStock] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [formErrors, setFormErrors] = useState<FormErrors>({});

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
        } catch (error) {
            setError('Failed to add medicine. Please try again.');
            console.error('Error adding medicine:', error);
        } finally {
            setIsSubmitting(false);
        }
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
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
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
                                                Add Stock Information
                                            </Typography>
                                        }
                                    />
                                    <Tooltip title="Adding stock information allows you to track inventory and set prices">
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
                                        
                                        <TextField
                                            fullWidth
                                            required
                                            type="date"
                                            name="expDate"
                                            label="Expiration Date"
                                            value={stock.expDate}
                                            onChange={handleStockChange}
                                            error={!!formErrors.expDate}
                                            helperText={formErrors.expDate}
                                            InputLabelProps={{ shrink: true }}
                                            size="small"
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
                                            name="quantity"
                                            label="Quantity"
                                            value={stock.quantity}
                                            onChange={handleStockChange}
                                            error={!!formErrors.quantity}
                                            helperText={formErrors.quantity}
                                            inputProps={{ min: "0" }}
                                            size="small"
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
            </Box>
        </Box>
    );
}; 