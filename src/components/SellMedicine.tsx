import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  useTheme,
  alpha,
  Alert,
  IconButton,
  CircularProgress,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Grid,
  Snackbar,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  AutocompleteRenderInputParams,
  useMediaQuery,
} from "@mui/material";
import { Medicine, StockHistory } from "../types/medicine";
import { CreateSellRequest } from "../types/sell";
import { medicineApi, sellApi } from "../services/api";
import { useNavigate } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import { format, differenceInDays, addDays } from "date-fns";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import { formatIndianCurrency } from "../utils/formatCurrency";
// Category icon mapping
import TabletIcon from '@mui/icons-material/Tablet';
import MedicationLiquidIcon from '@mui/icons-material/MedicationLiquid';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import HealingIcon from '@mui/icons-material/Healing';
import OpacityIcon from '@mui/icons-material/Opacity';
import BlurOnIcon from '@mui/icons-material/BlurOn';
import FilterVintageIcon from '@mui/icons-material/FilterVintage';
import AirIcon from '@mui/icons-material/Air';
import SprayIcon from '@mui/icons-material/Grain';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';

const categoryIconMap: Record<string, React.ReactNode> = {
  Tablet: <TabletIcon fontSize="large" sx={{ color: '#1976d2' }} />,
  Capsule: <MedicationLiquidIcon fontSize="large" sx={{ color: '#388e3c' }} />,
  Syrup: <LocalHospitalIcon fontSize="large" sx={{ color: '#fbc02d' }} />,
  Suspension: <HealingIcon fontSize="large" sx={{ color: '#7b1fa2' }} />,
  Injection: <OpacityIcon fontSize="large" sx={{ color: '#d32f2f' }} />,
  Ointment: <BlurOnIcon fontSize="large" sx={{ color: '#0288d1' }} />,
  Powder: <FilterVintageIcon fontSize="large" sx={{ color: '#f57c00' }} />,
  Drops: <OpacityIcon fontSize="large" sx={{ color: '#0288d1' }} />,
  Inhaler: <AirIcon fontSize="large" sx={{ color: '#1976d2' }} />,
  Spray: <SprayIcon fontSize="large" sx={{ color: '#388e3c' }} />,
  Others: <MoreHorizIcon fontSize="large" sx={{ color: '#757575' }} />,
};

interface sellItem {
  medicineId: number;
  medicineName: string;
  quantity: number;
  price: number;
  expDate: string;
  batchId: number;
  discount?: number | "";
}

interface FormErrors {
  customer?: string;
  medicine?: string;
  quantities?: { [key: number]: string };
}

interface SelectedBatchQuantity {
  batch: StockHistory;
  quantity: number;
}

