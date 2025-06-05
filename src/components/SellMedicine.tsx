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
    Grid,
    Snackbar
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
import { format, differenceInDays } from 'date-fns';

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
                newSelected[batch.id] = { batch, quantity: null as unknown as number };
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
        const batch = availableBatches.find(b => b.id === batchId);
        if (!batch || !selectedMedicine) return;

        // Calculate existing quantity for this batch from already added items
        const existingQuantity = sellItems
            .filter(item => item.medicineId === selectedMedicine.id && item.batchId === batchId)
            .reduce((sum, item) => sum + item.quantity, 0);

        // Validate against available quantity including existing items
        const totalQuantity = existingQuantity + value;
        if (totalQuantity > batch.availableQuantity) {
            setFormErrors(prev => ({
                ...prev,
                quantities: {
                    ...prev.quantities,
                    [batchId]: `Total quantity (${totalQuantity}) exceeds available stock (${batch.availableQuantity})`
                }
            }));
            return;
        }

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

        // Check if any of these items are already in the list
        const existingQuantities = sellItems
            .filter(item => item.medicineId === selectedMedicine.id)
            .reduce((acc, item) => {
                const batchTotal = acc[item.batchId] || 0;
                return {
                    ...acc,
                    [item.batchId]: batchTotal + item.quantity
                };
            }, {} as { [key: number]: number });

        // Validate total quantities for each batch
        let hasQuantityError = false;
        Object.values(selectedBatches).forEach(({ batch, quantity }) => {
            const existingQuantity = existingQuantities[batch.id] || 0;
            const totalQuantity = existingQuantity + quantity;
            
            if (totalQuantity > batch.availableQuantity) {
                setFormErrors(prev => ({
                    ...prev,
                    quantities: {
                        ...prev.quantities,
                        [batch.id]: `Total quantity (${totalQuantity}) exceeds available stock (${batch.availableQuantity})`
                    }
                }));
                hasQuantityError = true;
            }
        });

        if (hasQuantityError) {
            return;
        }

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
            // Reset form
            setsellItems([]);
            setCustomer('');
            setSelectedMedicine(null);
            setSelectedBatches({});
            
            // Hide success message after 2 seconds
            setTimeout(() => {
                setShowSuccess(false);
            }, 2000);
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 
                               error.response?.data?.error || 
                               error.message || 
                               'Failed to create sell. Please try again.';
            setError(errorMessage);
            console.error('Error creating sell:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getRemainingDays = (expDate: string) => {
        const today = new Date();
        const expiryDate = new Date(expDate);
        return differenceInDays(expiryDate, today);
    };

    const getExpiryColor = (remainingDays: number) => {
        if (remainingDays < 0) return 'error.main';
        if (remainingDays < 30) return 'error.main';
        if (remainingDays <= 90) return 'warning.main';
        return 'success.main';
    };

    const formatExpiryText = (expDate: string) => {
        const remainingDays = getRemainingDays(expDate);
        const formattedDate = format(new Date(expDate), 'MMM dd, yyyy');
        
        if (remainingDays < 0) {
            return `Expiry: ${formattedDate} (Expired ${Math.abs(remainingDays)} days ago)`;
        }
        return `Expiry: ${formattedDate} (${remainingDays} Days Remaining)`;
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Sell Medicine
            </Typography>

            {/* Add Item Section */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h5" gutterBottom>
                    Add Items to Cart
                </Typography>
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
                                    error={!!formErrors.medicine}
                                    helperText={formErrors.medicine}
                                    autoComplete="off"
                                />
                            )}
                        />
                    </Grid>

                    {selectedMedicine && availableBatches.length > 0 && (
                        <Grid item xs={12}>
                            <Paper variant="outlined" sx={{ p: 2 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Available Batches
                                </Typography>
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell padding="checkbox">Select</TableCell>
                                                <TableCell>Expiry Date</TableCell>
                                                <TableCell>Available</TableCell>
                                                <TableCell>Price</TableCell>
                                                <TableCell>Quantity</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {availableBatches.map((batch) => (
                                                <TableRow key={batch.id}>
                                                    <TableCell padding="checkbox">
                                                        <Checkbox
                                                            checked={!!selectedBatches[batch.id]}
                                                            onChange={() => handleBatchToggle(batch)}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography
                                                            sx={{
                                                                color: getExpiryColor(getRemainingDays(batch.expDate))
                                                            }}
                                                        >
                                                            {formatExpiryText(batch.expDate)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>{batch.availableQuantity}</TableCell>
                                                    <TableCell>₹{batch.price}</TableCell>
                                                    <TableCell>
                                                        {selectedBatches[batch.id] && (
                                                            <TextField
                                                                type="number"
                                                                size="small"
                                                                value={selectedBatches[batch.id].quantity || ''}
                                                                onChange={(e) => handleQuantityChange(batch.id, parseInt(e.target.value) || 0)}
                                                                error={!!formErrors.quantities?.[batch.id]}
                                                                helperText={formErrors.quantities?.[batch.id]}
                                                                inputProps={{ min: 1, max: batch.availableQuantity }}
                                                                sx={{ width: 100 }}
                                                            />
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>
                        </Grid>
                    )}

                    <Grid item xs={12}>
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                            <Button
                                variant="outlined"
                                onClick={() => {
                                    setSelectedMedicine(null);
                                    setSelectedBatches({});
                                }}
                            >
                                Reset
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={handleAddItem}
                                disabled={!selectedMedicine || Object.keys(selectedBatches).length === 0}
                            >
                                Add to Cart
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {/* Cart Section */}
            {sellItems.length > 0 && (
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h5" gutterBottom>
                        Cart Items
                    </Typography>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Medicine</TableCell>
                                    <TableCell>Expiry Date</TableCell>
                                    <TableCell>Quantity</TableCell>
                                    <TableCell>Price</TableCell>
                                    <TableCell>Total</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sellItems.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{item.medicineName}</TableCell>
                                        <TableCell>
                                            <Typography
                                                sx={{
                                                    color: getExpiryColor(getRemainingDays(item.expDate))
                                                }}
                                            >
                                                {formatExpiryText(item.expDate)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                        <TableCell>₹{item.price}</TableCell>
                                        <TableCell>₹{item.quantity * item.price}</TableCell>
                                        <TableCell>
                                            <IconButton
                                                color="error"
                                                onClick={() => handleRemoveItem(index)}
                                                size="small"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <TextField
                            label="Customer Name (Optional)"
                            value={customer}
                            onChange={(e) => setCustomer(e.target.value)}
                            size="small"
                            sx={{ width: 300 }}
                        />
                        <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="h6" gutterBottom>
                                Total: ₹{calculateTotal()}
                            </Typography>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<ShoppingCartIcon />}
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? <CircularProgress size={24} /> : 'Complete Sale'}
                            </Button>
                        </Box>
                    </Box>
                </Paper>
            )}

            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={() => setError(null)}
            >
                <Alert
                    onClose={() => setError(null)}
                    severity="error"
                    sx={{ width: '100%' }}
                >
                    {error}
                </Alert>
            </Snackbar>

            <Snackbar
                open={showSuccess}
                autoHideDuration={6000}
                onClose={() => setShowSuccess(false)}
            >
                <Alert
                    onClose={() => setShowSuccess(false)}
                    severity="success"
                    sx={{ width: '100%' }}
                >
                    Sale completed successfully!
                </Alert>
            </Snackbar>
        </Box>
    );
}; 