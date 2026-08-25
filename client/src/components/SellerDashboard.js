import React from 'react';
import { Link } from 'react-router-dom';
import { formatINR } from '../utils/formatINR';
import { 
  FiShoppingBag, FiGlobe, FiDollarSign, 
  FiPlus, FiCheckCircle, FiActivity, FiMapPin, FiArrowRight, FiZap 
} from 'react-icons/fi';

export default function SellerDashboard({ user, profile, metrics = {}, nearbyIndustries = [] }) {
  const safeMetrics = {
    uploadedWasteCount: metrics?.uploadedWasteCount ?? 0,
    revenue: metrics?.revenue ?? 0,
    carbonSaved: metrics?.carbonSaved ?? 0,
    pendingCount: metrics?.pendingCount ?? 0,
    completedCount: metrics?.completedCount ?? 0
  };

  const safeNearby = Array.isArray(nearbyIndustries) ? nearbyIndustries : [];

  return (
    <div className="space-y-8">
      {/* Seller Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Seller Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1 font-medium">
            Welcome back, {profile?.companyName || user?.name || user?.email || 'Seller'}. Track your active waste listings, circular revenue, and buyer matches.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            to="/upload-waste"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition-all flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <FiPlus className="w-4 h-4" /> List New Waste
          </Link>
          <Link
            to="/recommendations"
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold rounded-xl text-xs transition-all border border-gray-200"
          >
            Find Buyers
          </Link>
        </div>
      </div>

      {/* Seller Stat Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Active Listings */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-300 transition-colors">
          <div className="flex justify-between items-center">
            <span className="uppercase tracking-wider font-bold text-[11px] text-gray-500">Active Listings</span>
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
              <FiShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {safeMetrics.uploadedWasteCount}
            </div>
            <span className="text-xs font-semibold text-emerald-700 mt-1 inline-block">Marketplace Active</span>
          </div>
        </div>

        {/* Carbon Offset */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-300 transition-colors">
          <div className="flex justify-between items-center">
            <span className="uppercase tracking-wider font-bold text-[11px] text-gray-500">Carbon Offset</span>
            <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
              <FiGlobe className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {(Number(safeMetrics.carbonSaved) || 0).toFixed(1)} <span className="text-lg font-bold text-gray-600">kg</span>
            </div>
            <span className="text-xs font-semibold text-emerald-700 mt-1 inline-block">CO₂ Diverted</span>
          </div>
        </div>

        {/* Circular Revenue */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-amber-300 transition-colors">
          <div className="flex justify-between items-center">
            <span className="uppercase tracking-wider font-bold text-[11px] text-gray-500">Circular Revenue</span>
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
              <FiDollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {formatINR(safeMetrics.revenue)}
            </div>
            <span className="text-xs font-semibold text-amber-700 mt-1 inline-block">Earned from Byproducts</span>
          </div>
        </div>

        {/* Completed Exchanges */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-indigo-300 transition-colors">
          <div className="flex justify-between items-center">
            <span className="uppercase tracking-wider font-bold text-[11px] text-gray-500">Completed Exchanges</span>
            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100">
              <FiCheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {safeMetrics.completedCount}
            </div>
            <span className="text-xs font-semibold text-indigo-700 mt-1 inline-block">{safeMetrics.pendingCount} Pending Requests</span>
          </div>
        </div>

      </div>

      {/* Grid Section: Account Info & Nearby Symbiosis Partners */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Account Details Panel */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
              <FiActivity className="text-emerald-600 w-4 h-4" /> Facility Specs
            </h3>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex justify-between items-center">
                <span className="text-gray-600 font-medium">Account Email</span>
                <span className="font-bold text-gray-900 truncate max-w-[160px]">{user?.email}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex justify-between items-center">
                <span className="text-gray-600 font-medium">Reg. Number</span>
                <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">{profile?.registrationNumber || 'REG-IND-9912'}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex justify-between items-center">
                <span className="text-gray-600 font-medium">Sector</span>
                <span className="font-bold text-gray-900">{profile?.industryType || 'Manufacturing'}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex justify-between items-center">
                <span className="text-gray-600 font-medium">City / Region</span>
                <span className="font-bold text-gray-900">{profile?.city || 'Bangalore'}</span>
              </div>
            </div>
          </div>
          <Link
            to="/profile"
            className="w-full py-2.5 mt-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2"
          >
            Edit Profile Details
          </Link>
        </div>

        {/* Nearby Symbiosis Buyers */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
              <FiMapPin className="text-emerald-600 w-4 h-4" /> AI Matched Buyer Industries (300km Radius)
            </h3>
            <Link to="/recommendations" className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1">
              Find AI Buyers <FiArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {safeNearby.length === 0 ? (
            <div className="text-center py-12 text-xs text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200 space-y-2">
              <p>No nearby industry profiles found within 100km radius.</p>
              <Link to="/marketplace" className="text-emerald-700 font-bold hover:underline inline-block">
                Browse Marketplace Directory &rarr;
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
