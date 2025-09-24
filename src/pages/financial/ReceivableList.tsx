import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp, useConfirm } from '../../context/AppContext';
import { 
  Edit, 
  Trash2, 
  Search, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Box
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePageTitle } from '../../hooks/usePageTitle';

export default function ReceivableList() {
  usePageTitle('Contas a Receber | ContaCerta');
  const { state, dispatch } = useApp();
  const confirm = useConfirm();
  const { documents = [], members = [], costCenters = [] } = state;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'paid' | 'overdue'>('all');

  const receivableDocuments = documents.filter(doc => doc.type === 'receivable');

  const getMemberNameById = (id?: string) => {
    if (!id) return 'N/A';
    return members.find(m => m.id === id)?.name || id;
  };

  const getCostCenterNameById = (id: string) => {
    return costCenters.find(cc => cc.id === id)?.name || 'N/A';
  };

  const filteredDocuments = receivableDocuments.filter(doc => {
    const memberName = getMemberNameById(doc.memberId).toLowerCase();
    const costCenterName = getCostCenterNameById(doc.costCenterId).toLowerCase();
    const matchesSearch = doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         memberName.includes(searchTerm.toLowerCase()) ||
                         costCenterName.includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || doc.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleDelete = (id: string) => {
    confirm({
      title: 'Excluir Lançamento',
      message: 'Tem certeza que deseja excluir esta conta a receber?',
      onConfirm: () => {
        dispatch({ type: 'DELETE_DOCUMENT', payload: id });
      }
    });
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'paid':
        return { icon: CheckCircle, text: 'Recebido', color: 'text-green-700 bg-green-50', iconColor: 'text-green-500' };
      case 'overdue':
        return { icon: AlertCircle, text: 'Vencido', color: 'text-red-700 bg-red-50', iconColor: 'text-red-500' };
      default:
        return { icon: Clock, text: 'Em Aberto', color: 'text-yellow-700 bg-yellow-50', iconColor: 'text-yellow-500' };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div/>
        <Link
          to="/app/financial/receivables/new"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Nova Conta a Receber
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por descrição, categoria, membro..."
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
              <option value="open">Em Aberto</option>
              <option value="paid">Recebido</option>
              <option value="overdue">Vencido</option>
            </select>
          </div>
        </div>
      </div>

      {/* Document List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conta</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDocuments.map((document, index) => {
                const statusInfo = getStatusInfo(document.status);
                return (
                  <motion.tr
                    key={document.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{document.description}</div>
                        <div className="text-sm text-gray-500">{document.category}</div>
                         <div className="text-xs text-gray-400 flex items-center mt-1">
                          <Box className="w-3 h-3 mr-1" /> {getCostCenterNameById(document.costCenterId)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(document.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(parseISO(document.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        <statusInfo.icon className={`w-4 h-4 mr-1 ${statusInfo.iconColor}`} />
                        {statusInfo.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link to={`/app/financial/${document.id}/edit`} className="text-blue-600 hover:text-blue-900"><Edit className="w-4 h-4" /></Link>
                        <button onClick={() => handleDelete(document.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredDocuments.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">Nenhuma conta encontrada</h3>
            <p className="text-sm text-gray-500">Tente ajustar os filtros ou criar uma nova conta a receber.</p>
          </div>
        )}
      </div>
    </div>
  );
}
