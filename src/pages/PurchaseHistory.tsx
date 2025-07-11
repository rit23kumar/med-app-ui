import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Snackbar,
  useTheme,
  alpha,
  useMediaQuery,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format } from "date-fns";
import { getPurchaseHistory } from "../services/historyService";
import { StockHistory } from "../types/medicine";
import { formatIndianCurrency } from "../utils/formatCurrency";

const PurchaseHistory: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const today = new Date();
  const [singleDateMode, setSingleDateMode] = useState(true);
  const [date, setDate] = useState<Date>(today);
  const [fromDate, setFromDate] = useState<Date>(today);
  const [toDate, setToDate] = useState<Date>(today);
  const [purchases, setPurchases] = useState<StockHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPurchasedAmount, setTotalPurchasedAmount] = useState(0);

  const handleSearch = async () => {
    let searchFromDate = fromDate;
    let searchToDate = toDate;
    if (singleDateMode) {
      searchFromDate = date;
      searchToDate = date;
    }
    if (searchFromDate && searchToDate) {
      try {
        setLoading(true);
        setError(null);
        const formattedFromDate = format(searchFromDate, "yyyy-MM-dd");
        const formattedToDate = format(searchToDate, "yyyy-MM-dd");
        const data = await getPurchaseHistory(
          formattedFromDate,
          formattedToDate
        );
        const sorted = Array.isArray(data)
          ? data
              .slice()
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              )
          : [];
        setPurchases(sorted);
        setTotalPurchasedAmount(calculateTotal(sorted));
      } catch (err) {
        setError("Failed to fetch purchase history");
        console.error("Error fetching purchase history:", err);
        setPurchases([]);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDateChange = (newValue: Date | null, isFromDate?: boolean) => {
    if (singleDateMode) {
      setDate(newValue || today);
    } else if (isFromDate) {
      setFromDate(newValue || today);
    } else {
      setToDate(newValue || today);
    }
  };

  const calculateTotal = (data: StockHistory[]): number => {
    return data.reduce((sum, item) => sum + item.quantity * item.price, 0);
  };

  useEffect(() => {
    handleSearch();
  }, []); // Load data on component mount

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Box
          sx={{
            py: 2,
            px: isMobile ? 2 : 3,
            borderBottom: 1,
            borderColor: 'divider',
            backgroundColor: alpha(theme.palette.primary.main, 0.02)
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between',
              alignItems: isMobile ? 'stretch' : 'center',
              width: '100%',
            }}
          >
            <Typography
              variant={isMobile ? "h6" : "h5"}
              component="h1"
              color="primary"
              sx={{ fontWeight: 500 }}
            >
              Purchase History
            </Typography>
          </Box>
        </Box>

        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Paper sx={{ pl: 2, pb: 2, pt: 1, mb: 2 }}>
            <Box sx={{ mb: 1, display: "flex", justifyContent: "flex-start" }}>
              <FormControlLabel
                control={
                  <Switch
                    sx={{ ml: 1 }}
                    checked={!singleDateMode}
                    onChange={() => setSingleDateMode((mode) => !mode)}
                    color="primary"
                    size="small"
                  />
                }
                label={
                  <span style={{ fontSize: 14 }}>Enable Date Range Mode</span>
                }
              />
            </Box>
            <Grid container spacing={2} alignItems="center">
              {singleDateMode ? (
                <Grid item xs={12} sm={3}>
                  <DatePicker
                    label="Date"
                    value={date}
                    onChange={(newValue) => handleDateChange(newValue)}
                    format="dd/MM/yy"
                  />
                </Grid>
              ) : (
                <>
                  <Grid item xs={12} sm={3}>
                    <DatePicker
                      label="From Date"
                      value={fromDate}
                      onChange={(newValue) => handleDateChange(newValue, true)}
                      format="dd/MM/yy"
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <DatePicker
                      label="To Date"
                      value={toDate}
                      onChange={(newValue) => handleDateChange(newValue, false)}
                      format="dd/MM/yy"
                    />
                  </Grid>
                </>
              )}
              <Grid item xs={12} sm={3}>
                <Button
                  variant="contained"
                  onClick={handleSearch}
                  disabled={
                    (singleDateMode ? !date : !fromDate || !toDate) || loading
                  }
                  fullWidth
                >
                  {loading ? <CircularProgress size={24} /> : "Show Purchase"}
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Error Snackbar */}
          <Snackbar
            open={!!error}
            autoHideDuration={30000}
            onClose={() => setError(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          >
            <Alert
              onClose={() => setError(null)}
              severity="error"
              sx={{ width: '100%' }}
            >
              {error}
            </Alert>
          </Snackbar>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Medicine</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Price/Unit</TableCell>
                  <TableCell>Expiry Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : purchases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No purchase records found
                    </TableCell>
                  </TableRow>
                ) : (
                  purchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell>
                        {format(new Date(purchase.createdAt), "dd/MM/yy HH:mm")}
                      </TableCell>
                      <TableCell>{purchase.medicineName}</TableCell>
                      <TableCell>{purchase.quantity}</TableCell>
                      <TableCell>
                        ₹{formatIndianCurrency(purchase.price)}
                      </TableCell>
                      <TableCell>
                        {format(new Date(purchase.expDate), "dd/MM/yy")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {purchases.length > 0 && (
            <Box sx={{ mt: 3, textAlign: "right", mr: 5 }}>
              <Typography variant="h6" color="primary">
                Total Amount:{" "}
                <span style={{ fontWeight: "500", color: "#2ecc71" }}>
                  ₹{formatIndianCurrency(totalPurchasedAmount)}
                </span>
              </Typography>
            </Box>
          )}
        </Container>
      </Box>
    </LocalizationProvider>
  );
};

export default PurchaseHistory;
