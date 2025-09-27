import { useState, useEffect, useCallback } from 'react';
import { listSuppliersByOrg } from '../services/supplierService';
import type { Supplier } from '../services/supplierService';

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
 * Hook para gerenciar fornecedores com busca e debounce
 */
export function useSuppliers({ 
  orgId, 
  onlyActive = true, 
  limit = 20 
}: UseSuppliersOptions): UseSuppliersResult {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce da busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 250);

    return () => clearTimeout(timer);
  }, [search]);

  // Função para buscar fornecedores
  const fetchSuppliers = useCallback(async () => {
    if (!orgId) return;

    setLoading(true);
    setError(undefined);

    try {
      const result = await listSuppliersByOrg(orgId, {
        q: debouncedSearch || undefined,
        onlyActive,
        limit
      });

      if (result.error) {
        setError(result.error);
        setSuppliers([]);
      } else {
        setSuppliers(result.suppliers);
        setError(undefined);
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

  // Função para refetch manual
  const refetch = useCallback(async () => {
    await fetchSuppliers();
  }, [fetchSuppliers]);

  return {
    suppliers,
    loading,
    error,
    search,
    setSearch,
    refetch
  };
}
