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
    alpha,
    TextField,
    InputAdornment,
    Card,
    CardContent,
    Skeleton,
    Alert,
    ToggleButton,
    ToggleButtonGroup,
    Stack,
    Tooltip
} from '@mui/material';
import { Medicine } from '../types/medicine';
import { medicineApi } from '../services/api';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import debounce from 'lodash/debounce';

export const MedicineList: React.FC = () => {
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchType, setSearchType] = useState<'contains' | 'startsWith'>('startsWith');
    const [page, setPage] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const navigate = useNavigate();
    const theme = useTheme();

    const fetchMedicines = async (search?: string) => {
        try {
            setLoading(true);
            setError(null);
            if (search) {
                const data = await medicineApi.searchMedicines(search, searchType);
                setMedicines(data);
                setTotalElements(data.length);
            } else {
                const response = await medicineApi.getAllMedicines(page, rowsPerPage);
                setMedicines(response.content);
                setTotalElements(response.totalElements);
            }
        } catch (err) {
            setError('Failed to fetch medicines');
            console.error('Error fetching medicines:', err);
        } finally {
            setLoading(false);
        }
    };

    const debouncedSearch = debounce((term: string) => {
        fetchMedicines(term);
    }, 300);

    useEffect(() => {
        fetchMedicines();
    }, [page, rowsPerPage]);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setSearchTerm(value);
        setPage(0); // Reset to first page when searching
        debouncedSearch(value);
    };

    const handleSearchTypeChange = (
        event: React.MouseEvent<HTMLElement>,
        newSearchType: 'contains' | 'startsWith'
    ) => {
        if (newSearchType !== null) {
            setSearchType(newSearchType);
            if (searchTerm) {
                fetchMedicines(searchTerm);
            }
        }
    };

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
                    py: 2,
                    px: 3,
                    borderBottom: 1,
                    borderColor: 'divider',
                    backgroundColor: alpha(theme.palette.primary.main, 0.02)
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h5" component="h1" color="primary" sx={{ fontWeight: 500 }}>
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
            </Box>
            
            <Stack direction="row" spacing={2} sx={{ px: 2, py: 2 }}>
                <TextField
                    sx={{
                        width: '60%',
                        '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                                borderColor: alpha(theme.palette.text.primary, 0.1),
                                borderWidth: '1px'
                            },
                            '&:hover fieldset': {
                                borderColor: alpha(theme.palette.text.primary, 0.2)
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: theme.palette.primary.main
                            }
                        }
                    }}
                    placeholder="Search medicines by name..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="action" />
                            </InputAdornment>
                        ),
                        sx: {
                            backgroundColor: alpha(theme.palette.primary.main, 0.02),
                            '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.03)
                            }
                        }
                    }}
                />
                <ToggleButtonGroup
                    value={searchType}
                    exclusive
                    onChange={handleSearchTypeChange}
                    aria-label="search type"
                    size="small"
                >
                    <ToggleButton 
                        value="contains" 
                        aria-label="contains search"
                        sx={{
                            px: 2,
                            whiteSpace: 'nowrap',
                            '&.Mui-selected': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                color: theme.palette.primary.main,
                                '&:hover': {
                                    backgroundColor: alpha(theme.palette.primary.main, 0.15),
                                }
                            }
                        }}
                    >
                        <Tooltip title="Search anywhere in name">
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <FilterAltIcon sx={{ mr: 0.5 }} />
                                Contains
                            </Box>
                        </Tooltip>
                    </ToggleButton>
                    <ToggleButton 
                        value="startsWith" 
                        aria-label="starts with search"
                        sx={{
                            px: 2,
                            whiteSpace: 'nowrap',
                            '&.Mui-selected': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                color: theme.palette.primary.main,
                                '&:hover': {
                                    backgroundColor: alpha(theme.palette.primary.main, 0.15),
                                }
                            }
                        }}
                    >
                        <Tooltip title="Search from start of name">
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <SearchIcon sx={{ mr: 0.5 }} />
                                Starts With
                            </Box>
                        </Tooltip>
                    </ToggleButton>
                </ToggleButtonGroup>
            </Stack>
            
            {error && (
                <Alert severity="error" sx={{ mx: 2, mb: 2.5 }}>
                    {error}
                </Alert>
            )}
            <TableContainer>
                <Table size="medium">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600, py: 2 }}>ID</TableCell>
                            <TableCell sx={{ fontWeight: 600, py: 2 }}>Name</TableCell>
                            <TableCell sx={{ fontWeight: 600, py: 2 }}>Description</TableCell>
                            <TableCell sx={{ fontWeight: 600, py: 2 }}>Manufacturer</TableCell>
                            <TableCell sx={{ fontWeight: 600, py: 2 }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            Array.from(new Array(5)).map((_, index) => (
                                <TableRow key={index}>
                                    <TableCell><Skeleton animation="wave" height={35} /></TableCell>
                                    <TableCell><Skeleton animation="wave" height={35} /></TableCell>
                                    <TableCell><Skeleton animation="wave" height={35} /></TableCell>
                                    <TableCell><Skeleton animation="wave" height={35} /></TableCell>
                                    <TableCell><Skeleton animation="wave" height={35} /></TableCell>
                                </TableRow>
                            ))
                        ) : medicines.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">
                                        {searchTerm ? 'No medicines found matching your search' : 'No medicines available'}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            medicines.map((medicine) => (
                                <TableRow 
                                    key={medicine.id}
                                    sx={{ 
                                        '&:hover': { 
                                            backgroundColor: alpha(theme.palette.primary.main, 0.02)
                                        },
                                        transition: 'background-color 0.2s ease-in-out',
                                        '& .MuiTableCell-root': {
                                            py: 1.5
                                        }
                                    }}
                                >
                                    <TableCell>
                                        <Chip 
                                            label={medicine.id} 
                                            size="small" 
                                            sx={{ 
                                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                                color: theme.palette.primary.main,
                                                fontWeight: 500,
                                                height: '28px'
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 500 }}>{medicine.name}</TableCell>
                                    <TableCell>{medicine.description}</TableCell>
                                    <TableCell>{medicine.manufacture}</TableCell>
                                    <TableCell>
                                        <IconButton
                                            size="medium"
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
                            ))
                        )}
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
                        borderColor: 'divider',
                        '& .MuiTablePagination-toolbar': {
                            minHeight: '52px'
                        }
                    }}
                />
            </TableContainer>
        </Box>
    );
}; 