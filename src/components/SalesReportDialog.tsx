import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Grid,
    Paper,
    useTheme
} from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PaymentsIcon from '@mui/icons-material/Payments';
import QrCodeIcon from '@mui/icons-material/QrCode';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { format, isSameDay } from 'date-fns';
import { sell } from '../types/sell';
import { formatIndianCurrency } from '../utils/formatCurrency';

interface SalesReportDialogProps {
    open: boolean;
    onClose: () => void;
    sales: sell[];
    fromDate: Date;
    toDate: Date;
}

const SalesReportDialog: React.FC<SalesReportDialogProps> = ({
    open,
    onClose,
    sales,
    fromDate,
    toDate
}) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const cardStyles = (color: string) => ({
        p: 2,
        bgcolor: isDark ? theme.palette.grey[900] : color,
        color: isDark ? theme.palette.text.primary : theme.palette.text.primary,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
    });

    const calculateModeTotal = (mode: string) => {
        return sales
            .filter(sale => sale.modeOfPayment === mode)
            .reduce((total, sale) => {
                return total + (sale.items?.reduce((itemSum, item) => {
                    const discount = item.discount ?? 0;
                    return itemSum + item.price * item.quantity * (1 - discount / 100);
                }, 0) || 0);
            }, 0);
    };

    const cashTotal = calculateModeTotal('Cash');
    const upiTotal = calculateModeTotal('UPI');
    const cardTotal = calculateModeTotal('Card');
    const otherTotal = sales
        .filter(sale => !sale.modeOfPayment || !['Cash', 'UPI', 'Card'].includes(sale.modeOfPayment))
        .reduce((total, sale) => {
            return total + (sale.items?.reduce((itemSum, item) => {
                const discount = item.discount ?? 0;
                return itemSum + item.price * item.quantity * (1 - discount / 100);
            }, 0) || 0);
        }, 0);
    const totalSales = cashTotal + upiTotal + cardTotal + otherTotal;

    const formatDateRange = () => {
        if (isSameDay(fromDate, toDate)) {
            return format(fromDate, 'MMMM d, yyyy');
        }
        return `${format(fromDate, 'MMMM d, yyyy')} to ${format(toDate, 'MMMM d, yyyy')}`;
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                Sales Report for <span style={{ fontWeight: 'bold', color: '#2ecc71' }}>{formatDateRange()}</span>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Paper sx={cardStyles(isDark ? theme.palette.grey[800] : '#f5f5f5')}>
                                <AttachMoneyIcon color="success" fontSize="medium" />
                                <Typography variant="subtitle1" gutterBottom>
                                    Total Sales: ₹{formatIndianCurrency(totalSales)}
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12}>
                            <Paper sx={cardStyles(isDark ? theme.palette.info.dark : '#e3f2fd')}>
                                <PaymentsIcon color="primary" fontSize="medium" />
                                <Typography variant="subtitle1" gutterBottom>
                                    Cash Sales: ₹{formatIndianCurrency(cashTotal)}
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12}>
                            <Paper sx={cardStyles(isDark ? theme.palette.success.dark : '#e8f5e9')}>
                                <QrCodeIcon color="success" fontSize="medium" />
                                <Typography variant="subtitle1" gutterBottom>
                                    UPI Sales: ₹{formatIndianCurrency(upiTotal)}
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12}>
                            <Paper sx={cardStyles(isDark ? theme.palette.warning.dark : '#fff3e0')}>
                                <CreditCardIcon color="warning" fontSize="medium" />
                                <Typography variant="subtitle1" gutterBottom>
                                    Card Sales: ₹{formatIndianCurrency(cardTotal)}
                                </Typography>
                            </Paper>
                        </Grid>
                        {otherTotal > 0 && (
                            <Grid item xs={12}>
                                <Paper sx={cardStyles(isDark ? theme.palette.secondary.dark : '#fce4ec')}>
                                    <AccountBalanceWalletIcon color="secondary" fontSize="medium" />
                                    <Typography variant="subtitle1" gutterBottom>
                                        Other Sales: ₹{formatIndianCurrency(otherTotal)}
                                    </Typography>
                                </Paper>
                            </Grid>
                        )}
                    </Grid>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default SalesReportDialog; 