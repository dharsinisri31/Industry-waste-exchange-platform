import React from 'react';
import { FiDownload, FiX, FiCheckCircle, FiPrinter, FiShield, FiFileText } from 'react-icons/fi';
import { generateInvoicePDF } from '../utils/invoiceGenerator';
import { formatINR } from '../utils/formatINR';

export default function InvoiceModal({ order, isOpen, onClose }) {
  if (!isOpen || !order) return null;

  const invoiceNo = order.invoiceNumber || `INV-${new Date().getFullYear()}-${(order._id || '').toString().slice(-6).toUpperCase()}`;
  const invoiceDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const txnId = order.transactionId || order.payment?.transactionId || 'TXN-ECOLINK-SIMULATED';
  const orderId = order.exchangeId || order.orderId || `ORD-${(order._id || '').toString().slice(-6).toUpperCase()}`;
  const paymentMethod = order.paymentMethod || order.payment?.paymentMethod || 'UPI (Simulated)';
  const paymentStatus = order.paymentStatus || order.payment?.paymentStatus || 'Paid';

  const quantity = order.quantity || 1;
  const unit = order.unit || order.waste?.unit || 'kg';
  const unitPrice = order.unitPrice || order.waste?.price || (order.totalPrice / quantity) || 0;
  const wasteSubtotal = order.wasteCost || (unitPrice * quantity);
  const transportCost = order.transportCost || 0;
  const grandTotal = order.totalPrice || (wasteSubtotal + transportCost);

  const buyerName = order.buyer?.companyName || order.buyerIndustry?.companyName || order.buyer?.name || 'Procuring Buyer';
  const sellerName = order.seller?.companyName || order.sellerIndustry?.companyName || order.seller?.name || 'Waste Producer';

  const handleDownload = () => {
    generateInvoicePDF(order, order.payment || null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto font-sans animate-in fade-in duration-200">
      <div 
        className="fixed inset-0" 
        onClick={onClose}
      />
      <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-3xl overflow-hidden z-10 my-8 flex flex-col max-h-[90vh]">
        
        {/* Modal Top Actions Header */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <FiFileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-gray-900">Commercial Invoice & Receipt</h2>
              <p className="text-xs text-gray-500 font-medium">{invoiceNo}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <FiDownload className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable/Rendered Invoice Canvas */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs text-gray-700 bg-white">
          
          {/* Invoice Header Banner */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-gray-200 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl font-black text-emerald-800 tracking-tight">ECOLINK</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Electronic Receipt
                </span>
              </div>
              <p className="text-gray-500 font-medium text-[11px]">AI-Powered Industrial Waste-to-Resource Platform</p>
            </div>

            <div className="text-left sm:text-right space-y-0.5">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Invoice No.</div>
              <div className="text-base font-black text-gray-900">{invoiceNo}</div>
              <div className="text-[11px] text-gray-500 font-medium">Date: {invoiceDate}</div>
            </div>
          </div>

          {/* Quick Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-200 text-center">
            <div>
              <span className="text-[10px] font-bold text-gray-500 uppercase block">Order ID</span>
              <span className="font-extrabold text-gray-900 text-xs">{orderId}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-500 uppercase block">Payment Status</span>
              <span className="inline-flex items-center gap-1 font-black text-emerald-800 text-xs">
                <FiCheckCircle className="w-3 h-3 text-emerald-700" /> {paymentStatus}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-500 uppercase block">Payment Method</span>
              <span className="font-bold text-gray-800 text-xs">{paymentMethod}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-500 uppercase block">Total Settled</span>
              <span className="font-black text-emerald-800 text-xs">{formatINR(grandTotal)}</span>
            </div>
          </div>

          {/* Buyer & Seller Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            {/* Buyer */}
            <div className="p-4 rounded-2xl border border-gray-200 bg-white space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block mb-1">
                Billed To (Buyer)
              </span>
              <p className="text-sm font-extrabold text-gray-900">{buyerName}</p>
              <p className="text-gray-600 font-medium">Contact: {order.buyer?.name || 'Procurement Team'}</p>
              <p className="text-gray-600 font-medium">Email: {order.buyer?.email || 'buyer@industry.com'}</p>
              <p className="text-gray-500 text-[11px]">{order.buyer?.city || order.buyerIndustry?.city || 'Industrial Corridor'}, India</p>
            </div>

            {/* Seller */}
            <div className="p-4 rounded-2xl border border-gray-200 bg-white space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-800 block mb-1">
                Dispatched From (Seller)
              </span>
              <p className="text-sm font-extrabold text-gray-900">{sellerName}</p>
              <p className="text-gray-600 font-medium">Contact: {order.seller?.name || 'Facility Manager'}</p>
              <p className="text-gray-600 font-medium">Email: {order.seller?.email || 'seller@industry.com'}</p>
              <p className="text-gray-500 text-[11px]">{order.seller?.city || order.sellerIndustry?.city || order.waste?.city || 'Regional Hub'}, India</p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-100 text-gray-800 font-extrabold text-[11px]">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Description & Specification</th>
                  <th className="p-3 text-right">Quantity</th>
                  <th className="p-3 text-right">Rate / Unit</th>
                  <th className="p-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                <tr>
                  <td className="p-3 text-gray-500 font-bold">1</td>
                  <td className="p-3">
                    <div className="font-extrabold text-gray-900">{order.waste?.name || 'Secondary Industrial Material'}</div>
                    <div className="text-[11px] text-gray-500 font-medium">Category: {order.waste?.category || 'General'} &bull; Batch: {order.batchId || 'EL-BATCH-001'}</div>
                  </td>
                  <td className="p-3 text-right font-medium text-gray-700">{quantity.toLocaleString()} {unit}</td>
                  <td className="p-3 text-right font-medium text-gray-700">{formatINR(unitPrice)}</td>
                  <td className="p-3 text-right font-extrabold text-gray-900">{formatINR(wasteSubtotal)}</td>
                </tr>
                <tr>
                  <td className="p-3 text-gray-500 font-bold">2</td>
                  <td className="p-3">
                    <div className="font-extrabold text-gray-900">GreenFreight Road Logistics & Dispatch</div>
                    <div className="text-[11px] text-gray-500 font-medium">Carrier: {order.logistics?.carrierName || 'EcoLink Green Freight'} ({order.distanceKm || 45} km transit)</div>
                  </td>
                  <td className="p-3 text-right font-medium text-gray-700">1 Transit</td>
                  <td className="p-3 text-right font-medium text-gray-700">{formatINR(transportCost)}</td>
                  <td className="p-3 text-right font-extrabold text-gray-900">{formatINR(transportCost)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Bottom Financials & Transaction Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start pt-2">
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-600 block">
                Settlement Verification (Simulated)
              </span>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-gray-500">Transaction ID:</span>
                  <span className="font-mono font-bold text-gray-900">{txnId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Gateway:</span>
                  <span className="font-bold text-gray-800">EcoLink Simulated Escrow</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Settlement Status:</span>
                  <span className="font-bold text-emerald-800">Funds Cleared</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-gray-600 font-medium">
                <span>Material Subtotal:</span>
                <span>{formatINR(wasteSubtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600 font-medium">
                <span>Transportation / Logistics:</span>
                <span>{formatINR(transportCost)}</span>
              </div>
              <div className="flex justify-between text-gray-600 font-medium">
                <span>Platform Facilitation Fee:</span>
                <span className="text-emerald-800 font-bold">₹0.00 (Zero Fee)</span>
              </div>
              <div className="pt-2 border-t border-gray-200 flex justify-between text-sm font-black text-emerald-900">
                <span>Total Paid:</span>
                <span className="text-base font-black text-emerald-800">{formatINR(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* ESG Certificate Note */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-3">
            <FiShield className="w-5 h-5 text-emerald-700 shrink-0" />
            <div>
              <span className="font-extrabold block">Circular Economy ESG Avoided CO₂ Certificate</span>
              <span className="text-[11px] text-emerald-800 font-medium">
                This transaction diverted {quantity} {unit} from landfill, avoiding ~{(order.carbonSavedKg || Math.round(quantity * 1.85)).toLocaleString()} kg CO₂e greenhouse emissions.
              </span>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center shrink-0 text-xs">
          <span className="text-gray-400 font-medium">EcoLink Electronic Invoice &bull; Simulated Demonstration</span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 font-bold rounded-xl border border-gray-200 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleDownload}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition-all flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <FiDownload className="w-4 h-4" /> Download PDF
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
