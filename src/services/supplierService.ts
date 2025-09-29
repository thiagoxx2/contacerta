import { supabase } from '../lib/supabaseClient';
import { Supplier } from '../types';

export interface CreateSupplierInput {
  orgId: string;
  type: 'PF' | 'PJ';
  name: string;
  email?: string;
  phone?: string;
  taxId?: string;
  category?: string;
  status?: boolean;
  address?: string | null;
  bankInfo?: string | null;
}

export interface UpdateSupplierInput {
  id: string;
  orgId: string;
  type?: 'PF' | 'PJ';
  name?: string;
  email?: string;
  phone?: string;
  taxId?: string;
  category?: string;
  status?: boolean;
  address?: string | null;
  bankInfo?: string | null;
}

export interface ListSuppliersOptions {
  q?: string;
  status?: 'all' | 'active' | 'inactive';
  category?: string;
  limit?: number;
}

export interface SupplierServiceError {
  code: string;
  message: string;
}

/**
 * Lista fornecedores de uma organização
 */
export async function listSuppliersByOrg(
  orgId: string, 
  opts: ListSuppliersOptions = {}
): Promise<{ data: Supplier[] | null; error: SupplierServiceError | null }> {
  try {
    const { q, status = 'all', category, limit = 100 } = opts;
    
    let query = supabase
      .from('suppliers')
      .select('id, orgId, type, name, email, phone, taxId, category, status, address, bankInfo, createdAt, updatedAt')
      .eq('orgId', orgId)
      .order('name', { ascending: true })
      .limit(limit);

    // Filtrar por status
    if (status === 'active') {
      query = query.eq('status', true);
    } else if (status === 'inactive') {
      query = query.eq('status', false);
    }

    // Filtrar por busca (nome, email, telefone)
    if (q) {
      query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
    }

    // Filtrar por categoria
    if (category) {
      query = query.ilike('category', `%${category}%`);
    }

    const { data, error } = await query;

    if (error) {
      return { 
        data: null, 
        error: { 
          code: error.code || 'UNKNOWN_ERROR', 
          message: getErrorMessage(error) 
        } 
      };
    }

    return { data, error: null };
  } catch (error) {
    return { 
      data: null, 
      error: { 
        code: 'UNKNOWN_ERROR', 
        message: 'Erro inesperado ao listar fornecedores' 
      } 
    };
  }
}

/**
 * Cria um novo fornecedor
 */
export async function createSupplier(
  input: CreateSupplierInput
): Promise<{ data: Supplier | null; error: SupplierServiceError | null }> {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .insert([input])
      .select('id, orgId, type, name, email, phone, taxId, category, status, createdAt, updatedAt')
      .single();

    if (error) {
      return { 
        data: null, 
        error: { 
          code: error.code || 'UNKNOWN_ERROR', 
          message: getErrorMessage(error) 
        } 
      };
    }

    return { data, error: null };
  } catch (error) {
    return { 
      data: null, 
      error: { 
        code: 'UNKNOWN_ERROR', 
        message: 'Erro inesperado ao criar fornecedor' 
      } 
    };
  }
}

/**
 * Atualiza um fornecedor existente
 */
export async function updateSupplier(
  input: UpdateSupplierInput
): Promise<{ data: Supplier | null; error: SupplierServiceError | null }> {
  try {
    const { id, orgId, ...updateData } = input;
    
    const { data, error } = await supabase
      .from('suppliers')
      .update(updateData)
      .eq('id', id)
      .eq('orgId', orgId)
      .select('id, orgId, type, name, email, phone, taxId, category, status, createdAt, updatedAt')
      .single();

    if (error) {
      return { 
        data: null, 
        error: { 
          code: error.code || 'UNKNOWN_ERROR', 
          message: getErrorMessage(error) 
        } 
      };
    }

    return { data, error: null };
  } catch (error) {
    return { 
      data: null, 
      error: { 
        code: 'UNKNOWN_ERROR', 
        message: 'Erro inesperado ao atualizar fornecedor' 
      } 
    };
  }
}

/**
 * Remove um fornecedor (delete real)
 */
export async function deleteSupplier(
  id: string, 
  orgId: string
): Promise<{ data: boolean; error: SupplierServiceError | null }> {
  try {
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id)
      .eq('orgId', orgId);

    if (error) {
      return { 
        data: false, 
        error: { 
          code: error.code || 'UNKNOWN_ERROR', 
          message: getErrorMessage(error) 
        } 
      };
    }

    return { data: true, error: null };
  } catch (error) {
    return { 
      data: false, 
      error: { 
        code: 'UNKNOWN_ERROR', 
        message: 'Erro inesperado ao remover fornecedor' 
      } 
    };
  }
}

/**
 * Converte erros do Supabase em mensagens amigáveis
 */
function getErrorMessage(error: any): string {
  const code = error.code;
  
  switch (code) {
    case '23505': // Unique constraint violation
      return 'Fornecedor com esse documento já existe nesta organização.';
    case '23503': // Foreign key constraint violation
      return 'Organização inválida para este cadastro.';
    case 'PGRST116': // Row not found
      return 'Fornecedor não encontrado.';
    case '42501': // Insufficient privileges
      return 'Você não tem permissão para realizar esta operação.';
    default:
      return error.message || 'Não foi possível salvar o fornecedor. Tente novamente.';
  }
}

/**
 * Helper para remover máscaras de documentos
 */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Valida CPF (11 dígitos)
 */
export function validateCPF(cpf: string): boolean {
  const digits = digitsOnly(cpf);
  return digits.length === 11;
}

/**
 * Valida CNPJ (14 dígitos)
 */
export function validateCNPJ(cnpj: string): boolean {
  const digits = digitsOnly(cnpj);
  return digits.length === 14;
}