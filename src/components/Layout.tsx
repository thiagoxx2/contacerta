import React, { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  Menu,
  X,
  Building,
  LogOut,
  Users,
  CircleDollarSign,
  FilePieChart,
  Box,
  Archive
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { generateMockMembers, generateMockSuppliers, generateMockDocuments, generateMockCostCenters, generateMockAssets } from '../utils/mockData';
import { supabase } from '../lib/supabaseClient';
import ConfirmModal from './ConfirmModal';
import OrgSwitcher from './OrgSwitcher';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const { state, dispatch } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    // Load mock data on startup
    const mockSuppliers = generateMockSuppliers();
    const mockMembers = generateMockMembers();
    const mockCostCenters = generateMockCostCenters();
    const mockDocuments = generateMockDocuments(mockSuppliers, mockMembers, mockCostCenters);
    const mockAssets = generateMockAssets(mockSuppliers);
    
    dispatch({ type: 'SET_SUPPLIERS', payload: mockSuppliers });
    dispatch({ type: 'SET_MEMBERS', payload: mockMembers });
    dispatch({ type: 'SET_COST_CENTERS', payload: mockCostCenters });
    dispatch({ type: 'SET_DOCUMENTS', payload: mockDocuments });
    dispatch({ type: 'SET_ASSETS', payload: mockAssets });

  }, [dispatch]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const navigation = [
    { name: 'Dashboard', href: '/app/dashboard', icon: BarChart3 },
    { name: 'Membros', href: '/app/members', icon: Users },
    { name: 'Ministérios', href: '/app/ministries', icon: Users },
    { name: 'Financeiro', href: '/app/financial', icon: CircleDollarSign },
    { name: 'Centros de Custo', href: '/app/cost-centers', icon: Box },
    { name: 'Patrimônio', href: '/app/assets', icon: Archive },
    { name: 'Fornecedores', href: '/app/suppliers', icon: Building },
    { name: 'Relatórios', href: '/app/reports', icon: FilePieChart },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <ConfirmModal />
      {/* Mobile sidebar */}
      <motion.div
        initial={false}
        animate={{ x: sidebarOpen ? 0 : -320 }}
        className="fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-lg lg:hidden"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h1 className="text-xl font-bold text-gray-900">ContaCerta</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-md text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <OrgSwitcher />
        <nav className="mt-4">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-blue-600 bg-blue-50 border-r-2 border-blue-600'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`
              }
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </motion.div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-80 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex items-center px-6 py-4 border-b">
            <h1 className="text-xl font-bold text-gray-900">ContaCerta</h1>
          </div>
          <OrgSwitcher />
          <nav className="mt-4 flex-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-blue-600 bg-blue-50 border-r-2 border-blue-600'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`
                }
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </NavLink>
            ))}
          </nav>
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-80">
        <div className="sticky top-0 z-40 flex h-16 bg-white border-b border-gray-200 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center px-4">
            <h1 className="text-lg font-semibold text-gray-900">ContaCerta</h1>
          </div>
        </div>

        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
