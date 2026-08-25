import React, { useState, useEffect } from 'react';
import API from '../../services/authAPI';
import AdminLayout from '../../layouts/AdminLayout';
import Loader from '../../components/Loader';
import { formatINR } from '../../utils/formatINR';
import { 
  ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar, 
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, Legend 
} from 'recharts';
import { 
  FiTrendingUp, FiLayers, FiDollarSign, FiUsers, 
  FiCheckCircle, FiActivity, FiBarChart2, FiPieChart, FiInfo, FiClock
} from 'react-icons/fi';

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [dateRange, setDateRange] = useState('All Time');

  const fetchAnalytics = async (range) => {
    try {
      setLoading(true);
      const res = await API.get(`/analytics/summary?range=${encodeURIComponent(range)}`);
      if (res.data && res.data.success) {
        setAnalyticsData(res.data);
      }
    } catch (err) {
      console.warn('Failed to load analytics:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(dateRange);
  }, [dateRange]);

  const summary = analyticsData?.summary || {
    totalMaterialListedKg: 0,
    totalExchanges: 0,
    totalTradeValue: 0,
    activeBuyers: 0,
    activeSellers: 0,
    fulfillmentRate: 0
  };

  const supplyVsDemand = analyticsData?.supplyVsDemand || [];
  const materialDistribution = analyticsData?.materialDistribution || [];
  const monthlyActivity = analyticsData?.monthlyActivity || [];
  const exchangeStatus = analyticsData?.exchangeStatus || [];
  const hasSufficientData = analyticsData?.hasSufficientHistoricalData;

  return (
    <AdminLayout>
      <div className="space-y-6 font-sans">
        
        {/* 1. Header with Functional Date Range Selector (No refresh button) */}
        <div className="bg-white p-6 rounded-3xl border border-[#DDE7E2] shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#12233F] tracking-tight">
              Platform Analytics
            </h1>
            <p className="text-xs text-[#5F6B7A] font-medium mt-1">
              Platform-level circular exchange metrics, material supply vs demand balance, and trade performance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#5F6B7A]">Date Range:</span>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3.5 py-2 bg-[#F6F8F7] hover:bg-[#EAF8F2] border border-[#DDE7E2] rounded-2xl text-xs font-bold text-[#12233F] cursor-pointer transition-all focus:outline-none focus:border-[#009B6B]"
            >
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="Last 3 Months">Last 3 Months</option>
              <option value="Last 6 Months">Last 6 Months</option>
              <option value="All Time">All Time</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center"><Loader /></div>
        ) : !hasSufficientData ? (
          <div className="py-20 bg-white rounded-3xl border border-[#DDE7E2] text-center p-8 space-y-3">
            <FiClock className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="text-base font-black text-[#12233F]">Not enough historical data yet.</h3>
            <p className="text-xs text-[#5F6B7A] max-w-sm mx-auto">
              There is currently insufficient exchange or listing activity in the selected date range ({dateRange}).
            </p>
          </div>
        ) : (
          <>
            {/* 2. Platform Core KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              
              {/* Total Material Listed */}
              <div className="bg-white p-5 rounded-3xl border border-[#DDE7E2] shadow-2xs space-y-2">
                <div className="flex justify-between items-center text-[#5F6B7A]">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">Total Material Listed</span>
                  <div className="w-8 h-8 rounded-xl bg-[#EAF8F2] text-[#009B6B] flex items-center justify-center font-bold">
                    <FiLayers className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl font-black text-[#12233F]">
                  {(summary.totalMaterialListedKg || 0).toLocaleString()} <span className="text-xs text-[#5F6B7A] font-semibold">kg</span>
                </div>
                <span className="text-[10px] text-[#009B6B] font-bold">Live Inventory</span>
              </div>

              {/* Total Exchanges */}
              <div className="bg-white p-5 rounded-3xl border border-[#DDE7E2] shadow-2xs space-y-2">
                <div className="flex justify-between items-center text-[#5F6B7A]">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">Total Exchanges</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <FiActivity className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl font-black text-[#12233F]">
                  {summary.totalExchanges || 0}
                </div>
                <span className="text-[10px] text-blue-600 font-bold">Recorded Trades</span>
              </div>

              {/* Total Trade Value */}
              <div className="bg-white p-5 rounded-3xl border border-[#DDE7E2] shadow-2xs space-y-2">
                <div className="flex justify-between items-center text-[#5F6B7A]">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">Total Trade Value</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <FiDollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl font-black text-[#12233F]">
                  {formatINR(summary.totalTradeValue || 0)}
                </div>
                <span className="text-[10px] text-[#009B6B] font-bold">Market Turnover</span>
              </div>

              {/* Active Buyers */}
              <div className="bg-white p-5 rounded-3xl border border-[#DDE7E2] shadow-2xs space-y-2">
                <div className="flex justify-between items-center text-[#5F6B7A]">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">Active Buyers</span>
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <FiUsers className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl font-black text-[#12233F]">
                  {summary.activeBuyers || 0}
                </div>
                <span className="text-[10px] text-purple-600 font-bold">Recyclers & Plants</span>
              </div>

              {/* Active Sellers */}
              <div className="bg-white p-5 rounded-3xl border border-[#DDE7E2] shadow-2xs space-y-2">
                <div className="flex justify-between items-center text-[#5F6B7A]">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">Active Sellers</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <FiUsers className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl font-black text-[#12233F]">
                  {summary.activeSellers || 0}
                </div>
                <span className="text-[10px] text-amber-600 font-bold">Waste Generators</span>
              </div>

              {/* Fulfillment Rate */}
              <div className="bg-white p-5 rounded-3xl border border-[#DDE7E2] shadow-2xs space-y-2">
                <div className="flex justify-between items-center text-[#5F6B7A]">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">Fulfillment Rate</span>
                  <div className="w-8 h-8 rounded-xl bg-[#EAF8F2] text-[#009B6B] flex items-center justify-center font-bold">
                    <FiCheckCircle className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl font-black text-[#12233F]">
                  {summary.fulfillmentRate || 0}%
                </div>
                <span className="text-[10px] text-[#009B6B] font-bold">Order Completion</span>
              </div>

            </div>

            {/* 3. Visualizations Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Visualization 1: Supply vs Demand by Material */}
              <div className="bg-white p-6 rounded-3xl border border-[#DDE7E2] shadow-2xs space-y-4">
                <div className="flex justify-between items-center border-b border-[#DDE7E2] pb-3">
                  <div>
                    <h3 className="text-base font-black text-[#12233F]">1. Supply vs Demand by Material</h3>
                    <p className="text-xs text-[#5F6B7A] font-medium">Aggregated listed supply vs buyer procurement demand</p>
                  </div>
                  <FiBarChart2 className="w-5 h-5 text-[#009B6B]" />
                </div>

                {supplyVsDemand.length > 0 ? (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={supplyVsDemand} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F3" vertical={false} />
                        <XAxis dataKey="material" tick={{ fontSize: 11, fill: '#5F6B7A' }} />
                        <YAxis tick={{ fontSize: 10, fill: '#5F6B7A' }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #DDE7E2', fontSize: '11px' }}
                          formatter={(val) => [`${val.toLocaleString()} kg`]}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        <Bar dataKey="supplyKg" name="Available Supply (kg)" fill="#009B6B" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="demandKg" name="Buyer Demand (kg)" fill="#0284c7" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-xs text-[#5F6B7A]">
                    Not enough commodity stream data.
                  </div>
                )}
              </div>

              {/* Visualization 2: Material Category Distribution */}
              <div className="bg-white p-6 rounded-3xl border border-[#DDE7E2] shadow-2xs space-y-4">
                <div className="flex justify-between items-center border-b border-[#DDE7E2] pb-3">
                  <div>
                    <h3 className="text-base font-black text-[#12233F]">2. Material Distribution</h3>
                    <p className="text-xs text-[#5F6B7A] font-medium">Breakdown of listed secondary inventory by stream</p>
                  </div>
                  <FiPieChart className="w-5 h-5 text-[#009B6B]" />
                </div>

                {materialDistribution.length > 0 ? (
                  <div className="h-64 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={materialDistribution}
                          dataKey="quantity"
                          nameKey="category"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          innerRadius={45}
                          paddingAngle={3}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {materialDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #DDE7E2', fontSize: '11px' }}
                          formatter={(val) => [`${val.toLocaleString()} kg`]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-xs text-[#5F6B7A]">
                    Not enough inventory distribution data.
                  </div>
                )}
              </div>

              {/* Visualization 3: Exchange Activity Over Time */}
              <div className="bg-white p-6 rounded-3xl border border-[#DDE7E2] shadow-2xs space-y-4">
                <div className="flex justify-between items-center border-b border-[#DDE7E2] pb-3">
                  <div>
                    <h3 className="text-base font-black text-[#12233F]">3. Exchange Activity Over Time</h3>
                    <p className="text-xs text-[#5F6B7A] font-medium">Monthly transaction volume and trade flow progression</p>
                  </div>
                  <FiTrendingUp className="w-5 h-5 text-[#009B6B]" />
                </div>

                {monthlyActivity.length > 0 ? (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#009B6B" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#009B6B" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F3" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#5F6B7A' }} />
                        <YAxis tick={{ fontSize: 10, fill: '#5F6B7A' }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #DDE7E2', fontSize: '11px' }}
                          formatter={(val) => [`${val.toLocaleString()} kg`]}
                        />
                        <Area type="monotone" dataKey="volumeKg" name="Exchanged Volume (kg)" stroke="#009B6B" strokeWidth={2.5} fillOpacity={1} fill="url(#colorVol)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-xs text-[#5F6B7A] text-center p-4">
                    <span>Not enough historical exchange logs in selected range.<br/><strong className="text-gray-600">Actual activity will graph here as trades occur.</strong></span>
                  </div>
                )}
              </div>

              {/* Visualization 4: Exchange Status Distribution */}
              <div className="bg-white p-6 rounded-3xl border border-[#DDE7E2] shadow-2xs space-y-4">
                <div className="flex justify-between items-center border-b border-[#DDE7E2] pb-3">
                  <div>
                    <h3 className="text-base font-black text-[#12233F]">4. Exchange Status Distribution</h3>
                    <p className="text-xs text-[#5F6B7A] font-medium">Operational status lifecycle breakdown across trades</p>
                  </div>
                  <FiCheckCircle className="w-5 h-5 text-[#009B6B]" />
                </div>

                {exchangeStatus.length > 0 ? (
                  <div className="space-y-3 pt-2">
                    {exchangeStatus.map((st) => (
                      <div key={st.name} className="space-y-1 text-xs">
                        <div className="flex justify-between font-bold">
                          <span className="text-[#12233F]">{st.name}</span>
                          <span className="text-[#5F6B7A] font-mono">{st.count} trades ({st.percentage}%)</span>
                        </div>
                        <div className="w-full h-2.5 bg-[#F6F8F7] rounded-full overflow-hidden border border-[#DDE7E2]/60">
                          <div 
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${st.percentage}%`, backgroundColor: st.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-xs text-[#5F6B7A]">
                    No recorded exchange transaction states yet.
                  </div>
                )}
              </div>

            </div>
          </>
        )}

      </div>
    </AdminLayout>
  );
}
