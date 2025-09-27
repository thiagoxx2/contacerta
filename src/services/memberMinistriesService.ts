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
  ministryIds: string[]
): Promise<void> => {
  if (!memberId || !orgId) {
    throw new Error('Member ID and Organization ID are required.');
  }

  try {
    // 1. Remover todos os vínculos existentes para este membro nesta organização
    const { error: deleteError } = await supabase
      .from('member_ministries')
      .delete()
      .eq('memberId', memberId)
      .eq('orgId', orgId);

    if (deleteError) {
      console.error('Error deleting existing member ministries:', deleteError);
      throw new Error(`Failed to delete existing member ministries: ${deleteError.message}`);
    }

    // 2. Se há ministérios para inserir, fazer inserção em massa
    if (ministryIds.length > 0) {
      const insertData = ministryIds.map(ministryId => ({
        orgId,
        memberId,
        ministryId,
      }));

      const { error: insertError } = await supabase
        .from('member_ministries')
        .insert(insertData);

      if (insertError) {
        console.error('Error inserting member ministries:', insertError);
        throw new Error(`Failed to insert member ministries: ${insertError.message}`);
      }
    }
  } catch (error) {
    console.error('Error in setMemberMinistries:', error);
    throw error;
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
