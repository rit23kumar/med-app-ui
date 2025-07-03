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
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Checkbox,
  ListItemText,
  IconButton,
  Menu,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  useTheme,
  alpha,
  useMediaQuery,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format } from "date-fns";
import { getSalesHistory, deleteSell, getSellById } from "../services/historyService";
import { sell, sellItem } from "../types/sell";
import SalesReportDialog from "../components/SalesReportDialog";
import { formatIndianCurrency } from "../utils/formatCurrency";
import FilterListIcon from '@mui/icons-material/FilterList';
import DeleteIcon from "@mui/icons-material/Delete";
import PrintIcon from '@mui/icons-material/Print';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import Tooltip from '@mui/material/Tooltip';

const ALL_MODES = ["Cash", "UPI", "Card", "Ward Use", "Pay Later"];

const SalesHistory: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const today = new Date();
  const [singleDateMode, setSingleDateMode] = useState(true);
  const [date, setDate] = useState<Date>(today);
  const [fromDate, setFromDate] = useState<Date>(today);
  const [toDate, setToDate] = useState<Date>(today);
  const [sales, setSales] = useState<sell[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [datesChanged, setDatesChanged] = useState(false);
  const [selectedModes, setSelectedModes] = useState<string[]>(ALL_MODES);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const filterOpen = Boolean(anchorEl);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<sell | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [selectedSaleItems, setSelectedSaleItems] = useState<sellItem[]>([]);
  const [selectedSale, setSelectedSale] = useState<sell | null>(null);

  const [deleteEnabled, setDeleteEnabled] = useState(false);

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
        const data = await getSalesHistory(formattedFromDate, formattedToDate);
        const sorted = Array.isArray(data)
          ? data
              .slice()
              .sort(
                (a, b) =>
                  new Date(b.date).getTime() - new Date(a.date).getTime()
              )
          : [];
        setSales(sorted);
        setDatesChanged(false);
      } catch (err) {
        setError("Failed to fetch Sells History");
        console.error("Error fetching Sells History:", err);
        setSales([]);
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
    setDatesChanged(true);
  };

  useEffect(() => {
    handleSearch();
  }, []);

  // Filter sales by selected modes
  const filteredSales = sales.filter(sale =>
    !sale.modeOfPayment || selectedModes.includes(sale.modeOfPayment)
  );

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleFilterClose = () => {
    setAnchorEl(null);
  };

  const handleDeleteClick = (sale: sell) => {
    setSaleToDelete(sale);
    setDeleteConfirmOpen(true);
  };

  const handleCloseDeleteConfirm = () => {
    if (deleteLoading) return;
    setSaleToDelete(null);
    setDeleteConfirmOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!saleToDelete) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deleteSell(saleToDelete.id);
      setDeleteSuccess(`Sale IN${saleToDelete.id} deleted successfully!`);
      handleCloseDeleteConfirm();
      // Refresh list
      handleSearch();
    } catch (err: any) {
      setDeleteError(err.response?.data?.message || 'Failed to delete sale.');
      console.error("Error deleting sale:", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handlePrintInvoice = async (saleId: number) => {
    try {
      const sale = await getSellById(saleId);
      printInvoice(sale);
    } catch (err) {
      alert('Failed to fetch sale for printing.');
    }
  };

  const printInvoice = (sale: sell) => {
    const printWindow = window.open('', '', 'width=595,height=842');
    if (printWindow) {
      const total = sale.items.reduce((sum, item) => sum + (item.price * item.quantity * (1 - (item.discount ?? 0) / 100)), 0);
      const paid = sale.amountPaid ?? total;
      // Dynamic spacer height based on number of items
      let spacerHeight = 100;
      const length = sale.items.length;

      if (length > 24) spacerHeight = 0;
      else if (length > 20) spacerHeight = 20;
      else if (length > 16) spacerHeight = 60;
      else if (length > 12) spacerHeight = 100;
      else if (length > 8) spacerHeight = 140;
      else if (length > 4) spacerHeight = 180;
      else spacerHeight = 220;
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt</title>
            <style>
              @media print {
                @page {
                  size: A5 portrait;
                  margin: 4mm;
                  marks: none;
                }
                html, body {
                  margin: 0 !important;
                  padding: 0 !important;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                  font-family: Arial, sans-serif;
                  font-size: 7pt;
                  color: #000;
                }
                .container {
                  padding: 3mm;
                }
                .header-section {
                  margin-bottom: 2px;
                }
                .header-section h1 {
                  font-size: 13pt;
                  margin: 0;
                  padding: 0;
                }
                .header-section p {
                  font-size: 6pt;
                  margin: 0;
                  padding: 0;
                }
                .invoice-label {
                  text-align: center;
                  font-size: 12pt;
                  margin-top: 4px;
                  font-weight: bold;
                }
                .details-grid {
                  display: flex;
                  border-bottom: 0.5px solid #CCC;
                  margin-bottom: 12px;
                  font-size: 8pt;
                }
                .details-grid > div {
                  padding: 6px;
                  flex: 1;
                }
                .bill-to {
                  flex: 0.6;
                }
                .invoice-info {
                  flex: 0.4;
                }
                .invoice-info p, .bill-to p {
                  margin: 2px 0;
                }
                .invoice-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-bottom: 10px;
                }
                .invoice-table thead th {
                  border-bottom: 1px solid #000;
                  padding: 4px;
                  text-align: left;
                  font-weight: bold;
                  font-size: 8pt;
                }
                .invoice-table tbody td {
                  padding: 4px 4px;
                  font-size: 8pt;
                }
                .invoice-table td {
                  font-family: 'Courier New', monospace;
                }
                .invoice-table td:nth-child(2) {
                  width: 45%;
                }
                .invoice-table tbody td:nth-child(1),
                .invoice-table tbody td:nth-child(2),
                .invoice-table tbody td:nth-child(3),
                .invoice-table tbody td:nth-child(4),
                .invoice-table tbody td:nth-child(5) {
                  border-right: 1px solid #000;
                }
                .invoice-table td:nth-child(1),
                .invoice-table td:nth-child(3),
                .invoice-table td:nth-child(4),
                .invoice-table td:nth-child(5),
                .invoice-table td:nth-child(6) {
                  white-space: nowrap;
                }
                .invoice-table tfoot tr td {
                  padding: 6px 4px;
                  font-weight: bold;
                  font-size: 9pt;
                }
                .discount-row {
                  text-align: right;
                  border-top: 1px solid #000;
                }
                .total-row {
                  text-align: right;
                  border-top: 1px solid #000;
                }
                .spacer {
                  height: 100px;
                }
                .numeric-view {
                  font-family: 'Courier New', monospace;
                }
                .thin-line {
                  height: 0.5px;
                  background-color: #ccc;
                  border: none;
                  margin-top: 4px !important;
                  margin-bottom: 4px !important;
                }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header-section">
                <h1>Dev Medical Hall<h1>
                <p>Gola Road, Mahua, Vaishali - 844122</p>
                <p class="thin-line"></p>
                <p class="invoice-label">TAX INVOICE</p>
                <p class="thin-line"></p>
              </div>
              <div class="details-grid">
                <div class="bill-to">
                  <p><strong>Name:</strong> ${sale.customer || 'N/A'}</p>
                  <p><strong>Payment Mode:</strong> ${sale.modeOfPayment || 'N/A'}</p>
                </div>
                <div class="invoice-info">
                  <p><strong>Invoice No:</strong> IN${sale.id || 'XX'}</p>
                  <p><strong>Date:</strong> ${format(new Date(sale.date), 'dd MMMM yyyy HH:mm')}</p>
                </div>
              </div>
              <table class="invoice-table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Item(s)</th>
                    <th>Qty</th>
                    <th>Price(₹)</th>
                    <th>Tax</th>
                    <th>Amount(₹)</th>
                  </tr>
                </thead>
                <tbody>
                  ${sale.items.map((item, idx) => {
                    const discountAmount = item.price * item.quantity * ((item.discount ?? 0) / 100);
                    const itemTotal = (item.price * item.quantity) - discountAmount;
                    return `
                      <tr>
                        <td>${idx + 1}</td>
                        <td>${item.medicine.name}</td>
                        <td>${item.quantity}</td>
                        <td>${formatIndianCurrency(item.price)}</td>
                        <td>0</td>
                        <td>${formatIndianCurrency(itemTotal)}</td>
                      </tr>
                    `;
                  }).join('')}
                  ${sale.items.some(item => (item.discount || 0) > 0) ? `
                    <tr class="discount-row">
                      <td class="numeric-view" colspan="6">Discount: ₹${formatIndianCurrency(sale.items.reduce((sum, item) => sum + (item.price * item.quantity * ((item.discount ?? 0) / 100)), 0))}</td>
                    </tr>
                  ` : ''}
                   <tr>
                      <td><div class="spacer"></div></td>
                      <td><div class="spacer"></div></td>
                      <td><div class="spacer"></div></td>
                      <td><div class="spacer"></div></td>
                      <td><div class="spacer"></div></td>
                   </tr>
                </tbody>
                <tfoot>
                  <tr class="total-row">
                    <td colspan="6">Total: ₹${formatIndianCurrency(total)}</td>
                  </tr>
                  <tr class="total-row">
                    <td colspan="6">Amount Paid: ₹${formatIndianCurrency(paid)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  const handleViewItems = (sale: sell) => {
    setSelectedSaleItems(sale.items);
    setSelectedSale(sale);
    setItemDialogOpen(true);
  };

  const handleCloseItemDialog = () => {
    setItemDialogOpen(false);
    setSelectedSaleItems([]);
    setSelectedSale(null);
  };

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
              Sales History
            </Typography>
          </Box>
        </Box>

        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Paper sx={{ pl: 2, pb: 2, pt: 1, mb: 2, pr: 2 }}>
            <Box sx={{ mb: 1, display: "flex", justifyContent: "flex-start", alignItems: 'center', gap: 2 }}>
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
                label={<span style={{ fontSize: 14 }}>Enable Date Range Mode</span>}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={deleteEnabled}
                    onChange={e => setDeleteEnabled(e.target.checked)}
                    color="error"
                    size="small"
                  />
                }
                label={<span style={{ fontSize: 14, color: '#d32f2f', fontWeight: 600 }}>Enable Delete</span>}
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
                  {loading ? <CircularProgress size={24} /> : "Show Sales"}
                </Button>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Button
                  variant="outlined"
                  onClick={() => setReportDialogOpen(true)}
                  disabled={datesChanged || loading || sales.length === 0}
                  fullWidth
                >
                  Quick Report
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Error Snackbar */}
          <Snackbar
            open={!!error}
            autoHideDuration={30000}
            onClose={() => setError(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          >
            <Alert
              onClose={() => setError(null)}
              severity="error"
              sx={{ width: "100%" }}
            >
              {error}
            </Alert>
          </Snackbar>

          <Snackbar open={!!deleteSuccess} autoHideDuration={6000} onClose={() => setDeleteSuccess(null)}>
              <Alert onClose={() => setDeleteSuccess(null)} severity="success" sx={{ width: '100%' }}>
                  {deleteSuccess}
              </Alert>
          </Snackbar>

          <Snackbar open={!!deleteError} autoHideDuration={10000} onClose={() => setDeleteError(null)}>
              <Alert onClose={() => setDeleteError(null)} severity="error" sx={{ width: '100%' }}>
                  {deleteError}
              </Alert>
          </Snackbar>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Total Amount</TableCell>
                  <TableCell>Amount Paid</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontWeight: 500 }}>Mode</span>
                      <IconButton
                        size="small"
                        onClick={handleFilterClick}
                        sx={{ ml: 0.5, color: selectedModes.length < ALL_MODES.length ? 'primary.main' : 'inherit' }}
                        aria-label="Filter Modes"
                      >
                        <FilterListIcon fontSize="small" />
                      </IconButton>
                      <Menu
                        anchorEl={anchorEl}
                        open={filterOpen}
                        onClose={handleFilterClose}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                      >
                        <FormControl sx={{ m: 1, minWidth: 180 }} size="small">
                          <InputLabel id="mode-multiselect-label">Filter by Mode</InputLabel>
                          <Select
                            labelId="mode-multiselect-label"
                            multiple
                            value={selectedModes}
                            onChange={e => {
                              const value = e.target.value;
                              setSelectedModes(typeof value === 'string' ? value.split(',') : value);
                            }}
                            renderValue={selected => (selected as string[]).join(', ')}
                            label="Filter by Mode"
                            size="small"
                          >
                            {ALL_MODES.map(mode => (
                              <MenuItem key={mode} value={mode}>
                                <Checkbox checked={selectedModes.indexOf(mode) > -1} />
                                <ListItemText primary={mode} />
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Menu>
                    </Box>
                  </TableCell>
                  <TableCell>Created By</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : filteredSales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No sales records found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>
                        {format(new Date(sale.date), "dd/MM/yy HH:mm")}
                      </TableCell>
                      <TableCell>{sale.customer || "N/A"}</TableCell>
                      <TableCell>
                        ₹{formatIndianCurrency(sale.totalAmount)}
                      </TableCell>
                      <TableCell>
                        {sale.amountPaid ? `₹${formatIndianCurrency(sale.amountPaid)}` : 'Not specified'}
                      </TableCell>
                      <TableCell>{sale.modeOfPayment || "N/A"}</TableCell>
                      <TableCell>{sale.createdBy || "N/A"}</TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => handleViewItems(sale)}
                          color="info"
                          size="small"
                          title="View Items"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <Tooltip title={!deleteEnabled ? 'Enable delete using the checkbox above.' : ''} arrow disableHoverListener={deleteEnabled}>
                          <span>
                            <IconButton
                              onClick={() => handleDeleteClick(sale)}
                              color="error"
                              size="small"
                              disabled={!deleteEnabled}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <IconButton onClick={() => handlePrintInvoice(sale.id)} color="primary" size="small" title="Print Invoice">
                          <PrintIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <SalesReportDialog
            open={reportDialogOpen}
            onClose={() => setReportDialogOpen(false)}
            sales={sales}
            fromDate={singleDateMode ? date : fromDate}
            toDate={singleDateMode ? date : toDate}
          />

          <Dialog open={deleteConfirmOpen} onClose={handleCloseDeleteConfirm}>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WarningAmberIcon color="warning" />
              Confirm Delete
            </DialogTitle>
            <DialogContent>
              <DialogContentText>
                Are you sure you want to delete this sale record (Invoice No: IN{saleToDelete?.id})? 
                This will restore the stock quantities. This action cannot be undone.
              </DialogContentText>
              {deleteError && <Alert severity="error" sx={{mt: 2}}>{deleteError}</Alert>}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDeleteConfirm} disabled={deleteLoading}>
                Cancel
              </Button>
              <Button onClick={handleConfirmDelete} color="error" disabled={deleteLoading}>
                {deleteLoading ? <CircularProgress size={24} /> : 'Delete'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Items Dialog */}
          <Dialog open={itemDialogOpen} onClose={handleCloseItemDialog} maxWidth="sm" fullWidth>
            <DialogTitle>Sale Items {selectedSale ? `(Invoice No: IN${selectedSale.id})` : ''}</DialogTitle>
            <DialogContent>
              {selectedSaleItems.length === 0 ? (
                <Typography>No items found for this sale.</Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>No</TableCell>
                      <TableCell>Item</TableCell>
                      <TableCell>Qty</TableCell>
                      <TableCell>Price (₹)</TableCell>
                      <TableCell>Discount (%)</TableCell>
                      <TableCell>Amount (₹)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedSaleItems.map((item, idx) => {
                      const discountAmount = item.price * item.quantity * ((item.discount ?? 0) / 100);
                      const itemTotal = (item.price * item.quantity) - discountAmount;
                      return (
                        <TableRow key={item.id}>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell>
                            <span style={{ fontWeight: 600, color: '#e67e22' }}>{item.medicine.name}</span>
                          </TableCell>
                          <TableCell>
                            <span style={{ color: '#3498db' }}>{item.quantity}</span>
                          </TableCell>
                          <TableCell>{formatIndianCurrency(item.price)}</TableCell>
                          <TableCell>
                            {item.discount ? (
                              <span style={{ color: '#e74c3c' }}>{item.discount}</span>
                            ) : (
                              <span>{item.discount ?? 0}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span style={{ fontWeight: 500, color: '#2ecc71' }}>{formatIndianCurrency(itemTotal)}</span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseItemDialog}>Close</Button>
            </DialogActions>
          </Dialog>
        </Container>
      </Box>
    </LocalizationProvider>
  );
};

export default SalesHistory;
