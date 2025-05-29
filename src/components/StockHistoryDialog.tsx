import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Box,
    Button
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { StockHistory } from '../types/medicine';
import { format } from 'date-fns';

interface StockHistoryDialogProps {
    open: boolean;
    onClose: () => void;
    stockHistory: StockHistory[];
    medicineName: string;
}

const StockHistoryDialog: React.FC<StockHistoryDialogProps> = ({
    open,
    onClose,
    stockHistory,
    medicineName
}) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={onClose}
                        sx={{ 
                            mr: 2,
                            color: (theme) => theme.palette.text.primary,
                            '&:hover': {
                                backgroundColor: (theme) => theme.palette.action.hover
                            }
                        }}
                    >
                        Back
                    </Button>
                    Stock History for {medicineName}
                </Box>
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Date Added</TableCell>
                                <TableCell>Expiry Date</TableCell>
                                <TableCell align="right">Quantity</TableCell>
                                <TableCell align="right">Price</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {stockHistory.map((entry) => (
                                <TableRow key={entry.id}>
                                    <TableCell>
                                        {format(new Date(entry.createdAt), 'MMM dd, yyyy')}
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(entry.expDate), 'MMM dd, yyyy')}
                                    </TableCell>
                                    <TableCell align="right">{entry.quantity}</TableCell>
                                    <TableCell align="right">₹{entry.price.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </DialogContent>
        </Dialog>
    );
};

export default StockHistoryDialog; 