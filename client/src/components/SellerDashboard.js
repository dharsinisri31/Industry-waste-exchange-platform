import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatINR } from '../utils/formatINR';
import { getMyListings } from '../services/wasteAPI';
import { 
  FiLayers, FiGlobe, FiDollarSign, 
  FiPlus, FiCheckCircle, FiActivity, FiMapPin, FiArrowRight, FiZap,
  FiClock, FiXCircle, FiEye, FiShield
} from 'react-icons/fi';

export default function SellerDashboard({ user, profile, metrics = {}, nearbyIndustries = [] }) {
  const [myListings, setMyListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(true);

  useEffect(() => {
    const fetchSellerListings = async () => {
      try {
        setListingsLoading(true);
        const data = await getMyListings();
        setMyListings(Array.isArray(data) ? data : []);
      } catch (err) {
        console.warn('Failed to load seller listings on dashboard:', err);
      } finally {
        setListingsLoading(false);
      }
    };
    fetchSellerListings();
  }, []);

  const getImageSource = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    const backendHost = 'http://localhost:5000';
    return `${backendHost}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  // Compute live breakdown from seller's own listings
  const counts = {
    total: myListings.length,
    pending: myListings.filter(l => (l.status || '').toLowerCase() === 'pending').length,
    approved: myListings.filter(l => ['approved', 'available', 'active'].includes((l.status || '').toLowerCase())).length,
    exchanged: myListings.filter(l => ['exchanged', 'completed', 'transacted'].includes((l.status || '').toLowerCase())).length
  };

  const safeMetrics = {
    revenue: metrics?.revenue ?? 0,
    carbonSaved: metrics?.carbonSaved ?? 0
  };

  const safeNearby = Array.isArray(nearbyIndustries) ? nearbyIndustries : [];

  const renderStatusBadge = (status) => {
    const st = (status || '').toLowerCase();
    if (st === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-300">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span>Pending</span>
        </span>
      );
    }
    if (st === 'approved' || st === 'available' || st === 'active') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Approved</span>
        </span>
      );
    }
    if (st === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-800 border border-rose-300">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          <span>Rejected</span>
        </span>
      );
    }
    if (st === 'exchanged' || st === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-800 border border-indigo-300">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          <span>Exchanged</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gray-100 text-gray-700">
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-8 font-sans">
      
      {/* Seller Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-extrabold uppercase tracking-wider mb-2">
            <FiShield className="w-3.5 h-3.5" />
            <span>Industrial Seller Facility</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Seller Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1 font-medium">
            Welcome back, <strong className="text-gray-900">{profile?.companyName || user?.email || 'Seller'}</strong>. Manage your factory waste streams and circular byproduct revenue.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            to="/upload-waste"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition-all flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <FiPlus className="w-4 h-4" /> Upload Waste
          </Link>
          <Link
            to="/seller/my-waste-listings"
            className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold rounded-xl text-xs transition-all border border-emerald-200"
          >
            My Waste Listings ({counts.total})
          </Link>
        </div>
      </div>

      {/* Waste Listings Status Breakdown Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        {/* Total My Waste */}
        <Link 
          to="/seller/my-waste-listings" 
          className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs hover:border-emerald-400 hover:shadow-xs transition-all space-y-2 block"
        >
          <div className="flex justify-between items-center">
            <span className="uppercase tracking-wider font-bold text-[11px] text-gray-500">My Waste</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
              <FiLayers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-gray-900 tracking-tight">
              {counts.total}
            </div>
            <span className="text-[11px] font-bold text-gray-500 mt-0.5 inline-block">Total Listed Streams</span>
          </div>
        </Link>

        {/* Pending Verification */}
        <Link 
          to="/seller/my-waste-listings" 
          className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs hover:border-amber-400 hover:shadow-xs transition-all space-y-2 block"
        >
          <div className="flex justify-between items-center">
            <span className="uppercase tracking-wider font-bold text-[11px] text-amber-700">Pending</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
              <FiClock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-amber-700 tracking-tight">
              {counts.pending}
            </div>
            <span className="text-[11px] font-bold text-amber-600 mt-0.5 inline-block">Awaiting Verification</span>
          </div>
        </Link>

        {/* Approved / Live */}
        <Link 
          to="/seller/my-waste-listings" 
          className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs hover:border-emerald-400 hover:shadow-xs transition-all space-y-2 block"
        >
          <div className="flex justify-between items-center">
            <span className="uppercase tracking-wider font-bold text-[11px] text-emerald-700">Approved</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
              <FiCheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-emerald-700 tracking-tight">
              {counts.approved}
            </div>
            <span className="text-[11px] font-bold text-emerald-600 mt-0.5 inline-block">Live on Platform</span>
          </div>
        </Link>

        {/* Exchanged */}
        <Link 
          to="/seller/my-waste-listings" 
          className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs hover:border-indigo-400 hover:shadow-xs transition-all space-y-2 block"
        >
          <div className="flex justify-between items-center">
            <span className="uppercase tracking-wider font-bold text-[11px] text-indigo-700">Exchanged</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100">
              <FiActivity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-indigo-700 tracking-tight">
              {counts.exchanged}
            </div>
            <span className="text-[11px] font-bold text-indigo-600 mt-0.5 inline-block">Transacted Batches</span>
          </div>
        </Link>

      </div>

      {/* Recent Waste Listings Section */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-xs space-y-5">
        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2">
              <FiLayers className="text-emerald-600 w-5 h-5" />
              <span>Recent Waste Listings</span>
            </h2>
            <p className="text-xs text-gray-500 font-medium">Your latest uploaded industrial streams and verification states.</p>
          </div>

          <Link
            to="/seller/my-waste-listings"
            className="text-xs font-extrabold text-emerald-700 hover:underline flex items-center gap-1"
          >
            <span>View All ({counts.total})</span>
            <FiArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {listingsLoading ? (
          <div className="py-12 text-center text-xs font-bold text-gray-500">
            <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Loading recent uploads...</span>
          </div>
        ) : myListings.length === 0 ? (
          <div className="text-center py-10 bg-gray-50/60 rounded-2xl border border-dashed border-gray-200 space-y-3">
            <FiPlus className="w-8 h-8 mx-auto text-emerald-600" />
            <p className="text-xs text-gray-600 font-medium max-w-sm mx-auto">
              No waste streams uploaded yet. Monetize your factory byproducts by listing your first resource.
            </p>
            <Link
              to="/upload-waste"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-extrabold hover:bg-emerald-700 transition-all shadow-xs"
            >
              Upload Waste Now
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myListings.slice(0, 3).map(item => {
              const imageSrc = getImageSource(item.imageUrl || item.image);

              return (
                <div
                  key={item._id}
                  className="p-4 bg-gray-50/70 hover:bg-white rounded-2xl border border-gray-200 hover:border-emerald-300 transition-all flex flex-col justify-between space-y-3 shadow-2xs group"
                >
                  <div className="flex gap-3 items-start">
                    <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200 flex items-center justify-center">
                      {imageSrc ? (
                        <img 
                          src={imageSrc} 
                          alt={item.name} 
                          className="w-full h-full object-cover" 
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <FiShield className="w-6 h-6 text-emerald-600" />
                      )}
                    </div>
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 truncate">
                          {item.category}
                        </span>
                        {renderStatusBadge(item.status)}
                      </div>
                      <h4 className="text-xs font-black text-gray-900 truncate group-hover:text-emerald-700 transition-colors">
                        {item.name}
                      </h4>
                      <div className="text-[11px] font-extrabold text-emerald-800">
                        {item.quantity} {item.unit || 'kg'} &bull; {item.pricingMode === 'auction' ? `₹${item.auctionInfo?.startingPrice || item.price} (Auction)` : `₹${item.price}/${item.unit || 'kg'}`}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-200/60 text-[11px]">
                    <span className="text-gray-500 font-medium truncate max-w-[150px]">{item.city || 'Regional Plant'}</span>
                    <Link
                      to={`/waste/${item._id}`}
                      className="font-bold text-emerald-700 hover:underline flex items-center gap-1"
                    >
                      <FiEye className="w-3 h-3" /> View
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Grid Section: Facility Info & Nearby Symbiosis Potential */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Account Details Panel */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
              <FiActivity className="text-emerald-600 w-4 h-4" /> Facility Specs
            </h3>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex justify-between items-center">
                <span className="text-gray-600 font-medium">Corporate Email</span>
                <span className="font-bold text-gray-900 truncate max-w-[160px]">{user?.email}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex justify-between items-center">
                <span className="text-gray-600 font-medium">Reg. / CIN</span>
                <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">{profile?.registrationNumber || 'REG-IND-9912'}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex justify-between items-center">
                <span className="text-gray-600 font-medium">Industry Sector</span>
                <span className="font-bold text-gray-900">{profile?.industryType || 'Manufacturing'}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex justify-between items-center">
                <span className="text-gray-600 font-medium">City / Location</span>
                <span className="font-bold text-gray-900">{profile?.city || 'Bangalore'}</span>
              </div>
            </div>
          </div>
          <Link
            to="/profile"
            className="w-full py-2.5 mt-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2"
          >
            Edit Facility Profile
          </Link>
        </div>

        {/* Nearby Symbiosis Potential */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
              <FiMapPin className="text-emerald-600 w-4 h-4" /> AI Matched Buyer Facilities (300km Radius)
            </h3>
            <Link to="/recommendations" className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1">
              Find AI Buyers <FiArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {safeNearby.length === 0 ? (
            <div className="text-center py-12 text-xs text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200 space-y-2">
              <p>Explore matching procurement demand across buyer industries.</p>
              <Link to="/recommendations" className="text-emerald-700 font-bold hover:underline inline-block">
                View Smart Matches &rarr;
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {safeNearby.map((ind) => (
                <div
                  key={ind._id}
                  className="p-4 bg-gray-50 hover:bg-emerald-50/50 rounded-xl border border-gray-200 transition-colors flex justify-between items-center text-xs"
                >
                  <div>
                    <span className="font-bold text-gray-900 block text-sm">{ind.companyName}</span>
                    <span className="text-xs text-gray-600 font-medium">{ind.industryType} &bull; {ind.city}</span>
                  </div>
                  <Link
                    to="/recommendations"
                    className="px-3.5 py-1.5 bg-emerald-600 text-white font-bold rounded-lg text-xs hover:bg-emerald-700 transition-all shadow-xs"
                  >
                    Match Buyer
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
