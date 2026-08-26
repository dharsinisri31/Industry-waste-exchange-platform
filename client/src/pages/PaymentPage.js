import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API from '../services/authAPI';
import DashboardLayout from '../layouts/DashboardLayout';
import Loader from '../components/Loader';
import InvoiceModal from '../components/InvoiceModal';
import { generateInvoicePDF } from '../utils/invoiceGenerator';
import { formatINR } from '../utils/formatINR';
import { 
  FiDollarSign, FiShield, FiCheckCircle, FiAlertCircle, 
  FiTruck, FiArrowRight, FiFileText, FiRefreshCw, 
  FiCreditCard, FiSmartphone, FiGlobe, FiLock, FiDownload, FiCheck 
} from 'react-icons/fi';

export default function PaymentPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Payment form state
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // 'UPI' | 'Credit/Debit Card' | 'Net Banking'
  const [upiOption, setUpiOption] = useState('Google Pay');
  const [upiId, setUpiId] = useState('buyer.industry@okhdfcbank');
  
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '4532 •••• •••• 8842',
    cardHolder: 'Industrial Procurement Corp',
    expiry: '08/29',
    cvv: '884'
  });

  const [bankName, setBankName] = useState('State Bank of India');

  // Invoice modal
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await API.get(`/payments/order/${orderId}`);
      if (res.data && res.data.order) {
        setOrder(res.data.order);
        // If already paid:
        const status = (res.data.order.paymentStatus || '').toLowerCase();
        if (status === 'paid' || status === 'confirmed') {
          setPaymentResult({
            success: true,
            message: 'This order is already paid.',
            transactionId: res.data.order.transactionId || 'TXN-ECOLINK-CONFIRMED',
            invoiceNumber: res.data.order.invoiceNumber
          });
        }
      }
    } catch (err) {
      console.warn('Failed to load order payment info:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Unable to retrieve order details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) fetchOrderDetails();
  }, [orderId]);

  const handleSimulatePayment = async (simulationResult = 'success') => {
    try {
      setSubmitting(true);
      setErrorMsg('');

      let methodDetails = {};
      if (paymentMethod === 'UPI') {
        methodDetails = { upiId: `${upiId} (${upiOption})` };
      } else if (paymentMethod === 'Credit/Debit Card') {
        methodDetails = {
          cardLast4: '8842',
          cardBrand: 'Visa Business',
          cardHolder: cardDetails.cardHolder
        };
      } else if (paymentMethod === 'Net Banking') {
        methodDetails = { bankName };
      }

      if (simulationResult === 'failure') {
        methodDetails.failureReason = 'Simulated testing decline: Insufficient prototype balance or network timeout.';
      }

      const res = await API.post('/payments/simulate', {
        orderId: order?.exchangeId || orderId,
        paymentMethod,
        simulationResult,
        methodDetails
      });

      if (simulationResult === 'success') {
        setPaymentResult({
          success: true,
          message: 'Payment Simulated Successfully!',
          transactionId: res.data.transactionId,
          invoiceNumber: res.data.invoiceNumber,
          payment: res.data.payment,
          order: res.data.order
        });
        setOrder(prev => ({
          ...prev,
          paymentStatus: 'Paid',
          orderStatus: 'Payment Confirmed',
          transactionId: res.data.transactionId,
          invoiceNumber: res.data.invoiceNumber
        }));
      } else {
        setPaymentResult({
          success: false,
          message: 'Simulated payment declined for testing verification.',
          payment: res.data.payment
        });
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Payment simulation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Loader />
      </DashboardLayout>
    );
  }

  if (errorMsg && !order) {
    return (
      <DashboardLayout>
        <div className="max-w-xl mx-auto p-8 bg-white rounded-3xl border border-red-200 text-center space-y-4 font-sans my-12">
          <FiAlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-lg font-black text-gray-900">Payment Authorization Notice</h2>
          <p className="text-xs text-gray-600 font-medium">{errorMsg}</p>
          <div className="pt-2">
            <Link
              to="/dashboard"
              className="px-5 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl inline-block hover:bg-emerald-700 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const wasteSubtotal = order?.wasteCost || (order?.unitPrice * order?.quantity) || 0;
  const transportCost = order?.transportCost || 0;
  const totalAmount = order?.totalAmount || (wasteSubtotal + transportCost);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 font-sans">
        
        {/* Page Header */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                Simulated Escrow Settlement
              </span>
              <span className="text-xs font-mono font-bold text-gray-500">
                Order #{order?.exchangeId || orderId}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              {paymentResult?.success ? 'Payment Confirmed' : 'Checkout & Simulated Payment'}
            </h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Secure dummy transaction gateway for circular industrial materials.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/exchange/${order?.exchangeId || orderId}`}
              className="px-4 py-2 bg-gray-50 border border-gray-200 text-gray-700 font-bold rounded-xl text-xs hover:bg-gray-100 transition-colors"
            >
              View Order Details
            </Link>
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs font-bold flex items-center gap-2">
            <FiAlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* SUCCESS VIEW SCREEN */}
        {paymentResult?.success ? (
          <div className="bg-white rounded-3xl border border-emerald-200 shadow-sm p-6 sm:p-8 space-y-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center border-2 border-emerald-300">
              <FiCheck className="w-8 h-8 stroke-[3]" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                Payment Simulated Successfully!
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                The industrial escrow funds have been successfully recorded and the seller has been notified.
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="max-w-lg mx-auto bg-gray-50 rounded-2xl border border-gray-200 p-5 text-left space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <span className="text-gray-500 font-medium">Transaction ID</span>
                <span className="font-mono font-extrabold text-emerald-800 text-sm">
                  {paymentResult.transactionId || order?.transactionId}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Invoice Reference</span>
                <span className="font-bold text-gray-800">
                  {paymentResult.invoiceNumber || order?.invoiceNumber || 'INV-2026-PENDING'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Material Stream</span>
                <span className="font-bold text-gray-900">{order?.waste?.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Seller / Producer</span>
                <span className="font-bold text-gray-900">{order?.seller?.companyName || order?.seller?.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Quantity</span>
                <span className="font-bold text-gray-900">{order?.quantity} {order?.unit || 'kg'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Settled Amount</span>
                <span className="font-black text-emerald-800 text-sm">{formatINR(totalAmount)}</span>
              </div>
            </div>

            {/* Next Steps Quick Navigation */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowInvoiceModal(true)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition-all flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <FiFileText className="w-4 h-4" /> View Invoice
              </button>

              <button
                onClick={() => generateInvoicePDF(order, paymentResult.payment || null)}
                className="px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-800 font-extrabold text-xs rounded-xl border border-gray-300 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <FiDownload className="w-4 h-4" /> Download PDF
              </button>

              <Link
                to={`/exchange/${order?.exchangeId || orderId}`}
                className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-extrabold text-xs rounded-xl transition-all flex items-center gap-2 shadow-xs"
              >
                <FiTruck className="w-4 h-4" /> Track Order Status &rarr;
              </Link>
            </div>
          </div>
        ) : (
          /* PAYMENT CHECKOUT FORM */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Cols: Payment Methods */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Method Selector */}
              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <h2 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                    <FiLock className="w-4 h-4 text-emerald-600" />
                    Select Simulated Payment Method
                  </h2>
                  <span className="text-[11px] font-bold text-gray-400">100% Simulated Flow</span>
                </div>

                {/* Tabs */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'UPI', label: 'UPI / QR', icon: FiSmartphone },
                    { id: 'Credit/Debit Card', label: 'Cards', icon: FiCreditCard },
                    { id: 'Net Banking', label: 'Net Banking', icon: FiGlobe }
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSelected = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id)}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20 text-emerald-950 font-extrabold'
                            : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-emerald-700' : 'text-gray-400'}`} />
                        <span className="text-xs">{m.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Sub-Form for Selected Method */}
                <div className="pt-4 border-t border-gray-100">
                  {paymentMethod === 'UPI' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-extrabold text-gray-700 uppercase mb-1.5">
                          Select Simulated UPI App
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {['Google Pay', 'PhonePe', 'Paytm'].map((app) => (
                            <button
                              key={app}
                              type="button"
                              onClick={() => setUpiOption(app)}
                              className={`py-2 px-3 text-xs rounded-xl font-bold border transition-colors cursor-pointer text-center ${
                                upiOption === app
                                  ? 'bg-emerald-600 text-white border-emerald-600'
                                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {app}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-extrabold text-gray-700 uppercase mb-1">
                          Simulated VPA / UPI ID
                        </label>
                        <input
                          type="text"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-semibold text-gray-900 focus:outline-emerald-500"
                          placeholder="username@upi"
                        />
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'Credit/Debit Card' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-extrabold text-gray-700 uppercase mb-1">
                          Card Number (Simulated)
                        </label>
                        <input
                          type="text"
                          value={cardDetails.cardNumber}
                          onChange={(e) => setCardDetails({ ...cardDetails, cardNumber: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-semibold text-gray-900 focus:outline-emerald-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-extrabold text-gray-700 uppercase mb-1">
                            Expiry Date
                          </label>
                          <input
                            type="text"
                            value={cardDetails.expiry}
                            onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-semibold text-gray-900 focus:outline-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-extrabold text-gray-700 uppercase mb-1">
                            CVV / CVC
                          </label>
                          <input
                            type="password"
                            value={cardDetails.cvv}
                            onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-semibold text-gray-900 focus:outline-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'Net Banking' && (
                    <div className="space-y-2">
                      <label className="block text-[11px] font-extrabold text-gray-700 uppercase mb-1">
                        Select Commercial Bank
                      </label>
                      <select
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-emerald-500 cursor-pointer"
                      >
                        <option value="State Bank of India">State Bank of India (Corporate)</option>
                        <option value="HDFC Bank">HDFC Bank Industrial Banking</option>
                        <option value="ICICI Bank">ICICI Bank Corporate Gateway</option>
                        <option value="Axis Bank">Axis Bank Commercial</option>
                        <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Simulation Action Buttons */}
                <div className="pt-6 border-t border-gray-100 space-y-3">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleSimulatePayment('success')}
                    className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? (
                      <span>Simulating Escrow Settlement...</span>
                    ) : (
                      <>
                        <FiCheckCircle className="w-4 h-4" />
                        <span>Simulate Successful Payment ({formatINR(totalAmount)})</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleSimulatePayment('failure')}
                    className="w-full py-2.5 px-4 bg-white hover:bg-red-50 text-red-700 font-bold text-xs rounded-2xl border border-red-200 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>Simulate Failed Payment (Test Error Handling)</span>
                  </button>

                  <p className="text-[10px] text-gray-400 text-center font-medium">
                    Simulated proof-of-concept transaction &bull; No real money or bank authorization involved.
                  </p>
                </div>
              </div>
            </div>

            {/* Right 1 Col: Order Summary Breakdown */}
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-2xs space-y-4">
                <h3 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider pb-2 border-b border-gray-100">
                  Order Summary
                </h3>

                {/* Material Item Card */}
                <div className="space-y-2 text-xs">
                  <div className="font-extrabold text-gray-900 text-sm">
                    {order?.waste?.name}
                  </div>
                  <div className="flex justify-between text-gray-500 text-[11px]">
                    <span>Category:</span>
                    <span className="font-bold text-gray-800">{order?.waste?.category}</span>
                  </div>
                  <div className="flex justify-between text-gray-500 text-[11px]">
                    <span>Seller / Producer:</span>
                    <span className="font-bold text-gray-800">{order?.seller?.companyName || order?.seller?.name}</span>
                  </div>
                  <div className="flex justify-between text-gray-500 text-[11px]">
                    <span>Quantity:</span>
                    <span className="font-bold text-gray-800">{order?.quantity} {order?.unit || 'kg'}</span>
                  </div>
                  <div className="flex justify-between text-gray-500 text-[11px]">
                    <span>Price per Unit:</span>
                    <span className="font-bold text-gray-800">{formatINR(order?.unitPrice || 0)}</span>
                  </div>
                </div>

                {/* Financial Math */}
                <div className="pt-3 border-t border-gray-100 space-y-2 text-xs">
                  <div className="flex justify-between text-gray-600 font-medium">
                    <span>Waste Material Subtotal:</span>
                    <span>{formatINR(wasteSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 font-medium">
                    <span>Transportation ({order?.distanceKm || 45} km):</span>
                    <span>{formatINR(transportCost)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 font-medium">
                    <span>Platform Fee:</span>
                    <span className="text-emerald-800 font-bold">₹0.00 (Zero Fee)</span>
                  </div>
                  <div className="pt-2 border-t border-gray-200 flex justify-between text-sm font-black text-gray-900">
                    <span>Total Amount:</span>
                    <span className="text-base font-black text-emerald-800">{formatINR(totalAmount)}</span>
                  </div>
                </div>

                {/* Safety Guarantee */}
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-[11px] text-gray-600 flex items-start gap-2">
                  <FiShield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Funds are protected in simulated escrow until digital weighment and custody transfer are verified.</span>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Invoice View Modal */}
      {showInvoiceModal && (
        <InvoiceModal
          order={order}
          isOpen={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
        />
      )}
    </DashboardLayout>
  );
}
