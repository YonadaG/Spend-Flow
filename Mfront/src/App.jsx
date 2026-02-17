import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Transactions from './pages/Transactions';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Accounts from './pages/Accounts';
import UploadTransfer from './pages/UploadTransfer';
import DashboardLayout from './components/DashboardLayout';
import Categories from './pages/Categories';
import CategoryDetails from './pages/CategoryDetails';

import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <div className="app-container">
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="categories" element={<Categories />} />
              <Route path="categories/:id" element={<CategoryDetails />} />
              <Route path="reports" element={<Reports />} />
              <Route path="accounts" element={<Accounts />} />
              <Route path="settings" element={<Settings />} />
              <Route path="upload" element={<UploadTransfer />} />
            </Route>
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </div>
  );
};

export default App;