export const SellMedicine: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(
    null
  );
  const [sellItems, setsellItems] = useState<sellItem[]>([]);
  const [customer, setCustomer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [availableBatches, setAvailableBatches] = useState<StockHistory[]>([]);
  const [selectedBatches, setSelectedBatches] = useState<{
    [key: number]: SelectedBatchQuantity;
  }>({});
  const [showSellModal, setShowSellModal] = useState(false);
  const [printError, setPrintError] = useState<string | null>(null);
  const receiptRef = React.useRef<HTMLDivElement>(null);
  const quantityRefs = React.useRef<{
    [batchId: number]: HTMLInputElement | null;
  }>({});
  const [modeOfPayment, setModeOfPayment] = useState<
    "Cash" | "Card" | "UPI" | "Ward Use" | "Pay Later"
  >("Cash");
  const [utrNumber, setUtrNumber] = useState<string>("");
  const [amountPaid, setAmountPaid] = useState<string>("");
  const [accountingDateOption, setAccountingDateOption] = useState<'today' | 'tomorrow'>('today');

  const medicineAutocompleteRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMedicines();
  }, []);

  useEffect(() => {
    if (selectedMedicine?.id) {
      loadAvailableBatches(selectedMedicine.id);
    } else {
      setAvailableBatches([]);
      setSelectedBatches({});
    }
  }, [selectedMedicine]);

  const fetchMedicines = async () => {
    try {
      const response = await medicineApi.getAllMedicines();
      setMedicines(response || []);
    } catch (err) {
      setError("Failed to fetch medicines");
      console.error("Error fetching medicines:", err);
    }
  };

  const loadAvailableBatches = async (medicineId: number) => {
    try {
      const history = await medicineApi.getStockHistory(medicineId, false);
      let availableBatches = history.filter(
        (batch) => batch.availableQuantity > 0
      );
      // Sort by days remaining (ascending)
      availableBatches = availableBatches.sort((a, b) => {
        const daysA = getRemainingDays(a.expDate);
        const daysB = getRemainingDays(b.expDate);
        return daysA - daysB;
      });
      setAvailableBatches(availableBatches);
      // Auto-select if only one batch
      if (availableBatches.length === 1) {
        setSelectedBatches({
          [availableBatches[0].id]: {
            batch: availableBatches[0],
            quantity: null as unknown as number,
          },
        });
        // Focus the quantity field after rendering
        setTimeout(() => {
          quantityRefs.current[availableBatches[0].id]?.focus();
        }, 200);
      } else {
        setSelectedBatches({});
      }
    } catch (err) {
      setError("Failed to fetch available batches");
      console.error("Error fetching batches:", err);
    }
  };

  const handleBatchToggle = (batch: StockHistory) => {
    setSelectedBatches((prev) => {
      const newSelected = { ...prev };
      if (newSelected[batch.id]) {
        delete newSelected[batch.id];
      } else {
        newSelected[batch.id] = { batch, quantity: null as unknown as number };
        // Focus the quantity field if selecting
        setTimeout(() => {
          quantityRefs.current[batch.id]?.focus();
        }, 100);
      }
      return newSelected;
    });
    setFormErrors((prev) => ({
      ...prev,
      quantities: {
        ...prev.quantities,
        [batch.id]: "",
      },
    }));
  };

  const handleQuantityChange = (batchId: number, value: number) => {
    const batch = availableBatches.find((b) => b.id === batchId);
    if (!batch || !selectedMedicine) return;

    // Calculate existing quantity for this batch from already added items
    const existingQuantity = sellItems
      .filter(
        (item) =>
          item.medicineId === selectedMedicine.id && item.batchId === batchId
      )
      .reduce((sum, item) => sum + item.quantity, 0);

    // Validate against available quantity including existing items
    const totalQuantity = existingQuantity + value;
    if (totalQuantity > batch.availableQuantity) {
      setFormErrors((prev) => ({
        ...prev,
        quantities: {
          ...prev.quantities,
          [batchId]: `Total quantity (${totalQuantity}) exceeds available stock (${batch.availableQuantity})`,
        },
      }));
      return;
    }

    setSelectedBatches((prev) => ({
      ...prev,
      [batchId]: {
        ...prev[batchId],
        quantity: value,
      },
    }));

    // Clear any errors for this batch
    setFormErrors((prev) => ({
      ...prev,
      quantities: {
        ...prev.quantities,
        [batchId]: "",
      },
    }));
  };

  const validateItemForm = (): boolean => {
    const errors: FormErrors = {
      quantities: {},
    };
    let isValid = true;

    if (!selectedMedicine) {
      errors.medicine = "Medicine is required";
      isValid = false;
    }

    const selectedBatchIds = Object.keys(selectedBatches);
    if (selectedBatchIds.length === 0) {
      errors.medicine = "Please select at least one batch";
      isValid = false;
    }

    selectedBatchIds.forEach((batchId) => {
      const { batch, quantity } = selectedBatches[Number(batchId)];
      if (quantity <= 0) {
        errors.quantities![batch.id] = "Quantity must be greater than 0";
        isValid = false;
      } else if (quantity > batch.availableQuantity) {
        errors.quantities![
          batch.id
        ] = `Maximum available quantity is ${batch.availableQuantity}`;
        isValid = false;
      }
    });

    setFormErrors(errors);
    return isValid;
  };

  const handleAddItem = () => {
    if (!validateItemForm() || !selectedMedicine) return;

    // Check if any of these items are already in the list
    const existingQuantities = sellItems
      .filter((item) => item.medicineId === selectedMedicine.id)
      .reduce((acc, item) => {
        const batchTotal = acc[item.batchId] || 0;
        return {
          ...acc,
          [item.batchId]: batchTotal + item.quantity,
        };
      }, {} as { [key: number]: number });

    // Validate total quantities for each batch
    let hasQuantityError = false;
    Object.values(selectedBatches).forEach(({ batch, quantity }) => {
      const existingQuantity = existingQuantities[batch.id] || 0;
      const totalQuantity = existingQuantity + quantity;

      if (totalQuantity > batch.availableQuantity) {
        setFormErrors((prev) => ({
          ...prev,
          quantities: {
            ...prev.quantities,
            [batch.id]: `Total quantity (${totalQuantity}) exceeds available stock (${batch.availableQuantity})`,
          },
        }));
        hasQuantityError = true;
      }
    });

    if (hasQuantityError) {
      return;
    }

    const newItems: sellItem[] = Object.values(selectedBatches).map(
      ({ batch, quantity }) => ({
        medicineId: selectedMedicine.id!,
        medicineName: selectedMedicine.name,
        quantity,
        price: batch.price,
        expDate: batch.expDate,
        batchId: batch.id,
        discount: "",
      })
    );

    setsellItems([...sellItems, ...newItems]);

    // Reset form
    setSelectedMedicine(null);
    setSelectedBatches({});
    setFormErrors({});

    // Set focus back to medicine autocomplete
    setTimeout(() => {
      medicineAutocompleteRef.current?.focus();
    }, 0);
  };

  const handleRemoveItem = (index: number) => {
    setsellItems(sellItems.filter((_, i) => i !== index));
  };

  const handleDiscountChange = (index: number, value: number | "") => {
    setsellItems((items) =>
      items.map((item, i) =>
        i === index ? { ...item, discount: value } : item
      )
    );
  };

  const calculateTotal = () => {
    return sellItems.reduce((total, item) => {
      const discount = item.discount === "" ? 0 : item.discount || 0;
      const discountedPrice = item.price * item.quantity * (1 - discount / 100);
      return total + discountedPrice;
    }, 0);
  };

  const getAccountingDate = () => {
    const base = new Date();
    return accountingDateOption === 'today' ? base : addDays(base, 1);
  };

  const handleSell = async (print: boolean) => {
    if (sellItems.length === 0) {
      setError("Please add at least one item to the sell");
      return;
    }

    if (modeOfPayment === "UPI" && utrNumber && utrNumber.length < 6) {
      setError("UTR number must be at least 6 digits");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setPrintError(null);
    try {
      const now = new Date();
      const accountingDate = getAccountingDate();
      const sellRequest: CreateSellRequest = {
        customer: customer || undefined,
        modeOfPayment,
        utrNumber: modeOfPayment === "UPI" ? utrNumber : undefined,
        amountPaid: amountPaid ? parseFloat(amountPaid) : undefined,
        invoiceDate: now.toISOString(),
        accountingDateOption: accountingDateOption,
        items: sellItems.map((item) => ({
          medicineId: item.medicineId,
          quantity: item.quantity,
          price: item.price,
          expDate: item.expDate,
          discount: item.discount === "" ? 0 : item.discount || 0,
          batchId: item.batchId,
        })),
      };
      const response = await sellApi.createsell(sellRequest);

      if (print) {
        handlePrintReceipt(response.id);
      }

      setShowSuccess(true);
      setsellItems([]);
      setCustomer("");
      setSelectedMedicine(null);
      setSelectedBatches({});
      setShowSellModal(false);
      setUtrNumber("");
      setAmountPaid("");
      setModeOfPayment("Cash");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to create sell. Please try again.";
      setError(errorMessage);
      setPrintError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintReceipt = (sellsId: number | undefined) => {
    if (!receiptRef.current) return;
    const printContents = receiptRef.current.innerHTML;
    const printWindow = window.open("", "", "width=595,height=842"); // A5 size in px
    if (printWindow) {
      const total = calculateTotal();
      const paid = isNaN(parseFloat(amountPaid))
        ? total
        : parseFloat(amountPaid);
      // Dynamic spacer height based on number of items
      let spacerHeight = 100;
      const length = sellItems.length;

      if (length > 24) spacerHeight = 0;
      else if (length > 20) spacerHeight = 20;
      else if (length > 16) spacerHeight = 60;
      else if (length > 12) spacerHeight = 100;
      else if (length > 8) spacerHeight = 140;
      else if (length > 4) spacerHeight = 180;
      else spacerHeight = 220;
      // const pending = total - paid;

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
                                    height: ${spacerHeight}px !important;
                                }
                                .numeric-view {
                                    font-family: 'Courier New', monospace;
                                }
                                .thin-line {
                                    height: 0.5px;
                                    background-color: #ccc; /* You missed the '#' */
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
                                    <p><strong>Name:</strong> ${
                                      customer || "XXXXX"
                                    }</p>
                                    <p><strong>Payment Mode:</strong> ${modeOfPayment}${
        utrNumber ? ` (${utrNumber})` : ""
      }</p>
                                </div>
                                <div class="invoice-info">
                                    <p><strong>Invoice No:</strong> IN${
                                      sellsId || "XX"
                                    }</p>
                                    <p><strong>Date:</strong> ${format(
                                      new Date(),
                                      "dd MMMM yyyy HH:mm"
                                    )}</p>
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
                                    ${sellItems
                                      .map((item, idx) => {
                                        const discountAmount =
                                          item.price *
                                          item.quantity *
                                          ((item.discount === ""
                                            ? 0
                                            : item.discount || 0) /
                                            100);
                                        const itemTotal =
                                          item.price * item.quantity -
                                          discountAmount;
                                        return `
                                            <tr>
                                                <td>${idx + 1}</td>
                                                <td>${item.medicineName}</td>
                                                <td>${item.quantity}</td>
                                                <td>${formatIndianCurrency(
                                                  item.price
                                                )}</td>
                                                <td>0</td>
                                                <td>${formatIndianCurrency(
                                                  itemTotal
                                                )}</td>
                                            </tr>
                                        `;
                                      })
                                      .join("")}
                                    <tr>
                                        <td><div class="spacer"></div></td>
                                        <td><div class="spacer"></div></td>
                                        <td><div class="spacer"></div></td>
                                        <td><div class="spacer"></div></td>
                                        <td><div class="spacer"></div></td>
                                    </tr>
                                </tbody>
                                <tfoot>
                                ${
                                    sellItems.some(
                                      (item) => (item.discount || 0) > 0
                                    )
                                      ? `
                                      <tr class="discount-row">
                                          <td class="numeric-view" colspan="6">Discount: ₹${formatIndianCurrency(
                                            sellItems.reduce(
                                              (sum, item) =>
                                                sum +
                                                item.price *
                                                  item.quantity *
                                                  ((item.discount === ""
                                                    ? 0
                                                    : item.discount || 0) /
                                                    100),
                                              0
                                            )
                                          )}</td>
                                      </tr>
                                  `
                                      : ""
                                  }
                                    <tr class="total-row">
                                        <td colspan="6">Total: ₹${formatIndianCurrency(
                                          total
                                        )}</td>
                                    </tr>
                                    <tr class="total-row">
                                        <td colspan="6">Amount Paid: ₹${formatIndianCurrency(
                                          paid
                                        )}</td>
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

  const getRemainingDays = (expDate: string) => {
    const today = new Date();
    const expiryDate = new Date(expDate);
    return differenceInDays(expiryDate, today);
  };

  const getExpiryColor = (remainingDays: number) => {
    if (remainingDays < 0) return "error.main";
    if (remainingDays < 30) return "error.main";
    if (remainingDays <= 90) return "warning.main";
    return "success.main";
  };

  const formatExpiryText = (expDate: string) => {
    const remainingDays = getRemainingDays(expDate);
    const formattedDate = format(new Date(expDate), "MMM dd, yyyy");

    if (remainingDays < 0) {
      return `${formattedDate} (Expired ${Math.abs(remainingDays)} days ago)`;
    }
    return `${formattedDate} (${remainingDays} Days Remaining)`;
  };

  return (
    <Box>
      <Box
        sx={{
          py: 2,
          px: isMobile ? 2 : 3,
          borderBottom: 1,
          borderColor: "divider",
          backgroundColor: alpha(theme.palette.primary.main, 0.02),
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            alignItems: isMobile ? "stretch" : "center",
            width: "100%",
          }}
        >
          <Typography
            variant={isMobile ? "h6" : "h5"}
            component="h1"
            color="primary"
            sx={{ fontWeight: 500 }}
          >
            Sale Medicine
          </Typography>
        </Box>
      </Box>

      <Box sx={{ p: 3 }}>
        {/* Add Item Section */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Add Items to Cart
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Autocomplete
                sx={{ zIndex: 1399 }}
                options={medicines}
                getOptionLabel={(option: Medicine) => option.name}
                value={selectedMedicine}
                onChange={(_, newValue: Medicine | null) =>
                  setSelectedMedicine(newValue)
                }
                ListboxProps={{
                  sx: {
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr 1fr', // 2 per row on extra small
                      sm: '1fr 1fr', // 2 per row on small
                      md: '1fr 1fr 1fr', // 3 per row on medium
                      lg: '1fr 1fr 1fr 1fr', // 4 per row on large
                    },
                    gap: 1,
                    p: 1,
                    background: theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fafbfc',
                  },
                }}
                PaperComponent={(props) => (
                  <Paper
                    {...props}
                    sx={{
                      mt: 1,
                      boxShadow: 3,
                      borderRadius: 2,
                      maxHeight: 400,
                      overflowY: 'auto',
                      minWidth: 350,
                      background: theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fafbfc',
                    }}
                  />
                )}
                renderOption={(props, option) => {
                  const isDark = theme.palette.mode === 'dark';
                  return (
                    <li
                      {...props}
                      key={option.id}
                      style={{
                        padding: 0,
                        margin: 0,
                        listStyle: 'none',
                        display: 'block',
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          p: 1.2,
                          borderRadius: 1,
                          border: `1px solid ${isDark ? theme.palette.divider : '#eee'}`,
                          background: isDark ? theme.palette.background.paper : '#fff',
                          minHeight: 64,
                          boxShadow: 1,
                          cursor: 'pointer',
                          transition: 'box-shadow 0.2s',
                          '&:hover': { boxShadow: 4, borderColor: 'primary.main' },
                        }}
                      >
                        <Box sx={{ mr: 1, display: 'flex', alignItems: 'center', height: '100%' }}>
                          {categoryIconMap[option.category?.name || 'Others']}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontFamily: 'var(--font-inter),sans-serif', fontWeight: 500, mb: -1, color: isDark ? theme.palette.text.primary : undefined }}>
                            {option.name}
                          </Typography>
                          <Typography variant="caption" sx={{ mt: 0, color: isDark ? theme.palette.text.secondary : 'text.secondary' }}>
                            Available: {option.available ?? 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                    </li>
                  );
                }}
                renderInput={(params: AutocompleteRenderInputParams) => (
                  <TextField
                    {...params}
                    label="Select Medicine"
                    required
                    fullWidth
                    error={!!formErrors.medicine}
                    helperText={formErrors.medicine}
                    autoComplete="off"
                    inputRef={medicineAutocompleteRef}
                  />
                )}
              />
            </Grid>

            {selectedMedicine && availableBatches.length === 0 && (
              <Grid item xs={12}>
                <Alert severity="warning">
                  No stock available for {selectedMedicine.name}.
                </Alert>
              </Grid>
            )}

            {selectedMedicine && availableBatches.length > 0 && (
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Available Batches
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell padding="checkbox">Select</TableCell>
                          <TableCell>Expiry Date</TableCell>
                          <TableCell>Available</TableCell>
                          <TableCell>Price</TableCell>
                          <TableCell>Quantity</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {availableBatches.map((batch) => (
                          <TableRow key={batch.id}>
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={!!selectedBatches[batch.id]}
                                onChange={() => handleBatchToggle(batch)}
                                onKeyPress={(e) => {
                                  if (e.key === "Enter") {
                                    handleBatchToggle(batch);
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography
                                sx={{
                                  color: getExpiryColor(
                                    getRemainingDays(batch.expDate)
                                  ),
                                }}
                              >
                                {formatExpiryText(batch.expDate)}
                              </Typography>
                            </TableCell>
                            <TableCell>{batch.availableQuantity}</TableCell>
                            <TableCell>
                              ₹{formatIndianCurrency(batch.price)}
                            </TableCell>
                            <TableCell>
                              {selectedBatches[batch.id] && (
                                <TextField
                                  type="number"
                                  size="small"
                                  value={
                                    selectedBatches[batch.id].quantity || ""
                                  }
                                  onChange={(e) =>
                                    handleQuantityChange(
                                      batch.id,
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                  onKeyPress={(e) => {
                                    if (e.key === "Enter") {
                                      handleAddItem();
                                    }
                                  }}
                                  error={!!formErrors.quantities?.[batch.id]}
                                  helperText={formErrors.quantities?.[batch.id]}
                                  inputProps={{
                                    min: 1,
                                    max: batch.availableQuantity,
                                  }}
                                  sx={{ width: 100 }}
                                  inputRef={(el) => {
                                    quantityRefs.current[batch.id] = el;
                                  }}
                                />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>
            )}

            <Grid item xs={12}>
              <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddItem}
                  disabled={
                    !selectedMedicine ||
                    Object.keys(selectedBatches).length === 0
                  }
                >
                  Add to Cart
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Cart Section */}
        {sellItems.length > 0 && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              Cart Items
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Medicine</TableCell>
                    <TableCell>Expiry Date</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Discount (%)</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sellItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.medicineName}</TableCell>
                      <TableCell>
                        <Typography
                          sx={{
                            color: getExpiryColor(
                              getRemainingDays(item.expDate)
                            ),
                          }}
                        >
                          {item.expDate}
                        </Typography>
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>₹{formatIndianCurrency(item.price)}</TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          value={item.discount === "" ? "" : item.discount}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "") {
                              handleDiscountChange(index, "");
                            } else {
                              handleDiscountChange(
                                index,
                                Math.max(0, Math.min(100, Number(val)))
                              );
                            }
                          }}
                          inputProps={{
                            min: 0,
                            max: 100,
                            style: { width: 60 },
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        ₹
                        {formatIndianCurrency(
                          item.price *
                            item.quantity *
                            (1 -
                              (item.discount === "" ? 0 : item.discount || 0) /
                                100)
                        )}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          color="error"
                          onClick={() => handleRemoveItem(index)}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mt: 3 }}>
              <Grid container spacing={2} alignItems="center">
                {/* Left side: Customer and Payment Mode */}
                <Grid item xs={12} sm={9} md={9}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={5}>
                      <TextField
                        label="Customer Name (Optional)"
                        value={customer}
                        onChange={(e) => setCustomer(e.target.value)}
                        size="small"
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <FormControl size="small" fullWidth>
                        <InputLabel id="mode-of-payment-label">
                          Mode of Payment
                        </InputLabel>
                        <Select
                          labelId="mode-of-payment-label"
                          value={modeOfPayment}
                          label="Mode of Payment"
                          onChange={(e) =>
                            setModeOfPayment(
                              e.target.value as
                                | "Cash"
                                | "Card"
                                | "UPI"
                                | "Ward Use"
                                | "Pay Later"
                            )
                          }
                        >
                          <MenuItem value="Cash">Cash</MenuItem>
                          <MenuItem value="UPI">UPI</MenuItem>
                          <MenuItem value="Ward Use">Ward Use</MenuItem>
                          <MenuItem value="Pay Later">Pay Later</MenuItem>
                          <MenuItem value="Card" disabled>
                            Card
                          </MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    {modeOfPayment === "UPI" && (
                      <Grid item xs={12} sm={4}>
                        <TextField
                          label="Last 6-digit of UTR (Optional)"
                          value={utrNumber}
                          onChange={(e) => setUtrNumber(e.target.value)}
                          inputProps={{
                            maxLength: 12,
                            pattern: "[0-9]*",
                          }}
                          error={utrNumber.length > 0 && utrNumber.length < 6}
                          helperText={
                            utrNumber.length > 0 && utrNumber.length < 6
                              ? "UTR must be at least 6 digits"
                              : ""
                          }
                          size="small"
                          fullWidth
                        />
                      </Grid>
                    )}
                  </Grid>
                </Grid>

                {/* Right side: Total and Complete Sell Button */}
                <Grid item xs={12} sm={3} md={3}>
                  <Box
                    sx={{
                      textAlign: { xs: "left", sm: "right" },
                      mt: { xs: 2, sm: 0 },
                    }}
                  >
                    <Typography variant="h6" gutterBottom>
                      Total: ₹{formatIndianCurrency(calculateTotal())}
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<ShoppingCartIcon />}
                      onClick={() => setShowSellModal(true)}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <CircularProgress size={24} />
                      ) : (
                        "Complete Sell"
                      )}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        )}

        <Snackbar
          open={!!error}
          autoHideDuration={30000}
          onClose={() => setError(null)}
        >
          <Alert
            onClose={() => setError(null)}
            severity="error"
            sx={{ width: "100%" }}
          >
            {error}
          </Alert>
        </Snackbar>

        <Snackbar
          open={showSuccess}
          autoHideDuration={30000}
          onClose={() => setShowSuccess(false)}
        >
          <Alert
            onClose={() => setShowSuccess(false)}
            severity="success"
            sx={{ width: "100%" }}
          >
            Sale completed successfully!
          </Alert>
        </Snackbar>

        <Dialog
          open={showSellModal}
          onClose={() => setShowSellModal(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Sell Review</span>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 1 }}>
                  Accounting Date:
                </Typography>
                <Button
                  variant={accountingDateOption === 'today' ? 'contained' : 'outlined'}
                  onClick={() => setAccountingDateOption('today')}
                  size="small"
                >
                  Today ({format(new Date(), 'dd MMM yyyy')})
                </Button>
                <Button
                  variant={accountingDateOption === 'tomorrow' ? 'contained' : 'outlined'}
                  onClick={() => setAccountingDateOption('tomorrow')}
                  size="small"
                >
                  Tomorrow ({format(addDays(new Date(), 1), 'dd MMM yyyy')})
                </Button>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            <div ref={receiptRef}>
              <Grid
                container
                spacing={0}
                sx={{ border: "1px solid #ccc", borderBottom: 0 }}
              >
                <Grid item xs={7} sx={{ borderRight: "1px solid #ccc", p: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                    BILL TO
                  </Typography>
                  {customer && (
                    <Typography variant="body2">{customer}</Typography>
                  )}
                </Grid>
                <Grid item xs={5} sx={{ p: 1 }}>
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                      Invoice No:
                    </Typography>
                    <Typography variant="body2">XXXX</Typography>
                  </Box>
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                    Invoice Date:
                    </Typography>
                    <Typography variant="body2">
                      {format(new Date(), "dd MMMM yyyy HH:mm")}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <table
                className="receipt-table"
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <thead>
                  <tr
                    style={{
                      backgroundColor: alpha(theme.palette.primary.light, 0.1),
                    }}
                  >
                    <th
                      style={{
                        border: `1px solid ${theme.palette.divider}`,
                        padding: "4px",
                        textAlign: "left",
                      }}
                    >
                      No.
                    </th>
                    <th
                      style={{
                        border: `1px solid ${theme.palette.divider}`,
                        padding: "4px",
                        textAlign: "left",
                        width: "40%",
                      }}
                    >
                      Items
                    </th>
                    <th
                      style={{
                        border: `1px solid ${theme.palette.divider}`,
                        padding: "4px",
                        textAlign: "left",
                      }}
                    >
                      Quantity
                    </th>
                    <th
                      style={{
                        border: `1px solid ${theme.palette.divider}`,
                        padding: "4px",
                        textAlign: "left",
                      }}
                    >
                      Price / Unit
                    </th>
                    <th
                      style={{
                        border: `1px solid ${theme.palette.divider}`,
                        padding: "4px",
                        textAlign: "left",
                      }}
                    >
                      Tax
                    </th>
                    <th
                      style={{
                        border: `1px solid ${theme.palette.divider}`,
                        padding: "4px",
                        textAlign: "left",
                      }}
                    >
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sellItems.map((item, idx) => {
                    const discountAmount =
                      item.price *
                      item.quantity *
                      ((item.discount === "" ? 0 : item.discount || 0) / 100);
                    const itemTotal =
                      item.price * item.quantity - discountAmount;
                    return (
                      <tr key={idx}>
                        <td
                          style={{
                            border: `1px solid ${theme.palette.divider}`,
                            padding: "4px",
                            fontFamily: "Courier New",
                          }}
                        >
                          {idx + 1}
                        </td>
                        <td
                          style={{
                            border: `1px solid ${theme.palette.divider}`,
                            padding: "4px",
                            fontFamily: "Courier New",
                            width: "40%",
                          }}
                        >
                          {item.medicineName}
                        </td>
                        <td
                          style={{
                            border: `1px solid ${theme.palette.divider}`,
                            padding: "4px",
                            fontFamily: "Courier New",
                          }}
                        >
                          {item.quantity}
                        </td>
                        <td
                          style={{
                            border: `1px solid ${theme.palette.divider}`,
                            padding: "4px",
                            fontFamily: "Courier New",
                          }}
                        >
                          ₹{formatIndianCurrency(item.price)}
                        </td>
                        <td
                          style={{
                            border: `1px solid ${theme.palette.divider}`,
                            padding: "4px",
                            fontFamily: "Courier New",
                          }}
                        >
                          ₹0 (0%)
                        </td>
                        <td
                          style={{
                            border: `1px solid ${theme.palette.divider}`,
                            padding: "4px",
                            fontFamily: "Courier New",
                          }}
                        >
                          ₹{formatIndianCurrency(itemTotal)}
                        </td>
                      </tr>
                    );
                  })}
                  {sellItems.some((item) => (item.discount || 0) > 0) && (
                    <tr
                      style={{
                        backgroundColor: alpha(
                          theme.palette.warning.light,
                          0.1
                        ),
                      }}
                    >
                      <td
                        colSpan={6}
                        style={{
                          border: `1px solid ${theme.palette.divider}`,
                          padding: "4px",
                        }}
                      >
                        Discount:
                        <span style={{ padding: "4px" }}>
                          ₹
                          {formatIndianCurrency(
                            sellItems.reduce(
                              (sum, item) =>
                                sum +
                                item.price *
                                  item.quantity *
                                  ((item.discount === ""
                                    ? 0
                                    : item.discount || 0) /
                                    100),
                              0
                            )
                          )}
                        </span>
                      </td>
                    </tr>
                  )}
                  <tr
                    style={{
                      backgroundColor: alpha(theme.palette.success.light, 0.1),
                    }}
                  >
                    <td
                      colSpan={2}
                      style={{
                        border: `1px solid ${theme.palette.divider}`,
                        padding: "4px",
                        fontWeight: "bold",
                      }}
                    >
                      Total
                    </td>
                    <td
                      style={{
                        border: `1px solid ${theme.palette.divider}`,
                        padding: "4px",
                        fontWeight: "bold",
                      }}
                    >
                      {sellItems.reduce((sum, item) => sum + item.quantity, 0)}
                    </td>
                    <td
                      colSpan={2}
                      style={{
                        border: `1px solid ${theme.palette.divider}`,
                        padding: "4px",
                        fontWeight: "bold",
                        textAlign: "right",
                      }}
                    ></td>
                    <td
                      style={{
                        border: `1px solid ${theme.palette.divider}`,
                        padding: "4px",
                        fontWeight: "bold",
                      }}
                    >
                      ₹{formatIndianCurrency(calculateTotal())}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <Box
              sx={{
                mt: 3,
                p: 2,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 1,
              }}
            >
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6}>
                  <Typography variant="h6" gutterBottom>
                    Total Amount: ₹{formatIndianCurrency(calculateTotal())}
                  </Typography>
                </Grid>
                {(modeOfPayment !== 'Ward Use' && modeOfPayment !== 'Pay Later') && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Amount Paid"
                      type="number"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      size="small"
                      fullWidth
                      inputProps={{
                        min: 0,
                        step: 0.01,
                      }}
                      placeholder={`₹${formatIndianCurrency(calculateTotal())}`}
                    />
                  </Grid>
                )}
              </Grid>
            </Box>

            {printError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {printError}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => handleSell(true)}
              color="primary"
              variant="contained"
              disabled={isSubmitting || modeOfPayment === "Ward Use"}
            >
              Complete With Print
            </Button>
            <Button
              onClick={() => handleSell(false)}
              color="success"
              variant="contained"
              disabled={isSubmitting}
            >
              {modeOfPayment === "Ward Use"
                ? "Complete Ward Use"
                : "Complete (No Print)"}
            </Button>
            <Button
              onClick={() => setShowSellModal(false)}
              color="inherit"
              variant="outlined"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};
