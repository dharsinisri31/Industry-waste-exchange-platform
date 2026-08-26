import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { apiGet } from '../services/api';
import Loader from '../components/Loader';
import { formatINR } from '../utils/formatINR';
import { 
  FiActivity, FiPlus, FiShoppingBag, FiTruck, 
  FiCheckCircle, FiClock, FiLayers, FiDollarSign, 
  FiArrowRight, FiSearch, FiFilter, FiUser, FiZap,
  FiFileText, FiShield, FiAlertTriangle
} from 'react-icons/fi';

export default function ExchangesPage() {
  const { user, profile, isBuyerMode, isBuyerOnly, isSellerOnly } = useAuth();
  const navigate = useNavigate();

  const [exchanges, setExchanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const isBuyer = isBuyerOnly || isBuyerMode;

  const fetchExchanges = async () => {
    try {
      setLoading(true);
      const res = await apiGet('/api/traceability/exchanges');
      const list = Array.isArray(res) ? res : (res?.exchanges || []);
      setExchanges(list);
    } catch (err) {
      console.warn('Failed to load exchanges:', err.message);
      setExchanges([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExchanges();
  }, []);

  const filteredExchanges = exchanges.filter(ex => {
    const s = (ex.orderStatus || ex.status || '').toLowerCase();
    if (statusFilter === 'Active' && (s.includes('complete') || s.includes('cancel'))) return false;
    if (statusFilter === 'In Transit' && !s.includes('transit')) return false;
    if (statusFilter === 'Completed' && !s.includes('complete')) return false;
    if (statusFilter === 'Pending' && !s.includes('placed') && !s.includes('pending') && !s.includes('request')) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const exId = (ex.exchangeId || ex.orderId || ex._id || '').toLowerCase();
      const mat = (ex.waste?.name || '').toLowerCase();
      const partner = (ex.partnerName || '').toLowerCase();
      return exId.includes(q) || mat.includes(q) || partner.includes(q);
    }

    return true;
  });

  const getStatusBadge = (orderStatus, status) => {
    const st = orderStatus || status || 'Order Placed';
    const s = st.toLowerCase();

    if (s.includes('complet')) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 inline-flex items-center gap-1.5 uppercase">
          <FiCheckCircle className="w-3.5 h-3.5 text-emerald-700" /> Completed
        </span>
      );
    }
    if (s.includes('transit') || s.includes('schedul')) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-900 border border-indigo-300 inline-flex items-center gap-1.5 uppercase">
          <FiTruck className="w-3.5 h-3.5 text-indigo-700" /> {st}
        </span>
      );
    }
    if (s.includes('accept') || s.includes('pay') || s.includes('prepar')) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-black bg-teal-100 text-teal-900 border border-teal-300 inline-flex items-center gap-1.5 uppercase">
          <FiCheck className="w-3.5 h-3.5 text-teal-700" /> {st}
        </span>
      );
    }
    if (s.includes('cancel')) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-black bg-red-100 text-red-900 border border-red-300 inline-flex items-center gap-1.5 uppercase">
          <FiAlertTriangle className="w-3.5 h-3.5 text-red-700" /> Cancelled
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1.5 uppercase">
        <FiClock className="w-3.5 h-3.5 text-amber-700" /> {st}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto font-sans">
        
        {/* Header Bar */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <FiActivity className="text-emerald-600" /> Industrial Exchanges & Custody
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 font-medium">
              Track lifecycle stages, freight dispatch, digital weighments, escrow settlement, and statutory documents for your company exchanges.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {isBuyer ? (
              <Link
                to="/post-requirement"
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <FiPlus className="w-4 h-4" />
                <span>Post Requirement</span>
              </Link>
            ) : (
              <Link
                to="/upload-waste"
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <FiPlus className="w-4 h-4" />
                <span>List New Waste</span>
              </Link>
            )}
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader />
          </div>
        ) : exchanges.length === 0 ? (
          /* ========================================================================= */
          /* EMPTY STATE: User has 0 exchanges                                         */
          /* ========================================================================= */
          <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-12 sm:p-16 text-center space-y-5 shadow-xs">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-100 shadow-2xs">
              <FiActivity className="w-8 h-8" />
            </div>

            <div className="max-w-md mx-auto space-y-2">
              <h2 className="text-xl font-black text-gray-900 tracking-tight">
                No exchanges yet
              </h2>
              <p className="text-xs text-gray-500 font-medium leading-relaxed">
                Your completed or active exchanges will appear here. Initiate trade matches to start digital chain of custody tracking, freight dispatch, and automated ESG carbon avoidance reports.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {isBuyer ? (
                <>
                  <Link
                    to="/post-requirement"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-xs transition-all inline-flex items-center gap-2 cursor-pointer"
                  >
                    <FiPlus className="w-4 h-4" />
                    <span>Post Material Requirement</span>
                  </Link>
                  <Link
                    to="/marketplace"
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-xs transition-all border border-gray-200"
                  >
                    Find Materials
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/upload-waste"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-xs transition-all inline-flex items-center gap-2 cursor-pointer"
                  >
                    <FiPlus className="w-4 h-4" />
                    <span>List New Waste</span>
                  </Link>
                  <Link
                    to="/recommendations"
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-xs transition-all border border-gray-200"
                  >
                    Find Buyers
                  </Link>
                </>
              )}
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* POPULATED STATE: User has real authenticated exchanges                    */
          /* ========================================================================= */
          <div className="space-y-6">
            
            {/* Filters and Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-gray-600">Filter:</span>
                {['All', 'Active', 'In Transit', 'Completed', 'Pending'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setStatusFilter(tab)}
                    className={`px-3 py-1.5 rounded-xl font-extrabold transition-all cursor-pointer ${
                      statusFilter === tab
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                  <FiSearch className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by ID, Material, or Partner..."
                  className="pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 w-full sm:w-64 focus:outline-none focus:border-emerald-600 font-medium"
                />
              </div>
            </div>

            {/* Exchange Cards Grid */}
            {filteredExchanges.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center space-y-2">
                <FiActivity className="w-8 h-8 text-gray-400 mx-auto" />
                <strong className="text-xs text-gray-800 block">No exchanges found matching your search</strong>
                <p className="text-[11px] text-gray-500">Try adjusting your filters or search terms.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredExchanges.map((ex) => {
                  const isUserBuyer = ex.roleInExchange === 'Buyer' || (ex.buyer?._id && ex.buyer._id === user?._id);
                  const partnerLabel = isUserBuyer ? 'Seller' : 'Buyer';
                  const partnerCompanyName = ex.partnerName || (isUserBuyer ? ex.seller?.companyName || ex.seller?.name : ex.buyer?.companyName || ex.buyer?.name) || 'Partner Facility';
                  const exchangeIdDisplay = ex.exchangeId || ex.orderId || ex._id?.toString().slice(-6);

                  return (
                    <div 
                      key={ex._id || ex.exchangeId}
                      className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className="font-mono font-black text-sm text-emerald-900 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200 block w-fit">
                              #{exchangeIdDisplay}
                            </span>
                            <span className="text-[11px] text-gray-400 font-medium mt-1 block">
                              Created {new Date(ex.createdAt || Date.now()).toLocaleDateString('en-IN')}
                            </span>
                          </div>

                          <div>
                            {getStatusBadge(ex.orderStatus, ex.status)}
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-extrabold text-gray-900 tracking-tight">
                            {ex.waste?.name || 'Secondary Material Stream'}
                          </h3>
                          <div className="text-xs text-gray-600 font-semibold mt-0.5">
                            {ex.quantity} {ex.unit || 'kg'} &bull; Total: <strong className="text-emerald-800">{formatINR(ex.totalPrice)}</strong>
                          </div>
                        </div>

                        {/* Partner Information */}
                        <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 text-xs space-y-1">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-gray-500 font-bold uppercase">{partnerLabel} Partner:</span>
                            <span className="text-emerald-800 font-black uppercase text-[10px] bg-emerald-50 px-2 py-0.5 rounded">
                              Your Role: {ex.roleInExchange || (isUserBuyer ? 'Buyer' : 'Seller')}
                            </span>
                          </div>
                          <div className="font-extrabold text-gray-900 flex items-center gap-1.5">
                            <FiUser className="text-gray-400 w-3.5 h-3.5 shrink-0" />
                            <span>{partnerCompanyName}</span>
                          </div>
                          {ex.distanceKm && (
                            <div className="text-[11px] text-gray-500 font-medium">
                              Transit Distance: {ex.distanceKm} km
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
                        <span className="text-[11px] font-bold text-gray-500">
                          Payment: <strong className="text-emerald-800">{ex.paymentStatus || 'Pending'}</strong>
                        </span>

                        <Link
                          to={`/exchange/${ex.exchangeId || ex._id}`}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>View Exchange Details</span>
                          <FiArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
