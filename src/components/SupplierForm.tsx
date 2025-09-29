import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useOrg } from '../context/OrgContext';
import { Save, Building, User, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePageTitle } from '../hooks/usePageTitle';
import { 
  createSupplier, 
  updateSupplier, 
  digitsOnly, 
  validateCPF, 
  validateCNPJ,
  CreateSupplierInput,
  UpdateSupplierInput 
} from '../services/supplierService';

export default function SupplierForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  usePageTitle(isEdit ? 'Editar Fornecedor | ContaCerta' : 'Novo Fornecedor | ContaCerta');
  
  const { state, dispatch } = useApp();
  const { activeOrgId } = useOrg();
  const { suppliers = [] } = state;

  const existingSupplier = isEdit ? suppliers.find(s => s.id === id) : undefined;

  // Estados para controle de loading e erros
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    cpf: '',
    email: '',
    phone: '',
    category: '',
    status: 'active' as 'active' | 'inactive',
    notes: '',
    
    // Address
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    
    // Bank Info
    bank: '',
    agency: '',
    account: '',
    accountType: 'corrente' as 'corrente' | 'poupanca',
  });

  const [personType, setPersonType] = useState<'fisica' | 'juridica'>(
    existingSupplier?.type === 'PJ' ? 'juridica' : 'fisica'
  );

  // Carregar dados do fornecedor existente
  useEffect(() => {
    if (isEdit && existingSupplier) {
      // Determinar tipo de pessoa baseado no type do banco
      const personTypeFromDB = existingSupplier.type === 'PJ' ? 'juridica' : 'fisica';
      setPersonType(personTypeFromDB);

      // Parsear address e bankInfo se existirem
      let addressData = {};
      let bankData = {};

      try {
        if (existingSupplier.address) {
          addressData = JSON.parse(existingSupplier.address);
        }
      } catch (e) {
        console.warn('Erro ao parsear address:', e);
      }

      try {
        if (existingSupplier.bankInfo) {
          bankData = JSON.parse(existingSupplier.bankInfo);
        }
      } catch (e) {
        console.warn('Erro ao parsear bankInfo:', e);
      }

      // Atualizar formData com dados do banco
      setFormData({
        name: existingSupplier.name || '',
        cnpj: personTypeFromDB === 'juridica' ? (existingSupplier.taxId || '') : '',
        cpf: personTypeFromDB === 'fisica' ? (existingSupplier.taxId || '') : '',
        email: existingSupplier.email || '',
        phone: existingSupplier.phone || '',
        category: existingSupplier.category || '',
        status: existingSupplier.status ? 'active' : 'inactive',
        notes: '', // Campo notes não existe no banco
        
        // Address
        street: (addressData as any).street || '',
        number: (addressData as any).number || '',
        complement: (addressData as any).complement || '',
        neighborhood: (addressData as any).neighborhood || '',
        city: (addressData as any).city || '',
        state: (addressData as any).state || '',
        zipCode: (addressData as any).zipCode || '',
        
        // Bank Info
        bank: (bankData as any).bank || '',
        agency: (bankData as any).agency || '',
        account: (bankData as any).account || '',
        accountType: (bankData as any).accountType || 'corrente',
      });
    }
  }, [isEdit, existingSupplier]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Validações básicas
      if (!activeOrgId) {
        setError('Nenhuma organização ativa selecionada. Selecione uma organização para continuar.');
        return;
      }

      if (!formData.name.trim()) {
        setError('Nome é obrigatório.');
        return;
      }

      // Validar CPF/CNPJ
      const taxId = personType === 'juridica' ? formData.cnpj : formData.cpf;
      const taxIdDigits = digitsOnly(taxId);
      
      if (personType === 'juridica' && !validateCNPJ(taxId)) {
        setError('CNPJ deve ter 14 dígitos.');
        return;
      }
      
      if (personType === 'fisica' && !validateCPF(taxId)) {
        setError('CPF deve ter 11 dígitos.');
        return;
      }

      // Montar payload
      const type = personType === 'fisica' ? 'PF' : 'PJ';
      const status = formData.status === 'active';
      
      // Serializar address se preenchido
      const address = formData.street.trim() ? JSON.stringify({
        street: formData.street,
        number: formData.number,
        complement: formData.complement || undefined,
        neighborhood: formData.neighborhood,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
      }) : null;

      // Serializar bankInfo se preenchido
      const bankInfo = formData.bank.trim() ? JSON.stringify({
        bank: formData.bank,
        agency: formData.agency,
        account: formData.account,
        accountType: formData.accountType,
      }) : null;

      if (isEdit) {
        // Atualizar fornecedor
        const updateData: UpdateSupplierInput = {
          id: id!,
          orgId: activeOrgId,
          type,
          name: formData.name,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          taxId: taxIdDigits,
          category: formData.category || undefined,
          status,
          address,
          bankInfo,
        };

        const { data, error } = await updateSupplier(updateData);
        
        if (error) {
          setError(error.message);
          return;
        }

        if (data) {
          dispatch({ type: 'UPDATE_SUPPLIER', payload: data });
        }
      } else {
        // Criar fornecedor
        const createData: CreateSupplierInput = {
          orgId: activeOrgId,
          type,
          name: formData.name,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          taxId: taxIdDigits,
          category: formData.category || undefined,
          status,
          address,
          bankInfo,
        };

        const { data, error } = await createSupplier(createData);
        
        if (error) {
          setError(error.message);
          return;
        }

        if (data) {
          dispatch({ type: 'ADD_SUPPLIER', payload: data });
        }
      }

      navigate('/app/suppliers');
    } catch (err) {
      setError('Erro inesperado. Tente novamente.');
      console.error('Erro ao salvar fornecedor:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCNPJ = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18);
  };

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1-$2')
      .slice(0, 14);
  };

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 15);
  };

  const formatZipCode = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 9);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEdit ? 'Editar Fornecedor' : 'Novo Fornecedor'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}
          {/* Person Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipo de Pessoa
            </label>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setPersonType('fisica')}
                className={`flex items-center px-4 py-2 rounded-md border ${
                  personType === 'fisica'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700'
                }`}
              >
                <User className="w-4 h-4 mr-2" />
                Pessoa Física
              </button>
              <button
                type="button"
                onClick={() => setPersonType('juridica')}
                className={`flex items-center px-4 py-2 rounded-md border ${
                  personType === 'juridica'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700'
                }`}
              >
                <Building className="w-4 h-4 mr-2" />
                Pessoa Jurídica
              </button>
            </div>
          </div>

          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informações Básicas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome {personType === 'juridica' ? 'da Empresa' : 'Completo'} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {personType === 'juridica' ? 'CNPJ' : 'CPF'} *
                </label>
                <input
                  type="text"
                  value={personType === 'juridica' ? formData.cnpj : formData.cpf}
                  onChange={(e) => {
                    const formatted = personType === 'juridica' 
                      ? formatCNPJ(e.target.value)
                      : formatCPF(e.target.value);
                    setFormData({ 
                      ...formData, 
                      [personType === 'juridica' ? 'cnpj' : 'cpf']: formatted 
                    });
                  }}
                  placeholder={personType === 'juridica' ? '00.000.000/0000-00' : '000.000.000-00'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria *
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Ex: Material de Construção, Serviços"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-mail
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                  placeholder="(00) 00000-0000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Endereço</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CEP
                </label>
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: formatZipCode(e.target.value) })}
                  placeholder="00000-000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logradouro
                </label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número
                </label>
                <input
                  type="text"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Complemento
                </label>
                <input
                  type="text"
                  value={formData.complement}
                  onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bairro
                </label>
                <input
                  type="text"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cidade
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                  maxLength={2}
                  placeholder="SP"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Bank Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Dados Bancários</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Banco
                </label>
                <select
                  value={formData.bank}
                  onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione um banco</option>
                  <option value="001 - Banco do Brasil">001 - Banco do Brasil</option>
                  <option value="237 - Bradesco">237 - Bradesco</option>
                  <option value="341 - Itaú">341 - Itaú</option>
                  <option value="104 - Caixa">104 - Caixa Econômica Federal</option>
                  <option value="033 - Santander">033 - Santander</option>
                  <option value="260 - Nu Pagamentos">260 - Nu Pagamentos</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agência
                </label>
                <input
                  type="text"
                  value={formData.agency}
                  onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conta
                </label>
                <input
                  type="text"
                  value={formData.account}
                  onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Conta
                </label>
                <select
                  value={formData.accountType}
                  onChange={(e) => setFormData({ ...formData, accountType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="corrente">Conta Corrente</option>
                  <option value="poupanca">Poupança</option>
                </select>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informações Adicionais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Informações adicionais sobre o fornecedor..."
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/app/suppliers')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Salvando...' : (isEdit ? 'Atualizar' : 'Salvar')}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
