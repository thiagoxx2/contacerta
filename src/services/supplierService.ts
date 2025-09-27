import { supabase } from '../lib/supabaseClient';

export interface Supplier {
  id: string;
  orgId: string;
  type: 'PF' | 'PJ';
  name: string;
  email?: string;
  phone?: string;
  taxId?: string;
  bankInfo?: string;
  address?: string;
  category?: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListSuppliersOptions {
  q?: string;
  onlyActive?: boolean;
  limit?: number;
}

export interface ListSuppliersResult {
  suppliers: Supplier[];
  error?: string;
}

/**
 * Lista fornecedores de uma organização
 */
export async function listSuppliersByOrg(
  orgId: string, 
  opts: ListSuppliersOptions = {}
): Promise<ListSuppliersResult> {
  try {
    const { q, onlyActive = true, limit = 20 } = opts;

    let query = supabase
      .from('suppliers')
      .select('id, name, status, email, phone, type')
      .eq('orgId', orgId)
      .order('name', { ascending: true })
      .limit(limit);

    // Filtrar apenas ativos se solicitado
    if (onlyActive) {
      query = query.eq('status', true);
    }

    // Aplicar busca por nome se fornecida
    if (q && q.trim()) {
      query = query.ilike('name', `%${q.trim()}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar fornecedores:', error);
      return {
        suppliers: [],
        error: 'Erro ao carregar fornecedores'
      };
    }

    return {
      suppliers: data || []
    };
  } catch (error) {
    console.error('Erro inesperado ao buscar fornecedores:', error);
    return {
      suppliers: [],
      error: 'Erro ao carregar fornecedores'
    };
  }
}

/**
 * Busca um fornecedor específico por ID
 */
export async function getSupplierById(supplierId: string, orgId: string): Promise<{ supplier?: Supplier; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', supplierId)
      .eq('orgId', orgId)
      .single();

    if (error) {
      console.error('Erro ao buscar fornecedor:', error);
      return { error: 'Fornecedor não encontrado' };
    }

    return { supplier: data };
  } catch (error) {
    console.error('Erro inesperado ao buscar fornecedor:', error);
    return { error: 'Erro ao carregar fornecedor' };
  }
}

/**
 * Cria um novo fornecedor
 */
export async function createSupplier(supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ supplier?: Supplier; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .insert([supplier])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar fornecedor:', error);
      return { error: 'Erro ao criar fornecedor' };
    }

    return { supplier: data };
  } catch (error) {
    console.error('Erro inesperado ao criar fornecedor:', error);
    return { error: 'Erro ao criar fornecedor' };
  }
}

/**
 * Atualiza um fornecedor existente
 */
export async function updateSupplier(supplierId: string, updates: Partial<Supplier>, orgId: string): Promise<{ supplier?: Supplier; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .update(updates)
      .eq('id', supplierId)
      .eq('orgId', orgId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar fornecedor:', error);
      return { error: 'Erro ao atualizar fornecedor' };
    }

    return { supplier: data };
  } catch (error) {
    console.error('Erro inesperado ao atualizar fornecedor:', error);
    return { error: 'Erro ao atualizar fornecedor' };
  }
}

/**
 * Remove um fornecedor (soft delete ou hard delete)
 */
export async function deleteSupplier(supplierId: string, orgId: string): Promise<{ error?: string }> {
  try {
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', supplierId)
      .eq('orgId', orgId);

    if (error) {
      console.error('Erro ao remover fornecedor:', error);
      return { error: 'Erro ao remover fornecedor' };
    }

    return {};
  } catch (error) {
    console.error('Erro inesperado ao remover fornecedor:', error);
    return { error: 'Erro ao remover fornecedor' };
  }
}
