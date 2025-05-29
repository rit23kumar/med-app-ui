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
                        <TableCell>Date Added</TableCell>
                        <TableCell>Expiry Date</TableCell>
                        <TableCell>Remaining Days</TableCell>
                        <TableCell align="right">Initial Quantity</TableCell>
                        <TableCell align="right">Available</TableCell>
                        <TableCell align="right">Price</TableCell>
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
                                <TableCell>
                                    {format(new Date(entry.createdAt), 'MMM dd, yyyy')}
                                </TableCell>
                                <TableCell>
                                    {format(expiryDate, 'MMM dd, yyyy')}
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={getRemainingDaysLabel(remainingDays)}
                                        size="small"
                                        sx={{
                                            backgroundColor: `${color}15`,
                                            color: color,
                                            fontWeight: 500,
                                            '& .MuiChip-label': {
                                                px: 1
                                            }
                                        }}
                                    />
                                </TableCell>
                                <TableCell align="right">{entry.quantity}</TableCell>
                                <TableCell align="right">{entry.availableQuantity}</TableCell>
                                <TableCell align="right">₹{entry.price.toFixed(2)}</TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default StockHistoryTable; 