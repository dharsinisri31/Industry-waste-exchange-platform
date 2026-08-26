import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/authAPI';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../layouts/DashboardLayout';
import AdminLayout from '../layouts/AdminLayout';
import Loader from '../components/Loader';
import InvoiceModal from '../components/InvoiceModal';
import { generateInvoicePDF } from '../utils/invoiceGenerator';
import { formatINR } from '../utils/formatINR';
import { 
  FiDollarSign, FiSearch, FiFilter, FiDownload, 
  FiCheckCircle, FiAlertCircle, FiClock, FiFileText, 
  FiRefreshCw, FiEye, FiArrowUpRight, FiLayers 
} from 'react-icons/fi';
import { normalizeRole, ROLES } from '../utils/roleUtils';

export default function PaymentHistory() {
  const { user, profile, activeRole } = useAuth();
  const currentRole = normalizeRole(user, profile, activeRole);
  const isAdmin = currentRole === ROLES.ADMIN;
  const isSeller = currentRole === ROLES.SELLER;

  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState(null);
  const [notification, setNotification] = useState('');

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      if (isAdmin) {
        const res = await API.get('/payments/admin/stats');
        setAdminStats(res.data?.stats || null);
        setPayments(res.data?.payments || []);
      } else if (isSeller) {
        const res = await API.get('/payments/seller');
        setPayments(res.data?.payments || []);
      } else {
        const res = await API.get('/payments/buyer');
        setPayments(res.data?.payments || []);
      }
    } catch (err) {
      console.warn('Failed to load payments:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [isAdmin, isSeller]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      // 1. Status Filter
      if (statusFilter !== 'All') {
        const pStatus = (p.paymentStatus || '').toLowerCase();
        if (pStatus !== statusFilter.toLowerCase()) return false;
      }

      // 2. Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const txn = (p.transactionId || '').toLowerCase();
        const payId = (p.paymentId || '').toLowerCase();
        const orderId = (p.order?.exchangeId || p.order?._id?.toString() || '').toLowerCase();
        const sellerName = (p.seller?.companyName || p.seller?.name || '').toLowerCase();
        const buyerName = (p.buyer?.companyName || p.buyer?.name || '').toLowerCase();
        const wasteName = (p.order?.waste?.name || '').toLowerCase();
        return (
          txn.includes(q) ||
          payId.includes(q) ||
          orderId.includes(q) ||
          sellerName.includes(q) ||
          buyerName.includes(q) ||
          wasteName.includes(q)
        );
      }

      return true;
    });
  }, [payments, statusFilter, searchQuery]);

  const getStatusBadge = (status) => {
    const s = (status || 'Pending').toLowerCase();
    if (s === 'paid' || s === 'confirmed') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 w-max">
          <FiCheckCircle className="w-3 h-3 text-emerald-700" /> Paid
        </span>
      );
    }
    if (s === 'failed') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-red-50 text-red-800 border border-red-200 flex items-center gap-1 w-max">
          <FiAlertCircle className="w-3 h-3 text-red-600" /> Failed
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1 w-max">
        <FiClock className="w-3 h-3 text-amber-700" /> Pending
      </span>
    );
  };

  const LayoutComponent = isAdmin ? AdminLayout : DashboardLayout;

  return (
    <LayoutComponent>
      <div className="space-y-6 font-sans">
        
        {/* Page Header */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              {isAdmin ? 'Financial Transactions Oversight' : (isSeller ? 'Sales & Escrow Ledger' : 'Payment History')}
            </h1>
            <p className="text-xs text-gray-500 font-medium mt-1">
              {isAdmin 
                ? 'Consolidated simulated settlement logs and platform financial metrics.'
                : (isSeller ? 'Track incoming simulated escrow receipts for secondary resource sales.' : 'Comprehensive ledger of all circular procurement transactions.')
              }
            </p>
          </div>

          <button
            onClick={() => { fetchPayments(); showNotification('Payment records updated.'); }}
            className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 transition-all cursor-pointer flex items-center gap-2 text-xs font-bold shadow-2xs"
          >
            <FiRefreshCw className="w-4 h-4 text-emerald-600" />
            <span>Refresh Ledger</span>
          </button>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2">
            <FiCheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* ADMIN SUMMARY METRIC CARDS */}
        {isAdmin && adminStats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase">Total Transactions</span>
              <div className="text-2xl font-black text-gray-900">{adminStats.totalTransactions}</div>
              <span className="text-[10px] text-gray-400 font-semibold block">All simulated records</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
              <span className="text-[11px] font-bold text-emerald-700 uppercase">Successful Payments</span>
              <div className="text-2xl font-black text-emerald-700">{adminStats.successfulPayments}</div>
              <span className="text-[10px] text-emerald-600 font-semibold block">Confirmed escrow</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
              <span className="text-[11px] font-bold text-red-700 uppercase">Failed Payments</span>
              <div className="text-2xl font-black text-red-700">{adminStats.failedPayments}</div>
              <span className="text-[10px] text-red-600 font-semibold block">Test decline simulations</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
              <span className="text-[11px] font-bold text-amber-800 uppercase">Pending Payments</span>
              <div className="text-2xl font-black text-amber-800">{adminStats.pendingPayments}</div>
              <span className="text-[10px] text-amber-700 font-semibold block">Awaiting checkout</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
              <span className="text-[11px] font-bold text-teal-800 uppercase">Gross Trade Volume</span>
              <div className="text-2xl font-black text-teal-800">{formatINR(adminStats.totalTransactionValue)}</div>
              <span className="text-[10px] text-teal-600 font-semibold block">Total value exchanged</span>
            </div>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-2xs flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <FiSearch className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Transaction ID, Order ID, party, or waste..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-emerald-500"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <span className="text-xs font-bold text-gray-500 whitespace-nowrap">Filter Status:</span>
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {['All', 'Paid', 'Failed', 'Pending'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    statusFilter === status
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-2xs overflow-hidden">
          {loading ? (
            <div className="p-12"><Loader /></div>
          ) : filteredPayments.length === 0 ? (
            <div className="p-12 text-center text-gray-400 space-y-3">
              <FiDollarSign className="w-10 h-10 mx-auto text-gray-300" />
              <p className="text-sm font-bold text-gray-700">No payment records found.</p>
              <p className="text-xs text-gray-500">
                {searchQuery || statusFilter !== 'All' ? 'Try adjusting your search filters.' : 'Completed payments will appear here.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-gray-50 text-gray-700 font-extrabold text-[11px] uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="p-4">Transaction ID</th>
                    <th className="p-4">Order ID</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">{isSeller ? 'Buyer' : 'Seller'}</th>
                    <th className="p-4">Waste Stream</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Method</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                  {filteredPayments.map((p) => {
                    const orderObj = p.order || {};
                    const wasteObj = orderObj.waste || {};
                    const otherParty = isSeller 
                      ? (p.buyer?.companyName || p.buyer?.name || 'Buyer Enterprise')
                      : (p.seller?.companyName || p.seller?.name || 'Waste Producer');
                    
                    return (
                      <tr key={p._id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="p-4 font-mono font-bold text-emerald-800 text-[11px]">
                          {p.transactionId || 'TXN-ECOLINK-DEMO'}
                        </td>
                        <td className="p-4">
                          <Link
                            to={`/exchange/${orderObj.exchangeId || orderObj._id}`}
                            className="font-bold text-teal-700 hover:underline flex items-center gap-1"
                          >
                            <span>#{orderObj.exchangeId || orderObj._id?.toString().slice(-6) || 'ORD-001'}</span>
                            <FiArrowUpRight className="w-3 h-3 opacity-60" />
                          </Link>
                        </td>
                        <td className="p-4 text-gray-500 text-[11px]">
                          {new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="p-4 font-bold text-gray-900">{otherParty}</td>
                        <td className="p-4">
                          <div className="font-bold text-gray-900">{wasteObj.name || 'Industrial Secondary Material'}</div>
                          <span className="text-[10px] text-gray-400">{wasteObj.category || 'General'}</span>
                        </td>
                        <td className="p-4 font-extrabold text-gray-900">
                          {formatINR(p.amount || orderObj.totalPrice || 0)}
                        </td>
                        <td className="p-4 font-semibold text-gray-600">
                          {p.paymentMethod || 'UPI'}
                        </td>
                        <td className="p-4">
                          {getStatusBadge(p.paymentStatus)}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                const fullOrder = {
                                  ...orderObj,
                                  seller: p.seller || orderObj.seller,
                                  buyer: p.buyer || orderObj.buyer,
                                  transactionId: p.transactionId,
                                  paymentMethod: p.paymentMethod,
                                  paymentStatus: p.paymentStatus,
                                  totalPrice: p.amount || orderObj.totalPrice
                                };
                                setSelectedOrderForInvoice(fullOrder);
                              }}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg text-[11px] flex items-center gap-1 transition-colors cursor-pointer border border-emerald-200"
                              title="View Invoice & Receipt"
                            >
                              <FiFileText className="w-3.5 h-3.5" />
                              <span>Invoice</span>
                            </button>

                            <Link
                              to={`/exchange/${orderObj.exchangeId || orderObj._id}`}
                              className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-lg text-[11px] flex items-center gap-1 transition-colors border border-gray-200"
                              title="Track Order"
                            >
                              <FiEye className="w-3.5 h-3.5" />
                              <span>Track</span>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Invoice Modal Preview */}
      {selectedOrderForInvoice && (
        <InvoiceModal
          order={selectedOrderForInvoice}
          isOpen={!!selectedOrderForInvoice}
          onClose={() => setSelectedOrderForInvoice(null)}
        />
      )}
    </LayoutComponent>
  );
}
