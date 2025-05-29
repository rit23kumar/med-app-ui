import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
} from '@mui/material';
import { Medicine } from '../types/medicine';
import { medicineApi } from '../services/api';

interface AddMedicineDialogProps {
    open: boolean;
    onClose: (shouldRefresh: boolean) => void;
}

const AddMedicineDialog: React.FC<AddMedicineDialogProps> = ({ open, onClose }) => {
    const [medicine, setMedicine] = useState<Partial<Medicine>>({
        name: '',
        description: '',
        manufacture: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setMedicine(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async () => {
        try {
            await medicineApi.addMedicine(medicine as Medicine);
            onClose(true);
            // Reset form
            setMedicine({
                name: '',
                description: '',
                manufacture: '',
            });
        } catch (error) {
            console.error('Error adding medicine:', error);
        }
    };

    return (
        <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Add New Medicine</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                    <TextField
                        name="name"
                        label="Medicine Name"
                        value={medicine.name}
                        onChange={handleChange}
                        fullWidth
                        required
                        autoComplete="off"
                    />
                    <TextField
                        name="description"
                        label="Description"
                        value={medicine.description}
                        onChange={handleChange}
                        fullWidth
                        multiline
                        rows={3}
                        required
                        autoComplete="off"
                    />
                    <TextField
                        name="manufacture"
                        label="Manufacturer"
                        value={medicine.manufacture}
                        onChange={handleChange}
                        fullWidth
                        required
                        autoComplete="off"
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => onClose(false)}>Cancel</Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    color="primary"
                    disabled={!medicine.name || !medicine.description || !medicine.manufacture}
                >
                    Add Medicine
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddMedicineDialog; 