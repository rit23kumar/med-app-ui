import axios from 'axios';
import { MedStock, Sell } from '../types/index';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

export const getSalesHistory = async (fromDate: string, toDate: string): Promise<Sell[]> => {
    const response = await axios.post(`${API_BASE_URL}/history/sales`, { fromDate, toDate });
    return response.data;
};

export const getPurchaseHistory = async (fromDate: string, toDate: string): Promise<MedStock[]> => {
    const response = await axios.post(`${API_BASE_URL}/history/purchases`, { fromDate, toDate });
    return response.data;
}; 