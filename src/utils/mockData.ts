import { faker } from '@faker-js/faker';
import { Member, Supplier, Document, CostCenter, Asset } from '../types';
import { format, subDays, addDays } from 'date-fns';

export function generateMockAssets(suppliers: Supplier[]): Asset[] {
  const assets: Asset[] = [];
  const categories = ['Mobiliário', 'Eletrônicos', 'Instrumentos Musicais', 'Decoração', 'Utensílios de Cozinha'];
  const locations = ['Salão Principal', 'Sala das Crianças', 'Cozinha', 'Escritório', 'Depósito'];
  const statuses = ['in_use', 'in_storage', 'in_maintenance', 'disposed'] as const;

  for (let i = 0; i < 40; i++) {
    const purchaseValue = parseFloat(faker.finance.amount({ min: 50, max: 3000 }));
    const asset: Asset = {
      id: faker.string.uuid(),
      name: faker.commerce.productName(),
      code: `PAT-${faker.string.numeric(5)}`,
      description: faker.lorem.sentence(),
      purchaseDate: format(faker.date.past({ years: 5 }), 'yyyy-MM-dd'),
      purchaseValue: purchaseValue,
      currentValue: purchaseValue * faker.number.float({ min: 0.5, max: 0.9 }),
      status: faker.helpers.arrayElement(statuses),
      location: faker.helpers.arrayElement(locations),
      category: faker.helpers.arrayElement(categories),
      supplierId: suppliers.length > 0 ? faker.helpers.arrayElement(suppliers).id : undefined,
      createdAt: format(faker.date.recent({ days: 365 }), 'yyyy-MM-dd'),
      updatedAt: format(faker.date.recent({ days: 90 }), 'yyyy-MM-dd'),
    };
    assets.push(asset);
  }
  return assets;
}

export function generateMockCostCenters(): CostCenter[] {
  const costCenters: CostCenter[] = [
    { id: 'geral', name: 'Administrativo Geral', type: 'ministry', ministryId: 'ministry-1', description: 'Despesas e receitas gerais da igreja.', createdAt: format(new Date(), 'yyyy-MM-dd'), updatedAt: format(new Date(), 'yyyy-MM-dd') },
    { id: faker.string.uuid(), name: 'Ministério Infantil', type: 'ministry', ministryId: 'ministry-2', description: 'Atividades e materiais para crianças.', createdAt: format(new Date(), 'yyyy-MM-dd'), updatedAt: format(new Date(), 'yyyy-MM-dd') },
    { id: faker.string.uuid(), name: 'Grupo de Louvor', type: 'group', description: 'Equipamentos e despesas do louvor.', createdAt: format(new Date(), 'yyyy-MM-dd'), updatedAt: format(new Date(), 'yyyy-MM-dd') },
    { id: faker.string.uuid(), name: 'Ação Social', type: 'ministry', ministryId: 'ministry-3', description: 'Projetos e doações para a comunidade.', createdAt: format(new Date(), 'yyyy-MM-dd'), updatedAt: format(new Date(), 'yyyy-MM-dd') },
    { id: faker.string.uuid(), name: 'Festa Junina 2025', type: 'event', description: 'Evento anual da comunidade.', createdAt: format(new Date(), 'yyyy-MM-dd'), updatedAt: format(new Date(), 'yyyy-MM-dd') },
    { id: faker.string.uuid(), name: 'Retiro de Casais', type: 'event', description: 'Evento concluído no último ano.', createdAt: format(new Date(), 'yyyy-MM-dd'), updatedAt: format(new Date(), 'yyyy-MM-dd') },
  ];
  return costCenters;
}

export function generateMockSuppliers(): Supplier[] {
  const suppliers: Supplier[] = [];
  
  for (let i = 0; i < 25; i++) {
    const isCompany = faker.datatype.boolean({ probability: 0.7 });
    
    const supplier: Supplier = {
      id: faker.string.uuid(),
      name: isCompany ? faker.company.name() : faker.person.fullName(),
      cnpj: isCompany ? faker.string.numeric(14) : undefined,
      cpf: !isCompany ? faker.string.numeric(11) : undefined,
      email: faker.internet.email(),
      phone: faker.phone.number('(##) #####-####'),
      address: {
        street: faker.location.streetAddress(),
        number: faker.location.buildingNumber(),
        complement: faker.datatype.boolean({ probability: 0.3 }) ? faker.location.secondaryAddress() : undefined,
        neighborhood: faker.location.city(),
        city: faker.location.city(),
        state: faker.location.state({ abbreviated: true }),
        zipCode: faker.location.zipCode('#####-###'),
      },
      bankInfo: {
        bank: faker.helpers.arrayElement(['001 - Banco do Brasil', '237 - Bradesco', '341 - Itaú', '104 - Caixa']),
        agency: faker.string.numeric(4),
        account: faker.string.numeric(8),
        accountType: faker.helpers.arrayElement(['corrente', 'poupanca']),
      },
      category: faker.helpers.arrayElement(['Manutenção Predial', 'Material de Escritório', 'Serviços de Limpeza', 'Equipamentos de Som', 'Tecnologia']),
      status: faker.helpers.arrayElement(['active', 'inactive']),
      notes: faker.datatype.boolean({ probability: 0.4 }) ? faker.lorem.sentence() : undefined,
      createdAt: format(faker.date.recent({ days: 90 }), 'yyyy-MM-dd'),
      updatedAt: format(faker.date.recent({ days: 30 }), 'yyyy-MM-dd'),
    };
    
    suppliers.push(supplier);
  }
  
  return suppliers;
}

