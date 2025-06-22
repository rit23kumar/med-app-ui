export interface Medicine {
    id?: number;
    name: string;
    enabled?: boolean;
    stock?: Stock;
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

export interface StockHistory {
    id: number;
    medicineName: string;
    expDate: string;
    quantity: number;
    availableQuantity: number;
    price: number;
    createdAt: string;
}

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}

export interface BatchMedicineResponse {
    successfulMedicines: Medicine[];
    failedMedicines: FailedMedicine[];
    totalSuccess: number;
    totalFailed: number;
}

export interface FailedMedicine {
    name: string;
    reason: string;
} 