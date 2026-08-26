import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import API from '../../services/authAPI';
import AdminLayout from '../../layouts/AdminLayout';
import Loader from '../../components/Loader';
import { formatINR } from '../../utils/formatINR';
import { 
  STANDARDIZED_STATUSES, 
  normalizeStatus, 
  STATUS_LABELS, 
  getStatusBadgeStyle 
} from '../../utils/statusUtils';
import { 
  FiTrendingUp, FiSearch, FiCheckCircle, 
  FiTruck, FiClock, FiCheck, FiX, FiRefreshCw, FiEye, FiShield, FiMapPin, FiCalendar 
} from 'react-icons/fi';

export default function AdminExchanges() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewExchange, setViewExchange] = useState(null);
  const [notification, setNotification] = useState('');

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await API.get('/admin/transactions');
      setTransactions(res.data || []);
    } catch (err) {
      console.warn('Failed to load transactions:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      await API.patch(`/admin/transactions/${id}`, { status });
      showNotification(`Exchange transaction status updated to "${status}".`);
      await fetchTransactions();
      if (viewExchange && viewExchange._id === id) {
        setViewExchange(prev => ({ ...prev, status }));
      }
    } catch (err) {
      alert(err.message || 'Failed to update transaction status.');
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const norm = normalizeStatus(t.normalizedStatus || t.orderStatus || t.status);
      
      // 1. Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches = 
          (t.exchangeId || '').toLowerCase().includes(q) ||
          (t.orderId || '').toLowerCase().includes(q) ||
          (t.batchId || '').toLowerCase().includes(q) ||
          (t._id || '').toLowerCase().includes(q) ||
          (t.waste?.name || '').toLowerCase().includes(q) ||
          (t.waste?.category || '').toLowerCase().includes(q) ||
          (t.seller?.companyName || t.seller?.email || '').toLowerCase().includes(q) ||
          (t.buyer?.companyName || t.buyer?.email || '').toLowerCase().includes(q);
        if (!matches) return false;
      }

      // 2. Status Filter
      if (statusFilter !== 'All') {
        const targetNorm = normalizeStatus(statusFilter);
        if (norm !== targetNorm) return false;
      }

      return true;
    });
  }, [transactions, searchQuery, statusFilter]);

  const timelineSteps = [
    { key: 'PENDING', label: 'Pending' },
    { key: 'ACCEPTED', label: 'Accepted' },
    { key: 'PROCESSING', label: 'Processing' },
    { key: 'IN_TRANSIT', label: 'In Transit' },
    { key: 'DELIVERED', label: 'Delivered' },
    { key: 'COMPLETED', label: 'Completed' }
  ];

  const getStepIndex = (rawStatus) => {
    const norm = normalizeStatus(rawStatus);
    const idx = timelineSteps.findIndex(s => s.key === norm);
    return idx >= 0 ? idx : 0;
  };

  return (
    <AdminLayout>
      <div className="space-y-6 font-sans">
        
        {/* Header (Refresh button KEPT per rule for live ops) */}
        <div className="bg-white p-6 rounded-3xl border border-[#DDE7E2] shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#12233F] tracking-tight">
              Exchange Monitoring
            </h1>
            <p className="text-xs text-[#5F6B7A] font-medium mt-1">
              Live tracking of secondary resource exchanges, dispatch status, weighment milestones, and custody transfer.
            </p>
          </div>

          <button
            onClick={() => { fetchTransactions(); showNotification('Exchange stream refreshed.'); }}
            className="p-2.5 rounded-xl border border-[#DDE7E2] bg-white hover:bg-[#F6F8F7] text-[#12233F] transition-all cursor-pointer flex items-center gap-2 text-xs font-bold shadow-2xs"
            title="Refresh Live Exchanges"
          >
            <FiRefreshCw className="w-4 h-4 text-[#009B6B]" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className="p-4 bg-[#EAF8F2] border border-[#009B6B]/40 text-[#009B6B] rounded-2xl text-xs font-bold flex items-center gap-2">
            <FiCheckCircle className="w-4 h-4 text-[#009B6B] shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="bg-white p-5 rounded-3xl border border-[#DDE7E2] shadow-2xs space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#009B6B] pointer-events-none">
                <FiSearch className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Exchange ID, material, buyer, or seller..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#DDE7E2] text-xs text-[#12233F] placeholder-gray-400 focus:outline-none focus:border-[#009B6B] focus:ring-1 focus:ring-[#009B6B] font-medium bg-[#F6F8F7]"
              />
            </div>

            <div className="w-full md:w-56">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#DDE7E2] text-xs text-[#12233F] focus:outline-none focus:border-[#009B6B] font-bold bg-[#F6F8F7] cursor-pointer"
              >
                <option value="All">Status: All Stages</option>
                <option value="PENDING">Pending</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="PROCESSING">Processing</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="DELIVERED">Delivered</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Exchanges Table */}
        <div className="bg-white rounded-3xl border border-[#DDE7E2] shadow-2xs overflow-hidden">
          {loading ? (
            <div className="py-20 flex justify-center">
              <Loader />
            </div>
          ) : filteredTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#F6F8F7] border-b border-[#DDE7E2] text-[11px] font-extrabold text-[#5F6B7A] uppercase tracking-wider">
                    <th className="py-4 px-4">Exchange ID</th>
                    <th className="py-4 px-4">Seller</th>
                    <th className="py-4 px-4">Buyer</th>
                    <th className="py-4 px-4">Material</th>
                    <th className="py-4 px-4">Quantity</th>
                    <th className="py-4 px-4">Value</th>
                    <th className="py-4 px-4">Current Status</th>
                    <th className="py-4 px-4">Date</th>
                    <th className="py-4 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE7E2]/60 font-medium text-[#12233F]">
                  {filteredTransactions.map((t) => {
                    const normStatus = normalizeStatus(t.normalizedStatus || t.orderStatus || t.status);

                    return (
                      <tr key={t._id} className="hover:bg-[#F6F8F7]/80 transition-colors">
                        <td className="py-4 px-4 font-mono font-bold text-[#12233F]">
                          {t.exchangeId || t.orderId || `#${t._id.slice(-6)}`}
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-bold text-[#12233F]">{t.seller?.companyName || t.seller?.email || 'Seller Plant'}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-bold text-[#12233F]">{t.buyer?.companyName || t.buyer?.email || 'Buyer Recycler'}</div>
                        </td>
                        <td className="py-4 px-4 font-bold text-[#009B6B]">
                          {t.waste?.name || 'Secondary Material'}
                        </td>
                        <td className="py-4 px-4 font-bold text-[#12233F]">
                          {(t.quantity || t.waste?.quantity || 0).toLocaleString()} {t.unit || 'kg'}
                        </td>
                        <td className="py-4 px-4 font-extrabold text-[#12233F]">
                          {formatINR(t.totalPrice || 0)}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${getStatusBadgeStyle(normStatus)}`}>
                            {STATUS_LABELS[normStatus] || normStatus}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-[#5F6B7A] text-[11px]">
                          {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'Active'}
                        </td>
                        <td className="py-4 px-4 text-right space-x-1.5 whitespace-nowrap">
                          {/* VIEW BUTTON */}
                          <button
                            onClick={() => setViewExchange(t)}
                            className="px-2.5 py-1.5 rounded-xl bg-[#F6F8F7] hover:bg-[#EAF8F2] text-[#12233F] hover:text-[#009B6B] font-bold text-xs transition-all border border-[#DDE7E2] cursor-pointer inline-flex items-center gap-1"
                            title="View Complete Exchange Timeline"
                          >
                            <FiEye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center text-xs text-[#5F6B7A] space-y-2">
              <FiTrendingUp className="w-8 h-8 mx-auto text-gray-300" />
              <p className="font-bold text-[#12233F]">No active exchanges found.</p>
              <p>Exchange requests between sellers and buyers will populate here.</p>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* VIEW EXCHANGE TIMELINE MODAL */}
        {/* ------------------------------------------------------------- */}
        {viewExchange && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-[#DDE7E2] shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
              
              <div className="flex justify-between items-start border-b border-[#DDE7E2] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-[#12233F]">
                      Exchange {viewExchange.exchangeId || viewExchange.orderId || `#${viewExchange._id.slice(-6)}`}
                    </h2>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${getStatusBadgeStyle(viewExchange.normalizedStatus || viewExchange.orderStatus || viewExchange.status)}`}>
                      {STATUS_LABELS[normalizeStatus(viewExchange.normalizedStatus || viewExchange.orderStatus || viewExchange.status)]}
                    </span>
                  </div>
                  <span className="text-xs text-[#009B6B] font-extrabold uppercase mt-0.5 block">
                    {viewExchange.waste?.name || 'Secondary Material'}
                  </span>
                </div>
                <button
                  onClick={() => setViewExchange(null)}
                  className="p-2 rounded-xl bg-[#F6F8F7] hover:bg-gray-200 text-[#12233F] cursor-pointer"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>

              {/* Complete Exchange Timeline */}
              <div className="space-y-3 p-4 bg-[#F6F8F7] rounded-2xl border border-[#DDE7E2]">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#12233F] flex items-center gap-1.5">
                  <FiClock className="text-[#009B6B]" />
                  <span>Exchange Operational Timeline</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-2">
                  {timelineSteps.map((step, idx) => {
                    const currentIndex = getStepIndex(viewExchange.normalizedStatus || viewExchange.orderStatus || viewExchange.status);
                    const isPassed = idx <= currentIndex;
                    const isCurrent = idx === currentIndex;

                    return (
                      <div 
                        key={step.key} 
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          isCurrent
                            ? 'bg-[#009B6B] text-white border-[#009B6B] shadow-2xs font-extrabold'
                            : isPassed
                            ? 'bg-[#EAF8F2] text-[#009B6B] border-[#009B6B]/40 font-bold'
                            : 'bg-white text-gray-400 border-gray-200 font-medium'
                        }`}
                      >
                        <span className="text-[10px] block opacity-80">Step {idx + 1}</span>
                        <span className="text-[11px] block leading-tight">{step.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Exchange Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-[#F6F8F7] rounded-2xl space-y-1">
                  <span className="font-extrabold text-[#5F6B7A] uppercase tracking-wider text-[10px]">Seller Facility</span>
                  <div className="font-bold text-[#12233F]">{viewExchange.seller?.companyName || viewExchange.seller?.email || 'Seller Plant'}</div>
                  <span className="text-[11px] text-gray-500">{viewExchange.seller?.email}</span>
                </div>

                <div className="p-3 bg-[#F6F8F7] rounded-2xl space-y-1">
                  <span className="font-extrabold text-[#5F6B7A] uppercase tracking-wider text-[10px]">Buyer Facility</span>
                  <div className="font-bold text-[#12233F]">{viewExchange.buyer?.companyName || viewExchange.buyer?.email || 'Buyer Plant'}</div>
                  <span className="text-[11px] text-gray-500">{viewExchange.buyer?.email}</span>
                </div>

                <div className="p-3 bg-[#F6F8F7] rounded-2xl space-y-1">
                  <span className="font-extrabold text-[#5F6B7A] uppercase tracking-wider text-[10px]">Agreed Quantity</span>
                  <div className="font-bold text-[#12233F]">{(viewExchange.quantity || viewExchange.waste?.quantity || 0).toLocaleString()} {viewExchange.unit || 'kg'}</div>
                </div>

                <div className="p-3 bg-[#F6F8F7] rounded-2xl space-y-1">
                  <span className="font-extrabold text-[#5F6B7A] uppercase tracking-wider text-[10px]">Total Trade Value</span>
                  <div className="font-extrabold text-[#009B6B]">{formatINR(viewExchange.totalPrice || 0)}</div>
                </div>

                {viewExchange.invoiceNumber && (
                  <div className="p-3 bg-[#F6F8F7] rounded-2xl space-y-1">
                    <span className="font-extrabold text-[#5F6B7A] uppercase tracking-wider text-[10px]">Invoice Reference</span>
                    <div className="font-mono font-bold text-gray-900">{viewExchange.invoiceNumber}</div>
                  </div>
                )}

                {viewExchange.paymentStatus && (
                  <div className="p-3 bg-[#F6F8F7] rounded-2xl space-y-1">
                    <span className="font-extrabold text-[#5F6B7A] uppercase tracking-wider text-[10px]">Payment Status</span>
                    <div className="font-bold text-emerald-800">{viewExchange.paymentStatus}</div>
                  </div>
                )}
              </div>

              {/* Status Update Quick Buttons */}
              <div className="space-y-2 pt-2 border-t border-[#DDE7E2]">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#5F6B7A]">
                  Update Operational Status:
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'PENDING', label: 'Pending' },
                    { key: 'ACCEPTED', label: 'Accepted' },
                    { key: 'PROCESSING', label: 'Processing' },
                    { key: 'IN_TRANSIT', label: 'In Transit' },
                    { key: 'DELIVERED', label: 'Delivered' },
                    { key: 'COMPLETED', label: 'Completed' },
                    { key: 'CANCELLED', label: 'Cancelled' }
                  ].map((s) => (
                    <button
                      key={s.key}
                      onClick={() => handleUpdateStatus(viewExchange._id, s.key)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        normalizeStatus(viewExchange.normalizedStatus || viewExchange.orderStatus || viewExchange.status) === s.key
                          ? 'bg-[#009B6B] text-white border-[#009B6B]'
                          : 'bg-[#F6F8F7] border-[#DDE7E2] text-[#12233F] hover:bg-[#EAF8F2] hover:text-[#009B6B]'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#DDE7E2]">
                <button
                  onClick={() => setViewExchange(null)}
                  className="px-6 py-2.5 rounded-xl bg-[#12233F] hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
