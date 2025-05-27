import { Medicine } from './medicine';

export interface SaleItem {
    id?: number;
    medicine: Medicine;
    quantity: number;
    price: number;
    expDate: string;
}

export interface Sale {
    id?: number;
    date: string;
    customer?: string;
    totalAmount: number;
    items: SaleItem[];
}

export interface CreateSaleRequest {
    customer?: string;
    items: {
        medicineId: number;
        quantity: number;
        price: number;
        expDate: string;
    }[];
} 