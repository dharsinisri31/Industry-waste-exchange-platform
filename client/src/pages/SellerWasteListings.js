import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyListings } from '../services/wasteAPI';
import DashboardLayout from '../layouts/DashboardLayout';
import { 
  FiUploadCloud, FiSearch, FiLayers, FiShield, 
  FiCheckCircle, FiClock, FiXCircle, FiRefreshCw, 
  FiMapPin, FiEye, FiZap, FiFileText, FiTag, FiAlertCircle
} from 'react-icons/fi';
import { formatINR } from '../utils/formatINR';
import { CANONICAL_CATEGORIES, normalizeCategory } from '../constants/categories';

export default function SellerWasteListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const navigate = useNavigate();

  const fetchListings = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await getMyListings();
      setListings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load seller listings:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to load your waste listings.');
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

  // Status Counts
  const counts = useMemo(() => {
    const total = listings.length;
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    let exchanged = 0;

    listings.forEach(l => {
      const st = (l.status || '').toLowerCase();
      if (st === 'pending') pending++;
      else if (st === 'approved' || st === 'available' || st === 'active') approved++;
      else if (st === 'rejected') rejected++;
      else if (st === 'exchanged' || st === 'completed' || st === 'transacted') exchanged++;
    });

    return { total, pending, approved, rejected, exchanged };
  }, [listings]);

  // Filtered Listings
  const filteredListings = useMemo(() => {
    return listings.filter(item => {
      const st = (item.status || '').toLowerCase();
      
      // Status Filter
      if (statusFilter === 'pending' && st !== 'pending') return false;
      if (statusFilter === 'approved' && !['approved', 'available', 'active'].includes(st)) return false;
      if (statusFilter === 'rejected' && st !== 'rejected') return false;
      if (statusFilter === 'exchanged' && !['exchanged', 'completed', 'transacted'].includes(st)) return false;

      // Category Filter
      if (categoryFilter !== 'all') {
        const itemCat = (item.category || '').toLowerCase();
        if (!itemCat.includes(categoryFilter.toLowerCase())) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = 
          (item.name || '').toLowerCase().includes(q) ||
          (item.category || '').toLowerCase().includes(q) ||
          (item.city || '').toLowerCase().includes(q) ||
          (item.batchId || '').toLowerCase().includes(q) ||
          (item.address || '').toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [listings, statusFilter, categoryFilter, searchQuery]);

  const renderStatusBadge = (status) => {
    const st = (status || '').toLowerCase();
    if (st === 'pending') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-50 text-amber-800 border border-amber-300">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span>Pending Verification</span>
        </span>
      );
    }
    if (st === 'approved' || st === 'available' || st === 'active') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Approved & Marketplace Live</span>
        </span>
      );
    }
    if (st === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-50 text-rose-800 border border-rose-300">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <span>Rejected / Needs Revision</span>
        </span>
      );
    }
    if (st === 'exchanged' || st === 'completed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-50 text-indigo-800 border border-indigo-300">
          <span className="w-2 h-2 rounded-full bg-indigo-500" />
          <span>Circular Exchanged</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-gray-100 text-gray-800 border border-gray-300">
        <span>{status}</span>
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12">
        
        {/* Header Bar */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-extrabold uppercase tracking-wider mb-2">
              <FiLayers className="w-3.5 h-3.5" />
              <span>Seller Catalog Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              My Waste Listings
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
              Track, inspect and monitor verification statuses for all industrial byproducts listed by your company.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/upload-waste"
              className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <FiUploadCloud className="w-4 h-4" />
              <span>Upload New Waste Stream</span>
            </Link>
          </div>
        </div>

        {/* Metrics Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold uppercase text-gray-500 tracking-wider">Total Streams</span>
            <div className="text-2xl font-black text-gray-900">{counts.total}</div>
            <span className="text-[10px] text-gray-400 font-medium">Lifetime uploaded batches</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold uppercase text-emerald-700 tracking-wider">Approved / Live</span>
            <div className="text-2xl font-black text-emerald-700">{counts.approved}</div>
            <span className="text-[10px] text-emerald-600 font-medium">Visible to verified buyers</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold uppercase text-amber-700 tracking-wider">Pending Review</span>
            <div className="text-2xl font-black text-amber-700">{counts.pending}</div>
            <span className="text-[10px] text-amber-600 font-medium">Awaiting admin assay check</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold uppercase text-indigo-700 tracking-wider">Exchanged</span>
            <div className="text-2xl font-black text-indigo-700">{counts.exchanged}</div>
            <span className="text-[10px] text-indigo-600 font-medium">Successfully transacted</span>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-3">
            {[
              { key: 'all', label: 'All Streams', count: counts.total },
              { key: 'approved', label: 'Approved & Live', count: counts.approved },
              { key: 'pending', label: 'Pending Verification', count: counts.pending },
              { key: 'rejected', label: 'Needs Revision', count: counts.rejected },
              { key: 'exchanged', label: 'Exchanged', count: counts.exchanged }
            ].map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === tab.key
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  statusFilter === tab.key ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search & Category Select */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
                <FiSearch className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by material title, category, city, batch ID..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-xs font-medium text-gray-900 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-800 bg-white focus:outline-none focus:border-emerald-600 cursor-pointer"
            >
              <option value="all">All Commodity Categories</option>
              {CANONICAL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Listings Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 space-y-3 bg-white rounded-3xl border border-gray-200">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-bold text-gray-700">Loading your waste catalog...</span>
          </div>
        ) : errorMsg ? (
          <div className="p-6 bg-red-50 border border-red-200 rounded-3xl text-xs space-y-2 text-red-900">
            <div className="flex items-center gap-2 font-bold text-sm">
              <FiAlertCircle className="w-5 h-5 text-red-600" />
              <span>Failed to load listings</span>
            </div>
            <p className="font-medium">{errorMsg}</p>
            <button
              onClick={fetchListings}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all"
            >
              Retry
            </button>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-gray-200 text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
              <FiUploadCloud className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-lg font-black text-gray-900">
                {listings.length === 0 ? 'No Waste Streams Listed Yet' : 'No Matching Listings Found'}
              </h3>
              <p className="text-xs text-gray-500 font-medium leading-relaxed">
                {listings.length === 0 
                  ? 'List your industrial factory byproducts and excess materials to monetize resources and participate in verified circular exchanges.'
                  : 'No waste streams match the selected status or search criteria. Try adjusting your search query.'}
              </p>
            </div>
            {listings.length === 0 ? (
              <div className="pt-2">
                <Link
                  to="/upload-waste"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl text-xs transition-all shadow-xs"
                >
                  <FiUploadCloud className="w-4 h-4" />
                  <span>Upload Your First Waste Batch</span>
                </Link>
              </div>
            ) : (
              <button
                onClick={() => { setStatusFilter('all'); setCategoryFilter('all'); setSearchQuery(''); }}
                className="px-4 py-2 text-xs font-bold text-emerald-700 hover:underline"
              >
                Clear all active filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map(item => {
              const imageSrc = getImageSource(item.imageUrl || item.image);

              return (
                <div
                  key={item._id}
                  className="bg-white rounded-3xl border border-gray-200 shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
                >
                  <div>
                    
                    {/* Thumbnail Image Header */}
                    <div className="h-48 bg-gray-100 relative overflow-hidden flex items-center justify-center border-b border-gray-100">
                      {imageSrc ? (
                        <img
                          src={imageSrc}
                          alt={item.name}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.parentElement.innerHTML = `
                              <div class="w-full h-full bg-[#F6F8F7] flex flex-col items-center justify-center text-gray-400 p-4 text-center">
                                <svg class="w-8 h-8 text-[#009B6B]/40 mb-1" stroke="currentColor" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                                <span class="text-xs font-bold text-gray-600">No image available</span>
                              </div>
                            `;
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#F6F8F7] flex flex-col items-center justify-center text-gray-400 p-4 text-center">
                          <FiShield className="w-8 h-8 text-[#009B6B]/40 mb-1" />
                          <span className="text-xs font-bold text-gray-600">No image uploaded</span>
                          <span className="text-[10px] text-gray-400 font-mono">Batch {item.batchId || 'EL-BATCH'}</span>
                        </div>
                      )}

                      {/* Status Badge Overlaid on Image */}
                      <div className="absolute top-3 left-3">
                        {renderStatusBadge(item.status)}
                      </div>

                      {/* Category Chip Overlaid */}
                      <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/60 backdrop-blur-xs text-white text-[10px] font-black rounded-lg uppercase tracking-wider">
                        {item.category}
                      </div>
                    </div>

                    {/* Listing Content Body */}
                    <div className="p-5 space-y-3.5">
                      
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-gray-500 font-bold">
                          <span className="font-mono">Batch: {item.batchId || 'EL-BATCH-001'}</span>
                          <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h3 className="text-base font-black text-gray-900 line-clamp-1 group-hover:text-emerald-700 transition-colors">
                          {item.name}
                        </h3>
                      </div>

                      {/* Specs Row */}
                      <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-2xl border border-gray-100 text-xs">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase text-gray-500 block">Quantity</span>
                          <span className="font-extrabold text-gray-900">{item.quantity} {item.unit || 'kg'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-extrabold uppercase text-gray-500 block">Pricing</span>
                          <span className="font-extrabold text-emerald-800">
                            {item.pricingMode === 'auction'
                              ? `₹${item.auctionInfo?.startingPrice || item.price} (Auction)`
                              : `${formatINR(item.price)}/${item.unit || 'kg'}`}
                          </span>
                        </div>
                      </div>

                      {/* AI & Quality Specs */}
                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className="font-bold text-gray-700 flex items-center gap-1">
                          <FiShield className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{item.qualityGrade || 'Grade A'}</span>
                        </span>
                        <span className="font-bold text-teal-800">
                          Purity: {typeof item.purity === 'object' ? (item.purity?.estimated ?? 94.5) : (item.purity ?? 94.5)}%
                        </span>
                        <span className="font-bold text-gray-600">
                          Circularity: {item.circularityScore || 90}/100
                        </span>
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                        <FiMapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{item.address || 'Industrial Plant'}, {item.city || 'Vadodara'}</span>
                      </div>

                    </div>

                  </div>

                  {/* Actions Footer */}
                  <div className="p-5 pt-0 border-t border-gray-100 flex items-center gap-2">
                    <Link
                      to={`/waste/${item._id}`}
                      className="flex-1 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                    >
                      <FiEye className="w-3.5 h-3.5" />
                      <span>View Details</span>
                    </Link>

                    <Link
                      to={`/traceability/${item.batchId || item._id}`}
                      className="py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs flex items-center gap-1 transition-all"
                      title="Digital Resource Passport"
                    >
                      <FiFileText className="w-3.5 h-3.5 text-emerald-700" />
                    </Link>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
