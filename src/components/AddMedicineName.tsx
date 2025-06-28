import React, { useState } from 'react';
import {
    Box,
    Button,
    TextField,
    Typography,
    Paper,
    CircularProgress,
    Alert,
    IconButton
} from '@mui/material';
import { medicineApi } from '../services/api';
import CloseIcon from '@mui/icons-material/Close';

interface AddMedicineNameProps {
    onSuccess?: () => void;
}

export const AddMedicineName: React.FC<AddMedicineNameProps> = ({ onSuccess }) => {
    const [medicineName, setMedicineName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!medicineName.trim()) return;

        setLoading(true);
        setError(null);
        setSuccess(false);
        setSuccessMessage('');

        try {
            await medicineApi.addMedicine({
                name: medicineName.trim(),
                enabled: true
            });
            setSuccess(true);
            setSuccessMessage(`${medicineName.trim()} added successfully!`);
            setMedicineName('');
            if (onSuccess) {
                onSuccess();
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to add medicine';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
                Add New Medicine
            </Typography>

            {error && (
                <Alert 
                    severity="error" 
                    sx={{ mb: 2 }}
                    action={
                        <IconButton
                            aria-label="close"
                            color="inherit"
                            size="small"
                            onClick={() => setError(null)}
                        >
                            <CloseIcon fontSize="inherit" />
                        </IconButton>
                    }
                >
                    {error}
                </Alert>
            )}

            {success && (
                <Alert 
                    severity="success" 
                    sx={{ mb: 2 }}
                    action={
                        <IconButton
                            aria-label="close"
                            color="inherit"
                            size="small"
                            onClick={() => setSuccess(false)}
                        >
                            <CloseIcon fontSize="inherit" />
                        </IconButton>
                    }
                >
                    {successMessage}
                </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 2 }}>
                <TextField
                    fullWidth
                    required
                    label="New Medicine Name"
                    value={medicineName}
                    onChange={(e) => setMedicineName(e.target.value)}
                    disabled={loading}
                    size="small"
                />
                <Button
                    type="submit"
                    variant="contained"
                    disabled={!medicineName.trim() || loading}
                    sx={{ minWidth: 140 }}
                >
                    {loading ? <CircularProgress size={24} /> : 'Add Medicine'}
                </Button>
            </Box>
        </Paper>
    );
}; 