import React, { useState, useEffect, useMemo } from 'react';
import API from '../../services/authAPI';
import AdminLayout from '../../layouts/AdminLayout';
import Loader from '../../components/Loader';
import { formatINR } from '../../utils/formatINR';
import { exportToCSV, exportToPDF } from '../../utils/exportUtils';
import { 
  FiShoppingBag, FiSearch, FiCheckCircle, 
  FiXCircle, FiEye, FiCheck, FiX, 
  FiLayers, FiDollarSign, FiDownload, FiFileText, FiMapPin, FiCalendar, FiShield
} from 'react-icons/fi';

export default function AdminWasteListings() {
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState([]);
  
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
  
  // Toast
  const [notification, setNotification] = useState('');

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  const fetchListings = async () => {
    try {
      setLoading(true);
      const res = await API.get('/admin/waste-listings');
      setListings(res.data || []);
    } catch (err) {
      console.warn('Failed to load waste listings:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const getImageSource = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    const backendHost = 'http://localhost:5000';
    return `${backendHost}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  function getStatusBadge(status) {
    const s = (status || 'pending').toLowerCase();
    if (s === 'active' || s === 'available' || s === 'approved') {
      return { label: 'Approved', style: 'bg-[#EAF8F2] text-[#009B6B] border border-[#009B6B]/30' };
    }
    if (s === 'rejected') {
      return { label: 'Rejected', style: 'bg-red-100 text-red-800 border border-red-200' };
    }
    if (s === 'exchanged' || s === 'completed') {
      return { label: 'Exchanged', style: 'bg-blue-100 text-blue-800 border border-blue-200' };
    }
    return { label: 'Pending', style: 'bg-amber-100 text-amber-900 border border-amber-200' };
  }

  // Filtered Listings
  const filteredListings = useMemo(() => {
    return listings.filter(item => {
      // 1. Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches = 
          (item.name || '').toLowerCase().includes(q) ||
          (item.category || '').toLowerCase().includes(q) ||
          (item.subCategory || '').toLowerCase().includes(q) ||
          (item.uploader?.companyName || '').toLowerCase().includes(q) ||
          (item.city || '').toLowerCase().includes(q);
        if (!matches) return false;
      }

      // 2. Category Filter
      if (categoryFilter !== 'All') {
        const cat = (item.category || '').toLowerCase();
        const target = categoryFilter.toLowerCase();
        if (!cat.includes(target) && !(item.name || '').toLowerCase().includes(target)) return false;
      }

      // 3. Status Filter
      if (statusFilter !== 'All') {
        const s = (item.status || 'pending').toLowerCase();
        if (statusFilter === 'Approved' && !(s === 'active' || s === 'available' || s === 'approved')) return false;
        if (statusFilter === 'Pending' && !(s === 'pending')) return false;
        if (statusFilter === 'Rejected' && !(s === 'rejected')) return false;
        if (statusFilter === 'Exchanged' && !(s === 'exchanged' || s === 'completed')) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortOrder === 'Newest First') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      if (sortOrder === 'Oldest First') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      if (sortOrder === 'Highest Quantity') return (b.quantity || 0) - (a.quantity || 0);
      if (sortOrder === 'Highest Price') return (b.price || 0) - (a.price || 0);
      return 0;
    });
  }, [listings, searchQuery, categoryFilter, statusFilter, sortOrder]);

  // Handle Approve
  const handleConfirmApprove = async () => {
    if (!confirmApproveListing) return;
    setSubmittingAction(true);
    try {
      await API.patch(`/admin/waste-listings/${confirmApproveListing._id}/status`, { status: 'active' });
      showNotification('Listing approved successfully.');
      setConfirmApproveListing(null);
      await fetchListings();
    } catch (err) {
      alert(err.message || 'Failed to approve listing.');
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
      showNotification('Listing rejected.');
      setRejectListing(null);
      setRejectionNote('');
      await fetchListings();
    } catch (err) {
      alert(err.message || 'Failed to reject listing.');
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
      { label: 'Price (INR/kg)', key: (w) => `₹${w.price || 0}` },
      { label: 'Location', key: (w) => w.city || 'Regional Hub' },
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
            <h1 className="text-2xl sm:text-3xl font-black text-[#12233F] tracking-tight">
              Waste Listings
            </h1>
            <p className="text-xs text-[#5F6B7A] font-medium mt-1">
              Review, approve, and moderate industrial byproduct streams before public marketplace visibility.
            </p>
          </div>

          <div className="flex items-center gap-2">
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
                placeholder="Search material, seller, city..."
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
                <option value="Plastic">Plastic</option>
                <option value="Metal">Metal</option>
                <option value="Paper">Paper</option>
                <option value="Textile">Textile</option>
                <option value="Glass">Glass</option>
                <option value="Fly Ash">Fly Ash</option>
                <option value="E-Waste">E-Waste</option>
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
                <option value="Approved">Approved (Active)</option>
                <option value="Pending">Pending Moderation</option>
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
                    <th className="py-4 px-4">Material</th>
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
                    const badge = getStatusBadge(item.status);
                    const isPending = badge.label === 'Pending';
                    const isApproved = badge.label === 'Approved';

                    return (
                      <tr key={item._id} className="hover:bg-[#F6F8F7]/80 transition-colors">
                        <td className="py-4 px-4">
                          <div className="font-extrabold text-[#12233F]">{item.name}</div>
                          <div className="text-[11px] text-[#5F6B7A] font-mono">
                            Batch: {item.batchId || 'EL-BATCH-001'} &bull; {item.city || 'Regional'}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-[#EAF8F2] text-[#009B6B] border border-[#009B6B]/30">
                            {item.category || 'Secondary Material'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-bold text-[#12233F]">{item.uploader?.companyName || 'Apex Plastics'}</div>
                          <div className="text-[11px] text-[#5F6B7A] font-mono">{item.uploader?.email || 'N/A'}</div>
                        </td>
                        <td className="py-4 px-4 font-bold text-[#12233F]">
                          {item.quantity} {item.unit || 'kg'}
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#F6F8F7] border border-[#DDE7E2] text-[#12233F]">
                            {item.qualityGrade || 'Grade A'}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-extrabold text-[#009B6B]">
                          ₹{item.price} / {item.unit || 'kg'}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${badge.style}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right space-x-1.5 whitespace-nowrap">
                          {/* VIEW BUTTON */}
                          <button
                            onClick={() => setViewListing(item)}
                            className="px-2.5 py-1.5 rounded-xl bg-[#F6F8F7] hover:bg-[#EAF8F2] text-[#12233F] hover:text-[#009B6B] font-bold text-xs transition-all border border-[#DDE7E2] cursor-pointer inline-flex items-center gap-1"
                            title="View Material Listing"
                          >
                            <FiEye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>

                          {/* APPROVE BUTTON (If Pending or Rejected) */}
                          {!isApproved && (
                            <button
                              onClick={() => setConfirmApproveListing(item)}
                              className="px-3 py-1.5 rounded-xl bg-[#009B6B] hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-2xs cursor-pointer inline-flex items-center gap-1"
                            >
                              <FiCheck className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                          )}

                          {/* REJECT BUTTON (If Pending or Approved) */}
                          {badge.label !== 'Rejected' && (
                            <button
                              onClick={() => { setRejectListing(item); setRejectionNote(''); }}
                              className="px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-all border border-gray-300 cursor-pointer inline-flex items-center gap-1"
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
              <div className="h-56 rounded-2xl overflow-hidden bg-[#F6F8F7] border border-[#DDE7E2] flex items-center justify-center">
                {(() => {
                  const resolvedImg = getImageSource(viewListing.imageUrl || viewListing.image || viewListing.imagePath);
                  return resolvedImg ? (
                    <img
                      src={resolvedImg}
                      alt={viewListing.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-400 p-4">
                      <FiShield className="w-10 h-10 text-[#009B6B]/40 mb-1" />
                      <span className="text-xs font-bold text-gray-600">No image uploaded</span>
                      <span className="text-[10px] text-gray-400">Verified stream specification</span>
                    </div>
                  );
                })()}
              </div>

              {/* Listing Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-[#F6F8F7] rounded-2xl space-y-1">
                  <span className="font-extrabold text-[#5F6B7A] uppercase tracking-wider text-[10px]">Seller Company</span>
                  <div className="font-bold text-[#12233F]">{viewListing.uploader?.companyName || 'Apex Plastics Pvt. Ltd.'}</div>
                </div>

                <div className="p-3 bg-[#F6F8F7] rounded-2xl space-y-1">
                  <span className="font-extrabold text-[#5F6B7A] uppercase tracking-wider text-[10px]">Quantity Available</span>
                  <div className="font-bold text-[#12233F]">{viewListing.quantity} {viewListing.unit || 'kg'}</div>
                </div>

                <div className="p-3 bg-[#F6F8F7] rounded-2xl space-y-1">
                  <span className="font-extrabold text-[#5F6B7A] uppercase tracking-wider text-[10px]">Quality Grade</span>
                  <div className="font-bold text-[#12233F]">{viewListing.qualityGrade || 'Grade A'}</div>
                </div>

                <div className="p-3 bg-[#F6F8F7] rounded-2xl space-y-1">
                  <span className="font-extrabold text-[#5F6B7A] uppercase tracking-wider text-[10px]">Asking Price</span>
                  <div className="font-extrabold text-[#009B6B]">₹{viewListing.price} / {viewListing.unit || 'kg'}</div>
                </div>

                <div className="p-3 bg-[#F6F8F7] rounded-2xl space-y-1">
                  <span className="font-extrabold text-[#5F6B7A] uppercase tracking-wider text-[10px]">Storage Location</span>
                  <div className="font-bold text-[#12233F]">{viewListing.city || 'Regional Hub'}, {viewListing.address || 'Industrial Area'}</div>
                </div>

                <div className="p-3 bg-[#F6F8F7] rounded-2xl space-y-1">
                  <span className="font-extrabold text-[#5F6B7A] uppercase tracking-wider text-[10px]">Upload Date</span>
                  <div className="font-bold text-[#12233F]">
                    {viewListing.createdAt ? new Date(viewListing.createdAt).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>

              {viewListing.description && (
                <div className="p-3 bg-[#F6F8F7] rounded-2xl space-y-1 text-xs">
                  <span className="font-extrabold text-[#5F6B7A] uppercase tracking-wider text-[10px]">Material Description</span>
                  <p className="text-[#12233F] font-medium leading-relaxed">{viewListing.description}</p>
                </div>
              )}

              {/* Close Button */}
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
              <h3 className="text-lg font-black text-[#12233F]">Approve this material listing?</h3>
              <p className="text-xs text-[#5F6B7A] font-medium leading-relaxed">
                Approving <strong>{confirmApproveListing.name}</strong> ({confirmApproveListing.quantity} {confirmApproveListing.unit || 'kg'}) will make it immediately searchable in the marketplace.
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
                  <h3 className="text-base font-black text-[#12233F]">Reject Listing</h3>
                  <p className="text-[11px] text-[#5F6B7A] font-medium">{rejectListing.name}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#5F6B7A]">
                  Rejection Reason:
                </label>
                <textarea
                  rows="3"
                  value={rejectionNote}
                  onChange={(e) => setRejectionNote(e.target.value)}
                  placeholder="e.g. Unverified chemical hazard, excessive contamination, incorrect purity..."
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
