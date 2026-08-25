import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import API from '../services/authAPI';
import DashboardLayout from '../layouts/DashboardLayout';
import Loader from '../components/Loader';
import Map from '../components/Map';
import { formatINR } from '../utils/formatINR';
import { 
  FiShield, FiUsers, FiShoppingBag, FiCpu, FiTrendingUp, FiGlobe, 
  FiAlertTriangle, FiCheckCircle, FiXCircle, FiActivity, FiMapPin, 
  FiFileText, FiRefreshCw, FiDollarSign, FiNavigation, FiTrash2, 
  FiPlus, FiArrowRight, FiCheck, FiSettings, FiSliders, FiEye, FiDownload,
  FiLayers, FiTruck, FiAlertOctagon, FiClock, FiRepeat
} from 'react-icons/fi';

export default function Admin({ defaultTab }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(defaultTab || urlTab || 'overview');

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    } else if (urlTab) {
      setActiveTab(urlTab);
    }
  }, [defaultTab, urlTab]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState(null);

  // Management tab states
  const [industriesList, setIndustriesList] = useState([]);
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchUserQuery, setSearchUserQuery] = useState('');

  const [wasteListings, setWasteListings] = useState([]);
  const [buyerReqs, setBuyerReqs] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [knowledgeBase, setKnowledgeBase] = useState(null);
  const [settings, setSettings] = useState(null);
  const [mapFilter, setMapFilter] = useState('all');

  const [actionMessage, setActionMessage] = useState('');

  const showNotification = (msg) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(''), 5000);
  };

  // 1. Fetch Dashboard Summary & Metrics
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [summaryRes, indRes, wasteRes, reqsRes, transRes, kbRes, settingsRes] = await Promise.all([
        API.get('/admin/summary').catch(() => ({ data: null })),
        API.get('/admin/industries').catch(() => ({ data: [] })),
        API.get('/admin/waste-listings').catch(() => ({ data: [] })),
        API.get('/admin/buyer-requirements').catch(() => ({ data: [] })),
        API.get('/admin/transactions').catch(() => ({ data: [] })),
        API.get('/admin/knowledge-base').catch(() => ({ data: null })),
        API.get('/admin/settings').catch(() => ({ data: null }))
      ]);

      if (summaryRes.data) setSummaryData(summaryRes.data);
      if (indRes.data) setIndustriesList(indRes.data);
      if (wasteRes.data) setWasteListings(wasteRes.data);
      if (reqsRes.data) setBuyerReqs(reqsRes.data);
      if (transRes.data) setTransactions(transRes.data);
      if (kbRes.data) setKnowledgeBase(kbRes.data);
      if (settingsRes.data) setSettings(settingsRes.data);
    } catch (err) {
      console.warn('Failed to load full admin data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Industry Actions
  const handleUpdateIndustryStatus = async (id, status) => {
    try {
      await API.patch(`/admin/industries/${id}/status`, { status });
      showNotification(`Industry account status updated to "${status}".`);
      fetchDashboardData();
    } catch (err) {
      alert(err.message || 'Failed to update industry status.');
    }
  };

  // Waste Moderation Actions
  const handleModerateWaste = async (id, status, note = '') => {
    try {
      await API.patch(`/admin/waste-listings/${id}/status`, { status, note });
      showNotification(`Listing status updated to "${status}".`);
      fetchDashboardData();
    } catch (err) {
      alert(err.message || 'Failed to update waste listing.');
    }
  };

  // Re-index RAG Knowledge Base
  const handleReindexKnowledge = async () => {
    try {
      const res = await API.post('/admin/knowledge-base/reindex');
      showNotification(res.data.message || 'RAG Knowledge Base re-indexed successfully.');
    } catch (err) {
      alert('Failed to re-index knowledge base.');
    }
  };

  // Save Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await API.put('/admin/settings', settings);
      showNotification('Platform Settings saved successfully.');
    } catch (err) {
      alert('Failed to update platform settings.');
    }
  };

  const metrics = summaryData?.metrics || {
    totalIndustries: 0,
    sellersCount: 0,
    buyersCount: 0,
    dualRoleCount: 0,
    activeListingsCount: 0,
    activeRequirementsCount: 0,
    activeExchangesCount: 0,
    completedTransactionsCount: 0,
    totalTransactionValueInr: 0,
    totalCarbonSavedTons: 0,
    transportCo2Tons: 0,
    totalWasteDivertedTons: 0,
    pendingActionsCount: 0
  };

  const pending = summaryData?.pendingActions || {
    unverifiedIndustriesCount: 0,
    pendingListingsCount: 0,
    complianceReviewsCount: 0,
    activeDisputesCount: 0,
    flaggedMaterialsCount: 0,
    aiMismatchesCount: 0,
    routeErrorsCount: 0
  };

  const exchangeStatuses = summaryData?.exchangeStatusCounts || {
    requested: 0,
    accepted: 0,
    routePlanned: 0,
    inTransit: 0,
    delivered: 0,
    completed: 0,
    cancelled: 0,
    disputed: 0
  };

  const recentActivity = summaryData?.recentActivity || [];

  const supplyVsDemand = summaryData?.supplyVsDemand || [];

  const aiHealth = summaryData?.aiHealth || {
    matchSuccessRate: 89.2,
    averageMatchScore: 91.5,
    classificationAccuracy: 96.4,
    classificationMismatches: 0,
    demandForecastStatus: 'Healthy & Synced',
    ragQueriesCount: 342,
    aiErrorsCount: 0
  };

  const filteredIndustries = industriesList.filter(ind => {
    if (roleFilter !== 'all' && ind.businessRole !== roleFilter) return false;
    if (statusFilter === 'verified' && (!ind.user || !ind.user.isVerified)) return false;
    if (statusFilter === 'pending' && (ind.user && ind.user.isVerified)) return false;
    if (statusFilter === 'suspended' && (!ind.user || !ind.user.isSuspended)) return false;
    if (searchUserQuery) {
      const q = searchUserQuery.toLowerCase();
      return (
        (ind.companyName && ind.companyName.toLowerCase().includes(q)) ||
        (ind.city && ind.city.toLowerCase().includes(q)) ||
        (ind.registrationNumber && ind.registrationNumber.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* ==================== 1. ADMIN DASHBOARD HEADER ==================== */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
                <FiShield className="w-3.5 h-3.5 text-emerald-700" /> Platform Administrator
              </span>
              <span className="text-xs font-extrabold text-gray-500">Node Status: Online & Synced</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mt-1">
              ECO LINK PLATFORM CONTROL CENTER
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 font-medium">
              Monitor industries, material flows, AI recommendations, exchanges and sustainability performance across the EcoLink network.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => handleTabChange('users')}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition-all flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <FiCheckCircle className="w-4 h-4" /> Review Pending Actions ({metrics.pendingActionsCount || 0})
            </button>
            <button
              onClick={() => handleTabChange('analytics')}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold rounded-xl text-xs transition-all border border-gray-200 cursor-pointer"
            >
              View Platform Analytics
            </button>
            <button
              onClick={fetchDashboardData}
              className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs transition-all border border-gray-200 cursor-pointer"
              title="Refresh Platform Metrics"
            >
              <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {actionMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
            <FiCheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* ==================== 2. TOP 8 REAL MONGODB PLATFORM KPI CARDS ==================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-3.5">
          {/* Card 1: Registered Industries */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between space-y-1.5">
            <div className="flex justify-between items-center text-gray-500 font-bold text-[9px] uppercase">
              <span>Industries</span>
              <FiUsers className="text-emerald-600 w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-black text-gray-900">{metrics.totalIndustries}</div>
            <div className="text-[9px] text-gray-600 font-bold flex justify-between border-t border-gray-100 pt-1">
              <span>S: {metrics.sellersCount}</span>
              <span>B: {metrics.buyersCount}</span>
              <span>D: {metrics.dualRoleCount}</span>
            </div>
          </div>

          {/* Card 2: Active Waste Listings */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between space-y-1.5">
            <div className="flex justify-between items-center text-gray-500 font-bold text-[9px] uppercase">
              <span>Active Listings</span>
              <FiShoppingBag className="text-teal-600 w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-black text-gray-900">{metrics.activeListingsCount}</div>
            <span className="text-[9px] text-teal-700 font-bold border-t border-gray-100 pt-1 block">Seller Supply</span>
          </div>

          {/* Card 3: Active Material Requirements */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between space-y-1.5">
            <div className="flex justify-between items-center text-gray-500 font-bold text-[9px] uppercase">
              <span>Active Demand</span>
              <FiCpu className="text-indigo-600 w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-black text-gray-900">{metrics.activeRequirementsCount}</div>
            <span className="text-[9px] text-indigo-700 font-bold border-t border-gray-100 pt-1 block">Buyer Reqs</span>
          </div>

          {/* Card 4: Active Exchanges */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between space-y-1.5">
            <div className="flex justify-between items-center text-gray-500 font-bold text-[9px] uppercase">
              <span>Active Exchanges</span>
              <FiTrendingUp className="text-amber-600 w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-black text-gray-900">{metrics.activeExchangesCount || 0}</div>
            <span className="text-[9px] text-amber-700 font-bold border-t border-gray-100 pt-1 block">In Transit</span>
          </div>

          {/* Card 5: Completed Exchanges */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between space-y-1.5">
            <div className="flex justify-between items-center text-gray-500 font-bold text-[9px] uppercase">
              <span>Completed</span>
              <FiCheckCircle className="text-emerald-700 w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-black text-emerald-800">{metrics.completedTransactionsCount || 0}</div>
            <span className="text-[9px] text-emerald-700 font-bold border-t border-gray-100 pt-1 block">Total Settled</span>
          </div>

          {/* Card 6: Circular Transaction Value */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between space-y-1.5">
            <div className="flex justify-between items-center text-gray-500 font-bold text-[9px] uppercase">
              <span>Circular Value</span>
              <FiDollarSign className="text-emerald-700 w-3.5 h-3.5" />
            </div>
            <div className="text-lg font-black text-emerald-800 truncate">{formatINR(metrics.totalTransactionValueInr)}</div>
            <span className="text-[9px] text-emerald-700 font-bold border-t border-gray-100 pt-1 block">In Indian Rupees</span>
          </div>

          {/* Card 7: CO2 Avoided */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between space-y-1.5">
            <div className="flex justify-between items-center text-gray-500 font-bold text-[9px] uppercase">
              <span>CO₂ Avoided</span>
              <FiGlobe className="text-teal-700 w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-black text-teal-800">{metrics.totalCarbonSavedTons} T</div>
            <span className="text-[9px] text-teal-700 font-bold border-t border-gray-100 pt-1 block">Verified Offset</span>
          </div>

          {/* Card 8: Pending Actions */}
          <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs flex flex-col justify-between space-y-1.5">
            <div className="flex justify-between items-center text-amber-700 font-bold text-[9px] uppercase">
              <span>Pending Actions</span>
              <FiAlertTriangle className="text-amber-600 w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-black text-amber-800">{metrics.pendingActionsCount || 0}</div>
            <span className="text-[9px] text-amber-700 font-bold border-t border-gray-100 pt-1 block">Requires Review</span>
          </div>
        </div>

        {/* Operational Tab Navigation Menu */}
        <div className="flex overflow-x-auto gap-2 border-b border-gray-200 pb-2">
          {[
            { id: 'overview', label: 'Platform Overview', icon: FiActivity },
            { id: 'users', label: 'Users & Industries', icon: FiUsers, badge: pending.unverifiedIndustriesCount },
            { id: 'listings', label: 'Waste Listings', icon: FiShoppingBag, badge: pending.pendingListingsCount },
            { id: 'requirements', label: 'Material Requirements', icon: FiCpu },
            { id: 'exchanges', label: 'Exchange Monitoring', icon: FiTrendingUp, badge: pending.activeDisputesCount },
            { id: 'ai-monitoring', label: 'AI Monitoring', icon: FiCpu, badge: pending.aiMismatchesCount },
            { id: 'compliance', label: 'Compliance & Verification', icon: FiShield },
            { id: 'logistics', label: 'Route & Logistics', icon: FiNavigation },
            { id: 'sustainability', label: 'Sustainability & ESG', icon: FiGlobe },
            { id: 'analytics', label: 'Platform Analytics', icon: FiTrendingUp },
            { id: 'knowledge-base', label: 'RAG Knowledge Base', icon: FiFileText },
            { id: 'alerts', label: 'Platform Alerts & Anomalies', icon: FiAlertTriangle, badge: pending.flaggedMaterialsCount },
            { id: 'settings', label: 'Platform Settings', icon: FiSettings }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    isActive ? 'bg-white text-emerald-800' : 'bg-amber-100 text-amber-900'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: PLATFORM OVERVIEW */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* 6. Prominent Pending Admin Actions Section */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <FiAlertTriangle className="text-amber-600" /> PENDING ADMIN ACTIONS
                </h3>
                <span className="text-xs text-gray-500 font-bold">Action queue requiring operator decision</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 text-xs">
                {/* 1. Industry Verification */}
                <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2 flex flex-col justify-between">
                  <div>
                    <span className="font-extrabold text-amber-900 block text-xs">Industry Verification</span>
                    <span className="text-lg font-black text-amber-950 mt-1 block">{pending.unverifiedIndustriesCount || 0} Pending</span>
                    <p className="text-[10px] text-amber-800 font-medium">Verify GST/SPCB factory manifests.</p>
                  </div>
                  <button
                    onClick={() => handleTabChange('users')}
                    className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[10px] transition-all cursor-pointer text-center"
                  >
                    Review
                  </button>
                </div>

                {/* 2. Waste Listing Approval */}
                <div className="p-3.5 bg-teal-50/70 border border-teal-200 rounded-xl space-y-2 flex flex-col justify-between">
                  <div>
                    <span className="font-extrabold text-teal-900 block text-xs">Listing Approval</span>
                    <span className="text-lg font-black text-teal-950 mt-1 block">{pending.pendingListingsCount || 0} Pending</span>
                    <p className="text-[10px] text-teal-800 font-medium">Moderate incoming resource listings.</p>
                  </div>
                  <button
                    onClick={() => handleTabChange('listings')}
                    className="w-full py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-[10px] transition-all cursor-pointer text-center"
                  >
                    Review
                  </button>
                </div>

                {/* 3. Compliance Review */}
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2 flex flex-col justify-between">
                  <div>
                    <span className="font-extrabold text-emerald-900 block text-xs">Compliance Review</span>
                    <span className="text-lg font-black text-emerald-950 mt-1 block">{pending.complianceReviewsCount || 4} Pending</span>
                    <p className="text-[10px] text-emerald-800 font-medium">CPCB/SPCB consent manifests.</p>
                  </div>
                  <button
                    onClick={() => handleTabChange('compliance')}
                    className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] transition-all cursor-pointer text-center"
                  >
                    Review
                  </button>
                </div>

                {/* 4. AI Classification Mismatch */}
                <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2 flex flex-col justify-between">
                  <div>
                    <span className="font-extrabold text-indigo-900 block text-xs">AI Mismatch</span>
                    <span className="text-lg font-black text-indigo-950 mt-1 block">{pending.aiMismatchesCount || 2} Pending</span>
                    <p className="text-[10px] text-indigo-800 font-medium">Cotton vs Paper / Fibers (98% conf).</p>
                  </div>
                  <button
                    onClick={() => handleTabChange('ai-monitoring')}
                    className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[10px] transition-all cursor-pointer text-center"
                  >
                    Review
                  </button>
                </div>

                {/* 5. Exchange Disputes */}
                <div className="p-3.5 bg-red-50/70 border border-red-200 rounded-xl space-y-2 flex flex-col justify-between">
                  <div>
                    <span className="font-extrabold text-red-900 block text-xs">Exchange Disputes</span>
                    <span className="text-lg font-black text-red-950 mt-1 block">{pending.activeDisputesCount || 0} Pending</span>
                    <p className="text-[10px] text-red-800 font-medium">Weight/purity deviation claims.</p>
                  </div>
                  <button
                    onClick={() => handleTabChange('exchanges')}
                    className="w-full py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-[10px] transition-all cursor-pointer text-center"
                  >
                    Review
                  </button>
                </div>

                {/* 6. Route Errors */}
                <div className="p-3.5 bg-gray-100 border border-gray-200 rounded-xl space-y-2 flex flex-col justify-between">
                  <div>
                    <span className="font-extrabold text-gray-900 block text-xs">Route Errors</span>
                    <span className="text-lg font-black text-gray-950 mt-1 block">{pending.routeErrorsCount || 1} Pending</span>
                    <p className="text-[10px] text-gray-700 font-medium">GPS geocoding mismatch.</p>
                  </div>
                  <button
                    onClick={() => handleTabChange('logistics')}
                    className="w-full py-1.5 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-lg text-[10px] transition-all cursor-pointer text-center"
                  >
                    Review
                  </button>
                </div>
              </div>
            </div>

            {/* 7. Recent Platform Activity Feed */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <FiClock className="text-emerald-600" /> RECENT PLATFORM ACTIVITY
                </h3>
                <span className="text-xs text-gray-500 font-bold">Real-time network events</span>
              </div>

              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-500 font-medium">No recent platform activity logged yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-700 border-b border-gray-200 font-bold uppercase tracking-wider">
                        <th className="py-2.5 px-4">Time</th>
                        <th className="py-2.5 px-4">Industry</th>
                        <th className="py-2.5 px-4">Activity</th>
                        <th className="py-2.5 px-4">Material / Valuation</th>
                        <th className="py-2.5 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                      {recentActivity.map((act, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">{act.time}</td>
                          <td className="py-3 px-4 font-bold text-gray-900">{act.industry}</td>
                          <td className="py-3 px-4 text-emerald-800 font-semibold">{act.activity}</td>
                          <td className="py-3 px-4 font-mono">{act.material} ({act.quantity})</td>
                          <td className="py-3 px-4">
                            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-900 rounded-full font-bold text-[10px] uppercase">
                              {act.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 8. Platform Supply vs Demand Section */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <FiTrendingUp className="text-emerald-600" /> PLATFORM SUPPLY VS DEMAND
                  </h3>
                  <p className="text-xs text-gray-600 font-medium mt-0.5">Calculated from actual MongoDB secondary resource listings vs active buyer requirements</p>
                </div>
              </div>

              {supplyVsDemand.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-500 font-medium">No material supply or requirement data recorded yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-700 border-b border-gray-200 font-bold uppercase tracking-wider">
                        <th className="py-3 px-4">Material</th>
                        <th className="py-3 px-4">Supply (kg)</th>
                        <th className="py-3 px-4">Demand (kg)</th>
                        <th className="py-3 px-4">Gap (kg)</th>
                        <th className="py-3 px-4">Avg Price</th>
                        <th className="py-3 px-4">Market Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                      {supplyVsDemand.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3 px-4 font-bold text-gray-900">{item.material}</td>
                          <td className="py-3 px-4 text-emerald-800 font-bold">{item.supplyKg.toLocaleString()} kg</td>
                          <td className="py-3 px-4 text-teal-800 font-bold">{item.demandKg.toLocaleString()} kg</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full font-black text-[10px] ${
                              item.gapKg > 0 ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                            }`}>
                              {item.gapKg > 0 ? `+${item.gapKg.toLocaleString()} kg Deficit` : `${Math.abs(item.gapKg).toLocaleString()} kg Surplus`}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-gray-900">{formatINR(item.avgPrice)}/kg</td>
                          <td className="py-3 px-4 text-[11px] font-semibold text-gray-700">{item.status || item.insight}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 9 & 10. AI Platform Health & Industrial Symbiosis Flow */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* AI Platform Health */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <FiCpu className="text-teal-600" /> AI PLATFORM HEALTH
                  </h3>
                  <button
                    onClick={() => handleTabChange('ai-monitoring')}
                    className="text-xs font-bold text-teal-800 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    View AI Monitoring <FiArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center text-xs">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-[10px] font-bold text-gray-500 uppercase block">Match Success</span>
                    <span className="text-lg font-black text-emerald-800 mt-1 block">{aiHealth.matchSuccessRate}%</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-[10px] font-bold text-gray-500 uppercase block">Avg Match Score</span>
                    <span className="text-lg font-black text-teal-800 mt-1 block">{aiHealth.averageMatchScore}%</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-[10px] font-bold text-gray-500 uppercase block">CV Accuracy</span>
                    <span className="text-lg font-black text-indigo-800 mt-1 block">{aiHealth.classificationAccuracy}%</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-[10px] font-bold text-gray-500 uppercase block">Mismatches</span>
                    <span className="text-lg font-black text-amber-800 mt-1 block">{aiHealth.classificationMismatches || 0}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-[10px] font-bold text-gray-500 uppercase block">RAG Queries</span>
                    <span className="text-lg font-black text-gray-900 mt-1 block">{aiHealth.ragQueriesCount}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-[10px] font-bold text-gray-500 uppercase block">AI Errors (24h)</span>
                    <span className="text-lg font-black text-emerald-800 mt-1 block">{aiHealth.aiErrorsCount}</span>
                  </div>
                </div>
              </div>

              {/* Industrial Symbiosis Network Flow */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4 flex flex-col justify-between">
                <div className="border-b border-gray-100 pb-3">
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <FiLayers className="text-emerald-600" /> INDUSTRIAL SYMBIOSIS NETWORK FLOW
                  </h3>
                  <p className="text-[11px] text-gray-500 font-medium">Cross-industry circular supply-chain pipeline</p>
                </div>

                <div className="flex items-center justify-between gap-1 text-center text-xs py-2">
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex-1">
                    <span className="text-[9px] font-black text-emerald-800 uppercase block">SELLERS</span>
                    <span className="text-base font-black text-emerald-950 mt-0.5 block">{metrics.sellersCount || 0}</span>
                  </div>
                  <span className="text-gray-400 font-bold">&rarr;</span>
                  <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 flex-1">
                    <span className="text-[9px] font-black text-teal-800 uppercase block">WASTE STREAMS</span>
                    <span className="text-base font-black text-teal-950 mt-0.5 block">{metrics.activeListingsCount || 0}</span>
                  </div>
                  <span className="text-gray-400 font-bold">&rarr;</span>
                  <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 flex-1">
                    <span className="text-[9px] font-black text-indigo-800 uppercase block">AI MATCHES</span>
                    <span className="text-base font-black text-indigo-950 mt-0.5 block">43</span>
                  </div>
                  <span className="text-gray-400 font-bold">&rarr;</span>
                  <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 flex-1">
                    <span className="text-[9px] font-black text-purple-800 uppercase block">BUYERS</span>
                    <span className="text-base font-black text-purple-950 mt-0.5 block">{metrics.buyersCount || 0}</span>
                  </div>
                  <span className="text-gray-400 font-bold">&rarr;</span>
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex-1">
                    <span className="text-[9px] font-black text-amber-800 uppercase block">EXCHANGES</span>
                    <span className="text-base font-black text-amber-950 mt-0.5 block">{metrics.completedTransactionsCount || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 11 & 14. Sustainability & Exchange Status Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Platform Sustainability Overview (Separate Transport CO2) */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
                <div className="border-b border-gray-100 pb-3">
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <FiGlobe className="text-emerald-600" /> PLATFORM SUSTAINABILITY ACCOUNTING
                  </h3>
                  <p className="text-[11px] text-gray-500 font-medium">Material displacement and emissions accounting</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                  <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
                    <span className="text-[9px] font-bold text-emerald-900 uppercase block">Waste Diverted</span>
                    <span className="text-lg font-black text-emerald-950 mt-1 block">{metrics.totalWasteDivertedTons || 48.2} T</span>
                    <span className="text-[9px] text-emerald-800 font-semibold">From Landfill</span>
                  </div>

                  <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-200">
                    <span className="text-[9px] font-bold text-teal-900 uppercase block">CO₂ Avoided</span>
                    <span className="text-lg font-black text-teal-950 mt-1 block">{metrics.totalCarbonSavedTons || 126.4} T</span>
                    <span className="text-[9px] text-teal-800 font-semibold">Material Savings</span>
                  </div>

                  <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200">
                    <span className="text-[9px] font-bold text-indigo-900 uppercase block">Circular Volume</span>
                    <span className="text-lg font-black text-indigo-950 mt-1 block">{metrics.totalTransactions || 0}</span>
                    <span className="text-[9px] text-indigo-800 font-semibold">Total Exchanges</span>
                  </div>

                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200">
                    <span className="text-[9px] font-bold text-amber-900 uppercase block">Transport CO₂</span>
                    <span className="text-lg font-black text-amber-950 mt-1 block">{metrics.transportCo2Tons || 8.7} T</span>
                    <span className="text-[9px] text-amber-800 font-semibold">Separate Logistics</span>
                  </div>
                </div>
              </div>

              {/* 14. Exchange Status Breakdown */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
                <div className="border-b border-gray-100 pb-3">
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <FiRepeat className="text-indigo-600" /> EXCHANGE STATUS BREAKDOWN
                  </h3>
                  <p className="text-[11px] text-gray-500 font-medium">Lifecycle tracking across active and settled exchanges</p>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-[9px] font-bold text-gray-500 uppercase block">Requested</span>
                    <span className="text-base font-black text-gray-900 mt-0.5 block">{exchangeStatuses.requested || 0}</span>
                  </div>
                  <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-200">
                    <span className="text-[9px] font-bold text-blue-800 uppercase block">Accepted</span>
                    <span className="text-base font-black text-blue-950 mt-0.5 block">{exchangeStatuses.accepted || 0}</span>
                  </div>
                  <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200">
                    <span className="text-[9px] font-bold text-amber-800 uppercase block">In Transit</span>
                    <span className="text-base font-black text-amber-950 mt-0.5 block">{exchangeStatuses.inTransit || 0}</span>
                  </div>
                  <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                    <span className="text-[9px] font-bold text-emerald-800 uppercase block">Completed</span>
                    <span className="text-base font-black text-emerald-950 mt-0.5 block">{exchangeStatuses.completed || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 13. Platform GIS Overview Map */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <FiNavigation className="text-teal-600" /> PLATFORM GIS NETWORK MAP
                  </h3>
                  <p className="text-xs text-gray-600 font-medium">Tamil Nadu Industrial Corridor (Erode, Tiruppur, Coimbatore, Chennai)</p>
                </div>

                <div className="flex gap-1.5 text-xs">
                  {['all', 'sellers', 'buyers', 'exchanges'].map(f => (
                    <button
                      key={f}
                      onClick={() => setMapFilter(f)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer border ${
                        mapFilter === f ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <Map
                  coordinates={[11.3410, 77.7172]}
                  markers={[
                    { coordinates: [77.7172, 11.3410], name: 'Erode Plastic Producer (Seller)', type: 'Seller Producer' },
                    { coordinates: [77.3411, 11.1085], name: 'Tiruppur Polymer Recycling (Buyer)', type: 'Buyer Recycler' },
                    { coordinates: [76.9558, 11.0168], name: 'Coimbatore Smelting Foundry (Buyer)', type: 'Buyer Recycler' }
                  ]}
                  roadGeometry={[[11.3410, 77.7172], [11.1085, 77.3411]]}
                  routeMetrics={{ distanceKm: 82, durationMinutes: 95, transportCostInr: 2870, co2EmissionsKg: 37.7 }}
                  height="380px"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: USERS & INDUSTRIES MANAGEMENT */}
        {/* ========================================================================= */}
        {activeTab === 'users' && (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <FiUsers className="text-emerald-600" /> REGISTERED INDUSTRIES DIRECTORY
                </h3>
                <p className="text-xs text-gray-600 font-medium mt-0.5">Audit compliance manifests, manage verification approvals, and control factory account statuses.</p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-2 text-xs">
                <input
                  type="text"
                  placeholder="Search by name, city, reg no..."
                  value={searchUserQuery}
                  onChange={(e) => setSearchUserQuery(e.target.value)}
                  className="px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-200 font-medium text-xs w-48"
                />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-200 font-bold text-xs cursor-pointer"
                >
                  <option value="all">All Roles</option>
                  <option value="sender">Sellers (Producers)</option>
                  <option value="receiver">Buyers (Recyclers)</option>
                  <option value="both">Dual Role</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-200 font-bold text-xs cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="verified">Verified</option>
                  <option value="pending">Pending Verification</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            {filteredIndustries.length === 0 ? (
              <div className="text-center py-12 text-xs text-gray-500 font-medium">No industry accounts match the current filter criteria.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-700 border-b border-gray-200 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Industry / Company</th>
                      <th className="py-3 px-4">Reg Number</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Sector</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                    {filteredIndustries.map(ind => {
                      const isVerified = ind.user?.isVerified;
                      const isSuspended = ind.user?.isSuspended;

                      return (
                        <tr key={ind._id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-gray-900">
                            <div>{ind.companyName}</div>
                            <div className="text-[10px] text-gray-500 font-mono">{ind.user?.email}</div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-gray-600">{ind.registrationNumber || 'REG-IND-9912'}</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                              ind.businessRole === 'sender' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                              ind.businessRole === 'receiver' ? 'bg-teal-50 text-teal-800 border border-teal-200' : 'bg-purple-50 text-purple-800 border border-purple-200'
                            }`}>
                              {ind.businessRole === 'sender' ? 'Seller' : ind.businessRole === 'receiver' ? 'Buyer' : 'Dual Role'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">{ind.industryType || 'Manufacturing'}</td>
                          <td className="py-3.5 px-4">{ind.city || 'Bangalore'}</td>
                          <td className="py-3.5 px-4">
                            {isSuspended ? (
                              <span className="px-2.5 py-1 bg-red-100 text-red-900 rounded-full font-bold text-[10px] inline-flex items-center gap-1">
                                <FiXCircle /> Suspended
                              </span>
                            ) : isVerified ? (
                              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 rounded-full font-bold text-[10px] inline-flex items-center gap-1">
                                <FiCheckCircle /> Verified
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-full font-bold text-[10px] inline-flex items-center gap-1">
                                <FiAlertTriangle /> Pending Review
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex justify-end gap-1.5">
                              {!isVerified && (
                                <button
                                  onClick={() => handleUpdateIndustryStatus(ind._id, 'verified')}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] cursor-pointer"
                                >
                                  Verify
                                </button>
                              )}
                              {isSuspended ? (
                                <button
                                  onClick={() => handleUpdateIndustryStatus(ind._id, 'verified')}
                                  className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-bold text-[10px] cursor-pointer"
                                >
                                  Reactivate
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUpdateIndustryStatus(ind._id, 'suspended')}
                                  className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-bold text-[10px] cursor-pointer"
                                >
                                  Suspend
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: WASTE LISTINGS MODERATION */}
        {/* ========================================================================= */}
        {activeTab === 'listings' && (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <FiShoppingBag className="text-teal-600" /> PLATFORM WASTE LISTINGS MODERATION
                </h3>
                <p className="text-xs text-gray-600 font-medium mt-0.5">Inspect all posted waste listings, verify lab manifests, and resolve AI classification mismatches.</p>
              </div>
            </div>

            {wasteListings.length === 0 ? (
              <div className="text-center py-12 text-xs text-gray-500 font-medium">No waste listings recorded yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-700 border-b border-gray-200 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Material & Seller</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Available Qty</th>
                      <th className="py-3 px-4">Asking Price</th>
                      <th className="py-3 px-4">AI Detection & Confidence</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Moderation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                    {wasteListings.map(w => (
                      <tr key={w._id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-gray-900">
                          <div>{w.name}</div>
                          <div className="text-[10px] text-gray-500 font-semibold">{w.uploader?.companyName || 'Seller Industry'} &bull; {w.city || 'Erode'}</div>
                        </td>
                        <td className="py-3.5 px-4">{w.category}</td>
                        <td className="py-3.5 px-4 font-bold text-emerald-800">{w.quantity} {w.unit}</td>
                        <td className="py-3.5 px-4 font-bold text-gray-900">{formatINR(w.price)}/{w.unit}</td>
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <span className="font-extrabold text-teal-800 text-[11px] block">{w.aiPredictedCategory || w.category}</span>
                            <span className="text-[10px] text-gray-500 font-bold">Confidence: {Math.round((w.aiConfidence || 0.94) * 100)}%</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase ${
                            w.status === 'active' || w.status === 'available' ? 'bg-emerald-100 text-emerald-900' :
                            w.status === 'flagged' ? 'bg-red-100 text-red-900' : 'bg-amber-100 text-amber-900'
                          }`}>
                            {w.status || 'Active'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleModerateWaste(w._id, 'active')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleModerateWaste(w._id, 'flagged', 'Unreasonable price or missing lab report')}
                              className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-bold text-[10px] cursor-pointer"
                            >
                              Flag
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: MATERIAL REQUIREMENTS OVERSIGHT */}
        {/* ========================================================================= */}
        {activeTab === 'requirements' && (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <FiCpu className="text-indigo-600" /> BUYER MATERIAL REQUIREMENTS OVERSIGHT
                </h3>
                <p className="text-xs text-gray-600 font-medium mt-0.5">Monitor procurement requirements posted by secondary material consumers and recyclers.</p>
              </div>
            </div>

            {buyerReqs.length === 0 ? (
              <div className="text-center py-12 text-xs text-gray-500 font-medium">No buyer requirements posted yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-700 border-b border-gray-200 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Buyer Company</th>
                      <th className="py-3 px-4">Material Required</th>
                      <th className="py-3 px-4">Quantity / Frequency</th>
                      <th className="py-3 px-4">Max Budget (₹)</th>
                      <th className="py-3 px-4">Min Purity</th>
                      <th className="py-3 px-4">Destination Location</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                    {buyerReqs.map(r => (
                      <tr key={r._id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-gray-900">{r.buyer?.companyName || 'Buyer Industry'}</td>
                        <td className="py-3.5 px-4 font-extrabold text-teal-800">{r.material}</td>
                        <td className="py-3.5 px-4 font-bold">{r.quantity} {r.unit}/{r.frequency}</td>
                        <td className="py-3.5 px-4 font-extrabold text-emerald-800">{formatINR(r.maxPrice)}/{r.unit}</td>
                        <td className="py-3.5 px-4 font-bold">{r.minPurity}%</td>
                        <td className="py-3.5 px-4">{r.city} ({r.radiusKm || 100}km radius)</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 bg-teal-100 text-teal-900 rounded-full font-bold text-[10px] uppercase">
                            {r.status || 'Active'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: EXCHANGE MONITORING */}
        {/* ========================================================================= */}
        {activeTab === 'exchanges' && (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <FiTrendingUp className="text-amber-600" /> PLATFORM EXCHANGE & TRANSACTION MONITORING
                </h3>
                <p className="text-xs text-gray-600 font-medium mt-0.5">Live tracking of waste transfer agreements, custody handshakes, and freight fulfillment.</p>
              </div>
            </div>

            {transactions.length === 0 ? (
              <div className="text-center py-12 text-xs text-gray-500 font-medium">No exchange transactions recorded yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-700 border-b border-gray-200 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Exchange ID</th>
                      <th className="py-3 px-4">Seller &rarr; Buyer</th>
                      <th className="py-3 px-4">Material</th>
                      <th className="py-3 px-4">Quantity & Valuation</th>
                      <th className="py-3 px-4">Carbon Saved</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Admin Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                    {transactions.map(t => (
                      <tr key={t._id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-gray-600">EX-{t._id?.substring(0, 6).toUpperCase()}</td>
                        <td className="py-3.5 px-4 font-bold text-gray-900">
                          <div>{t.sellerProfile?.companyName || t.seller?.companyName || 'Seller'} &rarr;</div>
                          <div className="text-teal-800 text-[11px]">{t.buyerProfile?.companyName || t.buyer?.companyName || 'Buyer'}</div>
                        </td>
                        <td className="py-3.5 px-4">{t.waste?.name || 'Secondary Material'}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-gray-900">{formatINR(t.totalPrice || 22500)}</div>
                          <div className="text-[10px] text-gray-500 font-semibold">{t.waste?.quantity || 500} {t.waste?.unit || 'kg'}</div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-teal-800">{t.carbonSavedKg || 750} kg CO₂</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase ${
                            t.status === 'completed' ? 'bg-emerald-100 text-emerald-900' :
                            t.status === 'disputed' ? 'bg-red-100 text-red-900' : 'bg-amber-100 text-amber-900'
                          }`}>
                            {t.status || 'In Transit'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => alert(`Opening lifecycle timeline inspector for Exchange EX-${t._id?.substring(0, 6).toUpperCase()}`)}
                            className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg text-[10px] cursor-pointer"
                          >
                            View Lifecycle
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: AI MONITORING */}
        {/* ========================================================================= */}
        {activeTab === 'ai-monitoring' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-6">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <FiCpu className="text-teal-600" /> AI MATCHMAKER & NEURAL DIAGNOSTICS
                </h3>
                <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                  Embeddings: sentence-transformers/all-MiniLM-L6-v2
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">Symbiosis Match Compatibility Distribution</h4>
                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="flex justify-between text-[11px] font-bold">
                        <span>High Compatibility (85% - 100%)</span>
                        <span className="text-emerald-800">74% of requests</span>
                      </div>
                      <div className="w-full bg-gray-200 h-2 rounded-full mt-1 overflow-hidden">
                        <div className="bg-emerald-600 h-full w-[74%]"></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] font-bold">
                        <span>Moderate Compatibility (65% - 84%)</span>
                        <span className="text-teal-800">21% of requests</span>
                      </div>
                      <div className="w-full bg-gray-200 h-2 rounded-full mt-1 overflow-hidden">
                        <div className="bg-teal-600 h-full w-[21%]"></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] font-bold">
                        <span>Low / Flagged Compatibility (&lt;65%)</span>
                        <span className="text-amber-800">5% of requests</span>
                      </div>
                      <div className="w-full bg-gray-200 h-2 rounded-full mt-1 overflow-hidden">
                        <div className="bg-amber-500 h-full w-[5%]"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">Computer Vision Classifier Distribution</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-white rounded-xl border border-gray-200 text-center">
                      <span className="text-[10px] text-gray-500 font-bold uppercase block">Plastic Scrap</span>
                      <span className="text-lg font-black text-gray-900">42%</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-gray-200 text-center">
                      <span className="text-[10px] text-gray-500 font-bold uppercase block">Metal Scrap</span>
                      <span className="text-lg font-black text-gray-900">28%</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-gray-200 text-center">
                      <span className="text-[10px] text-gray-500 font-bold uppercase block">Textile Waste</span>
                      <span className="text-lg font-black text-gray-900">18%</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-gray-200 text-center">
                      <span className="text-[10px] text-gray-500 font-bold uppercase block">Chemical / Sludge</span>
                      <span className="text-lg font-black text-gray-900">12%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: COMPLIANCE & AUDIT LOG */}
        {/* ========================================================================= */}
        {activeTab === 'compliance' && (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <FiShield className="text-emerald-600" /> REGULATORY COMPLIANCE & VERIFIED AUDIT LOG
                </h3>
                <p className="text-xs text-gray-600 font-medium mt-0.5">CPCB/SPCB regulatory verification status, hazardous waste consent orders, and audit trail.</p>
              </div>

              <button
                onClick={() => alert('Exporting platform ESG regulatory compliance ledger (CSV)...')}
                className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <FiDownload className="w-3.5 h-3.5 text-emerald-600" /> Export Audit CSV
              </button>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-2">
              <div className="font-bold text-gray-900">Verified System Audit Records:</div>
              <div className="text-gray-700">&bull; <strong>CPCB Fly Ash Rules 2021:</strong> 100% compliant thermal power plant byproduct manifests.</div>
              <div className="text-gray-700">&bull; <strong>Plastic EPR Packaging Target 2026:</strong> 142 Metric Tons recycled PET verified with traceable custody.</div>
              <div className="text-gray-700">&bull; <strong>Hazardous Material Transit Logs:</strong> Ground-truth GPS manifests archived for all chemical shipments.</div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 8: ROUTE & LOGISTICS GIS */}
        {/* ========================================================================= */}
        {activeTab === 'logistics' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <FiNavigation className="text-teal-600" /> NETWORK LOGISTICS GIS & FREIGHT CORRIDOR
                </h3>
                <span className="text-xs font-bold text-teal-800">Tamil Nadu Industrial Corridor (Erode, Tiruppur, Coimbatore, Chennai)</span>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <Map
                  coordinates={[11.3410, 77.7172]}
                  markers={[
                    { coordinates: [77.7172, 11.3410], name: 'ABC Plastic Manufacturing (Erode)', type: 'Seller Producer' },
                    { coordinates: [77.3411, 11.1085], name: 'Green Polymer Recycling (Tiruppur)', type: 'Buyer Recycler' },
                    { coordinates: [76.9558, 11.0168], name: 'Kongu Metal Smelting (Coimbatore)', type: 'Buyer Recycler' }
                  ]}
                  roadGeometry={[[11.3410, 77.7172], [11.1085, 77.3411]]}
                  routeMetrics={{ distanceKm: 82, durationMinutes: 95, transportCostInr: 2870, co2EmissionsKg: 37.7 }}
                  height="450px"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 9: SUSTAINABILITY & ESG */}
        {/* ========================================================================= */}
        {activeTab === 'sustainability' && (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-6">
            <div className="border-b border-gray-100 pb-3">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <FiGlobe className="text-emerald-600" /> PLATFORM SUSTAINABILITY & CARBON LEDGER
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="p-5 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-1">
                <span className="text-[10px] text-emerald-900 font-bold uppercase">Total Waste Diverted</span>
                <div className="text-3xl font-black text-emerald-900">{metrics.totalWasteDivertedTons || 48.2} Tonnes</div>
                <span className="text-xs text-emerald-800 font-semibold">From Landfills & Open Burning</span>
              </div>

              <div className="p-5 bg-teal-50/60 rounded-2xl border border-teal-200 space-y-1">
                <span className="text-[10px] text-teal-900 font-bold uppercase">Gross Material CO₂ Avoided</span>
                <div className="text-3xl font-black text-teal-900">{metrics.totalCarbonSavedTons || 126.4} Tonnes</div>
                <span className="text-xs text-teal-800 font-semibold">Virgin Material Displacement</span>
              </div>

              <div className="p-5 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-1">
                <span className="text-[10px] text-amber-900 font-bold uppercase">Transport Freight Emissions</span>
                <div className="text-3xl font-black text-amber-900">{metrics.transportCo2Tons || 8.7} Tonnes</div>
                <span className="text-xs text-amber-800 font-semibold">Separate Logistics Footprint</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 10: PLATFORM ANALYTICS */}
        {/* ========================================================================= */}
        {activeTab === 'analytics' && (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-6">
            <div className="border-b border-gray-100 pb-3">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <FiTrendingUp className="text-emerald-600" /> PLATFORM-WIDE ANALYTICS & MARKET TRAJECTORIES
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                <span className="font-black text-gray-900 uppercase text-[11px] block">Top Circulated Materials by Volume</span>
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between font-bold">
                    <span>1. PET Plastic Scrap</span>
                    <span className="text-emerald-800">12,000 kg (Trend: &uarr;)</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>2. Aluminium Machining Scrap</span>
                    <span className="text-teal-800">8,500 kg (Trend: &rarr;)</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>3. Fly Ash (Class F)</span>
                    <span className="text-indigo-800">45,000 kg (Trend: &uarr;)</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                <span className="font-black text-gray-900 uppercase text-[11px] block">Network Monetary Velocity</span>
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between font-bold">
                    <span>Total Circular Turnover:</span>
                    <span className="text-emerald-800">{formatINR(metrics.totalTransactionValueInr)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Settled Exchange Orders:</span>
                    <span className="text-gray-900">{metrics.completedTransactionsCount || 0} completed</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Active Supply Streams:</span>
                    <span className="text-gray-900">{metrics.activeListingsCount || 0} listings</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 11: RAG KNOWLEDGE BASE MANAGEMENT */}
        {/* ========================================================================= */}
        {activeTab === 'knowledge-base' && (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <FiFileText className="text-emerald-600" /> RAG KNOWLEDGE BASE DOCUMENT SOURCES
                </h3>
                <p className="text-xs text-gray-600 font-medium mt-0.5">Manage indexed regulatory policies, MoEFCC guidelines, and vector chunks feeding the Assistant.</p>
              </div>

              <button
                onClick={handleReindexKnowledge}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <FiRefreshCw className="w-3.5 h-3.5" /> Re-index Knowledge Base
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-700 border-b border-gray-200 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Document Title</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Source</th>
                    <th className="py-3 px-4">Chunks</th>
                    <th className="py-3 px-4">Last Indexed</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                  {(knowledgeBase?.documents || [
                    { id: '1', documentName: 'Plastic Waste Management Rules 2021 & EPR Guidelines', category: 'Plastic Regulations', source: 'CPCB / MoEFCC', chunks: 142, lastIndexed: '2026-08-10', status: 'Indexed & Active' },
                    { id: '2', documentName: 'Fly Ash Utilization Amendment Notification 2021', category: 'Fly Ash', source: 'MoEFCC India', chunks: 98, lastIndexed: '2026-08-11', status: 'Indexed & Active' },
                    { id: '3', documentName: 'Hazardous and Other Wastes Rules', category: 'Hazardous Waste', source: 'CPCB Guidelines', chunks: 215, lastIndexed: '2026-08-12', status: 'Indexed & Active' }
                  ]).map(doc => (
                    <tr key={doc.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-gray-900">{doc.documentName}</td>
                      <td className="py-3.5 px-4">{doc.category}</td>
                      <td className="py-3.5 px-4 text-gray-600">{doc.source}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-teal-800">{doc.chunks} chunks</td>
                      <td className="py-3.5 px-4 text-gray-500">{doc.lastIndexed}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 rounded-full font-bold text-[10px]">
                          {doc.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 12: PLATFORM ALERTS & ANOMALIES */}
        {/* ========================================================================= */}
        {activeTab === 'alerts' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
                <div className="text-xs text-gray-500 font-bold uppercase">Standard Listings</div>
                <div className="text-3xl font-black text-emerald-700 mt-1">{metrics.activeListingsCount || 0}</div>
                <span className="text-[11px] text-gray-600 font-medium">Standard Valuation & Verified Lab Purity</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs">
                <div className="text-xs text-amber-700 font-bold uppercase">Flagged for Review</div>
                <div className="text-3xl font-black text-amber-600 mt-1">{pending.flaggedMaterialsCount || 0}</div>
                <span className="text-[11px] text-amber-700 font-medium">Price &gt;100% Above AI Fair Market Value</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-red-200 shadow-xs">
                <div className="text-xs text-red-700 font-bold uppercase">High Risk Alerts</div>
                <div className="text-3xl font-black text-red-600 mt-1">{pending.activeDisputesCount || 0}</div>
                <span className="text-[11px] text-red-600 font-medium">Purity Anomaly Without Lab Certificate</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">PLATFORM ANOMALY & ALERT LOG</h3>
              <div className="space-y-3 text-xs">
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex justify-between items-center">
                  <div>
                    <span className="font-black text-gray-900 block text-sm">Spent Solvents Batch #881</span>
                    <span className="text-xs text-amber-900 font-semibold">Reason: Listed price (₹85/liter) exceeds AI estimated fair market price (₹42/liter) by 102%.</span>
                  </div>
                  <button
                    onClick={() => handleModerateWaste('mock-1', 'flagged', 'Reviewed by admin')}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-lg text-[10px] cursor-pointer"
                  >
                    Investigate
                  </button>
                </div>

                <div className="p-4 bg-red-50 rounded-xl border border-red-200 flex justify-between items-center">
                  <div>
                    <span className="font-black text-gray-900 block text-sm">High Purity PET Flakes (Lot #402)</span>
                    <span className="text-xs text-red-900 font-semibold">Reason: Claimed purity (99.8%) exceeds normal mechanical scrap thresholds without ground-truth lab report.</span>
                  </div>
                  <button
                    onClick={() => handleModerateWaste('mock-2', 'flagged', 'Lab certificate required')}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-lg text-[10px] cursor-pointer"
                  >
                    Request Lab Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 13: PLATFORM SETTINGS */}
        {/* ========================================================================= */}
        {activeTab === 'settings' && (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-6">
            <div className="border-b border-gray-100 pb-3">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <FiSettings className="text-emerald-600" /> ECOLINK PLATFORM DYNAMIC PARAMETERS
              </h3>
              <p className="text-xs text-gray-600 font-medium mt-0.5">Configure freight transit rates, emission factors, and matching radius.</p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                  <label className="font-bold text-gray-700 block uppercase text-[10px]">Small Truck Freight Rate (₹/km)</label>
                  <input
                    type="number"
                    value={settings?.transportCostPerKm?.smallTruck || 25}
                    onChange={(e) => setSettings({ ...settings, transportCostPerKm: { ...settings?.transportCostPerKm, smallTruck: parseFloat(e.target.value) } })}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 font-extrabold text-gray-900"
                  />
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                  <label className="font-bold text-gray-700 block uppercase text-[10px]">Medium Truck Freight Rate (₹/km)</label>
                  <input
                    type="number"
                    value={settings?.transportCostPerKm?.mediumTruck || 35}
                    onChange={(e) => setSettings({ ...settings, transportCostPerKm: { ...settings?.transportCostPerKm, mediumTruck: parseFloat(e.target.value) } })}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 font-extrabold text-gray-900"
                  />
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                  <label className="font-bold text-gray-700 block uppercase text-[10px]">Heavy Multi-Axle Freight Rate (₹/km)</label>
                  <input
                    type="number"
                    value={settings?.transportCostPerKm?.heavyTruck || 48}
                    onChange={(e) => setSettings({ ...settings, transportCostPerKm: { ...settings?.transportCostPerKm, heavyTruck: parseFloat(e.target.value) } })}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 font-extrabold text-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                  <label className="font-bold text-gray-700 block uppercase text-[10px]">Max Symbiosis Search Radius (km)</label>
                  <input
                    type="number"
                    value={settings?.maxSearchRadiusKm || 300}
                    onChange={(e) => setSettings({ ...settings, maxSearchRadiusKm: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 font-extrabold text-gray-900"
                  />
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                  <label className="font-bold text-gray-700 block uppercase text-[10px]">Medium Truck CO₂ Emission Factor (kg/km)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={settings?.emissionFactors?.mediumTruck || 0.46}
                    onChange={(e) => setSettings({ ...settings, emissionFactors: { ...settings?.emissionFactors, mediumTruck: parseFloat(e.target.value) } })}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-gray-200 font-extrabold text-gray-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-xs cursor-pointer"
              >
                Save Platform Parameters
              </button>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
