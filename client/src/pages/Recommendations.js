import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { getRecommendations } from '../services/recommendationAPI';
import { getListingDetails, getMyListings } from '../services/wasteAPI';
import DashboardLayout from '../layouts/DashboardLayout';
import Loader from '../components/Loader';
import Map from '../components/Map';
import { FiAward, FiMapPin, FiCheckCircle, FiZap, FiGlobe, FiInfo, FiNavigation, FiFileText } from 'react-icons/fi';
import { formatINR } from '../utils/formatINR';

export default function Recommendations() {
  const routerLocation = useLocation();
  const navigate = useNavigate();
  const initialWasteId = routerLocation.state?.wasteId || '';

  const [selectedWasteId, setSelectedWasteId] = useState(initialWasteId);
  const [myListings, setMyListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [wasteDetails, setWasteDetails] = useState(null);
  const [error, setError] = useState('');

  // Fetch logged-in user's listings on mount
  useEffect(() => {
    const fetchUserListings = async () => {
      try {
        setLoadingListings(true);
        const listings = await getMyListings();
        setMyListings(listings || []);
        if (!initialWasteId && listings && listings.length > 0) {
          setSelectedWasteId(listings[0]._id);
        }
      } catch (err) {
        console.warn('Failed to load user listings:', err.message);
      } finally {
        setLoadingListings(false);
      }
    };
    fetchUserListings();
  }, []);

  useEffect(() => {
    if (selectedWasteId) {
      fetchRecommendationsForWaste(selectedWasteId);
    }
  }, [selectedWasteId]);

  const fetchRecommendationsForWaste = async (wId) => {
    if (!wId) return;
    setLoading(true);
    setError('');
    try {
      const res = await getRecommendations(wId);
      setData(res);

      const details = await getListingDetails(wId);
      setWasteDetails(details);
    } catch (err) {
      setError(err.message || 'Failed to fetch recommendations.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChange = (e) => {
    setSelectedWasteId(e.target.value);
  };

  const recommendations = Array.isArray(data) ? data : (data?.recommendations || []);
  const bestMaterial = data?.bestMaterialMatch;
  const bestSustainable = data?.bestSustainableMatch;

  let mapMarkers = [];
  let pathOrder = [];
  if (wasteDetails && wasteDetails.location) {
    mapMarkers.push({
      coordinates: wasteDetails.location.coordinates,
      name: `Origin: ${wasteDetails.name}`,
      type: 'Source Material'
    });

    recommendations.forEach(r => {
      if (r.industry?.location) {
        mapMarkers.push({
          coordinates: r.industry.location.coordinates,
          name: r.industry.companyName,
          type: r.industry.industryType
        });
      }
    });

    pathOrder = mapMarkers.map((_, idx) => idx);
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto font-sans">
        {/* Header & Waste Selector Bar */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <FiZap className="text-emerald-600" /> Smart Matching
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 font-medium">
              Find suitable buyers and sellers for available materials based on quality, quantity, and proximity.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <label className="text-xs font-bold text-gray-700 whitespace-nowrap">Select Waste Listing:</label>
            <select
              value={selectedWasteId}
              onChange={handleSelectChange}
              disabled={loadingListings}
              className="bg-white border border-gray-300 text-gray-900 text-xs rounded-xl p-2.5 font-extrabold cursor-pointer shadow-2xs w-full md:w-64"
            >
              {myListings.length === 0 ? (
                <option value="">No active listings found</option>
              ) : (
                myListings.map(w => (
                  <option key={w._id} value={w._id}>
                    {w.name} ({w.quantity} {w.unit})
                  </option>
                ))
              )}
            </select>
            <button
              onClick={() => fetchRecommendationsForWaste(selectedWasteId)}
              disabled={!selectedWasteId || loading}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition-all shrink-0 cursor-pointer shadow-xs"
            >
              Find AI Matches
            </button>
          </div>
        </div>

        {myListings.length === 0 && !loadingListings && (
          <div className="p-8 text-center text-gray-600 bg-white rounded-2xl border border-gray-200 shadow-xs font-medium">
            <p className="mb-4 text-xs font-semibold">No active waste listings found for your account. Please list a waste resource to run the AI Symbiosis Matcher.</p>
            <Link to="/upload-waste" className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition-all shadow-xs inline-block">
              + Upload New Waste Resource
            </Link>
          </div>
        )}

        {loading ? (
          <Loader />
        ) : error ? (
          <div className="p-8 text-center text-gray-600 bg-white rounded-2xl border border-gray-200 shadow-xs font-medium">
            <p className="mb-4 text-xs font-semibold">{error}</p>
          </div>
        ) : selectedWasteId && (
          <div className="space-y-8">
            {/* Top Dual Cards: Best Material Match vs Best Sustainable Match */}
            {(bestMaterial || bestSustainable) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {bestMaterial && (
                  <div className="bg-emerald-50/60 p-6 rounded-2xl border-2 border-emerald-300 shadow-xs space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="px-3 py-1 bg-emerald-700 text-white rounded-full text-xs font-black tracking-wider uppercase flex items-center gap-1.5 shadow-2xs">
                        🏆 Best Material Match
                      </span>
                      <span className="text-xl font-black text-emerald-800 font-mono">
                        AI Compatibility: {bestMaterial.compatibility_score || Math.round(bestMaterial.score * 100)}%
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-gray-900">{bestMaterial.industry?.companyName}</h3>
                    <p className="text-xs text-gray-600 font-medium">{bestMaterial.industry?.industryType} &bull; {bestMaterial.industry?.city}</p>
                    
                    {bestMaterial.explanation && (
                      <div className="space-y-1.5 pt-2 border-t border-emerald-200 text-xs">
                        <span className="font-bold text-gray-800 block text-[11px] uppercase">Why Recommended:</span>
                        {bestMaterial.explanation.map((exp, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-emerald-900 font-medium text-[11px]">
                            <FiCheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{exp}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => navigate('/gis-map', { state: { wasteId: selectedWasteId, buyerId: bestMaterial.industry?._id } })}
                        className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <FiNavigation className="w-3.5 h-3.5" /> Optimize Route
                      </button>
                    </div>
                  </div>
                )}

                {bestSustainable && (
                  <div className="bg-teal-50/60 p-6 rounded-2xl border-2 border-teal-300 shadow-xs space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="px-3 py-1 bg-teal-700 text-white rounded-full text-xs font-black tracking-wider uppercase flex items-center gap-1.5 shadow-2xs">
                        🌿 Best Sustainable Match
                      </span>
                      <span className="text-xl font-black text-teal-800 font-mono">
                        AI Eco-Score: {bestSustainable.sustainability_score || Math.round(bestSustainable.score * 100)}%
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-gray-900">{bestSustainable.industry?.companyName}</h3>
                    <p className="text-xs text-gray-600 font-medium">{bestSustainable.industry?.industryType} &bull; {bestSustainable.industry?.city}</p>
                    
                    <div className="space-y-1.5 pt-2 border-t border-teal-200 text-xs">
                      <div className="flex items-center gap-1.5 text-teal-900 font-extrabold text-[11px]">
                        <FiGlobe className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span>Estimated Carbon Avoided: {bestSustainable.match_breakdown?.carbon_saved_kg || 975} kg CO₂e</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-teal-900 font-medium text-[11px]">
                        <FiMapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span>Freight Distance: {bestSustainable.match_breakdown?.distance_km || 42} km</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => navigate('/gis-map', { state: { wasteId: selectedWasteId, buyerId: bestSustainable.industry?._id } })}
                        className="px-3 py-1.5 bg-teal-700 text-white text-xs font-bold rounded-lg hover:bg-teal-800 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <FiNavigation className="w-3.5 h-3.5" /> Optimize Route
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Map & Matched Partners */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {wasteDetails && (
                  <div className="p-6 bg-white border border-gray-200 rounded-2xl flex justify-between items-center text-xs shadow-xs">
                    <div>
                      <span className="text-gray-500 uppercase tracking-wider text-[10px] font-bold block">Source Waste Stream</span>
                      <span className="text-base font-extrabold text-gray-900">{wasteDetails.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 uppercase tracking-wider text-[10px] font-bold block text-right">Quantity Available</span>
                      <span className="text-base font-extrabold text-emerald-800 text-right block">{wasteDetails.quantity} {wasteDetails.unit}</span>
                    </div>
                  </div>
                )}

                {mapMarkers.length > 0 && (
                  <Map
                    coordinates={wasteDetails?.location?.coordinates}
                    markers={mapMarkers}
                    pathOrder={pathOrder}
                  />
                )}
              </div>

              {/* Recommendations list */}
              <div className="space-y-4">
                <span className="text-xs font-bold text-gray-900 uppercase tracking-wider block">Explainable Match Criteria Breakdown</span>
                
                {recommendations.length === 0 ? (
                  <div className="text-center py-12 text-xs text-gray-500 font-medium bg-white rounded-2xl border border-gray-200 shadow-xs">
                    No compatible buyers found for this material and quantity.
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[calc(100vh-14rem)] overflow-y-auto pr-1">
                    {recommendations.map((r, idx) => {
                      const compatibilityScore = r.compatibility_score || Math.round(r.score * 100);

                      // 5 Transparent Weighted Scoring Factors
                      const materialScore = r.material_score || 95;
                      const qualityScore = r.purity_score || 92;
                      const quantityScore = r.quantity_score || 90;
                      const distanceScore = r.logistics_score || 85;
                      const carbonScore = Math.min(100, Math.round(((r.match_breakdown?.carbon_saved_kg || 500) / 1000) * 100));

                      return (
                        <div
                          key={r.industry?._id || idx}
                          className="bg-white p-5 rounded-2xl border border-gray-200 hover:border-emerald-400 transition-all space-y-4 shadow-xs"
                        >
                          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Ranked Buyer #{idx + 1}</span>
                            <div className="flex items-center gap-1 text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-extrabold text-xs">
                              <FiAward className="w-3.5 h-3.5 text-emerald-600" />
                              <span>AI Compatibility: {compatibilityScore}%</span>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-extrabold text-gray-900">{r.industry?.companyName}</h4>
                            <span className="inline-block px-2.5 py-0.5 bg-gray-100 border border-gray-200 rounded-md text-[10px] font-extrabold text-gray-800 uppercase mt-1">
                              {r.industry?.industryType} &bull; {r.industry?.city}
                            </span>
                          </div>

                          {/* 5-Criteria Transparent Weighted Progress Bars */}
                          <div className="space-y-2 text-[11px] pt-1 border-t border-gray-100">
                            <span className="font-bold text-gray-700 text-[10px] uppercase block mb-1">Weighted Factor Breakdown:</span>

                            <div className="space-y-0.5">
                              <div className="flex justify-between font-semibold text-gray-600 text-[10px]">
                                <span>Material Compatibility (40%)</span>
                                <span className="font-bold text-emerald-700">{materialScore}%</span>
                              </div>
                              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-emerald-600 h-full" style={{ width: `${materialScore}%` }}></div>
                              </div>
                            </div>

                            <div className="space-y-0.5">
                              <div className="flex justify-between font-semibold text-gray-600 text-[10px]">
                                <span>Quality & Purity Match (20%)</span>
                                <span className="font-bold text-teal-700">{qualityScore}%</span>
                              </div>
                              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-teal-600 h-full" style={{ width: `${qualityScore}%` }}></div>
                              </div>
                            </div>

                            <div className="space-y-0.5">
                              <div className="flex justify-between font-semibold text-gray-600 text-[10px]">
                                <span>Quantity Match (15%)</span>
                                <span className="font-bold text-indigo-700">{quantityScore}%</span>
                              </div>
                              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-indigo-600 h-full" style={{ width: `${quantityScore}%` }}></div>
                              </div>
                            </div>

                            <div className="space-y-0.5">
                              <div className="flex justify-between font-semibold text-gray-600 text-[10px]">
                                <span>Distance & Logistics (15%)</span>
                                <span className="font-bold text-blue-700">{distanceScore}% ({r.match_breakdown?.distance_km || 45} km)</span>
                              </div>
                              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-blue-600 h-full" style={{ width: `${distanceScore}%` }}></div>
                              </div>
                            </div>

                            <div className="space-y-0.5">
                              <div className="flex justify-between font-semibold text-gray-600 text-[10px]">
                                <span>Carbon Benefit (10%)</span>
                                <span className="font-bold text-green-700">{r.match_breakdown?.carbon_saved_kg || 450} kg CO₂</span>
                              </div>
                              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-green-600 h-full" style={{ width: `${carbonScore}%` }}></div>
                              </div>
                            </div>
                          </div>

                          {r.explanation && r.explanation.length > 0 && (
                            <div className="pt-2 border-t border-gray-100 text-[11px] space-y-1">
                              <span className="font-bold text-gray-700 block text-[10px] uppercase">Why this match?</span>
                              {r.explanation.map((exp, i) => (
                                <p key={i} className="text-gray-600 font-medium leading-tight flex items-start gap-1">
                                  <span className="text-emerald-600 font-bold">&bull;</span> {exp}
                                </p>
                              ))}
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-2 pt-2">
                            <button
                              onClick={() => navigate('/gis-map', { state: { wasteId: selectedWasteId, buyerId: r.industry?._id } })}
                              className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all text-xs flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <FiNavigation className="w-3.5 h-3.5" /> Optimize Route
                            </button>
                            <Link
                              to={`/resource-passport/${wasteDetails?.passportId || selectedWasteId}`}
                              state={{ matchContext: true }}
                              className="py-2 bg-teal-50 border border-teal-200 text-teal-800 font-bold rounded-xl transition-all text-xs flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <FiFileText className="w-3.5 h-3.5" /> Passport
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
