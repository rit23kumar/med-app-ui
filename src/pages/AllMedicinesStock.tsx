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
      <TableCell sx={{ verticalAlign: 'middle', minWidth: 180 }}>
        <Box display="flex" flexDirection="column"  height="100%">
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {medicine.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Total Stock: <b>{medicine.totalStock}</b>
          </Typography>
        </Box>
      </TableCell>
      {/* Batches */}
      <TableCell sx={{ verticalAlign: 'middle', minWidth: 320, p: 1 }}>
        {sortedBatches.length > 0 ? (
          sortedBatches.map((batch, idx) => {
            const daysRemaining = differenceInDays(parseISO(batch.expDate), new Date());
            return (
              <Box key={idx} display="flex" alignItems="center" gap={3} sx={{ mb: 1 }}>
                <Box display="flex" alignItems="center" gap={1} minWidth={120}>
                  <Typography variant="body2">
                    {formatExpiryDate(batch.expDate)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: getDaysColor(daysRemaining) }}>
                    ({daysRemaining} days)
                  </Typography>
                </Box>
                <Typography variant="body2" minWidth={80}>
                  Qty: <b>{batch.availableQty}</b>
                </Typography>
                <Typography variant="body2" minWidth={80}>
                  Price: <b>{formatIndianCurrency(batch.price)}</b>
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

    return filtered;
  }, [groupedData, searchTerm, statusFilter]);

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