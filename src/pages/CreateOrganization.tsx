import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building, AlertCircle, Loader } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useOrg } from '../context/OrgContext';
import { usePageTitle } from '../hooks/usePageTitle';

export default function CreateOrganization() {
  usePageTitle('Criar Organização | ContaCerta');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setActiveOrg } = useOrg();
  
  // Referência para o primeiro input (acessibilidade)
  const nameInputRef = useRef<HTMLInputElement>(null);
  
  // Estados do formulário
  const [name, setName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  
  // Focar no primeiro input ao montar o componente
  useEffect(() => {
    if (nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, []);
  
  // Função para validar o formulário
  const validateForm = (): boolean => {
    let isValid = true;
    
    // Validar nome (obrigatório, min 3 chars)
    if (name.trim().length < 3) {
      setNameError('O nome deve ter pelo menos 3 caracteres');
      isValid = false;
    } else {
      setNameError(null);
    }
    
    return isValid;
  };
  
  // Handler de submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar formulário
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Chamar a RPC para criar a organização
      const { data, error } = await supabase.rpc('create_org_and_join', {
        org_name: name.trim(),
        org_tax_id: taxId.trim() || null
      });
      
      if (error) throw error;
      
      // Sucesso: definir como organização ativa e navegar para o app
      const orgId = data as string;
      setActiveOrg(orgId, name.trim());
      navigate('/app');
    } catch (err) {
      console.error('Erro ao criar organização:', err);
      setError('Não foi possível criar a organização. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Building className="h-12 w-12 text-blue-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Criar Nova Organização
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Preencha os dados abaixo para criar sua organização
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nome da Igreja *
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  ref={nameInputRef}
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Ex: Igreja Batista Central"
                />
              </div>
              {nameError && (
                <p className="mt-2 text-sm text-red-600">{nameError}</p>
              )}
            </div>

            <div>
              <label htmlFor="taxId" className="block text-sm font-medium text-gray-700">
                CNPJ (opcional)
              </label>
              <div className="mt-1">
                <input
                  id="taxId"
                  name="taxId"
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  disabled={loading}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Ex: 00.000.000/0001-00"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Link
                to="/select-org"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading}
                aria-busy={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar Organização'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}