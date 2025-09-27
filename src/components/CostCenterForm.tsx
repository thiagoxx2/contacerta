import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useOrg } from '../context/OrgContext';
import { CostCenter } from '../types';
import { Save, Box } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePageTitle } from '../hooks/usePageTitle';
import { useOrgMinistries } from '../hooks/useOrgMinistries';
import { 
  createCostCenter, 
  updateCostCenter, 
  mapUITypeToDB, 
  mapDBTypeToUI,
  DBCostCenterType 
} from '../services/costCenterService';

export default function CostCenterForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  usePageTitle(isEdit ? 'Editar Centro de Custo' : 'Novo Centro de Custo');
  
  const { state, dispatch } = useApp();
  const { costCenters = [] } = state;
  const { activeOrgId } = useOrg();

  const existingCostCenter = isEdit ? costCenters.find(cc => cc.id === id) : undefined;

  // Hook para buscar ministérios da organização
  const { ministries, loading: ministriesLoading, error: ministriesError } = useOrgMinistries(activeOrgId);

  const [formData, setFormData] = useState({
    name: existingCostCenter?.name || '',
    type: existingCostCenter?.type || 'ministry' as CostCenter['type'],
    description: existingCostCenter?.description || '',
    ministryId: existingCostCenter?.ministryId || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função para obter nome efetivo baseado no tipo e ministério selecionado

  // Obter nome efetivo baseado no tipo
  const getEffectiveName = () => {
    if (formData.type === 'ministry' && formData.ministryId) {
      const selectedMinistry = ministries.find(m => m.id === formData.ministryId);
      return selectedMinistry?.name || '';
    }
    return formData.name;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações obrigatórias
    if (!activeOrgId) {
      setError('Organização não encontrada');
      return;
    }

    if (formData.type === 'ministry' && !formData.ministryId) {
      setError('Para tipo Ministério, selecione um Ministério');
      return;
    }

    if (formData.type !== 'ministry' && !formData.name.trim()) {
      setError('Nome é obrigatório para este tipo');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const dbType = mapUITypeToDB(formData.type);
      const effectiveName = getEffectiveName();

      // Preparar payload com validações
      const payload = {
        orgId: activeOrgId,
        type: dbType,
        name: effectiveName || formData.name.trim(),
        ministryId: dbType === 'MINISTRY' ? formData.ministryId : null,
      };

      let result;
      if (isEdit && existingCostCenter) {
        result = await updateCostCenter({
          id: existingCostCenter.id,
          orgId: activeOrgId,
          type: payload.type,
          name: payload.name,
          ministryId: payload.ministryId,
        });
      } else {
        result = await createCostCenter(payload);
      }

      // Converter resultado do DB para formato local
      const localCostCenter: CostCenter = {
        id: result.id,
        name: result.name,
        type: mapDBTypeToUI(result.type), // Converter tipo DB para UI
        ministryId: result.ministryId,
        description: formData.description || undefined,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      };

      // Atualizar store local
      if (isEdit) {
        dispatch({ type: 'UPDATE_COST_CENTER', payload: localCostCenter });
      } else {
        dispatch({ type: 'ADD_COST_CENTER', payload: localCostCenter });
      }

      navigate('/app/cost-centers');
    } catch (err) {
      console.error('Error saving cost center:', err);
      setError(err instanceof Error ? err.message : 'Erro ao salvar centro de custo');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Box className="w-5 h-5 mr-2" />
            {isEdit ? 'Editar Centro de Custo' : 'Novo Centro de Custo'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo *</label>
              <select
                value={formData.type}
                onChange={(e) => {
                  const newType = e.target.value as CostCenter['type'];
                  setFormData({ 
                    ...formData, 
                    type: newType,
                    // Limpar ministryId quando mudar de tipo
                    ministryId: newType === 'ministry' ? formData.ministryId : ''
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="ministry">Ministério</option>
                <option value="event">Evento</option>
                <option value="group">Grupo</option>
              </select>
            </div>
          </div>

          {formData.type === 'ministry' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ministério *</label>
              {ministriesLoading ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                  Carregando ministérios...
                </div>
              ) : ministriesError ? (
                <div className="text-red-600 text-sm">
                  Erro ao carregar ministérios: {ministriesError}
                </div>
              ) : (
                <select
                  value={formData.ministryId}
                  onChange={(e) => setFormData({ ...formData, ministryId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Selecione um ministério</option>
                  {ministries.map((ministry) => (
                    <option key={ministry.id} value={ministry.id}>
                      {ministry.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nome *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Evento de Natal"
                required
              />
            </div>
          )}

          {/* Campo de nome efetivo (readonly) para tipo ministério */}
          {formData.type === 'ministry' && formData.ministryId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Centro de Custo</label>
              <input
                type="text"
                value={getEffectiveName()}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                disabled
                readOnly
              />
              <p className="text-sm text-gray-500 mt-1">
                O nome será automaticamente definido como o nome do ministério selecionado.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descreva o propósito deste cen tro de custo..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/app/cost-centers')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Salvando...' : (isEdit ? 'Atualizar' : 'Salvar')}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
