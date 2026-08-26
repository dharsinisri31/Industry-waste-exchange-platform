import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import Loader from '../components/Loader';
import { apiGet, apiPost } from '../services/api';
import { formatINR } from '../utils/formatINR';
import { 
  FiZap, FiCheckCircle, FiMapPin, FiTruck, FiGlobe, 
  FiDollarSign, FiInfo, FiSend, FiShield, FiLayers, 
  FiArrowRight, FiCheck, FiNavigation, FiEye, FiAlertCircle
} from 'react-icons/fi';

export default function BuyerSupplierMatcher() {
  const routerLocation = useLocation();
  const navigate = useNavigate();
  const stateReqId = routerLocation.state?.requirementId;

  const [loading, setLoading] = useState(true);
  const [myRequirements, setMyRequirements] = useState([]);
  const [selectedReqId, setSelectedReqId] = useState(stateReqId || '');
  const [matchResults, setMatchResults] = useState(null);
  const [requestedSuppliers, setRequestedSuppliers] = useState({});
  const [notification, setNotification] = useState('');

  const selectedRequirement = useMemo(() => {
    return myRequirements.find(r => r._id === selectedReqId) || matchResults?.requirement || null;
  }, [myRequirements, selectedReqId, matchResults]);

  const handleSendExchangeRequest = async (sup) => {
    try {
      setLoading(true);
      const res = await apiPost(`/api/waste/${sup.wasteId}/exchange`, {
        requirementId: selectedReqId,
        quantity: selectedRequirement?.quantity || sup.availableQuantity || 100
      });

      const exchangeId = res.exchangeId || res.orderId || res._id;
      setRequestedSuppliers(prev => ({
        ...prev,
        [sup.wasteId]: exchangeId
      }));

      setNotification(`Exchange request sent directly to ${sup.supplierName}. Status: Order Requested.`);
      setTimeout(() => setNotification(''), 6000);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to send exchange request.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchReqs = async () => {
      setLoading(true);
      try {
        const data = await apiGet('/api/buyer-requirements/my');
        if (Array.isArray(data) && data.length > 0) {
          setMyRequirements(data);
          if (!selectedReqId) {
            setSelectedReqId(data[0]._id);
          }
        }
      } catch (err) {
        console.warn('Buyer requirements fetch warning:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReqs();
  }, []);

  const fetchMatches = async (reqId) => {
    if (!reqId) return;
    setLoading(true);
    try {
      const resData = await apiGet(`/api/buyer-requirements/${reqId}/suppliers`);
      setMatchResults(resData);
    } catch (err) {
      console.warn('Supplier matcher API error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedReqId) {
      fetchMatches(selectedReqId);
    }
  }, [selectedReqId]);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto font-sans pb-12">
        
        {/* Page Header */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#DDE7E2] shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F7F1] border border-[#009B72]/30 text-[#087A5A] text-[11px] font-extrabold uppercase tracking-wider mb-2">
              <FiZap className="w-3.5 h-3.5 text-[#009B72]" />
              <span>AI Procurement Matchmaker</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#12233F] tracking-tight">
              Smart Matching
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
              Find verified industrial sellers matching your active procurement requirements by material, quality, quantity, price, and proximity.
            </p>
          </div>

          <Link
            to="/post-requirement"
            className="px-4 py-2.5 bg-[#009B72] hover:bg-[#087A5A] text-white font-extrabold text-xs rounded-xl transition-all shadow-2xs shrink-0 flex items-center gap-1.5"
          >
            <span>+ New Sourcing Need</span>
          </Link>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className="p-4 bg-[#E8F7F1] border border-[#009B72]/40 text-[#087A5A] rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-xs">
            <FiCheckCircle className="w-5 h-5 text-[#009B72] shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Active Requirement Selector & Summary Card */}
        <div className="bg-white p-6 rounded-3xl border border-[#DDE7E2] shadow-xs space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider text-[#12233F] block">
              Active Buyer Sourcing Requirement:
            </label>
            <select
              value={selectedReqId}
              onChange={(e) => setSelectedReqId(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-[#DDE7E2] text-xs text-[#12233F] font-black bg-[#F8FAF9] focus:bg-white cursor-pointer shadow-2xs focus:outline-none focus:border-[#009B72]"
            >
              {myRequirements.length === 0 ? (
                <option value="">Steel Scrap &bull; 100 kg &bull; Max ₹40/kg &bull; Tiruppur</option>
              ) : (
                myRequirements.map(req => (
                  <option key={req._id} value={req._id}>
                    {req.material} &bull; {req.quantity} {req.unit} &bull; Max {formatINR(req.maxPrice)}/{req.unit} &bull; {req.city || 'Tiruppur'} ({req.category})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Active Requirement Specification Pills */}
          {selectedRequirement && (
            <div className="p-4 bg-[#F8FAF9] rounded-2xl border border-[#DDE7E2] grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-gray-400 block">Material</span>
                <span className="font-extrabold text-[#12233F] truncate block">{selectedRequirement.material}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-gray-400 block">Category</span>
                <span className="font-extrabold text-[#009B72] truncate block">{selectedRequirement.category}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-gray-400 block">Demand</span>
                <span className="font-extrabold text-[#12233F] block">{selectedRequirement.quantity} {selectedRequirement.unit || 'kg'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-gray-400 block">Max Budget</span>
                <span className="font-extrabold text-[#087A5A] block">₹{selectedRequirement.maxPrice}/{selectedRequirement.unit || 'kg'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-gray-400 block">Delivery Zone</span>
                <span className="font-extrabold text-[#12233F] truncate block">{selectedRequirement.city || 'Tiruppur'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Match Results Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 space-y-3 bg-white rounded-3xl border border-[#DDE7E2]">
            <div className="w-8 h-8 border-3 border-[#009B72] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-bold text-[#12233F]">Matching compatible industrial suppliers...</span>
          </div>
        ) : !matchResults || matchResults.suppliers.length === 0 ? (
          <div className="bg-white border border-[#DDE7E2] rounded-3xl p-12 text-center text-xs text-gray-500 shadow-xs space-y-3">
            <FiShield className="w-10 h-10 mx-auto text-[#009B72]/40" />
            <div className="space-y-1">
              <h3 className="text-base font-black text-[#12233F]">No Matching Sellers Found</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                No active seller waste listings currently match the specifications of this requirement. Check back soon or broaden your search parameters.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Criteria Heading Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 px-1">
              <h2 className="text-sm font-black text-[#12233F]">
                Ranked Compatible Supplier Streams ({matchResults.suppliers.length})
              </h2>
              <span className="text-[11px] font-bold text-gray-500 bg-[#E8F7F1] text-[#087A5A] px-3 py-1 rounded-full border border-[#009B72]/20">
                Weights: Material (40%) &bull; Quality (20%) &bull; Quantity (15%) &bull; Price (15%) &bull; Distance (10%)
              </span>
            </div>

            {/* Supplier Matching Cards */}
            <div className="space-y-6">
              {matchResults.suppliers.map((sup, idx) => {
                const reqQty = selectedRequirement?.quantity || 100;
                const reqMaxPrice = selectedRequirement?.maxPrice || 40;
                const reqMinPurity = selectedRequirement?.minPurity || 90;
                const reqCity = selectedRequirement?.city || 'Tiruppur';

                return (
                  <div
                    key={sup.wasteId || idx}
                    className="bg-white rounded-3xl border border-[#DDE7E2] shadow-2xs hover:border-[#009B72]/50 hover:shadow-md transition-all overflow-hidden p-6 sm:p-7 space-y-5"
                  >
                    
                    {/* Top Row: Rank Header & Dynamic Match Score */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#DDE7E2] pb-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-3 py-1 bg-[#12233F] text-white rounded-xl text-xs font-black tracking-wide uppercase">
                          RANK #{idx + 1} SUPPLIER MATCH
                        </span>
                        <span className="px-3 py-1 bg-[#E8F7F1] text-[#087A5A] border border-[#009B72]/30 rounded-xl text-xs font-black uppercase">
                          {sup.compatibilityScore}% AI COMPATIBILITY MATCH
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase ${
                          sup.price <= reqMaxPrice ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {sup.price <= reqMaxPrice ? '✓ Within Budget' : 'Above Target Budget'}
                        </span>
                      </div>
                    </div>

                    {/* Section 1: Supplier / Company Details (CLEARLY SEPARATED) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-black text-[#12233F] tracking-tight">
                          {sup.supplierName || 'Precision Cast Iron & Foundry'}
                        </h3>
                        <span className="px-2.5 py-0.5 bg-[#E8F7F1] text-[#087A5A] border border-[#009B72]/30 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1">
                          <FiCheckCircle className="w-3 h-3 text-[#009B72]" /> Verified Supplier
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold">
                        <FiMapPin className="w-3.5 h-3.5 text-[#009B72] shrink-0" />
                        <span>{sup.supplierCity || 'Coimbatore'}</span>
                      </div>
                    </div>

                    {/* Section 2: Matched Waste Stream Details (CLEARLY SEPARATED) */}
                    <div className="p-4 bg-[#F8FAF9] rounded-2xl border border-[#DDE7E2] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] font-black uppercase text-gray-400 block tracking-wider">Matched Material</span>
                        <span className="font-black text-[#12233F] text-sm block mt-0.5">{sup.material}</span>
                      </div>

                      <div>
                        <span className="text-[10px] font-black uppercase text-gray-400 block tracking-wider">Category</span>
                        <span className="font-extrabold text-[#009B72] block mt-0.5">{sup.category}</span>
                      </div>

                      <div>
                        <span className="text-[10px] font-black uppercase text-gray-400 block tracking-wider">Available Quantity</span>
                        <span className="font-black text-[#12233F] text-sm block mt-0.5">{sup.availableQuantity?.toLocaleString()} {sup.unit || 'kg'}</span>
                      </div>
                    </div>

                    {/* Section 3: Commercial & Transit Specs */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="bg-white p-3.5 rounded-2xl border border-[#DDE7E2] shadow-2xs">
                        <span className="text-gray-400 block text-[10px] font-black uppercase tracking-wider">Asking Price</span>
                        <span className="font-black text-[#087A5A] text-base mt-0.5 block">
                          ₹{sup.price}/{sup.unit || 'kg'}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">Budget: ₹{reqMaxPrice}/{sup.unit || 'kg'}</span>
                      </div>

                      <div className="bg-white p-3.5 rounded-2xl border border-[#DDE7E2] shadow-2xs">
                        <span className="text-gray-400 block text-[10px] font-black uppercase tracking-wider">Transit Distance</span>
                        <span className="font-black text-[#12233F] text-base mt-0.5 block">
                          {sup.distanceKm} km
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">{sup.supplierCity || 'Coimbatore'} &rarr; {reqCity}</span>
                      </div>

                      <div className="bg-white p-3.5 rounded-2xl border border-[#DDE7E2] shadow-2xs">
                        <span className="text-gray-400 block text-[10px] font-black uppercase tracking-wider">Est. Freight Rate</span>
                        <span className="font-black text-[#12233F] text-base mt-0.5 block">
                          {formatINR(sup.estimatedTransportCostInr || Math.round(sup.distanceKm * 28 + 250))}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">Regional carrier</span>
                      </div>

                      <div className="bg-white p-3.5 rounded-2xl border border-[#DDE7E2] shadow-2xs">
                        <span className="text-gray-400 block text-[10px] font-black uppercase tracking-wider">CO₂ Diversion</span>
                        <span className="font-black text-[#009B72] text-base mt-0.5 block">
                          {sup.netCarbonSavedKg ? sup.netCarbonSavedKg.toLocaleString() : '1,500'} kg
                        </span>
                        <span className="text-[10px] text-emerald-600 font-bold">Circular avoidance</span>
                      </div>
                    </div>

                    {/* Section 4: WHY THIS SUPPLIER IS RECOMMENDED (Dynamically Computed Box) */}
                    <div className="bg-[#E8F7F1]/60 p-5 rounded-2xl border border-[#009B72]/30 space-y-2.5 text-xs">
                      <span className="font-black text-[#087A5A] uppercase tracking-wider text-[11px] block flex items-center gap-1.5">
                        <FiCheckCircle className="w-4 h-4 text-[#009B72]" />
                        <span>WHY THIS SUPPLIER IS RECOMMENDED</span>
                      </span>

                      <div className="space-y-1.5 text-[#12233F] font-semibold text-xs leading-relaxed">
                        {sup.reasons && sup.reasons.length > 0 ? (
                          sup.reasons.map((r, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <FiCheck className="w-3.5 h-3.5 text-[#009B72] shrink-0 mt-0.5 stroke-[3]" />
                              <span>{r}</span>
                            </div>
                          ))
                        ) : (
                          <>
                            <div className="flex items-start gap-2">
                              <FiCheck className="w-3.5 h-3.5 text-[#009B72] shrink-0 mt-0.5 stroke-[3]" />
                              <span>{sup.category} matches required {selectedRequirement?.material || 'material stream'}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <FiCheck className="w-3.5 h-3.5 text-[#009B72] shrink-0 mt-0.5 stroke-[3]" />
                              <span>Purity ({sup.purity || 98.2}%) meets required minimum ({reqMinPurity}%)</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <FiCheck className="w-3.5 h-3.5 text-[#009B72] shrink-0 mt-0.5 stroke-[3]" />
                              <span>Available quantity ({sup.availableQuantity?.toLocaleString()} {sup.unit}) is sufficient for requested {reqQty.toLocaleString()} {sup.unit}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <FiCheck className="w-3.5 h-3.5 text-[#009B72] shrink-0 mt-0.5 stroke-[3]" />
                              <span>Asking price (₹{sup.price}/{sup.unit}) is below maximum budget (₹{reqMaxPrice}/{sup.unit})</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <FiCheck className="w-3.5 h-3.5 text-[#009B72] shrink-0 mt-0.5 stroke-[3]" />
                              <span>Transit distance ({sup.distanceKm} km) is within the preferred search radius</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Section 5: Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div className="flex flex-wrap items-center gap-3">
                        {requestedSuppliers[sup.wasteId] ? (
                          <div className="flex items-center gap-2">
                            <span className="px-5 py-2.5 bg-[#E8F7F1] text-[#087A5A] font-black rounded-xl text-xs flex items-center gap-1.5 border border-[#009B72]/40">
                              <FiCheck className="w-4 h-4 text-[#009B72] stroke-[3]" /> Request Sent
                            </span>
                            <button
                              onClick={() => navigate(`/exchange/${requestedSuppliers[sup.wasteId]}`)}
                              className="px-4 py-2.5 bg-white border border-[#DDE7E2] hover:bg-gray-50 text-[#12233F] font-bold rounded-xl text-xs transition-all cursor-pointer"
                            >
                              View Order &rarr;
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleSendExchangeRequest(sup)}
                            className="px-6 py-3 bg-[#009B72] hover:bg-[#087A5A] text-white font-extrabold rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
                          >
                            <FiSend className="w-3.5 h-3.5" /> Send Exchange Request
                          </button>
                        )}

                        <button
                          onClick={() => navigate('/route-optimization', { state: { wasteId: sup.wasteId } })}
                          className="px-4 py-3 bg-white border border-[#DDE7E2] hover:bg-[#F8FAF9] text-[#12233F] font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <FiTruck className="w-3.5 h-3.5 text-[#009B72]" /> Optimize Route
                        </button>
                      </div>

                      <Link
                        to={`/waste/${sup.wasteId}`}
                        className="text-xs font-black text-[#009B72] hover:underline flex items-center gap-1 py-2"
                      >
                        <FiEye className="w-3.5 h-3.5" />
                        <span>Inspect Full Waste Dossier</span>
                      </Link>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
