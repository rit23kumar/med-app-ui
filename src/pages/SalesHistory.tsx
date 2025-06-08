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
import { getSalesHistory } from '../services/historyService';
import { sell, sellItem } from '../types/sell';

const SalesHistory: React.FC = () => {
    const today = new Date();
    const [fromDate, setFromDate] = useState<Date>(today);
    const [toDate, setToDate] = useState<Date>(today);
    const [sales, setSales] = useState<sell[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async () => {
        if (fromDate && toDate) {
            try {
                setLoading(true);
                setError(null);
                const formattedFromDate = format(fromDate, 'yyyy-MM-dd');
                const formattedToDate = format(toDate, 'yyyy-MM-dd');
                const data = await getSalesHistory(formattedFromDate, formattedToDate);
                setSales(Array.isArray(data) ? data : []);
            } catch (err) {
                setError('Failed to fetch Sells History');
                console.error('Error fetching Sells History:', err);
                setSales([]);
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
                    Sells History
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
                                <TableCell>Customer</TableCell>
                                <TableCell>Total Amount</TableCell>
                                <TableCell>Mode</TableCell>
                                <TableCell>Items</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center">
                                        <CircularProgress />
                                    </TableCell>
                                </TableRow>
                            ) : sales.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center">
                                        No sales records found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sales.map((sale) => (
                                    <TableRow key={sale.id}>
                                        <TableCell>{format(new Date(sale.date), 'dd/MM/yy HH:mm')}</TableCell>
                                        <TableCell>{sale.customer || 'N/A'}</TableCell>
                                        <TableCell>₹{sale.totalAmount.toFixed(2)}</TableCell>
                                        <TableCell>{sale.modeOfPayment || 'N/A'}</TableCell>
                                        <TableCell>
                                            {(sale.items as sellItem[]).map((item: sellItem) => (
                                                <div key={item.id}>
                                                    {item.medicine.name} - {item.quantity} x ₹{item.price.toFixed(2)} (Discount: {item.discount ?? 0}%)
                                                </div>
                                            ))}
                                        </TableCell>
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

export default SalesHistory; 