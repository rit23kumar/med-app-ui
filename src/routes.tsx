import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { MedicineList } from './components/MedicineList';
import { AddMedicine } from './components/AddMedicine';
import { SellMedicine } from './components/SellMedicine';
import { MedicineDetail } from './components/MedicineDetail';
import { Layout } from './components/Layout';

export const AppRoutes: React.FC = () => {
    return (
        <Layout>
            <Routes>
                <Route path="/" element={<MedicineList />} />
                <Route path="/add-medicine" element={<AddMedicine />} />
                <Route path="/sell-medicine" element={<SellMedicine />} />
                <Route path="/medicines/:id" element={<MedicineDetail />} />
            </Routes>
        </Layout>
    );
}; 