import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ReportFilters, ReportData } from '../types';
import { 
  Download, 
  FileText, 
  TrendingUp,
  TrendingDown,
  DollarSign
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { usePageTitle } from '../hooks/usePageTitle';
import { utils } from 'xlsx';
import { exportFinancialReportXlsx, FinancialReportItem } from '../utils/exportFinancialReportXlsx';

export default function Reports() {
  usePageTitle('Relatórios | ContaCerta');
  const { state } = useApp();
  const { documents = [], suppliers = [], members = [], costCenters = [] } = state;

  const [filters, setFilters] = useState<ReportFilters>({
    startDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    type: 'all',
    status: 'all',
    category: '',
    costCenterId: 'all',
    reportBasis: 'accrual',
  });

  const getNameById = (type: 'payable' | 'receivable', id?: string) => {
    if (!id) return '';
    if (type === 'payable') {
      return suppliers.find(s => s.id === id)?.name || id;
    }
    return members.find(m => m.id === id)?.name || id;
  };
  
  const getCostCenterNameById = (id: string) => {
    return costCenters.find(cc => cc.id === id)?.name || 'N/A';
  };

  const generateReport = (): ReportData => {
    const filteredDocs = documents.filter(doc => {
      const dateToCheck = filters.reportBasis === 'cash' 
        ? (doc.paymentDate ? parseISO(doc.paymentDate) : null)
        : parseISO(doc.issueDate);

      if (!dateToCheck) return false;

      const isInDateRange = isWithinInterval(dateToCheck, {
        start: parseISO(filters.startDate),
        end: parseISO(filters.endDate),
      });

      const matchesType = filters.type === 'all' || doc.type === filters.type;
      const matchesStatus = filters.status === 'all' || doc.status === filters.status;
      const matchesCategory = !filters.category || (doc.categoryId && doc.categoryId.toLowerCase().includes(filters.category.toLowerCase()));
      const matchesCostCenter = filters.costCenterId === 'all' || doc.costCenterId === filters.costCenterId;

      return isInDateRange && matchesType && matchesStatus && matchesCategory && matchesCostCenter;
    });

    const totalPayable = filteredDocs.filter(d => d.type === 'payable').reduce((s, d) => s + d.amount, 0);
    const totalReceivable = filteredDocs.filter(d => d.type === 'receivable').reduce((s, d) => s + d.amount, 0);
    const totalPaid = filteredDocs.filter(d => d.status === 'paid').reduce((s, d) => s + d.amount, 0);
    const totalOpen = filteredDocs.filter(d => d.status !== 'paid').reduce((s, d) => s + d.amount, 0);

    return { totalPayable, totalReceivable, totalPaid, totalOpen, documents: filteredDocs };
  };

  const reportData = generateReport();

  const getExportData = () => {
    return reportData.documents.map(doc => ({
      'Tipo': doc.type === 'payable' ? 'A Pagar' : 'A Receber',
      'Descrição': doc.description,
      'Categoria': doc.categoryId || '',
      'Centro de Custo': getCostCenterNameById(doc.costCenterId),
      'Valor': doc.amount,
      'Data Emissão': format(parseISO(doc.issueDate), 'dd/MM/yyyy'),
      'Data Vencimento': format(parseISO(doc.dueDate), 'dd/MM/yyyy'),
      'Status': doc.status === 'paid' ? 'Pago' : doc.status === 'overdue' ? 'Vencido' : 'Em Aberto',
      'Origem/Destino': getNameById(doc.type, doc.supplierId || doc.memberId || undefined),
      'Data Pagamento': doc.paymentDate ? format(parseISO(doc.paymentDate), 'dd/MM/yyyy') : ''
    }));
  };

  const exportToXLSX = async () => {
    const data: FinancialReportItem[] = reportData.documents.map(doc => ({
      date: filters.reportBasis === 'cash' && doc.paymentDate ? doc.paymentDate : doc.issueDate,
      amount: doc.amount,
      type: doc.type,
      description: doc.description
    }));
    
    await exportFinancialReportXlsx(data);
  };

  const exportToCSV = () => {
    const data = getExportData();
    const ws = utils.json_to_sheet(data);
    const csv = utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_contacerta_${format(new Date(), 'yyyyMMdd')}.csv`;
    link.click();
  };

  const exportToPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Relatório Financeiro - ContaCerta', 14, 22);
    doc.setFontSize(11);
    doc.text(`Período: ${format(parseISO(filters.startDate), 'dd/MM/yyyy')} a ${format(parseISO(filters.endDate), 'dd/MM/yyyy')}`, 14, 32);
    doc.text(`Base de Cálculo: ${filters.reportBasis === 'cash' ? 'Caixa' : 'Competência'}`, 14, 38);

    autoTable(doc, {
      startY: 50,
      head: [['Tipo', 'Descrição', 'Centro de Custo', 'Valor', 'Status']],
      body: reportData.documents.map(d => [
        d.type === 'payable' ? 'Pagar' : 'Receber',
        d.description,
        getCostCenterNameById(d.costCenterId),
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(d.amount),
        d.status
      ]),
      theme: 'striped',
      headStyles: { fillColor: [22, 163, 74] }
    });

    doc.save(`relatorio_contacerta_${format(new Date(), 'yyyyMMdd')}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Relatórios Financeiros</h1>
        <p className="mt-1 text-sm text-gray-500">Visualize e exporte os dados financeiros da igreja</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filtros do Relatório</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Inicial</label>
            <input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Final</label>
            <input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Base de Cálculo</label>
            <select value={filters.reportBasis} onChange={(e) => setFilters({ ...filters, reportBasis: e.target.value as any })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="accrual">Competência</option>
              <option value="cash">Caixa</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Centro de Custo</label>
            <select value={filters.costCenterId} onChange={(e) => setFilters({ ...filters, costCenterId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">Todos</option>
              {costCenters.map(cc => <option key={cc.id} value={cc.id}>{cc.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value as any })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">Todos</option>
              <option value="payable">A Pagar</option>
              <option value="receivable">A Receber</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value as any })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">Todos</option>
              <option value="open">Em Aberto</option>
              <option value="paid">Pago</option>
              <option value="overdue">Vencido</option>
            </select>
          </div>
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <input type="text" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} placeholder="Filtrar por categoria" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      {/* Report Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard icon={TrendingDown} title="Total a Pagar" value={reportData.totalPayable} color="red" />
        <SummaryCard icon={TrendingUp} title="Total a Receber" value={reportData.totalReceivable} color="green" />
        <SummaryCard icon={DollarSign} title="Total Pago" value={reportData.totalPaid} color="blue" />
        <SummaryCard icon={FileText} title="Total em Aberto" value={reportData.totalOpen} color="yellow" />
      </div>

      {/* Export Options & Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Lançamentos Encontrados</h3>
            <p className="mt-1 text-sm text-gray-500">{reportData.documents.length} registros no período</p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-2">
            <ExportButton onClick={exportToCSV} format="CSV" />
            <ExportButton onClick={exportToXLSX} format="XLSX" />
            <ExportButton onClick={exportToPDF} format="PDF" />
          </div>
        </div>
        {reportData.documents.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lançamento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Centro de Custo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.documents.map((doc) => (
                  <tr key={doc.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{doc.description}</div>
                      <div className="text-sm text-gray-500">{doc.categoryId || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {getCostCenterNameById(doc.costCenterId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{color: doc.type === 'payable' ? '#ef4444' : '#22c55e'}}>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(doc.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(parseISO(filters.reportBasis === 'cash' && doc.paymentDate ? doc.paymentDate : doc.issueDate), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        doc.status === 'paid' ? 'text-green-800 bg-green-100' :
                        doc.status === 'overdue' ? 'text-red-800 bg-red-100' :
                        'text-yellow-800 bg-yellow-100'
                      }`}>
                        {doc.status === 'paid' ? 'Pago' : doc.status === 'overdue' ? 'Vencido' : 'Em Aberto'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const SummaryCard = ({ icon: Icon, title, value, color }: { icon: React.ElementType, title: string, value: number, color: string }) => {
  const colors = {
    red: { bg: 'bg-red-50', text: 'text-red-600' },
    green: { bg: 'bg-green-50', text: 'text-green-600' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600' },
  };
  const c = colors[color as keyof typeof colors] || colors.blue;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${c.bg}`}><Icon className={`w-6 h-6 ${c.text}`} /></div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

const ExportButton = ({ onClick, format }: { onClick: () => void, format: string }) => (
  <button
    onClick={onClick}
    className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <Download className="w-4 h-4 mr-2" />
    {format}
  </button>
);
