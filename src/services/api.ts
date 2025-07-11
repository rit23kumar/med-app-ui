import apiClient from '../api/axiosConfig';
import { Medicine, MedicineWithStock, PageResponse, BatchMedicineResponse, StockHistory, Category } from '../types/medicine';
import { sell, CreateSellRequest } from '../types/sell';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

export const medicineApi = {
    getMedicines: async (page: number = 0, size: number = 10): Promise<PageResponse<Medicine>> => {
        const response = await apiClient.get(`/medicines?page=${page}&size=${size}`);
        return response.data;
    },

    getAllMedicines: async (includeDisabled?: boolean): Promise<Medicine[]> => {
        const response = await apiClient.get(`/medicines/all`, {
            params: includeDisabled ? { includeDisabled: true } : {}
        });
        return response.data;
    },

    getMedicineById: async (id: number): Promise<Medicine> => {
        const response = await apiClient.get(`/medicines/${id}`);
        return response.data;
    },

    addMedicine: async (medicine: Medicine): Promise<Medicine> => {
        const response = await apiClient.post('/medicines', medicine);
        return response.data;
    },

    addMedicines: async (medicines: Medicine[]): Promise<BatchMedicineResponse> => {
        const response = await apiClient.post('/medicines/batch', medicines);
        return response.data;
    },

    addMedicineWithStock: async (medicineWithStock: MedicineWithStock): Promise<MedicineWithStock> => {
        const response = await apiClient.post('/medicines/with-stock', medicineWithStock);
        return response.data;
    },

    searchMedicines: async (searchTerm: string, searchType: 'contains' | 'startsWith' = 'contains'): Promise<Medicine[]> => {
        const response = await apiClient.get(`/medicines/search`, {
            params: { 
                name: searchTerm,
                searchType: searchType
            }
        });
        return response.data;
    },

    getStockHistory: async (medicineId: number, includeFinished: boolean = false): Promise<StockHistory[]> => {
        const response = await apiClient.get(`/medicines/${medicineId}/stock-history`, {
            params: { includeFinished }
        });
        return response.data;
    },

    deleteStockBatch: async (batchId: number): Promise<void> => {
        await apiClient.delete(`/medicines/stock/${batchId}`);
    },

    updateStockBatch: async (batchId: number, data: Partial<StockHistory>): Promise<StockHistory> => {
        const response = await apiClient.put(`/medicines/stock/${batchId}`, data);
        return response.data;
    },

    getExpiringMedicines: async (): Promise<StockHistory[]> => {
        const response = await apiClient.get('/medicines/expiring');
        return response.data;
    },

    getExpiredMedicines: async (): Promise<StockHistory[]> => {
        const response = await apiClient.get('/medicines/expired');
        return response.data;
    },

    updateMedicineEnabled: async (id: number, enabled: boolean): Promise<Medicine> => {
        const response = await apiClient.put(`/medicines/enabled/${id}`, { enabled });
        return response.data;
    },

    updateMedicine: async (medicine: Medicine): Promise<Medicine> => {
        const response = await apiClient.put(`/medicines/${medicine.id}`, medicine);
        return response.data;
    },

    getGrandTotalStockValue: async (): Promise<number> => {
        const response = await apiClient.get('/medicines/stock/grand-total');
        return response.data;
    },

    getFlatExport: async (): Promise<any[]> => {
        const response = await apiClient.get('/medicines/flat-export');
        return response.data;
    },

    deleteMedicine: async (id: number): Promise<void> => {
        await apiClient.delete(`/medicines/${id}`);
    },

    getCategories: async (): Promise<Category[]> => {
        const response = await apiClient.get('/medicines/categories');
        return response.data;
    },
};

export const sellApi = {
    createsell: async (sellRequest: CreateSellRequest): Promise<sell> => {
        const response = await apiClient.post('/sells', sellRequest);
        return response.data;
    },

    getsells: async (page: number = 0, size: number = 10): Promise<PageResponse<sell>> => {
        const response = await apiClient.get(`/sells?page=${page}&size=${size}`);
        return response.data;
    },

    getsellById: async (id: number): Promise<sell> => {
        const response = await apiClient.get(`/sells/${id}`);
        return response.data;
    }
}; 