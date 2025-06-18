import { Medicine } from './medicine';

export interface sellItem {
    id?: number;
    medicine: Medicine;
    quantity: number;
    price: number;
    expDate: string;
    discount?: number;
}

export interface sell {
    id?: number;
    date: string;
    customer?: string;
    totalAmount: number;
    modeOfPayment?: string;
    items: sellItem[];
}

export interface CreateSellRequest {
    customer?: string;
    modeOfPayment: 'Cash' | 'Card' | 'UPI';
    utrNumber?: string;
    items: {
        medicineId: number;
        quantity: number;
        price: number;
        expDate: string;
        discount?: number;
        batchId: number;
    }[];
} 