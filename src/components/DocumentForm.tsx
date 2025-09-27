import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useOrg } from '../context/OrgContext';
import { Document } from '../types';
import { Save, Upload, X, ArrowRightLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePageTitle } from '../hooks/usePageTitle';
import CategoryCombobox from './CategoryCombobox';
import SupplierCombobox from './SupplierCombobox';

export default function DocumentForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const isEdit = !!id;

  const getTitle = () => {
    if (isEdit) return 'Editar Lançamento';
    return location.pathname.includes('receivables') ? 'Nova Conta a Receber' : 'Nova Conta a Pagar';
  };

  usePageTitle(`${getTitle()} | ContaCerta`);
  
  const { state, dispatch } = useApp();
  const { activeOrgId } = useOrg();
  const { documents = [], members = [], costCenters = [] } = state;

  const existingDocument = isEdit ? documents.find(d => d.id === id) : undefined;

  const initialType = existingDocument?.type || (location.pathname.includes('receivables') ? 'receivable' : 'payable');

  const [formData, setFormData] = useState({
    type: initialType as 'payable' | 'receivable',
    description: existingDocument?.description || '',
    amount: existingDocument?.amount?.toString() || '',
    dueDate: existingDocument?.dueDate || '',
    issueDate: existingDocument?.issueDate || new Date().toISOString().split('T')[0],
    categoryId: existingDocument?.categoryId || null,
    costCenterId: existingDocument?.costCenterId || '',
    supplierId: existingDocument?.supplierId || (initialType === 'payable' ? '' : null),
    memberId: existingDocument?.memberId || (initialType === 'receivable' ? '' : null),
    status: existingDocument?.status || 'open' as Document['status'],
    paymentDate: existingDocument?.paymentDate || '',
  });

  // Reset campos quando o tipo muda
  useEffect(() => {
    if (formData.type === 'payable') {
      setFormData(prev => ({ ...prev, memberId: null }));
    } else {
      setFormData(prev => ({ ...prev, supplierId: null }));
    }
  }, [formData.type]);

  const [attachments, setAttachments] = useState<File[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newDocument: Document = {
      id: existingDocument?.id || crypto.randomUUID(),
      type: formData.type,
      description: formData.description,
      amount: parseFloat(formData.amount),
      dueDate: formData.dueDate,
      issueDate: formData.issueDate,
      status: formData.status,
      categoryId: formData.categoryId,
      costCenterId: formData.costCenterId,
      // Regra XOR: apenas um dos dois pode ter valor
      supplierId: formData.type === 'payable' ? (formData.supplierId || null) : null,
      memberId: formData.type === 'receivable' ? (formData.memberId || null) : null,
      paymentDate: formData.paymentDate || undefined,
      createdAt: existingDocument?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isEdit) {
      dispatch({ type: 'UPDATE_DOCUMENT', payload: newDocument });
    } else {
      dispatch({ type: 'ADD_DOCUMENT', payload: newDocument });
    }

    navigate(formData.type === 'payable' ? '/app/financial/payables' : '/app/financial/receivables');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };
  
  const handleCancel = () => {
    const path = formData.type === 'payable' ? '/app/financial/payables' : '/app/financial/receivables';
    navigate(path);
  };

  const activeCostCenters = costCenters;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto"
    >
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <ArrowRightLeft className="w-5 h-5 mr-2" />
            {getTitle()}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'payable' | 'receivable' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                required
                disabled={isEdit}
              >
                <option value="payable">Conta a Pagar</option>
                <option value="receivable">Conta a Receber</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Centro de Custo *</label>
              <select
                value={formData.costCenterId}
                onChange={(e) => setFormData({ ...formData, costCenterId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Selecione um centro de custo</option>
                {activeCostCenters.map(cc => <option key={cc.id} value={cc.id}>{cc.name}</option>)}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {formData.type === 'payable' ? 'Fornecedor' : 'Membro'}
            </label>
            
            {formData.type === 'payable' ? (
              <SupplierCombobox
                value={formData.supplierId}
                onChange={(supplierId) => setFormData({ ...formData, supplierId })}
                orgId={activeOrgId || ''}
                placeholder="Selecione (Opcional)"
              />
            ) : (
              <select
                value={formData.memberId || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  memberId: e.target.value || null
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione (Opcional)</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Descrição *</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Categoria *</label>
              <CategoryCombobox
                value={formData.categoryId}
                onChange={(categoryId) => setFormData({ ...formData, categoryId })}
                documentType={formData.type}
                placeholder={formData.type === 'payable' ? 'Ex: Aluguel' : 'Ex: Dízimo'}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Valor (R$) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data de Emissão *</label>
              <input type="date" value={formData.issueDate} onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data de Vencimento *</label>
              <input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as Document['status'] })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="open">Em Aberto</option>
                <option value="paid">Pago</option>
                <option value="overdue">Vencido</option>
              </select>
            </div>
            {formData.status === 'paid' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data do Pagamento</label>
                <input type="date" value={formData.paymentDate} onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Anexos</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <input type="file" multiple onChange={handleFileChange} className="hidden" id="file-upload" />
                <label htmlFor="file-upload" className="cursor-pointer text-blue-600 hover:text-blue-500">Clique para selecionar arquivos</label>
                <p className="text-sm text-gray-500 mt-1">PDF, DOC, JPG, PNG até 10MB</p>
              </div>
            </div>
            {attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <button type="button" onClick={() => removeAttachment(index)} className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button type="button" onClick={handleCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
              Cancelar
            </button>
            <button type="submit" className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <Save className="w-4 h-4 mr-2" />
              {isEdit ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
