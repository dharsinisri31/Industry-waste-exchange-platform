import React, { useState, useEffect } from 'react';
import API from '../services/authAPI';
import { FiStar, FiCheckCircle, FiUser, FiMessageSquare, FiShield } from 'react-icons/fi';

export default function SellerReviews({ sellerId }) {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    averageRating: 5.0,
    wasteQualityRating: 5.0,
    communicationRating: 5.0,
    deliveryRating: 5.0,
    totalReviews: 0
  });
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    if (!sellerId) return;

    const fetchReviews = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/reviews/seller/${sellerId}`);
        if (res.data) {
          setMetrics(res.data.metrics || {});
          setReviews(res.data.reviews || []);
        }
      } catch (err) {
        // Quiet fallback
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [sellerId]);

  if (loading) return null;

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-100">
        <div>
          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <FiShield className="text-emerald-700 w-5 h-5" />
            <span>Supplier Trust & Quality Ratings</span>
          </h3>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Verified ratings and feedback from circular exchange partners.
          </p>
        </div>

        {/* Overall Score Badge */}
        <div className="flex items-center gap-3 bg-amber-50 px-4 py-2 rounded-2xl border border-amber-200">
          <div className="text-2xl font-black text-amber-900">
            {metrics.averageRating || 5.0}
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center text-amber-500">
              {[1, 2, 3, 4, 5].map((s) => (
                <FiStar key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-[10px] font-bold text-amber-800 block">
              {metrics.totalReviews || 0} Verified Reviews
            </span>
          </div>
        </div>
      </div>

      {/* Criteria Breakdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-1">
          <div className="flex justify-between items-center text-xs font-bold text-gray-700">
            <span>Material Assay Match</span>
            <span className="text-amber-800">{metrics.wasteQualityRating || 5.0} / 5</span>
          </div>
          <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-amber-400 h-full rounded-full"
              style={{ width: `${((metrics.wasteQualityRating || 5.0) / 5) * 100}%` }}
            />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-1">
          <div className="flex justify-between items-center text-xs font-bold text-gray-700">
            <span>Seller Communication</span>
            <span className="text-teal-800">{metrics.communicationRating || 5.0} / 5</span>
          </div>
          <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-teal-600 h-full rounded-full"
              style={{ width: `${((metrics.communicationRating || 5.0) / 5) * 100}%` }}
            />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-1">
          <div className="flex justify-between items-center text-xs font-bold text-gray-700">
            <span>Delivery Reliability</span>
            <span className="text-emerald-800">{metrics.deliveryRating || 5.0} / 5</span>
          </div>
          <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full"
              style={{ width: `${((metrics.deliveryRating || 5.0) / 5) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Review Feed */}
      <div className="space-y-3 pt-2">
        {reviews.length === 0 ? (
          <div className="p-4 bg-gray-50 rounded-2xl text-center text-gray-400 text-xs font-medium">
            No public reviews submitted yet for this supplier.
          </div>
        ) : (
          reviews.slice(0, 5).map((r) => (
            <div key={r._id} className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    {(r.reviewerCompany || r.reviewerName || 'B').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-extrabold text-gray-900">{r.reviewerCompany || r.reviewerName || 'Verified Enterprise'}</span>
                    <span className="text-[10px] text-gray-400 block">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center text-amber-400">
                  {[...Array(r.overallRating || 5)].map((_, i) => (
                    <FiStar key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
              </div>

              <p className="text-gray-700 leading-relaxed font-medium">
                "{r.comment}"
              </p>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
