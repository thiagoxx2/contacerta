import { supabase } from '../lib/supabaseClient';

export type CategoryScope = 'FINANCE' | 'SUPPLIER' | 'ASSET';
export type FinanceKind = 'INCOME' | 'EXPENSE';

export interface Category {
  id: string;
  orgId: string;
  name: string;
  scope: CategoryScope;
  financeKind: FinanceKind | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryParams {
  orgId: string;
  name: string;
  scope: CategoryScope;
  financeKind?: FinanceKind;
}

export interface ListCategoriesParams {
  orgId: string;
  scope: CategoryScope;
  financeKind?: FinanceKind;
  searchTerm?: string;
  limit?: number;
}

/**
 * Lista categorias financeiras por organização, tipo financeiro e termo de busca
 */
export async function listFinanceCategories({
  orgId,
  financeKind,
  searchTerm = '',
  limit = 20
}: Omit<ListCategoriesParams, 'scope'> & { scope?: never }): Promise<Category[]> {
  try {
    let query = supabase
      .from('categories')
      .select('*')
      .eq('orgId', orgId)
      .eq('scope', 'FINANCE')
      .order('name', { ascending: true })
      .limit(limit);

    if (financeKind) {
      query = query.eq('financeKind', financeKind);
    }

    if (searchTerm.trim()) {
      query = query.ilike('name', `%${searchTerm.trim()}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao listar categorias:', error);
      throw new Error('Erro ao carregar categorias');
    }

    return data || [];
  } catch (error) {
    console.error('Erro no service de categorias:', error);
    throw error;
  }
}

/**
 * Cria uma categoria financeira de forma idempotente
 * Se já existir uma categoria com o mesmo nome, retorna a existente
 */
export async function createFinanceCategory({
  orgId,
  name,
  financeKind
}: CreateCategoryParams & { scope?: never }): Promise<Category> {
  try {
    const normalizedName = name.trim();
    
    if (!normalizedName) {
      throw new Error('Nome da categoria é obrigatório');
    }

    if (!financeKind) {
      throw new Error('Tipo financeiro é obrigatório para categorias financeiras');
    }

    // Primeiro, tenta buscar se já existe
    const { data: existing } = await supabase
      .from('categories')
      .select('*')
      .eq('orgId', orgId)
      .eq('scope', 'FINANCE')
      .eq('financeKind', financeKind)
      .ilike('name', normalizedName)
      .single();

    if (existing) {
      return existing;
    }

    // Se não existe, cria nova
    const { data, error } = await supabase
      .from('categories')
      .insert({
        orgId,
        name: normalizedName,
        scope: 'FINANCE',
        financeKind
      })
      .select()
      .single();

    if (error) {
      // Se erro de unicidade, tenta buscar novamente
      if (error.code === '23505') {
        const { data: existingAfterError } = await supabase
          .from('categories')
          .select('*')
          .eq('orgId', orgId)
          .eq('scope', 'FINANCE')
          .eq('financeKind', financeKind)
          .ilike('name', normalizedName)
          .single();

        if (existingAfterError) {
          return existingAfterError;
        }
      }
      
      console.error('Erro ao criar categoria:', error);
      throw new Error('Erro ao criar categoria');
    }

    return data;
  } catch (error) {
    console.error('Erro no service de categorias:', error);
    throw error;
  }
}

/**
 * Busca uma categoria por ID
 */
export async function getCategoryById(categoryId: string): Promise<Category | null> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Não encontrado
      }
      console.error('Erro ao buscar categoria:', error);
      throw new Error('Erro ao carregar categoria');
    }

    return data;
  } catch (error) {
    console.error('Erro no service de categorias:', error);
    throw error;
  }
}

/**
 * Mapeia o tipo de documento para o tipo financeiro
 */
export function getFinanceKindFromDocumentType(documentType: 'payable' | 'receivable'): FinanceKind {
  return documentType === 'payable' ? 'EXPENSE' : 'INCOME';
}
