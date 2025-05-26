import axios from 'axios';
import { Medicine, MedicineWithStock, PageResponse } from '../types/medicine';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const medicineApi = {
    getAllMedicines: async (page: number = 0, size: number = 10): Promise<PageResponse<Medicine>> => {
        const response = await api.get(`/medicines?page=${page}&size=${size}`);
        return response.data;
    },

    getMedicineById: async (id: number): Promise<Medicine> => {
        const response = await api.get(`/medicines/${id}`);
        return response.data;
    },

    addMedicine: async (medicine: Medicine): Promise<Medicine> => {
        const response = await api.post('/medicines', medicine);
        return response.data;
    },

    addMedicineWithStock: async (medicineWithStock: MedicineWithStock): Promise<MedicineWithStock> => {
        const response = await api.post('/medicines/with-stock', medicineWithStock);
        return response.data;
    },
}; 