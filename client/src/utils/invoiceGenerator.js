import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Generate and download a PDF Invoice for an EcoLink order
 * @param {Object} order - Full transaction/order object
 * @param {Object} payment - Payment details object (optional)
 */
export function generateInvoicePDF(order, payment = null) {
  if (!order) {
    alert('Order details not available for invoice generation.');
    return;
  }

  const doc = new jsPDF('portrait', 'pt', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const invoiceNo = order.invoiceNumber || `INV-${new Date().getFullYear()}-${(order._id || '').toString().slice(-6).toUpperCase()}`;
  const invoiceDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const txnId = order.transactionId || payment?.transactionId || 'TXN-ECOLINK-SIMULATED';
  const orderId = order.exchangeId || order.orderId || `ORD-${(order._id || '').toString().slice(-6).toUpperCase()}`;
  const paymentMethod = order.paymentMethod || payment?.paymentMethod || 'UPI (Simulated)';
  const paymentStatus = order.paymentStatus || payment?.paymentStatus || 'Paid';

  // 1. Top Brand Banner
  doc.setFillColor(0, 155, 107); // EcoLink Primary Green #009B6B
  doc.rect(0, 0, pageWidth, 75, 'F');

  // Brand Name
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text('ECOLINK', 40, 42);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('AI-Powered Industrial Waste-to-Resource Exchange Platform', 40, 58);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('TRANSACTION INVOICE', pageWidth - 200, 42);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Circular Trade Settlement Receipt', pageWidth - 200, 58);

  // 2. Invoice Meta Header Box
  doc.setFillColor(246, 248, 247); // Light card bg
  doc.roundedRect(40, 95, pageWidth - 80, 55, 6, 6, 'F');
  doc.setDrawColor(221, 231, 226);
  doc.roundedRect(40, 95, pageWidth - 80, 55, 6, 6, 'S');

  doc.setTextColor(18, 35, 63); // #12233F
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('INVOICE NUMBER:', 55, 115);
  doc.text('INVOICE DATE:', 220, 115);
  doc.text('ORDER ID:', 375, 115);
  doc.text('PAYMENT STATUS:', 480, 115);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(95, 107, 122);
  doc.text(invoiceNo, 55, 133);
  doc.text(invoiceDate, 220, 133);
  doc.text(orderId, 375, 133);

  // Payment Status Pill in Box
  const isPaid = paymentStatus.toLowerCase() === 'paid' || paymentStatus.toLowerCase() === 'confirmed';
  if (isPaid) {
    doc.setTextColor(0, 155, 107);
    doc.setFont('helvetica', 'bold');
    doc.text('PAID (CONFIRMED)', 480, 133);
  } else {
    doc.setTextColor(217, 119, 6);
    doc.setFont('helvetica', 'bold');
    doc.text(paymentStatus.toUpperCase(), 480, 133);
  }

  // 3. Parties Grid (Buyer & Seller)
  let currentY = 175;

  // Buyer Column
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(18, 35, 63);
  doc.text('BILLED TO (BUYER):', 40, currentY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  const buyerName = order.buyer?.companyName || order.buyerIndustry?.companyName || order.buyer?.name || 'Procuring Enterprise';
  doc.text(buyerName, 40, currentY + 16);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(95, 107, 122);
  doc.text(`Contact: ${order.buyer?.name || order.buyer?.email || 'Authorized Representative'}`, 40, currentY + 30);
  doc.text(`Email: ${order.buyer?.email || 'buyer@industry.com'}`, 40, currentY + 44);
  const buyerCity = order.buyer?.city || order.buyerIndustry?.city || 'Industrial Corridor';
  doc.text(`Location: ${buyerCity}, India`, 40, currentY + 58);

  // Seller Column
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(18, 35, 63);
  doc.text('DISPATCHED FROM (SELLER):', pageWidth / 2 + 10, currentY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  const sellerName = order.seller?.companyName || order.sellerIndustry?.companyName || order.seller?.name || 'Waste Producer Facility';
  doc.text(sellerName, pageWidth / 2 + 10, currentY + 16);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(95, 107, 122);
  doc.text(`Contact: ${order.seller?.name || order.seller?.email || 'Facility Manager'}`, pageWidth / 2 + 10, currentY + 30);
  doc.text(`Email: ${order.seller?.email || 'seller@industry.com'}`, pageWidth / 2 + 10, currentY + 44);
  const sellerCity = order.seller?.city || order.sellerIndustry?.city || order.waste?.city || 'Industrial Estate';
  doc.text(`Facility: ${sellerCity}, India`, pageWidth / 2 + 10, currentY + 58);

  // 4. Line Items Table
  currentY += 80;

  const wasteName = order.waste?.name || 'Secondary Industrial Material';
  const category = order.waste?.category || 'General Resource';
  const quantity = order.quantity || 1;
  const unit = order.unit || order.waste?.unit || 'kg';
  const unitPrice = order.unitPrice || order.waste?.price || (order.totalPrice / quantity) || 0;
  const wasteSubtotal = order.wasteCost || (unitPrice * quantity);
  const transportCost = order.transportCost || 0;
  const grandTotal = order.totalPrice || (wasteSubtotal + transportCost);

  const tableRows = [
    [
      `1`,
      `${wasteName}\nCategory: ${category} | Batch: ${order.batchId || 'EL-BATCH-001'}`,
      `${quantity.toLocaleString()} ${unit}`,
      `INR ${Number(unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      `INR ${Number(wasteSubtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
    ],
    [
      `2`,
      `GreenFreight Logistics & Freight Dispatch\nCarrier: ${order.logistics?.carrierName || 'EcoLink Green Logistics'} (${order.distanceKm || 45} km transit)`,
      `1 Service`,
      `INR ${Number(transportCost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      `INR ${Number(transportCost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
    ]
  ];

  doc.autoTable({
    startY: currentY,
    head: [['#', 'Description & Specification', 'Quantity', 'Rate / Unit', 'Total (INR)']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [18, 35, 63],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      cellPadding: 7
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 7
    },
    alternateRowStyles: {
      fillColor: [248, 250, 249]
    },
    columnStyles: {
      0: { cellWidth: 25, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 70, halign: 'right' },
      3: { cellWidth: 90, halign: 'right' },
      4: { cellWidth: 90, halign: 'right' }
    },
    margin: { left: 40, right: 40 }
  });

  const finalY = doc.lastAutoTable.finalY + 15;

  // 5. Payment & Settlement Summary Box
  doc.setFillColor(246, 248, 247);
  doc.roundedRect(40, finalY, 250, 85, 6, 6, 'F');
  doc.setDrawColor(221, 231, 226);
  doc.roundedRect(40, finalY, 250, 85, 6, 6, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(18, 35, 63);
  doc.text('SETTLEMENT & PAYMENT INFO', 52, finalY + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(95, 107, 122);
  doc.text(`Payment Method:`, 52, finalY + 34);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`${paymentMethod}`, 135, finalY + 34);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(95, 107, 122);
  doc.text(`Transaction ID:`, 52, finalY + 48);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`${txnId}`, 135, finalY + 48);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(95, 107, 122);
  doc.text(`Escrow Clearance:`, 52, finalY + 62);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 155, 107);
  doc.text(`Verified & Settled (Simulated)`, 135, finalY + 62);

  // 6. Financial Summary (Right Column)
  const rightColX = pageWidth - 240;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(95, 107, 122);

  doc.text('Material Subtotal:', rightColX, finalY + 15);
  doc.text(`INR ${Number(wasteSubtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - 40, finalY + 15, { align: 'right' });

  doc.text('Freight / Transport Fee:', rightColX, finalY + 30);
  doc.text(`INR ${Number(transportCost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - 40, finalY + 30, { align: 'right' });

  doc.text('Platform Facilitation:', rightColX, finalY + 45);
  doc.text(`INR 0.00 (Zero Fee)`, pageWidth - 40, finalY + 45, { align: 'right' });

  doc.setDrawColor(221, 231, 226);
  doc.line(rightColX, finalY + 54, pageWidth - 40, finalY + 54);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 155, 107);
  doc.text('Total Amount Paid:', rightColX, finalY + 72);
  doc.text(`INR ${Number(grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - 40, finalY + 72, { align: 'right' });

  // 7. Sustainability & Carbon Impact Note
  const carbonY = finalY + 105;
  doc.setFillColor(234, 248, 242);
  doc.roundedRect(40, carbonY, pageWidth - 80, 42, 6, 6, 'F');
  doc.setDrawColor(0, 155, 107);
  doc.roundedRect(40, carbonY, pageWidth - 80, 42, 6, 6, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 155, 107);
  doc.text('🌱 CIRCULAR RESOURCE ESG IMPACT CERTIFICATE', 55, carbonY + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  const carbonSaved = order.carbonSavedKg || Math.round(quantity * 1.85);
  doc.text(`By exchanging this secondary stream, this transaction diverted ${quantity} ${unit} from landfill, avoiding ~${carbonSaved.toLocaleString()} kg CO2e.`, 55, carbonY + 30);

  // 8. Footer & Legal Disclaimer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'This is a system-generated electronic receipt & commercial invoice for the EcoLink Industrial Waste-to-Resource Platform.',
    pageWidth / 2,
    pageHeight - 32,
    { align: 'center' }
  );
  doc.text(
    'Simulated proof-of-concept transaction for academic & prototype demonstration. No real currency processed.',
    pageWidth / 2,
    pageHeight - 20,
    { align: 'center' }
  );

  // Download Trigger
  const filename = `${invoiceNo}.pdf`;
  doc.save(filename);
}
