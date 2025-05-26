import React, { useState } from 'react';
import {
    Box,
    Button,
    TextField,
    Typography,
    Grid as MuiGrid,
    Switch,
    FormControlLabel,
    useTheme,
    alpha,
    Alert,
    Collapse,
    IconButton,
    Stepper,
    Step,
    StepLabel,
    CircularProgress,
    Divider,
    Card,
    CardContent,
    Fade,
    Tooltip
} from '@mui/material';
import { Medicine, MedicineWithStock, Stock } from '../types/medicine';
import { medicineApi } from '../services/api';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const Grid = MuiGrid as any;

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
    const [activeStep, setActiveStep] = useState(0);
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
        // Clear error when user types
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
        // Clear error when user types
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

    const steps = ['Basic Information', 'Stock Details (Optional)', 'Review'];

    const handleNext = () => {
        if (activeStep === 0 && !validateBasicInfo()) return;
        if (activeStep === 1 && includeStock && !validateStockInfo()) return;
        setActiveStep((prevStep) => prevStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevStep) => prevStep - 1);
    };

    const validateBasicInfo = () => {
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

        setFormErrors(errors);
        return isValid;
    };

    const validateStockInfo = () => {
        const errors: FormErrors = {};
        let isValid = true;

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

    const renderStepContent = (step: number) => {
        switch (step) {
            case 0:
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                required
                                name="name"
                                label="Medicine Name"
                                value={medicine.name}
                                onChange={handleMedicineChange}
                                error={!!formErrors.name}
                                helperText={formErrors.name}
                                InputProps={{
                                    sx: {
                                        backgroundColor: '#ffffff',
                                        '&:hover': {
                                            backgroundColor: alpha(theme.palette.primary.main, 0.01)
                                        },
                                        '&.Mui-focused': {
                                            backgroundColor: '#ffffff'
                                        }
                                    }
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        '&.Mui-focused fieldset': {
                                            borderColor: theme.palette.primary.main,
                                            borderWidth: '2px'
                                        }
                                    },
                                    '& .MuiInputLabel-root.Mui-focused': {
                                        color: theme.palette.primary.main
                                    }
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
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
                                InputProps={{
                                    sx: {
                                        backgroundColor: '#ffffff',
                                        '&:hover': {
                                            backgroundColor: alpha(theme.palette.primary.main, 0.01)
                                        },
                                        '&.Mui-focused': {
                                            backgroundColor: '#ffffff'
                                        }
                                    }
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        '&.Mui-focused fieldset': {
                                            borderColor: theme.palette.primary.main,
                                            borderWidth: '2px'
                                        }
                                    },
                                    '& .MuiInputLabel-root.Mui-focused': {
                                        color: theme.palette.primary.main
                                    }
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                required
                                name="manufacture"
                                label="Manufacturer"
                                value={medicine.manufacture}
                                onChange={handleMedicineChange}
                                error={!!formErrors.manufacture}
                                helperText={formErrors.manufacture}
                                InputProps={{
                                    sx: {
                                        backgroundColor: '#ffffff',
                                        '&:hover': {
                                            backgroundColor: alpha(theme.palette.primary.main, 0.01)
                                        },
                                        '&.Mui-focused': {
                                            backgroundColor: '#ffffff'
                                        }
                                    }
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        '&.Mui-focused fieldset': {
                                            borderColor: theme.palette.primary.main,
                                            borderWidth: '2px'
                                        }
                                    },
                                    '& .MuiInputLabel-root.Mui-focused': {
                                        color: theme.palette.primary.main
                                    }
                                }}
                            />
                        </Grid>
                    </Grid>
                );
            case 1:
                return (
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                mb: 2,
                                p: 2,
                                borderRadius: 1,
                                backgroundColor: alpha(theme.palette.primary.main, 0.02)
                            }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={includeStock}
                                            onChange={(e) => setIncludeStock(e.target.checked)}
                                            color="primary"
                                        />
                                    }
                                    label={
                                        <Typography sx={{ fontWeight: 500, color: theme.palette.text.primary }}>
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
                        </Grid>
                        {includeStock && (
                            <>
                                <Grid item xs={12}>
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
                                        InputProps={{
                                            sx: {
                                                backgroundColor: '#ffffff',
                                                '&:hover': {
                                                    backgroundColor: alpha(theme.palette.primary.main, 0.01)
                                                },
                                                '&.Mui-focused': {
                                                    backgroundColor: '#ffffff'
                                                }
                                            }
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                '&.Mui-focused fieldset': {
                                                    borderColor: theme.palette.primary.main,
                                                    borderWidth: '2px'
                                                }
                                            },
                                            '& .MuiInputLabel-root.Mui-focused': {
                                                color: theme.palette.primary.main
                                            }
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
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
                                        InputProps={{
                                            sx: {
                                                backgroundColor: '#ffffff',
                                                '&:hover': {
                                                    backgroundColor: alpha(theme.palette.primary.main, 0.01)
                                                },
                                                '&.Mui-focused': {
                                                    backgroundColor: '#ffffff'
                                                }
                                            }
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                '&.Mui-focused fieldset': {
                                                    borderColor: theme.palette.primary.main,
                                                    borderWidth: '2px'
                                                }
                                            },
                                            '& .MuiInputLabel-root.Mui-focused': {
                                                color: theme.palette.primary.main
                                            }
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
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
                                        InputProps={{
                                            sx: {
                                                backgroundColor: '#ffffff',
                                                '&:hover': {
                                                    backgroundColor: alpha(theme.palette.primary.main, 0.01)
                                                },
                                                '&.Mui-focused': {
                                                    backgroundColor: '#ffffff'
                                                }
                                            }
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                '&.Mui-focused fieldset': {
                                                    borderColor: theme.palette.primary.main,
                                                    borderWidth: '2px'
                                                }
                                            },
                                            '& .MuiInputLabel-root.Mui-focused': {
                                                color: theme.palette.primary.main
                                            }
                                        }}
                                    />
                                </Grid>
                            </>
                        )}
                    </Grid>
                );
            case 2:
                return (
                    <Box>
                        <Card variant="outlined" sx={{ mb: 3, borderColor: alpha(theme.palette.primary.main, 0.1) }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" gutterBottom color="primary" fontWeight="600">
                                    Medicine Details
                                </Typography>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} sm={4}>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            Name
                                        </Typography>
                                        <Typography variant="body1" fontWeight="500">
                                            {medicine.name}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            Manufacturer
                                        </Typography>
                                        <Typography variant="body1" fontWeight="500">
                                            {medicine.manufacture}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            Description
                                        </Typography>
                                        <Typography variant="body1">
                                            {medicine.description}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>

                        {includeStock && (
                            <Card variant="outlined" sx={{ borderColor: alpha(theme.palette.primary.main, 0.1) }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Typography variant="h6" gutterBottom color="primary" fontWeight="600">
                                        Stock Information
                                    </Typography>
                                    <Grid container spacing={3}>
                                        <Grid item xs={12} sm={4}>
                                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                Expiration Date
                                            </Typography>
                                            <Typography variant="body1" fontWeight="500">
                                                {new Date(stock.expDate).toLocaleDateString()}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={4}>
                                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                Quantity
                                            </Typography>
                                            <Typography variant="body1" fontWeight="500">
                                                {stock.quantity} units
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={4}>
                                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                Price
                                            </Typography>
                                            <Typography variant="body1" fontWeight="500">
                                                ${stock.price}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        )}
                    </Box>
                );
            default:
                return null;
        }
    };

    return (
        <Box sx={{ backgroundColor: theme.palette.background.default, minHeight: '100vh' }}>
            <Box 
                sx={{ 
                    p: 4,
                    borderBottom: 1,
                    borderColor: 'divider',
                    backgroundColor: '#ffffff',
                    boxShadow: theme.shadows[1],
                }}
            >
                <Box sx={{ 
                    maxWidth: 1200, 
                    mx: 'auto',
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2 
                }}>
                    <IconButton 
                        onClick={() => navigate('/')}
                        sx={{ 
                            backgroundColor: alpha(theme.palette.primary.main, 0.04),
                            '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.08)
                            }
                        }}
                    >
                        <ArrowBackIcon />
                    </IconButton>
                    <Box>
                        <Typography variant="h4" component="h1" color="primary" fontWeight="bold">
                            Add New Medicine
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                            Fill in the details below to add a new medicine to the inventory
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <Box sx={{ 
                maxWidth: 1200, 
                mx: 'auto',
                p: 4,
            }}>
                <Collapse in={!!error}>
                    <Alert 
                        severity="error"
                        variant="filled"
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
                        sx={{ mb: 3 }}
                    >
                        {error}
                    </Alert>
                </Collapse>

                <Collapse in={showSuccess}>
                    <Alert 
                        icon={<CheckCircleIcon fontSize="inherit" />}
                        severity="success"
                        variant="filled"
                        sx={{ mb: 3 }}
                    >
                        Medicine added successfully! Redirecting to medicine list...
                    </Alert>
                </Collapse>

                <Card sx={{ 
                    backgroundColor: '#ffffff',
                    boxShadow: theme.shadows[1],
                    border: 'none'
                }}>
                    <CardContent sx={{ p: 4 }}>
                        <Stepper 
                            activeStep={activeStep} 
                            sx={{ 
                                mb: 5,
                                '& .MuiStepLabel-root .Mui-completed': {
                                    color: theme.palette.primary.main,
                                },
                                '& .MuiStepLabel-root .Mui-active': {
                                    color: theme.palette.primary.main,
                                },
                            }}
                        >
                            {steps.map((label) => (
                                <Step key={label}>
                                    <StepLabel>{label}</StepLabel>
                                </Step>
                            ))}
                        </Stepper>

                        <form onSubmit={handleSubmit}>
                            <Box sx={{ 
                                mt: 2, 
                                mb: 4,
                                '& .MuiTextField-root': { mb: 3 },
                                '& .MuiFormControlLabel-root': { mb: 2 }
                            }}>
                                {renderStepContent(activeStep)}
                            </Box>

                            <Divider sx={{ my: 4 }} />

                            <Box sx={{ 
                                display: 'flex', 
                                gap: 2, 
                                justifyContent: 'flex-end',
                                '& .MuiButton-root': {
                                    minWidth: 120,
                                }
                            }}>
                                <Button
                                    variant="outlined"
                                    onClick={activeStep === 0 ? () => navigate('/') : handleBack}
                                    sx={{
                                        borderColor: theme.palette.primary.main,
                                        color: theme.palette.primary.main,
                                        '&:hover': {
                                            borderColor: theme.palette.primary.dark,
                                            backgroundColor: alpha(theme.palette.primary.main, 0.04)
                                        }
                                    }}
                                >
                                    {activeStep === 0 ? 'Cancel' : 'Back'}
                                </Button>
                                {activeStep === steps.length - 1 ? (
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        disabled={isSubmitting}
                                        sx={{
                                            backgroundColor: theme.palette.primary.main,
                                            color: '#ffffff',
                                            '&:hover': {
                                                backgroundColor: theme.palette.primary.dark,
                                                transform: 'translateY(-1px)',
                                                boxShadow: theme.shadows[2]
                                            },
                                            transition: 'all 0.2s ease-in-out'
                                        }}
                                    >
                                        {isSubmitting ? (
                                            <CircularProgress size={24} color="inherit" />
                                        ) : (
                                            'Add Medicine'
                                        )}
                                    </Button>
                                ) : (
                                    <Button
                                        variant="contained"
                                        onClick={handleNext}
                                        sx={{
                                            backgroundColor: theme.palette.primary.main,
                                            color: '#ffffff',
                                            '&:hover': {
                                                backgroundColor: theme.palette.primary.dark,
                                                transform: 'translateY(-1px)',
                                                boxShadow: theme.shadows[2]
                                            },
                                            transition: 'all 0.2s ease-in-out'
                                        }}
                                    >
                                        Next
                                    </Button>
                                )}
                            </Box>
                        </form>
                    </CardContent>
                </Card>
            </Box>
        </Box>
    );
}; 