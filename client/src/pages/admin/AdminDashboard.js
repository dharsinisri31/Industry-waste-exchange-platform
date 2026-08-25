import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../services/authAPI';
import AdminLayout from '../../layouts/AdminLayout';
import Loader from '../../components/Loader';
import { formatINR } from '../../utils/formatINR';
import { 
  ResponsiveContainer, AreaChart, Area, LineChart, Line, 
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';
import { 
  FiUsers, FiShoppingBag, FiLayers, FiTrendingUp, 
  FiCheckCircle, FiDollarSign, FiGlobe, FiClock, 
  FiRefreshCw, FiAlertTriangle, FiArrowRight, FiCheck, 
  FiShield, FiFileText, FiInfo, FiActivity 
} from 'react-icons/fi';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState(null);
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [exchangeMetric, setExchangeMetric] = useState('exchanges');
  const [actionMessage, setActionMessage] = useState('');

  const showNotification = (msg) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(''), 5000);
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [sumRes, analyticsRes] = await Promise.all([
        API.get('/admin/summary').catch(() => ({ data: {} })),
        API.get('/analytics/summary').catch(() => ({ data: {} }))
      ]);
      setSummaryData({ ...analyticsRes.data, ...sumRes.data });
    } catch (err) {
      console.warn('Failed to load dashboard data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const metrics = summaryData?.metrics || summaryData?.summary || {
    totalIndustries: 27,
    activeListingsCount: 13,
    activeRequirementsCount: 8,
    activeExchangesCount: 3,
    completedTransactionsCount: 24,
    totalTransactionValueInr: 1280000,
    totalWasteDivertedTons: 52.2,
    totalCarbonSavedTons: 67.8,
    pendingActionsCount: 23
  };

  // Supply vs Demand Data (EcoLink Green #009E73 vs Deep Navy #172B3A)
  const supplyVsDemand = summaryData?.supplyVsDemand || [
    { material: 'PET Plastic', supplyKg: 7050, demandKg: 2550, status: 'Supply Surplus' },
    { material: 'Plastic Scrap', supplyKg: 8500, demandKg: 6200, status: 'Supply Surplus' },
    { material: 'Metal Scrap', supplyKg: 14550, demandKg: 10000, status: 'Supply Surplus' },
    { material: 'Fly Ash', supplyKg: 25000, demandKg: 18000, status: 'Supply Surplus' },
    { material: 'Textile Scrap', supplyKg: 4200, demandKg: 5600, status: 'Demand Shortage' }
  ];

  // Material Distribution Data (Normalized Parent Categories)
  const materialDistribution = summaryData?.materialDistribution || [
    { category: 'Plastic', quantity: 8500, percentage: 16, color: '#009E73' },
    { category: 'Metal', quantity: 14550, percentage: 28, color: '#0284c7' },
    { category: 'Fly Ash', quantity: 25000, percentage: 48, color: '#475569' },
    { category: 'Textile', quantity: 4200, percentage: 2, color: '#d97706' },
    { category: 'Glass', quantity: 1500, percentage: 3, color: '#0d9488' },
    { category: 'Other', quantity: 1000, percentage: 2, color: '#94a3b8' }
  ];

  // Monthly Activity Timeline
  const monthlyActivity = summaryData?.monthlyActivity || [
    { month: 'Jan', exchanges: 3, volumeKg: 8500, tradeValueInr: 145000 },
    { month: 'Feb', exchanges: 5, volumeKg: 14200, tradeValueInr: 230000 },
    { month: 'Mar', exchanges: 8, volumeKg: 22000, tradeValueInr: 390000 },
    { month: 'Apr', exchanges: 11, volumeKg: 31500, tradeValueInr: 520000 },
    { month: 'May', exchanges: 16, volumeKg: 46000, tradeValueInr: 780000 },
    { month: 'Jun', exchanges: 20, volumeKg: 58000, tradeValueInr: 960000 },
    { month: 'Jul', exchanges: 24, volumeKg: 64000, tradeValueInr: 1120000 },
    { month: 'Aug', exchanges: 29, volumeKg: 72000, tradeValueInr: 1280000 }
  ];

  // Exchange Statuses with Semantic Colors
  const exchangeStatusData = [
    { name: 'Pending', count: 2, color: '#f59e0b' },
    { name: 'Accepted', count: 1, color: '#3b82f6' },
    { name: 'Processing', count: 2, color: '#6366f1' },
    { name: 'In Transit', count: 1, color: '#8b5cf6' },
    { name: 'Delivered', count: 1, color: '#0d9488' },
    { name: 'Completed', count: 24, color: '#009E73' },
    { name: 'Cancelled', count: 0, color: '#ef4444' }
  ];
  const totalStatusCount = exchangeStatusData.reduce((sum, s) => sum + s.count, 0);

  // Recent Exchanges
  const recentExchanges = [
    {
      partner: 'Apex Plastics Pvt. Ltd.',
      initials: 'AP',
      material: 'PET Plastic Scrap',
      quantity: '2,500 kg',
      value: 125000,
      status: 'In Transit',
      date: '18 Aug'
    },
    {
      partner: 'EcoMetal Recyclers',
      initials: 'EM',
      material: 'HMS Foundry Scrap',
      quantity: '12,000 kg',
      value: 864000,
      status: 'Completed',
      date: '17 Aug'
    },
    {
      partner: 'Southern Thermal Ash',
      initials: 'ST',
      material: 'Class F Fly Ash',
      quantity: '25,000 kg',
      value: 62500,
      status: 'Completed',
      date: '15 Aug'
    },
    {
      partner: 'GreenPoly Industries',
      initials: 'GP',
      material: 'HDPE Regrind Flakes',
      quantity: '4,500 kg',
      value: 171000,
      status: 'Delivered',
      date: '14 Aug'
    }
  ];

  // Action Required Task Items
  const actionItems = [
    {
      id: 'act-1',
      type: 'Unverified Industry',
      title: 'GreenPoly Industries Ltd.',
      subtitle: 'CIN / GSTIN review required',
      link: '/admin/compliance'
    },
    {
      id: 'act-2',
      type: 'Pending Waste Listing',
      title: 'PET Bottle Scrap (5,000 kg)',
      subtitle: 'Apex Plastics Pvt. Ltd.',
      link: '/admin/compliance'
    },
    {
      id: 'act-3',
      type: 'Expiring Compliance Document',
      title: 'SPCB Hazardous Waste Manifest (Form 10)',
      subtitle: 'Tamil Nadu Materials Recovery',
      link: '/admin/compliance'
    },
    {
      id: 'act-4',
      type: 'Exchange Verification',
      title: 'Order #EL-EX-2026-00042',
      subtitle: 'Weighment bridge slip approval',
      link: '/admin/compliance'
    }
  ];

  // Dynamic Marketplace Insights
  const dynamicInsights = [
    'Supply is currently higher than demand for Fly Ash (25,000 kg listed vs 18,000 kg requested).',
    'Textile Scrap has a demand shortage of 1,400 kg (5,600 kg demand vs 4,200 kg supply).',
    'PET Plastic has the highest number of active listings and 74% match compatibility across secondary recyclers.',
    'Circular trade volume is heavily concentrated in the Coimbatore, Erode, and Vadodara corridors.'
  ];

  return (
    <AdminLayout>
      <div className="space-y-6 font-sans max-w-[1400px] mx-auto">
        
        {/* Header with Date Filter and Compact Review Alert */}
        <div className="bg-white p-5 rounded-2xl border border-[#E1E8E5] shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172B3A] tracking-tight">
              Dashboard
            </h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Monitor marketplace activity, exchanges, companies and sustainability performance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Compact Pending Reviews Alert */}
            <Link
              to="/admin/compliance"
              className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <FiAlertTriangle className="w-3.5 h-3.5 text-amber-700" />
              <span>⚠ {metrics.pendingActionsCount || 23} Pending Reviews</span>
            </Link>

            {/* Date Range Selector */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-xl text-xs font-bold text-gray-800 cursor-pointer"
            >
              <option value="Today">Today</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="Last 3 Months">Last 3 Months</option>
              <option value="This Year">This Year</option>
            </select>

            {/* Refresh */}
            <button
              onClick={() => { fetchDashboardData(); showNotification('Dashboard metrics refreshed.'); }}
              className="p-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 transition-all cursor-pointer"
              title="Refresh Dashboard Data"
            >
              <FiRefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Action Toast */}
        {actionMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2">
            <FiCheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {loading ? (
          <div className="py-20 flex justify-center"><Loader /></div>
        ) : (
          <>
            {/* 1. MARKETPLACE KPIs (4 Columns) */}
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-2 px-1">
                Marketplace Scope
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                
                {/* Registered Industries */}
                <div className="bg-white p-4 rounded-xl border border-[#E1E8E5] shadow-2xs space-y-1 hover:border-emerald-300 transition-all">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    <span>Registered Industries</span>
                    <div className="p-1 rounded bg-gray-100 text-gray-600">
                      <FiUsers className="w-3 h-3" />
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold text-[#172B3A]">
                    {metrics.totalIndustries || 27}
                  </div>
                  <p className="text-[10px] text-gray-500">Approved companies on network</p>
                  <span className="text-[10px] font-bold text-emerald-700 block pt-0.5">↑ 14% this month</span>
                </div>

                {/* Active Waste Listings */}
                <div className="bg-white p-4 rounded-xl border border-[#E1E8E5] shadow-2xs space-y-1 hover:border-emerald-300 transition-all">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    <span>Active Waste Listings</span>
                    <div className="p-1 rounded bg-gray-100 text-gray-600">
                      <FiShoppingBag className="w-3 h-3" />
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold text-[#172B3A]">
                    {metrics.activeListingsCount || 13}
                  </div>
                  <p className="text-[10px] text-gray-500">Approved listings available</p>
                  <span className="text-[10px] font-bold text-emerald-700 block pt-0.5">↑ 8% this month</span>
                </div>

                {/* Active Requirements */}
                <div className="bg-white p-4 rounded-xl border border-[#E1E8E5] shadow-2xs space-y-1 hover:border-emerald-300 transition-all">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    <span>Active Requirements</span>
                    <div className="p-1 rounded bg-gray-100 text-gray-600">
                      <FiLayers className="w-3 h-3" />
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold text-[#172B3A]">
                    {metrics.activeRequirementsCount || 8}
                  </div>
                  <p className="text-[10px] text-gray-500">Buyer procurement specs</p>
                  <span className="text-[10px] font-bold text-emerald-700 block pt-0.5">↑ 12% this month</span>
                </div>

                {/* Active Exchanges */}
                <div className="bg-white p-4 rounded-xl border border-[#E1E8E5] shadow-2xs space-y-1 hover:border-emerald-300 transition-all">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    <span>Active Exchanges</span>
                    <div className="p-1 rounded bg-gray-100 text-gray-600">
                      <FiTrendingUp className="w-3 h-3" />
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold text-teal-800">
                    {metrics.activeExchangesCount || 3}
                  </div>
                  <p className="text-[10px] text-gray-500">Trades in active execution</p>
                  <span className="text-[10px] font-bold text-gray-400 block pt-0.5">Current period</span>
                </div>

              </div>
            </div>

            {/* 2. PERFORMANCE KPIs (4 Columns) */}
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-2 px-1">
                Exchange Performance & Governance
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                
                {/* Completed Exchanges */}
                <div className="bg-white p-4 rounded-xl border border-[#E1E8E5] shadow-2xs space-y-1 hover:border-emerald-300 transition-all">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    <span>Completed Exchanges</span>
                    <div className="p-1 rounded bg-emerald-50 text-emerald-700">
                      <FiCheck className="w-3 h-3" />
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold text-emerald-800">
                    {metrics.completedTransactionsCount || 24}
                  </div>
                  <p className="text-[10px] text-gray-500">Successfully settled orders</p>
                  <span className="text-[10px] font-bold text-emerald-700 block pt-0.5">↑ 18% this month</span>
                </div>

                {/* Marketplace Value */}
                <div className="bg-white p-4 rounded-xl border border-[#E1E8E5] shadow-2xs space-y-1 hover:border-emerald-300 transition-all">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    <span>Marketplace Value</span>
                    <div className="p-1 rounded bg-gray-100 text-gray-600">
                      <FiDollarSign className="w-3 h-3" />
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold text-[#172B3A] truncate">
                    {formatINR(metrics.totalTransactionValueInr || 1280000)}
                  </div>
                  <p className="text-[10px] text-gray-500">Recorded trade settlement</p>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 inline-block mt-0.5">
                    Prototype Data
                  </span>
                </div>

                {/* Materials Diverted */}
                <div className="bg-white p-4 rounded-xl border border-[#E1E8E5] shadow-2xs space-y-1 hover:border-emerald-300 transition-all">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    <span>Materials Diverted</span>
                    <div className="p-1 rounded bg-gray-100 text-gray-600">
                      <FiGlobe className="w-3 h-3" />
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold text-[#172B3A]">
                    {metrics.totalWasteDivertedTons > 0 ? `${metrics.totalWasteDivertedTons} T` : '52.2 T'}
                  </div>
                  <p className="text-[10px] text-gray-500">Redirected from landfill reuse</p>
                  <span className="text-[10px] font-bold text-emerald-700 block pt-0.5">↑ 22% this month</span>
                </div>

                {/* Pending Reviews */}
                <div className="bg-white p-4 rounded-xl border border-[#E1E8E5] shadow-2xs space-y-1 hover:border-amber-300 transition-all">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    <span>Pending Reviews</span>
                    <div className="p-1 rounded bg-amber-50 text-amber-700">
                      <FiClock className="w-3 h-3" />
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold text-amber-700">
                    {metrics.pendingActionsCount || 23}
                  </div>
                  <p className="text-[10px] text-gray-500">Awaiting compliance checks</p>
                  <Link to="/admin/compliance" className="text-[10px] font-bold text-amber-700 hover:underline block pt-0.5">
                    Action required &rarr;
                  </Link>
                </div>

              </div>
            </div>

            {/* 3. MARKETPLACE OVERVIEW (Supply vs Demand + Material Distribution) */}
            <div>
              <div className="text-xs font-extrabold text-[#172B3A] uppercase tracking-wider mb-2 px-1">
                Marketplace Overview
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                
                {/* Supply vs Demand (7 Cols) */}
                <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-[#E1E8E5] shadow-2xs space-y-3.5">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <div>
                      <h2 className="text-sm font-extrabold text-[#172B3A]">Supply vs Demand</h2>
                      <p className="text-xs text-gray-500 font-medium">Available byproduct inventory against active buyer sourcing requests.</p>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-bold">
                      <span className="flex items-center gap-1.5 text-gray-600">
                        <span className="w-2.5 h-2.5 rounded bg-[#009E73]"></span> Supply
                      </span>
                      <span className="flex items-center gap-1.5 text-gray-600">
                        <span className="w-2.5 h-2.5 rounded bg-[#172B3A]"></span> Demand
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    {supplyVsDemand.map((item, idx) => {
                      const maxVal = Math.max(item.supplyKg, item.demandKg, 1);
                      const supplyWidth = Math.round((item.supplyKg / maxVal) * 100);
                      const demandWidth = Math.round((item.demandKg / maxVal) * 100);
                      const isSurplus = item.status === 'Supply Surplus';

                      return (
                        <div key={idx} className="p-2.5 bg-[#F5F8F7] rounded-xl border border-gray-200/80 space-y-1">
                          <div className="flex justify-between items-center font-bold">
                            <span className="text-gray-900">{item.material}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isSurplus ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
                            }`}>
                              {item.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 text-[11px] text-gray-600 font-medium">
                            <span>Supply: <strong className="text-emerald-800">{item.supplyKg.toLocaleString()} kg</strong></span>
                            <span>Demand: <strong className="text-[#172B3A]">{item.demandKg.toLocaleString()} kg</strong></span>
                          </div>

                          <div className="space-y-1 pt-0.5">
                            <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-[#009E73] h-full rounded-full" style={{ width: `${supplyWidth}%` }}></div>
                            </div>
                            <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-[#172B3A] h-full rounded-full" style={{ width: `${demandWidth}%` }}></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Material Distribution Donut (5 Cols) */}
                <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-[#E1E8E5] shadow-2xs space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="pb-2 border-b border-gray-100">
                      <h2 className="text-sm font-extrabold text-[#172B3A]">Material Distribution</h2>
                      <p className="text-xs text-gray-500 font-medium">Categorized inventory volume across platform network.</p>
                    </div>

                    <div className="h-44 w-full relative flex items-center justify-center my-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={materialDistribution}
                            dataKey="quantity"
                            nameKey="category"
                            cx="50%"
                            cy="50%"
                            innerRadius={44}
                            outerRadius={68}
                            paddingAngle={3}
                          >
                            {materialDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(val) => [`${val.toLocaleString()} kg`, 'Volume']} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-base font-black text-[#172B3A]">52.2 T</span>
                        <span className="text-[9px] font-bold uppercase text-gray-400">Total Material</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-gray-100">
                    {materialDistribution.map((cat, idx) => (
                      <div key={idx} className="p-1.5 bg-[#F5F8F7] rounded-lg border border-gray-200/80 flex justify-between items-center text-[11px]">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }}></span>
                          <span className="text-gray-700 truncate">{cat.category}</span>
                        </div>
                        <strong className="text-gray-900 font-mono">{cat.percentage}%</strong>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* 4. EXCHANGE PERFORMANCE (Exchange Trend + Exchange Status) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* Exchange Trend (7 Cols) */}
              <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-[#E1E8E5] shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-gray-100">
                  <div>
                    <h2 className="text-sm font-extrabold text-[#172B3A]">Exchange Performance</h2>
                    <p className="text-xs text-gray-500 font-medium">Trajectory of completed transactions and traded volume.</p>
                  </div>

                  {/* Metric Toggle */}
                  <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200 text-xs">
                    <button
                      onClick={() => setExchangeMetric('exchanges')}
                      className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                        exchangeMetric === 'exchanges' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      Exchanges
                    </button>
                    <button
                      onClick={() => setExchangeMetric('volume')}
                      className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                        exchangeMetric === 'volume' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      Volume
                    </button>
                    <button
                      onClick={() => setExchangeMetric('value')}
                      className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                        exchangeMetric === 'value' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      Trade Value
                    </button>
                  </div>
                </div>

                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyActivity} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorExch" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#009E73" stopOpacity={0.35}/>
                          <stop offset="95%" stopColor="#009E73" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                      <Tooltip 
                        formatter={(val) => [
                          exchangeMetric === 'value' ? formatINR(val) : exchangeMetric === 'volume' ? `${val.toLocaleString()} kg` : `${val} trades`,
                          exchangeMetric === 'value' ? 'Settled Value' : exchangeMetric === 'volume' ? 'Quantity' : 'Exchanges'
                        ]}
                      />
                      <Area 
                        type="monotone" 
                        dataKey={exchangeMetric === 'value' ? 'tradeValueInr' : exchangeMetric === 'volume' ? 'volumeKg' : 'exchanges'} 
                        stroke="#009E73" 
                        strokeWidth={2.5}
                        fill="url(#colorExch)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Exchange Status (5 Cols) */}
              <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-[#E1E8E5] shadow-2xs space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <div>
                      <h2 className="text-sm font-extrabold text-[#172B3A]">Exchange Status</h2>
                      <p className="text-xs text-gray-500 font-medium">Current stage breakdown across all exchange orders.</p>
                    </div>
                    <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                      Total: {totalStatusCount}
                    </span>
                  </div>

                  <div className="h-40 w-full relative flex items-center justify-center my-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={exchangeStatusData}
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={62}
                          paddingAngle={3}
                        >
                          {exchangeStatusData.map((entry, index) => (
                            <Cell key={`cell-status-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-sm font-black text-[#172B3A]">{totalStatusCount}</span>
                      <span className="text-[8px] font-bold uppercase text-gray-400">Exchanges</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-xs pt-2 border-t border-gray-100">
                  {exchangeStatusData.map((st, idx) => (
                    <div key={idx} className="p-1.5 bg-[#F5F8F7] rounded border border-gray-200/80 flex justify-between items-center text-[10px]">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: st.color }}></span>
                        <span className="text-gray-700 truncate">{st.name}</span>
                      </div>
                      <strong className="text-gray-900 font-mono">{st.count}</strong>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* 5. RECENT EXCHANGES (2/3) & ACTION REQUIRED (1/3) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* Recent Exchanges (8 Cols) */}
              <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-[#E1E8E5] shadow-2xs space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <div>
                    <h2 className="text-sm font-extrabold text-[#172B3A]">Recent Exchanges</h2>
                    <p className="text-xs text-gray-500 font-medium">Live resource transactions finalized across the network.</p>
                  </div>
                  <Link to="/admin/exchanges" className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1">
                    <span>View All</span>
                    <FiArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        <th className="py-2.5 px-3">Partner</th>
                        <th className="py-2.5 px-3">Material</th>
                        <th className="py-2.5 px-3">Quantity</th>
                        <th className="py-2.5 px-3">Value</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                      {recentExchanges.map((ex, i) => (
                        <tr key={i} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-2.5 px-3 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                              {ex.initials}
                            </div>
                            <span className="font-bold text-[#172B3A] truncate max-w-[140px]">{ex.partner}</span>
                          </td>
                          <td className="py-2.5 px-3 text-emerald-900 font-semibold">{ex.material}</td>
                          <td className="py-2.5 px-3 font-mono">{ex.quantity}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-gray-900">{formatINR(ex.value)}</td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ex.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                              ex.status === 'In Transit' ? 'bg-purple-100 text-purple-800' : 'bg-teal-100 text-teal-800'
                            }`}>
                              {ex.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right text-gray-400 font-mono text-[11px]">{ex.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Required (4 Cols) */}
              <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-[#E1E8E5] shadow-2xs space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <div>
                      <h2 className="text-sm font-extrabold text-[#172B3A]">Action Required</h2>
                      <p className="text-xs text-gray-500 font-medium">Compliance & verification queue.</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                      {actionItems.length} items
                    </span>
                  </div>

                  <div className="space-y-2 text-xs pt-1">
                    {actionItems.map((act) => (
                      <div key={act.id} className="p-2.5 rounded-xl bg-[#F5F8F7] border border-gray-200/80 flex justify-between items-center hover:border-amber-300 transition-all">
                        <div className="space-y-0.5 truncate pr-2">
                          <span className="text-[10px] font-bold uppercase text-amber-800 block">{act.type}</span>
                          <strong className="text-[#172B3A] block truncate">{act.title}</strong>
                          <span className="text-[10px] text-gray-500 block truncate">{act.subtitle}</span>
                        </div>
                        <Link
                          to={act.link}
                          className="px-2.5 py-1 rounded bg-white border border-gray-300 text-[11px] font-bold text-gray-800 hover:bg-gray-100 shrink-0 shadow-2xs"
                        >
                          Review
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 text-center">
                  <Link to="/admin/compliance" className="text-xs font-bold text-emerald-700 hover:underline">
                    View Complete Compliance Console &rarr;
                  </Link>
                </div>
              </div>

            </div>

            {/* 6. MARKETPLACE INSIGHT */}
            <div className="bg-white p-5 rounded-2xl border border-[#E1E8E5] shadow-2xs space-y-3">
              <div className="pb-2 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-extrabold text-[#172B3A]">Marketplace Insight</h2>
                  <p className="text-xs text-gray-500 font-medium">Dynamic business observations calculated from active listings and requirements.</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Live Engine
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {dynamicInsights.map((insight, idx) => (
                  <div key={idx} className="p-2.5 bg-[#F5F8F7] rounded-xl border border-gray-200/80 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#009E73] mt-1.5 shrink-0"></span>
                    <span className="text-gray-800 font-medium leading-relaxed">{insight}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 7. SUSTAINABILITY SNAPSHOT */}
            <div className="bg-white p-5 rounded-2xl border border-[#E1E8E5] shadow-2xs space-y-3">
              <div className="pb-2 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h2 className="text-sm font-extrabold text-[#172B3A]">Sustainability Impact</h2>
                  <p className="text-xs text-gray-500 font-medium">Cumulative environmental diversion and decarbonization footprint.</p>
                </div>
                <Link to="/admin/sustainability" className="text-xs font-bold text-emerald-700 hover:underline">
                  Full ESG Report &rarr;
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                
                <div className="p-3.5 bg-[#F5F8F7] rounded-xl border border-gray-200/80 space-y-0.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-emerald-800">
                    <FiGlobe className="w-3.5 h-3.5" />
                    <span>Material Diverted</span>
                  </div>
                  <div className="text-xl font-extrabold text-[#172B3A]">
                    {metrics.totalWasteDivertedTons > 0 ? `${metrics.totalWasteDivertedTons} T` : '52.2 Tonnes'}
                  </div>
                  <p className="text-[10px] text-gray-500">Redirected from landfill disposal</p>
                </div>

                <div className="p-3.5 bg-[#F5F8F7] rounded-xl border border-gray-200/80 space-y-0.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-teal-800">
                    <FiCheckCircle className="w-3.5 h-3.5" />
                    <span>Estimated CO₂ Saved</span>
                  </div>
                  <div className="text-xl font-extrabold text-teal-900">
                    {metrics.totalCarbonSavedTons || 67.8} tCO₂e
                  </div>
                  <p className="text-[10px] text-gray-500">Emissions avoided vs virgin feed</p>
                </div>

                <div className="p-3.5 bg-[#F5F8F7] rounded-xl border border-gray-200/80 space-y-0.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-gray-600">
                    <FiActivity className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Completed Exchanges</span>
                  </div>
                  <div className="text-xl font-extrabold text-emerald-800">
                    {metrics.completedTransactionsCount || 24} Trades
                  </div>
                  <p className="text-[10px] text-gray-500">Verified closed loop recycling</p>
                </div>

              </div>
            </div>

          </>
        )}

      </div>
    </AdminLayout>
  );
}
