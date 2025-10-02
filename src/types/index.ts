export interface Asset {
  id: string;
  name: string;
  code?: string | null;
  description?: string;
  category: string;
  location: string;
  supplierId?: string;
  status: 'in_use' | 'in_storage' | 'in_maintenance' | 'disposed';
  acquisitionAt?: string;
  acquisitionVal?: number | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CostCenter {
  id: string;
  name: string;
  type: 'ministry' | 'event' | 'group';
  ministryId?: string | null;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  orgId: string;
  type: 'PF' | 'PJ';
  name: string;
  email?: string;
  phone?: string;
  taxId?: string; // CPF/CNPJ
  bankInfo?: string; // dados bancários (mínimos; cuidado LGPD)
  address?: string;
  category?: string; // livre/curta; para filtros simples
  status: boolean; // ativo/inativo
  createdAt: string;
  updatedAt: string;
}

export interface Member {
  id: string;
  name: string;
  profilePictureUrl?: string;
  birthDate: string;
  gender: 'Masculino' | 'Feminino' | 'Outro';
  maritalStatus: 'Solteiro(a)' | 'Casado(a)' | 'Divorciado(a)' | 'Viúvo(a)';
  phone?: string;
  email?: string;
  address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  membershipDate: string;
  baptismDate?: string;
  status: 'ativo' | 'inativo' | 'visitante';
  ministries?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  type: 'payable' | 'receivable';
  description: string;
  amount: number;
  dueDate: string;
  issueDate: string;
  status: 'open' | 'paid' | 'overdue';
  categoryId?: string | null; // FK para Category
  costCenterId: string; // Now mandatory
  supplierId?: string | null; // A Pagar - FK para Supplier
  memberId?: string | null; // A Receber - FK para Member
  paymentDate?: string;
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface ReportFilters {
  startDate: string;
  endDate: string;
  type: 'all' | 'payable' | 'receivable';
  status: 'all' | 'open' | 'paid' | 'overdue';
  category: string;
  costCenterId: string;
  reportBasis: 'accrual' | 'cash';
}

export interface ReportData {
  totalPayable: number;
  totalReceivable: number;
  totalPaid: number;
  totalOpen: number;
  documents: Document[];
}

export interface Category {
  id: string;
  orgId: string;
  name: string;
  scope: 'FINANCE' | 'SUPPLIER' | 'ASSET';
  financeKind: 'INCOME' | 'EXPENSE' | null;
  createdAt: string;
  updatedAt: string;
}
