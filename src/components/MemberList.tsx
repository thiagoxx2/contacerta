import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useOrg } from '../context/OrgContext';
import { useConfirm } from '../context/AppContext';
import { Member } from '../types';
import { 
  Edit, 
  Trash2,
  Search,
  Users,
  Phone,
  Mail,
  Gift,
  CheckCircle,
  XCircle,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePageTitle } from '../hooks/usePageTitle';
import { listMembers, deleteMember } from '../services/members';
import { dbToUi } from '../adapters/memberAdapters';

export default function MemberList() {
  usePageTitle('Membros | ContaCerta');
  const { activeOrgId } = useOrg();
  const confirm = useConfirm();
  
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ativo' | 'inativo' | 'visitante'>('all');

  // Load members from Supabase
  const loadMembers = async () => {
    if (!activeOrgId) {
      setMembers([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await listMembers(activeOrgId, {
        search: searchTerm || undefined,
        status: filterStatus
      });
      
      if (error) {
        setError(error);
        setMembers([]);
      } else {
        const uiMembers = data.map(dbToUi);
        setMembers(uiMembers);
      }
    } catch (err) {
      setError('Erro ao carregar membros');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  // Load members when orgId, search, or filter changes
  useEffect(() => {
    loadMembers();
  }, [activeOrgId, searchTerm, filterStatus]);

  // No need for client-side filtering since we're using server-side filtering
  const filteredMembers = members;

  const handleDelete = (id: string) => {
    confirm({
      title: 'Excluir Membro',
      message: 'Tem certeza que deseja excluir este membro? Todos os dados associados serão perdidos.',
      onConfirm: async () => {
        setLoading(true);
        try {
          const { error } = await deleteMember(id);
          if (error) {
            setError(error);
          } else {
            // Reload members after successful deletion
            await loadMembers();
          }
        } catch (err) {
          setError('Erro ao excluir membro');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const getStatusBadge = (status: Member['status']) => {
    switch (status) {
      case 'ativo':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" /> Ativo
          </span>
        );
      case 'inativo':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" /> Inativo
          </span>
        );
      case 'visitante':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <HelpCircle className="w-3 h-3 mr-1" /> Visitante
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Membros</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie os membros da sua igreja
          </p>
        </div>
        <Link
          to="/app/members/new"
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <Users className="w-4 h-4 mr-2" />
          Novo Membro
        </Link>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Erro</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pesquisar
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome, e-mail, ministério..."
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
              <option value="ativo">Ativos</option>
              <option value="inativo">Inativos</option>
              <option value="visitante">Visitantes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Member Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="flex items-center mb-4">
                <div className="h-16 w-16 bg-gray-200 rounded-full"></div>
                <div className="ml-4 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <img 
                      className="h-16 w-16 rounded-full object-cover" 
                      src={member.profilePictureUrl} 
                      alt={member.name} 
                    />
                    <div className="ml-4">
                      <h3 className="text-lg font-bold text-gray-900 truncate">
                        {member.name}
                      </h3>
                      {getStatusBadge(member.status)}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4 text-sm text-gray-600">
                  {member.email && (
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </div>
                  )}
                  {member.phone && (
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                      <span>{member.phone}</span>
                    </div>
                  )}
                  {member.birthDate && (
                    <div className="flex items-center">
                      <Gift className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                      <span>{format(parseISO(member.birthDate), "d 'de' MMMM", { locale: ptBR })}</span>
                    </div>
                  )}
                </div>

                {member.ministries && member.ministries.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Ministérios</p>
                    <div className="flex flex-wrap gap-2">
                      {member.ministries.map(ministry => (
                        <span key={ministry} className="px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full">
                          {ministry}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <span className="text-xs text-gray-500">
                  Membro desde {format(parseISO(member.membershipDate), 'yyyy')}
                </span>
                <div className="flex items-center space-x-2">
                  <Link
                    to={`/app/members/${member.id}/edit`}
                    className="text-blue-600 hover:text-blue-800 p-1"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(member.id)}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}

          {filteredMembers.length === 0 && !loading && (
            <div className="text-center py-12 col-span-full">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">
                Nenhum membro encontrado
              </h3>
              <p className="text-sm text-gray-500">
                {!activeOrgId 
                  ? 'Selecione uma organização para ver os membros.'
                  : 'Tente ajustar os filtros ou adicione um novo membro.'
                }
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}