export function generateMockMembers(): Member[] {
  const members: Member[] = [];
  const ministries = ['Louvor', 'Mídia', 'Infantil', 'Ação Social', 'Recepção', 'Diaconato'];

  for (let i = 0; i < 50; i++) {
    const gender = faker.helpers.arrayElement(['Masculino', 'Feminino'] as const);
    const member: Member = {
      id: faker.string.uuid(),
      name: faker.person.fullName({ sex: gender.toLowerCase() as 'male' | 'female' }),
      profilePictureUrl: faker.image.avatar(),
      birthDate: format(faker.date.birthdate({ min: 18, max: 70, mode: 'age' }), 'yyyy-MM-dd'),
      gender: gender,
      maritalStatus: faker.helpers.arrayElement(['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)']),
      phone: faker.phone.number('(##) #####-####'),
      email: faker.internet.email(),
      address: {
        street: faker.location.streetAddress(),
        number: faker.location.buildingNumber(),
        neighborhood: faker.location.city(),
        city: faker.location.city(),
        state: faker.location.state({ abbreviated: true }),
        zipCode: faker.location.zipCode('#####-###'),
      },
      membershipDate: format(faker.date.past({ years: 10 }), 'yyyy-MM-dd'),
      baptismDate: faker.datatype.boolean({ probability: 0.8 }) ? format(faker.date.past({ years: 9 }), 'yyyy-MM-dd') : undefined,
      status: faker.helpers.arrayElement(['ativo', 'inativo', 'visitante']),
      ministries: faker.helpers.arrayElements(ministries, { min: 0, max: 3 }),
      notes: faker.datatype.boolean({ probability: 0.2 }) ? faker.lorem.paragraph() : undefined,
      createdAt: format(faker.date.recent({ days: 365 }), 'yyyy-MM-dd'),
      updatedAt: format(faker.date.recent({ days: 90 }), 'yyyy-MM-dd'),
    };
    members.push(member);
  }
  return members;
}

export function generateMockDocuments(suppliers: Supplier[], members: Member[], costCenters: CostCenter[]): Document[] {
  const documents: Document[] = [];
  const categoriesPayable = ['Aluguel', 'Energia', 'Água', 'Manutenção', 'Material de Consumo'];
  const categoriesReceivable = ['Dízimo', 'Oferta', 'Doação Especial', 'Venda de Cantina'];

  const activeCostCenters = costCenters.filter(cc => cc.status === 'active');
  if (activeCostCenters.length === 0) return []; // Cannot generate docs without cost centers

  for (let i = 0; i < 75; i++) {
    const isPayable = faker.datatype.boolean({ probability: 0.6 });
    const issueDate = faker.date.recent({ days: 90 });
    const dueDate = addDays(issueDate, faker.number.int({ min: 7, max: 60 }));
    const status = faker.helpers.arrayElement(['open', 'paid', 'overdue']);
    
    let paymentDate: string | undefined;
    if (status === 'paid') {
      paymentDate = format(faker.date.between({ from: issueDate, to: addDays(dueDate, 5) }), 'yyyy-MM-dd');
    }

    const doc: Document = {
      id: faker.string.uuid(),
      type: isPayable ? 'payable' : 'receivable',
      description: isPayable 
        ? `Pagamento ${faker.commerce.productName()}` 
        : `Recebimento ${faker.helpers.arrayElement(categoriesReceivable)}`,
      amount: parseFloat(faker.finance.amount({ min: 50, max: isPayable ? 5000 : 2000 })),
      issueDate: format(issueDate, 'yyyy-MM-dd'),
      dueDate: format(dueDate, 'yyyy-MM-dd'),
      status: status,
      category: isPayable 
        ? faker.helpers.arrayElement(categoriesPayable) 
        : faker.helpers.arrayElement(categoriesReceivable),
      costCenterId: faker.helpers.arrayElement(activeCostCenters).id,
      supplierId: isPayable && suppliers.length > 0 ? faker.helpers.arrayElement(suppliers).id : undefined,
      memberId: !isPayable && members.length > 0 ? faker.helpers.arrayElement(members).id : undefined,
      paymentDate: paymentDate,
      createdAt: format(issueDate, 'yyyy-MM-dd'),
      updatedAt: format(faker.date.recent({ days: 30 }), 'yyyy-MM-dd'),
    };
    documents.push(doc);
  }
  return documents;
}
