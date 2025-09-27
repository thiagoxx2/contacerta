import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useOrg } from '../context/OrgContext';
import { Member } from '../types';
import { Save, User, Upload, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePageTitle } from '../hooks/usePageTitle';
import { useOrgMinistries } from '../hooks/useOrgMinistries';
import { listMinistryIdsByMember, setMemberMinistries } from '../services/memberMinistriesService';

export default function MemberForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  usePageTitle(isEdit ? 'Editar Membro | ContaCerta' : 'Novo Membro | ContaCerta');
  
  const { state, dispatch } = useApp();
  const { activeOrgId } = useOrg();
  const { members = [] } = state;
  
  // Hook para carregar ministérios da organização
  const { ministries, loading: ministriesLoading, error: ministriesError } = useOrgMinistries(activeOrgId);

  const existingMember = isEdit ? members.find(m => m.id === id) : undefined;

  const [formData, setFormData] = useState({
    name: existingMember?.name || '',
    email: existingMember?.email || '',
    phone: existingMember?.phone || '',
    birthDate: existingMember?.birthDate || '',
    gender: existingMember?.gender || 'Masculino' as Member['gender'],
    maritalStatus: existingMember?.maritalStatus || 'Solteiro(a)' as Member['maritalStatus'],
    membershipDate: existingMember?.membershipDate || new Date().toISOString().split('T')[0],
    baptismDate: existingMember?.baptismDate || '',
    status: existingMember?.status || 'ativo' as Member['status'],
    ministries: existingMember?.ministries || [] as string[],
    notes: existingMember?.notes || '',
    
    street: existingMember?.address?.street || '',
    number: existingMember?.address?.number || '',
    complement: existingMember?.address?.complement || '',
    neighborhood: existingMember?.address?.neighborhood || '',
    city: existingMember?.address?.city || '',
    state: existingMember?.address?.state || '',
    zipCode: existingMember?.address?.zipCode || '',
  });
  
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  
  // Estado para os IDs dos ministérios selecionados (IDs reais do Supabase)
  const [selectedMinistryIds, setSelectedMinistryIds] = useState<string[]>([]);
  
  // Estado para controlar o carregamento dos vínculos existentes
  const [loadingExistingMinistries, setLoadingExistingMinistries] = useState(false);

  // Carregar vínculos existentes em modo de edição
  useEffect(() => {
    const loadExistingMinistries = async () => {
      if (isEdit && id && activeOrgId) {
        setLoadingExistingMinistries(true);
        try {
          const existingMinistryIds = await listMinistryIdsByMember(id, activeOrgId);
          setSelectedMinistryIds(existingMinistryIds);
        } catch (error) {
          console.error('Erro ao carregar ministérios do membro:', error);
        } finally {
          setLoadingExistingMinistries(false);
        }
      }
    };

    loadExistingMinistries();
  }, [isEdit, id, activeOrgId]);

  const handleMinistryChange = (ministryId: string) => {
    setSelectedMinistryIds(prev => {
      const newMinistryIds = prev.includes(ministryId)
        ? prev.filter(id => id !== ministryId)
        : [...prev, ministryId];
      return newMinistryIds;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!activeOrgId) {
      alert('Organização não selecionada. Por favor, selecione uma organização.');
      return;
    }
    
    const memberId = existingMember?.id || crypto.randomUUID();
    
    const member: Member = {
      id: memberId,
      name: formData.name,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      birthDate: formData.birthDate,
      gender: formData.gender,
      maritalStatus: formData.maritalStatus,
      membershipDate: formData.membershipDate,
      baptismDate: formData.baptismDate || undefined,
      status: formData.status,
      ministries: selectedMinistryIds, // Usar os IDs selecionados
      notes: formData.notes || undefined,
      profilePictureUrl: existingMember?.profilePictureUrl || 'https://i.pravatar.cc/150?u=' + memberId,
      address: formData.street ? {
        street: formData.street,
        number: formData.number,
        complement: formData.complement || undefined,
        neighborhood: formData.neighborhood,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
      } : undefined,
      createdAt: existingMember?.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    try {
      // Atualizar o store local
      if (isEdit) {
        dispatch({ type: 'UPDATE_MEMBER', payload: member });
      } else {
        dispatch({ type: 'ADD_MEMBER', payload: member });
      }

      // Persistir vínculos no Supabase
      await setMemberMinistries(memberId, activeOrgId, selectedMinistryIds);

      navigate('/app/members');
    } catch (error) {
      console.error('Erro ao salvar vínculos de ministérios:', error);
      alert('Erro ao salvar os ministérios do membro. Tente novamente.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfilePicture(e.target.files[0]);
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <User className="w-5 h-5 mr-2" />
            {isEdit ? 'Editar Membro' : 'Novo Membro'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informações Pessoais</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-3 flex items-center gap-6">
                <div className="relative">
                  <img 
                    src={profilePicture ? URL.createObjectURL(profilePicture) : (existingMember?.profilePictureUrl || `https://ui-avatars.com/api/?name=${formData.name.replace(' ', '+')}&background=random`)} 
                    alt="Foto do perfil" 
                    className="h-24 w-24 rounded-full object-cover"
                  />
                  <label htmlFor="picture-upload" className="absolute -bottom-2 -right-2 cursor-pointer bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700">
                    <Upload className="w-4 h-4" />
                    <input id="picture-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                  </label>
                </div>
                <div className="flex-grow">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data de Nascimento *</label>
                <input type="date" value={formData.birthDate} onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gênero *</label>
                <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value as Member['gender'] })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Masculino</option>
                  <option>Feminino</option>
                  <option>Outro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado Civil *</label>
                <select value={formData.maritalStatus} onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value as Member['maritalStatus'] })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Solteiro(a)</option>
                  <option>Casado(a)</option>
                  <option>Divorciado(a)</option>
                  <option>Viúvo(a)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Contato</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          {/* Church Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informações da Igreja</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data de Membresia *</label>
                <input type="date" value={formData.membershipDate} onChange={(e) => setFormData({ ...formData, membershipDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data de Batismo</label>
                <input type="date" value={formData.baptismDate} onChange={(e) => setFormData({ ...formData, baptismDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Ministérios</label>
                {ministriesLoading || loadingExistingMinistries ? (
                  <div className="flex items-center justify-center p-4 border border-gray-300 rounded-md">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    <span className="text-sm text-gray-600">
                      {ministriesLoading ? 'Carregando ministérios...' : 'Carregando vínculos existentes...'}
                    </span>
                  </div>
                ) : ministriesError ? (
                  <div className="p-4 border border-red-300 rounded-md bg-red-50">
                    <p className="text-sm text-red-600">
                      {ministriesError}
                    </p>
                  </div>
                ) : ministries.length === 0 ? (
                  <div className="p-4 border border-gray-300 rounded-md bg-gray-50">
                    <p className="text-sm text-gray-600">
                      Nenhum ministério ativo encontrado para esta organização.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4 border border-gray-300 rounded-md">
                    {ministries.map(ministry => (
                      <label key={ministry.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedMinistryIds.includes(ministry.id)}
                          onChange={() => handleMinistryChange(ministry.id)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{ministry.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as Member['status'] })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                  <option value="visitante">Visitante</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Address */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Endereço</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CEP</label>
                <input type="text" value={formData.zipCode} onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Logradouro</label>
                <input type="text" value={formData.street} onChange={(e) => setFormData({ ...formData, street: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Número</label>
                <input type="text" value={formData.number} onChange={(e) => setFormData({ ...formData, number: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Complemento</label>
                <input type="text" value={formData.complement} onChange={(e) => setFormData({ ...formData, complement: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Observações</h3>
            <div>
              <textarea rows={4} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Informações adicionais sobre o membro..."></textarea>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button type="button" onClick={() => navigate('/app/members')} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={ministriesLoading || loadingExistingMinistries}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {ministriesLoading || loadingExistingMinistries ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isEdit ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
