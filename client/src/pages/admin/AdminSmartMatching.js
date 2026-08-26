import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import API from '../../services/authAPI';
import AdminLayout from '../../layouts/AdminLayout';
import Loader from '../../components/Loader';
import { 
  FiZap, FiSearch, FiCheckCircle, FiMapPin, 
  FiEye, FiX, FiRefreshCw, FiAlertCircle, FiLayers, FiDollarSign, FiActivity 
} from 'react-icons/fi';

export default function AdminSmartMatching() {
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [apiError, setApiError] = useState('');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMaterial, setFilterMaterial] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [minScoreFilter, setMinScoreFilter] = useState('0');
  const [sortOrder, setSortOrder] = useState('Highest Score');
  
  // Detail Modal
  const [selectedMatch, setSelectedMatch] = useState(null);

  const fetchSmartMatches = async () => {
    try {
      setLoading(true);
      setApiError('');
      const res = await API.get('/admin/smart-matches');
      setMatches(res.data || []);
    } catch (err) {
      console.error('Failed to load smart matches:', err);
      const msg = err.response?.status === 403
        ? 'Access Denied: Admin privileges required to view smart matching dashboard.'
        : (err.response?.data?.message || err.message || 'Failed to fetch matches from matching engine.');
      setApiError(msg);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSmartMatches();
  }, []);

  // Filtered and Sorted Matches
  const filteredMatches = useMemo(() => {
    return matches.filter(match => {
      // 1. Search query (buyer, seller, or required material)
      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery = 
          (match.material || '').toLowerCase().includes(q) ||
          (match.category || '').toLowerCase().includes(q) ||
          (match.buyer?.companyName || '').toLowerCase().includes(q) ||
          (match.buyer?.city || '').toLowerCase().includes(q) ||
          (match.seller?.companyName || '').toLowerCase().includes(q) ||
          (match.seller?.city || '').toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      // 2. Material filter
      if (filterMaterial !== 'All') {
        const mat = (match.material || '').toLowerCase();
        const cat = (match.category || '').toLowerCase();
        const target = filterMaterial.toLowerCase();
        if (!mat.includes(target) && !cat.includes(target)) return false;
      }

      // 3. Category filter
      if (filterCategory !== 'All') {
        const cat = (match.category || '').toLowerCase();
        const target = filterCategory.toLowerCase();
        if (!cat.includes(target)) return false;
      }

      // 4. Minimum Score Filter
      const minScore = parseInt(minScoreFilter, 10);
      if (minScore > 0 && match.overallScore < minScore) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortOrder === 'Highest Score') return b.overallScore - a.overallScore;
      if (sortOrder === 'Lowest Distance') {
        const distA = parseFloat(a.distanceKm) || 0;
        const distB = parseFloat(b.distanceKm) || 0;
        return distA - distB;
      }
      if (sortOrder === 'Material Name') return (a.material || '').localeCompare(b.material || '');
      return 0;
    });
  }, [matches, searchQuery, filterMaterial, filterCategory, minScoreFilter, sortOrder]);

  return (
    <AdminLayout>
      <div className="space-y-6 font-sans">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-3xl border border-[#DDE7E2] shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-[#12233F] tracking-tight">
                Smart Matching
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                filteredMatches.length > 0
                  ? 'bg-[#EAF8F2] text-[#009B6B] border border-[#009B6B]/30'
                  : 'bg-gray-100 text-gray-700 border border-gray-200'
              }`}>
                {filteredMatches.length === 0
                  ? '0 Compatible Matches'
                  : `${filteredMatches.length} Compatible ${filteredMatches.length === 1 ? 'Match' : 'Matches'} Found`}
              </span>
            </div>
            <p className="text-xs text-[#5F6B7A] font-medium mt-1">
              Automatically identify compatible buyer and seller opportunities based on active requirements and waste listings.
            </p>
          </div>

          <button
            onClick={fetchSmartMatches}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl border border-[#DDE7E2] bg-white hover:bg-[#F6F8F7] text-[#12233F] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
            title="Re-run matching engine across active database records"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 text-[#009B6B] ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Engine</span>
          </button>
        </div>

        {/* API Error Alert */}
        {apiError && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-bold flex items-start gap-3">
            <FiAlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-extrabold text-red-900">Matching Engine Connection Issue</div>
              <p className="font-medium text-red-700">{apiError}</p>
              {apiError.includes('Access Denied') && (
                <div className="pt-1">
                  <Link to="/login" className="inline-flex items-center gap-1 text-xs font-bold text-red-900 underline">
                    Log in with Admin credentials &rarr;
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="bg-white p-5 rounded-3xl border border-[#DDE7E2] shadow-2xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            
            {/* Search: Buyer, Seller, Material */}
            <div className="relative lg:col-span-2">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#009B6B] pointer-events-none">
                <FiSearch className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by buyer, seller, or required material..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#DDE7E2] text-xs text-[#12233F] placeholder-gray-400 focus:outline-none focus:border-[#009B6B] focus:ring-1 focus:ring-[#009B6B] font-medium bg-[#F6F8F7]"
              />
            </div>

            {/* Material Filter */}
            <div>
              <select
                value={filterMaterial}
                onChange={(e) => setFilterMaterial(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#DDE7E2] text-xs text-[#12233F] focus:outline-none focus:border-[#009B6B] font-bold bg-[#F6F8F7] cursor-pointer"
              >
                <option value="All">Material: All</option>
                <option value="Plastic">Plastic / PET / HDPE</option>
                <option value="Metal">Metal / Aluminium</option>
                <option value="Paper">Paper / Cardboard</option>
                <option value="Textile">Textile Waste</option>
                <option value="Glass">Glass Cullet</option>
                <option value="Fly Ash">Fly Ash</option>
                <option value="Chemical">Chemical / Solvents</option>
                <option value="E-Waste">E-Waste</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#DDE7E2] text-xs text-[#12233F] focus:outline-none focus:border-[#009B6B] font-bold bg-[#F6F8F7] cursor-pointer"
              >
                <option value="All">Category: All</option>
                <option value="Plastic">Plastic Scrap</option>
                <option value="Metal">Metal Scrap</option>
                <option value="Fly Ash">Fly Ash</option>
                <option value="Chemical">Chemical Waste</option>
                <option value="Textile">Textile Waste</option>
                <option value="Paper">Paper</option>
                <option value="Glass">Glass</option>
              </select>
            </div>

            {/* Minimum Match Score */}
            <div>
              <select
                value={minScoreFilter}
                onChange={(e) => setMinScoreFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#DDE7E2] text-xs text-[#12233F] focus:outline-none focus:border-[#009B6B] font-bold bg-[#F6F8F7] cursor-pointer"
              >
                <option value="0">Score: All Scores</option>
                <option value="60">Score: 60%+ Match</option>
                <option value="75">Score: 75%+ Match</option>
                <option value="85">Score: 85%+ Match</option>
                <option value="90">Score: 90%+ Match</option>
              </select>
            </div>

          </div>
        </div>

        {/* Section Heading */}
        <div className="flex justify-between items-center px-1">
          <h2 className="text-sm font-extrabold text-[#12233F] uppercase tracking-wider">
            Recommended Matches
          </h2>
          <span className="text-xs text-[#5F6B7A] font-medium">
            Showing {filteredMatches.length} of {matches.length} active opportunities
          </span>
        </div>

        {/* Recommended Matches Cards */}
        {loading ? (
          <div className="py-20 flex justify-center bg-white rounded-3xl border border-[#DDE7E2]">
            <Loader />
          </div>
        ) : filteredMatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMatches.map((match) => {
              const score = match.overallScore || 0;
              const isHigh = score >= 85;

              return (
                <div 
                  key={match.id}
                  className="bg-white rounded-3xl border border-[#DDE7E2] p-5 shadow-2xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    
                    {/* Top Bar: Required Material & Match Score */}
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#5F6B7A] block">
                          Required Material
                        </span>
                        <h3 className="text-base font-black text-[#12233F] leading-tight mt-0.5">
                          {match.material}
                        </h3>
                        <span className="text-[11px] text-[#009B6B] font-bold">
                          {match.category}
                        </span>
                      </div>
                      
                      {/* Match Score Badge */}
                      <div className={`px-3 py-1 rounded-full font-black text-xs shrink-0 flex items-center gap-1 border ${
                        isHigh 
                          ? 'bg-[#EAF8F2] text-[#009B6B] border-[#009B6B]/30'
                          : 'bg-amber-50 text-amber-900 border-amber-200'
                      }`}>
                        <FiZap className="w-3.5 h-3.5" />
                        <span>{score}% Match</span>
                      </div>
                    </div>

                    {/* Procuring Buyer & Matching Seller */}
                    <div className="space-y-2 pt-2 border-t border-[#DDE7E2]/60 text-xs">
                      
                      {/* Procuring Buyer */}
                      <div className="p-2.5 bg-[#F6F8F7] rounded-xl flex justify-between items-center">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-extrabold text-[#5F6B7A] uppercase block">
                            Procuring Buyer
                          </span>
                          <span className="font-bold text-[#12233F] block">
                            {match.buyer?.companyName}
                          </span>
                        </div>
                        <div className="text-right text-[11px] text-[#5F6B7A] flex items-center gap-1">
                          <FiMapPin className="w-3 h-3 text-[#009B6B]" />
                          <span>{match.buyer?.city}</span>
                        </div>
                      </div>

                      {/* Matching Seller */}
                      <div className="p-2.5 bg-[#F6F8F7] rounded-xl flex justify-between items-center">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-extrabold text-[#5F6B7A] uppercase block">
                            Matching Seller
                          </span>
                          <span className="font-bold text-[#12233F] block">
                            {match.seller?.companyName}
                          </span>
                        </div>
                        <div className="text-right text-[11px] text-[#5F6B7A] flex items-center gap-1">
                          <FiMapPin className="w-3 h-3 text-[#009B6B]" />
                          <span>{match.seller?.city}</span>
                        </div>
                      </div>

                    </div>

                    {/* Specs: Quantity & Transit Distance */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div className="p-2.5 bg-white border border-[#DDE7E2] rounded-xl">
                        <span className="text-[10px] font-extrabold text-[#5F6B7A] uppercase block">
                          Quantity
                        </span>
                        <span className="font-bold text-[#12233F]">
                          {match.matchedQuantity}
                        </span>
                      </div>
                      <div className="p-2.5 bg-white border border-[#DDE7E2] rounded-xl">
                        <span className="text-[10px] font-extrabold text-[#5F6B7A] uppercase block">
                          Transit Distance
                        </span>
                        <span className="font-bold text-[#12233F]">
                          {match.distanceKm}
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* View Compatibility Details Button */}
                  <button
                    onClick={() => setSelectedMatch(match)}
                    className="w-full py-2.5 rounded-xl border border-[#DDE7E2] hover:bg-[#EAF8F2] hover:text-[#009B6B] hover:border-[#009B6B]/40 text-[#12233F] font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <FiEye className="w-3.5 h-3.5 text-[#009B6B]" />
                    <span>View Compatibility Details</span>
                  </button>

                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="py-16 bg-white rounded-3xl border border-[#DDE7E2] text-center p-8 space-y-3 shadow-2xs">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto text-gray-400">
              <FiZap className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-[#12233F]">
                No compatible matches found.
              </h3>
              <p className="text-xs text-[#5F6B7A] max-w-md mx-auto leading-relaxed">
                Create an active buyer requirement and seller waste listing to generate matching opportunities.
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <Link
                to="/buyer/requirements"
                className="px-4 py-2 rounded-xl bg-[#F6F8F7] hover:bg-[#EAF8F2] border border-[#DDE7E2] text-[#12233F] hover:text-[#009B6B] text-xs font-bold transition-all"
              >
                View Buyer Requirements
              </Link>
              <Link
                to="/admin/listings"
                className="px-4 py-2 rounded-xl bg-[#009B6B] hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-2xs"
              >
                View Waste Listings
              </Link>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* COMPATIBILITY DETAILS MODAL */}
        {/* ------------------------------------------------------------- */}
        {selectedMatch && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full border border-[#DDE7E2] shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
              
              <div className="flex justify-between items-start border-b border-[#DDE7E2] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-[#12233F]">{selectedMatch.material}</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#EAF8F2] text-[#009B6B] border border-[#009B6B]/30">
                      {selectedMatch.overallScore}% Overall Match
                    </span>
                  </div>
                  <span className="text-xs text-[#5F6B7A] font-medium mt-0.5 block">
                    Category: {selectedMatch.category} &bull; Transit Distance: {selectedMatch.distanceKm}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedMatch(null)}
                  className="p-2 rounded-xl bg-[#F6F8F7] hover:bg-gray-200 text-[#12233F] cursor-pointer"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>

              {/* 5-Criteria Explainable Compatibility Breakdown */}
              <div className="space-y-3 bg-[#F6F8F7] p-4 rounded-2xl border border-[#DDE7E2]">
                <div className="text-[11px] font-extrabold text-[#5F6B7A] uppercase tracking-wider">
                  Compatibility Score Breakdown
                </div>

                <div className="space-y-2.5 text-xs">
                  {/* Material */}
                  <div>
                    <div className="flex justify-between font-bold text-[#12233F] mb-1">
                      <span>Material Compatibility</span>
                      <span className="text-[#009B6B]">{selectedMatch.breakdown?.materialScore || 0}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#009B6B] rounded-full" 
                        style={{ width: `${selectedMatch.breakdown?.materialScore || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Quantity */}
                  <div>
                    <div className="flex justify-between font-bold text-[#12233F] mb-1">
                      <span>Quantity Compatibility</span>
                      <span className="text-[#009B6B]">{selectedMatch.breakdown?.quantityScore || 0}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#009B6B] rounded-full" 
                        style={{ width: `${selectedMatch.breakdown?.quantityScore || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Quality */}
                  <div>
                    <div className="flex justify-between font-bold text-[#12233F] mb-1">
                      <span>Quality Compatibility</span>
                      <span className="text-[#009B6B]">{selectedMatch.breakdown?.qualityScore || 0}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#009B6B] rounded-full" 
                        style={{ width: `${selectedMatch.breakdown?.qualityScore || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <div className="flex justify-between font-bold text-[#12233F] mb-1">
                      <span>Location Compatibility</span>
                      <span className="text-[#009B6B]">{selectedMatch.breakdown?.locationScore || 0}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#009B6B] rounded-full" 
                        style={{ width: `${selectedMatch.breakdown?.locationScore || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Price */}
                  <div>
                    <div className="flex justify-between font-bold text-[#12233F] mb-1">
                      <span>Price Compatibility</span>
                      <span className="text-[#009B6B]">{selectedMatch.breakdown?.priceScore || 0}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#009B6B] rounded-full" 
                        style={{ width: `${selectedMatch.breakdown?.priceScore || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Overall Summary Bar */}
                  <div className="pt-2 border-t border-[#DDE7E2] flex justify-between items-center">
                    <span className="font-extrabold text-[#12233F]">Overall Match</span>
                    <span className="font-black text-sm text-[#009B6B]">{selectedMatch.overallScore}%</span>
                  </div>
                </div>
              </div>

              {/* Side-by-Side Comparison: Buyer vs Seller */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                
                {/* Procuring Buyer Details */}
                <div className="p-4 bg-white border border-[#DDE7E2] rounded-2xl space-y-2">
                  <div className="font-extrabold text-[#009B6B] uppercase text-[10px] tracking-wider">
                    Procuring Buyer Demand
                  </div>
                  <div className="font-extrabold text-[#12233F] text-sm">
                    {selectedMatch.buyer?.companyName}
                  </div>
                  <div className="text-[11px] text-[#5F6B7A]">
                    {selectedMatch.buyer?.address || selectedMatch.buyer?.city}
                  </div>
                  <div className="pt-2 space-y-1 text-[#12233F] font-medium border-t border-gray-100">
                    <div>Required: <strong>{selectedMatch.buyer?.requiredQuantity}</strong></div>
                    <div>Max Price: <strong>{selectedMatch.buyer?.maxPrice}</strong></div>
                    <div>Min Purity: <strong>{selectedMatch.buyer?.minPurity}</strong></div>
                  </div>
                </div>

                {/* Matching Seller Details */}
                <div className="p-4 bg-white border border-[#DDE7E2] rounded-2xl space-y-2">
                  <div className="font-extrabold text-[#009B6B] uppercase text-[10px] tracking-wider">
                    Matching Seller Stream
                  </div>
                  <div className="font-extrabold text-[#12233F] text-sm">
                    {selectedMatch.seller?.companyName}
                  </div>
                  <div className="text-[11px] text-[#5F6B7A]">
                    {selectedMatch.seller?.address || selectedMatch.seller?.city}
                  </div>
                  <div className="pt-2 space-y-1 text-[#12233F] font-medium border-t border-gray-100">
                    <div>Available: <strong>{selectedMatch.seller?.availableQuantity}</strong></div>
                    <div>Asking Price: <strong>{selectedMatch.seller?.price}</strong></div>
                    <div>Quality: <strong>{selectedMatch.seller?.qualityGrade} ({selectedMatch.seller?.purity})</strong></div>
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-[#DDE7E2]">
                <button
                  onClick={() => setSelectedMatch(null)}
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
