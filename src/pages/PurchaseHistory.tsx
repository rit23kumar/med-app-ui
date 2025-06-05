import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Grid,
    Alert,
    CircularProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import { getPurchaseHistory } from '../services/historyService';
import { MedStock } from '../types';

const PurchaseHistory: React.FC = () => {
    const today = new Date();
    const [fromDate, setFromDate] = useState<Date>(today);
    const [toDate, setToDate] = useState<Date>(today);
    const [purchases, setPurchases] = useState<MedStock[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async () => {
        if (fromDate && toDate) {
            try {
                setLoading(true);
                setError(null);
                const formattedFromDate = format(fromDate, 'yyyy-MM-dd');
                const formattedToDate = format(toDate, 'yyyy-MM-dd');
                const data = await getPurchaseHistory(formattedFromDate, formattedToDate);
                setPurchases(Array.isArray(data) ? data : []);
            } catch (err) {
                setError('Failed to fetch purchase history');
                console.error('Error fetching purchase history:', err);
                setPurchases([]);
            } finally {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        handleSearch();
    }, []); // Load data on component mount

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Purchase History
                </Typography>

                <Paper sx={{ p: 2, mb: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={4}>
                            <DatePicker
                                label="From Date"
                                value={fromDate}
                                onChange={(newValue) => {
                                    setFromDate(newValue || today);
                                    if (newValue && toDate) {
                                        handleSearch();
                                    }
                                }}
                                format="dd/MM/yy"
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <DatePicker
                                label="To Date"
                                value={toDate}
                                onChange={(newValue) => {
                                    setToDate(newValue || today);
                                    if (fromDate && newValue) {
                                        handleSearch();
                                    }
                                }}
                                format="dd/MM/yy"
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Button
                                variant="contained"
                                onClick={handleSearch}
                                disabled={!fromDate || !toDate || loading}
                            >
                                {loading ? <CircularProgress size={24} /> : 'Search'}
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Date</TableCell>
                                <TableCell>Medicine</TableCell>
                                <TableCell>Quantity</TableCell>
                                <TableCell>Price</TableCell>
                                <TableCell>Expiry Date</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">
                                        <CircularProgress />
                                    </TableCell>
                                </TableRow>
                            ) : purchases.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">
                                        No purchase records found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                purchases.map((purchase) => (
                                    <TableRow key={purchase.id}>
                                        <TableCell>{format(new Date(purchase.createdAt), 'dd/MM/yy')}</TableCell>
                                        <TableCell>{purchase.medicine.name}</TableCell>
                                        <TableCell>{purchase.quantity}</TableCell>
                                        <TableCell>₹{purchase.price.toFixed(2)}</TableCell>
                                        <TableCell>{format(new Date(purchase.expDate), 'dd/MM/yy')}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Container>
        </LocalizationProvider>
    );
};

export default PurchaseHistory; 