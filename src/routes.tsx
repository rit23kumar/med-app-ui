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
import AllMedicinesStock from './pages/AllMedicinesStock';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import { useAuth } from './contexts/AuthContext';

export const AppRoutes: React.FC = () => {
    const { user } = useAuth();
    return (
        <Layout>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={user?.role === 'ADMIN' ? <AnalyticsDashboard /> : <ProtectedRoute><SellMedicine /></ProtectedRoute>} />
                <Route path="/sales" element={<ProtectedRoute><SellMedicine /></ProtectedRoute>} />
                <Route path="/medicine-inventory" element={<ProtectedRoute><MedicineList /></ProtectedRoute>} />
                <Route path="/manage-stock" element={<ProtectedRoute requireAdmin={true}><StockManagement /></ProtectedRoute>} />
                <Route path="/all-medicines-stock" element={<ProtectedRoute requireAdmin={true}><AllMedicinesStock /></ProtectedRoute>} />
                <Route path="/sales-history" element={<ProtectedRoute><SalesHistory /></ProtectedRoute>} />
                <Route path="/purchase-history" element={<ProtectedRoute requireAdmin={true}><PurchaseHistory /></ProtectedRoute>} />
                <Route path="/user-management" element={<ProtectedRoute requireAdmin={true}><UserManagement /></ProtectedRoute>} />
                <Route path="/analytics" element={<AnalyticsDashboard />} />
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