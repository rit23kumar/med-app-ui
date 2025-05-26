import React, { useEffect, useState, useCallback } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TablePagination,
    Typography,
    Button,
    Box,
    Chip,
    IconButton,
    useTheme,
    alpha
} from '@mui/material';
import { Medicine } from '../types/medicine';
import { medicineApi } from '../services/api';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';

export const MedicineList: React.FC = () => {
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [page, setPage] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const navigate = useNavigate();
    const theme = useTheme();

    const loadMedicines = useCallback(async () => {
        try {
            const response = await medicineApi.getAllMedicines(page, rowsPerPage);
            setMedicines(response.content);
            setTotalElements(response.totalElements);
        } catch (error) {
            console.error('Error loading medicines:', error);
        }
    }, [page, rowsPerPage]);

    useEffect(() => {
        loadMedicines();
    }, [loadMedicines]);

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <Box>
            <Box 
                sx={{ 
                    p: 3,
                    borderBottom: 1,
                    borderColor: 'divider',
                    backgroundColor: alpha(theme.palette.primary.main, 0.02)
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h4" component="h1" color="primary">
                        Medicine Inventory
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => navigate('/add-medicine')}
                        startIcon={<AddIcon />}
                        sx={{ 
                            px: 3,
                            py: 1,
                            fontWeight: 600,
                            '&:hover': {
                                transform: 'translateY(-1px)',
                                boxShadow: '0 4px 8px rgba(37, 99, 235, 0.2)',
                            },
                            transition: 'all 0.2s ease-in-out'
                        }}
                    >
                        Add New Medicine
                    </Button>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Manage and monitor your medicine inventory efficiently
                </Typography>
            </Box>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Manufacturer</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {medicines.map((medicine) => (
                            <TableRow 
                                key={medicine.id}
                                sx={{ 
                                    '&:hover': { 
                                        backgroundColor: alpha(theme.palette.primary.main, 0.02)
                                    },
                                    transition: 'background-color 0.2s ease-in-out'
                                }}
                            >
                                <TableCell>
                                    <Chip 
                                        label={medicine.id} 
                                        size="small" 
                                        sx={{ 
                                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                            color: theme.palette.primary.main,
                                            fontWeight: 500
                                        }}
                                    />
                                </TableCell>
                                <TableCell sx={{ fontWeight: 500 }}>{medicine.name}</TableCell>
                                <TableCell>{medicine.description}</TableCell>
                                <TableCell>{medicine.manufacture}</TableCell>
                                <TableCell>
                                    <IconButton
                                        color="primary"
                                        onClick={() => navigate(`/medicines/${medicine.id}`)}
                                        sx={{ 
                                            '&:hover': {
                                                backgroundColor: alpha(theme.palette.primary.main, 0.1)
                                            }
                                        }}
                                    >
                                        <VisibilityIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <TablePagination
                    component="div"
                    count={totalElements}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    sx={{
                        borderTop: 1,
                        borderColor: 'divider'
                    }}
                />
            </TableContainer>
        </Box>
    );
}; 