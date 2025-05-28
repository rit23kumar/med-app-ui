import axios from 'axios';
import { Medicine, MedicineWithStock, PageResponse, BatchMedicineResponse } from '../types/medicine';
import { Sale, CreateSaleRequest } from '../types/sale';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
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

    addMedicines: async (medicines: Medicine[]): Promise<BatchMedicineResponse> => {
        const response = await api.post('/medicines/batch', medicines);
        return response.data;
    },

    addMedicineWithStock: async (medicineWithStock: MedicineWithStock): Promise<MedicineWithStock> => {
        const response = await api.post('/medicines/with-stock', medicineWithStock);
        return response.data;
    },

    searchMedicines: async (searchTerm: string, searchType: 'contains' | 'startsWith' = 'contains'): Promise<Medicine[]> => {
        const response = await api.get(`/medicines/search`, {
            params: { 
                name: searchTerm,
                searchType: searchType
            }
        });
        return response.data;
    },
};

export const saleApi = {
    createSale: async (saleRequest: CreateSaleRequest): Promise<Sale> => {
        const response = await api.post('/sales', saleRequest);
        return response.data;
    },

    getSales: async (page: number = 0, size: number = 10): Promise<PageResponse<Sale>> => {
        const response = await api.get(`/sales?page=${page}&size=${size}`);
        return response.data;
    },

    getSaleById: async (id: number): Promise<Sale> => {
        const response = await api.get(`/sales/${id}`);
        return response.data;
    }
}; 