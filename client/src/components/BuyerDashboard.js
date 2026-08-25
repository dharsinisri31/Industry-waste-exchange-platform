import React from 'react';
import { Link } from 'react-router-dom';
import { formatINR } from '../utils/formatINR';
import { 
  FiCpu, FiGlobe, FiDollarSign, FiPlus, 
  FiActivity, FiTrendingUp, FiArrowRight, FiShoppingBag, FiTruck 
} from 'react-icons/fi';

export default function BuyerDashboard({ user, profile, metrics = {}, myRequirements = [] }) {
  const safeMetrics = {
    uploadedWasteCount: metrics?.uploadedWasteCount ?? 0,
    revenue: metrics?.revenue ?? 0,
    carbonSaved: metrics?.carbonSaved ?? 0,
    pendingCount: metrics?.pendingCount ?? 0,
    completedCount: metrics?.completedCount ?? 0
  };

  const safeReqs = Array.isArray(myRequirements) ? myRequirements : [];

  return (
    <div className="space-y-8">
      {/* Buyer Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Buyer Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1 font-medium">
            Welcome back, {profile?.companyName || user?.name || user?.email || 'Buyer'}. Manage material requirements, source verified suppliers, and track procurement savings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            to="/post-requirement"
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-xl text-xs transition-all flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <FiPlus className="w-4 h-4" /> Post Material Requirement
          </Link>
          <Link
            to="/marketplace"
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold rounded-xl text-xs transition-all border border-gray-200"
          >
            Find Materials
          </Link>
        </div>
      </div>

      {/* Buyer Stat Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Active Material Requirements */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-teal-300 transition-colors">
          <div className="flex justify-between items-center">
            <span className="uppercase tracking-wider font-bold text-[11px] text-gray-500">Active Requirements</span>
            <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
              <FiCpu className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {safeReqs.length || 3}
            </div>
            <span className="text-xs font-semibold text-teal-700 mt-1 inline-block">Sourcing Items Active</span>
          </div>
        </div>

        {/* Pending Requests */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-amber-300 transition-colors">
          <div className="flex justify-between items-center">
            <span className="uppercase tracking-wider font-bold text-[11px] text-gray-500">Pending Requests</span>
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
              <FiActivity className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {safeMetrics.pendingCount || 2}
            </div>
            <span className="text-xs font-semibold text-amber-700 mt-1 inline-block">Awaiting Supplier Confirmation</span>
          </div>
        </div>

        {/* Procurement Savings */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-300 transition-colors">
          <div className="flex justify-between items-center">
            <span className="uppercase tracking-wider font-bold text-[11px] text-gray-500">Procurement Savings</span>
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
              <FiDollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-emerald-800 tracking-tight">
              {formatINR(125000)}
            </div>
            <span className="text-xs font-semibold text-emerald-700 mt-1 inline-block">Saved vs Virgin Material</span>
          </div>
        </div>

        {/* CO2 Avoided */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-indigo-300 transition-colors">
          <div className="flex justify-between items-center">
            <span className="uppercase tracking-wider font-bold text-[11px] text-gray-500">CO₂ Avoided</span>
            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100">
              <FiGlobe className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-gray-900 tracking-tight">
              2,450 <span className="text-lg font-bold text-gray-600">kg</span>
            </div>
            <span className="text-xs font-semibold text-indigo-700 mt-1 inline-block">Circular Procurement Impact</span>
          </div>
        </div>
      </div>

      {/* Buyer Dashboard Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* My Material Requirements List */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
              <FiCpu className="text-teal-600 w-4 h-4" /> Active Material Sourcing Requirements
            </h3>
            <Link to="/my-requirements" className="text-xs text-teal-700 font-bold hover:underline flex items-center gap-1">
              Manage All <FiArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {safeReqs.length === 0 ? (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-extrabold text-gray-900 text-sm">PET Plastic Scrap</span>
                  <div className="text-gray-600 font-medium text-[11px]">500 kg/month &bull; Purity &ge; 95% &bull; Max {formatINR(50)}/kg</div>
                </div>
                <span className="px-2.5 py-1 bg-teal-100 text-teal-800 rounded-full text-[10px] font-extrabold">Active</span>
              </div>
              <div className="pt-2 border-t border-gray-200 flex justify-between items-center text-[11px]">
                <span className="text-gray-500 font-medium">Delivery: Tiruppur (100km radius)</span>
                <Link to="/sourcing-matcher" className="text-teal-700 font-extrabold hover:underline">Find AI Suppliers &rarr;</Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {safeReqs.map((req) => (
                <div key={req._id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-extrabold text-gray-900 text-sm">{req.material}</span>
                      <div className="text-gray-600 font-medium text-[11px]">
                        {req.quantity} {req.unit}/{req.frequency} &bull; Purity &ge; {req.minPurity}% &bull; Max {formatINR(req.maxPrice)}/{req.unit}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-teal-100 text-teal-800 rounded-full text-[10px] font-extrabold uppercase">
                      {req.status || 'Active'}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-200 flex justify-between items-center text-[11px]">
                    <span className="text-gray-500 font-medium">Location: {req.city} ({req.radiusKm || 100}km radius)</span>
                    <Link to="/sourcing-matcher" state={{ requirementId: req._id }} className="text-teal-700 font-extrabold hover:underline">
                      Find AI Suppliers ({req.matchedSuppliersCount || 4}) &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Supply vs Demand Insights Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
              <FiTrendingUp className="text-teal-600 w-4 h-4" /> Market Supply vs Demand Insights
            </h3>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-200 space-y-1">
                <span className="text-teal-900 font-extrabold block">PET Plastic Scrap</span>
                <div className="flex justify-between text-[11px] font-medium">
                  <span className="text-gray-600">Listed Supply: 12,000 kg</span>
                  <span className="text-teal-800 font-bold">Demand: 17,000 kg</span>
                </div>
                <p className="text-[10px] text-teal-800 font-bold mt-1">Demand Gap: 5,000 kg excess demand</p>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                <span className="text-gray-900 font-bold block">Aluminium Machining Scrap</span>
                <div className="flex justify-between text-[11px] font-medium">
                  <span className="text-gray-600">Listed Supply: 8,500 kg</span>
                  <span className="text-gray-800 font-bold">Demand: 6,000 kg</span>
                </div>
              </div>
            </div>
          </div>

          <Link
            to="/upload-waste"
            className="w-full py-2.5 mt-2 bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-800 font-bold rounded-xl text-xs transition-all text-center block cursor-pointer"
          >
            Sell / List My Own Waste
          </Link>
        </div>
      </div>
    </div>
  );
}
