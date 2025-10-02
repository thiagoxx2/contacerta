import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useOrg } from '../context/OrgContext';
import { Asset } from '../types';
import { Save, Archive } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePageTitle } from '../hooks/usePageTitle';
import CurrencyInput from './CurrencyInput';
import SupplierCombobox from './SupplierCombobox';
import { formatAssetCode } from '../utils/asset';
import { createAsset, updateAsset } from '../services/assetService';

const COMMON_ASSET_CATEGORIES = [
  'Mobiliário', 'Eletrônicos', 'Informática', 'Áudio e Vídeo', 'Instrumentos Musicais',
  'Som e Iluminação', 'Eletrodomésticos', 'Escritório', 'Obras/Construção', 'Ferramentas',
  'Veículos', 'Limpeza e Manutenção', 'Segurança', 'Uniformes e Têxteis', 'Utilidades Gerais'
].sort();


export default function AssetForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  usePageTitle(isEdit ? 'Editar Item do Patrimônio' : 'Novo Item do Patrimônio');

  const { state } = useApp();
  const { assets = [] } = state;
  const { activeOrgId } = useOrg();

  const existingAsset = isEdit ? assets.find(a => a.id === id) : undefined;

  const [formData, setFormData] = useState({
    name: existingAsset?.name || '',
    description: existingAsset?.description || '',
    category: existingAsset?.category || '',
    location: existingAsset?.location || '',
    purchaseDate: existingAsset?.acquisitionAt?.slice(0, 10) || new Date().toISOString().split('T')[0],
    purchaseValueCents: existingAsset?.acquisitionVal ? Math.round(Number(existingAsset.acquisitionVal) * 100) : null,
    supplierId: existingAsset?.supplierId || '',
    status: existingAsset?.status || 'in_use' as Asset['status'],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar activeOrgId
    if (!activeOrgId) {
      alert('Erro: Organização não selecionada. Por favor, selecione uma organização.');
      return;
    }

    try {
      if (isEdit) {
        // Atualizar asset existente
        const { data, error } = await updateAsset({
          id: id!,
          orgId: activeOrgId,
          description: formData.description || '',
          categoryId: null, // Por enquanto, não usamos catálogo
          location: formData.location || null,
          supplierId: formData.supplierId || null,
          status: formData.status,
          acquisitionAt: formData.purchaseDate,
          acquisitionVal: (formData.purchaseValueCents ?? 0) / 100,
        });

        if (error) {
          console.error('Erro ao atualizar patrimônio:', error);
          alert(`Erro ao atualizar patrimônio: ${error.message}`);
          return;
        }

        console.log('Patrimônio atualizado com sucesso:', data);
      } else {
        // Criar novo asset
        const { data, error } = await createAsset({
          orgId: activeOrgId,
          name: formData.name,                               // 👈 agora enviando o name do form
          description: formData.description || '',
          categoryId: null,                                  // continua null por enquanto
          location: formData.location || null,
          supplierId: formData.supplierId || null,
          status: formData.status,
          acquisitionAt: formData.purchaseDate,
          acquisitionVal: (formData.purchaseValueCents ?? 0) / 100,
        });

        if (error) {
          console.error('Erro ao criar patrimônio:', error);
          alert(`Erro ao criar patrimônio: ${error.message}`);
          return;
        }

        console.log('Patrimônio criado com sucesso:', data);
      }

      // Navegar para a listagem apenas se não houve erro
      navigate('/app/assets');
    } catch (error) {
      console.error('Erro inesperado:', error);
      alert('Erro inesperado. Tente novamente.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto"
    >
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Archive className="w-5 h-5 mr-2" />
            {isEdit ? 'Editar Item do Patrimônio' : 'Novo Item do Patrimônio'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Item *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            {isEdit && existingAsset && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Número do Patrimônio</label>
                <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-700">
                  {formatAssetCode(existingAsset)}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Detalhes sobre o item, marca, modelo, etc."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Categoria *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="" disabled>Selecione uma categoria</option>
                {COMMON_ASSET_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                {isEdit && existingAsset?.category && !COMMON_ASSET_CATEGORIES.includes(existingAsset.category) && (
                  <option value={existingAsset.category}>{existingAsset.category}</option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Localização *</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Salão Principal, Cozinha"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data da Compra *</label>
              <input
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Valor da Compra (R$) *</label>
              <CurrencyInput
                value={formData.purchaseValueCents}
                onChange={(cents) => setFormData({ ...formData, purchaseValueCents: cents })}
                required
                placeholder="R$ 0,00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fornecedor</label>
              <SupplierCombobox
                value={formData.supplierId}
                onChange={(supplierId) => setFormData({ ...formData, supplierId: supplierId ?? '' })}
                orgId={activeOrgId || ''}
                placeholder="Selecione (Opcional)"
                disabled={!activeOrgId}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Asset['status'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="in_use">Em Uso</option>
                <option value="in_storage">Em Estoque</option>
                <option value="in_maintenance">Em Manutenção</option>
                <option value="disposed">Baixado</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/app/assets')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Save className="w-4 h-4 mr-2" />
              {isEdit ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
