import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building, Users, ArrowRight, Key, Loader, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useOrg } from '../context/OrgContext';
import { usePageTitle } from '../hooks/usePageTitle';

// Tipos
type OrgRow = { id: string; name: string };
type MembershipRow = { 
  orgId: string; 
  role: 'OWNER' | 'ADMIN' | 'TESOURARIA' | 'SECRETARIA' | 'CONTADOR' | 'LEITURA'; 
  organization?: OrgRow; 
}; 

type MembershipQueryRow = { 
  orgId: string; 
  role: MembershipRow['role']; 
  organization: OrgRow | null; 
};

export default function SelectOrganization() {
  usePageTitle('Selecionar Organização | ContaCerta');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setActiveOrg } = useOrg();
  
  const [memberships, setMemberships] = useState<MembershipRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para o formulário de convite
  const [inviteToken, setInviteToken] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  // Carregar organizações do usuário
  useEffect(() => {
    async function loadOrganizations() {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('memberships')
          .select('orgId, role, organization:organizations (id, name)')
          .order('name', { foreignTable: 'organizations', ascending: true })
          .returns<MembershipQueryRow[]>();
        
        if (error) throw error;
        
        const rows: MembershipRow[] = (data ?? []).map(d => ({
          orgId: d.orgId,
          role: d.role,
          organization: d.organization ?? undefined,
        }));
        
        // Auto-seleção quando só há 1 organização
        if (rows.length === 1) {
          const only = rows[0];
          const org = only.organization; // pode ser undefined
          if (org) {
            setActiveOrg(only.orgId, org.name);
            navigate('/app');
            return;
          }
        }
        
        setMemberships(rows);
      } catch (err) {
        console.error('Erro ao carregar organizações:', err);
        setError('Não foi possível carregar suas organizações. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    }
    
    if (user) {
      loadOrganizations();
    }
  }, [user, navigate, setActiveOrg]);

  // Função para entrar em uma organização
  const handleEnterOrg = (orgId: string, orgName: string) => {
    setActiveOrg(orgId, orgName);
    navigate('/app');
  };

  // Função para aceitar um convite
  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteToken.trim()) {
      setInviteError('Por favor, informe o token do convite.');
      return;
    }
    
    // Validação rápida do token
    const uuidRE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRE.test(inviteToken.trim())) {
      setInviteError('Token inválido (formato UUID esperado).');
      return;
    }
    
    try {
      setInviteLoading(true);
      setInviteError(null);
      setInviteSuccess(null);
      
      // Chamar a RPC para aceitar o convite
      const { data, error } = await supabase.rpc('accept_invite', { 
        invite_token: inviteToken.trim() 
      });
      
      if (error) throw error;
      
      const orgId = data as string; // RPC retorna o UUID diretamente
      
      // Buscar o nome da organização
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', orgId)
        .single();
      
      if (orgError) throw orgError;
      
      // Definir como organização ativa e navegar para o app
      setActiveOrg(orgId, orgData?.name ?? 'Organização');
      setInviteSuccess('Convite aceito com sucesso! Redirecionando...');
      
      // Redirecionar após um breve delay para mostrar a mensagem de sucesso
      setTimeout(() => navigate('/app'), 1200);
    } catch (err: any) {
      console.error('Erro ao aceitar convite:', err);
      
      // Mensagens de erro amigáveis
      if (err.message?.includes('expired')) {
        setInviteError('Este convite expirou. Solicite um novo convite.');
      } else if (err.message?.includes('not found') || err.message?.includes('invalid')) {
        setInviteError('Token de convite inválido. Verifique e tente novamente.');
      } else if (err.message?.includes('permission denied')) {
        setInviteError('Você não tem permissão para aceitar este convite.');
      } else {
        setInviteError('Não foi possível processar o convite. Tente novamente mais tarde.');
      }
    } finally {
      setInviteLoading(false);
    }
  };

  // Renderizar estados de carregamento e erro
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  // Função para obter o nome da função em português
  const getRoleName = (role: MembershipRow['role']) => {
    const roleNames: Record<MembershipRow['role'], string> = {
      'OWNER': 'Proprietário',
      'ADMIN': 'Administrador',
      'TESOURARIA': 'Tesouraria',
      'SECRETARIA': 'Secretaria',
      'CONTADOR': 'Contador',
      'LEITURA': 'Leitura'
    };
    return roleNames[role] || role;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Selecionar Organização</h1>
          <p className="mt-2 text-lg text-gray-600">
            Escolha uma organização para acessar ou aceite um convite
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Coluna 1: Lista de Organizações */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center mb-6">
              <Building className="w-5 h-5 mr-2" />
              Minhas Organizações
            </h2>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {memberships.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhuma organização encontrada</h3>
                <p className="text-gray-500 mb-6">
                  Você ainda não pertence a nenhuma organização.
                </p>
                <Link 
                  to="/create-org" 
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Criar nova organização
                </Link>
              </div>
            ) : (
              <>
                <div className="grid gap-4">
                  {memberships.map((membership) => (
                    <div
                      key={membership.orgId}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          {(() => {
                            const orgName = membership.organization?.name ?? `Organização ${membership.orgId}`;
                            return (
                              <>
                                <h3 className="font-medium text-gray-900">
                                  {orgName}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  Função: {getRoleName(membership.role)}
                                </p>
                              </>
                            );
                          })()}
                        </div>
                        <button
                          onClick={() => {
                            const orgName = membership.organization?.name ?? 'Organização';
                            handleEnterOrg(membership.orgId, orgName);
                          }}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          aria-label={`Entrar em ${membership.organization?.name ?? 'Organização'}`}
                        >
                          Entrar
                          <ArrowRight className="ml-1.5 w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                  <Link 
                    to="/create-org" 
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Criar nova organização
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Coluna 2: Formulário de Convite */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center mb-6">
              <Key className="w-5 h-5 mr-2" />
              Tenho um convite
            </h2>

            <form onSubmit={handleAcceptInvite} className="space-y-6">
              <div>
                <label htmlFor="invite-token" className="block text-sm font-medium text-gray-700 mb-1">
                  Token do convite
                </label>
                <input
                  id="invite-token"
                  type="text"
                  value={inviteToken}
                  onChange={(e) => setInviteToken(e.target.value)}
                  placeholder="Digite o token do convite"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  aria-describedby="invite-token-description"
                />
                <p id="invite-token-description" className="mt-1 text-sm text-gray-500">
                  Cole o token UUID que você recebeu no convite
                </p>
              </div>

              {inviteError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
                  <AlertCircle className="w-4 h-4 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{inviteError}</p>
                </div>
              )}

              {inviteSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-700">{inviteSuccess}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={inviteLoading || !inviteToken.trim()}
                className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
                aria-busy={inviteLoading}
              >
                {inviteLoading ? (
                  <>
                    <Loader className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                    Processando...
                  </>
                ) : (
                  'Aceitar convite'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}