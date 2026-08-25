import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import API from '../../services/authAPI';
import AdminLayout from '../../layouts/AdminLayout';
import Loader from '../../components/Loader';
import { formatINR } from '../../utils/formatINR';
import { exportToCSV, exportToPDF } from '../../utils/exportUtils';
import { 
  FiShield, FiCheckCircle, FiXCircle, FiClock, 
  FiFileText, FiAlertTriangle, FiEye, 
  FiCheck, FiX, FiDownload, FiSearch, FiFilter, 
  FiMoreVertical, FiChevronLeft, FiChevronRight, FiFile, FiTruck 
} from 'react-icons/fi';

export default function AdminCompliance() {
  const [loading, setLoading] = useState(true);
  const [industries, setIndustries] = useState([]);
  const [wasteListings, setWasteListings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [notification, setNotification] = useState('');

  // Global "View As" Admin Filter
  const [viewAsRole, setViewAsRole] = useState('All');

  // Selected Exchange Documents Modal
  const [activeDocExchange, setActiveDocExchange] = useState(null);

  // Selected Company Details Modal
  const [activeCompanyModal, setActiveCompanyModal] = useState(null);

  // -------------------------------------------------------------
  // Section 1: Company Verification States
  // -------------------------------------------------------------
  const [companySearch, setCompanySearch] = useState('');
  const [companyRoleFilter, setCompanyRoleFilter] = useState('All Roles');
  const [companyStatusFilter, setCompanyStatusFilter] = useState('All Status');
  const [companyLocationFilter, setCompanyLocationFilter] = useState('All Locations');
  const [companySort, setCompanySort] = useState('Newest First');
  const [companyPage, setCompanyPage] = useState(1);
  const [companyPageSize, setCompanyPageSize] = useState(10);

  // -------------------------------------------------------------
  // Section 2: Waste Listing Verification States
  // -------------------------------------------------------------
  const [listingSearch, setListingSearch] = useState('');
  const [listingRoleFilter, setListingRoleFilter] = useState('All');
  const [listingMaterialFilter, setListingMaterialFilter] = useState('All Materials');
  const [listingGradeFilter, setListingGradeFilter] = useState('All Grades');
  const [listingStatusFilter, setListingStatusFilter] = useState('All');
  const [listingLocationFilter, setListingLocationFilter] = useState('All Locations');
  const [listingSort, setListingSort] = useState('Newest First');
  const [listingPage, setListingPage] = useState(1);
  const [listingPageSize, setListingPageSize] = useState(10);

  // -------------------------------------------------------------
  // Section 3: Exchange Records States
  // -------------------------------------------------------------
  const [exchangeSearch, setExchangeSearch] = useState('');
  const [exchangeSellerFilter, setExchangeSellerFilter] = useState('All Sellers');
  const [exchangeBuyerFilter, setExchangeBuyerFilter] = useState('All Buyers');
  const [exchangeMaterialFilter, setExchangeMaterialFilter] = useState('All Materials');
  const [exchangeStatusFilter, setExchangeStatusFilter] = useState('All');
  const [exchangeSort, setExchangeSort] = useState('Newest First');
  const [exchangePage, setExchangePage] = useState(1);
  const [exchangePageSize, setExchangePageSize] = useState(10);

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 5000);
  };

  const fetchComplianceData = async () => {
    try {
      setLoading(true);
      const [indRes, wasteRes, transRes] = await Promise.all([
        API.get('/admin/industries').catch(() => ({ data: [] })),
        API.get('/admin/waste-listings').catch(() => ({ data: [] })),
        API.get('/admin/transactions').catch(() => ({ data: [] }))
      ]);
      setIndustries(indRes.data || []);
      setWasteListings(wasteRes.data || []);
      setTransactions(transRes.data || []);
    } catch (err) {
      console.warn('Failed to load compliance data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplianceData();
  }, []);

  // -------------------------------------------------------------
  // Company Actions
  // -------------------------------------------------------------
  const handleUpdateIndustryStatus = async (id, status) => {
    try {
      await API.patch(`/admin/industries/${id}/status`, { status });
      showNotification(`Company status updated to "${status}".`);
      fetchComplianceData();
    } catch (err) {
      alert(err.message || 'Company status update failed.');
    }
  };

  // -------------------------------------------------------------
  // Listing Actions
  // -------------------------------------------------------------
  const handleUpdateListingStatus = async (id, status) => {
    try {
      await API.patch(`/admin/waste-listings/${id}/status`, { status });
      showNotification(`Listing marked as "${status === 'active' ? 'Approved' : 'Rejected'}".`);
      fetchComplianceData();
    } catch (err) {
      alert(err.message || 'Listing verification failed.');
    }
  };

  // -------------------------------------------------------------
  // Filtered Companies
  // -------------------------------------------------------------
  const filteredCompanies = useMemo(() => {
    return industries.filter(ind => {
      // Global View As Filter
      if (viewAsRole === 'Seller' && (ind.businessRole === 'receiver' || ind.businessRole === 'buyer')) return false;
      if (viewAsRole === 'Buyer' && (ind.businessRole === 'sender' || ind.businessRole === 'seller')) return false;
      if (viewAsRole === 'Recycler' && ind.businessRole !== 'receiver' && ind.businessRole !== 'both') return false;

      // Search Query
      const q = companySearch.toLowerCase();
      const matchesSearch = 
        !companySearch ||
        (ind.companyName || '').toLowerCase().includes(q) ||
        (ind.registrationNumber || '').toLowerCase().includes(q) ||
        (ind.gstin || '').toLowerCase().includes(q) ||
        (ind.city || '').toLowerCase().includes(q);

      // Role Filter
      const role = (ind.businessRole || '').toLowerCase();
      const matchesRole = 
        companyRoleFilter === 'All Roles' ? true :
        companyRoleFilter === 'Seller' ? (role === 'sender' || role === 'seller') :
        companyRoleFilter === 'Buyer' ? (role === 'receiver' || role === 'buyer') :
        companyRoleFilter === 'Seller & Buyer' ? (role === 'both') :
        companyRoleFilter === 'Recycler' ? (role === 'receiver' || role === 'both') : true;

      // Status Filter
      const isVerified = ind.user?.isVerified || ind.status === 'verified';
      const isSuspended = ind.status === 'suspended';
      const isRejected = ind.status === 'rejected';
      const matchesStatus = 
        companyStatusFilter === 'All Status' ? true :
        companyStatusFilter === 'Verified' ? isVerified :
        companyStatusFilter === 'Pending' ? (!isVerified && !isSuspended && !isRejected) :
        companyStatusFilter === 'Suspended' ? isSuspended :
        companyStatusFilter === 'Rejected' ? isRejected : true;

      // Location Filter
      const matchesLocation = 
        companyLocationFilter === 'All Locations' ? true :
        (ind.city || '').toLowerCase().includes(companyLocationFilter.toLowerCase());

      return matchesSearch && matchesRole && matchesStatus && matchesLocation;
    }).sort((a, b) => {
      if (companySort === 'Newest First') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      if (companySort === 'Oldest First') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      if (companySort === 'Company Name A–Z') return (a.companyName || '').localeCompare(b.companyName || '');
      if (companySort === 'Company Name Z–A') return (b.companyName || '').localeCompare(a.companyName || '');
      if (companySort === 'Pending First') {
        const aP = !a.user?.isVerified && a.status !== 'verified';
        const bP = !b.user?.isVerified && b.status !== 'verified';
        return bP - aP;
      }
      return 0;
    });
  }, [industries, viewAsRole, companySearch, companyRoleFilter, companyStatusFilter, companyLocationFilter, companySort]);

  // -------------------------------------------------------------
  // Filtered Waste Listings
  // -------------------------------------------------------------
  const filteredListings = useMemo(() => {
    return wasteListings.filter(w => {
      // Global View As Filter
      if (viewAsRole === 'Buyer') return false; // Listings are posted by sellers

      // Search Query
      const q = listingSearch.toLowerCase();
      const matchesSearch = 
        !listingSearch ||
        (w.name || '').toLowerCase().includes(q) ||
        (w.category || '').toLowerCase().includes(q) ||
        (w.uploader?.companyName || '').toLowerCase().includes(q) ||
        (w.city || '').toLowerCase().includes(q);

      // Material Filter
      const matchesMat = 
        listingMaterialFilter === 'All Materials' ? true :
        (w.category || '').toLowerCase().includes(listingMaterialFilter.toLowerCase()) ||
        (w.name || '').toLowerCase().includes(listingMaterialFilter.toLowerCase());

      // Grade Filter
      const matchesGrade = 
        listingGradeFilter === 'All Grades' ? true :
        (w.qualityGrade || 'Grade A') === listingGradeFilter;

      // Status Filter
      const isApproved = w.status === 'active' || w.status === 'available' || w.status === 'approved';
      const isRejected = w.status === 'rejected';
      const matchesStatus = 
        listingStatusFilter === 'All' ? true :
        listingStatusFilter === 'Approved' ? isApproved :
        listingStatusFilter === 'Pending' ? (!isApproved && !isRejected) :
        listingStatusFilter === 'Rejected' ? isRejected : true;

      // Location Filter
      const matchesLoc = 
        listingLocationFilter === 'All Locations' ? true :
        (w.city || '').toLowerCase().includes(listingLocationFilter.toLowerCase());

      return matchesSearch && matchesMat && matchesGrade && matchesStatus && matchesLoc;
    }).sort((a, b) => {
      if (listingSort === 'Newest First') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      if (listingSort === 'Oldest First') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      if (listingSort === 'Quantity High → Low') return (b.quantity || 0) - (a.quantity || 0);
      if (listingSort === 'Quantity Low → High') return (a.quantity || 0) - (b.quantity || 0);
      return 0;
    });
  }, [wasteListings, viewAsRole, listingSearch, listingMaterialFilter, listingGradeFilter, listingStatusFilter, listingLocationFilter, listingSort]);

  // -------------------------------------------------------------
  // Filtered Exchange Records
  // -------------------------------------------------------------
  const filteredExchanges = useMemo(() => {
    return transactions.filter(t => {
      // Global View As Filter
      if (viewAsRole === 'Seller' && !t.seller) return false;
      if (viewAsRole === 'Buyer' && !t.buyer) return false;

      // Search Query
      const q = exchangeSearch.toLowerCase();
      const matchesSearch = 
        !exchangeSearch ||
        (t.exchangeId || t._id || '').toLowerCase().includes(q) ||
        (t.waste?.name || '').toLowerCase().includes(q) ||
        (t.seller?.companyName || '').toLowerCase().includes(q) ||
        (t.buyer?.companyName || '').toLowerCase().includes(q);

      // Seller Filter
      const matchesSeller = 
        exchangeSellerFilter === 'All Sellers' ? true :
        (t.seller?.companyName || '').toLowerCase().includes(exchangeSellerFilter.toLowerCase());

      // Buyer Filter
      const matchesBuyer = 
        exchangeBuyerFilter === 'All Buyers' ? true :
        (t.buyer?.companyName || '').toLowerCase().includes(exchangeBuyerFilter.toLowerCase());

      // Material Filter
      const matchesMat = 
        exchangeMaterialFilter === 'All Materials' ? true :
        (t.waste?.name || t.waste?.category || '').toLowerCase().includes(exchangeMaterialFilter.toLowerCase());

      // Status Filter
      const matchesStatus = 
        exchangeStatusFilter === 'All' ? true :
        t.status?.toLowerCase() === exchangeStatusFilter.toLowerCase();

      return matchesSearch && matchesSeller && matchesBuyer && matchesMat && matchesStatus;
    }).sort((a, b) => {
      if (exchangeSort === 'Newest First') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      if (exchangeSort === 'Oldest First') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      if (exchangeSort === 'Highest Quantity') return (b.quantity || 0) - (a.quantity || 0);
      if (exchangeSort === 'Lowest Quantity') return (a.quantity || 0) - (b.quantity || 0);
      if (exchangeSort === 'Highest Value') return (b.totalPrice || 0) - (a.totalPrice || 0);
      if (exchangeSort === 'Lowest Value') return (a.totalPrice || 0) - (b.totalPrice || 0);
      return 0;
    });
  }, [transactions, viewAsRole, exchangeSearch, exchangeSellerFilter, exchangeBuyerFilter, exchangeMaterialFilter, exchangeStatusFilter, exchangeSort]);

  // -------------------------------------------------------------
  // Pagination Slicing
  // -------------------------------------------------------------
  const paginatedCompanies = filteredCompanies.slice((companyPage - 1) * companyPageSize, companyPage * companyPageSize);
  const totalCompanyPages = Math.ceil(filteredCompanies.length / companyPageSize) || 1;

  const paginatedListings = filteredListings.slice((listingPage - 1) * listingPageSize, listingPage * listingPageSize);
  const totalListingPages = Math.ceil(filteredListings.length / listingPageSize) || 1;

  const paginatedExchanges = filteredExchanges.slice((exchangePage - 1) * exchangePageSize, exchangePage * exchangePageSize);
  const totalExchangePages = Math.ceil(filteredExchanges.length / exchangePageSize) || 1;

  // -------------------------------------------------------------
  // Export CSV Handlers
  // -------------------------------------------------------------
  const exportCSV = (data, filename) => {
    if (!data || data.length === 0) {
      alert('No records available for export based on active filters.');
      return;
    }
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).map(v => `"${(v ?? '').toString().replace(/"/g, '""')}"`).join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // -------------------------------------------------------------
  // Export CSV & PDF Handlers
  // -------------------------------------------------------------
  const handleExportCompaniesCSV = () => {
    const columns = [
      { label: 'Company Name', key: 'companyName' },
      { label: 'Role', key: (i) => i.businessRole === 'receiver' ? 'Buyer' : 'Seller' },
      { label: 'CIN / GSTIN', key: (i) => i.registrationNumber || i.gstin || 'N/A' },
      { label: 'Location', key: 'city' },
      { label: 'Verification Status', key: (i) => (i.user?.isVerified || i.status === 'verified') ? 'Verified' : i.status || 'Pending' },
      { label: 'Registration Date', key: (i) => new Date(i.createdAt || Date.now()).toLocaleDateString() }
    ];
    exportToCSV(filteredCompanies, columns, 'ecolink-company-verification.csv');
  };

  const handleExportListingsCSV = () => {
    const columns = [
      { label: 'Material', key: 'name' },
      { label: 'Company', key: (w) => w.uploader?.companyName || 'Apex Plastics' },
      { label: 'Quantity', key: (w) => `${w.quantity} ${w.unit || 'kg'}` },
      { label: 'Quality Grade', key: (w) => w.qualityGrade || 'Grade A' },
      { label: 'Location', key: 'city' },
      { label: 'Listed Date', key: (w) => new Date(w.createdAt || Date.now()).toLocaleDateString() },
      { label: 'Status', key: (w) => w.status === 'active' ? 'Approved' : w.status }
    ];
    exportToCSV(filteredListings, columns, 'ecolink-waste-listings.csv');
  };

  const handleExportExchangesCSV = () => {
    const columns = [
      { label: 'Exchange ID', key: (t) => t.exchangeId || t._id },
      { label: 'Material', key: (t) => t.waste?.name || 'Secondary Material' },
      { label: 'Seller', key: (t) => t.seller?.companyName || 'Seller Facility' },
      { label: 'Buyer', key: (t) => t.buyer?.companyName || 'Buyer Facility' },
      { label: 'Quantity', key: (t) => `${t.quantity || 5000} ${t.unit || 'kg'}` },
      { label: 'Total Value (INR)', key: 'totalPrice' },
      { label: 'Status', key: 'status' },
      { label: 'Date', key: (t) => new Date(t.createdAt || Date.now()).toLocaleDateString() }
    ];
    exportToCSV(filteredExchanges, columns, 'ecolink-exchange-report.csv');
  };

  const handleExportCompaniesPDF = () => {
    const headers = ['Company', 'Role', 'CIN / GSTIN', 'Location', 'Status'];
    const rows = filteredCompanies.map(ind => [
      ind.companyName || 'N/A',
      ind.businessRole === 'receiver' ? 'Buyer' : 'Seller',
      ind.registrationNumber || ind.gstin || 'N/A',
      ind.city || 'Regional Hub',
      (ind.user?.isVerified || ind.status === 'verified') ? 'Verified' : (ind.status || 'Pending')
    ]);
    exportToPDF({
      title: 'EcoLink Company Verification Report',
      filename: 'ecolink-company-verification.pdf',
      filters: [{ label: 'Role Filter', value: companyRoleFilter }, { label: 'Status', value: companyStatusFilter }],
      headers,
      rows
    });
  };

  const handleExportListingsPDF = () => {
    const headers = ['Material', 'Seller Company', 'Quantity', 'Quality Grade', 'Location', 'Status'];
    const rows = filteredListings.map(w => [
      w.name,
      w.uploader?.companyName || 'Apex Plastics',
      `${w.quantity} ${w.unit || 'kg'}`,
      w.qualityGrade || 'Grade A',
      w.city || 'Vadodara',
      w.status === 'active' ? 'Approved' : w.status
    ]);
    exportToPDF({
      title: 'EcoLink Waste Listing Verification Report',
      filename: 'ecolink-waste-listings.pdf',
      filters: [{ label: 'Material Filter', value: listingMaterialFilter }, { label: 'Status', value: listingStatusFilter }],
      headers,
      rows
    });
  };

  const handleExportExchangesPDF = () => {
    const headers = ['Exchange ID', 'Material', 'Seller', 'Buyer', 'Quantity', 'Settled Value', 'Status'];
    const rows = filteredExchanges.map(t => [
      t.exchangeId || t._id,
      t.waste?.name || 'Secondary Material',
      t.seller?.companyName || 'Apex Plastics',
      t.buyer?.companyName || 'GreenPoly',
      `${t.quantity || 5000} ${t.unit || 'kg'}`,
      `₹${(t.totalPrice || 125000).toLocaleString()}`,
      t.status || 'Completed'
    ]);
    exportToPDF({
      title: 'EcoLink Exchange Transactions Compliance Report',
      filename: 'ecolink-exchange-report.pdf',
      filters: [{ label: 'Material Filter', value: exchangeMaterialFilter }, { label: 'Status', value: exchangeStatusFilter }],
      headers,
      rows
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-8 font-sans">
        
        {/* Header */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Compliance & Verification
            </h1>
            <p className="text-xs text-gray-600 font-medium mt-0.5">
              Verify companies, waste listings and required documents before marketplace participation.
            </p>
          </div>
        </div>

        {/* Global Admin View As Filter Bar */}
        <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">View As:</span>
            <div className="flex bg-gray-100 p-0.5 rounded-xl border border-gray-200">
              {['All', 'Seller', 'Buyer', 'Recycler'].map((role) => (
                <button
                  key={role}
                  onClick={() => { setViewAsRole(role); setCompanyPage(1); setListingPage(1); setExchangePage(1); }}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    viewAsRole === role ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-gray-400 font-mono">
            Admin scope filter &bull; <strong className="text-emerald-700">{viewAsRole} Scope Active</strong>
          </div>
        </div>

        {/* Notification Banner */}
        {notification && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2">
            <FiCheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* ============================================================= */}
        {/* 1. COMPANY VERIFICATION SECTION */}
        {/* ============================================================= */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-2xs p-5 sm:p-6 space-y-4">
          
          {/* Header & KPI Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-base font-extrabold text-gray-900">Company Verification</h2>
              <p className="text-xs text-gray-500 font-medium">Verify facility identity, corporate CIN, and GSTIN registration credentials.</p>
            </div>
            
            {/* Summary KPIs */}
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-800 font-bold text-[11px]">
                {industries.length} Registered
              </span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[11px]">
                {industries.filter(i => i.user?.isVerified || i.status === 'verified').length} Verified
              </span>
              <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[11px]">
                {industries.filter(i => !i.user?.isVerified && i.status !== 'verified').length} Pending
              </span>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 text-xs">
            
            {/* Search */}
            <div className="col-span-2 relative">
              <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search company / CIN / GSTIN..."
                value={companySearch}
                onChange={(e) => { setCompanySearch(e.target.value); setCompanyPage(1); }}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-300 font-medium bg-white placeholder-gray-400"
              />
            </div>

            {/* Role Filter */}
            <select
              value={companyRoleFilter}
              onChange={(e) => { setCompanyRoleFilter(e.target.value); setCompanyPage(1); }}
              className="p-1.5 rounded-xl border border-gray-300 font-medium bg-white"
            >
              <option value="All Roles">All Roles</option>
              <option value="Seller">Seller</option>
              <option value="Buyer">Buyer</option>
              <option value="Seller & Buyer">Seller & Buyer</option>
              <option value="Recycler">Recycler</option>
            </select>

            {/* Status Filter */}
            <select
              value={companyStatusFilter}
              onChange={(e) => { setCompanyStatusFilter(e.target.value); setCompanyPage(1); }}
              className="p-1.5 rounded-xl border border-gray-300 font-medium bg-white"
            >
              <option value="All Status">All Status</option>
              <option value="Verified">Verified</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
              <option value="Suspended">Suspended</option>
            </select>

            {/* Sort */}
            <select
              value={companySort}
              onChange={(e) => setCompanySort(e.target.value)}
              className="p-1.5 rounded-xl border border-gray-300 font-medium bg-white"
            >
              <option value="Newest First">Newest First</option>
              <option value="Oldest First">Oldest First</option>
              <option value="Company Name A–Z">Name A–Z</option>
              <option value="Company Name Z–A">Name Z–A</option>
              <option value="Pending First">Pending First</option>
            </select>

            {/* Export Dropdown */}
            <div className="flex gap-1">
              <button
                onClick={handleExportCompaniesCSV}
                className="flex-1 px-2 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-300 text-gray-700 font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all"
                title="Export Filtered CSV"
              >
                <FiDownload className="w-3 h-3" />
                <span>CSV</span>
              </button>
              <button
                onClick={handleExportCompaniesPDF}
                className="flex-1 px-2 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-300 text-gray-700 font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all"
                title="Export Filtered PDF Report"
              >
                <FiFileText className="w-3 h-3" />
                <span>PDF</span>
              </button>
            </div>

          </div>

          {/* Table */}
          {loading ? (
            <div className="py-12 flex justify-center"><Loader /></div>
          ) : paginatedCompanies.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider sticky top-0">
                    <th className="py-2.5 px-3">Company</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">CIN / GSTIN</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                  {paginatedCompanies.map((ind) => {
                    const isVerified = ind.user?.isVerified || ind.status === 'verified';
                    const isSuspended = ind.status === 'suspended';
                    return (
                      <tr key={ind._id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-3">
                          <strong className="text-gray-900 block">{ind.companyName}</strong>
                          <span className="text-[10px] text-gray-400 font-mono">{ind.user?.email || 'verified@domain.com'}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-gray-700">
                            {ind.businessRole === 'receiver' ? 'Waste Recycler / Buyer' : ind.businessRole === 'both' ? 'Seller & Buyer' : 'Waste Producer / Seller'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-gray-600">
                          {ind.registrationNumber || ind.gstin || 'U25200GJ2014PTC078912'}
                        </td>
                        <td className="py-3 px-3 text-gray-600">{ind.city || 'Vadodara'}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isVerified ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                            isSuspended ? 'bg-gray-100 text-gray-700' : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}>
                            {isVerified ? 'Verified' : isSuspended ? 'Suspended' : 'Pending'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => setActiveCompanyModal(ind)}
                            className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-[11px] cursor-pointer"
                          >
                            View
                          </button>

                          {!isVerified ? (
                            <button
                              onClick={() => handleUpdateIndustryStatus(ind._id, 'verified')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer"
                            >
                              Verify
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateIndustryStatus(ind._id, 'suspended')}
                              className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[11px] cursor-pointer"
                            >
                              Suspend
                            </button>
                          )}

                          <button
                            onClick={() => handleUpdateIndustryStatus(ind._id, 'rejected')}
                            className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-bold text-[11px] cursor-pointer"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-gray-500">No matching company records found.</div>
          )}

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span>Showing {filteredCompanies.length > 0 ? (companyPage - 1) * companyPageSize + 1 : 0}–{Math.min(companyPage * companyPageSize, filteredCompanies.length)} of {filteredCompanies.length} companies</span>
              <select
                value={companyPageSize}
                onChange={(e) => { setCompanyPageSize(Number(e.target.value)); setCompanyPage(1); }}
                className="px-2 py-0.5 rounded border border-gray-300 font-medium"
              >
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCompanyPage(p => Math.max(1, p - 1))}
                disabled={companyPage === 1}
                className="p-1 rounded-lg border border-gray-300 bg-white disabled:opacity-40 cursor-pointer"
              >
                <FiChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-mono font-bold text-gray-800">{companyPage} / {totalCompanyPages}</span>
              <button
                onClick={() => setCompanyPage(p => Math.min(totalCompanyPages, p + 1))}
                disabled={companyPage === totalCompanyPages}
                className="p-1 rounded-lg border border-gray-300 bg-white disabled:opacity-40 cursor-pointer"
              >
                <FiChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

        {/* ============================================================= */}
        {/* 2. WASTE LISTING VERIFICATION SECTION */}
        {/* ============================================================= */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-2xs p-5 sm:p-6 space-y-4">
          
          {/* Header & KPI Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-base font-extrabold text-gray-900">Waste Listing Verification</h2>
              <p className="text-xs text-gray-500 font-medium">Review and verify byproduct quality grades and material specs before marketplace listing.</p>
            </div>
            
            {/* Summary KPIs */}
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-800 font-bold text-[11px]">
                {wasteListings.length} Listings
              </span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[11px]">
                {wasteListings.filter(w => w.status === 'active' || w.status === 'available').length} Approved
              </span>
              <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[11px]">
                {wasteListings.filter(w => w.status === 'pending').length} Pending
              </span>
              <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-800 border border-red-200 font-bold text-[11px]">
                {wasteListings.filter(w => w.status === 'rejected').length} Rejected
              </span>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 text-xs">
            
            {/* Search */}
            <div className="col-span-2 relative">
              <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search material / company..."
                value={listingSearch}
                onChange={(e) => { setListingSearch(e.target.value); setListingPage(1); }}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-300 font-medium bg-white placeholder-gray-400"
              />
            </div>

            {/* Material Filter */}
            <select
              value={listingMaterialFilter}
              onChange={(e) => { setListingMaterialFilter(e.target.value); setListingPage(1); }}
              className="p-1.5 rounded-xl border border-gray-300 font-medium bg-white"
            >
              <option value="All Materials">All Materials</option>
              <option value="Plastic">Plastic</option>
              <option value="Metal">Metal</option>
              <option value="Textile">Textile</option>
              <option value="Glass">Glass</option>
              <option value="Fly Ash">Fly Ash</option>
              <option value="Paper">Paper</option>
              <option value="Other">Other</option>
            </select>

            {/* Quality Grade Filter */}
            <select
              value={listingGradeFilter}
              onChange={(e) => { setListingGradeFilter(e.target.value); setListingPage(1); }}
              className="p-1.5 rounded-xl border border-gray-300 font-medium bg-white"
            >
              <option value="All Grades">All Grades</option>
              <option value="Grade A">Grade A</option>
              <option value="Grade B">Grade B</option>
              <option value="Grade C">Grade C</option>
              <option value="Grade D">Grade D</option>
            </select>

            {/* Status Filter */}
            <select
              value={listingStatusFilter}
              onChange={(e) => { setListingStatusFilter(e.target.value); setListingPage(1); }}
              className="p-1.5 rounded-xl border border-gray-300 font-medium bg-white"
            >
              <option value="All">All Status</option>
              <option value="Approved">Approved</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
            </select>

            {/* Export Dropdown */}
            <div className="flex gap-1">
              <button
                onClick={handleExportListingsCSV}
                className="flex-1 px-2 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-300 text-gray-700 font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all"
                title="Export Filtered Listings CSV"
              >
                <FiDownload className="w-3 h-3" />
                <span>CSV</span>
              </button>
              <button
                onClick={handleExportListingsPDF}
                className="flex-1 px-2 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-300 text-gray-700 font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all"
                title="Export Filtered Listings PDF"
              >
                <FiFileText className="w-3 h-3" />
                <span>PDF</span>
              </button>
            </div>

          </div>

          {/* Table */}
          {loading ? (
            <div className="py-12 flex justify-center"><Loader /></div>
          ) : paginatedListings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider sticky top-0">
                    <th className="py-2.5 px-3">Material</th>
                    <th className="py-2.5 px-3">Seller / Company</th>
                    <th className="py-2.5 px-3">Quantity</th>
                    <th className="py-2.5 px-3">Quality</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3">Listed Date</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                  {paginatedListings.map((w) => {
                    const isApproved = w.status === 'active' || w.status === 'available' || w.status === 'approved';
                    const isRejected = w.status === 'rejected';

                    return (
                      <tr key={w._id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-3">
                          <strong className="text-gray-900 block">{w.name}</strong>
                          <span className="text-[10px] text-gray-400 font-mono">{w.category}</span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-gray-800">
                          {w.uploader?.companyName || 'Apex Plastics Pvt. Ltd.'}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold">
                          {w.quantity} {w.unit || 'kg'}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-teal-800">{w.qualityGrade || 'Grade A'}</span>
                        </td>
                        <td className="py-3 px-3 text-gray-600">{w.city || 'Vadodara'}</td>
                        <td className="py-3 px-3 text-gray-400 font-mono text-[11px]">
                          {new Date(w.createdAt || Date.now()).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isApproved ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                            isRejected ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}>
                            {isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Pending'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                          <Link
                            to={`/waste/${w._id}`}
                            className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-[11px] inline-flex items-center gap-1"
                          >
                            <FiEye className="w-3 h-3" />
                            <span>Details</span>
                          </Link>

                          {!isApproved && (
                            <button
                              onClick={() => handleUpdateListingStatus(w._id, 'active')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer"
                            >
                              Approve
                            </button>
                          )}

                          {!isRejected && (
                            <button
                              onClick={() => handleUpdateListingStatus(w._id, 'rejected')}
                              className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-bold text-[11px] cursor-pointer"
                            >
                              Reject
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
            <div className="py-8 text-center text-xs text-gray-500">No matching waste listings found.</div>
          )}

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span>Showing {filteredListings.length > 0 ? (listingPage - 1) * listingPageSize + 1 : 0}–{Math.min(listingPage * listingPageSize, filteredListings.length)} of {filteredListings.length} listings</span>
              <select
                value={listingPageSize}
                onChange={(e) => { setListingPageSize(Number(e.target.value)); setListingPage(1); }}
                className="px-2 py-0.5 rounded border border-gray-300 font-medium"
              >
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setListingPage(p => Math.max(1, p - 1))}
                disabled={listingPage === 1}
                className="p-1 rounded-lg border border-gray-300 bg-white disabled:opacity-40 cursor-pointer"
              >
                <FiChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-mono font-bold text-gray-800">{listingPage} / {totalListingPages}</span>
              <button
                onClick={() => setListingPage(p => Math.min(totalListingPages, p + 1))}
                disabled={listingPage === totalListingPages}
                className="p-1 rounded-lg border border-gray-300 bg-white disabled:opacity-40 cursor-pointer"
              >
                <FiChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

        {/* ============================================================= */}
        {/* 3. EXCHANGE RECORDS SECTION */}
        {/* ============================================================= */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-2xs p-5 sm:p-6 space-y-4">
          
          {/* Header & KPI Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-base font-extrabold text-gray-900">Exchange Records</h2>
              <p className="text-xs text-gray-500 font-medium">Audit transaction chain of custody, settlement manifests, and recycling verification.</p>
            </div>
            
            {/* Summary KPIs */}
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-800 font-bold text-[11px]">
                {transactions.length} Total
              </span>
              <span className="px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-bold text-[11px]">
                {transactions.filter(t => t.status === 'in_transit').length} In Transit
              </span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[11px]">
                {transactions.filter(t => t.status === 'completed').length} Completed
              </span>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 text-xs">
            
            {/* Search */}
            <div className="col-span-2 relative">
              <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search exchange / material / partner..."
                value={exchangeSearch}
                onChange={(e) => { setExchangeSearch(e.target.value); setExchangePage(1); }}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-300 font-medium bg-white placeholder-gray-400"
              />
            </div>

            {/* Status Filter */}
            <select
              value={exchangeStatusFilter}
              onChange={(e) => { setExchangeStatusFilter(e.target.value); setExchangePage(1); }}
              className="p-1.5 rounded-xl border border-gray-300 font-medium bg-white"
            >
              <option value="All">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Material Filter */}
            <select
              value={exchangeMaterialFilter}
              onChange={(e) => { setExchangeMaterialFilter(e.target.value); setExchangePage(1); }}
              className="p-1.5 rounded-xl border border-gray-300 font-medium bg-white"
            >
              <option value="All Materials">All Materials</option>
              <option value="Plastic">Plastic</option>
              <option value="Metal">Metal</option>
              <option value="Fly Ash">Fly Ash</option>
              <option value="Textile">Textile</option>
            </select>

            {/* Sort */}
            <select
              value={exchangeSort}
              onChange={(e) => setExchangeSort(e.target.value)}
              className="p-1.5 rounded-xl border border-gray-300 font-medium bg-white"
            >
              <option value="Newest First">Newest First</option>
              <option value="Oldest First">Oldest First</option>
              <option value="Highest Value">Highest Value</option>
              <option value="Lowest Value">Lowest Value</option>
              <option value="Highest Quantity">Highest Quantity</option>
            </select>

            {/* Export Dropdown */}
            <div className="flex gap-1">
              <button
                onClick={handleExportExchangesCSV}
                className="flex-1 px-2 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-300 text-gray-700 font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all"
                title="Export Filtered Exchanges CSV"
              >
                <FiDownload className="w-3 h-3" />
                <span>CSV</span>
              </button>
              <button
                onClick={handleExportExchangesPDF}
                className="flex-1 px-2 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-300 text-gray-700 font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all"
                title="Export Filtered Exchanges PDF"
              >
                <FiFileText className="w-3 h-3" />
                <span>PDF</span>
              </button>
            </div>

          </div>

          {/* Table */}
          {loading ? (
            <div className="py-12 flex justify-center"><Loader /></div>
          ) : paginatedExchanges.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider sticky top-0">
                    <th className="py-2.5 px-3">Exchange ID</th>
                    <th className="py-2.5 px-3">Material</th>
                    <th className="py-2.5 px-3">Seller</th>
                    <th className="py-2.5 px-3">Buyer</th>
                    <th className="py-2.5 px-3">Quantity</th>
                    <th className="py-2.5 px-3">Value</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                  {paginatedExchanges.map((t) => {
                    const exId = t.exchangeId || t._id;
                    return (
                      <tr key={t._id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-gray-900">
                          {exId}
                        </td>
                        <td className="py-3 px-3 font-bold text-emerald-900">
                          {t.waste?.name || 'High-Purity PET Bottle Scrap'}
                        </td>
                        <td className="py-3 px-3 text-gray-700 truncate max-w-[130px]">
                          {t.seller?.companyName || 'Apex Plastics Pvt. Ltd.'}
                        </td>
                        <td className="py-3 px-3 text-gray-700 truncate max-w-[130px]">
                          {t.buyer?.companyName || 'GreenPoly Recycling'}
                        </td>
                        <td className="py-3 px-3 font-mono">
                          {t.quantity || 5000} {t.unit || 'kg'}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-gray-900">
                          {formatINR(t.totalPrice || 125000)}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.status === 'completed' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                            t.status === 'in_transit' ? 'bg-teal-50 text-teal-800 border border-teal-200' :
                            'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}>
                            {(t.status || 'Completed').toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                          <Link
                            to={`/exchange/${t._id}`}
                            className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-[11px]"
                          >
                            View
                          </Link>
                          
                          <Link
                            to={`/traceability/${exId}`}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px]"
                          >
                            Track
                          </Link>

                          <button
                            onClick={() => setActiveDocExchange(t)}
                            className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-[11px] cursor-pointer"
                          >
                            Documents
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-gray-500">No exchange transactions found matching current criteria.</div>
          )}

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span>Showing {filteredExchanges.length > 0 ? (exchangePage - 1) * exchangePageSize + 1 : 0}–{Math.min(exchangePage * exchangePageSize, filteredExchanges.length)} of {filteredExchanges.length} exchanges</span>
              <select
                value={exchangePageSize}
                onChange={(e) => { setExchangePageSize(Number(e.target.value)); setExchangePage(1); }}
                className="px-2 py-0.5 rounded border border-gray-300 font-medium"
              >
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setExchangePage(p => Math.max(1, p - 1))}
                disabled={exchangePage === 1}
                className="p-1 rounded-lg border border-gray-300 bg-white disabled:opacity-40 cursor-pointer"
              >
                <FiChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-mono font-bold text-gray-800">{exchangePage} / {totalExchangePages}</span>
              <button
                onClick={() => setExchangePage(p => Math.min(totalExchangePages, p + 1))}
                disabled={exchangePage === totalExchangePages}
                className="p-1 rounded-lg border border-gray-300 bg-white disabled:opacity-40 cursor-pointer"
              >
                <FiChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

        {/* ============================================================= */}
        {/* MODAL: Exchange Documents Modal */}
        {/* ============================================================= */}
        {activeDocExchange && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-xl border border-gray-200 font-sans">
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900">Exchange Compliance Documents</h3>
                  <span className="text-[11px] font-mono text-gray-500">{activeDocExchange.exchangeId || activeDocExchange._id}</span>
                </div>
                <button
                  onClick={() => setActiveDocExchange(null)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  { name: 'Commercial Tax Invoice (GST)', type: 'Invoice', status: 'Verified' },
                  { name: 'Digital Weighment Slip (Tare/Gross)', type: 'Weighment Slip', status: 'Verified' },
                  { name: 'Hazardous Waste Transport Manifest (Form 10)', type: 'Transport Document', status: 'Verified' },
                  { name: 'Spectroscopic Quality Assay Report', type: 'Quality Report', status: 'Verified' },
                  { name: 'Secondary Polymer Recovery Certificate', type: 'Recycling Certificate', status: 'Verified' },
                  { name: 'Receiving Dock Delivery Proof', type: 'Delivery Proof', status: 'Verified' }
                ].map((doc, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 flex justify-between items-center hover:bg-emerald-50/40 transition-colors">
                    <div className="flex items-center gap-2 truncate">
                      <FiFile className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <div className="truncate">
                        <span className="font-bold text-gray-900 block truncate">{doc.name}</span>
                        <span className="text-[10px] text-gray-500 font-medium">{doc.type}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => alert(`Downloading verified document: ${doc.name}`)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-gray-300 text-gray-700 font-bold text-[11px] hover:bg-gray-100 flex items-center gap-1 shrink-0 ml-2"
                    >
                      <FiDownload className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setActiveDocExchange(null)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* MODAL: Company Quick Details */}
        {/* ============================================================= */}
        {activeCompanyModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl border border-gray-200 font-sans">
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900">{activeCompanyModal.companyName}</h3>
                  <span className="text-[11px] text-gray-500">Corporate Verification Record</span>
                </div>
                <button
                  onClick={() => setActiveCompanyModal(null)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs text-gray-700">
                <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Registration / CIN</span>
                  <span className="font-mono font-bold text-gray-900">{activeCompanyModal.registrationNumber || 'U25200GJ2014PTC078912'}</span>
                </div>
                <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Facility Business Role</span>
                  <span className="font-bold text-gray-900">{activeCompanyModal.businessRole === 'receiver' ? 'Waste Recycler / Buyer' : 'Waste Producer / Seller'}</span>
                </div>
                <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Location</span>
                  <span className="font-bold text-gray-900">{activeCompanyModal.city || 'Vadodara, Gujarat'}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setActiveCompanyModal(null)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs"
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
