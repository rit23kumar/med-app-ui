export interface Medicine {
    id: number;
    name: string;
}

export interface MedStock {
    id: number;
    medicine: Medicine;
    expDate: string;
    quantity: number;
    availableQuantity: number;
    price: number;
    createdAt: string;
}

export interface SellItem {
    id: number;
    sell: Sell;
    medicine: Medicine;
    expDate: string;
    quantity: number;
    price: number;
}

export interface Sell {
    id: number;
    date: string;
    totalAmount: number;
    customer?: string;
    items: SellItem[];
} 