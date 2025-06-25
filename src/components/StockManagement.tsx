import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Grid,
  Autocomplete,
  Alert,
  Snackbar,
  FormControlLabel,
  Switch,
  Divider,
  Card,
  CardContent,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { Medicine, Stock, StockHistory } from "../types/medicine";
import { medicineApi } from "../services/api";
import { format, parse } from "date-fns";
import StockHistoryTable from "./StockHistoryTable";
import { AddMedicineName } from "./AddMedicineName";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import InfoIcon from "@mui/icons-material/Info";
import Tooltip from "@mui/material/Tooltip";
import { formatIndianCurrency } from "../utils/formatCurrency";

interface EditBatchState {
  open: boolean;
  batch: StockHistory | null;
  data: {
    purchasedQuantity: string;
    availableQuantity: string;
    price: string;
  };
  error?: string | null;
}

const StockManagement: React.FC = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(
    null
  );
  const [expDate, setExpDate] = useState<Date | null>(null);
  const [quantity, setQuantity] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });
  const [stockHistory, setStockHistory] = useState<StockHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [includeFinished, setIncludeFinished] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [bulkResultModal, setBulkResultModal] = useState({
    open: false,
    results: [] as any[],
  });
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [batchToDeleteId, setBatchToDeleteId] = useState<number | null>(null);
  const [editBatch, setEditBatch] = useState<EditBatchState>({
    open: false,
    batch: null,
    data: { purchasedQuantity: "", availableQuantity: "", price: "" },
    error: null,
  });
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewOldValues, setReviewOldValues] = useState<{ purchasedQuantity: string; availableQuantity: string; price: string } | null>(null);
  const [reviewNewValues, setReviewNewValues] = useState<{ purchasedQuantity: string; availableQuantity: string; price: string } | null>(null);

  // Calculate total available quantity
  const totalAvailable = useMemo(() => {
    return stockHistory.reduce(
      (sum, entry) => sum + entry.availableQuantity,
      0
    );
  }, [stockHistory]);

  useEffect(() => {
    loadMedicines();
  }, []);

  useEffect(() => {
    if (selectedMedicine?.id) {
      loadStockHistory(selectedMedicine.id);
    } else {
      setStockHistory([]);
    }
  }, [selectedMedicine, includeFinished]);

  const loadMedicines = async () => {
    try {
      const response = await medicineApi.getAllMedicines();
      setMedicines(response);
    } catch (error) {
      console.error("Error loading medicines:", error);
      showNotification("Error loading medicines", "error");
    }
  };

  const loadStockHistory = async (medicineId: number) => {
    setLoadingHistory(true);
    try {
      const history = await medicineApi.getStockHistory(
        medicineId,
        includeFinished
      );
      setStockHistory(history);
    } catch (error) {
      console.error("Error loading stock history:", error);
      showNotification("Error loading stock history", "error");
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMedicine || !expDate || !quantity || !price) {
      showNotification("Please fill all required fields", "error");
      return;
    }

    const stockData: Stock = {
      expDate: format(expDate, "yyyy-MM-dd"),
      quantity: parseInt(quantity),
      price: parseFloat(price),
    };

    try {
      await medicineApi.addMedicineWithStock({
        medicine: selectedMedicine,
        stock: stockData,
      });
      const successMessage = `${
        selectedMedicine.name
      } stock updated: ${quantity} units @ ₹${formatIndianCurrency(
        parseFloat(price)
      )} (Exp: ${format(expDate, "dd-MMM-yyyy")})`;
      showNotification(successMessage, "success");
      if (selectedMedicine.id) {
        loadStockHistory(selectedMedicine.id);
      }
      resetForm();
    } catch (error) {
      console.error("Error updating stock:", error);
      showNotification("Error updating stock", "error");
    }
  };

  const resetForm = () => {
    setSelectedMedicine(null);
    setExpDate(null);
    setQuantity("");
    setPrice("");
  };

  const showNotification = (message: string, severity: "success" | "error") => {
    setNotification({
      open: true,
      message,
      severity,
    });
  };

  const downloadSampleCsv = () => {
    const csvContent =
      "Medicine Name,Expiration Date,Quantity,Price\n" +
      "Paracetamol,31-12-2029,100,5.99\n" +
      "Vitamin C,15-10-2029,50,12.50\n" +
      "Aspirin,30-06-2029,75,8.99";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "stock_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split("\n").slice(1); // Skip header row

        const stockEntries = lines
          .filter((line) => line.trim())
          .map((line) => {
            const [medicineName, expDate, quantity, price] = line
              .split(",")
              .map((field) => field.trim());
            return {
              medicineName,
              stock:
                expDate && quantity && price
                  ? {
                      expDate: (() => {
                        const [day, month, year] = expDate.split("-");
                        return `${year}-${month}-${day}`;
                      })(),
                      quantity: parseInt(quantity),
                      price: parseFloat(price),
                    }
                  : null,
            };
          });

        if (stockEntries.length === 0) {
          throw new Error("No valid data found in CSV");
        }

        setIsSubmitting(true);
        setUploadError(null);

        // Process each entry
        const results = await Promise.all(
          stockEntries.map(async (entry) => {
            try {
              if (!entry.medicineName) {
                return {
                  success: false,
                  name: "",
                  reason: "Missing medicine name",
                };
              }
              let searchResult = await medicineApi.searchMedicines(
                entry.medicineName.trim(),
                "contains"
              );
              let medicine = searchResult.find(
                (m) =>
                  m.name.toLowerCase() === entry.medicineName.trim().toLowerCase()
              );
              let isNew = false;
              if (!medicine) {
                medicine = await medicineApi.addMedicine({
                  name: entry.medicineName.trim(),
                });
                isNew = true;
              }
              if (entry.stock) {
                await medicineApi.addMedicineWithStock({
                  medicine,
                  stock: entry.stock,
                });
                return {
                  success: true,
                  name: entry.medicineName,
                  isNew,
                  stock: entry.stock,
                };
              } else {
                return {
                  success: true,
                  name: entry.medicineName,
                  isNew,
                  stock: null,
                };
              }
            } catch (err: any) {
              return {
                success: false,
                name: entry.medicineName,
                reason: err.response?.data?.message || err.message,
              };
            }
          })
        );

        setBulkResultModal({ open: true, results });

        const successfulUploads = results.filter((r) => r.success);
        const failedUploads = results.filter((r) => !r.success);

        if (successfulUploads.length > 0) {
          showNotification(
            `Successfully processed ${successfulUploads.length} medicine(s)`,
            "success"
          );
          loadMedicines();
        }

        if (failedUploads.length > 0) {
          const errorMessage = failedUploads
            .map((f) => `${f.name || "(blank)"}: ${f.reason}`)
            .join("\n");
          setUploadError(`Failed to process:\n${errorMessage}`);
        }

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (error: any) {
        console.error("Error processing CSV:", error);
        setUploadError(error.message || "Failed to process CSV file");
      } finally {
        setIsSubmitting(false);
      }
    };
    reader.readAsText(file);
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const handleDeleteBatch = (batchId: number) => {
    setBatchToDeleteId(batchId);
    setOpenConfirmDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (batchToDeleteId !== null) {
      try {
        await medicineApi.deleteStockBatch(batchToDeleteId);
        showNotification("Batch deleted successfully", "success");
        loadStockHistory(selectedMedicine?.id || 0);
      } catch (error) {
        console.error("Error deleting batch:", error);
        showNotification("Error deleting batch", "error");
      } finally {
        setBatchToDeleteId(null);
        setOpenConfirmDialog(false);
      }
    }
  };

  const handleOpenEditDialog = (batch: StockHistory) => {
    setEditBatch({
      open: true,
      batch,
      data: {
        purchasedQuantity: String(batch.quantity),
        availableQuantity: String(batch.availableQuantity),
        price: String(batch.price),
      },
      error: null,
    });
  };

  const handleCloseEditDialog = () => {
    setEditBatch({ open: false, batch: null, data: { purchasedQuantity: "", availableQuantity: "", price: "" }, error: null });
  };

  const handleEditFormChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setEditBatch(prev => {
      const newData = { ...prev.data, [name]: value };

      const purchased = parseInt(newData.purchasedQuantity, 10);
      const available = parseInt(newData.availableQuantity, 10);

      let error: string | null = null;
      if (!isNaN(purchased) && !isNaN(available) && available > purchased) {
        error = "Available quantity cannot be greater than purchased quantity.";
      }

      return {
        ...prev,
        data: newData,
        error: error,
      };
    });
  };

  const handleSaveEdit = () => {
    if (!editBatch.batch) return;
    setReviewOldValues({
      purchasedQuantity: String(editBatch.batch.quantity),
      availableQuantity: String(editBatch.batch.availableQuantity),
      price: String(editBatch.batch.price),
    });
    setReviewNewValues({ ...editBatch.data });
    setReviewDialogOpen(true);
  };

  const handleConfirmReview = async () => {
    setReviewDialogOpen(false);
    await handleConfirmEdit();
  };

  const handleCancelReview = () => {
    setReviewDialogOpen(false);
  };

  const handleConfirmEdit = async () => {
    if (!editBatch.batch || editBatch.error) {
      if(editBatch.error) showNotification("Please fix the validation errors before saving.", "error");
      return;
    }

    try {
      const updatedData = {
        quantity: parseInt(editBatch.data.purchasedQuantity, 10),
        availableQuantity: parseInt(editBatch.data.availableQuantity, 10),
        price: parseFloat(editBatch.data.price),
      };

      await medicineApi.updateStockBatch(editBatch.batch.id, updatedData);
      showNotification("Batch updated successfully", "success");
      handleCloseEditDialog();
      loadStockHistory(selectedMedicine?.id || 0);
    } catch (error: any) {
      console.error("Error updating batch:", error);
      showNotification(error.response?.data?.message || "Failed to update batch", "error");
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Manage Stocks
        </Typography>
        
        {/* Add Medicine Stock Section */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Add Medicine Stock (Purchase)
          </Typography>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Autocomplete
                  options={medicines}
                  getOptionLabel={(option) => option.name}
                  value={selectedMedicine}
                  onChange={(_, newValue) => setSelectedMedicine(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Medicine"
                      required
                      fullWidth
                      autoComplete="off"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <DatePicker
                  label="Expiration Date"
                  value={expDate}
                  onChange={(newValue) => setExpDate(newValue)}
                  format="dd/MM/yy"
                  slotProps={{
                    textField: {
                      required: true,
                      fullWidth: true,
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  fullWidth
                  autoComplete="off"
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Unit Price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  fullWidth
                  autoComplete="off"
                  inputProps={{ min: 0, step: "0.01" }}
                />
              </Grid>
              <Grid item xs={12}>
                <Box
                  sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}
                >
                  <Button type="button" variant="outlined" onClick={resetForm}>
                    Reset
                  </Button>
                  <Button type="submit" variant="contained" color="primary">
                    Update Stock
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>

          {selectedMedicine && (
            <Paper sx={{ p: 3 }}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Typography variant="h6">
                  Stock History - {selectedMedicine.name} (Total Available:{" "}
                  {totalAvailable})
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={includeFinished}
                      onChange={(e) => setIncludeFinished(e.target.checked)}
                      color="primary"
                      size="small"
                    />
                  }
                  label="Include Finished Batches"
                />
              </Box>
              <Divider sx={{ mb: 2 }} />
              <StockHistoryTable
                stockHistory={stockHistory}
                loading={loadingHistory}
                onDeleteBatch={handleDeleteBatch}
                onEditBatch={handleOpenEditDialog}
              />
            </Paper>
          )}
        </Paper>

        {/* Quick Add Medicine Section */}
        <AddMedicineName
          onSuccess={() => {
            showNotification("Medicine added successfully", "success");
            loadMedicines();
          }}
        />

        {/* Bulk Upload Section */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <Typography variant="h6">Bulk Upload</Typography>
              <Tooltip title="Add New Medicine with/without its Stock or Update existing medicine with its Stock">
                <InfoIcon color="action" fontSize="small" />
              </Tooltip>
            </Box>
            <Stack direction="row" spacing={2} alignItems="center">
              <Button
                variant="outlined"
                startIcon={<UploadFileIcon />}
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
              >
                Upload CSV
              </Button>
              <input
                type="file"
                accept=".csv"
                hidden
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              <Button
                variant="text"
                startIcon={<FileDownloadIcon />}
                onClick={downloadSampleCsv}
              >
                Download Template
              </Button>
            </Stack>
            {uploadError && (
              <Alert
                severity="error"
                sx={{ mt: 2 }}
                onClose={() => setUploadError(null)}
              >
                {uploadError}
              </Alert>
            )}
          </CardContent>
        </Card>

        <Snackbar
          open={notification.open}
          autoHideDuration={30000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        >
          <Alert
            onClose={handleCloseNotification}
            severity={notification.severity}
            sx={{ width: "100%" }}
          >
            {notification.message}
          </Alert>
        </Snackbar>

        <Dialog
          open={bulkResultModal.open}
          onClose={() => setBulkResultModal({ open: false, results: [] })}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Bulk Upload Results</DialogTitle>
          <DialogContent dividers>
            {bulkResultModal.results.length === 0 ? (
              <Typography>No results to display.</Typography>
            ) : (
              <Box>
                {bulkResultModal.results.filter((r) => r.success && r.isNew)
                  .length > 0 && (
                  <Box mb={2}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      New Medicines Added:
                    </Typography>
                    <ul>
                      {bulkResultModal.results
                        .filter((r) => r.success && r.isNew)
                        .map((r, idx) => (
                          <li key={idx}>{r.name}</li>
                        ))}
                    </ul>
                  </Box>
                )}
                {bulkResultModal.results.filter((r) => r.success && r.stock)
                  .length > 0 && (
                  <Box mb={2}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      Stock Updates:
                    </Typography>
                    <ul>
                      {bulkResultModal.results
                        .filter((r) => r.success && r.stock)
                        .map((r, idx) => (
                          <li key={idx}>
                            <Typography
                              variant="subtitle1"
                              color="textSecondary"
                            >
                              <b>{r.name}</b> — Quantity: {r.stock.quantity},
                              Price: ₹{formatIndianCurrency(r.stock.price)},
                              Expiry: {r.stock.expDate}{" "}
                              {r.isNew ? <>(new medicine)</> : null}
                            </Typography>
                          </li>
                        ))}
                    </ul>
                  </Box>
                )}
                {bulkResultModal.results.filter(
                  (r) => r.success && !r.stock && r.isNew
                ).length > 0 && (
                  <Box mb={2}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      Medicines Added Without Stock:
                    </Typography>
                    <ul>
                      {bulkResultModal.results
                        .filter((r) => r.success && !r.stock && r.isNew)
                        .map((r, idx) => (
                          <li key={idx}>{r.name}</li>
                        ))}
                    </ul>
                  </Box>
                )}
                {bulkResultModal.results.filter(
                  (r) => r.success && !r.stock && !r.isNew
                ).length > 0 && (
                  <Box mb={2}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      Existing Medicines (No Stock Update):
                    </Typography>
                    <ul>
                      {bulkResultModal.results
                        .filter((r) => r.success && !r.stock && !r.isNew)
                        .map((r, idx) => (
                          <li key={idx}>{r.name}</li>
                        ))}
                    </ul>
                  </Box>
                )}
                {bulkResultModal.results.filter((r) => !r.success).length >
                  0 && (
                  <Box mb={2}>
                    <Typography
                      variant="subtitle1"
                      fontWeight={600}
                      color="error"
                    >
                      Failures:
                    </Typography>
                    <ul>
                      {bulkResultModal.results
                        .filter((r) => !r.success)
                        .map((r, idx) => (
                          <li key={idx}>
                            <b>{r.name || "(blank)"}</b>: {r.reason}
                          </li>
                        ))}
                    </ul>
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setBulkResultModal({ open: false, results: [] })}
              color="primary"
              variant="contained"
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Confirmation Dialog for deleting a batch */}
        <Dialog
          open={openConfirmDialog}
          onClose={() => setOpenConfirmDialog(false)}
        >
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this batch? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenConfirmDialog(false)} color="primary">
              Cancel
            </Button>
            <Button onClick={handleConfirmDelete} color="error" autoFocus>
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Batch Dialog */}
        <Dialog open={editBatch.open} onClose={handleCloseEditDialog} maxWidth="xs" fullWidth>
          <DialogTitle>Edit Batch</DialogTitle>
          <DialogContent>
            <TextField
              margin="dense"
              label="Purchased Quantity"
              name="purchasedQuantity"
              type="number"
              value={editBatch.data.purchasedQuantity}
              onChange={handleEditFormChange}
              fullWidth
              required
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Available Quantity"
              name="availableQuantity"
              type="number"
              value={editBatch.data.availableQuantity}
              onChange={handleEditFormChange}
              fullWidth
              required
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Unit Price"
              name="price"
              type="number"
              value={editBatch.data.price}
              onChange={handleEditFormChange}
              fullWidth
              required
              sx={{ mb: 2 }}
            />
            {editBatch.error && <Alert severity="error">{editBatch.error}</Alert>}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseEditDialog}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={!!editBatch.error} variant="contained" color="primary">Save</Button>
          </DialogActions>
        </Dialog>

        {/* Review Edit Dialog */}
        <Dialog open={reviewDialogOpen} onClose={handleCancelReview} maxWidth="xs" fullWidth>
          <DialogTitle>Review Changes</DialogTitle>
          <DialogContent>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Old vs New Values</Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}></Grid>
              <Grid item xs={4}><Typography variant="body2" fontWeight={600} sx={{ color: '#d32f2f' }}>Old Value</Typography></Grid>
              <Grid item xs={4}><Typography variant="body2" fontWeight={600} sx={{ color: '#388e3c' }}>New Value</Typography></Grid>
              <Grid item xs={4}><Typography variant="body2">Purchased Qty</Typography></Grid>
              <Grid item xs={4}><Typography sx={{ color: '#d32f2f' }}>{reviewOldValues?.purchasedQuantity}</Typography></Grid>
              <Grid item xs={4}><Typography sx={{ color: '#388e3c' }}>{reviewNewValues?.purchasedQuantity}</Typography></Grid>
              <Grid item xs={4}><Typography variant="body2">Available Qty</Typography></Grid>
              <Grid item xs={4}><Typography sx={{ color: '#d32f2f' }}>{reviewOldValues?.availableQuantity}</Typography></Grid>
              <Grid item xs={4}><Typography sx={{ color: '#388e3c' }}>{reviewNewValues?.availableQuantity}</Typography></Grid>
              <Grid item xs={4}><Typography variant="body2">Unit Price</Typography></Grid>
              <Grid item xs={4}><Typography sx={{ color: '#d32f2f' }}>{reviewOldValues?.price}</Typography></Grid>
              <Grid item xs={4}><Typography sx={{ color: '#388e3c' }}>{reviewNewValues?.price}</Typography></Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelReview}>Cancel</Button>
            <Button onClick={handleConfirmReview} variant="contained" color="primary">Confirm</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default StockManagement;
