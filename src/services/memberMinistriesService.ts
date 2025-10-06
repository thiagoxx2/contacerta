import { supabase } from '../lib/supabaseClient';

/**
 * Lista os IDs dos ministérios vinculados a um membro específico
 */
export const listMinistryIdsByMember = async (
  memberId: string, 
  orgId: string
): Promise<string[]> => {
  if (!memberId || !orgId) {
    console.error('Member ID and Organization ID are required.');
    return [];
  }

  const { data, error } = await supabase
    .from('member_ministries')
    .select('ministryId')
    .eq('memberId', memberId)
    .eq('orgId', orgId);

  if (error) {
    console.error('Error fetching member ministries:', error);
    throw new Error(`Failed to fetch member ministries: ${error.message}`);
  }

  return data?.map(item => item.ministryId) || [];
};

/**
 * Define os vínculos entre um membro e seus ministérios usando estratégia "replace set"
 * Remove todos os vínculos existentes e insere os novos
 */
export const setMemberMinistries = async (
  memberId: string,
  orgId: string,
  ministryIds: string[],
  role?: string
): Promise<void> => {
  if (!memberId || !orgId) {
    throw new Error('Member ID and Organization ID are required.');
  }

  // 1) Remove vínculos antigos
  const { error: delError } = await supabase
    .from('member_ministries')
    .delete()
    .eq('orgId', orgId)
    .eq('memberId', memberId);

  if (delError) {
    console.error('Error deleting previous member ministries:', delError);
    throw new Error(`Failed to delete member ministries: ${delError.message}`);
  }

  // 2) Se não há vínculos novos, encerra
  if (!ministryIds || ministryIds.length === 0) {
    return;
  }

  // 3) Deduplicar ministryIds para evitar duplicidades
  const uniqueIds = Array.from(new Set(ministryIds));

  // 4) Bulk insert SEM id/createdAt/updatedAt
  const rows = uniqueIds.map((ministryId) => ({
    orgId,
    memberId,
    ministryId,
    ...(role ? { role } : {}), // opcional
  }));

  const { error: insError } = await supabase
    .from('member_ministries')
    .insert(rows, { returning: 'minimal' }); // não precisa retornar dados

  if (insError) {
    console.error('Error inserting member ministries:', insError);
    throw new Error(`Failed to insert member ministries: ${insError.message}`);
  }
};

/**
 * Adiciona um vínculo específico entre membro e ministério
 */
export const addMemberMinistry = async (
  memberId: string,
  orgId: string,
  ministryId: string
): Promise<void> => {
  if (!memberId || !orgId || !ministryId) {
    throw new Error('Member ID, Organization ID and Ministry ID are required.');
  }

  const { error } = await supabase
    .from('member_ministries')
    .insert({
      orgId,
      memberId,
      ministryId,
    });

  if (error) {
    console.error('Error adding member ministry:', error);
    throw new Error(`Failed to add member ministry: ${error.message}`);
  }
};

/**
 * Remove um vínculo específico entre membro e ministério
 */
export const removeMemberMinistry = async (
  memberId: string,
  orgId: string,
  ministryId: string
): Promise<void> => {
  if (!memberId || !orgId || !ministryId) {
    throw new Error('Member ID, Organization ID and Ministry ID are required.');
  }

  const { error } = await supabase
    .from('member_ministries')
    .delete()
    .eq('memberId', memberId)
    .eq('orgId', orgId)
    .eq('ministryId', ministryId);

  if (error) {
    console.error('Error removing member ministry:', error);
    throw new Error(`Failed to remove member ministry: ${error.message}`);
  }
};
