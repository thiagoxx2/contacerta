import { supabase } from '../lib/supabaseClient';

type UiMemberStatus = 'ativo' | 'inativo' | 'visitante';
type DbMemberStatus = 'ACTIVE' | 'INACTIVE' | 'VISITOR';

function mapUiToDbStatus(s: UiMemberStatus): DbMemberStatus {
  if (s === 'ativo') return 'ACTIVE';
  if (s === 'inativo') return 'INACTIVE';
  return 'VISITOR';
}

export async function createMember(input: {
  orgId: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  birthDate: string;          // yyyy-mm-dd
  status: UiMemberStatus;
}) {
  const payload = {
    orgId: input.orgId,
    fullName: input.fullName,
    email: input.email ?? null,
    phone: input.phone ?? null,
    birthDate: input.birthDate,
    status: mapUiToDbStatus(input.status),
  };

  const { data, error } = await supabase
    .from('members')
    .insert([payload])
    .select('id, orgId, fullName, status, createdAt, updatedAt')
    .single();

  return { data, error };
}

export async function updateMember(id: string, orgId: string, input: Partial<{
  fullName: string;
  email: string | null;
  phone: string | null;
  birthDate: string;
  status: UiMemberStatus;
}>) {
  const patch: any = {};
  if (input.fullName !== undefined) patch.fullName = input.fullName;
  if (input.email !== undefined) patch.email = input.email ?? null;
  if (input.phone !== undefined) patch.phone = input.phone ?? null;
  if (input.birthDate !== undefined) patch.birthDate = input.birthDate;
  if (input.status !== undefined) {
    patch.status = mapUiToDbStatus(input.status);
  }

  const { data, error } = await supabase
    .from('members')
    .update(patch)
    .eq('id', id)
    .eq('orgId', orgId)
    .select('id, orgId, fullName, status, createdAt, updatedAt')
    .single();

  return { data, error };
}

export async function listMembersByOrg(orgId: string, q = '', limit = 50) {
  let query = supabase
    .from('members')
    .select('id, fullName, status')
    .eq('orgId', orgId)
    .eq('status', 'ACTIVE')
    .order('fullName', { ascending: true })
    .limit(limit);

  if (q) query = query.ilike('fullName', `%${q}%`);

  const { data, error } = await query;
  if (error) return { data: null, error };

  const mapped = (data ?? []).map(m => ({ id: m.id, name: m.fullName }));
  return { data: mapped, error: null };
}
