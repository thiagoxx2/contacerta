import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { OrgProvider } from './context/OrgContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import SupplierList from './components/SupplierList';
import SupplierForm from './components/SupplierForm';
import MemberList from './components/MemberList';
import MemberForm from './components/MemberForm';
import DocumentForm from './components/DocumentForm';
import Reports from './components/Reports';
import LandingPage from './pages/LandingPage';
import FinancialLayout from './pages/financial/FinancialLayout';
import PayableList from './pages/financial/PayableList';
import ReceivableList from './pages/financial/ReceivableList';
import CostCenterList from './components/CostCenterList';
import CostCenterForm from './components/CostCenterForm';
import AssetList from './components/AssetList';
import AssetForm from './components/AssetForm';
import SelectOrganization from './pages/SelectOrganization';
import CreateOrganization from './pages/CreateOrganization';
import MinistriesList from './pages/MinistriesList';
import MinistryForm from './pages/MinistryForm';

function App() {
  return (
    <Router>
      <AuthProvider>
        <OrgProvider>
          <AppProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route 
                path="/select-org" 
                element={
                  <ProtectedRoute>
                    <SelectOrganization />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/create-org" 
                element={
                  <ProtectedRoute>
                    <CreateOrganization />
                  </ProtectedRoute>
                } 
              />
            <Route 
              path="/app" 
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="members" element={<MemberList />} />
              <Route path="members/new" element={<MemberForm />} />
              <Route path="members/:id/edit" element={<MemberForm />} />
              <Route path="suppliers" element={<SupplierList />} />
              <Route path="suppliers/new" element={<SupplierForm />} />
              <Route path="suppliers/:id/edit" element={<SupplierForm />} />
              
              <Route path="cost-centers" element={<CostCenterList />} />
              <Route path="cost-centers/new" element={<CostCenterForm />} />
              <Route path="cost-centers/:id/edit" element={<CostCenterForm />} />

              <Route path="assets" element={<AssetList />} />
              <Route path="assets/new" element={<AssetForm />} />
              <Route path="assets/:id/edit" element={<AssetForm />} />

              <Route path="financial" element={<FinancialLayout />}>
                <Route index element={<Navigate to="payables" replace />} />
                <Route path="payables" element={<PayableList />} />
                <Route path="receivables" element={<ReceivableList />} />
              </Route>
              <Route path="financial/payables/new" element={<DocumentForm />} />
              <Route path="financial/receivables/new" element={<DocumentForm />} />
              <Route path="financial/:id/edit" element={<DocumentForm />} />

              <Route path="ministries" element={<MinistriesList />} />
              <Route path="ministries/new" element={<MinistryForm />} />
              <Route path="ministries/:id/edit" element={<MinistryForm />} />

              <Route path="reports" element={<Reports />} />
            </Route>
            </Routes>
          </AppProvider>
        </OrgProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
