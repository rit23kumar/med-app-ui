import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { MedicineList } from './components/MedicineList';
import { AddMedicine } from './components/AddMedicine';
import { SellMedicine } from './components/SellMedicine';
import MedicineDetails from './pages/MedicineDetails';
import { Layout } from './components/Layout';
import StockManagement from './components/StockManagement';

export const AppRoutes: React.FC = () => {
    return (
        <Layout>
            <Routes>
                <Route path="/" element={<MedicineList />} />
                <Route path="/add-medicine" element={<AddMedicine />} />
                <Route path="/sell-medicine" element={<SellMedicine />} />
                <Route path="/medicines/:id" element={<MedicineDetails />} />
                <Route path="/manage-stock" element={<StockManagement />} />
            </Routes>
        </Layout>
    );
}; 