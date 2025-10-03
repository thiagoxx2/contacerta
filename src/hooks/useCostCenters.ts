import { useState, useEffect, useCallback } from 'react';
import { listCostCentersByOrg, mapDBTypeToUI, DBCostCenter } from '../services/costCenterService';
import { supabase } from '../lib/supabaseClient';

interface UseCostCentersOptions {
  orgId: string;
}

interface UseCostCentersResult {
  costCenters: Array<{
    id: string;
    orgId: string;
    name: string;
    type: 'ministry' | 'event' | 'group';
    ministryId?: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  loading: boolean;
  error?: string;
  search: string;
  setSearch: (search: string) => void;
  filterType: 'all' | 'ministry' | 'event' | 'group';
  setFilterType: (type: 'all' | 'ministry' | 'event' | 'group') => void;
  refetch: () => Promise<void>;
}

/**
 * Hook para gerenciar centros de custo com busca e filtros a partir do Supabase.
 */
export function useCostCenters({
  orgId,
}: UseCostCentersOptions): UseCostCentersResult {
  const [costCenters, setCostCenters] = useState<UseCostCentersResult['costCenters']>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'ministry' | 'event' | 'group'>('all');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce da busca (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchCostCenters = useCallback(async () => {
    if (!orgId) {
      setCostCenters([]);
      setError(undefined);
      return;
    }

    setLoading(true);
    setError(undefined);

    try {
      const result = await listCostCentersByOrg(orgId, {
        q: debouncedSearch || undefined,
        type: filterType,
      });

      // Mapear dados do banco para o formato da UI
      const mappedCostCenters = result.data?.map((cc: DBCostCenter) => ({
        id: cc.id,
        orgId: cc.orgId,
        name: cc.name,
        type: mapDBTypeToUI(cc.type),
        ministryId: cc.ministryId,
        createdAt: cc.createdAt,
        updatedAt: cc.updatedAt,
      })) || [];

      setCostCenters(mappedCostCenters);
    } catch (err) {
      console.error('Erro ao buscar centros de custo:', err);
      setError('Erro ao carregar centros de custo');
      setCostCenters([]);
    } finally {
      setLoading(false);
    }
  }, [orgId, debouncedSearch, filterType]);

  // Buscar centros de custo quando os parâmetros mudarem
  useEffect(() => {
    fetchCostCenters();
  }, [fetchCostCenters]);

  // Configurar Realtime para atualizações automáticas
  useEffect(() => {
    if (!orgId) return;

    const channel = supabase
      .channel(`cost-centers-realtime-${orgId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cost_centers',
        },
        (payload) => {
          // Verificar se a mudança é da organização atual
          if (payload.new && (payload.new as any).orgId === orgId) {
            // Refazer a busca para atualizar a lista
            fetchCostCenters();
          } else if (payload.old && (payload.old as any).orgId === orgId) {
            // Para deletes, também refazer a busca
            fetchCostCenters();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId, fetchCostCenters]);

  const refetch = useCallback(async () => {
    await fetchCostCenters();
  }, [fetchCostCenters]);

  return {
    costCenters,
    loading,
    error,
    search,
    setSearch,
    filterType,
    setFilterType,
    refetch,
  };
}

export default useCostCenters;