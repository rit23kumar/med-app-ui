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
    InputAdornment,
    Checkbox,
    FormControlLabel,
    Grid
} from '@mui/material';
import { Medicine, StockHistory } from '../types/medicine';
import { CreateSellRequest } from '../types/sell';
import { medicineApi, sellApi } from '../services/api';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { format } from 'date-fns';

interface sellItem {
    medicineId: number;
    medicineName: string;
    quantity: number;
    price: number;
    expDate: string;
    batchId: number;
}

interface FormErrors {
    customer?: string;
    medicine?: string;
    quantities?: { [key: number]: string };
}

interface SelectedBatchQuantity {
    batch: StockHistory;
    quantity: number;
}

export const SellMedicine: React.FC = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
    const [sellItems, setsellItems] = useState<sellItem[]>([]);
    const [customer, setCustomer] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [availableBatches, setAvailableBatches] = useState<StockHistory[]>([]);
    const [selectedBatches, setSelectedBatches] = useState<{ [key: number]: SelectedBatchQuantity }>({});

    useEffect(() => {
        fetchMedicines();
    }, []);

    useEffect(() => {
        if (selectedMedicine?.id) {
            loadAvailableBatches(selectedMedicine.id);
        } else {
            setAvailableBatches([]);
            setSelectedBatches({});
        }
    }, [selectedMedicine]);

    const fetchMedicines = async () => {
        try {
            const response = await medicineApi.getAllMedicines();
            setMedicines(response.content);
        } catch (err) {
            setError('Failed to fetch medicines');
            console.error('Error fetching medicines:', err);
        }
    };

    const loadAvailableBatches = async (medicineId: number) => {
        try {
            const history = await medicineApi.getStockHistory(medicineId, false);
            // Filter out batches with zero available quantity
            const availableBatches = history.filter(batch => batch.availableQuantity > 0);
            setAvailableBatches(availableBatches);
        } catch (err) {
            setError('Failed to fetch available batches');
            console.error('Error fetching batches:', err);
        }
    };

    const handleBatchToggle = (batch: StockHistory) => {
        setSelectedBatches(prev => {
            const newSelected = { ...prev };
            if (newSelected[batch.id]) {
                delete newSelected[batch.id];
            } else {
                newSelected[batch.id] = { batch, quantity: 0 };
            }
            return newSelected;
        });
        // Clear any errors for this batch
        setFormErrors(prev => ({
            ...prev,
            quantities: {
                ...prev.quantities,
                [batch.id]: ''
            }
        }));
    };

    const handleQuantityChange = (batchId: number, value: number) => {
        setSelectedBatches(prev => ({
            ...prev,
            [batchId]: {
                ...prev[batchId],
                quantity: value
            }
        }));
        // Clear any errors for this batch
        setFormErrors(prev => ({
            ...prev,
            quantities: {
                ...prev.quantities,
                [batchId]: ''
            }
        }));
    };

    const validateItemForm = (): boolean => {
        const errors: FormErrors = {
            quantities: {}
        };
        let isValid = true;

        if (!selectedMedicine) {
            errors.medicine = 'Medicine is required';
            isValid = false;
        }

        const selectedBatchIds = Object.keys(selectedBatches);
        if (selectedBatchIds.length === 0) {
            errors.medicine = 'Please select at least one batch';
            isValid = false;
        }

        selectedBatchIds.forEach(batchId => {
            const { batch, quantity } = selectedBatches[Number(batchId)];
            if (quantity <= 0) {
                errors.quantities![batch.id] = 'Quantity must be greater than 0';
                isValid = false;
            } else if (quantity > batch.availableQuantity) {
                errors.quantities![batch.id] = `Maximum available quantity is ${batch.availableQuantity}`;
                isValid = false;
            }
        });

        setFormErrors(errors);
        return isValid;
    };

    const handleAddItem = () => {
        if (!validateItemForm() || !selectedMedicine) return;

        const newItems: sellItem[] = Object.values(selectedBatches).map(({ batch, quantity }) => ({
            medicineId: selectedMedicine.id!,
            medicineName: selectedMedicine.name,
            quantity,
            price: batch.price,
            expDate: batch.expDate,
            batchId: batch.id
        }));

        setsellItems([...sellItems, ...newItems]);
        
        // Reset form
        setSelectedMedicine(null);
        setSelectedBatches({});
        setFormErrors({});
    };

    const handleRemoveItem = (index: number) => {
        setsellItems(sellItems.filter((_, i) => i !== index));
    };

    const calculateTotal = () => {
        return sellItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const handleSubmit = async () => {
        if (sellItems.length === 0) {
            setError('Please add at least one item to the sell');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const sellRequest: CreateSellRequest = {
                customer: customer || undefined,
                items: sellItems.map(item => ({
                    medicineId: item.medicineId,
                    quantity: item.quantity,
                    price: item.price,
                    expDate: item.expDate
                }))
            };

            await sellApi.createsell(sellRequest);
            setShowSuccess(true);
            setTimeout(() => {
                navigate('/');
            }, 2000);
        } catch (error) {
            setError('Failed to create sell. Please try again.');
            console.error('Error creating sell:', error);
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
                        sell completed successfully! Redirecting to medicine list...
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
                                autoComplete="off"
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

                                    {selectedMedicine && availableBatches.length > 0 && (
                                        <Paper variant="outlined" sx={{ p: 2 }}>
                                            <Typography variant="subtitle2" gutterBottom>
                                                Available Batches
                                            </Typography>
                                            <Stack spacing={2}>
                                                {availableBatches.map((batch) => (
                                                    <Box key={batch.id}>
                                                        <FormControlLabel
                                                            control={
                                                                <Checkbox
                                                                    checked={!!selectedBatches[batch.id]}
                                                                    onChange={() => handleBatchToggle(batch)}
                                                                    size="small"
                                                                />
                                                            }
                                                            label={
                                                                <Box>
                                                                    <Typography variant="body2">
                                                                        Expiry: {format(new Date(batch.expDate), 'MMM dd, yyyy')}
                                                                    </Typography>
                                                                    <Typography variant="body2" color="textSecondary">
                                                                        Available: {batch.availableQuantity} | Price: ₹{batch.price}
                                                                    </Typography>
                                                                </Box>
                                                            }
                                                        />
                                                        {selectedBatches[batch.id] && (
                                                            <Box sx={{ ml: 4, mt: 1 }}>
                                                                <TextField
                                                                    type="number"
                                                                    label="Quantity"
                                                                    value={selectedBatches[batch.id].quantity}
                                                                    onChange={(e) => handleQuantityChange(batch.id, Number(e.target.value))}
                                                                    error={!!formErrors.quantities?.[batch.id]}
                                                                    helperText={formErrors.quantities?.[batch.id]}
                                                                    size="small"
                                                                    autoComplete="off"
                                                                    InputProps={{
                                                                        inputProps: { min: 1, max: batch.availableQuantity },
                                                                        sx: { backgroundColor: 'transparent' }
                                                                    }}
                                                                />
                                                            </Box>
                                                        )}
                                                    </Box>
                                                ))}
                                            </Stack>
                                        </Paper>
                                    )}

                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <Button
                                            variant="contained"
                                            onClick={handleAddItem}
                                            startIcon={<AddIcon />}
                                            disabled={!selectedMedicine || Object.keys(selectedBatches).length === 0}
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

                            {sellItems.length > 0 && (
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
                                            {sellItems.map((item, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{item.medicineName}</TableCell>
                                                    <TableCell align="right">{item.quantity}</TableCell>
                                                    <TableCell align="right">₹{item.price}</TableCell>
                                                    <TableCell align="right">
                                                        ₹{(item.quantity * item.price).toFixed(2)}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        {format(new Date(item.expDate), 'MMM dd, yyyy')}
                                                    </TableCell>
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
                                                    ₹{calculateTotal().toFixed(2)}
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
                                    disabled={isSubmitting || sellItems.length === 0}
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
                                        'Complete sell'
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