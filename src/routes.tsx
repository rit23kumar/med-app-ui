import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { MedicineList } from './components/MedicineList';
import { SellMedicine } from './components/SellMedicine';
import { Layout } from './components/Layout';
import StockManagement from './components/StockManagement';
import SalesHistory from './pages/SalesHistory';
import PurchaseHistory from './pages/PurchaseHistory';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import UserManagement from './pages/UserManagement';

export const AppRoutes: React.FC = () => {
    return (
        <Layout>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<ProtectedRoute><SellMedicine /></ProtectedRoute>} />
                <Route path="/medicine-inventory" element={<ProtectedRoute><MedicineList /></ProtectedRoute>} />
                <Route path="/manage-stock" element={<ProtectedRoute requireAdmin={true}><StockManagement /></ProtectedRoute>} />
                <Route path="/sales-history" element={<ProtectedRoute><SalesHistory /></ProtectedRoute>} />
                <Route path="/purchase-history" element={<ProtectedRoute requireAdmin={true}><PurchaseHistory /></ProtectedRoute>} />
                <Route path="/user-management" element={<ProtectedRoute requireAdmin={true}><UserManagement /></ProtectedRoute>} />
            </Routes>
        </Layout>
    );
};

// Removed createBrowserRouter since it's not being used for the main app routing
/*
export const router = createBrowserRouter([
    {
        path: '/sales-history',
        element: <SalesHistory />,
    },
    {
        path: '/purchase-history',
        element: <PurchaseHistory />,
    },
]);
*/ 