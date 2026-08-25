import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Export data array to a CSV file and trigger browser download
 * @param {Array<Object>} data 
 * @param {Array<{ label: string, key: string | Function }>} columns 
 * @param {string} filename 
 */
export function exportToCSV(data, columns, filename = 'export.csv') {
  if (!data || !data.length) {
    alert('No records available to export.');
    return;
  }

  const headers = columns.map(c => `"${(c.label || '').replace(/"/g, '""')}"`).join(',');
  const rows = data.map(item => {
    return columns.map(col => {
      let val = '';
      if (typeof col.key === 'function') {
        val = col.key(item);
      } else {
        val = item[col.key] ?? '';
      }
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',');
  });

  const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export structured data to a clean EcoLink PDF report
 * @param {Object} options
 * @param {string} options.title
 * @param {string} options.filename
 * @param {Array<{ label: string, value: string }>} options.filters
 * @param {Array<string>} options.headers
 * @param {Array<Array<string>>} options.rows
 */
export function exportToPDF({ title, filename = 'report.pdf', filters = [], headers = [], rows = [] }) {
  if (!rows || !rows.length) {
    alert('No records available to export.');
    return;
  }

  const doc = new jsPDF('landscape', 'pt', 'a4');

  // Brand Header
  doc.setFillColor(0, 155, 107); // EcoLink Green #009B6B
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 50, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text('EcoLink - Industrial Waste Exchange', 40, 32);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Circular Resource Management Platform', doc.internal.pageSize.getWidth() - 250, 32);

  // Document Title & Metadata
  doc.setTextColor(18, 35, 63); // #12233F
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(title, 40, 80);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(95, 107, 122); // #5F6B7A
  const generatedAt = `Generated on: ${new Date().toLocaleString('en-IN')}`;
  doc.text(generatedAt, 40, 95);

  // Applied Filters Summary
  let currentY = 105;
  if (filters && filters.length > 0) {
    const filterText = filters.map(f => `${f.label}: ${f.value}`).join('  |  ');
    doc.text(`Active Filters: ${filterText}`, 40, currentY);
    currentY += 15;
  }

  // Table rendering via autoTable
  doc.autoTable({
    startY: currentY + 5,
    head: [headers],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [18, 35, 63],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      cellPadding: 6
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 5
    },
    alternateRowStyles: {
      fillColor: [246, 248, 247]
    },
    margin: { left: 40, right: 40 },
    didDrawPage: function (data) {
      // Footer
      const str = 'Page ' + doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(str, data.settings.margin.left, doc.internal.pageSize.getHeight() - 20);
      doc.text('EcoLink Confidential Report - Circular Industrial Exchange', doc.internal.pageSize.getWidth() - 280, doc.internal.pageSize.getHeight() - 20);
    }
  });

  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}
