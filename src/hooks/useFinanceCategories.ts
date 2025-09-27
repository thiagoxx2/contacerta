import { useState, useEffect, useCallback } from 'react';
import { listFinanceCategories, createFinanceCategory, Category, FinanceKind } from '../services/categoryService';

interface UseFinanceCategoriesReturn {
  items: Category[];
  loading: boolean;
  error: string | null;
  setQuery: (query: string) => void;
  createCategory: (name: string) => Promise<Category>;
  clearError: () => void;
}

interface UseFinanceCategoriesParams {
  orgId: string | null;
  financeKind: FinanceKind;
  debounceMs?: number;
}

export function useFinanceCategories({
  orgId,
  financeKind,
  debounceMs = 250
}: UseFinanceCategoriesParams): UseFinanceCategoriesReturn {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce da query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  // Buscar categorias quando orgId, financeKind ou query mudarem
  useEffect(() => {
    if (!orgId) {
      setItems([]);
      return;
    }

    const fetchCategories = async () => {
      setLoading(true);
      setError(null);

      try {
        const categories = await listFinanceCategories({
          orgId,
          financeKind,
          searchTerm: debouncedQuery,
          limit: 20
        });

        setItems(categories);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar categorias';
        setError(errorMessage);
        console.error('Erro ao buscar categorias:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [orgId, financeKind, debouncedQuery]);

  const createCategory = useCallback(async (name: string): Promise<Category> => {
    if (!orgId) {
      throw new Error('Organização não selecionada');
    }

    setLoading(true);
    setError(null);

    try {
      const newCategory = await createFinanceCategory({
        orgId,
        name,
        financeKind
      });

      // Adiciona a nova categoria à lista se não estiver presente
      setItems(prev => {
        const exists = prev.some(item => item.id === newCategory.id);
        if (!exists) {
          return [newCategory, ...prev].sort((a, b) => a.name.localeCompare(b.name));
        }
        return prev;
      });

      return newCategory;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar categoria';
      setError(errorMessage);
      console.error('Erro ao criar categoria:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [orgId, financeKind]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    items,
    loading,
    error,
    setQuery,
    createCategory,
    clearError
  };
}
