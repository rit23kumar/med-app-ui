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
    Tooltip,
    useMediaQuery,
    Menu,
    FormControl,
    Select,
    MenuItem,
    Checkbox,
    ListItemText,
    SelectChangeEvent,
    InputLabel,
} from '@mui/material';
import { Medicine } from '../types/medicine';
import { medicineApi } from '../services/api';
import { useNavigate } from 'react-router-dom';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import SearchIcon from '@mui/icons-material/Search';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import debounce from 'lodash/debounce';
import { FirstPage as FirstPageIcon, KeyboardArrowLeft, KeyboardArrowRight, LastPage as LastPageIcon } from '@mui/icons-material';
import MedicineDetailsDialog from './MedicineDetailsDialog';
import ExpiringMedicinesDialog from './ExpiringMedicinesDialog';
import { StockHistory } from '../types/medicine';
import NotificationImportantIcon from '@mui/icons-material/NotificationImportant';
import { useAuth } from '../contexts/AuthContext';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

interface PaginationActionsProps {
    count: number;
    page: number;
    rowsPerPage: number;
    onPageChange: (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => void;
}

const PaginationActions: React.FC<PaginationActionsProps> = ({
    count,
    page,
    rowsPerPage,
    onPageChange
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const lastPage = Math.max(0, Math.ceil(count / rowsPerPage) - 1);
    const [inputPage, setInputPage] = useState(page + 1);

    useEffect(() => {
        setInputPage(page + 1);
    }, [page]);

    const handlePageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value);
        setInputPage(value);
    };

