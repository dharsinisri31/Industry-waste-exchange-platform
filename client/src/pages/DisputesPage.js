import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/authAPI';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../layouts/DashboardLayout';
import AdminLayout from '../layouts/AdminLayout';
import Loader from '../components/Loader';
import { normalizeRole, ROLES } from '../utils/roleUtils';
import { 
  FiAlertTriangle, FiCheckCircle, FiClock, FiSearch, 
  FiMessageSquare, FiShield, FiXCircle, FiRefreshCw, 
  FiArrowRight, FiFileText, FiSend, FiUser 
} from 'react-icons/fi';

export default function DisputesPage() {
  const { user, profile, activeRole } = useAuth();
  const currentRole = normalizeRole(user, profile, activeRole);
  const isAdmin = currentRole === ROLES.ADMIN;
  const isSeller = currentRole === ROLES.SELLER;

  const [loading, setLoading] = useState(true);
  const [disputes, setDisputes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedDispute, setSelectedDispute] = useState(null);
  
  // Seller response form
  const [sellerReplyText, setSellerReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  // Admin resolution modal
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [adminAction, setAdminAction] = useState('Resolved'); // 'Resolved' | 'Rejected'
  const [adminNote, setAdminNote] = useState('');
  const [resolving, setResolving] = useState(false);

  const [notification, setNotification] = useState('');

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const res = await API.get('/disputes');
      setDisputes(res.data?.disputes || []);
    } catch (err) {
      console.warn('Failed to load disputes:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const filteredDisputes = useMemo(() => {
    return disputes.filter((d) => {
      if (statusFilter !== 'All') {
        if ((d.status || '').toLowerCase() !== statusFilter.toLowerCase()) return false;
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const dId = (d.disputeId || '').toLowerCase();
        const reason = (d.reason || '').toLowerCase();
        const buyerName = (d.buyer?.companyName || d.buyer?.name || '').toLowerCase();
        const sellerName = (d.seller?.companyName || d.seller?.name || '').toLowerCase();
        const wasteName = (d.waste?.name || '').toLowerCase();
        const orderId = (d.order?.exchangeId || '').toLowerCase();
        return (
          dId.includes(q) ||
          reason.includes(q) ||
          buyerName.includes(q) ||
          sellerName.includes(q) ||
          wasteName.includes(q) ||
          orderId.includes(q)
        );
      }

      return true;
    });
  }, [disputes, statusFilter, searchQuery]);

  const handleSellerReply = async (disputeId) => {
    if (!sellerReplyText.trim()) return;
    try {
      setReplying(true);
      await API.post(`/disputes/${disputeId}/respond`, {
        comment: sellerReplyText.trim()
      });
      showNotification('Seller response submitted successfully. Status is now Under Review.');
      setSellerReplyText('');
      await fetchDisputes();
      if (selectedDispute && selectedDispute.disputeId === disputeId) {
        setSelectedDispute(prev => ({
          ...prev,
          status: 'Under Review',
          sellerResponse: { comment: sellerReplyText.trim(), respondedAt: new Date() }
        }));
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to submit response.');
    } finally {
      setReplying(false);
    }
  };

  const handleAdminResolve = async () => {
    if (!adminNote.trim()) {
      alert('Please provide a resolution note.');
      return;
    }

    try {
      setResolving(true);
      await API.patch(`/disputes/${selectedDispute.disputeId || selectedDispute._id}/resolve`, {
        action: adminAction,
        resolutionNote: adminNote.trim()
      });
      showNotification(`Dispute marked as ${adminAction}.`);
      setShowResolveModal(false);
      setAdminNote('');
      await fetchDisputes();
      setSelectedDispute(null);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to resolve dispute.');
    } finally {
      setResolving(false);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || 'Open').toLowerCase();
    if (s === 'resolved') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 w-max">
          <FiCheckCircle className="w-3 h-3 text-emerald-700" /> Resolved
        </span>
      );
    }
    if (s === 'rejected') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-red-50 text-red-800 border border-red-200 flex items-center gap-1 w-max">
          <FiXCircle className="w-3 h-3 text-red-600" /> Rejected
        </span>
      );
    }
    if (s === 'under review') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1 w-max">
          <FiClock className="w-3 h-3 text-blue-600" /> Under Review
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1 w-max">
        <FiAlertTriangle className="w-3 h-3 text-amber-700" /> Open
      </span>
    );
  };

  const LayoutComponent = isAdmin ? AdminLayout : DashboardLayout;

  return (
    <LayoutComponent>
      <div className="space-y-6 font-sans">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-50 text-red-800 border border-red-200">
                Dispute & Assay Mediation
              </span>
              <span className="text-xs font-mono font-bold text-gray-500">
                EcoLink Governance
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              {isAdmin ? 'Platform Dispute Arbitration' : 'Material Quality Disputes'}
            </h1>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Arbitrate industrial feedstock quality deviations, purity variances, and volume discrepancies.
            </p>
          </div>

          <button
            onClick={() => { fetchDisputes(); showNotification('Dispute logs refreshed.'); }}
            className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 transition-all cursor-pointer flex items-center gap-2 text-xs font-bold shadow-2xs"
          >
            <FiRefreshCw className="w-4 h-4 text-emerald-600" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Toast */}
        {notification && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2">
            <FiCheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{notification}</span>
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
              placeholder="Search by Dispute ID, Order ID, party, or reason..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            {['All', 'Open', 'Under Review', 'Resolved', 'Rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  statusFilter === status
                    ? 'bg-gray-900 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Disputes Grid / Table */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* List of Disputes */}
          <div className={`${selectedDispute ? 'lg:col-span-1' : 'lg:col-span-3'} space-y-3`}>
            {loading ? (
              <div className="p-12 bg-white rounded-3xl border border-gray-200"><Loader /></div>
            ) : filteredDisputes.length === 0 ? (
              <div className="p-12 bg-white rounded-3xl border border-gray-200 text-center text-gray-400 space-y-2">
                <FiShield className="w-10 h-10 mx-auto text-emerald-400/60" />
                <p className="text-sm font-bold text-gray-700">No active disputes found.</p>
                <p className="text-xs text-gray-500">All resource exchanges are operating within normal quality specifications.</p>
              </div>
            ) : (
              filteredDisputes.map((d) => {
                const isSelected = selectedDispute && selectedDispute._id === d._id;
                return (
                  <div
                    key={d._id}
                    onClick={() => setSelectedDispute(d)}
                    className={`p-5 rounded-3xl border transition-all cursor-pointer space-y-3 ${
                      isSelected
                        ? 'bg-emerald-50/40 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                        : 'bg-white border-gray-200 hover:border-gray-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-gray-900 text-xs">{d.disputeId}</span>
                      {getStatusBadge(d.status)}
                    </div>

                    <div>
                      <h3 className="text-sm font-black text-gray-900">{d.reason}</h3>
                      <p className="text-xs text-gray-500 font-medium line-clamp-2 mt-1">{d.description}</p>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                      <span>Order: #{d.order?.exchangeId || d.order?._id?.toString().slice(-6) || 'N/A'}</span>
                      <span>{new Date(d.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Selected Dispute Full Detail & Mediation Thread */}
          {selectedDispute && (
            <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6 animate-in slide-in-from-right-4 duration-200">
              
              {/* Detail Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-gray-100 gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-xs text-gray-500">{selectedDispute.disputeId}</span>
                    {getStatusBadge(selectedDispute.status)}
                  </div>
                  <h2 className="text-xl font-black text-gray-900">{selectedDispute.reason}</h2>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/exchange/${selectedDispute.order?.exchangeId || selectedDispute.order?._id}`}
                    className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-xl text-xs border border-gray-200 transition-colors"
                  >
                    View Order
                  </Link>

                  {/* Admin Resolution Trigger */}
                  {isAdmin && selectedDispute.status !== 'Resolved' && selectedDispute.status !== 'Rejected' && (
                    <button
                      onClick={() => setShowResolveModal(true)}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition-all shadow-xs cursor-pointer"
                    >
                      Arbitrate / Resolve
                    </button>
                  )}
                </div>
              </div>

              {/* Dispute Metadata Parties Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs">
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-gray-400 block">Buyer (Complainant)</span>
                  <p className="font-extrabold text-gray-900">{selectedDispute.buyer?.companyName || selectedDispute.buyer?.name}</p>
                  <p className="text-gray-500 text-[11px]">{selectedDispute.buyer?.email}</p>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-gray-400 block">Seller (Supplier)</span>
                  <p className="font-extrabold text-gray-900">{selectedDispute.seller?.companyName || selectedDispute.seller?.name}</p>
                  <p className="text-gray-500 text-[11px]">{selectedDispute.seller?.email}</p>
                </div>
              </div>

              {/* Buyer's Statement */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <FiAlertTriangle className="text-red-500 w-4 h-4" /> Buyer's Quality Issue Description
                </h4>
                <div className="p-4 rounded-2xl bg-red-50/50 border border-red-100 text-xs text-gray-800 leading-relaxed font-medium">
                  {selectedDispute.description}
                </div>
              </div>

              {/* Seller's Response Section */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <FiMessageSquare className="text-teal-600 w-4 h-4" /> Seller Explanation & Response
                </h4>
                {selectedDispute.sellerResponse && selectedDispute.sellerResponse.comment ? (
                  <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-100 text-xs text-gray-800 space-y-1">
                    <p className="leading-relaxed font-medium">{selectedDispute.sellerResponse.comment}</p>
                    <span className="text-[10px] text-teal-800 font-bold block pt-1">
                      Submitted on: {new Date(selectedDispute.sellerResponse.respondedAt).toLocaleString()}
                    </span>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-500 space-y-3">
                    <p>No response submitted by seller yet.</p>

                    {/* Seller Response Form */}
                    {(isSeller || (user?._id === selectedDispute.seller?._id)) && (
                      <div className="space-y-2 pt-2 border-t border-gray-200">
                        <label className="block text-xs font-extrabold text-gray-900">
                          Submit Your Explanation:
                        </label>
                        <textarea
                          rows={3}
                          value={sellerReplyText}
                          onChange={(e) => setSellerReplyText(e.target.value)}
                          placeholder="Explain batch assay calibration, dispatch parameters, or proposed resolution..."
                          className="w-full p-3 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-emerald-500"
                        />
                        <button
                          onClick={() => handleSellerReply(selectedDispute.disputeId)}
                          disabled={replying || !sellerReplyText.trim()}
                          className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <FiSend className="w-3.5 h-3.5" />
                          <span>{replying ? 'Submitting...' : 'Submit Response'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Admin Resolution Note */}
              {selectedDispute.adminResolution && selectedDispute.adminResolution.resolutionNote && (
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center gap-2">
                    <FiShield className="text-emerald-700 w-4 h-4" /> Platform Arbitration Resolution
                  </h4>
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                    <div className="font-extrabold">Ruling: {selectedDispute.adminResolution.action}</div>
                    <p className="leading-relaxed font-medium">{selectedDispute.adminResolution.resolutionNote}</p>
                    <span className="text-[10px] text-emerald-700 font-bold block pt-1">
                      Mediated by {selectedDispute.adminResolution.resolvedByName || 'Platform Governance'} on {new Date(selectedDispute.adminResolution.resolvedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

      </div>

      {/* Admin Resolution Dialog Modal */}
      {showResolveModal && selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto font-sans animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setShowResolveModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden z-10 p-6 sm:p-8 space-y-6">
            
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-black text-gray-900">Arbitrate Dispute: {selectedDispute.disputeId}</h3>
              <button onClick={() => setShowResolveModal(false)} className="text-gray-400 hover:text-gray-700">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-extrabold text-gray-700 uppercase mb-1">Select Resolution Outcome</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAdminAction('Resolved')}
                    className={`py-3 px-4 rounded-2xl font-bold border text-center cursor-pointer transition-colors ${
                      adminAction === 'Resolved'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-gray-50 border-gray-200 text-gray-700'
                    }`}
                  >
                    Mark Resolved (Custody Settled)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminAction('Rejected')}
                    className={`py-3 px-4 rounded-2xl font-bold border text-center cursor-pointer transition-colors ${
                      adminAction === 'Rejected'
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-gray-50 border-gray-200 text-gray-700'
                    }`}
                  >
                    Reject Claim (Unsubstantiated)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-extrabold text-gray-700 uppercase mb-1">Arbitration Note / Decision Details</label>
                <textarea
                  rows={4}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Detail the technical investigation findings, weighbridge reconciliation, and settlement instruction..."
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAdminResolve}
                  disabled={resolving || !adminNote.trim()}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {resolving ? 'Submitting...' : 'Confirm Ruling'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </LayoutComponent>
  );
}
