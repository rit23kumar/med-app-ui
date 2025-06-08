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
import SalesReportDialog from '../components/SalesReportDialog';

const SalesHistory: React.FC = () => {
    const today = new Date();
    const [fromDate, setFromDate] = useState<Date>(today);
    const [toDate, setToDate] = useState<Date>(today);
    const [sales, setSales] = useState<sell[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [reportDialogOpen, setReportDialogOpen] = useState(false);
    const [datesChanged, setDatesChanged] = useState(false);

    const handleSearch = async () => {
        if (fromDate && toDate) {
            try {
                setLoading(true);
                setError(null);
                const formattedFromDate = format(fromDate, 'yyyy-MM-dd');
                const formattedToDate = format(toDate, 'yyyy-MM-dd');
                const data = await getSalesHistory(formattedFromDate, formattedToDate);
                const sorted = Array.isArray(data)
                    ? data.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    : [];
                setSales(sorted);
                setDatesChanged(false);
            } catch (err) {
                setError('Failed to fetch Sells History');
                console.error('Error fetching Sells History:', err);
                setSales([]);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleDateChange = (newValue: Date | null, isFromDate: boolean) => {
        if (isFromDate) {
            setFromDate(newValue || today);
        } else {
            setToDate(newValue || today);
        }
        setDatesChanged(true);
    };

    useEffect(() => {
        handleSearch();
    }, []);

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Sells History
                </Typography>

                <Paper sx={{ p: 2, mb: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={3}>
                            <DatePicker
                                label="From Date"
                                value={fromDate}
                                onChange={(newValue) => handleDateChange(newValue, true)}
                                format="dd/MM/yy"
                            />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <DatePicker
                                label="To Date"
                                value={toDate}
                                onChange={(newValue) => handleDateChange(newValue, false)}
                                format="dd/MM/yy"
                            />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <Button
                                variant="contained"
                                onClick={handleSearch}
                                disabled={!fromDate || !toDate || loading}
                                fullWidth
                            >
                                {loading ? <CircularProgress size={24} /> : 'Search'}
                            </Button>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <Button
                                variant="outlined"
                                onClick={() => setReportDialogOpen(true)}
                                disabled={datesChanged || loading || sales.length === 0}
                                fullWidth
                            >
                                Quick Report
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
                                    <TableCell colSpan={5} align="center">
                                        <CircularProgress />
                                    </TableCell>
                                </TableRow>
                            ) : sales.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">
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
                                                <div
                                                    key={item.id}
                                                    style={{
                                                        fontFamily: `'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif`,
                                                        fontSize: '15px',
                                                        padding: '6px 0',
                                                        color: 'inherit',
                                                    }}
                                                >
                                                    <span style={{ fontWeight: '600', color: '#e67e22' }}>
                                                        {item.medicine.name}
                                                    </span>{' '}
                                                    —{' '}
                                                    <span style={{ color: '#3498db' }}>
                                                        {item.quantity} × ₹{item.price.toFixed(2)}
                                                    </span>{' '}
                                                    →
                                                    <span style={{ fontWeight: '500', color: '#2ecc71' }}>
                                                        ₹
                                                        {(
                                                            item.quantity *
                                                            item.price *
                                                            (1 - (item.discount ?? 0) / 100)
                                                        ).toFixed(2)}
                                                    </span>{' '}
                                                    {item.discount ? (
                                                        <span style={{ color: '#e74c3c' }}>
                                                            (Disc. {item.discount}%)
                                                        </span>
                                                    ) : null}
                                                </div>
                                            ))}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <SalesReportDialog
                    open={reportDialogOpen}
                    onClose={() => setReportDialogOpen(false)}
                    sales={sales}
                    fromDate={fromDate}
                    toDate={toDate}
                />
            </Container>
        </LocalizationProvider>
    );
};

export default SalesHistory; 