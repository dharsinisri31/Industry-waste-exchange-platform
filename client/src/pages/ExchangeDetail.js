import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../services/authAPI';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Loader from '../components/Loader';
import { formatINR } from '../utils/formatINR';
import { 
  FiTrendingUp, FiCheckCircle, FiTruck, FiDollarSign, 
  FiFileText, FiStar, FiAward, FiShield, FiClock, 
  FiMapPin, FiLayers, FiAlertTriangle, FiUpload, FiRefreshCw 
} from 'react-icons/fi';

export default function ExchangeDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [exchange, setExchange] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState('');

  // Modals & form states
  const [showWeighmentModal, setShowWeighmentModal] = useState(false);
  const [weighmentForm, setWeighmentForm] = useState({
    sellerDeclaredWeight: 5000,
    pickupWeight: 4960,
    receivedWeight: 4930,
    processedWeight: 4800
  });

  const [showDocModal, setShowDocModal] = useState(false);
  const [docForm, setDocForm] = useState({
    name: 'Material Quality Inspection Certificate',
    docType: 'Material Quality Report',
    notes: 'Verified chemical assay and moisture reading.'
  });

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingForm, setRatingForm] = useState({
    materialQuality: 5,
    quantityAccuracy: 5,
    communication: 5,
    deliveryReliability: 5,
    overall: 5,
    comment: 'High grade material meeting exact procurement specifications.'
  });

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 5000);
  };

  const fetchExchange = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/traceability/exchanges/${id}`);
      if (res.data && res.data.exchange) {
        setExchange(res.data.exchange);
        setWeighmentForm({
          sellerDeclaredWeight: res.data.exchange.weighment?.sellerDeclaredWeight || res.data.exchange.quantity || 5000,
          pickupWeight: res.data.exchange.weighment?.pickupWeight || 4960,
          receivedWeight: res.data.exchange.weighment?.receivedWeight || 4930,
          processedWeight: res.data.exchange.weighment?.processedWeight || 4800
        });
      }
    } catch (err) {
      console.warn('Failed to load exchange:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExchange();
  }, [id]);

  const handleConfirmPayment = async () => {
    try {
      setActionLoading(true);
      await API.post(`/traceability/exchanges/${id}/payment/confirm`, {});
      showNotification('Demo Escrow Payment confirmed successfully!');
      fetchExchange();
    } catch (err) {
      alert(err.message || 'Payment confirmation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogisticsStatus = async (newStatus) => {
    try {
      setActionLoading(true);
      await API.post(`/traceability/exchanges/${id}/logistics/status`, { status: newStatus });
      showNotification(`Logistics status updated to "${newStatus}".`);
      fetchExchange();
    } catch (err) {
      alert(err.message || 'Logistics update failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordWeighment = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await API.post(`/traceability/exchanges/${id}/weighment`, weighmentForm);
      showNotification('Digital weighment recorded and variance calculated.');
      setShowWeighmentModal(false);
      fetchExchange();
    } catch (err) {
      alert(err.message || 'Weighment recording failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUploadDoc = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await API.post(`/traceability/exchanges/${id}/documents`, docForm);
      showNotification('Document uploaded for compliance review.');
      setShowDocModal(false);
      fetchExchange();
    } catch (err) {
      alert(err.message || 'Document upload failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmRecycling = async () => {
    try {
      setActionLoading(true);
      await API.post(`/traceability/exchanges/${id}/recycle-confirm`, {
        processedWeightKg: weighmentForm.processedWeight || 4800,
        recycledProduct: 'Secondary Recycled Pellets'
      });
      showNotification('Circular recycling confirmed and ESG metrics calculated!');
      fetchExchange();
    } catch (err) {
      alert(err.message || 'Recycling confirmation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitRating = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await API.post(`/traceability/exchanges/${id}/rate`, {
        role: 'buyer',
        ...ratingForm
      });
      showNotification('Partner trust rating recorded on network registry.');
      setShowRatingModal(false);
      fetchExchange();
    } catch (err) {
      alert(err.message || 'Rating submission failed.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8faf9] flex flex-col font-sans text-gray-900">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 w-full">
        
        {/* Header Bar */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-extrabold uppercase tracking-wider mb-2">
              <FiTrendingUp className="w-3.5 h-3.5" />
              <span>Exchange Order Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Exchange #{exchange?.exchangeId || id}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
              Batch: <strong className="text-emerald-800 font-mono">{exchange?.batchId || 'EL-BATCH-001'}</strong> &bull; Created {new Date(exchange?.createdAt || Date.now()).toLocaleDateString()}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link
              to={`/traceability/${exchange?.batchId || exchange?.exchangeId || id}`}
              className="px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 transition-all flex items-center gap-1.5"
            >
              <FiShield className="w-3.5 h-3.5 text-emerald-700" />
              <span>Public Traceability Page</span>
            </Link>
            <button
              onClick={fetchExchange}
              className="p-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 transition-all cursor-pointer"
              title="Refresh"
            >
              <FiRefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2">
            <FiCheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader />
          </div>
        ) : exchange ? (
          <div className="space-y-6">
            
            {/* Action Bar / Status Operations */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase text-gray-500">Current Lifecycle Stage:</span>
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 uppercase">
                    {exchange.status}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                    Payment: {exchange.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {exchange.paymentStatus !== 'confirmed' && exchange.paymentStatus !== 'settled' && (
                  <button
                    onClick={handleConfirmPayment}
                    disabled={actionLoading}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <FiDollarSign className="w-3.5 h-3.5" />
                    <span>Confirm Demo Escrow Payment</span>
                  </button>
                )}

                {exchange.logistics?.status === 'Scheduled' && (
                  <button
                    onClick={() => handleLogisticsStatus('In Transit')}
                    disabled={actionLoading}
                    className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <FiTruck className="w-3.5 h-3.5" />
                    <span>Dispatch Freight (Mark In Transit)</span>
                  </button>
                )}

                {exchange.logistics?.status === 'In Transit' && (
                  <button
                    onClick={() => handleLogisticsStatus('Delivered')}
                    disabled={actionLoading}
                    className="px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <FiCheckCircle className="w-3.5 h-3.5" />
                    <span>Confirm Delivery Arrival</span>
                  </button>
                )}

                <button
                  onClick={() => setShowWeighmentModal(true)}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 text-xs font-bold shadow-2xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  <FiLayers className="w-3.5 h-3.5" />
                  <span>Log Digital Weighment</span>
                </button>

                <button
                  onClick={() => setShowDocModal(true)}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 text-xs font-bold shadow-2xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  <FiUpload className="w-3.5 h-3.5" />
                  <span>Upload Document</span>
                </button>

                {exchange.status !== 'completed' && (
                  <button
                    onClick={handleConfirmRecycling}
                    disabled={actionLoading}
                    className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <FiAward className="w-3.5 h-3.5" />
                    <span>Confirm Recycling Completed</span>
                  </button>
                )}

                <button
                  onClick={() => setShowRatingModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  <FiStar className="w-3.5 h-3.5" />
                  <span>Rate Partner</span>
                </button>
              </div>
            </div>

            {/* 2-Column Main Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left 2-Cols: Overview & Timeline */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Material & Trade Specs */}
                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
                  <h2 className="text-base font-extrabold text-gray-900">Exchange Material Specifications</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-gray-500">Material</span>
                      <div className="font-extrabold text-gray-900">{exchange.waste?.name || 'Secondary Material'}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-gray-500">Quantity</span>
                      <div className="font-mono font-bold text-gray-900">{exchange.quantity} {exchange.unit || 'kg'}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-gray-500">Total Value</span>
                      <div className="font-mono font-bold text-emerald-800">{formatINR(exchange.totalPrice)}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-gray-500">Pricing Mode</span>
                      <div className="font-extrabold text-teal-800 uppercase">{exchange.pricingMode || 'Fixed'}</div>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-6">
                  <div className="pb-2 border-b border-gray-100">
                    <h2 className="text-base font-extrabold text-gray-900">Recorded Event Timeline</h2>
                    <p className="text-xs text-gray-500 font-medium">Automatic chain of custody ledger entries.</p>
                  </div>

                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-200">
                    {exchange.timeline?.map((step, idx) => (
                      <div key={idx} className="relative">
                        <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-emerald-600 border-4 border-white shadow-xs flex items-center justify-center text-white"></div>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2">
                            <strong className="text-gray-900 font-extrabold">{step.title}</strong>
                            <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                              {new Date(step.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-gray-600 font-medium">{step.description}</p>
                          <span className="text-[11px] text-gray-400 block">Actor: {step.actor}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Right 1-Col: Logistics, Documents, ESG */}
              <div className="space-y-6">
                
                {/* Logistics Card */}
                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-3">
                  <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                    <FiTruck className="text-teal-700 w-4 h-4" />
                    <span>Freight & Haulage</span>
                  </h3>
                  <div className="text-xs text-gray-700 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status:</span>
                      <strong className="text-emerald-800">{exchange.logistics?.status || 'Scheduled'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Vehicle:</span>
                      <span className="font-mono font-bold">{exchange.logistics?.vehicleNumber || 'TN-38-EX-8842'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Driver:</span>
                      <span>{exchange.logistics?.driverName || 'R. Soundararajan'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Distance:</span>
                      <span>{exchange.distanceKm || 326.94} km</span>
                    </div>
                  </div>
                </div>

                {/* Weighment Summary */}
                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-3">
                  <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                    <FiLayers className="text-emerald-700 w-4 h-4" />
                    <span>Digital Weighment</span>
                  </h3>
                  <div className="text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Declared:</span>
                      <strong>{exchange.weighment?.sellerDeclaredWeight || exchange.quantity || 5000} kg</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Received:</span>
                      <strong>{exchange.weighment?.receivedWeight || 4930} kg</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Variance:</span>
                      <span className="font-bold text-emerald-700">{exchange.weighment?.variancePercent || 1.4}% ({exchange.weighment?.varianceStatus || 'Normal'})</span>
                    </div>
                  </div>
                </div>

                {/* Sustainability Impact */}
                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-3">
                  <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                    <FiGlobe className="text-emerald-700 w-4 h-4" />
                    <span>Sustainability Ledger</span>
                  </h3>
                  <div className="text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Waste Diverted:</span>
                      <strong className="text-emerald-800">{exchange.sustainability?.wasteDivertedKg || exchange.quantity || 5000} kg</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Avoided CO₂:</span>
                      <strong className="text-teal-800">{exchange.sustainability?.carbonSavedKg || Math.round((exchange.quantity || 5000) * 1.85)} kg CO₂e</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Virgin Material Saved:</span>
                      <strong>{exchange.sustainability?.virginMaterialAvoidedKg || Math.round((exchange.quantity || 5000) * 0.85)} kg</strong>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>
        ) : null}

        {/* Weighment Modal */}
        {showWeighmentModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-gray-200 shadow-2xl space-y-4">
              <h3 className="text-lg font-extrabold text-gray-900">Record Digital Weighment</h3>
              <form onSubmit={handleRecordWeighment} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Seller Declared Weight (kg)</label>
                  <input
                    type="number"
                    value={weighmentForm.sellerDeclaredWeight}
                    onChange={(e) => setWeighmentForm({ ...weighmentForm, sellerDeclaredWeight: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Pickup Scale Weight (kg)</label>
                  <input
                    type="number"
                    value={weighmentForm.pickupWeight}
                    onChange={(e) => setWeighmentForm({ ...weighmentForm, pickupWeight: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Buyer Received Weight (kg)</label>
                  <input
                    type="number"
                    value={weighmentForm.receivedWeight}
                    onChange={(e) => setWeighmentForm({ ...weighmentForm, receivedWeight: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Recycled Product Output (kg)</label>
                  <input
                    type="number"
                    value={weighmentForm.processedWeight}
                    onChange={(e) => setWeighmentForm({ ...weighmentForm, processedWeight: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 font-medium"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowWeighmentModal(false)}
                    className="px-4 py-2 rounded-xl border border-gray-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold"
                  >
                    Save Weighment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Document Modal */}
        {showDocModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-gray-200 shadow-2xl space-y-4">
              <h3 className="text-lg font-extrabold text-gray-900">Upload Exchange Document</h3>
              <form onSubmit={handleUploadDoc} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Document Type</label>
                  <select
                    value={docForm.docType}
                    onChange={(e) => setDocForm({ ...docForm, docType: e.target.value, name: `${e.target.value} File` })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 font-medium bg-white"
                  >
                    <option value="Material Quality Report">Material Quality Report</option>
                    <option value="Weighment Slip">Weighment Slip</option>
                    <option value="Invoice">Invoice</option>
                    <option value="Transport Document">Transport Document</option>
                    <option value="Recycling Certificate">Recycling Certificate</option>
                    <option value="Delivery Proof">Delivery Proof</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Document Name</label>
                  <input
                    type="text"
                    value={docForm.name}
                    onChange={(e) => setDocForm({ ...docForm, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Audit Notes</label>
                  <textarea
                    rows={2}
                    value={docForm.notes}
                    onChange={(e) => setDocForm({ ...docForm, notes: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 font-medium"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowDocModal(false)}
                    className="px-4 py-2 rounded-xl border border-gray-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold"
                  >
                    Upload Document
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Rating Modal */}
        {showRatingModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-gray-200 shadow-2xl space-y-4">
              <h3 className="text-lg font-extrabold text-gray-900">Rate Exchange Partner</h3>
              <form onSubmit={handleSubmitRating} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Material Quality Rating (1–5 ⭐)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={ratingForm.materialQuality}
                    onChange={(e) => setRatingForm({ ...ratingForm, materialQuality: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Overall Trust Rating (1–5 ⭐)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={ratingForm.overall}
                    onChange={(e) => setRatingForm({ ...ratingForm, overall: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Partner Review Comments</label>
                  <textarea
                    rows={3}
                    value={ratingForm.comment}
                    onChange={(e) => setRatingForm({ ...ratingForm, comment: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-300 font-medium"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowRatingModal(false)}
                    className="px-4 py-2 rounded-xl border border-gray-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-500 text-white font-bold"
                  >
                    Submit Rating
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
