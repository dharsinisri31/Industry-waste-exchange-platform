import React from 'react';
import { FiAward, FiMapPin } from 'react-icons/fi';

export default function RecommendationCard({ recommendation }) {
  const matchPercent = Math.round((recommendation?.score || 0.9) * 100);
  const ind = recommendation?.industry || {};

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3 hover:border-emerald-300 transition-colors">
      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
        <span className="text-sm font-extrabold text-gray-900">{ind.companyName || 'Partner'}</span>
        <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1">
          <FiAward className="text-emerald-600" /> {matchPercent}% Match
        </span>
      </div>
      <p className="text-xs text-gray-600 font-medium line-clamp-2">{ind.description || 'Verified industrial symbiosis match.'}</p>
      <div className="text-xs text-gray-600 flex items-center gap-1.5 font-medium pt-1">
        <FiMapPin className="text-emerald-600 w-3.5 h-3.5" /> {ind.address || ''} {ind.city ? `, ${ind.city}` : ''}
      </div>
    </div>
  );
}
