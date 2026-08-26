import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import API from '../../services/authAPI';
import AdminLayout from '../../layouts/AdminLayout';
import Loader from '../../components/Loader';
import { formatINR } from '../../utils/formatINR';
import { exportToCSV, exportToPDF } from '../../utils/exportUtils';
import { 
  FiShoppingBag, FiSearch, FiCheckCircle, 
  FiEye, FiCheck, FiX, 
  FiDownload, FiFileText, FiRefreshCw, FiImage, FiAlertCircle
} from 'react-icons/fi';
import { CANONICAL_CATEGORIES, normalizeCategory } from '../../constants/categories';

export default function AdminWasteListings() {
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState([]);
  const [apiError, setApiError] = useState('');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('Newest First');
  
  // Modals & Action States
  const [viewListing, setViewListing] = useState(null);
  const [confirmApproveListing, setConfirmApproveListing] = useState(null);
  const [rejectListing, setRejectListing] = useState(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  
  // Track broken image URLs
  const [brokenImages, setBrokenImages] = useState(new Set());

  // Toast
  const [notification, setNotification] = useState('');

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  const fetchListings = async () => {
    try {
      setLoading(true);
      setApiError('');
      const res = await API.get('/admin/waste-listings');
      setListings(res.data || []);
    } catch (err) {
      console.error('Failed to load waste listings from /api/admin/waste-listings:', err);
      const msg = err.response?.status === 403 
        ? 'Access Denied: Admin privileges required to view waste listings. Please log in with an Admin account.'
        : (err.response?.data?.message || err.message || 'Failed to fetch waste listings from backend database.');
      setApiError(msg);
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const getImageSource = (url) => {
    if (!url || typeof url !== 'string' || url.trim() === '') return null;
    const cleanUrl = url.trim();
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://') || cleanUrl.startsWith('data:')) {
      return cleanUrl;
    }
    const backendHost = 'http://localhost:5000';
    return `${backendHost}${cleanUrl.startsWith('/') ? '' : '/'}${cleanUrl}`;
  };

  const handleImageError = (id) => {
    setBrokenImages(prev => new Set(prev).add(id));
  };

  function getNormalizedStatus(status) {
    const s = (status || '').toLowerCase().trim();
    if (s === 'pending') return 'Pending';
    if (s === 'active' || s === 'available' || s === 'approved') return 'Approved';
    if (s === 'rejected') return 'Rejected';
    if (s === 'exchanged' || s === 'sold' || s === 'completed' || s === 'recycled' || s === 'in_transit' || s === 'reserved') return 'Exchanged';
    return 'Pending';
  }

  function getStatusBadge(status) {
    const norm = getNormalizedStatus(status);
    if (norm === 'Approved') {
      return { label: 'Approved', style: 'bg-[#EAF8F2] text-[#009B6B] border border-[#009B6B]/30' };
    }
    if (norm === 'Rejected') {
      return { label: 'Rejected', style: 'bg-red-100 text-red-800 border border-red-200' };
    }
    if (norm === 'Exchanged') {
      return { label: 'Exchanged', style: 'bg-blue-100 text-blue-800 border border-blue-200' };
    }
    return { label: 'Pending', style: 'bg-amber-100 text-amber-900 border border-amber-200' };
  }

  // Filtered Listings
  const filteredListings = useMemo(() => {
    return listings.filter(item => {
      // 1. Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const matches = 
          (item.name || '').toLowerCase().includes(q) ||
          (item.category || '').toLowerCase().includes(q) ||
          (item.subCategory || '').toLowerCase().includes(q) ||
          (item.uploader?.companyName || '').toLowerCase().includes(q) ||
          (item.uploader?.email || '').toLowerCase().includes(q) ||
          (item.city || '').toLowerCase().includes(q) ||
          (item.address || '').toLowerCase().includes(q) ||
          (item.batchId || '').toLowerCase().includes(q);
        if (!matches) return false;
      }

      // 2. Category Filter
      if (categoryFilter !== 'All') {
        const cat = (item.category || '').toLowerCase();
        const target = categoryFilter.toLowerCase();
        if (!cat.includes(target) && !(item.name || '').toLowerCase().includes(target)) return false;
      }

      // 3. Status Filter (All, Pending, Approved, Rejected, Exchanged)
      if (statusFilter !== 'All') {
        const norm = getNormalizedStatus(item.status);
        if (statusFilter !== norm) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortOrder === 'Newest First') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      if (sortOrder === 'Oldest First') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      if (sortOrder === 'Highest Quantity') return (b.quantity || 0) - (a.quantity || 0);
      if (sortOrder === 'Highest Price') return (b.price || 0) - (a.price || 0);
      if (sortOrder === 'Name A-Z') return (a.name || '').localeCompare(b.name || '');
      return 0;
    });
  }, [listings, searchQuery, categoryFilter, statusFilter, sortOrder]);

  // Handle Approve
  const handleConfirmApprove = async () => {
    if (!confirmApproveListing) return;
    setSubmittingAction(true);
    try {
      await API.patch(`/admin/waste-listings/${confirmApproveListing._id}/status`, { status: 'active' });
      showNotification(`"${confirmApproveListing.name}" approved successfully.`);
      setConfirmApproveListing(null);
      await fetchListings();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to approve listing.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Handle Reject
  const handleConfirmReject = async () => {
    if (!rejectListing) return;
    setSubmittingAction(true);
    try {
      await API.patch(`/admin/waste-listings/${rejectListing._id}/status`, { 
        status: 'rejected', 
        note: rejectionNote 
      });
      showNotification(`"${rejectListing.name}" rejected.`);
      setRejectListing(null);
      setRejectionNote('');
      await fetchListings();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to reject listing.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const columns = [
      { label: 'Material Name', key: 'name' },
      { label: 'Category', key: 'category' },
      { label: 'Seller Facility', key: (w) => w.uploader?.companyName || 'N/A' },
      { label: 'Quantity', key: (w) => `${w.quantity || 0} ${w.unit || 'kg'}` },
      { label: 'Quality Grade', key: (w) => w.qualityGrade || 'Grade A' },
      { label: 'Price', key: (w) => `₹${w.price || 0}` },
      { label: 'Location', key: (w) => `${w.city || ''}, ${w.address || ''}` },
      { label: 'Status', key: (w) => getStatusBadge(w.status).label },
      { label: 'Listed Date', key: (w) => w.createdAt ? new Date(w.createdAt).toLocaleDateString() : 'N/A' }
    ];
    exportToCSV(filteredListings, columns, 'ecolink-waste-listings.csv');
  };

  // Export PDF
  const handleExportPDF = () => {
    const headers = ['Material', 'Category', 'Seller', 'Quantity', 'Grade', 'Price', 'Location', 'Status'];
    const rows = filteredListings.map(w => [
      w.name || 'Unnamed Stream',
      w.category || 'Other',
      w.uploader?.companyName || 'N/A',
      `${w.quantity || 0} ${w.unit || 'kg'}`,
      w.qualityGrade || 'Grade A',
      `₹${w.price || 0}`,
      w.city || 'Regional',
      getStatusBadge(w.status).label
    ]);
    const filters = [
      { label: 'Category', value: categoryFilter },
      { label: 'Status', value: statusFilter },
      { label: 'Sort', value: sortOrder },
      ...(searchQuery ? [{ label: 'Search', value: searchQuery }] : [])
    ];
    exportToPDF({
      title: 'EcoLink Waste Listings Moderation Report',
      filename: 'ecolink-waste-listings.pdf',
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
                Waste Listings
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#EAF8F2] text-[#009B6B] border border-[#009B6B]/30">
                {filteredListings.length} Listings
              </span>
            </div>
            <p className="text-xs text-[#5F6B7A] font-medium mt-1">
              Review, verify images, and moderate industrial byproduct streams before public marketplace availability.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={fetchListings}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl border border-[#DDE7E2] bg-white hover:bg-[#F6F8F7] text-[#12233F] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
              title="Refresh database listings"
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
                placeholder="Search material, seller, batch, city..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#DDE7E2] text-xs text-[#12233F] placeholder-gray-400 focus:outline-none focus:border-[#009B6B] focus:ring-1 focus:ring-[#009B6B] font-medium bg-[#F6F8F7]"
              />
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#DDE7E2] text-xs text-[#12233F] focus:outline-none focus:border-[#009B6B] font-bold bg-[#F6F8F7] cursor-pointer"
              >
                <option value="All">Category: All</option>
                {CANONICAL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Status Filter (Pending, Approved, Rejected, Exchanged) */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#DDE7E2] text-xs text-[#12233F] focus:outline-none focus:border-[#009B6B] font-bold bg-[#F6F8F7] cursor-pointer"
              >
                <option value="All">Status: All</option>
                <option value="Pending">Pending Moderation</option>
                <option value="Approved">Approved (Marketplace Active)</option>
                <option value="Rejected">Rejected</option>
                <option value="Exchanged">Exchanged</option>
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
                <option value="Highest Quantity">Sort: Highest Quantity</option>
                <option value="Highest Price">Sort: Highest Price</option>
                <option value="Name A-Z">Sort: Name A-Z</option>
              </select>
            </div>

          </div>
        </div>

        {/* Listings Table */}
        <div className="bg-white rounded-3xl border border-[#DDE7E2] shadow-2xs overflow-hidden">
          {loading ? (
            <div className="py-20 flex justify-center">
              <Loader />
            </div>
          ) : filteredListings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#F6F8F7] border-b border-[#DDE7E2] text-[11px] font-extrabold text-[#5F6B7A] uppercase tracking-wider">
                    <th className="py-4 px-4">Material Stream</th>
                    <th className="py-4 px-4">Category</th>
                    <th className="py-4 px-4">Seller Facility</th>
                    <th className="py-4 px-4">Quantity</th>
                    <th className="py-4 px-4">Quality Grade</th>
                    <th className="py-4 px-4">Price</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE7E2]/60 font-medium text-[#12233F]">
                  {filteredListings.map((item) => {
                    const normStatus = getNormalizedStatus(item.status);
                    const badge = getStatusBadge(item.status);
                    const rawImgSrc = getImageSource(item.imageUrl);
                    const isBroken = brokenImages.has(item._id);
                    const hasValidImg = rawImgSrc && !isBroken;

                    return (
                      <tr key={item._id} className="hover:bg-[#F6F8F7]/80 transition-colors">
                        
                        {/* Material Stream with Image Thumbnail */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {/* Image Box */}
                            <div className="w-12 h-12 rounded-xl bg-gray-100 border border-[#DDE7E2] shrink-0 overflow-hidden flex items-center justify-center relative">
                              {hasValidImg ? (
                                <img
                                  src={rawImgSrc}
                                  alt={item.name}
                                  onError={() => handleImageError(item._id)}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="flex flex-col items-center justify-center text-gray-400 p-1 text-center">
                                  <FiImage className="w-4 h-4 text-gray-400" />
                                  <span className="text-[8px] font-bold uppercase text-gray-400 leading-none mt-0.5">No img</span>
                                </div>
                              )}
                            </div>

                            <div>
                              <div className="font-extrabold text-[#12233F]">{item.name}</div>
                              <div className="text-[11px] text-[#5F6B7A] font-mono">
                                Batch: {item.batchId || 'EL-BATCH-001'} &bull; {item.city || 'Regional'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-[#EAF8F2] text-[#009B6B] border border-[#009B6B]/30">
                            {item.category || 'Secondary Material'}
                          </span>
                        </td>

                        {/* Seller Facility */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#12233F]">{item.uploader?.companyName || 'Industrial Generator'}</div>
                          <div className="text-[11px] text-[#5F6B7A] font-mono">{item.uploader?.email || 'N/A'}</div>
                        </td>

                        {/* Quantity */}
                        <td className="py-3 px-4 font-bold text-[#12233F]">
                          {item.quantity} {item.unit || 'kg'}
                        </td>

                        {/* Quality Grade */}
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#F6F8F7] border border-[#DDE7E2] text-[#12233F]">
                            {item.qualityGrade || 'Grade A'}
                          </span>
                        </td>

                        {/* Price */}
                        <td className="py-3 px-4 font-extrabold text-[#009B6B]">
                          ₹{item.price} / {item.unit || 'kg'}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${badge.style}`}>
                            {badge.label}
                          </span>
                        </td>

                        {/* Context-Dependent Actions */}
                        <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                          {/* 1. VIEW BUTTON (Available for all statuses) */}
                          <button
                            onClick={() => setViewListing(item)}
                            className="px-2.5 py-1.5 rounded-xl bg-[#F6F8F7] hover:bg-[#EAF8F2] text-[#12233F] hover:text-[#009B6B] font-bold text-xs transition-all border border-[#DDE7E2] cursor-pointer inline-flex items-center gap-1"
                            title="View Material Listing"
                          >
                            <FiEye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>

                          {/* 2. APPROVE BUTTON (Only when PENDING) */}
                          {normStatus === 'Pending' && (
                            <button
                              onClick={() => setConfirmApproveListing(item)}
                              className="px-3 py-1.5 rounded-xl bg-[#009B6B] hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-2xs cursor-pointer inline-flex items-center gap-1"
                              title="Approve Listing for Marketplace"
                            >
                              <FiCheck className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                          )}

                          {/* 3. REJECT BUTTON (When PENDING or APPROVED) */}
                          {(normStatus === 'Pending' || normStatus === 'Approved') && (
                            <button
                              onClick={() => { setRejectListing(item); setRejectionNote(''); }}
                              className="px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-all border border-gray-300 cursor-pointer inline-flex items-center gap-1"
                              title="Reject Listing"
                            >
                              <FiX className="w-3.5 h-3.5 text-gray-500" />
                              <span>Reject</span>
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
              <FiShoppingBag className="w-8 h-8 mx-auto text-gray-300" />
              <p className="font-bold text-[#12233F]">No matching waste listings found.</p>
              <p>Try adjusting your search criteria, category, or status filter.</p>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 1. VIEW LISTING DRAWER / MODAL */}
        {/* ------------------------------------------------------------- */}
        {viewListing && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-[#DDE7E2] shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
              
              <div className="flex justify-between items-start border-b border-[#DDE7E2] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-[#12233F]">{viewListing.name}</h2>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${getStatusBadge(viewListing.status).style}`}>
                      {getStatusBadge(viewListing.status).label}
                    </span>
                  </div>
                  <span className="text-xs text-[#009B6B] font-extrabold uppercase mt-0.5 block">
                    {viewListing.category} &bull; Batch {viewListing.batchId || 'EL-BATCH-001'}
                  </span>
                </div>
                <button
                  onClick={() => setViewListing(null)}
                  className="p-2 rounded-xl bg-[#F6F8F7] hover:bg-gray-200 text-[#12233F] cursor-pointer"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>

              {/* Uploaded Material Photo */}
              <div className="h-56 rounded-2xl overflow-hidden bg-[#F6F8F7] border border-[#DDE7E2] flex items-center justify-center relative">
                {(() => {
                  const resolvedImg = getImageSource(viewListing.imageUrl);
                  const isBroken = brokenImages.has(viewListing._id);
                  if (resolvedImg && !isBroken) {
                    return (
                      <img
                        src={resolvedImg}
                        alt={viewListing.name}
                        onError={() => handleImageError(viewListing._id)}
                        className="w-full h-full object-cover"
                      />
                    );
                  }
                  return (
                    <div className="flex flex-col items-center justify-center text-gray-400 space-y-2 p-6 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-gray-200 flex items-center justify-center text-gray-500">
                        <FiImage className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold text-gray-500">No material image uploaded</span>
                      <span className="text-[11px] text-gray-400">Stream cataloged with verified technical manifest</span>
                    </div>
                  );
                })()}
              </div>

              {/* Listing Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                
                {/* 1. Material */}
                <div className="p-3 bg-[#F6F8F7] rounded-2xl space-y-1">
                  <span className="font-extrabold text-[#5F6B7A] uppercase tracking-wider text-[10px]">Material Name</span>
                  <div className="font-bold text-[#12233F]">{viewListing.name}</div>
                </div>

                {/* 2. Category */}
                <div className="p-3 bg-[#F6F8F7] rounded-2xl space-y-1">
                  <span className="font-extrabold text-[#5F6B7A] uppercase tracking-wider text-[10px]">Material Category</span>
                  <div className="font-bold text-[#12233F]">{viewListing.category} ({viewListing.subCategory || 'Industrial Stream'})</div>
                </div>

                {/* 3. Seller */}
                <div className="p-3 bg-[#F6F8F7] rounded-2xl space-y-1">
                  <span className="font-extrabold text-[#5F6B7A] uppercase tracking-wider text-[10px]">Seller Facility</span>
                  <div className="font-bold text-[#12233F]">{viewListing.uploader?.companyName || 'Industrial Facility'}</div>
                  <div className="text-[10px] text-[#5F6B7A] font-mono">{viewListing.uploader?.email || 'N/A'}</div>
                </div>

                {/* 4. Quantity */}
                <div className="p-3 bg-[#F6F8F7] rounded-2xl space-y-1">
                  <span className="font-extrabold text-[#5F6B7A] uppercase tracking-wider text-[10px]">Available Quantity</span>
                  <div className="font-bold text-[#12233F]">{viewListing.quantity} {viewListing.unit || 'kg'}</div>
                </div>

                {/* 5. Quality Grade */}
                <div className="p-3 bg-[#F6F8F7] rounded-2xl space-y-1">
                  <span className="font-extrabold text-[#5F6B7A] uppercase tracking-wider text-[10px]">Quality Grade / Purity</span>
                  <div className="font-bold text-[#12233F]">
                    {viewListing.qualityGrade || 'Grade A'} &bull; {viewListing.purity?.estimated || 90}% Purity
                  </div>
                </div>

                {/* 6. Price */}
                <div className="p-3 bg-[#F6F8F7] rounded-2xl space-y-1">
                  <span className="font-extrabold text-[#5F6B7A] uppercase tracking-wider text-[10px]">Listing Price</span>
                  <div className="font-bold text-[#009B6B] text-sm">₹{viewListing.price} / {viewListing.unit || 'kg'}</div>
                </div>

                {/* 7. Location */}
                <div className="p-3 bg-[#F6F8F7] rounded-2xl space-y-1">
                  <span className="font-extrabold text-[#5F6B7A] uppercase tracking-wider text-[10px]">Facility Location</span>
                  <div className="font-bold text-[#12233F]">{viewListing.address || 'Industrial Zone'}, {viewListing.city || 'Regional Hub'}</div>
                </div>

                {/* 8. Listing Status & Exchange Status */}
                <div className="p-3 bg-[#F6F8F7] rounded-2xl space-y-1">
                  <span className="font-extrabold text-[#5F6B7A] uppercase tracking-wider text-[10px]">Listing & Exchange Status</span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${getStatusBadge(viewListing.status).style}`}>
                      {getStatusBadge(viewListing.status).label}
                    </span>
                    {viewListing.exchangeInfo && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                        Order #{viewListing.exchangeInfo.orderId || 'Active'}
                      </span>
                    )}
                  </div>
                </div>

                {/* 9. Created Date */}
                <div className="p-3 bg-[#F6F8F7] rounded-2xl space-y-1 sm:col-span-2">
                  <span className="font-extrabold text-[#5F6B7A] uppercase tracking-wider text-[10px]">Listing Creation Date</span>
                  <div className="font-bold text-[#12233F]">
                    {viewListing.createdAt ? new Date(viewListing.createdAt).toLocaleString() : 'N/A'}
                  </div>
                </div>

                {/* 10. Description */}
                <div className="p-3 bg-[#F6F8F7] rounded-2xl space-y-1 sm:col-span-2">
                  <span className="font-extrabold text-[#5F6B7A] uppercase tracking-wider text-[10px]">Material Description</span>
                  <p className="text-[#12233F] leading-relaxed bg-white p-2.5 rounded-xl border border-[#DDE7E2]">
                    {viewListing.description || 'No detailed stream notes provided by generator.'}
                  </p>
                </div>

              </div>

              {/* Action Buttons in Modal */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#DDE7E2]">
                <button
                  onClick={() => setViewListing(null)}
                  className="px-6 py-2.5 rounded-xl bg-[#12233F] hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 2. APPROVE CONFIRMATION MODAL */}
        {/* ------------------------------------------------------------- */}
        {confirmApproveListing && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#DDE7E2] shadow-2xl text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#EAF8F2] text-[#009B6B] flex items-center justify-center mx-auto text-xl font-bold">
                <FiCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-[#12233F]">Approve this listing?</h3>
              <p className="text-xs text-[#5F6B7A] font-medium leading-relaxed">
                Approving <strong>{confirmApproveListing.name}</strong> will publish it to the active B2B secondary materials marketplace for buyers to request exchanges.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setConfirmApproveListing(null)}
                  disabled={submittingAction}
                  className="flex-1 py-2.5 rounded-xl border border-[#DDE7E2] text-xs font-bold text-[#12233F] hover:bg-[#F6F8F7] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmApprove}
                  disabled={submittingAction}
                  className="flex-1 py-2.5 rounded-xl bg-[#009B6B] hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  {submittingAction ? 'Approving...' : 'Approve Listing'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 3. REJECT REASON MODAL */}
        {/* ------------------------------------------------------------- */}
        {rejectListing && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#DDE7E2] shadow-2xl space-y-4">
              <div className="flex items-center gap-2 border-b border-[#DDE7E2] pb-3">
                <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
                  <FiX className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#12233F]">Reject Waste Listing</h3>
                  <p className="text-[11px] text-[#5F6B7A] font-medium">{rejectListing.name}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#5F6B7A]">
                  Rejection Reason / Note:
                </label>
                <textarea
                  rows="3"
                  value={rejectionNote}
                  onChange={(e) => setRejectionNote(e.target.value)}
                  placeholder="e.g. Uncertified hazardous waste, invalid purity specifications, pricing mismatch..."
                  className="w-full p-3 bg-[#F6F8F7] border border-[#DDE7E2] rounded-2xl text-xs font-medium focus:outline-none focus:border-red-500 text-[#12233F]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setRejectListing(null); setRejectionNote(''); }}
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
                  {submittingAction ? 'Rejecting...' : 'Reject Listing'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
