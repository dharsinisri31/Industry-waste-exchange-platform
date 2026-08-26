import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import Loader from '../components/Loader';
import { apiGet, apiPost } from '../services/api';
import { formatINR } from '../utils/formatINR';
import { FiZap, FiCheckCircle, FiMapPin, FiTruck, FiGlobe, FiDollarSign, FiInfo, FiSend } from 'react-icons/fi';

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

  const handleSendExchangeRequest = async (sup) => {
    try {
      setLoading(true);
      const res = await apiPost(`/api/waste/${sup.wasteId}/exchange`, {
        requirementId: selectedReqId,
        quantity: matchResults?.requirement?.quantity || sup.availableQuantity
      });

      const exchangeId = res.exchangeId || res.orderId || res._id;
      setRequestedSuppliers(prev => ({
        ...prev,
        [sup.wasteId]: exchangeId
      }));

      setNotification(`Exchange request sent directly to ${sup.supplierName}. Status: Request Sent.`);
      setTimeout(() => setNotification(''), 6000);
    } catch (err) {
      alert(err.message || 'Failed to send exchange request.');
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
      console.warn('Supplier matcher error:', err.message);
      // Demo fallback matches
      setMatchResults({
        requirement: {
          material: 'PET Plastic Scrap',
          quantity: 500,
          unit: 'kg',
          maxPrice: 50,
          minPurity: 95
        },
        suppliers: [
          {
            wasteId: 'w1',
            supplierName: 'ABC Plastic Manufacturing',
            material: 'PET Plastic Scrap Flakes',
            category: 'Plastic Scrap',
            availableQuantity: 600,
            unit: 'kg',
            price: 45,
            maxPriceBudget: 50,
            priceEvaluation: 'Below Budget',
            distanceKm: 48,
            compatibilityScore: 94,
            estimatedTransportCostInr: 1594,
            estimatedTransportCo2Kg: 41,
            netCarbonSavedKg: 709,
            reasons: [
              'PET matches required material stream',
              'Purity (96.5%) exceeds required minimum (95%)',
              'Quantity (600 kg) is sufficient for monthly demand',
              'Price (₹45/kg) is below maximum budget (₹50/kg)',
              'Seller is geographically close (48 km in Erode)'
            ]
          }
        ]
      });
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
      <div className="space-y-6 max-w-6xl mx-auto font-sans">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <FiZap className="text-teal-600" /> Smart Matching
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 font-medium">
              Find suitable suppliers for your material requirements based on quality, quantity, price, and location.
            </p>
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-xs">
            <FiCheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Selector Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block">
              Select Material Requirement to Source:
            </label>
            <select
              value={selectedReqId}
              onChange={(e) => setSelectedReqId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 font-extrabold bg-white cursor-pointer shadow-2xs"
            >
              {myRequirements.length === 0 ? (
                <option value="">PET Plastic Scrap &bull; 500 kg/month (Max ₹50/kg)</option>
              ) : (
                myRequirements.map(req => (
                  <option key={req._id} value={req._id}>
                    {req.material} &bull; {req.quantity} {req.unit}/{req.frequency} (Max {formatINR(req.maxPrice)}/{req.unit}) &bull; {req.city}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {loading ? (
          <Loader />
        ) : !matchResults || matchResults.suppliers.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-xs text-gray-500">
            No matching seller listings found for the selected requirement.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-6">
              <h3 className="text-sm font-extrabold text-gray-900 border-b border-gray-100 pb-3 flex items-center justify-between">
                <span>Ranked AI Matched Suppliers ({matchResults.suppliers.length})</span>
                <span className="text-xs font-semibold text-gray-500">Criteria: Material 40% | Quality 20% | Quantity 15% | Price 15% | Distance 10%</span>
              </h3>

              <div className="space-y-6">
                {matchResults.suppliers.map((sup, idx) => (
                  <div key={sup.wasteId || idx} className="p-6 bg-gray-50 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-200 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 bg-teal-100 text-teal-800 rounded-full text-[10px] font-extrabold">
                            Rank #{idx + 1} Supplier Match
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            sup.priceEvaluation === 'Below Budget' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {sup.priceEvaluation}
                          </span>
                        </div>
                        <h4 className="text-base font-extrabold text-gray-900 mt-1">{sup.supplierName}</h4>
                        <div className="text-xs text-gray-600 font-semibold">{sup.material} &bull; Available: {sup.availableQuantity} {sup.unit}</div>
                      </div>

                      <div className="text-right">
                        <span className="text-2xl font-black text-teal-700 block">{sup.compatibilityScore}%</span>
                        <span className="text-[10px] font-bold text-gray-500 uppercase">AI Compatibility Match</span>
                      </div>
                    </div>

                    {/* Progress Bar Score Breakdown */}
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between font-bold text-gray-700 text-[11px]">
                        <span>Match Compatibility Score</span>
                        <span>{sup.compatibilityScore}%</span>
                      </div>
                      <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-teal-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${sup.compatibilityScore}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="bg-white p-3 rounded-xl border border-gray-200">
                        <span className="text-gray-500 block text-[10px] font-bold uppercase">Asking Price</span>
                        <span className="font-extrabold text-emerald-800 text-sm">{formatINR(sup.price)} / {sup.unit}</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-gray-200">
                        <span className="text-gray-500 block text-[10px] font-bold uppercase">Transit Distance</span>
                        <span className="font-extrabold text-gray-900 text-sm">{sup.distanceKm} km</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-gray-200">
                        <span className="text-gray-500 block text-[10px] font-bold uppercase">Freight Cost</span>
                        <span className="font-extrabold text-teal-800 text-sm">{formatINR(sup.estimatedTransportCostInr)}</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-gray-200">
                        <span className="text-gray-500 block text-[10px] font-bold uppercase">Carbon Avoided</span>
                        <span className="font-extrabold text-emerald-700 text-sm">{sup.netCarbonSavedKg} kg CO₂e</span>
                      </div>
                    </div>

                    {/* Why Recommended Explanation */}
                    <div className="bg-teal-50/60 p-4 rounded-xl border border-teal-200 space-y-1.5 text-xs">
                      <span className="font-extrabold text-teal-950 uppercase tracking-wider text-[10px] block">
                        Why this supplier is recommended:
                      </span>
                      <ul className="space-y-1 text-teal-900 font-medium">
                        {sup.reasons.map((r, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <FiCheckCircle className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      {requestedSuppliers[sup.wasteId] ? (
                        <div className="flex items-center gap-2">
                          <span className="px-4 py-2 bg-emerald-100 text-emerald-800 font-extrabold rounded-xl text-xs flex items-center gap-1.5 border border-emerald-300">
                            <FiCheckCircle className="w-4 h-4" /> Request Sent
                          </span>
                          <button
                            onClick={() => navigate(`/exchange/${requestedSuppliers[sup.wasteId]}`)}
                            className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-900 font-bold rounded-xl text-xs transition-all cursor-pointer"
                          >
                            View Order &rarr;
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleSendExchangeRequest(sup)}
                          className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-xl text-xs shadow-2xs transition-all cursor-pointer flex items-center gap-2"
                        >
                          <FiSend className="w-3.5 h-3.5" /> Send Exchange Request
                        </button>
                      )}
                      <button
                        onClick={() => navigate('/gis-map', { state: { wasteId: sup.wasteId } })}
                        className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-800 font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <FiTruck className="w-3.5 h-3.5 text-teal-600" /> Optimize Route
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
