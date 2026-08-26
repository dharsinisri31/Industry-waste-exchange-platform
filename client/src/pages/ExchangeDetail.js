import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API from '../services/authAPI';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Loader from '../components/Loader';
import { formatINR } from '../utils/formatINR';
import OrderTracker from '../components/OrderTracker';
import InvoiceModal from '../components/InvoiceModal';
import ReviewModal from '../components/ReviewModal';
import DisputeModal from '../components/DisputeModal';
import { 
  FiTrendingUp, FiCheckCircle, FiTruck, FiDollarSign, 
  FiFileText, FiStar, FiAward, FiShield, FiClock, 
  FiMapPin, FiLayers, FiAlertTriangle, FiUpload, FiRefreshCw,
  FiUser, FiArrowLeft, FiEye, FiDownload, FiCheck, FiInfo
} from 'react-icons/fi';

export default function ExchangeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile, activeRole } = useAuth();
  
  const [exchange, setExchange] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState('');

  // Modals state
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showNewReviewModal, setShowNewReviewModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);

  const [showWeighmentModal, setShowWeighmentModal] = useState(false);
  const [weighmentForm, setWeighmentForm] = useState({
    sellerDeclaredWeight: '',
    pickupWeight: '',
    receivedWeight: '',
    processedWeight: ''
  });

  const [showDocModal, setShowDocModal] = useState(false);
  const [docForm, setDocForm] = useState({
    name: '',
    docType: 'Quality Report',
    notes: ''
  });
  const [docFile, setDocFile] = useState(null);

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingForm, setRatingForm] = useState({
    materialQuality: 5,
    quantityAccuracy: 5,
    communication: 5,
    deliveryReliability: 5,
    overall: 5,
    comment: ''
  });

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 5000);
  };

  const fetchExchange = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await API.get(`/traceability/exchanges/${id}`);
      if (res.data && res.data.exchange) {
        const ex = res.data.exchange;
        setExchange(ex);
        
        // Populate weighment form from real data or leave blank for user entry
        setWeighmentForm({
          sellerDeclaredWeight: ex.weighment?.sellerDeclaredWeight || ex.quantity || '',
          pickupWeight: ex.weighment?.pickupWeight || '',
          receivedWeight: ex.weighment?.receivedWeight || '',
          processedWeight: ex.weighment?.processedWeight || ''
        });
      }
    } catch (err) {
      console.warn('Failed to load exchange:', err.message);
      if (err.response?.status === 403) {
        setErrorMsg('Forbidden: You do not have authorization to view this exchange.');
      } else if (err.response?.status === 404) {
        setErrorMsg(`Exchange #${id} not found.`);
      } else {
        setErrorMsg(err.response?.data?.message || 'Failed to retrieve exchange details.');
      }
      setExchange(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchExchange();
    }
  }, [id]);

  const handleConfirmPayment = async () => {
    try {
      setActionLoading(true);
      await API.post(`/traceability/exchanges/${id}/payment/confirm`, {});
      showNotification('Simulated Escrow Payment confirmed successfully!');
      fetchExchange();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Payment confirmation failed.');
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
      alert(err.response?.data?.message || err.message || 'Logistics update failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordWeighment = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await API.post(`/traceability/exchanges/${id}/weighment`, {
        sellerDeclaredWeight: Number(weighmentForm.sellerDeclaredWeight) || exchange.quantity,
        pickupWeight: Number(weighmentForm.pickupWeight) || 0,
        receivedWeight: Number(weighmentForm.receivedWeight) || 0,
        processedWeight: Number(weighmentForm.processedWeight) || 0
      });
      showNotification('Digital weighment recorded successfully.');
      setShowWeighmentModal(false);
      fetchExchange();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Weighment recording failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUploadDoc = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const formData = new FormData();
      formData.append('exchangeId', exchange?.exchangeId || id);
      formData.append('docType', docForm.docType);
      formData.append('notes', docForm.notes);
      if (docFile) {
        formData.append('document', docFile);
      } else {
        formData.append('name', docForm.name || `${docForm.docType}_${Date.now()}.pdf`);
      }

      await API.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      showNotification('Document attached to exchange successfully.');
      setShowDocModal(false);
      setDocFile(null);
      setDocForm({ name: '', docType: 'Quality Report', notes: '' });
      fetchExchange();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Document upload failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmRecycling = async () => {
    try {
      setActionLoading(true);
      const processedQty = Number(weighmentForm.processedWeight) || exchange?.quantity || 1000;
      await API.post(`/traceability/exchanges/${id}/recycle-confirm`, {
        processedWeightKg: processedQty,
        recycledProduct: 'Secondary High-Grade Feedstock'
      });
      showNotification('Circular recycling confirmed and ESG avoidance metrics settled!');
      fetchExchange();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Recycling confirmation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitRating = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await API.post(`/traceability/exchanges/${id}/rate`, {
        role: isUserBuyer ? 'buyer' : 'seller',
        ...ratingForm
      });
      showNotification('Partner trust rating submitted successfully.');
      setShowRatingModal(false);
      fetchExchange();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Rating submission failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Determine user's role in this specific exchange
  const isUserBuyer = exchange?.buyer?._id === user?._id || exchange?.buyer === user?._id || exchange?.isCurrentUserBuyer;
  const isUserSeller = exchange?.seller?._id === user?._id || exchange?.seller === user?._id || exchange?.isCurrentUserSeller;
  const isAdmin = user?.role === 'admin' || (user?.roles && user.roles.includes('admin'));

  const userRoleInExchange = isUserBuyer ? 'Buyer' : (isUserSeller ? 'Seller' : 'Admin');
  const partnerRoleInExchange = isUserBuyer ? 'Seller' : 'Buyer';
  
  const partnerCompanyName = isUserBuyer 
    ? (exchange?.sellerIndustry?.companyName || exchange?.seller?.companyName || exchange?.seller?.name || 'Seller Facility')
    : (exchange?.buyerIndustry?.companyName || exchange?.buyer?.companyName || exchange?.buyer?.name || 'Buyer Facility');

  const myCompanyName = isUserBuyer
    ? (exchange?.buyerIndustry?.companyName || profile?.companyName || user?.name || 'Your Buyer Facility')
    : (exchange?.sellerIndustry?.companyName || profile?.companyName || user?.name || 'Your Seller Facility');

  const isCompleted = (exchange?.status || '').toLowerCase() === 'completed' || (exchange?.orderStatus || '').toLowerCase() === 'completed';
  const hasWeighmentData = exchange?.weighment && (exchange.weighment.pickupWeight > 0 || exchange.weighment.receivedWeight > 0 || exchange.weighment.sellerDeclaredWeight > 0);

  return (
    <div className="min-h-screen bg-[#f8faf9] flex flex-col font-sans text-gray-900">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 w-full">
        
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <Link
            to="/traceability"
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-800 hover:text-emerald-900 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-2xs transition"
          >
            <FiArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Exchanges</span>
          </Link>

          <button
            onClick={fetchExchange}
            className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition shadow-2xs cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            title="Refresh"
          >
            <FiRefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-2xs">
            <FiCheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {loading ? (
          <div className="py-24 flex justify-center">
            <Loader />
          </div>
        ) : errorMsg ? (
          /* ========================================================================= */
          /* ERROR / UNAUTHORIZED STATE                                                */
          /* ========================================================================= */
          <div className="bg-white rounded-3xl border border-red-200 p-12 text-center space-y-4 shadow-sm max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-700 flex items-center justify-center mx-auto border border-red-100">
              <FiAlertTriangle className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-black text-gray-900">Access Restricted</h2>
              <p className="text-xs text-gray-600 font-medium">{errorMsg}</p>
            </div>
            <Link
              to="/traceability"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-xs transition"
            >
              Return to My Exchanges
            </Link>
          </div>
        ) : exchange ? (
          /* ========================================================================= */
          /* REAL EXCHANGE DETAILS                                                     */
          /* ========================================================================= */
          <div className="space-y-6">
            
            {/* Header Card */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-extrabold uppercase tracking-wider mb-2">
                  <FiTrendingUp className="w-3.5 h-3.5" />
                  <span>Exchange Order Hub</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                  Exchange #{exchange.exchangeId || exchange.orderId || id}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
                  Batch: <strong className="text-emerald-800 font-mono">{exchange.batchId || 'EL-BATCH-001'}</strong> &bull; Created {new Date(exchange.createdAt || Date.now()).toLocaleDateString('en-IN')}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
                <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-xs">
                  <span className="text-[10px] font-bold text-gray-500 uppercase block">Your Authenticated Role:</span>
                  <strong className="text-emerald-900 font-extrabold">{userRoleInExchange}</strong>
                </div>

                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 text-xs">
                  <span className="text-[10px] font-bold text-gray-500 uppercase block">{partnerRoleInExchange} Partner:</span>
                  <strong className="text-gray-900 font-extrabold">{partnerCompanyName}</strong>
                </div>
              </div>
            </div>

            {/* Interactive Lifecycle Progress Stepper */}
            <OrderTracker
              order={exchange}
              onStatusUpdated={fetchExchange}
              onOpenReviewModal={() => setShowNewReviewModal(true)}
              onOpenDisputeModal={() => setShowDisputeModal(true)}
              onOpenInvoiceModal={() => setShowInvoiceModal(true)}
            />

            {/* Quick Action Control Bar */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase text-gray-500">Current Status:</span>
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 uppercase">
                    {exchange.orderStatus || exchange.status}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                    Payment: {exchange.paymentStatus || 'Pending'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Payment Action for Buyer */}
                {(isUserBuyer || isAdmin) && (exchange.paymentStatus || '').toLowerCase() !== 'paid' && (
                  <button
                    onClick={handleConfirmPayment}
                    disabled={actionLoading}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <FiDollarSign className="w-3.5 h-3.5" />
                    <span>Confirm Simulated Escrow Payment</span>
                  </button>
                )}

                {/* Logistics Action for Seller */}
                {(isUserSeller || isAdmin) && exchange.logistics?.status === 'Scheduled' && (
                  <button
                    onClick={() => handleLogisticsStatus('In Transit')}
                    disabled={actionLoading}
                    className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <FiTruck className="w-3.5 h-3.5" />
                    <span>Dispatch Freight (Mark In Transit)</span>
                  </button>
                )}

                {/* Delivery Arrival */}
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

                {/* Log Weighment */}
                <button
                  onClick={() => setShowWeighmentModal(true)}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 text-xs font-bold shadow-2xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  <FiLayers className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Log Weighment</span>
                </button>

                {/* Upload Document */}
                <button
                  onClick={() => setShowDocModal(true)}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 text-xs font-bold shadow-2xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  <FiUpload className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Upload Document</span>
                </button>

                {/* Confirm Recycling Transformation */}
                {!isCompleted && (
                  <button
                    onClick={handleConfirmRecycling}
                    disabled={actionLoading}
                    className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <FiAward className="w-3.5 h-3.5" />
                    <span>Confirm Recycling Completion</span>
                  </button>
                )}

                {/* Rate Partner (Only if Completed) */}
                {isCompleted && (
                  <button
                    onClick={() => setShowRatingModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <FiStar className="w-3.5 h-3.5" />
                    <span>Rate Partner</span>
                  </button>
                )}
              </div>
            </div>

            {/* Main Content 2-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Material, Payment, Timeline */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* 1. Material & Transaction Specifications */}
                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
                  <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                    <FiLayers className="text-emerald-600" />
                    <span>Exchange Material Specifications</span>
                  </h2>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-gray-500">Material Name</span>
                      <div className="font-extrabold text-gray-900">{exchange.waste?.name || 'Secondary Material'}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-gray-500">Agreed Quantity</span>
                      <div className="font-mono font-bold text-gray-900">{exchange.quantity} {exchange.unit || 'kg'}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-gray-500">Total Settlement</span>
                      <div className="font-mono font-bold text-emerald-800">{formatINR(exchange.totalPrice)}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-gray-500">Agreed Unit Price</span>
                      <div className="font-extrabold text-teal-800">{formatINR(exchange.unitPrice || (exchange.totalPrice / (exchange.quantity || 1)))}/{exchange.unit || 'kg'}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-gray-600">Material Source (Generator Plant):</span>
                      <p className="font-extrabold text-gray-900">{exchange.sellerIndustry?.address || exchange.waste?.address || 'Seller Production Facility'}, {exchange.sellerIndustry?.city || exchange.waste?.city || 'Regional'}</p>
                    </div>
                    <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-200 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-gray-600">Delivery Destination (Buyer Consignee):</span>
                      <p className="font-extrabold text-gray-900">{exchange.buyerIndustry?.address || 'Buyer Industrial Plant'}, {exchange.buyerIndustry?.city || 'Regional'}</p>
                    </div>
                  </div>
                </div>

                {/* 2. Chain of Custody Timeline (Only actual database events) */}
                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-5">
                  <div className="pb-2 border-b border-gray-100">
                    <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                      <FiClock className="text-emerald-600" />
                      <span>Chain of Custody Recorded Events</span>
                    </h2>
                    <p className="text-xs text-gray-500 font-medium">Verified milestone log generated specifically for Exchange #{exchange.exchangeId || id}.</p>
                  </div>

                  {(!exchange.timeline || exchange.timeline.length === 0) ? (
                    <div className="p-4 bg-gray-50 rounded-xl text-center text-xs text-gray-500">
                      No timeline events recorded yet.
                    </div>
                  ) : (
                    <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-200">
                      {exchange.timeline.map((step, idx) => (
                        <div key={idx} className="relative">
                          <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-emerald-600 border-4 border-white shadow-xs flex items-center justify-center text-white"></div>
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-2 flex-wrap">
                              <strong className="text-gray-900 font-extrabold">{step.title}</strong>
                              <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                                {new Date(step.timestamp).toLocaleString('en-IN')}
                              </span>
                            </div>
                            <p className="text-gray-600 font-medium">{step.description}</p>
                            {step.actor && (
                              <span className="text-[11px] text-gray-400 block">Actor: {step.actor}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Exchange Compliance & Verification Documents */}
                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                      <FiFileText className="text-emerald-600" />
                      <span>Exchange Compliance & Verification Documents</span>
                    </h2>
                    <button
                      onClick={() => setShowDocModal(true)}
                      className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <FiUpload className="w-3.5 h-3.5" /> Upload File
                    </button>
                  </div>

                  {(!exchange.documents || exchange.documents.length === 0) ? (
                    <div className="p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-300 text-center space-y-2">
                      <FiFileText className="w-8 h-8 text-gray-400 mx-auto" />
                      <strong className="text-xs text-gray-800 block">No compliance documents uploaded yet</strong>
                      <p className="text-[11px] text-gray-500">Upload statutory invoices, weighbridge scale slips, or quality certificates for this exchange.</p>
                      <button
                        onClick={() => setShowDocModal(true)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-2xs mt-2"
                      >
                        Upload First Document
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {exchange.documents.map((doc, i) => (
                        <div key={doc._id || i} className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2 text-xs flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start">
                              <span className="font-extrabold text-gray-900 text-xs">{doc.docType || 'Document'}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                {doc.status || 'Uploaded'}
                              </span>
                            </div>
                            <p className="text-gray-600 font-medium text-[11px] truncate mt-1">{doc.name}</p>
                            <span className="text-[10px] text-gray-400 block mt-0.5">
                              Uploaded {new Date(doc.uploadedAt).toLocaleDateString('en-IN')} by {doc.uploaderName || 'Company'}
                            </span>
                          </div>

                          <div className="pt-2 border-t border-gray-200 flex justify-end">
                            <a
                              href={doc.url || '/uploads/sample_manifest.pdf'}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 rounded-lg text-[11px] font-bold flex items-center gap-1"
                            >
                              <FiEye className="w-3 h-3" /> View Document
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Right Column: Freight, Weighment, ESG, Partner Rating */}
              <div className="space-y-6">
                
                {/* 1. Freight & Haulage Card */}
                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-3 text-xs">
                  <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-100">
                    <FiTruck className="text-teal-700 w-4 h-4" />
                    <span>Freight & Logistics</span>
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Logistics Status:</span>
                      <strong className="text-emerald-800">{exchange.logistics?.status || 'Scheduled'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Carrier Vehicle:</span>
                      <span className="font-mono font-bold">{exchange.logistics?.vehicleNumber || 'Carrier vehicle pending'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Driver Phone:</span>
                      <span>{exchange.logistics?.driverPhone || 'Assignment in progress'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Transit Distance:</span>
                      <span>{exchange.distanceKm ? `${exchange.distanceKm} km` : 'Route being planned'}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Digital Weighment Scale Ledger */}
                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-3 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                      <FiLayers className="text-emerald-700 w-4 h-4" />
                      <span>Digital Weighment Ledger</span>
                    </h3>
                    <button
                      onClick={() => setShowWeighmentModal(true)}
                      className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                    >
                      Update
                    </button>
                  </div>

                  {!hasWeighmentData ? (
                    <div className="p-4 bg-gray-50 rounded-xl text-center text-gray-500 space-y-1">
                      <p className="font-medium">Weight information not yet recorded.</p>
                      <span className="text-[10px] text-gray-400">Record weighbridge scale slips upon pickup or receipt.</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Seller Declared:</span>
                        <strong>{exchange.weighment?.sellerDeclaredWeight || exchange.quantity} kg</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Pickup Scale:</span>
                        <span>{exchange.weighment?.pickupWeight ? `${exchange.weighment.pickupWeight} kg` : 'Pending pickup'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Received Scale:</span>
                        <span>{exchange.weighment?.receivedWeight ? `${exchange.weighment.receivedWeight} kg` : 'Pending arrival'}</span>
                      </div>
                      {exchange.weighment?.variancePercent !== undefined && exchange.weighment.variancePercent > 0 && (
                        <div className="flex justify-between pt-1 border-t border-gray-100">
                          <span className="text-gray-500">Variance:</span>
                          <span className="font-bold text-emerald-700">{exchange.weighment.variancePercent}% ({exchange.weighment.varianceStatus || 'Normal'})</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. Sustainability & Carbon Offset Ledger */}
                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-3 text-xs">
                  <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-100">
                    <FiAward className="text-emerald-700 w-4 h-4" />
                    <span>Sustainability Ledger</span>
                  </h3>

                  {!isCompleted ? (
                    <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 text-center text-emerald-950 space-y-1">
                      <p className="font-bold text-xs">CO₂ impact will be calculated after exchange completion.</p>
                      <span className="text-[10px] text-gray-500">Estimated Avoidance: ~{Math.round((exchange.quantity || 100) * 1.85)} kg CO₂e</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Waste Diverted:</span>
                        <strong className="text-emerald-800">{exchange.quantity} {exchange.unit || 'kg'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Net Avoided CO₂:</span>
                        <strong className="text-teal-800">{exchange.carbonSavedKg || Math.round((exchange.quantity || 100) * 1.85)} kg CO₂e</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Virgin Raw Saved:</span>
                        <strong className="text-emerald-900">{Math.round((exchange.quantity || 100) * 0.85)} kg</strong>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Mutual Partner Trust Rating */}
                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-3 text-xs">
                  <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-100">
                    <FiStar className="text-amber-500 w-4 h-4" />
                    <span>Mutual Partner Trust Rating</span>
                  </h3>

                  {!isCompleted ? (
                    <div className="p-4 bg-gray-50 rounded-xl text-center text-gray-500 space-y-1">
                      <p className="font-medium">Rating available after exchange completion.</p>
                      <span className="text-[10px] text-gray-400">Both Buyer and Seller can submit verified ratings once delivery is finalized.</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {exchange.ratings?.sellerRating?.overall ? (
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-1">
                          <div className="flex items-center gap-1 font-extrabold text-amber-900">
                            <FiStar className="w-3.5 h-3.5 fill-current" />
                            <span>Seller Rating: {exchange.ratings.sellerRating.overall}/5</span>
                          </div>
                          {exchange.ratings.sellerRating.comment && (
                            <p className="text-[11px] text-gray-600 italic">"{exchange.ratings.sellerRating.comment}"</p>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowRatingModal(true)}
                          className="w-full py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-extrabold rounded-xl text-xs transition"
                        >
                          Submit Partner Rating
                        </button>
                      )}
                    </div>
                  )}
                </div>

              </div>

            </div>

          </div>
        ) : null}

        {/* ========================================================================= */}
        {/* WEIGHMENT MODAL                                                           */}
        {/* ========================================================================= */}
        {showWeighmentModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-200 space-y-4">
              <h3 className="text-base font-extrabold text-gray-900">Record Digital Weighment</h3>
              <form onSubmit={handleRecordWeighment} className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-gray-700 uppercase">Declared Weight (kg)</label>
                  <input
                    type="number"
                    value={weighmentForm.sellerDeclaredWeight}
                    onChange={(e) => setWeighmentForm({ ...weighmentForm, sellerDeclaredWeight: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-700 uppercase">Pickup Weighbridge (kg)</label>
                  <input
                    type="number"
                    value={weighmentForm.pickupWeight}
                    onChange={(e) => setWeighmentForm({ ...weighmentForm, pickupWeight: e.target.value })}
                    placeholder="e.g. 4980"
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-700 uppercase">Received Weighbridge (kg)</label>
                  <input
                    type="number"
                    value={weighmentForm.receivedWeight}
                    onChange={(e) => setWeighmentForm({ ...weighmentForm, receivedWeight: e.target.value })}
                    placeholder="e.g. 4970"
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowWeighmentModal(false)}
                    className="flex-1 py-2.5 border border-gray-300 rounded-xl font-bold text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl"
                  >
                    Save Weighment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* DOCUMENT UPLOAD MODAL                                                     */}
        {/* ========================================================================= */}
        {showDocModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-200 space-y-4">
              <h3 className="text-base font-extrabold text-gray-900">Upload Exchange Document</h3>
              <form onSubmit={handleUploadDoc} className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-gray-700 uppercase">Document Category</label>
                  <select
                    value={docForm.docType}
                    onChange={(e) => setDocForm({ ...docForm, docType: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl font-bold"
                  >
                    <option value="Quality Report">Quality Report</option>
                    <option value="Invoice">Invoice</option>
                    <option value="Transport Document">Transport Document</option>
                    <option value="Weighment Slip">Weighment Slip</option>
                    <option value="Delivery Proof">Delivery Proof</option>
                    <option value="Recycling Certificate">Recycling Certificate</option>
                    <option value="Compliance Document">Compliance Document</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-700 uppercase">Document Name (Optional)</label>
                  <input
                    type="text"
                    value={docForm.name}
                    onChange={(e) => setDocForm({ ...docForm, name: e.target.value })}
                    placeholder="e.g. Lab Assay Report 2026"
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-700 uppercase">Select File (PDF, Images, etc.)</label>
                  <input
                    type="file"
                    onChange={(e) => setDocFile(e.target.files[0])}
                    className="w-full p-2 bg-gray-50 border border-gray-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-700 uppercase">Notes</label>
                  <textarea
                    rows={2}
                    value={docForm.notes}
                    onChange={(e) => setDocForm({ ...docForm, notes: e.target.value })}
                    placeholder="Assay or compliance certification notes"
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDocModal(false)}
                    className="flex-1 py-2.5 border border-gray-300 rounded-xl font-bold text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl"
                  >
                    Upload
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* RATING MODAL                                                              */}
        {/* ========================================================================= */}
        {showRatingModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-200 space-y-4">
              <h3 className="text-base font-extrabold text-gray-900">Submit Partner Trust Rating</h3>
              <form onSubmit={handleSubmitRating} className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-gray-700 uppercase">Overall Rating (1 - 5 Stars)</label>
                  <select
                    value={ratingForm.overall}
                    onChange={(e) => setRatingForm({ ...ratingForm, overall: Number(e.target.value) })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl font-bold"
                  >
                    <option value={5}>5 Stars - Outstanding</option>
                    <option value={4}>4 Stars - Very Good</option>
                    <option value={3}>3 Stars - Satisfactory</option>
                    <option value={2}>2 Stars - Needs Improvement</option>
                    <option value={1}>1 Star - Poor</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-700 uppercase">Feedback Comment</label>
                  <textarea
                    rows={3}
                    value={ratingForm.comment}
                    onChange={(e) => setRatingForm({ ...ratingForm, comment: e.target.value })}
                    placeholder="Describe material quality, shipment punctuality, and communication..."
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRatingModal(false)}
                    className="flex-1 py-2.5 border border-gray-300 rounded-xl font-bold text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-xl"
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
