import { useState, useEffect, useCallback } from 'react';
import { listCostCentersByOrg } from '../services/costCenterService';

interface UseCostCentersComboboxOptions {
  orgId: string;
  limit?: number;
}

interface UseCostCentersComboboxResult {
  items: Array<{ id: string; name: string }>;
  loading: boolean;
  error?: string;
  search: string;
  setSearch: (search: string) => void;
  refetch: () => Promise<void>;
}

/**
 * Hook para gerenciar centros de custo com busca (com debounce) para combobox.
 */
export function useCostCentersCombobox({
  orgId,
  limit = 50,
}: UseCostCentersComboboxOptions): UseCostCentersComboboxResult {
  const [items, setItems] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce da busca (250ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchData = useCallback(async () => {
    if (!orgId) {
      setItems([]);
      setError(undefined);
      return;
    }

    setLoading(true);
    setError(undefined);

    try {
      const result = await listCostCentersByOrg(orgId, {
        q: debouncedSearch || undefined,
        limit,
      });

      if (result.error) {
        setError(result.error.message);
        setItems([]);
      } else {
        setItems((result.data ?? []).map(d => ({ id: d.id, name: d.name })));
      }
    } catch (err) {
      console.error('Erro ao buscar centros de custo:', err);
      setError('Erro ao carregar centros de custo');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [orgId, debouncedSearch, limit]);

  // Buscar centros de custo quando os parâmetros mudarem
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return {
    items,
    loading,
    error,
    search,
    setSearch,
    refetch,
  };
}

export default useCostCentersCombobox;
