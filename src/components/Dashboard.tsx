import React from 'react';
import { useApp } from '../context/AppContext';
import { Users, UserCheck, UserX, UserPlus, Gift, TrendingDown, TrendingUp, DollarSign, Box, Archive } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePageTitle } from '../hooks/usePageTitle';
import { format, parseISO, getMonth, getDate, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const isThisMonth = (date: Date): boolean => {
  try {
    const now = new Date();
    return getMonth(date) === getMonth(now);
  } catch (error) {
    return false;
  }
};

export default function Dashboard() {
  usePageTitle('Dashboard | ContaCerta');
  const { state } = useApp();
  const { members = [], documents = [], costCenters = [], assets = [] } = state;

  const memberStats = React.useMemo(() => ({
    total: members.length,
    active: members.filter(m => m.status === 'ativo').length,
    inactive: members.filter(m => m.status === 'inativo').length,
    visitors: members.filter(m => m.status === 'visitante').length,
  }), [members]);

  const assetStats = React.useMemo(() => ({
    total: assets.length,
    totalValue: assets.reduce((sum, asset) => sum + asset.purchaseValue, 0),
  }), [assets]);

  const financialStats = React.useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const openPayable = documents
      .filter(d => d.type === 'payable' && d.status === 'open')
      .reduce((sum, d) => sum + d.amount, 0);
    
    const openReceivable = documents
      .filter(d => d.type === 'receivable' && d.status === 'open')
      .reduce((sum, d) => sum + d.amount, 0);

    const paidThisMonth = documents
      .filter(d => d.status === 'paid' && d.paymentDate && isWithinInterval(parseISO(d.paymentDate), { start: monthStart, end: monthEnd }))
      .reduce((sum, d) => sum + (d.type === 'receivable' ? d.amount : -d.amount), 0);

    return { openPayable, openReceivable, paidThisMonth };
  }, [documents]);

  const birthdays = React.useMemo(() => {
    return members
      .filter(member => {
        try {
          return isThisMonth(parseISO(member.birthDate));
        } catch (e) {
          return false;
        }
      })
      .sort((a, b) => getDate(parseISO(a.birthDate)) - getDate(parseISO(b.birthDate)));
  }, [members]);

  const costCenterBalances = React.useMemo(() => {
    return costCenters
      .map(cc => {
        const balance = documents
          .filter(doc => doc.costCenterId === cc.id && doc.status === 'paid')
          .reduce((acc, doc) => acc + (doc.type === 'receivable' ? doc.amount : -doc.amount), 0);
        return { ...cc, balance };
      })
      .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance))
      .slice(0, 5);
  }, [costCenters, documents]);

  const memberStatCards = [
    { title: 'Total de Membros', value: memberStats.total, icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { title: 'Membros Ativos', value: memberStats.active, icon: UserCheck, color: 'text-green-600', bgColor: 'bg-green-50' },
    { title: 'Membros Inativos', value: memberStats.inactive, icon: UserX, color: 'text-red-600', bgColor: 'bg-red-50' },
    { title: 'Visitantes', value: memberStats.visitors, icon: UserPlus, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
  ];

  const financialStatCards = [
    { title: 'Contas a Pagar (Aberto)', value: formatCurrency(financialStats.openPayable), icon: TrendingDown, color: 'text-red-600', bgColor: 'bg-red-50' },
    { title: 'Contas a Receber (Aberto)', value: formatCurrency(financialStats.openReceivable), icon: TrendingUp, color: 'text-green-600', bgColor: 'bg-green-50' },
    { title: 'Saldo do Mês (Realizado)', value: formatCurrency(financialStats.paidThisMonth), icon: DollarSign, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Visão geral da sua igreja e finanças</p>
      </div>

      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Resumo Financeiro</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {financialStatCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${card.bgColor}`}><card.icon className={`w-6 h-6 ${card.color}`} /></div>
                <div className="ml-4 min-w-0">
                  <p className="text-sm font-medium text-gray-500">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 truncate">{card.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Resumo de Membros e Patrimônio</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {memberStatCards.map((card, index) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-center">
                    <div className={`p-3 rounded-lg ${card.bgColor}`}><card.icon className={`w-6 h-6 ${card.color}`} /></div>
                    <div className="ml-4 min-w-0">
                      <p className="text-sm font-medium text-gray-500">{card.title}</p>
                      <p className="text-2xl font-bold text-gray-900 truncate">{card.value}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
               <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-indigo-50"><Archive className="w-6 h-6 text-indigo-600" /></div>
                    <div className="ml-4 min-w-0">
                      <p className="text-sm font-medium text-gray-500">Itens no Patrimônio</p>
                      <p className="text-2xl font-bold text-gray-900 truncate">{assetStats.total}</p>
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-indigo-50"><DollarSign className="w-6 h-6 text-indigo-600" /></div>
                    <div className="ml-4 min-w-0">
                      <p className="text-sm font-medium text-gray-500">Valor do Patrimônio</p>
                      <p className="text-2xl font-bold text-gray-900 truncate">{formatCurrency(assetStats.totalValue)}</p>
                    </div>
                  </div>
                </motion.div>
            </div>
          </section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Saldos por Centro de Custo</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <ul className="divide-y divide-gray-200">
                {costCenterBalances.map(cc => (
                  <li key={cc.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center">
                      <div className="p-2 bg-gray-100 rounded-lg mr-3"><Box className="w-5 h-5 text-gray-600" /></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{cc.name}</p>
                        <p className="text-sm text-gray-500">{cc.type}</p>
                      </div>
                    </div>
                    <p className={`text-sm font-bold ${cc.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(cc.balance)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </motion.section>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200"
        >
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Gift className="w-5 h-5 mr-2 text-yellow-500" />
              Aniversariantes do Mês
            </h3>
          </div>
          {birthdays.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {birthdays.slice(0, 7).map(member => (
                <li key={member.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center min-w-0">
                    <img className="h-10 w-10 rounded-full" src={member.profilePictureUrl} alt={member.name} />
                    <div className="ml-3 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{member.name}</p>
                      <p className="text-sm text-gray-500 truncate">{member.email}</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-700 font-medium bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full flex-shrink-0 ml-2">
                    {format(parseISO(member.birthDate), 'dd/MM')}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-12 px-6">
              <Gift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg text-gray-600 font-medium">Nenhum aniversariante este mês</p>
            </div>
          )}
          {birthdays.length > 7 && (
            <div className="px-6 py-3 bg-gray-50 text-center text-sm">
              <a href="/app/members" className="font-medium text-blue-600 hover:text-blue-500">
                Ver todos os aniversariantes
              </a>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
