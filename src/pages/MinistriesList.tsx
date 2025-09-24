import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader, Plus, Search, Trash2, Edit3, Circle, AlertCircle } from 'lucide-react';
import { useOrg } from '../context/OrgContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { listMinistries, deleteMinistry } from '../services/ministryService';
import type { Ministry } from '../types/ministry';

const PAGE_SIZE = 10;

export default function MinistriesList() {
  usePageTitle('Ministérios - ContaCerta');
  const navigate = useNavigate();
  const { activeOrgId } = useOrg();
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState<Ministry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>(searchParams.get('search') || '');
  const [status, setStatus] = useState<'all' | 'true' | 'false'>(
    (searchParams.get('status') as any) || 'all'
  );
  const [page, setPage] = useState<number>(Number(searchParams.get('page') || 1));
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Redirect if no org
  useEffect(() => {
    if (!activeOrgId) {
      navigate('/select-org', { replace: true });
    }
  }, [activeOrgId, navigate]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      if (search) next.set('search', search); else next.delete('search');
      next.set('status', status);
      next.set('page', String(page));
      setSearchParams(next, { replace: true });
    }, 300);
    return () => clearTimeout(handler);
  }, [search, status, page, setSearchParams]);

  // Fetch data
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!activeOrgId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await listMinistries(activeOrgId, { search, active: status });
        if (!cancelled) setItems(data);
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
  }, [activeOrgId, search, status]);

  // Client-side pagination
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, currentPage]);

  useEffect(() => {
    if (page !== currentPage) {
      setPage(currentPage);
    }
  }, [currentPage]);

  const handleDelete = async (id: string) => {
    if (!activeOrgId) return;
    if (!confirm('Tem certeza que deseja excluir este ministério?')) return;
    try {
      setDeletingId(id);
      await deleteMinistry(id, activeOrgId);
      setItems((prev) => prev.filter((m) => m.id !== id));
    } catch (e: any) {
      alert(e?.message || 'Não foi possível excluir.');
    } finally {
      setDeletingId(null);
    }
  };

  if (!activeOrgId) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Ministérios</h1>
        <button
          onClick={() => navigate('/app/ministries/new')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600"
        >
          <Plus className="w-4 h-4" />
          Novo Ministério
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value); }}
            placeholder="Buscar por nome"
            aria-label="Buscar por nome"
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setPage(1); setStatus(e.target.value as any); }}
          aria-label="Filtrar por status"
          className="w-full sm:w-56 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
        >
          <option value="all">Todos</option>
          <option value="true">Ativos</option>
          <option value="false">Inativos</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-white border rounded-md">
          <div className="mx-auto w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-4">
            <UsersIcon />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Nenhum ministério</h3>
          <p className="text-gray-600 mb-6">Crie o primeiro ministério para começar.</p>
          <button
            onClick={() => navigate('/app/ministries/new')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600"
          >
            <Plus className="w-4 h-4" />
            Criar primeiro ministério
          </button>
        </div>
      ) : (
        <div className="bg-white border rounded-md">
          <ul className="divide-y">
            {paginated.map((m) => (
              <li key={m.id} className="p-4 flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 truncate">{m.name}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${
                        m.active ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-700 border border-gray-200'
                      }`}
                      aria-label={m.active ? 'Ativo' : 'Inativo'}
                    >
                      <Circle className={`w-3 h-3 ${m.active ? 'text-green-600' : 'text-gray-500'}`} />
                      {m.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  {m.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{m.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => navigate(`/app/ministries/${m.id}/edit`)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                    aria-label={`Editar ${m.name}`}
                  >
                    <Edit3 className="w-4 h-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(m.id)}
                    disabled={deletingId === m.id}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50"
                    aria-label={`Excluir ${m.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                    {deletingId === m.id ? 'Excluindo...' : 'Excluir'}
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-3 border-t bg-gray-50">
              <span className="text-sm text-gray-600">
                Página {currentPage} de {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-md border bg-white disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-md border bg-white disabled:opacity-50"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-blue-600">
      <path d="M16 11c1.657 0 3-1.79 3-4s-1.343-4-3-4-3 1.79-3 4 1.343 4 3 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 13c2.21 0 4-1.79 4-4S10.21 5 8 5 4 6.79 4 9s1.79 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 22v-2a4 4 0 0 1 4-4h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15 22v-2a4 4 0 0 1 4-4h0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}


