import React, { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, CircularProgress, Alert, TextField } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { getSalesHistory, getPurchaseHistory } from '../services/historyService';
import { medicineApi } from '../services/api';
import { format, parseISO } from 'date-fns';
import { PieChart, Pie, Cell, Legend as PieLegend, Tooltip as PieTooltip, ResponsiveContainer as PieResponsiveContainer } from 'recharts';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Tooltip from '@mui/material/Tooltip';
import type { TooltipProps } from 'recharts';
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';
import type { TooltipProps as PieTooltipProps } from 'recharts';
import { useTheme } from '@mui/material/styles';

const CustomTooltip = ({ active, payload }: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length > 0) {
    const { fullDate } = payload[0].payload;
    return (
      <Box sx={{ p: 1 }}>
        <Typography variant="subtitle2">{fullDate}</Typography>
        {payload.map((entry, idx) => (
          <Typography key={idx} variant="body2" color="text.secondary">
            {entry.name} : {entry.value}
          </Typography>
        ))}
      </Box>
    );
  }
  return null;
};

const CustomDonutTooltip = ({ active, payload }: PieTooltipProps<ValueType, NameType>) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  if (active && payload && payload.length > 0) {
    const { name, value, medicines } = payload[0].payload;
    const isOneMonth = name && name.includes('Expiring in 1 month');
    return (
      <Box
        sx={{
          p: 1.5,
          minWidth: 180,
          bgcolor: isDark ? theme.palette.background.paper : '#fff',
          color: isDark ? theme.palette.text.primary : 'inherit',
          borderRadius: 2,
          boxShadow: 3,
          border: isDark ? '1px solid #444' : '1px solid #eee',
        }}
      >
        <Typography variant="subtitle2" sx={{ color: isDark ? theme.palette.text.primary : 'inherit' }}>{name}</Typography>
        <Typography variant="body2" color={isDark ? theme.palette.text.secondary : 'text.secondary'}>Count: {value}</Typography>
        {isOneMonth && medicines && medicines.length > 0 && (
          <Box mt={1}>
            <Typography variant="caption" color={isDark ? theme.palette.text.secondary : 'text.secondary'}>Expiring Medicines:</Typography>
            <Box>
              {medicines.slice(0, 10).map((med: string, idx: number) => (
                <Box
                  key={idx}
                  sx={{
                    mb: 1,
                    p: 1,
                    border: isDark ? '1px solid #444' : '1px solid #eee',
                    borderRadius: 1,
                    background: isDark ? '#222' : '#fafafa',
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    color: isDark ? theme.palette.text.primary : 'inherit',
                  }}
                >
                  <span role="img" aria-label="pill">💊</span>
                  <span>{med}</span>
                </Box>
              ))}
              {medicines.length > 10 && (
                <Box sx={{ fontSize: 12, color: isDark ? theme.palette.text.secondary : 'text.secondary' }}>
                  ...and {medicines.length - 10} more
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Box>
    );
  }
  return null;
};

const AnalyticsDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sales, setSales] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [stock, setStock] = useState<any[]>([]);
  // Month picker state (YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'));
  // Custom label for donut chart: show percent only, centered
  const renderDonutLabel = ({ percent }: { percent: number }) => `${(percent * 100).toFixed(0)}%`;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Parse selected month (YYYY-MM)
        const [year, month] = selectedMonth.split('-').map(Number);
        const fromDate = format(new Date(year, month - 1, 1), 'yyyy-MM-dd');
        // To date is last day of month if in past, or today if current month
        const now = new Date();
        let toDate;
        if (year === now.getFullYear() && month === now.getMonth() + 1) {
          toDate = format(now, 'yyyy-MM-dd');
        } else {
          toDate = format(new Date(year, month, 0), 'yyyy-MM-dd');
        }
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
  }, [selectedMonth]);

  // Get selected month name and year for titles
  const selectedMonthDate = new Date(selectedMonth + '-01');
  const currentMonthYear = format(selectedMonthDate, 'MMMM yyyy');
  const isCurrentMonth = format(selectedMonthDate, 'yyyy-MM') === format(new Date(), 'yyyy-MM');
  const currentDay = isCurrentMonth ? new Date().getDate() : new Date(selectedMonthDate.getFullYear(), selectedMonthDate.getMonth() + 1, 0).getDate();

  // Prepare sales trend data (group by date)
  const salesByDate = React.useMemo(() => {
    const map: Record<string, { total: number, fullDate: string }> = {};
    sales.forEach(sale => {
      const d = new Date(sale.accountingDate);
      const day = format(d, 'd');
      const fullDate = format(d, 'd MMMM yyyy');
      if (!map[day]) {
        map[day] = { total: 0, fullDate };
      }
      map[day].total += sale.totalAmount;
    });
    const result = [];
    for (let day = 1; day <= currentDay; day++) {
      const dayStr = day.toString();
      result.push({ date: dayStr, total: map[dayStr]?.total || 0, fullDate: map[dayStr]?.fullDate || format(new Date(selectedMonthDate.getFullYear(), selectedMonthDate.getMonth(), day), 'd MMMM yyyy') });
    }
    return result;
  }, [sales, currentDay, selectedMonthDate]);

  // Prepare purchases trend data (group by date)
  const purchasesByDate = React.useMemo(() => {
    const map: Record<string, { total: number, fullDate: string }> = {};
    purchases.forEach(purchase => {
      const d = new Date(purchase.createdAt);
      const day = format(d, 'd');
      const fullDate = format(d, 'd MMMM yyyy');
      if (!map[day]) {
        map[day] = { total: 0, fullDate };
      }
      map[day].total += (purchase.quantity * purchase.price);
    });
    const result = [];
    for (let day = 1; day <= currentDay; day++) {
      const dayStr = day.toString();
      result.push({ date: dayStr, total: map[dayStr]?.total || 0, fullDate: map[dayStr]?.fullDate || format(new Date(selectedMonthDate.getFullYear(), selectedMonthDate.getMonth(), day), 'd MMMM yyyy') });
    }
    return result;
  }, [purchases, currentDay, selectedMonthDate]);

  // Calculate totals
  const totalSales = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  const totalPurchases = purchases.reduce((sum, p) => sum + ((p.quantity || 0) * (p.price || 0)), 0);
  const totalStock = stock.reduce((sum, s) => sum + (s.availableQty || 0), 0);

  // Donut chart: Medicine Expiring Status
  const today = new Date();
  const expiringStatusCounts = [
    { label: 'Expiring in 1 month', color: '#d32f2f', icon: '🔴', count: 0, medicines: [] as string[] },
    { label: 'Expiring in 1–3 months', color: '#ed6c02', icon: '🟠', count: 0, medicines: [] as string[] },
    { label: 'Expiring in 3–6 months', color: '#fbc02d', icon: '🟡', count: 0, medicines: [] as string[] },
    { label: 'Expiring in >6 months', color: '#43a047', icon: '🟢', count: 0, medicines: [] as string[] },
  ];
  stock.forEach(batch => {
    if (!batch.expDate) return;
    const expDate = new Date(batch.expDate);
    const days = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (days < 0) return; // Already expired, skip
    const medName = batch.medicineName || batch.name || 'Unknown';
    if (days <= 30) { expiringStatusCounts[0].count++; expiringStatusCounts[0].medicines.push(medName); }
    else if (days <= 90) { expiringStatusCounts[1].count++; expiringStatusCounts[1].medicines.push(medName); }
    else if (days <= 180) { expiringStatusCounts[2].count++; expiringStatusCounts[2].medicines.push(medName); }
    else { expiringStatusCounts[3].count++; expiringStatusCounts[3].medicines.push(medName); }
  });
  const donutData = expiringStatusCounts.filter(e => e.count > 0).map(e => ({ name: `${e.icon} ${e.label}`, value: e.count, color: e.color, medicines: e.medicines }));

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
        <TextField
          type="month"
          label="Month"
          size="small"
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          sx={{ minWidth: 180, ml: 2 }}
          InputLabelProps={{ shrink: true }}
        />
      </Box>
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Sales ({currentMonthYear})</Typography>
              <Typography variant="h5">₹{totalSales.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Purchases ({currentMonthYear})</Typography>
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
              <Typography variant="h6" gutterBottom>Sales for {currentMonthYear}</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesByDate} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip content={<CustomTooltip />} />
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
              <Typography variant="h6" gutterBottom>Purchases for {currentMonthYear}</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={purchasesByDate} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="total" fill="#43a047" name="Purchases" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Box mt={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Medicine Expiring Status</Typography>
            <PieResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={donutData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  label={renderDonutLabel}
                  labelLine={false}
                  minAngle={10}
                >
                  {donutData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <PieTooltip content={<CustomDonutTooltip />} />
              </PieChart>
            </PieResponsiveContainer>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default AnalyticsDashboard; 