import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  useTheme,
  useMediaQuery,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  alpha,
  Tooltip,
} from '@mui/material';
import {
  KeyboardArrowDown as ExpandMoreIcon,
  KeyboardArrowUp as ExpandLessIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FileDownload as DownloadIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { medicineApi } from '../services/api';
import { formatIndianCurrency } from '../utils/formatCurrency';
import { format, parseISO, differenceInDays } from 'date-fns';

interface MedicineStockData {
  name: string;
  enabled: boolean;
  expDate: string;
  availableQty: number;
  price: number;
}

interface GroupedMedicineData {
  name: string;
  enabled: boolean;
  totalStock: number;
  totalValue: number;
  batches: MedicineStockData[];
}

interface RowProps {
  medicine: GroupedMedicineData;
}

const Row: React.FC<RowProps> = ({ medicine }) => {
  const theme = useTheme();

  // Sort batches by expiry date ascending
  const sortedBatches = [...medicine.batches].sort((a, b) => new Date(a.expDate).getTime() - new Date(b.expDate).getTime());

  const formatExpiryDate = (expDate: string) => {
    if (!expDate) return 'N/A';
    try {
      return format(parseISO(expDate), 'dd-MMM-yyyy');
    } catch {
      return expDate;
    }
  };

  const getDaysColor = (days: number) => {
    if (days < 30) return '#d32f2f'; // red
    if (days < 90) return '#ed6c02'; // orange
    return 'green'; // default
  };

  return (
    <TableRow>
      {/* Medicine Name and Total Stock */}
      <TableCell sx={{ verticalAlign: 'middle', minWidth: 300, maxWidth: 300, width: 300 }}>
        <Box display="flex" flexDirection="column" height="100%">
          <Typography variant="h6" sx={{ fontFamily:"Times New Roman", fontWeight: 500, color: '#ed6c02', letterSpacing: '0.5px'  }}>
            {medicine.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Total Stock: <b>{medicine.totalStock}</b>
          </Typography>
        </Box>
      </TableCell>
      {/* Batches */}
      <TableCell sx={{ verticalAlign: 'middle', minWidth: 600, maxWidth: 700, width: 700, p: 1 }}>
        {sortedBatches.length > 0 ? (
          sortedBatches.map((batch, idx) => {
            const daysRemaining = differenceInDays(parseISO(batch.expDate), new Date());
            const totalValue = batch.availableQty * batch.price;
            return (
              <Box key={idx} display="flex" alignItems="center" gap={8} sx={{ mb: 1 }}>
                <Box display="flex" alignItems="center" gap={1} minWidth={160} maxWidth={160} width={160} sx={{ whiteSpace: 'nowrap' }}>
                  <Typography variant="body2" sx={{ minWidth: 80, maxWidth: 80, width: 80, whiteSpace: 'nowrap' }}>
                    {formatExpiryDate(batch.expDate)}
                  </Typography>
                  {typeof daysRemaining === 'number' && !isNaN(daysRemaining) && isFinite(daysRemaining) && (
                    <Typography variant="body2" sx={{ color: getDaysColor(daysRemaining), minWidth: 60, maxWidth: 60, width: 60, whiteSpace: 'nowrap' }}>
                      ({daysRemaining} days)
                    </Typography>
                  )}
                </Box>
                <Typography variant="body2" minWidth={70} maxWidth={80} width={80}>
                  Qty: <b style={{ color: '#ed6c02' }}>{batch.availableQty}</b>
                </Typography>
                <Typography variant="body2" minWidth={90} maxWidth={100} width={100}>
                  Price: <b style={{ color: '#ed6c02' }}>{formatIndianCurrency(batch.price)}</b>
                </Typography>
                <Typography variant="body2" minWidth={120} maxWidth={130} width={130}>
                  Total Value: <b style={{ color: '#ed6c02' }}>{formatIndianCurrency(totalValue)}</b>
                </Typography>
              </Box>
            );
          })
        ) : (
          <Typography variant="body2" color="text.secondary">
            No batches
          </Typography>
        )}
      </TableCell>
    </TableRow>
  );
};

const AllMedicinesStock: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rawData, setRawData] = useState<MedicineStockData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showTotalValue, setShowTotalValue] = useState(false);
  const [expiringDays, setExpiringDays] = useState<string>('');
  const [maxTotalStock, setMaxTotalStock] = useState<string>('');
  const [minTotalStock, setMinTotalStock] = useState<string>('');

  const groupedData = useMemo(() => {
    const grouped = rawData.reduce((acc, item) => {
      if (!acc[item.name]) {
        acc[item.name] = {
          name: item.name,
          enabled: item.enabled,
          totalStock: 0,
          totalValue: 0,
          batches: []
        };
      }
      
      acc[item.name].totalStock += item.availableQty;
      acc[item.name].totalValue += item.availableQty * item.price;
      acc[item.name].batches.push(item);
      
      return acc;
    }, {} as Record<string, GroupedMedicineData>);

    return Object.values(grouped);
  }, [rawData]);

  const filteredData = useMemo(() => {
    let filtered = groupedData;

    if (searchTerm) {
      filtered = filtered.filter(medicine =>
        medicine.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(medicine => {
        if (statusFilter === 'active') return medicine.enabled;
        if (statusFilter === 'inactive') return !medicine.enabled;
        return true;
      });
    }

    // Filter by expiringDays
    if (expiringDays && !isNaN(Number(expiringDays))) {
      const days = Number(expiringDays);
      filtered = filtered.filter(medicine =>
        medicine.batches.some(batch => {
          const daysRemaining = differenceInDays(parseISO(batch.expDate), new Date());
          return daysRemaining >= 0 && daysRemaining <= days;
        })
      );
    }

    // Filter by maxTotalStock
    if (maxTotalStock && !isNaN(Number(maxTotalStock))) {
      const maxStock = Number(maxTotalStock);
      filtered = filtered.filter(medicine => medicine.totalStock <= maxStock);
    }

    // Filter by minTotalStock
    if (minTotalStock && !isNaN(Number(minTotalStock))) {
      const minStock = Number(minTotalStock);
      filtered = filtered.filter(medicine => medicine.totalStock >= minStock);
    }

    return filtered;
  }, [groupedData, searchTerm, statusFilter, expiringDays, maxTotalStock, minTotalStock]);

  const totals = useMemo(() => {
    return filteredData.reduce((acc, medicine) => ({
      totalStock: acc.totalStock + medicine.totalStock,
      totalValue: acc.totalValue + medicine.totalValue,
      totalMedicines: acc.totalMedicines + 1
    }), { totalStock: 0, totalValue: 0, totalMedicines: 0 });
  }, [filteredData]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await medicineApi.getFlatExport();
      setRawData(data);
    } catch (err) {
      console.error('Error fetching medicines data:', err);
      setError('Failed to fetch medicines data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={fetchData}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        All Medicines & Stock
      </Typography>

      {/* Filter Row */}
      <Box display="flex" gap={2} alignItems="center" mb={2}>
        <TextField
          label="Expiring in ≤ (days)"
          type="number"
          size="small"
          value={expiringDays}
          onChange={e => setExpiringDays(e.target.value)}
          InputProps={{
            endAdornment: <InputAdornment position="end">days</InputAdornment>,
            inputProps: { min: 0 }
          }}
        />
        <TextField
          label="Total Stock ≤"
          type="number"
          size="small"
          value={maxTotalStock}
          onChange={e => setMaxTotalStock(e.target.value)}
          InputProps={{
            endAdornment: <InputAdornment position="end">qty</InputAdornment>,
            inputProps: { min: 0 }
          }}
        />
        <TextField
          label="Total Stock ≥"
          type="number"
          size="small"
          value={minTotalStock}
          onChange={e => setMinTotalStock(e.target.value)}
          InputProps={{
            endAdornment: <InputAdornment position="end">qty</InputAdornment>,
            inputProps: { min: 0 }
          }}
        />
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Medicines
              </Typography>
              <Typography variant="h4">
                {totals.totalMedicines}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Quantity
              </Typography>
              <Typography variant="h4">
                {totals.totalStock}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography color="textSecondary" gutterBottom>
                  Total Value
                </Typography>
                <Tooltip title={showTotalValue ? "Hide Values" : "Show Values"}>
                  <IconButton 
                    size="small" 
                    onClick={() => setShowTotalValue(v => !v)}
                    sx={{ color: theme.palette.primary.main }}
                  >
                    {showTotalValue ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </Tooltip>
              </Box>
              {showTotalValue ? (
                <Typography variant="h4" color="primary.main">
                  {formatIndianCurrency(totals.totalValue)}
                </Typography>
              ) : (
                <Typography variant="h4" color="text.secondary">
                  ••••••
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Showing
              </Typography>
              <Typography variant="h4">
                {filteredData.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper>
        <Table>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((medicine) => (
                <Row
                  key={medicine.name}
                  medicine={medicine}
                />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={2} align="center">
                  <Typography variant="body1" color="text.secondary">
                    No medicines found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default AllMedicinesStock; 