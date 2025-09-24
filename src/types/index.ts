export interface Asset {
  id: string;
  name: string;
  code: string;
  description?: string;
  purchaseDate: string;
  purchaseValue: number;
  currentValue?: number;
  status: 'in_use' | 'in_storage' | 'in_maintenance' | 'disposed';
  location: string;
  category: string;
  supplierId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CostCenter {
  id: string;
  name: string;
  type: 'ministry' | 'event' | 'group';
  status: 'active' | 'inactive';
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  cnpj?: string;
  cpf?: string;
  email?: string;
  phone?: string;
  address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  bankInfo?: {
    bank: string;
    agency: string;
    account: string;
    accountType: 'corrente' | 'poupanca';
  };
  category: string;
  status: 'active' | 'inactive';
  notes?: string;
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
  category: string;
  costCenterId: string; // Now mandatory
  supplierId?: string;
  memberId?: string;
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
