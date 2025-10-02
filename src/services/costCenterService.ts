import { supabase } from '../lib/supabaseClient';

export type DBCostCenterType = 'MINISTRY' | 'EVENT' | 'GROUP';
export type UICostCenterType = 'ministry' | 'event' | 'group';

// Mapeamento de tipos UI → DB
export const mapUITypeToDB = (uiType: UICostCenterType): DBCostCenterType => {
  switch (uiType) {
    case 'ministry': return 'MINISTRY';
    case 'event': return 'EVENT';
    case 'group': return 'GROUP';
    default: throw new Error(`Tipo inválido: ${uiType}`);
  }
};

// Mapeamento de tipos DB → UI
export const mapDBTypeToUI = (dbType: DBCostCenterType): UICostCenterType => {
  switch (dbType) {
    case 'MINISTRY': return 'ministry';
    case 'EVENT': return 'event';
    case 'GROUP': return 'group';
    default: throw new Error(`Tipo inválido: ${dbType}`);
  }
};

export type CreateCostCenterInput = {
  orgId: string;
  type: DBCostCenterType;
  name: string;
  ministryId?: string | null;
};

export type UpdateCostCenterInput = Partial<CreateCostCenterInput> & {
  id: string;
  orgId: string;
};

export type DBCostCenter = {
  id: string;
  orgId: string;
  type: DBCostCenterType;
  name: string;
  ministryId?: string | null;
  createdAt: string;
  updatedAt: string;
};

// Tratamento de erros do Supabase
const handleSupabaseError = (error: any): string => {
  const code = error?.code;
  const message = error?.message || 'Erro desconhecido';

  switch (code) {
    case '23502': // NOT NULL
      return 'Dados obrigatórios ausentes (verifique Nome/Ministério/Org).';
    case '23503': // FK
      return 'Referência inválida (verifique o Ministério selecionado).';
    case '23505': // UNIQUE ministryId
      return 'Já existe um Centro de Custo para este Ministério nesta organização.';
    case '23514': // CHECK constraint
      return 'Para tipo Ministério, selecione um Ministério.';
    default:
      return `Erro ao processar solicitação: ${message}`;
  }
};

export interface ListCostCentersOptions {
  q?: string;
  type?: 'all' | 'ministry' | 'event' | 'group';
}

export const listCostCentersByOrg = async (
  orgId: string, 
  opts: ListCostCentersOptions = {}
): Promise<DBCostCenter[]> => {
  if (!orgId) {
    console.error('Organization ID is required to list cost centers.');
    return [];
  }

  try {
    const { q, type = 'all' } = opts;
    
    let query = supabase
      .from('cost_centers')
      .select('id, orgId, type, name, ministryId, createdAt, updatedAt')
      .eq('orgId', orgId)
      .order('name');

    // Filtrar por tipo
    if (type !== 'all') {
      const dbType = mapUITypeToDB(type);
      query = query.eq('type', dbType);
    }

    // Filtrar por busca (nome)
    if (q) {
      query = query.ilike('name', `%${q}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching cost centers:', error);
      throw new Error(handleSupabaseError(error));
    }

    return data || [];
  } catch (error) {
    console.error('Error in listCostCentersByOrg:', error);
    throw error;
  }
};

export const createCostCenter = async (input: CreateCostCenterInput): Promise<DBCostCenter> => {
  // Validações obrigatórias
  if (!input.orgId) {
    throw new Error('Organização é obrigatória');
  }

  if (!input.name?.trim()) {
    throw new Error('Nome é obrigatório');
  }

  if (input.type === 'MINISTRY' && !input.ministryId) {
    throw new Error('Para tipo Ministério, selecione um Ministério');
  }

  try {
    // Preparar payload com apenas campos do BD (id, createdAt, updatedAt são gerados automaticamente)
    const payload = {
      orgId: input.orgId,
      type: input.type,
      name: input.name.trim(),
      ministryId: input.type === 'MINISTRY' ? input.ministryId : null,
    };

    const { data, error } = await supabase
      .from('cost_centers')
      .insert(payload)
      .select('id, orgId, type, name, ministryId, createdAt, updatedAt')
      .single();

    if (error) {
      console.error('Error creating cost center:', error);
      throw new Error(handleSupabaseError(error));
    }

    return data;
  } catch (error) {
    console.error('Error in createCostCenter:', error);
    throw error;
  }
};

export const updateCostCenter = async (input: UpdateCostCenterInput): Promise<DBCostCenter> => {
  // Validações obrigatórias
  if (!input.id || !input.orgId) {
    throw new Error('ID e Organização são obrigatórios');
  }

  // Validações de negócio
  if (input.type === 'MINISTRY' && !input.ministryId) {
    throw new Error('Para tipo Ministério, selecione um Ministério');
  }

  if (input.name !== undefined && !input.name?.trim()) {
    throw new Error('Nome é obrigatório');
  }

  try {
    // Preparar dados de atualização
    const updateData: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (input.type !== undefined) {
      updateData.type = input.type;
      // Ajustar ministryId baseado no tipo
      updateData.ministryId = input.type === 'MINISTRY' ? input.ministryId : null;
    }

    if (input.name !== undefined) {
      updateData.name = input.name.trim();
    }

    if (input.ministryId !== undefined) {
      updateData.ministryId = input.type === 'MINISTRY' ? input.ministryId : null;
    }

    const { data, error } = await supabase
      .from('cost_centers')
      .update(updateData)
      .eq('id', input.id)
      .eq('orgId', input.orgId)
      .select('id, orgId, type, name, ministryId, createdAt, updatedAt')
      .single();

    if (error) {
      console.error('Error updating cost center:', error);
      throw new Error(handleSupabaseError(error));
    }

    return data;
  } catch (error) {
    console.error('Error in updateCostCenter:', error);
    throw error;
  }
};

export const getCostCenterById = async (id: string, orgId: string): Promise<DBCostCenter | null> => {
  if (!id || !orgId) {
    throw new Error('ID e Organização são obrigatórios');
  }

  try {
    const { data, error } = await supabase
      .from('cost_centers')
      .select('id, orgId, type, name, ministryId, createdAt, updatedAt')
      .eq('id', id)
      .eq('orgId', orgId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Não encontrado
      }
      console.error('Error fetching cost center:', error);
      throw new Error(handleSupabaseError(error));
    }

    return data;
  } catch (error) {
    console.error('Error in getCostCenterById:', error);
    throw error;
  }
};

export const deleteCostCenter = async (id: string, orgId: string): Promise<void> => {
  if (!id || !orgId) {
    throw new Error('ID e Organização são obrigatórios');
  }

  try {
    const { error } = await supabase
      .from('cost_centers')
      .delete()
      .eq('id', id)
      .eq('orgId', orgId);

    if (error) {
      console.error('Error deleting cost center:', error);
      throw new Error(handleSupabaseError(error));
    }
  } catch (error) {
    console.error('Error in deleteCostCenter:', error);
    throw error;
  }
};
