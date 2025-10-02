import { useState, useEffect, useCallback } from 'react';
import { listSuppliersByOrg } from '../services/supplierService';
import { supabase } from '../lib/supabaseClient';
import type { Supplier } from '../types';

interface UseSuppliersOptions {
  orgId: string;
  onlyActive?: boolean;
  limit?: number;
}

interface UseSuppliersResult {
  suppliers: Supplier[];
  loading: boolean;
  error?: string;
  search: string;
  setSearch: (search: string) => void;
  refetch: () => Promise<void>;
}

/**
 * Hook para gerenciar fornecedores com busca (com debounce) a partir do Supabase.
 */
export function useSuppliers({
  orgId,
  onlyActive = true,
  limit = 20,
}: UseSuppliersOptions): UseSuppliersResult {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce da busca (250ms como solicitado)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchSuppliers = useCallback(async () => {
    if (!orgId) {
      setSuppliers([]);
      setError(undefined);
      return;
    }

    setLoading(true);
    setError(undefined);

    try {
      const result = await listSuppliersByOrg(orgId, {
        q: debouncedSearch || undefined,
        status: onlyActive ? 'active' : 'all',
        limit,
      });

      if (result.error) {
        setError(result.error.message);
        setSuppliers([]);
      } else {
        setSuppliers(result.data ?? []);
      }
    } catch (err) {
      console.error('Erro ao buscar fornecedores:', err);
      setError('Erro ao carregar fornecedores');
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  }, [orgId, debouncedSearch, onlyActive, limit]);

  // Buscar fornecedores quando os parâmetros mudarem
  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  // Configurar Realtime para atualizações automáticas
  useEffect(() => {
    if (!orgId) return;

    const channel = supabase
      .channel(`suppliers-realtime-${orgId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'suppliers',
        },
        (payload) => {
          // Verificar se a mudança é da organização atual
          if (payload.new && (payload.new as any).orgId === orgId) {
            // Refazer a busca para atualizar a lista
            fetchSuppliers();
          } else if (payload.old && (payload.old as any).orgId === orgId) {
            // Para deletes, também refazer a busca
            fetchSuppliers();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId, fetchSuppliers]);

  const refetch = useCallback(async () => {
    await fetchSuppliers();
  }, [fetchSuppliers]);

  return {
    suppliers,
    loading,
    error,
    search,
    setSearch,
    refetch,
  };
}

export default useSuppliers;
