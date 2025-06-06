import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    Box,
    CircularProgress,
    Chip
} from '@mui/material';
import { StockHistory } from '../types/medicine';
import { format, differenceInDays } from 'date-fns';

interface StockHistoryTableProps {
    stockHistory: StockHistory[];
    loading: boolean;
}

const getRemainingDaysColor = (days: number): string => {
    if (days <= 30) return '#ef5350'; // red
    if (days <= 90) return '#ff9800'; // orange
    return '#4caf50'; // green
};

const getRemainingDaysLabel = (days: number): string => {
    if (days < 0) return `Expired ${Math.abs(days)} days ago`;
    return `${days} days remaining`;
};

const StockHistoryTable: React.FC<StockHistoryTableProps> = ({ stockHistory, loading }) => {
    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" p={3}>
                <CircularProgress />
            </Box>
        );
    }

    if (stockHistory.length === 0) {
        return (
            <Box p={3}>
                <Typography variant="body1" color="textSecondary">
                    No stock history available.
                </Typography>
            </Box>
        );
    }

    const today = new Date();

    // Sort stock history by expiry date in ascending order
    const sortedStockHistory = [...stockHistory].sort((a, b) => {
        const dateA = new Date(a.expDate);
        const dateB = new Date(b.expDate);
        return dateA.getTime() - dateB.getTime();
    });

    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Batch ID</TableCell>
                        <TableCell>Expiration Date</TableCell>
                        <TableCell>Quantity</TableCell>
                        <TableCell>Available</TableCell>
                        <TableCell>Price</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {sortedStockHistory.map((entry) => {
                        const expiryDate = new Date(entry.expDate);
                        const remainingDays = differenceInDays(expiryDate, today);
                        const color = getRemainingDaysColor(remainingDays);

                        return (
                            <TableRow 
                                key={entry.id}
                                sx={entry.availableQuantity === 0 ? { opacity: 0.6 } : undefined}
                            >
                                <TableCell>{entry.id}</TableCell>
                                <TableCell>{format(expiryDate, 'dd/MM/yy')}</TableCell>
                                <TableCell>{entry.quantity}</TableCell>
                                <TableCell>{entry.availableQuantity}</TableCell>
                                <TableCell>₹{entry.price.toFixed(2)}</TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default StockHistoryTable; 