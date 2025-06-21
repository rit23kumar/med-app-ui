import apiClient from '../api/axiosConfig';
import { sell } from '../types/sell';
import { StockHistory } from '../types/medicine';

export const getSalesHistory = async (fromDate: string, toDate: string): Promise<sell[]> => {
    const response = await apiClient.post('/history/sales', { fromDate, toDate });
    return response.data;
};

export const getPurchaseHistory = async (fromDate: string, toDate: string): Promise<StockHistory[]> => {
    const response = await apiClient.post('/history/purchases', { fromDate, toDate });
    return response.data;
};

export const deleteSell = async (id: number): Promise<void> => {
    await apiClient.delete(`/sells/${id}`);
}; 