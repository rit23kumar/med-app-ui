import { Medicine } from './medicine';

export interface sellItem {
    id: number;
    medicine: Medicine;
    quantity: number;
    price: number;
    expDate: string;
    discount?: number;
}

export interface sell {
    id: number;
    date: string;
    customer?: string;
    totalAmount: number;
    modeOfPayment?: string;
    items: sellItem[];
    createdBy?: string;
}

export interface CreateSellRequest {
    customer?: string;
    modeOfPayment: 'Cash' | 'Card' | 'UPI' | 'Ward Use' | 'Pay Later';
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