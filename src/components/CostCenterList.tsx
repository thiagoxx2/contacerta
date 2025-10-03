import { Link } from 'react-router-dom';
import { useApp, useConfirm } from '../context/AppContext';
import { useOrg } from '../context/OrgContext';
import { useCostCenters } from '../hooks/useCostCenters';
import { deleteCostCenter } from '../services/costCenterService';
import { 
  Edit, 
  Trash2, 
  Search, 
  Box,
  Briefcase,
  Calendar,
  Users,
  XCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { usePageTitle } from '../hooks/usePageTitle';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export default function CostCenterList() {
  usePageTitle('Centros de Custo | ContaCerta');
  const { state } = useApp();
  const { activeOrgId } = useOrg();
  const confirm = useConfirm();
  const { documents = [] } = state;
  
  const {
    costCenters,
    loading,
    error,
    search,
    setSearch,
    filterType,
    setFilterType,
    refetch,
  } = useCostCenters({ orgId: activeOrgId || '' });

  const getCostCenterBalance = (id: string) => {
    return documents
      .filter(doc => doc.costCenterId === id && doc.status === 'paid')
      .reduce((acc, doc) => {
        return acc + (doc.type === 'receivable' ? doc.amount : -doc.amount);
      }, 0);
  };

  // Os filtros agora são aplicados no hook, então usamos costCenters diretamente
  const filteredCostCenters = costCenters;

  const handleDelete = (id: string) => {
    confirm({
      title: 'Excluir Centro de Custo?',
      message: 'Tem certeza que deseja excluir este centro de custo? Todos os lançamentos associados perderão o vínculo, mas não serão excluídos.',
      onConfirm: async () => {
        if (!activeOrgId) {
          console.error('Organização não encontrada');
          return;
        }

        try {
          await deleteCostCenter(id, activeOrgId);
          await refetch(); // Recarregar dados do Supabase
        } catch (error) {
          console.error('Erro ao excluir centro de custo:', error);
          // Aqui você pode adicionar um toast de erro se tiver um sistema de notificações
        }
      }
    });
  };

  const getTypeInfo = (type: 'ministry' | 'event' | 'group') => {
    switch (type) {
      case 'ministry':
        return { icon: Briefcase, text: 'Ministério', color: 'text-blue-600 bg-blue-50' };
      case 'event':
        return { icon: Calendar, text: 'Evento', color: 'text-purple-600 bg-purple-50' };
      case 'group':
        return { icon: Users, text: 'Grupo', color: 'text-teal-600 bg-teal-50' };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Centros de Custo</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie os caixas de ministérios, eventos e grupos.
          </p>
        </div>
        <Link
          to="/app/cost-centers/new"
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <Box className="w-4 h-4 mr-2" />
          Novo Centro de Custo
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pesquisar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome ou descrição..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos</option>
              <option value="ministry">Ministério</option>
              <option value="event">Evento</option>
              <option value="group">Grupo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando centros de custo...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <XCircle className="w-5 h-5 text-red-400 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Erro ao carregar centros de custo</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Cost Center List */}
      {!loading && !error && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo (Realizado)</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCostCenters.map((cc, index) => {
                const typeInfo = getTypeInfo(cc.type);
                const balance = getCostCenterBalance(cc.id);
                return (
                  <motion.tr
                    key={cc.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{cc.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeInfo.color}`}>
                        <typeInfo.icon className="w-3 h-3 mr-1.5" />
                        {typeInfo.text}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(balance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link to={`/app/cost-centers/${cc.id}/edit`} className="text-blue-600 hover:text-blue-900"><Edit className="w-4 h-4" /></Link>
                        <button onClick={() => handleDelete(cc.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

          {filteredCostCenters.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">Nenhum centro de custo encontrado</h3>
              <p className="text-sm text-gray-500">Tente ajustar os filtros ou criar um novo.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
