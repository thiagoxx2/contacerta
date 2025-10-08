import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';

export interface FinancialReportItem {
  date: string | Date;
  amount: number;
  type: 'receivable' | 'payable';
  description: string;
}

export const exportFinancialReportXlsx = async (data: FinancialReportItem[]) => {
  // Criar workbook e worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Relatório Financeiro');

  // Definir colunas com larguras específicas
  worksheet.columns = [
    { header: 'Data', key: 'date', width: 14 },
    { header: 'Valor', key: 'amount', width: 16 },
    { header: 'D', key: 'debit', width: 6 },
    { header: 'C', key: 'credit', width: 6 },
    { header: 'Descrição', key: 'description', width: 60 }
  ];

  // Configurar cabeçalho
  const headerRow = worksheet.getRow(1);
  headerRow.height = 25;
  
  // Aplicar formatação ao cabeçalho
  worksheet.getRow(1).eachCell((cell, colNumber) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE5E7EB' } // Cinza claro
    };
    cell.font = {
      bold: true,
      size: 12
    };
    cell.alignment = {
      horizontal: 'center',
      vertical: 'middle'
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  // Adicionar dados
  data.forEach((item, index) => {
    const rowNumber = index + 2; // +2 porque a primeira linha é o cabeçalho
    const row = worksheet.getRow(rowNumber);
    
    // Formatar data
    const formattedDate = format(
      typeof item.date === 'string' ? new Date(item.date) : item.date,
      'dd/MM/yyyy'
    );
    
    // Formatar valor em Real
    const formattedAmount = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(item.amount);

    // Definir valores das células
    row.getCell(1).value = formattedDate;
    row.getCell(2).value = formattedAmount;
    row.getCell(3).value = ''; // Coluna D vazia
    row.getCell(4).value = ''; // Coluna C vazia
    row.getCell(5).value = item.description;

    // Aplicar cores baseadas no tipo
    const backgroundColor = item.type === 'receivable' 
      ? 'FFE6F4EA' // Verde claro para receitas
      : 'FFFDE7E9'; // Vermelho claro para despesas

    // Aplicar formatação a todas as células da linha
    row.eachCell((cell, colNumber) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: backgroundColor }
      };
      
      // Alinhamento específico por coluna
      if (colNumber === 1) { // Data - centralizada
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (colNumber === 2) { // Valor - alinhado à direita
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      } else { // Demais colunas - alinhamento padrão
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      }
    });
  });

  // Gerar buffer do arquivo
  const buffer = await workbook.xlsx.writeBuffer();
  
  // Criar blob e fazer download
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  
  saveAs(blob, 'relatorio_contacerta.xlsx');
};
