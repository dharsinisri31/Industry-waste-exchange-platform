import React, { useState, useEffect } from 'react';
import API from '../../services/authAPI';
import AdminLayout from '../../layouts/AdminLayout';
import Loader from '../../components/Loader';
import { 
  FiGlobe, FiCheckCircle, FiTrendingUp, FiLayers, 
  FiRefreshCw, FiAward, FiShield 
} from 'react-icons/fi';

export default function AdminSustainability() {
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState(null);

  const fetchSustainabilityData = async () => {
    try {
      setLoading(true);
      const res = await API.get('/admin/summary');
      if (res.data) setSummaryData(res.data);
    } catch (err) {
      console.warn('Failed to load sustainability metrics:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSustainabilityData();
  }, []);

  const metrics = summaryData?.metrics || {
    totalWasteDivertedTons: 0,
    totalCarbonSavedTons: 0,
    completedTransactionsCount: 0,
    activeExchangesCount: 0
  };

  return (
    <AdminLayout>
      <div className="space-y-6 font-sans">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-3xl border border-[#DDE7E2] shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#12233F] tracking-tight">
              Sustainability Impact
            </h1>
            <p className="text-xs text-[#5F6B7A] font-medium mt-1">
              Track environmental impact generated through circular material exchanges across the network.
            </p>
          </div>
        </div>

        {/* 4 Primary Impact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Total Waste Diverted</span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-800">
              {metrics.totalWasteDivertedTons > 0 ? `${metrics.totalWasteDivertedTons} T` : '0 T'}
            </div>
            <p className="text-[10px] text-gray-500">Prevented from landfilling</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Net Avoided CO₂e</span>
            <div className="text-2xl sm:text-3xl font-black text-teal-800">
              {metrics.totalCarbonSavedTons > 0 ? `${metrics.totalCarbonSavedTons} tCO₂e` : '0 tCO₂e'}
            </div>
            <p className="text-[10px] text-gray-500">Lifecycle emission reduction</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Completed Exchanges</span>
            <div className="text-2xl sm:text-3xl font-black text-gray-900">
              {metrics.completedTransactionsCount || 0}
            </div>
            <p className="text-[10px] text-gray-500">Verified circular trades</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Virgin Material Replaced</span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-800">
              {metrics.totalWasteDivertedTons > 0 ? `${(metrics.totalWasteDivertedTons * 0.85).toFixed(1)} T` : '0 T'}
            </div>
            <p className="text-[10px] text-gray-500">Estimated virgin extraction saved</p>
          </div>
        </div>

        {/* Circularity Standards & Verification */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <div>
              <h2 className="text-base font-extrabold text-gray-900">Circular Economy Accounting Protocols</h2>
              <p className="text-xs text-gray-500 font-medium">Methodology for calculating avoided lifecycle GHG emissions per commodity.</p>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              ISO 14044 / GHG Protocol
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
              <div className="flex items-center gap-2">
                <FiAward className="text-emerald-700 w-4 h-4" />
                <span className="font-bold text-gray-900">Polymers & Plastics</span>
              </div>
              <p className="text-gray-600 leading-relaxed font-medium">
                1.85 kg CO₂e avoided per kg recycled PET/HDPE compared to virgin petroleum resin synthesis.
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
              <div className="flex items-center gap-2">
                <FiAward className="text-teal-700 w-4 h-4" />
                <span className="font-bold text-gray-900">Fly Ash in Cement</span>
              </div>
              <p className="text-gray-600 leading-relaxed font-medium">
                0.82 kg CO₂e avoided per kg of Ordinary Portland Cement replaced by pozzolanic thermal fly ash.
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
              <div className="flex items-center gap-2">
                <FiAward className="text-emerald-700 w-4 h-4" />
                <span className="font-bold text-gray-900">Metals & Foundry Scrap</span>
              </div>
              <p className="text-gray-600 leading-relaxed font-medium">
                4.2 kg CO₂e avoided per kg of secondary aluminium/steel remelted vs virgin ore smelting.
              </p>
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
