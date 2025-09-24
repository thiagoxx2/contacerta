import { supabase } from '../lib/supabaseClient';

export type MemberRow = {
  id: string;
  orgId: string;
  fullName: string;
  birthDate: string | null;   // ISO
  email: string | null;
  phone: string | null;
  address: string | null;     // por ora, concatenar endereço ou manter null
  ministries: string[];       // array de strings
  status: 'ACTIVE' | 'INACTIVE' | 'VISITOR';
  createdAt: string;          // ISO
  updatedAt: string;          // ISO
};

export type MemberCreateInput = Omit<MemberRow, 'id' | 'createdAt' | 'updatedAt'>;
export type MemberUpdateInput = Partial<Omit<MemberRow, 'id' | 'orgId' | 'createdAt' | 'updatedAt'>>;

export async function listMembers(orgId: string, opts?: { search?: string; status?: 'all'|'ativo'|'inativo'|'visitante' }) {
  try {
    let query = supabase
      .from('members')
      .select('*')
      .eq('orgId', orgId);

    // Apply status filter
    if (opts?.status && opts.status !== 'all') {
      const statusMap = {
        'ativo': 'ACTIVE',
        'inativo': 'INACTIVE', 
        'visitante': 'VISITOR'
      } as const;
      query = query.eq('status', statusMap[opts.status]);
    }

    // Apply search filter
    if (opts?.search) {
      const searchTerm = `%${opts.search}%`;
      query = query.or(`fullName.ilike.${searchTerm},email.ilike.${searchTerm}`);
    }

    const { data, error } = await query.order('fullName', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: error instanceof Error ? error.message : 'Erro ao carregar membros' };
  }
}

export async function getMemberById(id: string) {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Erro ao carregar membro' };
  }
}

export async function createMember(input: MemberCreateInput) {
  try {
    const { data, error } = await supabase
      .from('members')
      .insert([input])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Erro ao criar membro' };
  }
}

export async function updateMember(id: string, input: MemberUpdateInput) {
  try {
    const { data, error } = await supabase
      .from('members')
      .update({ ...input, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Erro ao atualizar membro' };
  }
}

export async function deleteMember(id: string) {
  try {
    const { error } = await supabase
      .from('members')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }

    return { data: true, error: null };
  } catch (error) {
    return { data: false, error: error instanceof Error ? error.message : 'Erro ao excluir membro' };
  }
}
