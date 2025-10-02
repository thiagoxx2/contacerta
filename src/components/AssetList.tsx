import { Link } from 'react-router-dom';
import { useOrg } from '../context/OrgContext';
import { useAssets } from '../hooks/useAssets';
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
import { usePageTitle } from '../hooks/usePageTitle';
import { formatAssetCode } from '../utils/asset';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export default function AssetList() {
  usePageTitle('Patrimônio | ContaCerta');
  const { activeOrgId } = useOrg();
  
  const {
    assets,
    loading,
    error,
    search,
    setSearch,
    filterStatus,
    setFilterStatus,
    filterCategoryId,
    setFilterCategoryId,
    categories,
  } = useAssets({ orgId: activeOrgId || '' });

  // Filtrar por categoria no cliente (por nome)
  const filteredAssets = assets.filter(asset => {
    const matchesCategory = !filterCategoryId || asset.category === filterCategoryId;
    return matchesCategory;
  });

  const handleDelete = () => {
    // Por enquanto, apenas exibir um alerta
    alert('Funcionalidade de exclusão será implementada em breve');
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'IN_USE':
        return { icon: CheckCircle, text: 'Em Uso', color: 'text-green-800 bg-green-100' };
      case 'IN_STORAGE':
        return { icon: Package, text: 'Em Estoque', color: 'text-blue-800 bg-blue-100' };
      case 'IN_MAINTENANCE':
        return { icon: Wrench, text: 'Manutenção', color: 'text-yellow-800 bg-yellow-100' };
      case 'DISPOSED':
        return { icon: XCircle, text: 'Baixado', color: 'text-gray-800 bg-gray-100' };
      default:
        return { icon: CheckCircle, text: 'Em Uso', color: 'text-green-800 bg-green-100' };
    }
  };


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
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, código, local..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'in_use' | 'in_storage' | 'in_maintenance' | 'disposed')}
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
              value={filterCategoryId}
              onChange={(e) => setFilterCategoryId(e.target.value)}
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

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando ativos...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <XCircle className="w-5 h-5 text-red-400 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Erro ao carregar ativos</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Asset Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssets.map((asset, index) => {
          const statusInfo = getStatusInfo(asset.status);
          const formattedAcqDate = asset.acquisitionAt
            ? format(parseISO(asset.acquisitionAt), 'dd/MM/yyyy')
            : '—';
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
                    <p className="text-sm text-gray-500">{formatAssetCode(asset)}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                    <statusInfo.icon className="w-3 h-3 mr-1" />
                    {statusInfo.text}
                  </span>
                </div>

                <div className="space-y-2 mb-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Tag className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                    <span>{asset.category || 'Sem categoria'}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                    <span>{asset.location}</span>
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                    <span>{formatCurrency(Number(asset.acquisitionVal ?? 0))}</span>
                  </div>
                   <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                    <span>Comprado em {formattedAcqDate}</span>
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
                    onClick={handleDelete}
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
      )}

      {/* Empty State */}
      {!loading && !error && filteredAssets.length === 0 && (
        <div className="text-center py-12">
          <Archive className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum ativo encontrado</h3>
          <p className="text-gray-600 mb-4">
            {assets.length === 0 
              ? 'Comece adicionando seu primeiro item ao patrimônio.'
              : 'Tente ajustar os filtros para encontrar o que procura.'
            }
          </p>
          {assets.length === 0 && (
            <Link
              to="/app/assets/new"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              <Archive className="w-4 h-4 mr-2" />
              Adicionar Primeiro Item
            </Link>
          )}
        </div>
      )}

    </div>
  );
}
