import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useApp, useConfirm } from '../context/AppContext';
import { useOrg } from '../context/OrgContext';
import { Supplier } from '../types';
import { 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePageTitle } from '../hooks/usePageTitle';
import { 
  listSuppliersByOrg, 
  deleteSupplier, 
  updateSupplier,
  digitsOnly 
} from '../services/supplierService';

export default function SupplierList() {
  usePageTitle('Fornecedores | ContaCerta');
  const { dispatch } = useApp();
  const { activeOrgId } = useOrg();
  const confirm = useConfirm();
  
  // Estados locais
  const [items, setItems] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterCategory, setFilterCategory] = useState('');

  // Helpers de formatação
  const formatTaxId = (taxId?: string, type?: 'PF' | 'PJ') => {
    if (!taxId) return '';
    
    const digits = digitsOnly(taxId);
    if (type === 'PJ') {
      // CNPJ: 00.000.000/0000-00
      return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    } else {
      // CPF: 000.000.000-00
      return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
  };

  const parseAddress = (addressStr?: string) => {
    if (!addressStr) return undefined;
    try {
      return JSON.parse(addressStr);
    } catch {
      return undefined;
    }
  };


  // Carregar fornecedores
  const loadSuppliers = useCallback(async () => {
    if (!activeOrgId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await listSuppliersByOrg(activeOrgId, {
        q: searchTerm,
        status: filterStatus,
        category: filterCategory
      });
      
      if (error) {
        setError(error.message);
        return;
      }
      
      setItems(data || []);
    } catch (err) {
      setError('Erro inesperado ao carregar fornecedores');
      console.error('Erro ao carregar fornecedores:', err);
    } finally {
      setLoading(false);
    }
  }, [activeOrgId, searchTerm, filterStatus, filterCategory]);

  // Debounce para busca
  useEffect(() => {
    const timer = setTimeout(() => {
      loadSuppliers();
    }, 250);
    
    return () => clearTimeout(timer);
  }, [loadSuppliers]);

  // Carregar categorias disponíveis
  const categories = [...new Set(items.map(s => s.category).filter(Boolean))];

  const handleDelete = (id: string) => {
    if (!activeOrgId) return;
    
    confirm({
      title: 'Excluir Fornecedor',
      message: 'Tem certeza que deseja excluir este fornecedor? Esta ação não pode ser desfeita.',
      onConfirm: async () => {
        try {
          const { data, error } = await deleteSupplier(id, activeOrgId);
          
          if (error) {
            setError(error.message);
            return;
          }
          
          if (data) {
            // Remover item da lista local
            setItems(prev => prev.filter(item => item.id !== id));
            // Atualizar store global
            dispatch({ type: 'DELETE_SUPPLIER', payload: id });
          }
        } catch (err) {
          setError('Erro ao excluir fornecedor');
          console.error('Erro ao excluir fornecedor:', err);
        }
      }
    });
  };

  const handleToggleStatus = async (supplier: Supplier) => {
    if (!activeOrgId) return;
    
    const nextStatus = !supplier.status;
    
    // Atualização otimista
    setItems(prev => prev.map(item => 
      item.id === supplier.id 
        ? { ...item, status: nextStatus }
        : item
    ));
    
    try {
      const { data, error } = await updateSupplier({
        id: supplier.id,
        orgId: activeOrgId,
        status: nextStatus
      });
      
      if (error) {
        // Reverter em caso de erro
        setItems(prev => prev.map(item => 
          item.id === supplier.id 
            ? { ...item, status: supplier.status }
            : item
        ));
        setError(error.message);
        return;
      }
      
      if (data) {
        // Atualizar store global
        dispatch({ type: 'UPDATE_SUPPLIER', payload: data });
      }
    } catch (err) {
      // Reverter em caso de erro
      setItems(prev => prev.map(item => 
        item.id === supplier.id 
          ? { ...item, status: supplier.status }
          : item
      ));
      setError('Erro ao atualizar status do fornecedor');
      console.error('Erro ao atualizar status:', err);
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fornecedores</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie seus fornecedores e dados cadastrais
          </p>
        </div>
        <Link
          to="/app/suppliers/new"
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <Building className="w-4 h-4 mr-2" />
          Novo Fornecedor
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pesquisar
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar fornecedores..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoria
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <Filter className="w-4 h-4 mr-2" />
              Filtrar
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
              <button
                onClick={() => loadSuppliers()}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-2 text-gray-600">Carregando fornecedores...</span>
        </div>
      )}

      {/* Supplier Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((supplier, index) => {
            const address = parseAddress(supplier.address);
            
            return (
          <motion.div
            key={supplier.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${supplier.type === 'PJ' ? 'bg-blue-50' : 'bg-green-50'}`}>
                  {supplier.type === 'PJ' ? (
                    <Building className="w-5 h-5 text-blue-600" />
                  ) : (
                    <User className="w-5 h-5 text-green-600" />
                  )}
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900 truncate">
                    {supplier.name}
                  </h3>
                  <p className="text-sm text-gray-500">{supplier.category}</p>
                </div>
              </div>
              <button
                onClick={() => handleToggleStatus(supplier)}
                className={`p-1 rounded ${
                  supplier.status 
                    ? 'text-green-600 hover:text-green-800' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                title={supplier.status ? 'Desativar' : 'Ativar'}
              >
                {supplier.status ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>

            {/* Document */}
            {supplier.taxId && (
              <div className="mb-3">
                <p className="text-sm text-gray-600">
                  {supplier.type === 'PJ' ? 'CNPJ' : 'CPF'}: {formatTaxId(supplier.taxId, supplier.type)}
                </p>
              </div>
            )}

            {/* Contact Info */}
            <div className="space-y-2 mb-4">
              {supplier.email && (
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="truncate">{supplier.email}</span>
                </div>
              )}
              {supplier.phone && (
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-2 text-gray-400" />
                  <span>{supplier.phone}</span>
                </div>
              )}
              {address && (address.city || address.state) && (
                <div className="flex items-start text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
                  <span className="line-clamp-2">
                    {address.city && address.state ? `${address.city}, ${address.state}` : address.city || address.state}
                  </span>
                </div>
              )}
            </div>

            {/* Status Badge */}
            <div className="mb-4">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                supplier.status 
                  ? 'text-green-800 bg-green-100' 
                  : 'text-gray-800 bg-gray-100'
              }`}>
                {supplier.status ? 'Ativo' : 'Inativo'}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <span className="text-xs text-gray-500">
                Criado em {format(new Date(supplier.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
              </span>
              <div className="flex items-center space-x-2">
                <Link
                  to={`/app/suppliers/${supplier.id}/edit`}
                  className="text-blue-600 hover:text-blue-800 p-1"
                  title="Editar"
                >
                  <Edit className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => handleDelete(supplier.id)}
                  className="text-red-600 hover:text-red-800 p-1"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && items.length === 0 && (
        <div className="text-center py-12">
          <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-sm font-medium text-gray-900 mb-1">
            Nenhum fornecedor encontrado
          </h3>
          <p className="text-sm text-gray-500">
            Tente ajustar os filtros ou criar um novo fornecedor.
          </p>
        </div>
      )}
    </div>
  );
}
