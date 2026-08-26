import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import API from '../../services/authAPI';
import AdminLayout from '../../layouts/AdminLayout';
import Loader from '../../components/Loader';
import { exportToCSV, exportToPDF } from '../../utils/exportUtils';
import { 
  FiUsers, FiSearch, FiCheckCircle, 
  FiShield, FiMapPin, FiMail, FiPhone, FiEye, FiCheck, FiX, 
  FiAlertCircle, FiDownload, FiFileText, FiRefreshCw, FiBriefcase, FiSlash, FiLayers
} from 'react-icons/fi';

export default function AdminUsers() {
  const [loading, setLoading] = useState(true);
  const [industriesList, setIndustriesList] = useState([]);
  const [apiError, setApiError] = useState('');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('Newest First');
  
  // Modals & Action States
  const [viewIndustry, setViewIndustry] = useState(null);
  const [confirmVerifyIndustry, setConfirmVerifyIndustry] = useState(null);
  const [confirmSuspendIndustry, setConfirmSuspendIndustry] = useState(null);
  const [rejectIndustry, setRejectIndustry] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  
  // Toast notification
  const [notification, setNotification] = useState('');

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  const fetchIndustries = async () => {
    try {
      setLoading(true);
      setApiError('');
      const res = await API.get('/admin/industries');
      setIndustriesList(res.data || []);
    } catch (err) {
      console.error('Failed to load industries from /api/admin/industries:', err);
      const msg = err.response?.status === 403 
        ? 'Access Denied: Admin privileges required to view company verifications. Please log in with an Admin account.'
        : (err.response?.data?.message || err.message || 'Failed to fetch companies from backend database.');
      setApiError(msg);
      setIndustriesList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIndustries();
  }, []);

  function getStatus(ind) {
    const s = (ind.status || '').toLowerCase();
    const vs = (ind.verificationStatus || '').toLowerCase();
    if (s === 'suspended' || vs === 'suspended' || ind.user?.isSuspended) {
      return 'Suspended';
    }
    if (s === 'rejected' || vs === 'rejected') {
      return 'Rejected';
    }
    if (ind.user?.isVerified || s === 'verified' || vs === 'verified') {
      return 'Verified';
    }
    return 'Pending';
  }

  function getRoleLabel(role, rolesArray) {
    const r = (role || '').toLowerCase();
    const roles = Array.isArray(rolesArray) ? rolesArray.map(x => (x || '').toLowerCase()) : [];
    if (r === 'both' || (roles.includes('buyer') && roles.includes('seller'))) return 'Seller / Buyer';
    if (r === 'receiver' || r === 'buyer' || roles.includes('buyer')) return 'Buyer';
    if (r === 'sender' || r === 'seller' || roles.includes('seller')) return 'Seller';
    return 'Industry User';
  }

  // Filtered and Sorted Industries
  const filteredIndustries = useMemo(() => {
    return industriesList.filter(ind => {
      // 1. Search Query (matches companyName, email, registrationNumber, category, city, address, waste, phone)
      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const matches = 
          (ind.companyName || '').toLowerCase().includes(q) ||
          (ind.user?.email || '').toLowerCase().includes(q) ||
          (ind.registrationNumber || '').toLowerCase().includes(q) ||
          (ind.industryType || '').toLowerCase().includes(q) ||
          (ind.city || '').toLowerCase().includes(q) ||
          (ind.address || '').toLowerCase().includes(q) ||
          (ind.contactPhone || '').toLowerCase().includes(q) ||
          (ind.neededWasteTypes || '').toLowerCase().includes(q) ||
          (ind.description || '').toLowerCase().includes(q);
        if (!matches) return false;
      }

      // 2. Role Filter (All, Seller, Buyer, Seller / Buyer)
      if (roleFilter !== 'All') {
        const role = (ind.businessRole || '').toLowerCase();
        const roles = Array.isArray(ind.roles) ? ind.roles.map(x => (x || '').toLowerCase()) : [];
        if (roleFilter === 'Seller' && !(role === 'sender' || role === 'seller' || roles.includes('seller'))) return false;
        if (roleFilter === 'Buyer' && !(role === 'receiver' || role === 'buyer' || roles.includes('buyer'))) return false;
        if (roleFilter === 'Seller / Buyer' && !(role === 'both' || (roles.includes('seller') && roles.includes('buyer')))) return false;
      }

      // 3. Status Filter (Pending, Verified, Rejected, Suspended)
      const currentStatus = getStatus(ind);
      if (statusFilter !== 'All') {
        if (statusFilter.toLowerCase() !== currentStatus.toLowerCase()) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortOrder === 'Newest First') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      if (sortOrder === 'Oldest First') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      if (sortOrder === 'Name A-Z') return (a.companyName || '').localeCompare(b.companyName || '');
      return 0;
    });
  }, [industriesList, searchQuery, roleFilter, statusFilter, sortOrder]);

  // Verification Action
  const handleConfirmVerify = async () => {
    if (!confirmVerifyIndustry) return;
    setSubmittingAction(true);
    try {
      await API.patch(`/admin/industries/${confirmVerifyIndustry._id}/status`, { status: 'verified' });
      showNotification(`"${confirmVerifyIndustry.companyName}" verified successfully.`);
      setConfirmVerifyIndustry(null);
      await fetchIndustries();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to verify company.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Reject Action
  const handleConfirmReject = async () => {
    if (!rejectIndustry) return;
    setSubmittingAction(true);
    try {
      await API.patch(`/admin/industries/${rejectIndustry._id}/status`, { 
        status: 'rejected', 
        reason: rejectionReason 
      });
      showNotification(`"${rejectIndustry.companyName}" registration rejected.`);
      setRejectIndustry(null);
      setRejectionReason('');
      await fetchIndustries();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to reject company.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Suspend Action
  const handleConfirmSuspend = async () => {
    if (!confirmSuspendIndustry) return;
    setSubmittingAction(true);
    try {
      await API.patch(`/admin/industries/${confirmSuspendIndustry._id}/status`, { status: 'suspended' });
      showNotification(`"${confirmSuspendIndustry.companyName}" suspended.`);
      setConfirmSuspendIndustry(null);
      await fetchIndustries();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to suspend company.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const columns = [
      { label: 'Company Name', key: 'companyName' },
      { label: 'Email', key: (i) => i.user?.email || 'N/A' },
      { label: 'Role', key: (i) => getRoleLabel(i.businessRole, i.roles) },
      { label: 'Category', key: 'industryType' },
      { label: 'CIN/GSTIN', key: (i) => i.registrationNumber || 'N/A' },
      { label: 'Phone', key: (i) => i.contactPhone || 'N/A' },
      { label: 'Address', key: (i) => `${i.address || ''}, ${i.city || ''}` },
      { label: 'Waste / Feedstock', key: (i) => i.neededWasteTypes || 'N/A' },
      { label: 'Status', key: (i) => getStatus(i) },
      { label: 'Registration Date', key: (i) => i.createdAt ? new Date(i.createdAt).toLocaleDateString() : 'N/A' }
    ];
    exportToCSV(filteredIndustries, columns, 'ecolink-company-verification.csv');
  };

  // Export PDF
  const handleExportPDF = () => {
    const headers = ['Company', 'Email', 'Role', 'Category', 'CIN/GSTIN', 'City', 'Status', 'Reg Date'];
    const rows = filteredIndustries.map(i => [
      i.companyName || 'Unnamed',
      i.user?.email || 'N/A',
      getRoleLabel(i.businessRole, i.roles),
      i.industryType || 'General',
      i.registrationNumber || 'N/A',
      i.city || 'Regional',
      getStatus(i),
      i.createdAt ? new Date(i.createdAt).toLocaleDateString() : 'N/A'
    ]);
    const filters = [
      { label: 'Role', value: roleFilter },
      { label: 'Status', value: statusFilter },
      { label: 'Sort', value: sortOrder },
      ...(searchQuery ? [{ label: 'Search', value: searchQuery }] : [])
    ];
    exportToPDF({
      title: 'EcoLink Company Verification Report',
      filename: 'ecolink-company-verification.pdf',
      filters,
      headers,
      rows
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6 font-sans">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-3xl border border-[#DDE7E2] shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-[#12233F] tracking-tight">
                Company Verification
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#EAF8F2] text-[#009B6B] border border-[#009B6B]/30">
                {filteredIndustries.length} Companies
              </span>
            </div>
            <p className="text-xs text-[#5F6B7A] font-medium mt-1">
              Live MongoDB database directory of manually registered industrial Sellers and Buyers with legal verification oversight.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={fetchIndustries}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl border border-[#DDE7E2] bg-white hover:bg-[#F6F8F7] text-[#12233F] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
              title="Refresh database records"
            >
              <FiRefreshCw className={`w-3.5 h-3.5 text-[#009B6B] ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl border border-[#DDE7E2] bg-white hover:bg-[#F6F8F7] text-[#12233F] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <FiDownload className="w-3.5 h-3.5 text-[#009B6B]" />
              <span>CSV</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="px-3.5 py-2 rounded-xl bg-[#009B6B] hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <FiFileText className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
          </div>
        </div>

        {/* API Error Alert */}
        {apiError && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-bold flex items-start gap-3">
            <FiAlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-extrabold text-red-900">Database Connection / Authorization Issue</div>
              <p className="font-medium text-red-700">{apiError}</p>
              {apiError.includes('Access Denied') && (
                <div className="pt-1">
                  <Link to="/login" className="inline-flex items-center gap-1 text-xs font-bold text-red-900 underline">
                    Log in with an Admin account &rarr;
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notification Toast */}
        {notification && (
          <div className="p-4 bg-[#EAF8F2] border border-[#009B6B]/40 text-[#009B6B] rounded-2xl text-xs font-bold flex items-center gap-2">
            <FiCheckCircle className="w-4 h-4 text-[#009B6B] shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="bg-white p-5 rounded-3xl border border-[#DDE7E2] shadow-2xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            
            {/* Search Input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#009B6B] pointer-events-none">
                <FiSearch className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search company, email, CIN, category, city..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#DDE7E2] text-xs text-[#12233F] placeholder-gray-400 focus:outline-none focus:border-[#009B6B] focus:ring-1 focus:ring-[#009B6B] font-medium bg-[#F6F8F7]"
              />
            </div>

            {/* Role Filter */}
            <div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#DDE7E2] text-xs text-[#12233F] focus:outline-none focus:border-[#009B6B] font-bold bg-[#F6F8F7] cursor-pointer"
              >
                <option value="All">Role: All</option>
                <option value="Seller">Seller (Producers)</option>
                <option value="Buyer">Buyer (Recyclers)</option>
                <option value="Seller / Buyer">Seller / Buyer</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#DDE7E2] text-xs text-[#12233F] focus:outline-none focus:border-[#009B6B] font-bold bg-[#F6F8F7] cursor-pointer"
              >
                <option value="All">Status: All</option>
                <option value="Pending">Pending</option>
                <option value="Verified">Verified</option>
                <option value="Rejected">Rejected</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>

            {/* Sort Filter */}
            <div>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#DDE7E2] text-xs text-[#12233F] focus:outline-none focus:border-[#009B6B] font-bold bg-[#F6F8F7] cursor-pointer"
              >
                <option value="Newest First">Sort: Newest First</option>
                <option value="Oldest First">Sort: Oldest First</option>
                <option value="Name A-Z">Sort: Name A-Z</option>
              </select>
            </div>

          </div>
        </div>

        {/* Directory Table */}
        <div className="bg-white rounded-3xl border border-[#DDE7E2] shadow-2xs overflow-hidden">
          {loading ? (
            <div className="py-20 flex justify-center">
              <Loader />
            </div>
          ) : filteredIndustries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#F6F8F7] border-b border-[#DDE7E2] text-[11px] font-extrabold text-[#5F6B7A] uppercase tracking-wider">
                    <th className="py-4 px-4">Company & Email</th>
                    <th className="py-4 px-4">Role</th>
                    <th className="py-4 px-4">Category</th>
                    <th className="py-4 px-4">CIN / GSTIN</th>
                    <th className="py-4 px-4">Location</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-4">Reg Date</th>
                    <th className="py-4 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE7E2]/60 font-medium text-[#12233F]">
                  {filteredIndustries.map((ind) => {
                    const status = getStatus(ind);
                    const roleLabel = getRoleLabel(ind.businessRole, ind.roles);
                    return (
                      <tr key={ind._id} className="hover:bg-[#F6F8F7]/80 transition-colors">
                        {/* Company Name & Email */}
                        <td className="py-4 px-4">
                          <div className="font-extrabold text-[#12233F]">{ind.companyName || 'Unnamed Facility'}</div>
                          <div className="text-[11px] text-[#5F6B7A] font-mono">{ind.user?.email || 'N/A'}</div>
                        </td>

                        {/* Role */}
                        <td className="py-4 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                            roleLabel === 'Buyer'
                              ? 'bg-teal-50 text-teal-800 border border-teal-200'
                              : roleLabel === 'Seller / Buyer'
                              ? 'bg-purple-50 text-purple-800 border border-purple-200'
                              : 'bg-[#EAF8F2] text-[#009B6B] border border-[#009B6B]/30'
                          }`}>
                            {roleLabel}
                          </span>
                        </td>

                        {/* Category */}
                        <td className="py-4 px-4 font-medium text-[#12233F]">
                          <span className="px-2 py-0.5 bg-gray-100 rounded-lg text-[11px] font-semibold text-gray-700">
                            {ind.industryType || 'Manufacturing'}
                          </span>
                        </td>

                        {/* CIN / GSTIN */}
                        <td className="py-4 px-4 font-mono text-[11px] text-[#12233F]">
                          {ind.registrationNumber || 'N/A'}
                        </td>

                        {/* Location */}
                        <td className="py-4 px-4 text-[#5F6B7A]">
                          <div className="font-medium text-[#12233F]">{ind.city || 'Regional'}</div>
                          <div className="text-[10px] text-gray-400 truncate max-w-[150px]">{ind.address || ''}</div>
                        </td>

                        {/* Verification Status */}
                        <td className="py-4 px-4">
                          {status === 'Suspended' ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-red-100 text-red-800 border border-red-200">
                              Suspended
                            </span>
                          ) : status === 'Rejected' ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-gray-100 text-gray-800 border border-gray-300">
                              Rejected
                            </span>
                          ) : status === 'Verified' ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-[#EAF8F2] text-[#009B6B] border border-[#009B6B]/30 flex items-center gap-1 w-fit">
                              <FiCheckCircle className="w-3 h-3" /> Verified
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1 w-fit">
                              <FiAlertCircle className="w-3 h-3" /> Pending
                            </span>
                          )}
                        </td>

                        {/* Reg Date */}
                        <td className="py-4 px-4 text-[#5F6B7A] text-[11px] whitespace-nowrap">
                          {ind.createdAt ? new Date(ind.createdAt).toLocaleDateString() : 'Active'}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 text-right space-x-1.5 whitespace-nowrap">
                          {/* VIEW BUTTON */}
                          <button
                            onClick={() => setViewIndustry(ind)}
                            className="px-2.5 py-1.5 rounded-xl bg-[#F6F8F7] hover:bg-[#EAF8F2] text-[#12233F] hover:text-[#009B6B] font-bold text-xs transition-all border border-[#DDE7E2] cursor-pointer inline-flex items-center gap-1"
                            title="View Details"
                          >
                            <FiEye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>

                          {/* VERIFY BUTTON (Only if Pending or Rejected) */}
                          {status !== 'Verified' && status !== 'Suspended' && (
                            <button
                              onClick={() => setConfirmVerifyIndustry(ind)}
                              className="px-3 py-1.5 rounded-xl bg-[#009B6B] hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-2xs cursor-pointer inline-flex items-center gap-1"
                            >
                              <FiCheck className="w-3.5 h-3.5" />
                              <span>Verify</span>
                            </button>
                          )}

                          {/* REJECT BUTTON (Only if Pending) */}
                          {status === 'Pending' && (
                            <button
                              onClick={() => { setRejectIndustry(ind); setRejectionReason(''); }}
                              className="px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-all border border-gray-300 cursor-pointer inline-flex items-center gap-1"
                            >
                              <FiX className="w-3.5 h-3.5 text-gray-500" />
                              <span>Reject</span>
                            </button>
                          )}

                          {/* SUSPEND BUTTON (Only if Verified) */}
                          {status === 'Verified' && (
                            <button
                              onClick={() => setConfirmSuspendIndustry(ind)}
                              className="px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs transition-all border border-red-200 cursor-pointer inline-flex items-center gap-1"
                              title="Suspend Company"
                            >
                              <FiSlash className="w-3.5 h-3.5" />
                              <span>Suspend</span>
                            </button>
                          )}

                          {/* REACTIVATE BUTTON (Only if Suspended) */}
                          {status === 'Suspended' && (
                            <button
                              onClick={() => setConfirmVerifyIndustry(ind)}
                              className="px-3 py-1.5 rounded-xl bg-[#009B6B] hover:bg-emerald-700 text-white font-bold text-xs transition-all cursor-pointer inline-flex items-center gap-1"
                            >
                              <FiCheck className="w-3.5 h-3.5" />
                              <span>Reactivate</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center text-xs text-[#5F6B7A] space-y-2">
              <FiUsers className="w-8 h-8 mx-auto text-gray-300" />
              <p className="font-bold text-[#12233F]">No matching companies found.</p>
              <p>Try adjusting your search query, role filter, or status filter.</p>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 1. VIEW COMPANY DRAWER / MODAL WITH ALL 12 REQUIRED FIELDS */}
        {/* ------------------------------------------------------------- */}
        {viewIndustry && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-[#DDE7E2] shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
              
              <div className="flex justify-between items-start border-b border-[#DDE7E2] pb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-black text-[#12233F]">{viewIndustry.companyName}</h2>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      getStatus(viewIndustry) === 'Verified' ? 'bg-[#EAF8F2] text-[#009B6B] border border-[#009B6B]/30' :
                      getStatus(viewIndustry) === 'Suspended' ? 'bg-red-100 text-red-800' :
                      getStatus(viewIndustry) === 'Rejected' ? 'bg-gray-100 text-gray-800' :
                      'bg-amber-100 text-amber-900'
                    }`}>
                      {getStatus(viewIndustry)}
                    </span>
                  </div>
                  <span className="text-xs text-[#009B6B] font-extrabold uppercase mt-0.5 block">
                    {viewIndustry.industryType || 'Industrial Manufacturing'}
                  </span>
                </div>
                <button
                  onClick={() => setViewIndustry(null)}
                  className="p-2 rounded-xl bg-[#F6F8F7] hover:bg-gray-200 text-[#12233F] cursor-pointer"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>

              {/* Company Details Grid (All 12 Requirements) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                
                {/* 1. Company Name */}
                <div className="p-3 bg-[#F6F8F7] rounded-2xl space-y-1">
                  <span className="font-extrabold text-[#5F6B7A] uppercase tracking-wider text-[10px]">1. Company Legal Name</span>
                  <div className="font-bold text-[#12233F]">{viewIndustry.companyName || 'N/A'}</div>
                </div>

                {/* 2. Email */}
                <div className="p-3 bg-[#F6F8F7] rounded-2xl space-y-1">
                  <span className="font-extrabold text-[#5F6B7A] uppercase tracking-wider text-[10px]">2. Corporate Email</span>
                  <div className="font-bold text-[#12233F] font-mono">{viewIndustry.user?.email || 'N/A'}</div>
                </div>

                {/* 3. Role */}
                <div className="p-3 bg-[#F6F8F7] rounded-2xl space-y-1">
                  <span className="font-extrabold text-[#5F6B7A] uppercase tracking-wider text-[10px]">3. Participation Role</span>
                  <div className="font-bold text-[#12233F]">{getRoleLabel(viewIndustry.businessRole, viewIndustry.roles)}</div>
                </div>

                {/* 4. Category */}
                <div className="p-3 bg-[#F6F8F7] rounded-2xl space-y-1">
                  <span className="font-extrabold text-[#5F6B7A] uppercase tracking-wider text-[10px]">4. Industry Category / Sector</span>
                  <div className="font-bold text-[#12233F]">{viewIndustry.industryType || 'Industrial Manufacturing'}</div>
                </div>

                {/* 5. Registration Number */}
                <div className="p-3 bg-[#F6F8F7] rounded-2xl space-y-1">
                  <span className="font-extrabold text-[#5F6B7A] uppercase tracking-wider text-[10px]">5. CIN / GSTIN Registration</span>
                  <div className="font-mono font-bold text-[#12233F]">{viewIndustry.registrationNumber || 'N/A'}</div>
                </div>

                {/* 6. Phone Number */}
                <div className="p-3 bg-[#F6F8F7] rounded-2xl space-y-1">
                  <span className="font-extrabold text-[#5F6B7A] uppercase tracking-wider text-[10px]">6. Contact Phone</span>
                  <div className="font-bold text-[#12233F]">{viewIndustry.contactPhone || '+91 9876543210'}</div>
                </div>

                {/* 7. Address */}
                <div className="p-3 bg-[#F6F8F7] rounded-2xl space-y-1">
                  <span className="font-extrabold text-[#5F6B7A] uppercase tracking-wider text-[10px]">7. Facility Address & City</span>
                  <div className="font-bold text-[#12233F]">{viewIndustry.address || 'Industrial Area'}, {viewIndustry.city || 'Regional Facility'}</div>
                </div>

                {/* 8. Registration Date */}
                <div className="p-3 bg-[#F6F8F7] rounded-2xl space-y-1">
                  <span className="font-extrabold text-[#5F6B7A] uppercase tracking-wider text-[10px]">8. Registration Date</span>
                  <div className="font-bold text-[#12233F]">
                    {viewIndustry.createdAt ? new Date(viewIndustry.createdAt).toLocaleString() : 'N/A'}
                  </div>
                </div>

                {/* 9. Waste / Resource & Buyer Requirement */}
                <div className="p-3 bg-[#F6F8F7] rounded-2xl space-y-1 sm:col-span-2">
                  <span className="font-extrabold text-[#5F6B7A] uppercase tracking-wider text-[10px]">
                    9 & 10. Waste Stream Profile / Buyer Requirement Feedstock
                  </span>
                  <div className="font-bold text-[#12233F] bg-white p-2.5 rounded-xl border border-gray-200">
                    {viewIndustry.neededWasteTypes || 'Byproducts & Secondary Raw Materials'}
                  </div>
                </div>

                {/* 11. Company Description */}
                <div className="p-3 bg-[#F6F8F7] rounded-2xl space-y-1 sm:col-span-2">
                  <span className="font-extrabold text-[#5F6B7A] uppercase tracking-wider text-[10px]">11. Company Description & Overview</span>
                  <p className="text-gray-700 text-xs bg-white p-2.5 rounded-xl border border-gray-200 leading-relaxed">
                    {viewIndustry.description || 'Facility profile and circular material exchange objectives.'}
                  </p>
                </div>

                {/* 12. Verification Status & Reason */}
                <div className="p-3 bg-[#F6F8F7] rounded-2xl space-y-1 sm:col-span-2">
                  <span className="font-extrabold text-[#5F6B7A] uppercase tracking-wider text-[10px]">12. Verification Status</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#12233F]">{getStatus(viewIndustry)}</span>
                    {viewIndustry.rejectionReason && (
                      <span className="text-xs text-red-600 font-semibold">(Reason: {viewIndustry.rejectionReason})</span>
                    )}
                  </div>
                </div>

              </div>

              {/* Close Button */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#DDE7E2]">
                <button
                  onClick={() => setViewIndustry(null)}
                  className="px-6 py-2.5 rounded-xl bg-[#12233F] hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 2. VERIFY CONFIRMATION MODAL */}
        {/* ------------------------------------------------------------- */}
        {confirmVerifyIndustry && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#DDE7E2] shadow-2xl text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#EAF8F2] text-[#009B6B] flex items-center justify-center mx-auto text-xl font-bold">
                <FiCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-[#12233F]">Verify this company?</h3>
              <p className="text-xs text-[#5F6B7A] font-medium leading-relaxed">
                Are you sure you want to verify <strong>{confirmVerifyIndustry.companyName}</strong>? The company will immediately gain full access to post listings, request secondary streams, and finalize exchanges.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setConfirmVerifyIndustry(null)}
                  disabled={submittingAction}
                  className="flex-1 py-2.5 rounded-xl border border-[#DDE7E2] text-xs font-bold text-[#12233F] hover:bg-[#F6F8F7] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmVerify}
                  disabled={submittingAction}
                  className="flex-1 py-2.5 rounded-xl bg-[#009B6B] hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  {submittingAction ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 3. REJECT REASON MODAL */}
        {/* ------------------------------------------------------------- */}
        {rejectIndustry && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#DDE7E2] shadow-2xl space-y-4">
              <div className="flex items-center gap-2 border-b border-[#DDE7E2] pb-3">
                <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
                  <FiX className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#12233F]">Reject Company</h3>
                  <p className="text-[11px] text-[#5F6B7A] font-medium">{rejectIndustry.companyName}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#5F6B7A]">
                  Rejection Reason:
                </label>
                <textarea
                  rows="3"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Incomplete GST documents, invalid registration number..."
                  className="w-full p-3 bg-[#F6F8F7] border border-[#DDE7E2] rounded-2xl text-xs font-medium focus:outline-none focus:border-red-500 text-[#12233F]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setRejectIndustry(null); setRejectionReason(''); }}
                  disabled={submittingAction}
                  className="flex-1 py-2.5 rounded-xl border border-[#DDE7E2] text-xs font-bold text-[#12233F] hover:bg-[#F6F8F7] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReject}
                  disabled={submittingAction}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  {submittingAction ? 'Rejecting...' : 'Reject Company'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 4. SUSPEND CONFIRMATION MODAL */}
        {/* ------------------------------------------------------------- */}
        {confirmSuspendIndustry && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#DDE7E2] shadow-2xl text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto text-xl font-bold">
                <FiSlash className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-[#12233F]">Suspend this company?</h3>
              <p className="text-xs text-[#5F6B7A] font-medium leading-relaxed">
                Are you sure you want to suspend <strong>{confirmSuspendIndustry.companyName}</strong>? The company will be prevented from completing new exchanges and their active listings will be temporarily paused.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setConfirmSuspendIndustry(null)}
                  disabled={submittingAction}
                  className="flex-1 py-2.5 rounded-xl border border-[#DDE7E2] text-xs font-bold text-[#12233F] hover:bg-[#F6F8F7] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSuspend}
                  disabled={submittingAction}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  {submittingAction ? 'Suspending...' : 'Suspend'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
