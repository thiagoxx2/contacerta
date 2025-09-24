import { Member } from '../types';
import { MemberRow, MemberCreateInput } from '../services/members';

/**
 * Converts UI form data to database format
 * Maps UI fields to database schema, handling type conversions
 */
export function uiToDb(input: {
  name: string;
  email?: string;
  phone?: string;
  birthDate: string; // yyyy-mm-dd format
  status: 'ativo' | 'inativo' | 'visitante';
  ministries: string[];
  address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  notes?: string;
  orgId: string;
}): MemberCreateInput {
  // Convert birthDate from yyyy-mm-dd to ISO timestamp at midnight UTC
  const birthDateISO = input.birthDate ? `${input.birthDate}T00:00:00.000Z` : null;

  // Map status from UI to database enum
  const statusMap = {
    'ativo': 'ACTIVE' as const,
    'inativo': 'INACTIVE' as const,
    'visitante': 'VISITOR' as const
  };

  // Concatenate address fields into a single string for now
  // TODO: In future, we'll extend the schema to store structured address
  let addressString: string | null = null;
  if (input.address) {
    const { street, number, complement, neighborhood, city, state, zipCode } = input.address;
    const parts = [street, number, complement, neighborhood, city, state, zipCode].filter(Boolean);
    addressString = parts.join(', ');
  }

  return {
    orgId: input.orgId,
    fullName: input.name,
    birthDate: birthDateISO,
    email: input.email || null,
    phone: input.phone || null,
    address: addressString,
    ministries: input.ministries,
    status: statusMap[input.status],
    // Note: Fields not yet persisted in DB schema:
    // - gender, maritalStatus, baptismDate, membershipDate (structured)
    // - profilePictureUrl, notes (will be added in future schema extension)
  };
}

/**
 * Converts database row to UI Member format
 * Maps database fields back to UI expectations
 */
export function dbToUi(row: MemberRow): Member {
  // Convert birthDate from ISO to yyyy-mm-dd for UI
  const birthDateUI = row.birthDate ? row.birthDate.split('T')[0] : '';

  // Map status from database enum to UI
  const statusMap = {
    'ACTIVE': 'ativo' as const,
    'INACTIVE': 'inativo' as const,
    'VISITOR': 'visitante' as const
  };

  // Generate fallback profile picture URL using ui-avatars
  const profilePictureUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(row.fullName)}&background=random`;

  // Parse address string back to structured format (basic parsing)
  // TODO: In future, we'll store structured address in DB
  let address: Member['address'] | undefined;
  if (row.address) {
    // Simple parsing - in future we'll have proper structured storage
    const parts = row.address.split(', ');
    if (parts.length >= 2) {
      address = {
        street: parts[0] || '',
        number: parts[1] || '',
        complement: parts[2] || undefined,
        neighborhood: parts[3] || '',
        city: parts[4] || '',
        state: parts[5] || '',
        zipCode: parts[6] || ''
      };
    }
  }

  return {
    id: row.id,
    name: row.fullName,
    profilePictureUrl,
    birthDate: birthDateUI,
    gender: 'Masculino', // Default value - not yet stored in DB
    maritalStatus: 'Solteiro(a)', // Default value - not yet stored in DB
    phone: row.phone || undefined,
    email: row.email || undefined,
    address,
    membershipDate: row.createdAt.split('T')[0], // Use createdAt as membership date
    baptismDate: undefined, // Not yet stored in DB
    status: statusMap[row.status],
    ministries: row.ministries,
    notes: undefined, // Not yet stored in DB
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}
