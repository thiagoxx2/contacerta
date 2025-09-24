import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader, Save, X } from 'lucide-react';
import { useOrg } from '../context/OrgContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { createMinistry, updateMinistry, listMinistries } from '../services/ministryService';
import type { Ministry } from '../types/ministry';

export default function MinistryForm() {
  const params = useParams();
  const id = params.id as string | undefined;
  const isEdit = Boolean(id);
  usePageTitle(isEdit ? 'Editar Ministério - ContaCerta' : 'Novo Ministério - ContaCerta');
  const navigate = useNavigate();
  const { activeOrgId } = useOrg();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState<boolean>(isEdit);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeOrgId) {
      navigate('/select-org', { replace: true });
    }
  }, [activeOrgId, navigate]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!isEdit || !id || !activeOrgId) return;
      setLoading(true);
      setError(null);
      try {
        // There is no getById; fetch and filter for safety with orgId
        const data = await listMinistries(activeOrgId, { search: undefined, active: 'all' });
        const current = data.find((m) => m.id === id);
        if (!cancelled) {
          if (!current) throw new Error('Registro não encontrado.');
          setName(current.name);
          setDescription(current.description || '');
          setActive(Boolean(current.active));
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Erro ao carregar.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [isEdit, id, activeOrgId]);

  const validate = (): string | null => {
    if (!name || name.trim().length < 3) return 'Nome deve ter pelo menos 3 caracteres.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrgId) return;
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (isEdit && id) {
        await updateMinistry(id, activeOrgId, { name: name.trim(), description: description.trim(), active });
      } else {
        await createMinistry(activeOrgId, { name: name.trim(), description: description.trim(), active });
      }
      navigate('/app/ministries');
    } catch (e: any) {
      setError(e?.message || 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  };

  if (!activeOrgId) return null;

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Editar Ministério' : 'Novo Ministério'}</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6" aria-labelledby="ministry-form">
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">{error}</div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome</label>
            <input
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descrição</label>
            <textarea
              id="description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="active"
              name="active"
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
            />
            <label htmlFor="active" className="text-sm text-gray-800">Ativo</label>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/app/ministries')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}


