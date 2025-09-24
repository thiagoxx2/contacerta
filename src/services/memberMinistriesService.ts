import { supabase } from '../lib/supabaseClient';

export const listMinistriesByMember = async (
  orgId: string,
  memberId: string
): Promise<string[]> => {
  if (!orgId || !memberId) return [];

  const { data, error } = await supabase
    .from('member_ministries')
    .select('ministryId')
    .eq('orgId', orgId)
    .eq('memberId', memberId);

  if (error) {
    console.error('Error fetching member ministries:', error);
    return [];
  }

  return data.map((row) => row.ministryId);
};

export const replaceMemberMinistries = async (
  orgId: string,
  memberId: string,
  newMinistryIds: string[]
): Promise<void> => {
  if (!orgId || !memberId) return;

  const { data: currentMinistries, error: fetchError } = await supabase
    .from('member_ministries')
    .select('ministryId')
    .eq('orgId', orgId)
    .eq('memberId', memberId);

  if (fetchError) {
    console.error('Error fetching current member ministries:', fetchError);
    throw new Error('Failed to update ministries.');
  }

  const currentMinistryIds = currentMinistries.map((m) => m.ministryId);

  const toInsert = newMinistryIds
    .filter((id) => !currentMinistryIds.includes(id))
    .map((ministryId) => ({ orgId, memberId, ministryId }));

  const toDelete = currentMinistryIds.filter(
    (id) => !newMinistryIds.includes(id)
  );

  if (toInsert.length > 0) {
    const { error: insertError } = await supabase
      .from('member_ministries')
      .insert(toInsert);
    if (insertError) {
      console.error('Error inserting new member ministries:', insertError);
      throw new Error('Failed to add new ministries.');
    }
  }

  if (toDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from('member_ministries')
      .delete()
      .eq('memberId', memberId)
      .eq('orgId', orgId)
      .in('ministryId', toDelete);
    if (deleteError) {
      console.error('Error deleting old member ministries:', deleteError);
      throw new Error('Failed to remove old ministries.');
    }
  }
};