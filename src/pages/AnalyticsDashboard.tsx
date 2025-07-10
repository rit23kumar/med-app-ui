import React, { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, CircularProgress, Alert } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { getSalesHistory, getPurchaseHistory } from '../services/historyService';
import { medicineApi } from '../services/api';
import { format } from 'date-fns';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Tooltip from '@mui/material/Tooltip';

const AnalyticsDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sales, setSales] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [stock, setStock] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Last 30 days
        const today = new Date();
        const fromDate = format(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29), 'yyyy-MM-dd');
        const toDate = format(today, 'yyyy-MM-dd');
        const [salesData, purchaseData, stockData] = await Promise.all([
          getSalesHistory(fromDate, toDate, 'accountingDate'),
          getPurchaseHistory(fromDate, toDate),
          medicineApi.getFlatExport(),
        ]);
        setSales(salesData);
        setPurchases(purchaseData);
        setStock(stockData);
      } catch (err) {
        setError('Failed to fetch analytics data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Prepare sales trend data (group by date)
  const salesByDate = React.useMemo(() => {
    const map: Record<string, number> = {};
    sales.forEach(sale => {
      const date = format(new Date(sale.accountingDate), 'yyyy-MM-dd');
      map[date] = (map[date] || 0) + sale.totalAmount;
    });
    return Object.entries(map).map(([date, total]) => ({ date, total }));
  }, [sales]);

  // Prepare purchases trend data (group by date)
  const purchasesByDate = React.useMemo(() => {
    const map: Record<string, number> = {};
    purchases.forEach(purchase => {
      const date = format(new Date(purchase.createdAt), 'yyyy-MM-dd');
      map[date] = (map[date] || 0) + (purchase.quantity * purchase.price);
    });
    return Object.entries(map).map(([date, total]) => ({ date, total }));
  }, [purchases]);

  // Calculate totals
  const totalSales = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  const totalPurchases = purchases.reduce((sum, p) => sum + ((p.quantity || 0) * (p.price || 0)), 0);
  const totalStock = stock.reduce((sum, s) => sum + (s.availableQty || 0), 0);

  if (loading) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px"><CircularProgress /></Box>;
  }
  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box p={3}>
      <Box display="flex" alignItems="top" gap={1} mb={2}>
        <Typography variant="h4" gutterBottom>Analytics Dashboard</Typography>
        <Tooltip title="All analytics are based on Accounting Date.">
          <InfoOutlinedIcon color="info" sx={{ fontSize: 24, cursor: 'pointer', mt: 0.5 }} />
        </Tooltip>
      </Box>
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Sales (30d)</Typography>
              <Typography variant="h5">₹{totalSales.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Purchases (30d)</Typography>
              <Typography variant="h5">₹{totalPurchases.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Stock (units)</Typography>
              <Typography variant="h5">{totalStock.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Sales Trend (Last 30 Days)</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesByDate} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#1976d2" name="Sales" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Purchases Trend (Last 30 Days)</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={purchasesByDate} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="total" fill="#43a047" name="Purchases" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsDashboard; 