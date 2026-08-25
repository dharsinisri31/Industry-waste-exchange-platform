import React from 'react';
import { FiMapPin, FiPhone } from 'react-icons/fi';

export default function IndustryCard({ industry }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3 hover:border-emerald-300 transition-colors">
      <div className="flex justify-between items-start">
        <h4 className="text-sm font-extrabold text-gray-900">{industry.companyName}</h4>
        <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold rounded-full">
          {industry.industryType}
        </span>
      </div>
      <p className="text-xs text-gray-600 font-medium line-clamp-2">{industry.description || 'No description provided.'}</p>
      <div className="text-xs text-gray-600 space-y-1 pt-1 font-medium border-t border-gray-100">
        <div className="flex items-center gap-1.5"><FiMapPin className="text-emerald-600 w-3.5 h-3.5" /> {industry.city}</div>
        <div className="flex items-center gap-1.5"><FiPhone className="text-teal-600 w-3.5 h-3.5" /> {industry.contactPhone || 'N/A'}</div>
      </div>
    </div>
  );
}
