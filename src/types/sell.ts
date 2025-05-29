import { Medicine } from './medicine';

export interface sellItem {
    id?: number;
    medicine: Medicine;
    quantity: number;
    price: number;
    expDate: string;
}

export interface sell {
    id?: number;
    date: string;
    customer?: string;
    totalAmount: number;
    items: sellItem[];
}

export interface CreateSellRequest {
    customer?: string;
    items: {
        medicineId: number;
        quantity: number;
        price: number;
        expDate: string;
    }[];
} 