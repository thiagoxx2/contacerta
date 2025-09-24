import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp, useConfirm } from '../context/AppContext';
import { Asset } from '../types';
import { 
  Edit, 
  Trash2, 
  Search, 
  Archive,
  DollarSign,
  Calendar,
  MapPin,
  Tag,
  Wrench,
  Package,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePageTitle } from '../hooks/usePageTitle';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export default function AssetList() {
  usePageTitle('Patrimônio | ContaCerta');
  const { state, dispatch } = useApp();
  const confirm = useConfirm();
  const { assets = [] } = state;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | Asset['status']>('all');
  const [filterCategory, setFilterCategory] = useState('');

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = 
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.description && asset.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || asset.status === filterStatus;
    const matchesCategory = !filterCategory || asset.category.toLowerCase().includes(filterCategory.toLowerCase());
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleDelete = (id: string) => {
    confirm({
      title: 'Confirmar Exclusão',
      message: 'Tem certeza que deseja excluir este item do patrimônio? Esta ação é irreversível.',
      onConfirm: () => {
        dispatch({ type: 'DELETE_ASSET', payload: id });
      }
    });
  };

  const getStatusInfo = (status: Asset['status']) => {
    switch (status) {
      case 'in_use':
        return { icon: CheckCircle, text: 'Em Uso', color: 'text-green-800 bg-green-100' };
      case 'in_storage':
        return { icon: Package, text: 'Em Estoque', color: 'text-blue-800 bg-blue-100' };
      case 'in_maintenance':
        return { icon: Wrench, text: 'Manutenção', color: 'text-yellow-800 bg-yellow-100' };
      case 'disposed':
        return { icon: XCircle, text: 'Baixado', color: 'text-gray-800 bg-gray-100' };
    }
  };

  const categories = [...new Set(assets.map(a => a.category))];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patrimônio</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie os ativos físicos da sua igreja.
          </p>
        </div>
        <Link
          to="/app/assets/new"
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <Archive className="w-4 h-4 mr-2" />
          Novo Item
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pesquisar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome, código, local..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos</option>
              <option value="in_use">Em Uso</option>
              <option value="in_storage">Em Estoque</option>
              <option value="in_maintenance">Manutenção</option>
              <option value="disposed">Baixado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
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
        </div>
      </div>

      {/* Asset Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssets.map((asset, index) => {
          const statusInfo = getStatusInfo(asset.status);
          return (
            <motion.div
              key={asset.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 truncate">{asset.name}</h3>
                    <p className="text-sm text-gray-500">{asset.code}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                    <statusInfo.icon className="w-3 h-3 mr-1" />
                    {statusInfo.text}
                  </span>
                </div>

                <div className="space-y-2 mb-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Tag className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                    <span>{asset.category}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                    <span>{asset.location}</span>
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                    <span>{formatCurrency(asset.purchaseValue)}</span>
                  </div>
                   <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                    <span>Comprado em {format(parseISO(asset.purchaseDate), "dd/MM/yyyy")}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <Link
                    to={`/app/assets/${asset.id}/edit`}
                    className="text-blue-600 hover:text-blue-800 p-1"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(asset.id)}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {filteredAssets.length === 0 && (
        <div className="text-center py-12 col-span-full">
          <Archive className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-sm font-medium text-gray-900 mb-1">Nenhum item encontrado</h3>
          <p className="text-sm text-gray-500">Tente ajustar os filtros ou adicione um novo item ao patrimônio.</p>
        </div>
      )}
    </div>
  );
}
