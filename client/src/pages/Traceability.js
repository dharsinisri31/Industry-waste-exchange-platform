import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../services/authAPI';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Loader from '../components/Loader';
import { 
  FiSearch, FiShield, FiCheckCircle, FiTruck, FiLayers, 
  FiFileText, FiAward, FiGlobe, FiClock, FiMapPin, FiStar,
  FiArrowRight, FiRefreshCw, FiAlertTriangle, FiDollarSign
} from 'react-icons/fi';

export default function Traceability() {
  const { id } = useParams();
  const [searchQuery, setSearchQuery] = useState(id || 'EL-BATCH-PET-2026-00042');
  const [loading, setLoading] = useState(false);
  const [record, setRecord] = useState(null);
  const [error, setError] = useState('');

  const fetchTraceability = async (queryId) => {
    if (!queryId) return;
    try {
      setLoading(true);
      setError('');
      const res = await API.get(`/traceability/${queryId}`);
      if (res.data && res.data.success) {
        setRecord(res.data);
      }
    } catch (err) {
      console.warn('Traceability query error:', err.message);
      setError(err.response?.data?.message || `No traceability record found for "${queryId}".`);
      setRecord(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      setSearchQuery(id);
      fetchTraceability(id);
    } else {
      fetchTraceability('EL-BATCH-PET-2026-00042');
    }
  }, [id]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery) fetchTraceability(searchQuery);
  };

  return (
    <div className="min-h-screen bg-[#f8faf9] flex flex-col font-sans text-gray-900">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 w-full">
        
        {/* Page Hero Header */}
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-gray-200 shadow-sm space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-extrabold uppercase tracking-wider">
            <FiShield className="w-3.5 h-3.5" />
            <span>End-to-End Circular Traceability Ledger</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
            Industrial Resource Passport & Chain of Custody
          </h1>
          <p className="text-sm sm:text-base text-gray-600 font-medium max-w-3xl leading-relaxed">
            Verify the complete lifecycle of secondary raw materials — from factory generation, AI inspection, and verified weighment to logistics dispatch, delivery, and circular recycling.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 pt-2 max-w-2xl">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
                <FiSearch className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter Batch ID (e.g. EL-BATCH-PET-2026-00042) or Exchange ID..."
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-300 text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 font-medium"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <FiSearch className="w-4 h-4" />
              <span>Trace Batch</span>
            </button>
          </form>

          {/* Quick Demo Batch Tags */}
          <div className="flex items-center gap-2 text-xs text-gray-500 pt-1 flex-wrap font-medium">
            <span>Try Demo Batches:</span>
            <button
              type="button"
              onClick={() => { setSearchQuery('EL-BATCH-PET-2026-00042'); fetchTraceability('EL-BATCH-PET-2026-00042'); }}
              className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-emerald-50 hover:text-emerald-800 font-mono text-[11px] text-gray-700 transition-colors"
            >
              EL-BATCH-PET-2026-00042
            </button>
            <button
              type="button"
              onClick={() => { setSearchQuery('EL-EX-2026-00042'); fetchTraceability('EL-EX-2026-00042'); }}
              className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-emerald-50 hover:text-emerald-800 font-mono text-[11px] text-gray-700 transition-colors"
            >
              EL-EX-2026-00042
            </button>
          </div>
        </div>

        {/* Loading / Error States */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader />
          </div>
        ) : error ? (
          <div className="bg-white p-10 rounded-3xl border border-gray-200 text-center space-y-3">
            <FiAlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
            <h3 className="text-base font-bold text-gray-900">{error}</h3>
            <p className="text-xs text-gray-500">Please check the ID format or try one of the demo showcase batches above.</p>
          </div>
        ) : record ? (
          <div className="space-y-8">
            
            {/* Record Overview Summary Card */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black text-gray-900">{record.material?.name}</h2>
                    {record.isDemo && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                        Demo Showcase
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 font-medium mt-1">
                    <span>Batch: <strong className="text-emerald-800 font-mono">{record.batchId}</strong></span>
                    {record.exchangeId && (
                      <span>&bull; Order: <strong className="text-gray-900 font-mono">#{record.exchangeId}</strong></span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-900 font-extrabold text-xs flex items-center gap-1.5 border border-emerald-200">
                    <FiCheckCircle className="w-4 h-4 text-emerald-700" />
                    <span>{record.status?.toUpperCase() || 'VERIFIED'}</span>
                  </span>
                </div>
              </div>

              {/* 4 Specs Grids */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
                  <span className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">Verified Quantity</span>
                  <div className="text-lg font-black text-gray-900">{record.material?.quantity} {record.material?.unit}</div>
                  <span className="text-[10px] text-gray-500">{record.material?.category}</span>
                </div>

                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
                  <span className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">Quality Grade</span>
                  <div className="text-lg font-black text-teal-800">{record.material?.qualityGrade}</div>
                  <span className="text-[10px] text-gray-500">{record.material?.purity}% Chemical Purity</span>
                </div>

                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
                  <span className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">Avoided Carbon</span>
                  <div className="text-lg font-black text-emerald-800">{record.sustainability?.carbonSavedKg} kg CO₂e</div>
                  <span className="text-[10px] text-gray-500">ISO 14044 Verified</span>
                </div>

                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
                  <span className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">Trade Settlement</span>
                  <div className="text-lg font-black text-gray-900">{record.paymentStatus === 'settled' ? 'Escrow Released' : 'Secured (Demo)'}</div>
                  <span className="text-[10px] text-gray-500">Digital Escrow</span>
                </div>
              </div>

              {/* Producer & Recycler Origin/Destination */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-5 rounded-2xl bg-emerald-50/40 border border-emerald-200 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-900">Source Waste Producer</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Verified Seller</span>
                  </div>
                  <div className="font-extrabold text-sm text-gray-900">{record.seller?.companyName}</div>
                  <div className="text-xs text-gray-600 flex items-center gap-1.5">
                    <FiMapPin className="text-emerald-700 w-3.5 h-3.5 shrink-0" />
                    <span>{record.seller?.address}, {record.seller?.city}</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-teal-50/40 border border-teal-200 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-900">Destination Recycler / Buyer</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">Verified Buyer</span>
                  </div>
                  <div className="font-extrabold text-sm text-gray-900">{record.buyer?.companyName || 'Industrial Recycling Partner'}</div>
                  <div className="text-xs text-gray-600 flex items-center gap-1.5">
                    <FiMapPin className="text-teal-700 w-3.5 h-3.5 shrink-0" />
                    <span>{record.buyer?.address || 'Industrial Estate'}, {record.buyer?.city || 'Regional'}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Digital Weighment Variance Ledger */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">Digital Weighment Scale Ledger</h3>
                  <p className="text-xs text-gray-500 font-medium">Automatic multi-point weight reconciliation between dispatch, transport, and delivery weighbridges.</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  record.weighment?.varianceStatus === 'Normal' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  Variance: {record.weighment?.variancePercent || 0}% ({record.weighment?.varianceStatus || 'Normal'})
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-gray-500 block">Seller Declared</span>
                  <span className="text-base font-black text-gray-900">{record.weighment?.sellerDeclaredWeight || 5000} kg</span>
                </div>
                <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-gray-500 block">Pickup Scale</span>
                  <span className="text-base font-black text-gray-900">{record.weighment?.pickupWeight || 4960} kg</span>
                </div>
                <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-gray-500 block">Delivery Scale</span>
                  <span className="text-base font-black text-gray-900">{record.weighment?.receivedWeight || 4930} kg</span>
                </div>
                <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-gray-500 block">Processed Yield</span>
                  <span className="text-base font-black text-emerald-800">{record.weighment?.processedWeight || 4800} kg</span>
                </div>
              </div>
            </div>

            {/* Event-Driven Chronological Timeline */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
              <div className="pb-2 border-b border-gray-100">
                <h3 className="text-base font-extrabold text-gray-900">End-to-End Chain of Custody Timeline</h3>
                <p className="text-xs text-gray-500 font-medium">Real-time audit log generated from recorded transaction milestones.</p>
              </div>

              <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-200">
                {record.timeline?.map((step, idx) => (
                  <div key={idx} className="relative group">
                    {/* Timeline Node Dot */}
                    <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-emerald-600 border-4 border-white shadow-xs flex items-center justify-center text-white">
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-gray-900">{step.title}</span>
                        <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md font-bold">
                          {new Date(step.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 font-medium leading-relaxed">
                        {step.description}
                      </p>
                      <div className="text-[11px] text-gray-500 flex items-center gap-3 pt-0.5">
                        <span>Actor: <strong>{step.actor}</strong></span>
                        <span>&bull; Location: <strong>{step.locationName}</strong></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Verified Documents Ledger */}
            {record.documents?.length > 0 && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-4">
                <div className="pb-2 border-b border-gray-100">
                  <h3 className="text-base font-extrabold text-gray-900">Exchange Compliance & Verification Documents</h3>
                  <p className="text-xs text-gray-500 font-medium">Immutable documentation ledger verified by platform governance.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {record.documents.map((doc, dIdx) => (
                    <div key={dIdx} className="p-4 bg-gray-50 rounded-2xl border border-gray-200 flex justify-between items-center text-xs">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800">
                          <FiFileText className="w-4 h-4" />
                        </div>
                        <div>
                          <strong className="text-gray-900 block">{doc.name}</strong>
                          <span className="text-[11px] text-gray-500">{doc.docType} &bull; {doc.uploaderName}</span>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                        {doc.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Partner Trust Rating Card */}
            {record.ratings?.sellerRating && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-4">
                <div className="pb-2 border-b border-gray-100">
                  <h3 className="text-base font-extrabold text-gray-900">Mutual Partner Trust Rating</h3>
                  <p className="text-xs text-gray-500 font-medium">Verified ratings submitted by buyer and seller upon exchange completion.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-900">Buyer Review of Seller</span>
                      <div className="flex items-center gap-1 text-amber-500 font-bold">
                        <FiStar className="fill-current w-3.5 h-3.5" />
                        <span>{record.ratings.sellerRating.overall} / 5</span>
                      </div>
                    </div>
                    <p className="text-gray-600 italic">"{record.ratings.sellerRating.comment}"</p>
                  </div>

                  {record.ratings.buyerRating && (
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-900">Seller Review of Buyer</span>
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                          <FiStar className="fill-current w-3.5 h-3.5" />
                          <span>{record.ratings.buyerRating.overall} / 5</span>
                        </div>
                      </div>
                      <p className="text-gray-600 italic">"{record.ratings.buyerRating.comment}"</p>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        ) : null}

      </main>

      <Footer />
    </div>
  );
}
