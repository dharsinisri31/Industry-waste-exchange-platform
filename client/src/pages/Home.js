import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import API from '../services/authAPI';
import { 
  FiArrowRight, FiSearch, FiGlobe, 
  FiRefreshCw, FiZap, FiTruck, FiLayers,
  FiCheckCircle, FiShield, FiTrendingUp,
  FiBox, FiActivity, FiMapPin, FiNavigation,
  FiPackage, FiCheckSquare, FiAward, FiFileText
} from 'react-icons/fi';

// Material category images stored locally
import plasticImg from '../assets/materials/plastic.jpg';
import metalImg from '../assets/materials/metal.jpg';
import textileImg from '../assets/materials/textile.jpg';
import paperImg from '../assets/materials/paper.jpg';
import glassImg from '../assets/materials/glass.jpg';
import flyAshImg from '../assets/materials/fly-ash.jpg';
import eWasteImg from '../assets/materials/e-waste.jpg';

// Explicit mapping of category name to local image
const materialImages = {
  'Plastic': plasticImg,
  'Metal': metalImg,
  'Textile': textileImg,
  'Paper': paperImg,
  'Glass': glassImg,
  'Fly Ash': flyAshImg,
  'E-Waste': eWasteImg
};

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [marketplaceListings, setMarketplaceListings] = useState([]);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const wasteRes = await API.get('/waste/marketplace');
        const listings = Array.isArray(wasteRes.data) 
          ? wasteRes.data 
          : (wasteRes.data?.listings || wasteRes.data?.waste || []);
        setMarketplaceListings(listings.slice(0, 4));
      } catch (err) {
        console.warn('Could not fetch marketplace listings:', err.message);
      }

      try {
        const metricsRes = await API.get('/sustainability/metrics');
        setMetrics(metricsRes.data);
      } catch (err) {
        console.warn('Could not fetch sustainability metrics:', err.message);
      }
    };

    fetchHomeData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/marketplace?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/marketplace');
    }
  };

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  // Popular category search pills
  const popularCategories = ['Plastic', 'Metal', 'Textile', 'Paper', 'Glass', 'Fly Ash', 'E-Waste'];

  // Material Categories with explicit local image mappings
  const categories = [
    {
      name: 'Plastic',
      desc: 'Industrial PET, HDPE, PP regrind, polymer flakes & packaging scrap.',
      image: materialImages['Plastic'],
      categoryParam: 'Plastic'
    },
    {
      name: 'Metal',
      desc: 'Aluminum alloys, copper wire, steel offcuts & machining turnings.',
      image: materialImages['Metal'],
      categoryParam: 'Metal'
    },
    {
      name: 'Textile',
      desc: 'Yarn waste, cotton clippings, spinning drop & synthetic trims.',
      image: materialImages['Textile'],
      categoryParam: 'Textile'
    },
    {
      name: 'Paper',
      desc: 'Corrugated cardboard bales, kraft paper scrap, pulp waste & baled paper.',
      image: materialImages['Paper'],
      categoryParam: 'Paper'
    },
    {
      name: 'Glass',
      desc: 'Industrial cullet, container glass & flat glass manufacturing offcuts.',
      image: materialImages['Glass'],
      categoryParam: 'Glass'
    },
    {
      name: 'Fly Ash',
      desc: 'Thermal power fly ash, blast furnace slag & GGBS for cement blending.',
      image: materialImages['Fly Ash'],
      categoryParam: 'Fly Ash'
    },
    {
      name: 'E-Waste',
      desc: 'Discarded circuit boards, electronic components, memory boards & scrap chips.',
      image: materialImages['E-Waste'],
      categoryParam: 'E-Waste'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F6F8F7] text-[#12233F] flex flex-col font-sans selection:bg-[#009B6B] selection:text-white">
      
      {/* 1. STICKY TOP NAVBAR */}
      <Navbar />

      {/* 2. HERO SECTION */}
      <section className="relative z-10 pt-10 pb-12 sm:pt-14 sm:pb-20 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left: Headline & Description */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EAF8F2] border border-[#DDE7E2] text-[#009B6B] text-xs font-extrabold uppercase tracking-wider shadow-2xs">
              <FiZap className="w-3.5 h-3.5" />
              <span>INDUSTRIAL RESOURCE EXCHANGE</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.12] text-[#12233F]">
              Turn Industrial Waste{' '}
              <span className="text-[#009B6B]">
                Into Valuable Resources
              </span>
            </h1>

            <p className="text-[#5F6B7A] text-base sm:text-lg max-w-2xl leading-relaxed mx-auto lg:mx-0 font-medium">
              Connect industries to buy, sell and exchange secondary materials through one circular marketplace.
            </p>

            <div className="flex flex-col sm:flex-row gap-3.5 justify-center lg:justify-start pt-2">
              <Link
                to="/marketplace"
                className="px-7 py-3.5 rounded-xl bg-[#009B6B] hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <FiSearch className="w-4 h-4" />
                <span>Explore Marketplace</span>
                <FiArrowRight className="w-4 h-4" />
              </Link>

              <button
                onClick={handleGetStarted}
                className="px-7 py-3.5 rounded-xl bg-white hover:bg-[#F6F8F7] border border-[#DDE7E2] text-[#12233F] font-extrabold text-xs sm:text-sm shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Get Started</span>
                <FiArrowRight className="w-4 h-4 text-[#009B6B]" />
              </button>
            </div>
          </div>

          {/* Right: Industrial Hero Collage Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden border border-[#DDE7E2] shadow-xl bg-white p-3 space-y-3">
              <div className="h-64 sm:h-72 rounded-2xl overflow-hidden relative group">
                <img
                  src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=900&q=80"
                  alt="Industrial Recycling & Secondary Material Processing"
                  className="w-full h-full object-cover group-hover:scale-103 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#12233F]/70 via-transparent to-transparent flex items-end p-4">
                  <span className="text-white text-xs font-bold tracking-wide">
                    Circular Industrial Ecology in Action
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="h-32 rounded-xl overflow-hidden relative group border border-[#DDE7E2]">
                  <img
                    src={materialImages['Plastic']}
                    alt="Polymer Scrap"
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                  />
                  <div className="absolute bottom-1.5 left-2 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-md text-[10px] font-bold text-[#12233F]">
                    Sorted Polymers
                  </div>
                </div>
                <div className="h-32 rounded-xl overflow-hidden relative group border border-[#DDE7E2]">
                  <img
                    src={materialImages['Metal']}
                    alt="Secondary Metal"
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                  />
                  <div className="absolute bottom-1.5 left-2 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-md text-[10px] font-bold text-[#12233F]">
                    Metal Scraps
                  </div>
                </div>
              </div>

              {/* Floating Cards */}
              <div className="absolute -bottom-4 -left-4 bg-white p-3.5 rounded-2xl border border-[#DDE7E2] shadow-lg flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#EAF8F2] text-[#009B6B]">
                  <FiRefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-black text-[#12233F] block">Industrial Marketplace</span>
                  <span className="text-[10px] text-[#5F6B7A] font-bold">Verified Materials</span>
                </div>
              </div>

              <div className="absolute -top-3 -right-3 bg-white p-3 rounded-2xl border border-[#DDE7E2] shadow-lg flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#009B6B] animate-pulse"></div>
                <span className="text-xs font-extrabold text-[#12233F]">Smarter Resource Exchange</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. MARKETPLACE-STYLE SEARCH SECTION */}
      <section className="px-4 sm:px-6 max-w-5xl mx-auto w-full -mt-4 mb-16 relative z-20">
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#DDE7E2] shadow-lg space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400 pointer-events-none">
                <FiSearch className="w-5 h-5 text-[#009B6B]" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="What are you looking for? (e.g. PET bottle scrap, Aluminum turnings, Fly ash)"
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-[#DDE7E2] text-sm text-[#12233F] placeholder:text-gray-400 focus:outline-none focus:border-[#009B6B] focus:ring-1 focus:ring-[#009B6B] bg-[#F6F8F7] font-medium transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-8 py-3.5 rounded-2xl bg-[#009B6B] hover:bg-emerald-700 text-white font-extrabold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <span>Search</span>
              <FiArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Popular Categories */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#DDE7E2]/60 text-xs">
            <span className="font-extrabold text-[#12233F] uppercase tracking-wider text-[11px] mr-1">
              Popular Categories:
            </span>
            {popularCategories.map((cat) => (
              <Link
                key={cat}
                to={`/marketplace?category=${encodeURIComponent(cat)}`}
                className="px-3 py-1 rounded-full bg-[#EAF8F2] hover:bg-[#009B6B] text-[#009B6B] hover:text-white font-bold transition-all border border-[#DDE7E2]"
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. MATERIAL CATEGORIES ("Explore Materials") */}
      <section className="py-16 bg-white border-y border-[#DDE7E2] px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-10">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#009B6B]">
              CATEGORIES
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#12233F] tracking-tight">
              Explore Materials
            </h2>
            <p className="text-[#5F6B7A] text-xs sm:text-sm font-medium">
              Browse secondary materials by recyclable stream and industrial commodity grade.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat, idx) => (
              <Link
                key={idx}
                to={`/marketplace?category=${encodeURIComponent(cat.categoryParam)}`}
                className="bg-[#F6F8F7] rounded-3xl border border-[#DDE7E2] overflow-hidden shadow-2xs hover:shadow-md hover:border-[#009B6B] transition-all group flex flex-col justify-between"
              >
                <div className="h-44 bg-gray-200 overflow-hidden relative">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-108 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#12233F]/70 via-transparent to-transparent flex items-end p-5">
                    <span className="text-white font-black text-lg tracking-wide">
                      {cat.name}
                    </span>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-xs text-[#5F6B7A] font-medium leading-relaxed">
                    {cat.desc}
                  </p>
                  <span className="text-xs font-extrabold text-[#009B6B] inline-flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
                    <span>View Materials</span>
                    <FiArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 5. FEATURED INDUSTRIAL MATERIALS (MARKETPLACE PREVIEW) */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto w-full space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#009B6B]">
              MARKETPLACE PREVIEW
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-[#12233F] tracking-tight">
              Featured Industrial Materials
            </h2>
            <p className="text-[#5F6B7A] text-xs sm:text-sm font-medium">
              Real-time secondary resource listings available for immediate procurement.
            </p>
          </div>

          <Link
            to="/marketplace"
            className="inline-flex items-center gap-2 text-xs font-extrabold text-[#009B6B] hover:text-emerald-800 transition-colors"
          >
            <span>Explore All Materials</span>
            <FiArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {marketplaceListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {marketplaceListings.map((item) => (
              <div 
                key={item._id || item.id}
                className="bg-white rounded-3xl border border-[#DDE7E2] shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  <div className="h-44 bg-gray-100 relative overflow-hidden flex items-center justify-center">
                    {(() => {
                      const rawImg = item.imageUrl || item.image || item.imagePath;
                      const resolvedImg = rawImg 
                        ? (rawImg.startsWith('http') ? rawImg : `http://localhost:5000${rawImg.startsWith('/') ? '' : '/'}${rawImg}`)
                        : null;
                      return resolvedImg ? (
                        <img
                          src={resolvedImg}
                          alt={item.name || item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#F6F8F7] flex flex-col items-center justify-center text-gray-400 p-4">
                          <FiLayers className="w-8 h-8 text-[#009B6B]/60 mb-1" />
                          <span className="text-[11px] font-bold text-gray-500">No image uploaded</span>
                        </div>
                      );
                    })()}
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-lg text-[10px] font-extrabold text-[#009B6B] border border-[#DDE7E2] shadow-2xs">
                      {item.category || 'Secondary Material'}
                    </div>
                  </div>

                  <div className="p-5 space-y-2">
                    <h3 className="font-extrabold text-sm text-[#12233F] truncate">
                      {item.name || item.title || 'Industrial Secondary Stream'}
                    </h3>
                    
                    <div className="pt-2 space-y-1 text-xs">
                      <div className="flex justify-between items-center text-[#5F6B7A] font-medium">
                        <span>Quantity:</span>
                        <span className="font-bold text-[#12233F]">{item.quantity} {item.unit || 'kg'}</span>
                      </div>
                      <div className="flex justify-between items-center text-[#5F6B7A] font-medium">
                        <span>Location:</span>
                        <span className="font-bold text-[#12233F] truncate max-w-[120px]">{item.location?.city || item.city || 'Regional Facility'}</span>
                      </div>
                      {item.price && (
                        <div className="flex justify-between items-center text-[#5F6B7A] font-medium">
                          <span>Price:</span>
                          <span className="font-extrabold text-[#009B6B]">₹{item.price} / {item.unit || 'kg'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <Link
                    to={`/waste/${item._id || item.id}`}
                    className="w-full py-2.5 rounded-xl bg-[#EAF8F2] hover:bg-[#009B6B] text-[#009B6B] hover:text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all border border-[#DDE7E2]"
                  >
                    <span>View Listing</span>
                    <FiArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 bg-white rounded-3xl border border-[#DDE7E2] text-center space-y-3">
            <FiBox className="w-10 h-10 text-[#009B6B] mx-auto opacity-70" />
            <h3 className="text-base font-bold text-[#12233F]">Active Exchange Marketplace</h3>
            <p className="text-xs text-[#5F6B7A] max-w-md mx-auto font-medium">
              Connecting waste generators and industrial consumers across manufacturing hubs.
            </p>
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#009B6B] text-white text-xs font-bold"
            >
              Browse Full Catalog &rarr;
            </Link>
          </div>
        )}
      </section>

      {/* 6. BUYER + SELLER SECTION */}
      <section className="py-20 bg-white border-y border-[#DDE7E2] px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#009B6B]">
              PARTICIPANT ROLES
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#12233F] tracking-tight">
              Designed for Buyers and Sellers
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* BUYERS CARD */}
            <div className="bg-[#F6F8F7] p-8 sm:p-10 rounded-3xl border border-[#DDE7E2] shadow-2xs space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="inline-block px-3.5 py-1 rounded-full bg-[#EAF8F2] text-[#009B6B] font-black text-xs uppercase tracking-wider">
                  BUYERS
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-[#12233F]">
                  Find the materials your industry needs.
                </h3>
                <p className="text-xs sm:text-sm text-[#5F6B7A] font-medium leading-relaxed">
                  Source quality-verified secondary raw materials directly from manufacturing generators to lower procurement costs and hit ESG targets.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-white rounded-2xl border border-[#DDE7E2] space-y-1">
                    <span className="text-xs font-extrabold text-[#12233F] block">1. Search</span>
                    <span className="text-[11px] text-[#5F6B7A]">Browse categorized scrap & by-products</span>
                  </div>
                  <div className="p-3 bg-white rounded-2xl border border-[#DDE7E2] space-y-1">
                    <span className="text-xs font-extrabold text-[#12233F] block">2. Compare</span>
                    <span className="text-[11px] text-[#5F6B7A]">Analyze specs, purity & lab reports</span>
                  </div>
                  <div className="p-3 bg-white rounded-2xl border border-[#DDE7E2] space-y-1">
                    <span className="text-xs font-extrabold text-[#12233F] block">3. Request</span>
                    <span className="text-[11px] text-[#5F6B7A]">Submit offers or custom requirements</span>
                  </div>
                  <div className="p-3 bg-white rounded-2xl border border-[#DDE7E2] space-y-1">
                    <span className="text-xs font-extrabold text-[#12233F] block">4. Exchange</span>
                    <span className="text-[11px] text-[#5F6B7A]">Execute contract & track delivery</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to="/marketplace"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#009B6B] hover:bg-emerald-700 text-white font-extrabold text-xs inline-flex items-center justify-center gap-2 shadow-2xs transition-all"
                >
                  <span>Explore as Buyer</span>
                  <FiArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* SELLERS CARD */}
            <div className="bg-[#F6F8F7] p-8 sm:p-10 rounded-3xl border border-[#DDE7E2] shadow-2xs space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="inline-block px-3.5 py-1 rounded-full bg-[#EAF8F2] text-[#009B6B] font-black text-xs uppercase tracking-wider">
                  SELLERS
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-[#12233F]">
                  Give your industrial materials a productive destination.
                </h3>
                <p className="text-xs sm:text-sm text-[#5F6B7A] font-medium leading-relaxed">
                  Monetize factory waste streams, reduce landfill expenditure, and connect with verified industrial recyclers seamlessly.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-white rounded-2xl border border-[#DDE7E2] space-y-1">
                    <span className="text-xs font-extrabold text-[#12233F] block">1. List Material</span>
                    <span className="text-[11px] text-[#5F6B7A]">Upload waste specs & photos</span>
                  </div>
                  <div className="p-3 bg-white rounded-2xl border border-[#DDE7E2] space-y-1">
                    <span className="text-xs font-extrabold text-[#12233F] block">2. Set Quantity</span>
                    <span className="text-[11px] text-[#5F6B7A]">Define batch volume & recurring cycle</span>
                  </div>
                  <div className="p-3 bg-white rounded-2xl border border-[#DDE7E2] space-y-1">
                    <span className="text-xs font-extrabold text-[#12233F] block">3. Receive Requests</span>
                    <span className="text-[11px] text-[#5F6B7A]">Review procurement bids from buyers</span>
                  </div>
                  <div className="p-3 bg-white rounded-2xl border border-[#DDE7E2] space-y-1">
                    <span className="text-xs font-extrabold text-[#12233F] block">4. Complete Exchange</span>
                    <span className="text-[11px] text-[#5F6B7A]">Dispatch materials & record ESG data</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#12233F] hover:bg-black text-white font-extrabold text-xs inline-flex items-center justify-center gap-2 shadow-2xs transition-all"
                >
                  <span>Start Selling</span>
                  <FiArrowRight className="w-4 h-4 text-[#009B6B]" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 7. HOW IT WORKS */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto w-full space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#009B6B]">
            STEP-BY-STEP PROCESS
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#12233F] tracking-tight">
            How EcoLink Works
          </h2>
          <p className="text-[#5F6B7A] text-xs sm:text-sm font-medium">
            From facility registration to verified material delivery.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="bg-white p-7 rounded-3xl border border-[#DDE7E2] shadow-2xs space-y-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#009B6B] text-white flex items-center justify-center font-black text-sm">
              01
            </div>
            <h3 className="text-base font-black text-[#12233F]">Register</h3>
            <p className="text-xs text-[#5F6B7A] font-medium leading-relaxed">
              Create a verified company profile for your manufacturing or processing facility.
            </p>
          </div>

          <div className="bg-white p-7 rounded-3xl border border-[#DDE7E2] shadow-2xs space-y-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#009B6B] text-white flex items-center justify-center font-black text-sm">
              02
            </div>
            <h3 className="text-base font-black text-[#12233F]">List or Find Materials</h3>
            <p className="text-xs text-[#5F6B7A] font-medium leading-relaxed">
              Upload recyclable by-products or search available materials using smart filters.
            </p>
          </div>

          <div className="bg-white p-7 rounded-3xl border border-[#DDE7E2] shadow-2xs space-y-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#009B6B] text-white flex items-center justify-center font-black text-sm">
              03
            </div>
            <h3 className="text-base font-black text-[#12233F]">Connect & Exchange</h3>
            <p className="text-xs text-[#5F6B7A] font-medium leading-relaxed">
              Communicate with verified partners, negotiate terms, and finalize exchange orders.
            </p>
          </div>

          <div className="bg-white p-7 rounded-3xl border border-[#DDE7E2] shadow-2xs space-y-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#009B6B] text-white flex items-center justify-center font-black text-sm">
              04
            </div>
            <h3 className="text-base font-black text-[#12233F]">Deliver & Track</h3>
            <p className="text-xs text-[#5F6B7A] font-medium leading-relaxed">
              Coordinate freight logistics, monitor journey milestones, and generate ESG records.
            </p>
          </div>

        </div>
      </section>

      {/* 8. TRACEABILITY SECTION */}
      <section className="py-20 bg-white border-y border-[#DDE7E2] px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#009B6B]">
              CHAIN OF CUSTODY
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#12233F] tracking-tight">
              Track the Journey of Every Exchange
            </h2>
            <p className="text-[#5F6B7A] text-xs sm:text-sm font-medium">
              Transparent milestone verification for regulatory compliance and audit trails.
            </p>
          </div>

          {/* Connected Flow Diagram */}
          <div className="bg-[#F6F8F7] p-8 sm:p-10 rounded-3xl border border-[#DDE7E2] shadow-2xs space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 relative">
              
              <div className="bg-white p-4 rounded-2xl border border-[#DDE7E2] text-center space-y-2 shadow-2xs">
                <div className="w-8 h-8 rounded-full bg-[#EAF8F2] text-[#009B6B] flex items-center justify-center mx-auto text-xs font-black">
                  1
                </div>
                <span className="text-xs font-extrabold text-[#12233F] block">Material Listed</span>
                <span className="text-[10px] text-[#5F6B7A] font-medium">Generator posts batch</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#DDE7E2] text-center space-y-2 shadow-2xs">
                <div className="w-8 h-8 rounded-full bg-[#EAF8F2] text-[#009B6B] flex items-center justify-center mx-auto text-xs font-black">
                  2
                </div>
                <span className="text-xs font-extrabold text-[#12233F] block">Matched</span>
                <span className="text-[10px] text-[#5F6B7A] font-medium">Buyer accepted</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#DDE7E2] text-center space-y-2 shadow-2xs">
                <div className="w-8 h-8 rounded-full bg-[#EAF8F2] text-[#009B6B] flex items-center justify-center mx-auto text-xs font-black">
                  3
                </div>
                <span className="text-xs font-extrabold text-[#12233F] block">Exchange Confirmed</span>
                <span className="text-[10px] text-[#5F6B7A] font-medium">Terms validated</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#DDE7E2] text-center space-y-2 shadow-2xs">
                <div className="w-8 h-8 rounded-full bg-[#EAF8F2] text-[#009B6B] flex items-center justify-center mx-auto text-xs font-black">
                  4
                </div>
                <span className="text-xs font-extrabold text-[#12233F] block">Pickup</span>
                <span className="text-[10px] text-[#5F6B7A] font-medium">Weight logged</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#DDE7E2] text-center space-y-2 shadow-2xs">
                <div className="w-8 h-8 rounded-full bg-[#EAF8F2] text-[#009B6B] flex items-center justify-center mx-auto text-xs font-black">
                  5
                </div>
                <span className="text-xs font-extrabold text-[#12233F] block">In Transit</span>
                <span className="text-[10px] text-[#5F6B7A] font-medium">Route dispatched</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#009B6B] text-center space-y-2 shadow-2xs">
                <div className="w-8 h-8 rounded-full bg-[#009B6B] text-white flex items-center justify-center mx-auto text-xs font-black">
                  6
                </div>
                <span className="text-xs font-extrabold text-[#009B6B] block">Delivered</span>
                <span className="text-[10px] text-[#5F6B7A] font-medium">Passport sealed</span>
              </div>

            </div>

            <div className="text-center pt-2">
              <Link
                to="/traceability"
                className="inline-flex items-center gap-2 text-xs font-extrabold text-[#009B6B] hover:underline"
              >
                <span>View Live Traceability Explorer</span>
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 9. LOGISTICS SECTION */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto w-full space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF8F2] text-[#009B6B] text-xs font-extrabold uppercase tracking-wider">
              <FiNavigation className="w-3.5 h-3.5" />
              <span>ROUTE & LOGISTICS</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-[#12233F] tracking-tight">
              Move Materials Efficiently
            </h2>

            <p className="text-[#5F6B7A] text-sm sm:text-base font-medium leading-relaxed">
              Calculate the most cost-effective freight paths between producer and consumer clusters while minimizing carbon footprint.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-white rounded-2xl border border-[#DDE7E2] space-y-1 shadow-2xs">
                <span className="text-xs font-black text-[#12233F] block">Route Optimization</span>
                <span className="text-[11px] text-[#5F6B7A]">GIS-based shortest freight distance</span>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-[#DDE7E2] space-y-1 shadow-2xs">
                <span className="text-xs font-black text-[#12233F] block">CO₂ Estimation</span>
                <span className="text-[11px] text-[#5F6B7A]">Calculated emissions per metric ton</span>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-[#DDE7E2] space-y-1 shadow-2xs">
                <span className="text-xs font-black text-[#12233F] block">Travel Time</span>
                <span className="text-[11px] text-[#5F6B7A]">Estimated transit & delivery schedules</span>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-[#DDE7E2] space-y-1 shadow-2xs">
                <span className="text-xs font-black text-[#12233F] block">Transport Cost</span>
                <span className="text-[11px] text-[#5F6B7A]">Predictable freight rate benchmarks</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to="/logistics"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#009B6B] hover:bg-emerald-700 text-white font-extrabold text-xs shadow-2xs transition-all"
              >
                <span>Explore Logistics Tools</span>
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Logistics Route Visual Card */}
          <div className="lg:col-span-6 bg-white p-6 sm:p-8 rounded-3xl border border-[#DDE7E2] shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-[#DDE7E2] pb-4">
              <span className="font-extrabold text-xs text-[#12233F]">Optimized Freight Corridor</span>
              <span className="text-[10px] bg-[#EAF8F2] text-[#009B6B] font-bold px-2 py-0.5 rounded-full">
                Multi-Point Transit
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 text-xs">
              <div className="p-4 bg-[#F6F8F7] rounded-2xl border border-[#DDE7E2] flex-1 text-center space-y-1">
                <FiMapPin className="w-4 h-4 text-[#009B6B] mx-auto" />
                <span className="font-bold text-[#12233F] block">Seller Location</span>
                <span className="text-[10px] text-[#5F6B7A]">Industrial Cluster</span>
              </div>

              <div className="flex flex-col items-center justify-center shrink-0">
                <span className="text-[10px] font-black text-[#009B6B] uppercase tracking-wider">Optimized Route</span>
                <div className="w-16 sm:w-24 h-0.5 bg-[#009B6B] my-1 relative">
                  <div className="w-2 h-2 rounded-full bg-[#009B6B] absolute -top-[3px] right-0"></div>
                </div>
              </div>

              <div className="p-4 bg-[#F6F8F7] rounded-2xl border border-[#DDE7E2] flex-1 text-center space-y-1">
                <FiCheckCircle className="w-4 h-4 text-[#009B6B] mx-auto" />
                <span className="font-bold text-[#12233F] block">Buyer Location</span>
                <span className="text-[10px] text-[#5F6B7A]">Processing Facility</span>
              </div>
            </div>

            <div className="h-44 rounded-2xl overflow-hidden relative border border-[#DDE7E2]">
              <img
                src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80"
                alt="Industrial Freight Logistics"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-[#12233F]/40 flex items-center justify-center p-4 text-center">
                <span className="text-white text-xs font-bold">
                  Automated Distance & Freight Carbon Benchmarking
                </span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 10. WHY ECOLINK (4 CLEAN CARDS) */}
      <section className="py-20 bg-white border-y border-[#DDE7E2] px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#009B6B]">
              KEY ADVANTAGES
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#12233F] tracking-tight">
              Why EcoLink
            </h2>
            <p className="text-[#5F6B7A] text-xs sm:text-sm font-medium">
              Purpose-built tools for circular industrial exchange.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="bg-[#F6F8F7] p-7 rounded-3xl border border-[#DDE7E2] shadow-2xs space-y-3 hover:border-[#009B6B] transition-all">
              <div className="p-3 w-fit rounded-2xl bg-[#EAF8F2] text-[#009B6B]">
                <FiZap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-[#12233F]">Smart Matching</h3>
              <p className="text-xs text-[#5F6B7A] font-medium leading-relaxed">
                Find compatible buyers and suppliers based on material specifications and geographical location.
              </p>
            </div>

            <div className="bg-[#F6F8F7] p-7 rounded-3xl border border-[#DDE7E2] shadow-2xs space-y-3 hover:border-[#009B6B] transition-all">
              <div className="p-3 w-fit rounded-2xl bg-[#EAF8F2] text-[#009B6B]">
                <FiSearch className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-[#12233F]">Marketplace</h3>
              <p className="text-xs text-[#5F6B7A] font-medium leading-relaxed">
                Browse verified inventory, compare price points, and review testing reports transparently.
              </p>
            </div>

            <div className="bg-[#F6F8F7] p-7 rounded-3xl border border-[#DDE7E2] shadow-2xs space-y-3 hover:border-[#009B6B] transition-all">
              <div className="p-3 w-fit rounded-2xl bg-[#EAF8F2] text-[#009B6B]">
                <FiShield className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-[#12233F]">Traceability</h3>
              <p className="text-xs text-[#5F6B7A] font-medium leading-relaxed">
                Maintain complete digital audit trails from dispatch to final circular consumption.
              </p>
            </div>

            <div className="bg-[#F6F8F7] p-7 rounded-3xl border border-[#DDE7E2] shadow-2xs space-y-3 hover:border-[#009B6B] transition-all">
              <div className="p-3 w-fit rounded-2xl bg-[#EAF8F2] text-[#009B6B]">
                <FiTruck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-[#12233F]">Sustainable Logistics</h3>
              <p className="text-xs text-[#5F6B7A] font-medium leading-relaxed">
                Optimize shipping corridors to lower freight fees and reduce carbon emissions.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 11. SUSTAINABILITY SECTION */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div className="relative rounded-3xl overflow-hidden bg-[#12233F] text-white p-8 sm:p-14 border border-gray-800 shadow-xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#009B6B]/20 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 space-y-10">
            <div className="max-w-2xl space-y-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#009B6B]">
                SUSTAINABLE CIRCULARITY
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                Building a Circular Industrial Network
              </h2>
              <p className="text-gray-300 text-xs sm:text-sm font-medium leading-relaxed">
                Empowering industrial facilities to divert waste from landfills, recover raw materials, and curb carbon emissions.
              </p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-white/10">
              <div className="space-y-1">
                <span className="text-3xl sm:text-4xl font-black text-[#009B6B]">
                  {metrics?.wasteDivertedTonnes ? `${metrics.wasteDivertedTonnes} MT` : '45.0 MT'}
                </span>
                <span className="text-xs text-gray-300 font-bold block uppercase tracking-wider">
                  Materials Diverted
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-3xl sm:text-4xl font-black text-white">
                  {metrics?.co2SavedTonnes ? `${metrics.co2SavedTonnes} MT` : '1.85 MT'}
                </span>
                <span className="text-xs text-gray-300 font-bold block uppercase tracking-wider">
                  Carbon Savings
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-3xl sm:text-4xl font-black text-[#009B6B]">
                  {metrics?.landfillAvoidedPct ? `${metrics.landfillAvoidedPct}%` : '96.5%'}
                </span>
                <span className="text-xs text-gray-300 font-bold block uppercase tracking-wider">
                  Landfill Avoidance
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-3xl sm:text-4xl font-black text-white">
                  {metrics?.circularityScore ? `${metrics.circularityScore}/100` : '89.2/100'}
                </span>
                <span className="text-xs text-gray-300 font-bold block uppercase tracking-wider">
                  Circularity Rating
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 12. FINAL CTA */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div className="p-8 sm:p-14 rounded-3xl border border-[#DDE7E2] text-center space-y-6 bg-gradient-to-br from-[#EAF8F2] via-white to-[#EAF8F2]/60 shadow-sm">
          <div className="inline-flex items-center gap-2 p-2.5 rounded-2xl bg-[#009B6B] text-white mx-auto shadow-2xs">
            <FiZap className="w-5 h-5" />
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-[#12233F] tracking-tight">
            Ready to turn waste into value?
          </h2>
          
          <p className="text-[#5F6B7A] text-xs sm:text-base max-w-xl mx-auto font-medium">
            Connect with the EcoLink industrial resource exchange and accelerate your circular supply chain today.
          </p>

          <div className="flex flex-col sm:flex-row gap-3.5 justify-center pt-2">
            <Link
              to="/marketplace"
              className="px-8 py-3.5 rounded-xl bg-[#009B6B] hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <FiSearch className="w-4 h-4" />
              <span>Explore Marketplace</span>
            </Link>

            <Link
              to="/register"
              className="px-8 py-3.5 rounded-xl bg-white hover:bg-[#F6F8F7] text-[#12233F] font-extrabold text-xs sm:text-sm border border-[#DDE7E2] shadow-2xs transition-all flex items-center justify-center gap-2"
            >
              <span>Get Started</span>
              <FiArrowRight className="w-4 h-4 text-[#009B6B]" />
            </Link>
          </div>
        </div>
      </section>

      {/* 13. COMPACT FINAL FOOTER */}
      <Footer />

    </div>
  );
}
