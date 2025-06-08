import axios from 'axios';
import { Medicine, MedicineWithStock, PageResponse, BatchMedicineResponse, StockHistory } from '../types/medicine';
import { sell, CreateSellRequest } from '../types/sell';

// const API_BASE_URL = '/api';
// const API_BASE_URL = 'http://localhost:8080/api';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;



const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

export const medicineApi = {
    getMedicines: async (page: number = 0, size: number = 10): Promise<PageResponse<Medicine>> => {
        const response = await api.get(`/medicines?page=${page}&size=${size}`);
        return response.data;
    },

    getAllMedicines: async (): Promise<PageResponse<Medicine>> => {
        const response = await api.get(`/medicines/all`);
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

    getStockHistory: async (medicineId: number, includeFinished: boolean = false): Promise<StockHistory[]> => {
        const response = await api.get(`/medicines/${medicineId}/stock-history`, {
            params: { includeFinished }
        });
        return response.data;
    }
};

export const sellApi = {
    createsell: async (sellRequest: CreateSellRequest): Promise<sell> => {
        const response = await api.post('/sells', sellRequest);
        return response.data;
    },

    getsells: async (page: number = 0, size: number = 10): Promise<PageResponse<sell>> => {
        const response = await api.get(`/sells?page=${page}&size=${size}`);
        return response.data;
    },

    getsellById: async (id: number): Promise<sell> => {
        const response = await api.get(`/sells/${id}`);
        return response.data;
    }
}; 