import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    List,
    ListItem,
    ListItemText,
    Typography,
    Box,
    CircularProgress,
    Divider,
    Chip,
    Paper,
    Grid,
    alpha,
    useTheme
} from '@mui/material';
import { StockHistory } from '../types/medicine';
import { format, differenceInDays } from 'date-fns';
import { formatIndianCurrency } from '../utils/formatCurrency';

interface ExpiringMedicinesDialogProps {
    open: boolean;
    onClose: () => void;
    medicines: StockHistory[];
    loading: boolean;
}

const getRemainingDays = (expDate: string) => {
    const today = new Date();
    const expiryDate = new Date(expDate);
    return differenceInDays(expiryDate, today);
};

const getRemainingDaysColor = (days: number): string => {
    if (days < 0) return 'error.main';
    if (days <= 30) return 'error.main';
    if (days <= 90) return 'warning.main';
    return 'success.main';
};

const ExpiringMedicineItem: React.FC<{ item: StockHistory }> = ({ item }) => {
    const theme = useTheme();
    const remainingDays = getRemainingDays(item.expDate);
    const colorKey = getRemainingDaysColor(remainingDays);

    const color = {
        'error.main': theme.palette.error.main,
        'warning.main': theme.palette.warning.main,
        'success.main': theme.palette.success.main,
    }[colorKey] || theme.palette.success.main;

    return (
        <Paper variant="outlined" sx={{ p: 2, mb: 2, borderColor: alpha(color, 0.5) }}>
            <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        {item.medicineName}
                    </Typography>
                    <Chip size="small" label={`Batch #${item.id}`} />
                </Grid>
                <Grid item xs={6} sm={4}>
                    <Typography variant="body2">
                        Available: <b>{item.availableQuantity}</b> / {item.quantity}
                    </Typography>
                    <Typography variant="body2">
                        Price: <b>{formatIndianCurrency(item.price)}</b>
                    </Typography>
                </Grid>
                <Grid item xs={6} sm={4} sx={{ textAlign: 'right' }}>
                    <Typography variant="subtitle2" sx={{ color, fontWeight: 600 }}>
                        {format(new Date(item.expDate), 'dd-MMM-yyyy')}
                    </Typography>
                    <Typography variant="caption" sx={{ color, fontWeight: 500 }}>
                        {remainingDays < 0 ? `Expired ${Math.abs(remainingDays)} days ago` : `${remainingDays} days remaining`}
                    </Typography>
                </Grid>
            </Grid>
        </Paper>
    );
};

const ExpiringMedicinesDialog: React.FC<ExpiringMedicinesDialogProps> = ({ open, onClose, medicines, loading }) => {
    const expiringIn30Days = medicines.filter(m => getRemainingDays(m.expDate) <= 30).sort((a,b) => getRemainingDays(a.expDate) - getRemainingDays(b.expDate));
    const expiringIn90Days = medicines.filter(m => {
        const days = getRemainingDays(m.expDate);
        return days > 30 && days <= 90;
    }).sort((a,b) => getRemainingDays(a.expDate) - getRemainingDays(b.expDate));

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ fontWeight: 500, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Expiring Medicines
                <Chip label={`${medicines.length} items`} color="primary" />
            </DialogTitle>
            <DialogContent dividers>
                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" sx={{ minHeight: '300px' }}>
                        <CircularProgress />
                    </Box>
                ) : medicines.length === 0 ? (
                    <Box display="flex" justifyContent="center" alignItems="center" sx={{ minHeight: '100px' }}>
                        <Typography variant="h6" color="text.secondary">No medicines expiring soon.</Typography>
                    </Box>
                ) : (
                    <>
                        {expiringIn30Days.length > 0 && (
                            <Box mb={3}>
                                <Typography variant="h6" color="error" gutterBottom sx={{ fontWeight: 500 }}>
                                    Expiring in 30 Days or Less
                                </Typography>
                                {expiringIn30Days.map(item => (
                                    <ExpiringMedicineItem key={item.id} item={item} />
                                ))}
                            </Box>
                        )}
                        
                        {expiringIn90Days.length > 0 && (
                            <Box>
                                <Typography variant="h6" color="warning.main" gutterBottom sx={{ fontWeight: 500 }}>
                                    Expiring in 31-90 Days
                                </Typography>
                                {expiringIn90Days.map(item => (
                                    <ExpiringMedicineItem key={item.id} item={item} />
                                ))}
                            </Box>
                        )}
                    </>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant="contained">Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ExpiringMedicinesDialog; 