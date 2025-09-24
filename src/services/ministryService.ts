import { supabase } from '../lib/supabaseClient';
import { Ministry } from '../types/ministry';

export const listMinistriesByOrg = async (orgId: string): Promise<Ministry[]> => {
  if (!orgId) {
    console.error('Organization ID is required to list ministries.');
    return [];
  }

  const { data, error } = await supabase
    .from('ministries')
    .select('id, orgId, name, description, active')
    .eq('orgId', orgId)
    .eq('active', true)
    .order('name');

  if (error) {
    console.error('Error fetching ministries:', error);
    throw new Error(`Failed to fetch ministries: ${error.message}`);
  }

  return data || [];
};

type ListParams = {
  search?: string;
  active?: 'all' | 'true' | 'false';
};

export const listMinistries = async (
  orgId: string,
  params: ListParams = {}
): Promise<Ministry[]> => {
  if (!orgId) return [];

  let query = supabase
    .from('ministries')
    .select('id, orgId, name, description, active')
    .eq('orgId', orgId)
    .order('name');

  if (params.active && params.active !== 'all') {
    query = query.eq('active', params.active === 'true');
  }

  if (params.search && params.search.trim()) {
    // Use ilike for case-insensitive contains
    query = query.ilike('name', `%${params.search.trim()}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching ministries:', error);
    throw new Error('Não foi possível carregar os ministérios.');
  }
  return data || [];
};

export const createMinistry = async (
  orgId: string,
  payload: Pick<Ministry, 'name' | 'description' | 'active'>
): Promise<Ministry> => {
  if (!orgId) throw new Error('Organização inválida.');
  const insertPayload = {
    orgId,
    name: payload.name,
    description: payload.description ?? null,
    active: payload.active ?? true,
  };
  const { data, error } = await supabase
    .from('ministries')
    .insert(insertPayload)
    .select('id, orgId, name, description, active')
    .single();
  if (error) {
    console.error('Error creating ministry:', error);
    throw new Error('Não foi possível criar o ministério.');
  }
  return data as Ministry;
};

export const updateMinistry = async (
  id: string,
  orgId: string,
  payload: Partial<Pick<Ministry, 'name' | 'description' | 'active'>>
): Promise<void> => {
  if (!id || !orgId) throw new Error('Dados inválidos.');
  const updates: Record<string, unknown> = {};
  if (payload.name !== undefined) updates.name = payload.name;
  if (payload.description !== undefined) updates.description = payload.description;
  if (payload.active !== undefined) updates.active = payload.active;

  const { error } = await supabase
    .from('ministries')
    .update(updates)
    .eq('id', id)
    .eq('orgId', orgId);
  if (error) {
    console.error('Error updating ministry:', error);
    throw new Error('Não foi possível atualizar o ministério.');
  }
};

export const deleteMinistry = async (id: string, orgId: string): Promise<void> => {
  if (!id || !orgId) throw new Error('Dados inválidos.');
  const { error } = await supabase
    .from('ministries')
    .delete()
    .eq('id', id)
    .eq('orgId', orgId);
  if (error) {
    console.error('Error deleting ministry:', error);
    throw new Error('Não foi possível excluir o ministério.');
  }
};