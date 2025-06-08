import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    IconButton,
    Typography,
    CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Medicine, PageResponse, StockHistory } from '../types/medicine';
import { medicineApi } from '../services/api';
import StockHistoryDialog from '../components/StockHistoryDialog';

const MedicineInventory: React.FC = () => {
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [page, setPage] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [loading, setLoading] = useState(false);
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [openStockHistory, setOpenStockHistory] = useState(false);
    const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
    const [stockHistory, setStockHistory] = useState<StockHistory[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const fetchMedicines = async () => {
        setLoading(true);
        try {
            const response: PageResponse<Medicine> = await medicineApi.getMedicines(page, rowsPerPage);
            setMedicines(response.content);
            setTotalElements(response.totalElements);
        } catch (error) {
            console.error('Error fetching medicines:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMedicines();
    }, [page, rowsPerPage]);

    const handleChangePage = (_event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleAddMedicine = async () => {
        setOpenAddDialog(true);
    };

    const handleCloseAddDialog = (shouldRefresh: boolean) => {
        setOpenAddDialog(false);
        if (shouldRefresh) {
            fetchMedicines();
        }
    };

    const handleViewStockHistory = async (medicine: Medicine) => {
        if (!medicine.id) return;
        
        setSelectedMedicine(medicine);
        setLoadingHistory(true);
        setOpenStockHistory(true);
        
        try {
            const history = await medicineApi.getStockHistory(medicine.id);
            setStockHistory(history);
        } catch (error) {
            console.error('Error fetching stock history:', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h5" component="h2">
                    Medicine Inventory
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleAddMedicine}
                >
                    Add Medicine
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Available Quantity</TableCell>
                            <TableCell>Price</TableCell>
                            <TableCell>Expiry Date</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center">
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : (
                            medicines.map((medicine) => (
                                <TableRow key={medicine.id}>
                                    <TableCell>{medicine.name}</TableCell>
                                    <TableCell>{medicine.stock?.quantity || 0}</TableCell>
                                    <TableCell>₹{medicine.stock?.price || 0}</TableCell>
                                    <TableCell>{medicine.stock?.expDate || 'N/A'}</TableCell>
                                    <TableCell>
                                        <IconButton
                                            color="primary"
                                            onClick={() => handleViewStockHistory(medicine)}
                                        >
                                            <VisibilityIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <TablePagination
                component="div"
                count={totalElements}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />

            {selectedMedicine && (
                <StockHistoryDialog
                    open={openStockHistory}
                    onClose={() => setOpenStockHistory(false)}
                    stockHistory={stockHistory}
                    medicineName={selectedMedicine.name}
                />
            )}
        </Box>
    );
};

export default MedicineInventory; 