    const handlePageInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const targetPage = Math.min(Math.max(1, inputPage), lastPage + 1) - 1;
            onPageChange(null, targetPage);
        }
    };

    const handleBlur = () => {
        setInputPage(page + 1);
    };

    return (
        <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            flexWrap: isMobile ? 'wrap' : 'nowrap',
            justifyContent: 'center',
            width: '100%'
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <IconButton
                    onClick={e => onPageChange(e, 0)}
                    disabled={page === 0}
                    aria-label="first page"
                    size={isMobile ? "small" : "medium"}
                >
                    <FirstPageIcon />
                </IconButton>
                <IconButton
                    onClick={e => onPageChange(e, page - 1)}
                    disabled={page === 0}
                    aria-label="previous page"
                    size={isMobile ? "small" : "medium"}
                >
                    <KeyboardArrowLeft />
                </IconButton>
            </Box>
            <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5, 
                minWidth: isMobile ? '110px' : '140px', 
                whiteSpace: 'nowrap',
                justifyContent: 'center'
            }}>
                <TextField
                    value={inputPage}
                    onChange={handlePageInput}
                    onKeyPress={handlePageInputKeyPress}
                    onBlur={handleBlur}
                    type="number"
                    size="small"
                    sx={{
                        width: isMobile ? '50px' : '60px',
                        '& input': { 
                            textAlign: 'center', 
                            p: isMobile ? 0.25 : 0.5,
                            '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
                                '-webkit-appearance': 'none',
                                margin: 0
                            },
                            '&[type=number]': {
                                '-moz-appearance': 'textfield'
                            }
                        }
                    }}
                    inputProps={{
                        min: 1,
                        max: lastPage + 1,
                        'aria-label': 'page number'
                    }}
                />
                <Typography 
                    variant={isMobile ? "caption" : "body2"} 
                    color="text.secondary" 
                    sx={{ flexShrink: 0 }}
                >
                    of {lastPage + 1}
                </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <IconButton
                    onClick={e => onPageChange(e, page + 1)}
                    disabled={page >= lastPage}
                    aria-label="next page"
                    size={isMobile ? "small" : "medium"}
                >
                    <KeyboardArrowRight />
                </IconButton>
                <IconButton
                    onClick={e => onPageChange(e, lastPage)}
                    disabled={page >= lastPage}
                    aria-label="last page"
                    size={isMobile ? "small" : "medium"}
                >
                    <LastPageIcon />
                </IconButton>
            </Box>
        </Box>
    );
};

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
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [selectedMedicineId, setSelectedMedicineId] = useState<number | null>(null);
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
    const [expiringDialogOpen, setExpiringDialogOpen] = useState(false);
    const [expiringMedicines, setExpiringMedicines] = useState<StockHistory[]>([]);
    const [loadingExpiring, setLoadingExpiring] = useState(false);
    const { isAdmin } = useAuth();
    const [grandTotal, setGrandTotal] = useState<number | null>(null);
    const [showStockValue, setShowStockValue] = useState(false);
    const [enabledFilter, setEnabledFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
    const [enabledFilterAnchorEl, setEnabledFilterAnchorEl] = useState<null | HTMLElement>(null);

    useEffect(() => {
        if (!isAdmin) return;
        // Fetch grand total cost
        const fetchGrandTotal = async () => {
            try {
                const response = await medicineApi.getGrandTotalStockValue();
                setGrandTotal(response);
            } catch (err) {
                setGrandTotal(null);
            }
        };
        fetchGrandTotal();
    }, [isAdmin]);

    const fetchMedicines = async (search?: string, type?: 'contains' | 'startsWith') => {
        try {
            setLoading(true);
            setError(null);
            if (search) {
                const data = await medicineApi.searchMedicines(search, type || searchType);
                setMedicines(data);
                setTotalElements(data.length);
            } else {
                const response = await medicineApi.getMedicines(page, rowsPerPage);
                setMedicines(response.content);
                setTotalElements(response.totalElements);
            }
        } catch (err) {
            console.error('Error fetching medicines:', err);
            setError('Failed to fetch medicines');
            setMedicines([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMedicines();
    }, [page, rowsPerPage]);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
        debouncedSearch(event.target.value);
    };

    const debouncedSearch = useCallback(
        debounce((search: string) => {
            setPage(0);
            fetchMedicines(search);
        }, 500),
        []
    );

    const handleSearchTypeChange = (
        event: React.MouseEvent<HTMLElement>,
        newSearchType: 'contains' | 'startsWith'
    ) => {
        if (newSearchType !== null) {
            setSearchType(newSearchType);
            setPage(0);
            if (searchTerm) {
                fetchMedicines(searchTerm, newSearchType);
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

    const handleViewDetails = (medicineId: number) => {
        setSelectedMedicineId(medicineId);
        setDetailsDialogOpen(true);
    };

    const handleShowExpiring = async (event?: React.MouseEvent<HTMLButtonElement>) => {
        if (event) event.preventDefault();
        setLoadingExpiring(true);
        try {
            const response = await medicineApi.getExpiringMedicines();
            setExpiringMedicines(response);
            setExpiringDialogOpen(true);
        } catch (err) {
            console.error('Error fetching expiring medicines:', err);
        } finally {
            setLoadingExpiring(false);
        }
    };

    const handleToggleEnabled = async (medicine: Medicine) => {
        try {
            await medicineApi.updateMedicineEnabled(medicine.id!, !medicine.enabled);
            fetchMedicines();
        } catch (err) {
            console.error('Error toggling medicine enabled status:', err);
        }
    };

    const handleDownloadFlatExport = async () => {
        try {
            const response = await medicineApi.getFlatExport();
            const header = ['name', 'enabled', 'expDate', 'availableQty', 'price'];
            const csv = [header.join(','), ...response.map(row =>
                header.map(h => `"${(row[h] ?? '').toString().replace(/"/g, '""')}"`).join(',')
            )].join('\r\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'medicines_flat_export.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error downloading export:', err);
        }
    };

    const handleEnabledFilterClick = (event: React.MouseEvent<HTMLElement>) => {
        setEnabledFilterAnchorEl(event.currentTarget);
    };

    const handleEnabledFilterClose = () => {
        setEnabledFilterAnchorEl(null);
    };

    const handleEnabledFilterChange = (event: SelectChangeEvent<'all' | 'enabled' | 'disabled'>) => {
        const value = event.target.value as 'all' | 'enabled' | 'disabled';
        setEnabledFilter(value);
        setPage(0); // Reset to first page when changing filter
        handleEnabledFilterClose();
    };

    // Filter medicines based on enabled status
    const filteredMedicines = medicines.filter(medicine => {
        if (enabledFilter === 'all') return true;
        if (enabledFilter === 'enabled') return medicine.enabled;
        if (enabledFilter === 'disabled') return !medicine.enabled;
        return true;
    });

    return (
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
                        Medicine Inventory
                    </Typography>
                    
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: isMobile ? 'column' : 'row',
                            justifyContent: isMobile ? 'stretch' : 'flex-end',
                            alignItems: isMobile ? 'stretch' : 'center',
                            gap: 1,
                        }}
                    >
                        {isAdmin && grandTotal !== null && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="subtitle1" color="secondary" sx={{ fontWeight: 500 }}>
                                    Stock Value:
                                </Typography>
                                {showStockValue ? (
                                    <Typography variant="subtitle1" color="secondary" sx={{ fontWeight: 500 }}>
                                        ₹{grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                    </Typography>
                                ) : (
                                    <Typography variant="subtitle1" color="secondary" sx={{ fontWeight: 500, letterSpacing: 2 }}>
                                        ****
                                    </Typography>
                                )}
                                <IconButton color="secondary" onClick={() => setShowStockValue(v => !v)} size="small" sx={{ ml: 0.5 }}>
                                    {showStockValue ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                </IconButton>
                            </Box>
                        )}
                        
                        <Button
                            type="button"
                            variant="outlined"
                            startIcon={<NotificationImportantIcon />}
                            onClick={handleShowExpiring}
                            sx={{ whiteSpace: 'nowrap' }}
                        >
                            Expiring Soon
                        </Button>
                        
                        {isAdmin && (
                            <Button
                                variant="outlined"
                                startIcon={<FileDownloadIcon />}
                                onClick={handleDownloadFlatExport}
                                sx={{ whiteSpace: 'nowrap' }}
                            >
                                Export
                            </Button>
                        )}
                    </Box>
                </Box>
            </Box>

            <Stack 
                direction={isMobile ? "column" : "row"} 
                spacing={2} 
                sx={{ 
                    px: isMobile ? 2 : 2, 
                    py: 2,
                    width: '100%'
                }}
            >
                <TextField
                    sx={{
                        width: isMobile ? '100%' : '60%',
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
                    sx={{
                        '& .MuiToggleButton-root': {
                            borderColor: alpha(theme.palette.text.primary, 0.1),
                            color: theme.palette.text.secondary,
                            '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.05),
                                borderColor: alpha(theme.palette.text.primary, 0.2)
                            }
                        }
                    }}
                >
                    <ToggleButton 
                        value="startsWith" 
                        aria-label="starts with search"
                        sx={{
                            px: 2,
                            whiteSpace: 'nowrap',
                            flex: isMobile ? 1 : 'initial',
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
                    <ToggleButton
                        value="contains"
                        aria-label="contains search"
                        sx={{
                            px: 2,
                            whiteSpace: 'nowrap',
                            flex: isMobile ? 1 : 'initial',
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
                                <SearchIcon sx={{ mr: 0.5 }} />
                                Contains
                            </Box>
                        </Tooltip>
                    </ToggleButton>
                </ToggleButtonGroup>
            </Stack>
            
            {error && (
                <Alert severity="error" sx={{ mx: isMobile ? 2 : 2, mb: 2.5 }}>
                    {error}
                </Alert>
            )}

            {isMobile ? (
                // Mobile view - Card layout
                <Box sx={{ px: 2 }}>
                    {loading ? (
                        Array.from(new Array(3)).map((_, index) => (
                            <Card key={index} sx={{ mb: 2 }}>
                                <CardContent>
                                    <Skeleton animation="wave" height={24} width="60%" sx={{ mb: 1 }} />
                                    <Skeleton animation="wave" height={20} width="40%" />
                                    <Skeleton animation="wave" height={20} width="30%" />
                                </CardContent>
                            </Card>
                        ))
                    ) : filteredMedicines.length === 0 ? (
                        <Card sx={{ mb: 2 }}>
                            <CardContent>
                                <Typography color="text.secondary" align="center">
                                    {searchTerm ? 'No medicines found matching your search' : 'No medicines available'}
                                </Typography>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredMedicines.map((medicine) => (
                            <Card key={medicine.id} sx={{ mb: 2 }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                        <Box>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                                                {medicine.name}
                                            </Typography>
                                        </Box>
                                        <IconButton
                                            size="small"
                                            color="primary"
                                            onClick={() => handleViewDetails(medicine.id!)}
                                            sx={{ 
                                                '&:hover': {
                                                    backgroundColor: alpha(theme.palette.primary.main, 0.1)
                                                }
                                            }}
                                        >
                                            <VisibilityIcon />
                                        </IconButton>
                                    </Box>
                                    <Chip 
                                        label={`ID: ${medicine.id}`} 
                                        size="small" 
                                        sx={{ 
                                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                            color: theme.palette.primary.main,
                                            fontWeight: 500
                                        }}
                                    />
                                </CardContent>
                            </Card>
                        ))
                    )}
                </Box>
            ) : (
                // Desktop view - Table layout
                <TableContainer>
                    <Table size="medium">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600, py: 2 }}>ID</TableCell>
                                <TableCell sx={{ fontWeight: 600, py: 2 }}>Name</TableCell>
                                <TableCell sx={{ fontWeight: 600, py: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 500 }}>Enabled</span>
                                        <IconButton
                                            size="small"
                                            onClick={handleEnabledFilterClick}
                                            sx={{ ml: 0.5, color: enabledFilter !== 'all' ? 'primary.main' : 'inherit' }}
                                            aria-label="Filter Enabled Status"
                                        >
                                            <FilterAltIcon fontSize="small" />
                                        </IconButton>
                                        <Menu
                                            anchorEl={enabledFilterAnchorEl}
                                            open={Boolean(enabledFilterAnchorEl)}
                                            onClose={handleEnabledFilterClose}
                                            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                                        >
                                            <FormControl sx={{ m: 1, minWidth: 130 }} size="small">
                                                <InputLabel id="enabled-filter-label">Filter by Status</InputLabel>
                                                <Select
                                                    labelId="enabled-filter-label"
                                                    value={enabledFilter}
                                                    onChange={handleEnabledFilterChange}
                                                    label="Filter by Status"
                                                    size="small"
                                                >
                                                    <MenuItem value="all">All</MenuItem>
                                                    <MenuItem value="enabled">Enabled</MenuItem>
                                                    <MenuItem value="disabled">Disabled</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Menu>
                                    </Box>
                                </TableCell>
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
                                    </TableRow>
                                ))
                            ) : filteredMedicines.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                                        <Typography color="text.secondary">
                                            {searchTerm ? 'No medicines found matching your search' : 'No medicines available'}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredMedicines.map((medicine) => (
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
                                        <TableCell>
                                            <Checkbox
                                                checked={!!medicine.enabled}
                                                disabled={!isAdmin}
                                                onChange={() => isAdmin && handleToggleEnabled(medicine)}
                                                color={medicine.enabled ? 'primary' : 'default'}
                                                inputProps={{ 'aria-label': 'Enable/Disable medicine' }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <IconButton
                                                size="medium"
                                                color="primary"
                                                onClick={() => handleViewDetails(medicine.id!)}
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
                </TableContainer>
            )}

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
                        minHeight: '52px',
                        gap: 2,
                        flexWrap: 'wrap',
                        justifyContent: isMobile ? 'center' : 'flex-end',
                        px: isMobile ? 1 : 2
                    },
                    '& .MuiTablePagination-displayedRows': {
                        margin: isMobile ? '8px 0' : 0
                    },
                    '& .MuiTablePagination-selectLabel': {
                        margin: isMobile ? '8px 0' : 0
                    }
                }}
                ActionsComponent={PaginationActions}
            />

            {selectedMedicineId && (
                <MedicineDetailsDialog
                    open={detailsDialogOpen}
                    onClose={() => {
                        setDetailsDialogOpen(false);
                        setSelectedMedicineId(null);
                    }}
                    medicineId={selectedMedicineId}
                />
            )}

            <ExpiringMedicinesDialog
                open={expiringDialogOpen}
                onClose={() => setExpiringDialogOpen(false)}
                medicines={expiringMedicines}
                loading={loadingExpiring}
            />
        </Box>
    );
}; 