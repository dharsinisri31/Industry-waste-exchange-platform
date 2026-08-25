import React from 'react';

export default function DashboardCards({ metrics }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
        <span className="text-gray-500 text-xs uppercase font-bold block">Listings</span>
        <span className="text-2xl font-extrabold text-gray-900">{metrics?.uploadedWasteCount || 0}</span>
      </div>
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
        <span className="text-gray-500 text-xs uppercase font-bold block">Carbon Offset</span>
        <span className="text-2xl font-extrabold text-emerald-700">{metrics?.carbonSaved || 0} kg</span>
      </div>
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
        <span className="text-gray-500 text-xs uppercase font-bold block">Revenue</span>
        <span className="text-2xl font-extrabold text-amber-700">${metrics?.revenue || 0}</span>
      </div>
    </div>
  );
}
