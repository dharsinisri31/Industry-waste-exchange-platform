import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getMarketplaceListings, requestExchange } from '../services/wasteAPI';
import { useAuth } from '../context/AuthContext';
import { 
  FiSearch, FiFilter, FiChevronLeft, FiChevronRight, FiX, FiCheckCircle, FiAlertCircle, FiArrowRight 
} from 'react-icons/fi';
import DashboardLayout from '../layouts/DashboardLayout';
import WasteCard from '../components/WasteCard';
import Loader from '../components/Loader';

export default function Marketplace() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Category Chips (Initialized with searchParams if present)
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'All');
  
  // Quick dropdown filters
  const [dropdownLocation, setDropdownLocation] = useState('All Locations');
  const [dropdownSort, setDropdownSort] = useState('Newest');

  // Sidebar Filters
  const [filterMaterial, setFilterMaterial] = useState(searchParams.get('category') || 'All');
  const [selectedGrades, setSelectedGrades] = useState([]);
  const [minQty, setMinQty] = useState('');
  const [maxQty, setMaxQty] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedState, setSelectedState] = useState('All States');

  // Pagination & notifications
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);
  const [alertMsg, setAlertMsg] = useState('');
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);

  const categories = [
    'All', 'Plastic', 'Metal', 'Paper', 'Textile', 'Glass', 'Fly Ash', 'E-Waste'
  ];

  // Listen to searchParams changes
  useEffect(() => {
    const urlCategory = searchParams.get('category');
    const urlSearch = searchParams.get('search');
    if (urlCategory) {
      setActiveCategory(urlCategory);
      setFilterMaterial(urlCategory);
    }
    if (urlSearch) {
      setSearch(urlSearch);
    }
  }, [searchParams]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const data = await getMarketplaceListings({ limit: 100 });
      setListings(data.listings || []);
    } catch (err) {
      console.warn('Marketplace load warning:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleExchange = async (wasteId) => {
    if (!user) {
      setLoginPromptOpen(true);
      return;
    }

    setAlertMsg('');
    try {
      await requestExchange(wasteId);
      setAlertMsg('Exchange request sent successfully! The seller facility has been notified.');
      fetchListings();
      setTimeout(() => setAlertMsg(''), 5000);
    } catch (err) {
      alert(err.message || 'Failed to initiate exchange request.');
    }
  };

  const handleGradeToggle = (grade) => {
    setSelectedGrades(prev => 
      prev.includes(grade) ? prev.filter(g => g !== grade) : [...prev, grade]
    );
    setPage(1);
  };

  const handleCategorySelect = (cat) => {
    setActiveCategory(cat);
    setFilterMaterial(cat);
    setPage(1);
  };

  const handleSidebarMaterialChange = (cat) => {
    setFilterMaterial(cat);
    setActiveCategory(cat);
    setPage(1);
  };

  const clearAllFilters = () => {
    setSearch('');
    setActiveCategory('All');
    setFilterMaterial('All');
    setSelectedGrades([]);
    setMinQty('');
    setMaxQty('');
    setMinPrice('');
    setMaxPrice('');
    setSelectedState('All States');
    setDropdownLocation('All Locations');
    setDropdownSort('Newest');
    setPage(1);
  };

  // Precise category matcher to prevent cross-category bleed
  const isCategoryMatch = (itemCatName, targetCat) => {
    if (!targetCat || targetCat === 'All') return true;
    const itemCat = (itemCatName || '').toLowerCase().trim();
    const target = targetCat.toLowerCase().trim();

    if (target === 'plastic') {
      return itemCat === 'plastic' || itemCat.includes('plastic') || itemCat.includes('polymer') || itemCat.includes('pet') || itemCat.includes('hdpe') || itemCat.includes('pp');
    }
    if (target === 'paper') {
      return itemCat === 'paper' || itemCat.includes('paper') || itemCat.includes('cardboard') || itemCat.includes('packaging');
    }
    if (target === 'metal') {
      return itemCat === 'metal' || itemCat.includes('metal') || itemCat.includes('aluminium') || itemCat.includes('copper') || itemCat.includes('steel');
    }
    if (target === 'textile') {
      return itemCat === 'textile' || itemCat.includes('textile') || itemCat.includes('cotton') || itemCat.includes('yarn') || itemCat.includes('fabric');
    }
    if (target === 'glass') {
      return itemCat === 'glass' || itemCat.includes('glass') || itemCat.includes('cullet');
    }
    if (target === 'fly ash') {
      return itemCat === 'fly ash' || itemCat.includes('fly ash') || itemCat.includes('slag') || itemCat.includes('ash');
    }
    if (target === 'e-waste') {
      return itemCat === 'e-waste' || itemCat.includes('e-waste') || itemCat.includes('electronic') || itemCat.includes('circuit');
    }
    if (target === 'chemical') {
      return itemCat === 'chemical' || itemCat.includes('chemical') || itemCat.includes('solvent');
    }
    return itemCat === target || itemCat.includes(target);
  };

  // Filtered & Sorted Listings
  const filteredListings = useMemo(() => {
    return listings.filter(item => {
      // 1. Search Query
      if (search) {
        const q = search.toLowerCase();
        const matches = 
          (item.name || '').toLowerCase().includes(q) ||
          (item.category || '').toLowerCase().includes(q) ||
          (item.subCategory || '').toLowerCase().includes(q) ||
          (item.uploader?.companyName || '').toLowerCase().includes(q) ||
          (item.city || '').toLowerCase().includes(q);
        if (!matches) return false;
      }

      // 2. Category Filter (Synchronized from chips / sidebar)
      const targetCat = activeCategory !== 'All' ? activeCategory : (filterMaterial !== 'All' ? filterMaterial : 'All');
      if (targetCat !== 'All') {
        if (!isCategoryMatch(item.category, targetCat)) return false;
      }

      // 3. Quality Grade
      if (selectedGrades.length > 0) {
        const grade = item.qualityGrade || 'Grade A';
        if (!selectedGrades.includes(grade)) return false;
      }

      // 4. Quantity Min/Max
      const qty = item.quantity || 0;
      if (minQty && qty < Number(minQty)) return false;
      if (maxQty && qty > Number(maxQty)) return false;

      // 5. Price Min/Max
      const price = item.price || 0;
      if (minPrice && price < Number(minPrice)) return false;
      if (maxPrice && price > Number(maxPrice)) return false;

      // 6. Location / State
      if (dropdownLocation !== 'All Locations') {
        if (!(item.city || '').toLowerCase().includes(dropdownLocation.toLowerCase())) return false;
      }
      if (selectedState !== 'All States') {
        if (!(item.state || item.city || item.address || '').toLowerCase().includes(selectedState.toLowerCase())) return false;
      }

      return true;
    }).sort((a, b) => {
      if (dropdownSort === 'Newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      if (dropdownSort === 'Oldest') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      if (dropdownSort === 'Price Low → High') return (a.price || 0) - (b.price || 0);
      if (dropdownSort === 'Price High → Low') return (b.price || 0) - (a.price || 0);
      if (dropdownSort === 'Quantity High → Low') return (b.quantity || 0) - (a.quantity || 0);
      return 0;
    });
  }, [
    listings, search, activeCategory, filterMaterial, selectedGrades, 
    minQty, maxQty, minPrice, maxPrice, dropdownLocation, selectedState, dropdownSort
  ]);

  const paginatedListings = filteredListings.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredListings.length / pageSize) || 1;

  return (
    <DashboardLayout>
      <div className="space-y-6 font-sans max-w-[1450px] mx-auto">
        
        {/* Unauthenticated Login Prompt Modal */}
        {loginPromptOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-[#DDE7E2] text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#EAF8F2] text-[#009B6B] flex items-center justify-center mx-auto text-xl font-bold">
                🔒
              </div>
              <h3 className="text-lg font-black text-[#12233F]">Please login to continue.</h3>
              <p className="text-xs text-[#5F6B7A] font-medium leading-relaxed">
                To request material streams, initiate secondary resource exchanges, or view facility contacts, please sign in or create an industrial account.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setLoginPromptOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#DDE7E2] text-xs font-bold text-[#12233F] hover:bg-[#F6F8F7] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="flex-1 py-2.5 rounded-xl bg-[#009B6B] hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1"
                >
                  <span>Sign In</span>
                  <FiArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 1. TOP MARKETPLACE SEARCH BAR */}
        <div className="bg-white p-5 rounded-3xl border border-[#DDE7E2] shadow-2xs space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-center">
            
            {/* Primary Search Input */}
            <div className="flex-1 relative w-full">
              <FiSearch className="absolute left-3.5 top-3.5 text-[#009B6B] w-4 h-4" />
              <input
                type="text"
                placeholder="Search materials (e.g. PET Scrap, Aluminum, Fly Ash)..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-8 py-3 text-xs font-medium rounded-2xl border border-[#DDE7E2] focus:outline-none focus:border-[#009B6B] focus:ring-1 focus:ring-[#009B6B] bg-[#F6F8F7] text-[#12233F] placeholder:text-gray-400 transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={dropdownLocation}
                onChange={(e) => { setDropdownLocation(e.target.value); setPage(1); }}
                className="px-3.5 py-3 bg-[#F6F8F7] border border-[#DDE7E2] rounded-2xl text-xs font-bold text-[#12233F] cursor-pointer focus:outline-none focus:border-[#009B6B]"
              >
                <option value="All Locations">Location: All</option>
                <option value="Vadodara">Vadodara</option>
                <option value="Coimbatore">Coimbatore</option>
                <option value="Erode">Erode</option>
                <option value="Chennai">Chennai</option>
                <option value="Surat">Surat</option>
                <option value="Salem">Salem</option>
              </select>

              <select
                value={dropdownSort}
                onChange={(e) => setDropdownSort(e.target.value)}
                className="px-3.5 py-3 bg-[#F6F8F7] border border-[#DDE7E2] rounded-2xl text-xs font-bold text-[#12233F] cursor-pointer focus:outline-none focus:border-[#009B6B]"
              >
                <option value="Newest">Sort: Newest</option>
                <option value="Oldest">Sort: Oldest</option>
                <option value="Price Low → High">Price: Low → High</option>
                <option value="Price High → Low">Price: High → Low</option>
                <option value="Quantity High → Low">Quantity: High → Low</option>
              </select>
            </div>

          </div>

          {/* Horizontal Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none border-t border-[#DDE7E2]/60 pt-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#12233F] mr-1 shrink-0">
              Materials:
            </span>
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => handleCategorySelect(cat)}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition-all shrink-0 cursor-pointer border ${
                    isActive
                      ? 'bg-[#009B6B] border-[#009B6B] text-white shadow-2xs'
                      : 'bg-[#F6F8F7] border-[#DDE7E2] text-[#12233F] hover:bg-[#EAF8F2] hover:text-[#009B6B]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Alert Notification */}
        {alertMsg && (
          <div className="p-4 bg-[#EAF8F2] border border-[#009B6B]/40 text-[#009B6B] rounded-2xl text-xs font-bold flex items-center gap-2">
            <FiCheckCircle className="w-4 h-4 text-[#009B6B] shrink-0" />
            <span>{alertMsg}</span>
          </div>
        )}

        {/* 2. MAIN MARKETPLACE CONTENT: SIDE FILTER + PRODUCT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Sidebar Filter */}
          <div className="lg:col-span-3 bg-white p-5 rounded-3xl border border-[#DDE7E2] shadow-2xs space-y-5 text-xs sticky top-20">
            <div className="flex justify-between items-center pb-3 border-b border-[#DDE7E2]">
              <span className="font-extrabold uppercase tracking-wider text-[#12233F] text-xs flex items-center gap-1.5">
                <FiFilter className="w-3.5 h-3.5 text-[#009B6B]" />
                <span>Filter Listings</span>
              </span>
              <button
                onClick={clearAllFilters}
                className="text-[11px] font-extrabold text-[#009B6B] hover:underline cursor-pointer"
              >
                Clear All
              </button>
            </div>

            {/* Material Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#5F6B7A]">Material Stream</label>
              <select
                value={filterMaterial}
                onChange={(e) => handleSidebarMaterialChange(e.target.value)}
                className="w-full p-2.5 bg-[#F6F8F7] border border-[#DDE7E2] rounded-2xl text-xs font-bold text-[#12233F] focus:outline-none focus:border-[#009B6B]"
              >
                <option value="All">All Materials</option>
                <option value="Plastic">Plastic</option>
                <option value="Metal">Metal</option>
                <option value="Paper">Paper</option>
                <option value="Textile">Textile</option>
                <option value="Glass">Glass</option>
                <option value="Fly Ash">Fly Ash</option>
                <option value="E-Waste">E-Waste</option>
              </select>
            </div>

            {/* Quality Grade Checkboxes */}
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#5F6B7A]">Quality Grade</label>
              <div className="grid grid-cols-2 gap-2">
                {['Grade A', 'Grade B', 'Grade C', 'Grade D'].map((g) => (
                  <label key={g} className="flex items-center gap-2 cursor-pointer text-[#12233F]">
                    <input
                      type="checkbox"
                      checked={selectedGrades.includes(g)}
                      onChange={() => handleGradeToggle(g)}
                      className="rounded text-[#009B6B] focus:ring-[#009B6B]"
                    />
                    <span className="font-bold text-[11px]">{g}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Quantity Range */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#5F6B7A]">Quantity (kg)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minQty}
                  onChange={(e) => { setMinQty(e.target.value); setPage(1); }}
                  className="w-1/2 p-2 bg-[#F6F8F7] border border-[#DDE7E2] rounded-xl text-xs font-medium focus:outline-none focus:border-[#009B6B]"
                />
                <span className="text-[#5F6B7A]">–</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxQty}
                  onChange={(e) => { setMaxQty(e.target.value); setPage(1); }}
                  className="w-1/2 p-2 bg-[#F6F8F7] border border-[#DDE7E2] rounded-xl text-xs font-medium focus:outline-none focus:border-[#009B6B]"
                />
              </div>
            </div>

            {/* Price Range */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#5F6B7A]">Price (₹/kg)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
                  className="w-1/2 p-2 bg-[#F6F8F7] border border-[#DDE7E2] rounded-xl text-xs font-medium focus:outline-none focus:border-[#009B6B]"
                />
                <span className="text-[#5F6B7A]">–</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
                  className="w-1/2 p-2 bg-[#F6F8F7] border border-[#DDE7E2] rounded-xl text-xs font-medium focus:outline-none focus:border-[#009B6B]"
                />
              </div>
            </div>

            {/* Location State */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#5F6B7A]">Location State</label>
              <select
                value={selectedState}
                onChange={(e) => { setSelectedState(e.target.value); setPage(1); }}
                className="w-full p-2.5 bg-[#F6F8F7] border border-[#DDE7E2] rounded-2xl text-xs font-bold text-[#12233F] focus:outline-none focus:border-[#009B6B]"
              >
                <option value="All States">All States</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Gujarat">Gujarat</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Karnataka">Karnataka</option>
              </select>
            </div>

          </div>

          {/* Right Product Grid */}
          <div className="lg:col-span-9 space-y-5">
            
            {/* Header info */}
            <div className="flex justify-between items-center text-xs text-[#5F6B7A]">
              <span>Showing <strong className="text-[#12233F]">{filteredListings.length}</strong> available {activeCategory !== 'All' ? activeCategory : ''} material listings</span>
              <span className="font-mono text-[11px] font-bold">Page {page} of {totalPages}</span>
            </div>

            {loading ? (
              <div className="py-20 flex justify-center"><Loader /></div>
            ) : paginatedListings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {paginatedListings.map((waste) => (
                  <WasteCard
                    key={waste._id}
                    waste={waste}
                    onExchange={handleExchange}
                    onRequireLogin={() => setLoginPromptOpen(true)}
                  />
                ))}
              </div>
            ) : (
              <div className="py-16 bg-white rounded-3xl border border-[#DDE7E2] text-center p-8 space-y-3">
                <FiSearch className="w-10 h-10 text-gray-300 mx-auto" />
                <h3 className="text-base font-black text-[#12233F]">No matching material listings found</h3>
                <p className="text-xs text-[#5F6B7A] font-medium max-w-sm mx-auto">
                  No approved {activeCategory !== 'All' ? activeCategory : ''} listings match your active filters.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 rounded-xl bg-[#EAF8F2] text-[#009B6B] font-extrabold text-xs hover:bg-[#009B6B] hover:text-white transition-all cursor-pointer mt-2"
                >
                  Reset All Filters
                </button>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 pt-4">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3.5 py-2 rounded-xl border border-[#DDE7E2] bg-white text-xs font-bold disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                >
                  <FiChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                  <button
                    key={pNum}
                    onClick={() => setPage(pNum)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      page === pNum
                        ? 'bg-[#009B6B] text-white shadow-2xs'
                        : 'bg-white border border-[#DDE7E2] text-[#12233F] hover:bg-gray-50'
                    }`}
                  >
                    {pNum}
                  </button>
                ))}

                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3.5 py-2 rounded-xl border border-[#DDE7E2] bg-white text-xs font-bold disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                >
                  <span>Next</span>
                  <FiChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}


