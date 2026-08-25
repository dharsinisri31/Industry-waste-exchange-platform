import React, { useState } from 'react';
import { 
  FiMapPin, FiTruck, FiActivity, FiStar, FiCheckCircle, FiPackage, FiLayers 
} from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { formatINR } from '../utils/formatINR';
import { useAuth } from '../context/AuthContext';

export default function WasteCard({ waste, onExchange, onRequireLogin }) {
  const { user, isBuyerMode } = useAuth();
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();

  const handleAction = async (e) => {
    e.preventDefault();
    if (!user) {
      if (onRequireLogin) {
        onRequireLogin();
      } else {
        navigate('/login');
      }
      return;
    }

    if (isBuyerMode) {
      setLoading(true);
      try {
        if (onExchange) {
          await onExchange(waste._id);
        }
      } finally {
        setLoading(false);
      }
    } else {
      navigate('/recommendations', { state: { wasteId: waste._id } });
    }
  };

  // Resolve local or remote image URL
  const getImageSource = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    // Prefix relative upload path with backend server host
    const backendHost = 'http://localhost:5000';
    return `${backendHost}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const rawImage = waste.imageUrl || waste.image || waste.imagePath;
  const imageSrc = getImageSource(rawImage);

  const supplierName = waste.uploader?.companyName || 'Verified Supplier';
  const locationText = waste.city ? `${waste.city}, ${waste.state || 'Tamil Nadu'}` : (waste.address || 'Industrial Facility');
  const qualityText = `${waste.qualityGrade || 'Grade A'} · ${waste.purity?.estimated || waste.purityPercent || '95'}% purity`;
  const ratingVal = waste.supplierRating || '4.8';

  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-2xs border border-[#DDE7E2] hover:border-[#009B6B] hover:shadow-md transition-all duration-200 flex flex-col justify-between group font-sans">
      <div>
        {/* Material Visual & Badges */}
        <div className="h-48 relative bg-gray-100 overflow-hidden flex items-center justify-center">
          {imageSrc && !imageError ? (
            <img
              src={imageSrc}
              alt={waste.name}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
            />
          ) : (
            /* Neutral No Image Uploaded Placeholder */
            <div className="w-full h-full bg-[#F6F8F7] flex flex-col items-center justify-center text-gray-400 p-4 border-b border-[#DDE7E2]">
              <FiLayers className="w-8 h-8 text-[#009B6B]/60 mb-1" />
              <span className="text-xs font-bold text-gray-500">No image uploaded</span>
              <span className="text-[10px] text-gray-400 font-medium">Batch {waste.batchId || 'EL-BATCH'}</span>
            </div>
          )}
          
          {/* Top Category Badge */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            <span className="px-2.5 py-1 bg-white/95 backdrop-blur-xs border border-[#DDE7E2] rounded-xl text-[10px] font-extrabold text-[#12233F] shadow-2xs">
              {waste.category || 'Plastic'}
            </span>
          </div>

          {/* Top Verified Supplier Badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1">
            <span className="px-2.5 py-1 bg-[#009B6B] text-white rounded-xl text-[10px] font-extrabold flex items-center gap-1 shadow-2xs">
              <FiCheckCircle className="w-3 h-3" />
              <span>Verified supplier</span>
            </span>
          </div>

          {/* Bottom Quality Grade Overlay */}
          <div className="absolute bottom-3 left-3 flex gap-1.5">
            <span className="px-2.5 py-0.5 bg-[#12233F]/80 backdrop-blur-xs text-white text-[10px] font-bold rounded-lg">
              {qualityText}
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5 space-y-3">
          {/* Material Name & Available Qty */}
          <div className="flex justify-between items-start gap-2">
            <h3 className="text-sm font-black text-[#12233F] tracking-tight leading-snug line-clamp-1 group-hover:text-[#009B6B] transition-colors">
              {waste.name}
            </h3>
            <span className="text-xs font-black text-[#009B6B] bg-[#EAF8F2] px-2.5 py-0.5 rounded-lg shrink-0 border border-[#DDE7E2]">
              {waste.quantity?.toLocaleString() || 500} {waste.unit || 'kg'}
            </span>
          </div>

          {/* Price & Rating */}
          <div className="flex items-baseline justify-between pt-0.5">
            <div>
              <span className="text-[10px] text-[#5F6B7A] font-bold uppercase tracking-wider block">Price</span>
              <span className="text-base font-black text-[#12233F]">
                {formatINR(waste.price || 50)} <span className="text-xs font-normal text-[#5F6B7A]">/ {waste.unit || 'kg'}</span>
              </span>
            </div>
            <div className="flex items-center gap-1 text-amber-600 text-xs font-bold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
              <FiStar className="fill-current w-3 h-3 text-amber-500" />
              <span>{ratingVal}</span>
            </div>
          </div>

          {/* Supplier Info & Location */}
          <div className="space-y-1 pt-2.5 border-t border-[#DDE7E2] text-xs text-[#5F6B7A]">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#12233F] truncate max-w-[200px]">{supplierName}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px]">
              <FiMapPin className="w-3.5 h-3.5 text-[#009B6B] shrink-0" />
              <span className="truncate">{locationText}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-5 pt-0 grid grid-cols-2 gap-2.5">
        {user ? (
          <Link
            to={`/waste/${waste._id}`}
            className="py-2.5 bg-[#F6F8F7] hover:bg-gray-100 border border-[#DDE7E2] text-[#12233F] font-bold rounded-xl transition-all text-xs flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>View Details</span>
          </Link>
        ) : (
          <button
            onClick={() => onRequireLogin ? onRequireLogin() : navigate('/login')}
            className="py-2.5 bg-[#F6F8F7] hover:bg-gray-100 border border-[#DDE7E2] text-[#12233F] font-bold rounded-xl transition-all text-xs flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>View Details</span>
          </button>
        )}

        <button
          onClick={handleAction}
          disabled={loading}
          className={`py-2.5 rounded-xl font-extrabold transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs ${
            loading
              ? 'bg-gray-200 text-gray-500'
              : 'bg-[#009B6B] hover:bg-emerald-700 text-white'
          }`}
        >
          {loading ? (
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
          ) : isBuyerMode || !user ? (
            <>
              <FiTruck className="w-3.5 h-3.5" />
              <span>Request Material</span>
            </>
          ) : (
            <>
              <FiActivity className="w-3.5 h-3.5" />
              <span>Smart Match</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}


