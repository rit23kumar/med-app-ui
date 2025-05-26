export interface Medicine {
    id?: number;
    name: string;
    description: string;
    manufacture: string;
}

export interface Stock {
    expDate: string;
    quantity: number;
    price: number;
}

export interface MedicineWithStock {
    medicine: Medicine;
    stock: Stock;
}

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
} 