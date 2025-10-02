import { supabase } from '../lib/supabaseClient';
import { Asset } from '../types';
import { mapUiToDbStatus, mapDbToUiStatus, UiAssetStatus, DbAssetStatus } from '../utils/status';

export interface CreateAssetInput {
  orgId: string;
  name: string;
  description: string;
  categoryId?: string | null;
  location?: string | null;
  supplierId?: string | null;
  status: UiAssetStatus;
  acquisitionAt: string;
  acquisitionVal: number;
}

export interface UpdateAssetInput {
  id: string;
  orgId: string;
  description?: string;
  categoryId?: string | null;
  location?: string | null;
  supplierId?: string | null;
  status?: UiAssetStatus;
  acquisitionAt?: string; // ISO date (yyyy-mm-dd)
  acquisitionVal?: number;
}

export interface ListAssetsOptions {
  q?: string;
  status?: UiAssetStatus | 'all';
  categoryId?: string;
  supplierId?: string;
  limit?: number;
}

export interface AssetServiceError {
  code: string;
  message: string;
}

/**
 * Lista assets de uma organização
 */
export async function listAssetsByOrg(
  orgId: string, 
  opts: ListAssetsOptions = {}
): Promise<{ data: Asset[] | null; error: AssetServiceError | null }> {
  try {
    const { q, status = 'all', categoryId, supplierId, limit = 100 } = opts;
    
    let query = supabase
      .from('assets')
      .select(`
        id, orgId, name, code, description, categoryId, supplierId, status, 
        location, acquisitionAt, acquisitionVal, createdAt, updatedAt,
        supplier:suppliers(name),
        category:categories(name)
      `)
      .eq('orgId', orgId)
      .order('createdAt', { ascending: false })
      .limit(limit);

    // Filtrar por status
    if (status !== 'all') {
      const dbStatus = mapUiToDbStatus(status);
      query = query.eq('status', dbStatus);
    }

    // Filtrar por busca (nome, descrição, código)
    if (q) {
      query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%,code.ilike.%${q}%`);
    }

    // Filtrar por categoria
    if (categoryId) {
      query = query.eq('categoryId', categoryId);
    }

    // Filtrar por fornecedor
    if (supplierId) {
      query = query.eq('supplierId', supplierId);
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

    // Mapear status do DB para UI e adicionar campo category
    const mappedData = data?.map(asset => ({
      ...asset,
      status: mapDbToUiStatus(asset.status as DbAssetStatus),
      category: asset.category?.name || 'Sem categoria'
    })) || [];

    return { data: mappedData, error: null };
  } catch (error) {
    return { 
      data: null, 
      error: { 
        code: 'UNKNOWN_ERROR', 
        message: 'Erro inesperado ao listar patrimônio' 
      } 
    };
  }
}

/**
 * Cria um novo asset
 */
export async function createAsset(
  input: CreateAssetInput
): Promise<{ data: Asset | null; error: AssetServiceError | null }> {
  try {
    const payload = {
      orgId: input.orgId,
      name: input.name,
      description: input.description,
      categoryId: input.categoryId ?? null,
      location: input.location ?? null,
      supplierId: input.supplierId ?? null,
      status: mapUiToDbStatus(input.status),
      acquisitionAt: input.acquisitionAt,
      acquisitionVal: input.acquisitionVal
    };

    const { data, error } = await supabase
      .from('assets')
      .insert([payload])
      .select(`
        id, orgId, name, code, description, categoryId, supplierId, status, 
        location, acquisitionAt, acquisitionVal, createdAt, updatedAt,
        supplier:suppliers(name),
        category:categories(name)
      `)
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

    // Mapear status do DB para UI e adicionar campo category
    const mappedData = {
      ...data,
      status: mapDbToUiStatus(data.status as DbAssetStatus),
      category: data.category?.name || 'Sem categoria'
    };

    return { data: mappedData, error: null };
  } catch (error) {
    return { 
      data: null, 
      error: {
        code: 'UNKNOWN_ERROR', 
        message: 'Erro inesperado ao criar patrimônio' 
      }
    };
  }
}

/**
 * Atualiza um asset existente
 */
export async function updateAsset(
  input: UpdateAssetInput
): Promise<{ data: Asset | null; error: AssetServiceError | null }> {
  try {
    const { id, orgId, ...updateData } = input;
    
    // Mapear campos para o formato do banco
    const payload: any = {};
    if (updateData.description !== undefined) {
      payload.name = updateData.description; // Usar description como name
      payload.description = updateData.description;
    }
    if (updateData.categoryId !== undefined) payload.categoryId = updateData.categoryId;
    if (updateData.location !== undefined) payload.location = updateData.location;
    if (updateData.supplierId !== undefined) payload.supplierId = updateData.supplierId;
    if (updateData.status !== undefined) payload.status = mapUiToDbStatus(updateData.status);
    if (updateData.acquisitionAt !== undefined) payload.acquisitionAt = updateData.acquisitionAt;
    if (updateData.acquisitionVal !== undefined) payload.acquisitionVal = updateData.acquisitionVal;
    
    const { data, error } = await supabase
      .from('assets')
      .update(payload)
      .eq('id', id)
      .eq('orgId', orgId)
      .select(`
        id, orgId, name, code, description, categoryId, supplierId, status, 
        location, acquisitionAt, acquisitionVal, createdAt, updatedAt,
        supplier:suppliers(name),
        category:categories(name)
      `)
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

    // Mapear status do DB para UI e adicionar campo category
    const mappedData = {
      ...data,
      status: mapDbToUiStatus(data.status as DbAssetStatus),
      category: data.category?.name || 'Sem categoria'
    };

    return { data: mappedData, error: null };
  } catch (error) {
    return { 
      data: null, 
      error: { 
        code: 'UNKNOWN_ERROR', 
        message: 'Erro inesperado ao atualizar patrimônio' 
      } 
    };
  }
}

/**
 * Remove um asset (delete real)
 */
export async function deleteAsset(
  id: string, 
  orgId: string
): Promise<{ data: boolean; error: AssetServiceError | null }> {
  try {
    const { error } = await supabase
      .from('assets')
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
        message: 'Erro inesperado ao remover patrimônio' 
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
      return 'Patrimônio com esse código já existe nesta organização.';
    case '23503': // Foreign key constraint violation
      return 'Organização, categoria ou fornecedor inválido para este cadastro.';
    case 'PGRST116': // Row not found
      return 'Patrimônio não encontrado.';
    case '42501': // Insufficient privileges
      return 'Você não tem permissão para realizar esta operação.';
    default:
      return error.message || 'Não foi possível salvar o patrimônio. Tente novamente.';
  }
}