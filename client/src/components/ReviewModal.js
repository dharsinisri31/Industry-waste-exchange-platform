import React, { useState } from 'react';
import API from '../services/authAPI';
import { FiStar, FiX, FiCheckCircle, FiAlertCircle, FiAward, FiShield } from 'react-icons/fi';

export default function ReviewModal({ order, isOpen, onClose, onReviewSubmitted, role = 'buyer' }) {
  const [overallRating, setOverallRating] = useState(5);
  const [wasteQualityRating, setWasteQualityRating] = useState(5);
  const [communicationRating, setCommunicationRating] = useState(5);
  const [deliveryRating, setDeliveryRating] = useState(5);
  const [comment, setComment] = useState('High quality industrial feedstock matching exact specifications. Smooth logistics and timely dispatch.');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen || !order) return null;

  const isBuyer = role === 'buyer';

  const StarRatingSelector = ({ value, onChange, label }) => {
    return (
      <div className="space-y-1">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-gray-700">{label}</span>
          <span className="font-mono font-bold text-amber-500">{value} / 5</span>
        </div>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              className="p-1 text-gray-200 hover:scale-110 transition-transform cursor-pointer focus:outline-none"
            >
              <FiStar
                className={`w-6 h-6 ${
                  star <= value ? 'text-amber-400 fill-amber-400' : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment || comment.trim().length === 0) {
      setErrorMsg('Please write a brief review comment.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      await API.post('/reviews', {
        orderId: order.exchangeId || order._id,
        overallRating,
        wasteQualityRating: isBuyer ? wasteQualityRating : undefined,
        sellerCommunicationRating: isBuyer ? communicationRating : undefined,
        deliveryExperienceRating: isBuyer ? deliveryRating : undefined,
        buyerCommunicationRating: !isBuyer ? communicationRating : undefined,
        transactionExperienceRating: !isBuyer ? deliveryRating : undefined,
        comment: comment.trim()
      });

      setSuccessMsg('Review submitted successfully! Trust score updated.');
      setTimeout(() => {
        if (onReviewSubmitted) onReviewSubmitted();
        onClose();
      }, 1500);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto font-sans animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden z-10 p-6 sm:p-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <FiStar className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900">
                {isBuyer ? 'Rate Industrial Seller' : 'Rate Exchange Partner'}
              </h2>
              <p className="text-xs text-gray-500 font-medium">Order #{order.exchangeId || order._id?.toString().slice(-6)}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Success / Error Alerts */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2">
            <FiCheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs font-bold flex items-center gap-2">
            <FiAlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Overall Rating */}
          <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60">
            <StarRatingSelector
              label="Overall Transaction Experience"
              value={overallRating}
              onChange={setOverallRating}
            />
          </div>

          {/* Detailed Criteria */}
          {isBuyer ? (
            <div className="space-y-3 pt-1">
              <StarRatingSelector
                label="Material / Waste Quality & Assay Match"
                value={wasteQualityRating}
                onChange={setWasteQualityRating}
              />
              <StarRatingSelector
                label="Seller Communication & Documentation"
                value={communicationRating}
                onChange={setCommunicationRating}
              />
              <StarRatingSelector
                label="Delivery Experience & Packaging"
                value={deliveryRating}
                onChange={setDeliveryRating}
              />
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              <StarRatingSelector
                label="Buyer Communication"
                value={communicationRating}
                onChange={setCommunicationRating}
              />
              <StarRatingSelector
                label="Receiving & Weighment Promptness"
                value={deliveryRating}
                onChange={setDeliveryRating}
              />
            </div>
          )}

          {/* Written Feedback Textarea */}
          <div className="space-y-1 pt-2">
            <label className="block text-xs font-extrabold text-gray-700 uppercase">
              Written Review & Assessment
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Provide constructive feedback regarding purity, moisture, logistics coordination, or packaging..."
              className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium text-gray-900 focus:outline-emerald-500"
              maxLength={2000}
            />
            <div className="text-[10px] text-gray-400 text-right">{comment.length} / 2000</div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <FiStar className="w-4 h-4" />
              <span>{submitting ? 'Submitting Review...' : 'Submit 5-Star Review'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
