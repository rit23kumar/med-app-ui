import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    TextField,
    Typography,
    useTheme,
    alpha,
    Alert,
    Collapse,
    IconButton,
    CircularProgress,
    Card,
    CardContent,
    Stack,
    Autocomplete,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Tooltip,
    InputAdornment
} from '@mui/material';
import { Medicine } from '../types/medicine';
import { CreateSaleRequest } from '../types/sale';
import { medicineApi, saleApi } from '../services/api';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

interface SaleItem {
    medicineId: number;
    medicineName: string;
    quantity: number;
    price: number;
    expDate: string;
}

interface FormErrors {
    customer?: string;
    medicine?: string;
    quantity?: string;
    price?: string;
    expDate?: string;
}

export const SellMedicine: React.FC = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
    const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
    const [customer, setCustomer] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [price, setPrice] = useState(0);
    const [expDate, setExpDate] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        fetchMedicines();
    }, []);

    const fetchMedicines = async () => {
        try {
            const response = await medicineApi.getAllMedicines();
            setMedicines(response.content);
        } catch (err) {
            setError('Failed to fetch medicines');
            console.error('Error fetching medicines:', err);
        }
    };

    const validateItemForm = (): boolean => {
        const errors: FormErrors = {};
        let isValid = true;

        if (!selectedMedicine) {
            errors.medicine = 'Medicine is required';
            isValid = false;
        }

        if (quantity <= 0) {
            errors.quantity = 'Quantity must be greater than 0';
            isValid = false;
        }

        if (price <= 0) {
            errors.price = 'Price must be greater than 0';
            isValid = false;
        }

        if (!expDate) {
            errors.expDate = 'Expiration date is required';
            isValid = false;
        }

        setFormErrors(errors);
        return isValid;
    };

    const handleAddItem = () => {
        if (!validateItemForm() || !selectedMedicine) return;

        const newItem: SaleItem = {
            medicineId: selectedMedicine.id!,
            medicineName: selectedMedicine.name,
            quantity,
            price,
            expDate
        };

        setSaleItems([...saleItems, newItem]);
        
        // Reset form
        setSelectedMedicine(null);
        setQuantity(1);
        setPrice(0);
        setExpDate('');
        setFormErrors({});
    };

    const handleRemoveItem = (index: number) => {
        setSaleItems(saleItems.filter((_, i) => i !== index));
    };

    const calculateTotal = () => {
        return saleItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const handleSubmit = async () => {
        if (saleItems.length === 0) {
            setError('Please add at least one item to the sale');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const saleRequest: CreateSaleRequest = {
                customer: customer || undefined,
                items: saleItems.map(item => ({
                    medicineId: item.medicineId,
                    quantity: item.quantity,
                    price: item.price,
                    expDate: item.expDate
                }))
            };

            await saleApi.createSale(saleRequest);
            setShowSuccess(true);
            setTimeout(() => {
                navigate('/');
            }, 2000);
        } catch (error) {
            setError('Failed to create sale. Please try again.');
            console.error('Error creating sale:', error);
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
                        Sell Medicine
                    </Typography>
                </Box>
            </Box>

            <Box sx={{
                maxWidth: 1000, 
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
                        Sale completed successfully! Redirecting to medicine list...
                    </Alert>
                </Collapse>

                <Card sx={{
                    backgroundColor: theme.palette.background.paper,
                    boxShadow: theme.shadows[1],
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                }}>
                    <CardContent sx={{ p: 3 }}>
                        <Stack spacing={2.5}>
                            <TextField
                                fullWidth
                                label="Customer Name (Optional)"
                                value={customer}
                                onChange={(e) => setCustomer(e.target.value)}
                                size="small"
                                InputProps={{
                                    sx: { backgroundColor: 'transparent' }
                                }}
                            />

                            <Box sx={{ 
                                p: 2, 
                                backgroundColor: alpha(theme.palette.primary.main, 0.02),
                                borderRadius: 1
                            }}>
                                <Typography variant="subtitle1" color="primary" fontWeight="500" sx={{ mb: 2 }}>
                                    Add Items
                                </Typography>
                                
                                <Stack spacing={2}>
                                    <Autocomplete
                                        options={medicines}
                                        getOptionLabel={(option) => option.name}
                                        value={selectedMedicine}
                                        onChange={(_, newValue) => setSelectedMedicine(newValue)}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Select Medicine"
                                                error={!!formErrors.medicine}
                                                helperText={formErrors.medicine}
                                                size="small"
                                            />
                                        )}
                                    />

                                    <Stack direction="row" spacing={2}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Quantity"
                                            value={quantity}
                                            onChange={(e) => setQuantity(Number(e.target.value))}
                                            error={!!formErrors.quantity}
                                            helperText={formErrors.quantity}
                                            size="small"
                                            InputProps={{
                                                sx: { backgroundColor: 'transparent' }
                                            }}
                                        />

                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Price"
                                            value={price}
                                            onChange={(e) => setPrice(Number(e.target.value))}
                                            error={!!formErrors.price}
                                            helperText={formErrors.price}
                                            size="small"
                                            InputProps={{
                                                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                                sx: { backgroundColor: 'transparent' }
                                            }}
                                        />

                                        <TextField
                                            fullWidth
                                            type="date"
                                            label="Expiration Date"
                                            value={expDate}
                                            onChange={(e) => setExpDate(e.target.value)}
                                            error={!!formErrors.expDate}
                                            helperText={formErrors.expDate}
                                            InputLabelProps={{ shrink: true }}
                                            size="small"
                                            InputProps={{
                                                sx: { backgroundColor: 'transparent' }
                                            }}
                                        />
                                    </Stack>

                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <Button
                                            variant="contained"
                                            onClick={handleAddItem}
                                            startIcon={<AddIcon />}
                                            sx={{
                                                px: 3,
                                                py: 1,
                                                '&:hover': {
                                                    transform: 'translateY(-1px)',
                                                    boxShadow: '0 4px 8px rgba(37, 99, 235, 0.2)'
                                                },
                                                transition: 'all 0.2s ease-in-out'
                                            }}
                                        >
                                            Add Item
                                        </Button>
                                    </Box>
                                </Stack>
                            </Box>

                            {saleItems.length > 0 && (
                                <TableContainer component={Paper} sx={{ mt: 2 }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Medicine</TableCell>
                                                <TableCell align="right">Quantity</TableCell>
                                                <TableCell align="right">Price</TableCell>
                                                <TableCell align="right">Total</TableCell>
                                                <TableCell align="right">Exp. Date</TableCell>
                                                <TableCell align="center">Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {saleItems.map((item, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{item.medicineName}</TableCell>
                                                    <TableCell align="right">{item.quantity}</TableCell>
                                                    <TableCell align="right">${item.price}</TableCell>
                                                    <TableCell align="right">
                                                        ${(item.quantity * item.price).toFixed(2)}
                                                    </TableCell>
                                                    <TableCell align="right">{item.expDate}</TableCell>
                                                    <TableCell align="center">
                                                        <Tooltip title="Remove Item">
                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={() => handleRemoveItem(index)}
                                                            >
                                                                <DeleteIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow>
                                                <TableCell colSpan={3} align="right" sx={{ fontWeight: 600 }}>
                                                    Total Amount:
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 600 }}>
                                                    ${calculateTotal().toFixed(2)}
                                                </TableCell>
                                                <TableCell colSpan={2} />
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
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
                                    variant="contained"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || saleItems.length === 0}
                                    startIcon={isSubmitting ? undefined : <ShoppingCartIcon />}
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
                                        'Complete Sale'
                                    )}
                                </Button>
                            </Box>
                        </Stack>
                    </CardContent>
                </Card>
            </Box>
        </Box>
    );
}; 