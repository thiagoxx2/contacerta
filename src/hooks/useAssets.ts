import { useState, useEffect, useCallback } from 'react';
import { listAssetsByOrg } from '../services/assetService';
import type { Asset } from '../types';

interface UseAssetsOptions {
  orgId: string;
  limit?: number;
}

interface UseAssetsResult {
  assets: Asset[];
  loading: boolean;
  error?: string;
  search: string;
  setSearch: (search: string) => void;
  filterStatus: 'all' | 'in_use' | 'in_storage' | 'in_maintenance' | 'disposed';
  setFilterStatus: (status: 'all' | 'in_use' | 'in_storage' | 'in_maintenance' | 'disposed') => void;
  filterCategoryId: string;
  setFilterCategoryId: (categoryId: string) => void;
  categories: string[];
  refetch: () => Promise<void>;
}

/**
 * Mapeia status da UI para o banco de dados
 */
function mapUiStatusToDb(status: 'all' | 'in_use' | 'in_storage' | 'in_maintenance' | 'disposed'): 'all' | 'IN_USE' | 'IN_STORAGE' | 'IN_MAINTENANCE' | 'DISPOSED' {
  switch (status) {
    case 'all': return 'all';
    case 'in_use': return 'IN_USE';
    case 'in_storage': return 'IN_STORAGE';
    case 'in_maintenance': return 'IN_MAINTENANCE';
    case 'disposed': return 'DISPOSED';
  }
}

/**
 * Hook para gerenciar ativos com busca e filtros
 */
export function useAssets({
  orgId,
  limit = 200,
}: UseAssetsOptions): UseAssetsResult {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'in_use' | 'in_storage' | 'in_maintenance' | 'disposed'>('all');
  const [filterCategoryId, setFilterCategoryId] = useState('');

  // Debounce da busca (250ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchAssets = useCallback(async () => {
    if (!orgId) {
      setAssets([]);
      setError(undefined);
      return;
    }

    setLoading(true);
    setError(undefined);

    try {
      const result = await listAssetsByOrg(orgId, {
        q: debouncedSearch || undefined,
        status: mapUiStatusToDb(filterStatus),
        categoryId: filterCategoryId || undefined,
        limit,
      });

      if (result.error) {
        setError(result.error.message);
        setAssets([]);
      } else {
        setAssets(result.data ?? []);
      }
    } catch (err) {
      console.error('Erro ao buscar ativos:', err);
      setError('Erro ao carregar ativos');
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }, [orgId, debouncedSearch, filterStatus, filterCategoryId, limit]);

  // Buscar ativos quando os parâmetros mudarem
  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const refetch = useCallback(async () => {
    await fetchAssets();
  }, [fetchAssets]);

  // Extrair categorias únicas dos resultados
  const categories = Array.from(new Set(
    assets
      .map(asset => asset.category)
      .filter(Boolean)
  )).sort();

  return {
    assets,
    loading,
    error,
    search,
    setSearch,
    filterStatus,
    setFilterStatus,
    filterCategoryId,
    setFilterCategoryId,
    categories,
    refetch,
  };
}

export default useAssets;
