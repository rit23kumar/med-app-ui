import axios from 'axios';
import { MedStock, Sell } from '../types/index';

const API_URL = 'http://localhost:8080/api';

export const getSalesHistory = async (fromDate: string, toDate: string): Promise<Sell[]> => {
    const response = await axios.post(`${API_URL}/history/sales`, { fromDate, toDate });
    return response.data;
};

export const getPurchaseHistory = async (fromDate: string, toDate: string): Promise<MedStock[]> => {
    const response = await axios.post(`${API_URL}/history/purchases`, { fromDate, toDate });
    return response.data;
}; 