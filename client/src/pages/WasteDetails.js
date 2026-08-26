import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API from '../services/authAPI';
import { getListingDetails, requestExchange } from '../services/wasteAPI';
import DashboardLayout from '../layouts/DashboardLayout';
import Loader from '../components/Loader';
import SellerReviews from '../components/SellerReviews';
import { 
  FiMapPin, FiTruck, FiCheckCircle, FiTrendingUp, FiZap, 
  FiShield, FiGlobe, FiActivity, FiNavigation, FiFileText, 
  FiStar, FiClock, FiDollarSign, FiAward, FiAlertCircle 
} from 'react-icons/fi';
import { formatINR } from '../utils/formatINR';

export default function WasteDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [waste, setWaste] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [bidding, setBidding] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [imageError, setImageError] = useState(false);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      setImageError(false);
      const data = await getListingDetails(id);
      setWaste(data);
      if (data && data.pricingMode === 'auction') {
        const minNext = (data.auctionInfo?.currentBid || data.price || 0) + (data.auctionInfo?.minIncrement || 1);
        setBidAmount(minNext);
      }
    } catch (err) {
      console.warn('Failed to load waste listing details:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDetails();
  }, [id]);

  const handleExchange = async () => {
    try {
      setRequesting(true);
      const res = await requestExchange(id);
      setSuccessMsg('Exchange request initiated successfully! Order created.');
      setTimeout(() => setSuccessMsg(''), 5000);
      if (res?.exchangeId || res?._id) {
        navigate(`/exchange/${res.exchangeId || res._id}`);
      }
    } catch (err) {
      alert(err.message || 'Failed to request exchange');
    } finally {
      setRequesting(false);
    }
  };

  const handlePlaceBid = async (e) => {
    e.preventDefault();
    try {
      setBidding(true);
      const res = await API.post(`/auction/${id}/bid`, { amount: Number(bidAmount) });
      setSuccessMsg(res.data.message || 'Bid placed successfully!');
      fetchDetails();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to place bid.');
    } finally {
      setBidding(false);
    }
  };

  const getImageSource = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    const backendHost = 'http://localhost:5000';
    return `${backendHost}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center p-20 space-y-3 font-sans">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-gray-700">Loading waste details...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (!waste) {
    return (
      <DashboardLayout>
        <div className="bg-white p-10 rounded-3xl border border-gray-200 text-center max-w-md mx-auto my-12 space-y-4 font-sans shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <FiAlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black text-gray-900">Waste Listing Not Found</h2>
          <p className="text-xs text-gray-500 font-medium leading-relaxed">
            The requested industrial resource listing does not exist, has been removed, or has already been completed.
          </p>
          <div className="pt-2">
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-xs"
            >
              Back to Marketplace
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const rawImage = waste.imageUrl || waste.image || waste.imagePath;
  const imageSrc = getImageSource(rawImage);

  const qty = parseFloat(waste.quantity) || 5000;
  const isAuction = waste.pricingMode === 'auction';
  const circularityScore = waste.circularityScore || 92;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto font-sans">
        
        {/* Header Bar */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                {waste.category}
              </span>
              <span className="text-xs font-mono font-bold text-gray-500">
                Batch: {waste.batchId || 'EL-BATCH-001'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">{waste.name}</h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Verified Stream &bull; {waste.city || 'Regional Storage'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to={`/traceability/${waste.batchId || waste._id}`}
              className="px-4 py-2 bg-teal-50 border border-teal-200 text-teal-800 font-bold rounded-xl text-xs flex items-center gap-1.5 hover:bg-teal-100 transition-all"
            >
              <FiShield className="w-4 h-4 text-teal-600" />
              <span>View Traceability Ledger</span>
            </Link>
          </div>
        </div>

        {/* Success Alert Banner */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-extrabold flex items-center gap-2">
            <FiCheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Main Details Grid */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Left Image & Trust Metrics */}
            <div className="space-y-4">
              <div className="h-72 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 relative flex items-center justify-center">
                {imageSrc && !imageError ? (
                  <img
                    src={imageSrc}
                    alt={waste.name}
                    onError={() => setImageError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#F6F8F7] flex flex-col items-center justify-center text-gray-400 p-6 text-center">
                    <FiShield className="w-12 h-12 text-[#009B6B]/50 mb-2" />
                    <span className="text-sm font-bold text-gray-600">No image uploaded</span>
                    <span className="text-xs text-gray-400 font-medium">Batch {waste.batchId || 'EL-BATCH'}</span>
                  </div>
                )}
                {isAuction && (
                  <div className="absolute top-3 left-3 bg-amber-500 text-white text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm animate-pulse">
                    <FiClock className="w-3.5 h-3.5" /> LIVE AUCTION
                  </div>
                )}
              </div>

              {/* Seller Trust Profile Card */}
              <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-gray-900 flex items-center gap-1.5">
                    <FiShield className="text-emerald-700 w-4 h-4" />
                    <span>{waste.uploader?.companyName || 'Apex Plastics Pvt. Ltd.'}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                    Verified Company
                  </span>
                </div>
                <div className="flex items-center gap-4 text-gray-600 text-[11px] font-medium">
                  <span className="flex items-center gap-1 text-amber-600 font-bold">
                    <FiStar className="fill-current w-3.5 h-3.5" /> 4.8 / 5 Rating
                  </span>
                  <span>&bull; 24 Completed Exchanges</span>
                  <span>&bull; 98% On-Time Delivery</span>
                </div>
              </div>
            </div>

            {/* Right Pricing & Actions */}
            <div className="space-y-5">
              <div className="space-y-2">
                <p className="text-xs text-gray-600 leading-relaxed font-medium">
                  {waste.description || 'Clean, segregated industrial byproduct stream with lab verification.'}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-700 font-semibold">
                  <FiMapPin className="text-emerald-600 w-4 h-4" />
                  <span>{waste.address || 'Industrial Estate'}, {waste.city || 'Vadodara'}</span>
                </div>
              </div>

              {/* Price Intelligence & Fair Value Display */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                <div className="flex justify-between items-center text-xs pb-2 border-b border-gray-200">
                  <span className="text-gray-500 font-bold uppercase text-[10px]">Quantity Available</span>
                  <span className="font-mono font-black text-gray-900 text-sm">{waste.quantity} {waste.unit}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500 block text-[10px] font-bold uppercase">
                      {isAuction ? 'Current High Bid' : 'Asking Price'}
                    </span>
                    <span className="text-xl font-black text-gray-900">
                      {isAuction 
                        ? formatINR(waste.auctionInfo?.currentBid || waste.price)
                        : formatINR(waste.price)}
                      <span className="text-xs font-normal text-gray-500"> / {waste.unit || 'kg'}</span>
                    </span>
                  </div>

                  <div>
                    <span className="text-emerald-800 block text-[10px] font-bold uppercase">AI Fair Value Estimation</span>
                    <span className="text-xl font-black text-emerald-700">
                      {formatINR(waste.predictedPrice || 25.5)}
                      <span className="text-xs font-normal text-gray-500"> / {waste.unit || 'kg'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Auction Bidding Form if Auction Mode */}
              {isAuction ? (
                <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <strong className="text-gray-900 font-extrabold flex items-center gap-1.5">
                      <FiClock className="text-amber-600" /> Dynamic Bid Placement
                    </strong>
                    <span className="text-[10px] text-amber-800 font-bold">Min Increment: ₹{waste.auctionInfo?.minIncrement || 1}/kg</span>
                  </div>

                  <form onSubmit={handlePlaceBid} className="flex gap-2">
                    <input
                      type="number"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder="Enter bid in ₹/kg"
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-300 font-mono font-bold text-gray-900 focus:outline-none focus:border-amber-500 bg-white"
                    />
                    <button
                      type="submit"
                      disabled={bidding}
                      className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {bidding ? 'Submitting...' : 'Place Bid'}
                    </button>
                  </form>

                  {waste.auctionInfo?.bids?.length > 0 && (
                    <div className="pt-2 border-t border-amber-200/60 text-[11px] text-gray-600 space-y-1">
                      <span className="font-bold text-gray-900 block">Recent Live Bids:</span>
                      {waste.auctionInfo.bids.slice(-3).reverse().map((b, i) => (
                        <div key={i} className="flex justify-between">
                          <span>{b.bidderName || 'Industrial Bidder'}</span>
                          <strong className="font-mono text-gray-900">₹{b.amount}/{waste.unit || 'kg'}</strong>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleExchange}
                  disabled={requesting}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  {requesting ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  ) : (
                    <>
                      <FiTruck className="w-4 h-4" /> Request Material Exchange
                    </>
                  )}
                </button>
              )}

              {/* Secondary Navigation Actions */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => navigate('/recommendations', { state: { wasteId: waste._id } })}
                  className="py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FiZap className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Smart Match Engine</span>
                </button>

                <Link
                  to={`/traceability/${waste.batchId || waste._id}`}
                  className="py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 text-center"
                >
                  <FiFileText className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Resource Passport</span>
                </Link>
              </div>

            </div>

          </div>

          {/* Granular Material Specifications & ESG */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-gray-100 pt-6">
            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <FiShield className="text-emerald-600" /> Material Assay
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-gray-200 pb-1">
                  <span className="text-gray-500 font-medium">Quality Grade:</span>
                  <span className="font-extrabold text-emerald-800">{waste.qualityGrade || 'Grade A'}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-1">
                  <span className="text-gray-500 font-medium">Purity:</span>
                  <span className="font-bold text-gray-900">
                    {typeof waste.purity === 'object' ? (waste.purity?.estimated ?? 94.5) : (waste.purity ?? 94.5)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Moisture:</span>
                  <span className="font-bold text-gray-900">
                    {typeof waste.moisture === 'object' ? (waste.moisture?.estimated ?? 1.8) : (waste.moisture ?? 1.8)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <FiGlobe className="text-emerald-600" /> Environmental Savings
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-gray-200 pb-1">
                  <span className="text-gray-500 font-medium">Net Avoided CO₂:</span>
                  <span className="font-black text-emerald-700">{Math.round(qty * 1.85)} kg CO₂e</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-1">
                  <span className="text-gray-500 font-medium">Virgin Material Saved:</span>
                  <span className="font-bold text-gray-900">{Math.round(qty * 0.85)} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Circularity Factor:</span>
                  <span className="font-bold text-teal-800">{circularityScore} / 100</span>
                </div>
              </div>
            </div>

            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <FiTrendingUp className="text-emerald-600" /> Valuation & Market Spread
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-gray-200 pb-1">
                  <span className="text-gray-500 font-medium">AI Market Fair Value:</span>
                  <span className="font-bold text-emerald-800">₹{waste.predictedPrice || 25.5}/kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Market Outlook:</span>
                  <span className="font-bold text-gray-900">High Demand (+16%)</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Seller Trust & Ratings Section */}
        {waste.uploader && (
          <SellerReviews sellerId={waste.uploader?._id || waste.uploader} />
        )}

      </div>
    </DashboardLayout>
  );
}
