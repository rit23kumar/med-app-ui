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
    Chip,
    IconButton
} from '@mui/material';
import { StockHistory } from '../types/medicine';
import { format, differenceInDays } from 'date-fns';
import { formatIndianCurrency } from '../utils/formatCurrency';
import DeleteIcon from '@mui/icons-material/Delete';

interface StockHistoryTableProps {
    stockHistory: StockHistory[];
    loading: boolean;
    onDeleteBatch: (batchId: number) => void;
}

const getRemainingDaysColor = (days: number): string => {
    if (days <= 30) return '#ef5350'; // red
    if (days <= 90) return '#ff9800'; // orange
    return '#4caf50'; // green
};

const formatExpiryText = (expDate: string) => {
    const today = new Date();
    const expiryDate = new Date(expDate);
    const remainingDays = differenceInDays(expiryDate, today);
    const formattedDate = format(expiryDate, 'MMM dd, yyyy');
    
    if (remainingDays < 0) {
        return `${formattedDate} (Expired ${Math.abs(remainingDays)} days ago)`;
    }
    return `${formattedDate} (${remainingDays} Days Remaining)`;
};

const StockHistoryTable: React.FC<StockHistoryTableProps> = ({ stockHistory, loading, onDeleteBatch }) => {
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
                        <TableCell>Purchased</TableCell>
                        <TableCell>Available</TableCell>
                        <TableCell>Price</TableCell>
                        <TableCell>Actions</TableCell>
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
                                <TableCell sx={{ color }}>
                                    {formatExpiryText(entry.expDate)}
                                </TableCell>
                                <TableCell>{entry.quantity}</TableCell>
                                <TableCell>{entry.availableQuantity}</TableCell>
                                <TableCell>₹{formatIndianCurrency(entry.price)}</TableCell>
                                <TableCell>
                                    <IconButton
                                        color="error"
                                        size="small"
                                        onClick={() => onDeleteBatch(entry.id)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default StockHistoryTable; 