import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { apiPost } from '../services/api';
import { FiPlus, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { formatINR } from '../utils/formatINR';

export default function PostRequirement() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [material, setMaterial] = useState('PET Plastic Scrap');
  const [category, setCategory] = useState('Plastic Scrap');
  const [quantity, setQuantity] = useState('500');
  const [unit, setUnit] = useState('kg');
  const [minPurity, setMinPurity] = useState('95');
  const [maxPrice, setMaxPrice] = useState('50');
  const [frequency, setFrequency] = useState('Monthly');
  const [address, setAddress] = useState('Industrial Estate');
  const [city, setCity] = useState('Tiruppur');
  const [radiusKm, setRadiusKm] = useState('100');
  const [requiredDate, setRequiredDate] = useState('');
  const [application, setApplication] = useState('Recycled polymer production & pelletizing');
  const [specifications, setSpecifications] = useState('Clean washed scrap, moisture content below 2%');

  const categories = [
    'Plastic Scrap',
    'PET',
    'HDPE',
    'PP',
    'Metal Scrap',
    'Aluminium',
    'Steel',
    'Copper',
    'Fly Ash',
    'Slag',
    'Glass',
    'Paper',
    'Textile',
    'Spent Solvents',
    'Other'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await apiPost('/api/buyer-requirements', {
        material,
        category,
        quantity: parseFloat(quantity),
        unit,
        minPurity: parseFloat(minPurity),
        maxPrice: parseFloat(maxPrice),
        frequency,
        address,
        city,
        radiusKm: parseFloat(radiusKm),
        requiredDate: requiredDate || new Date().toISOString().split('T')[0],
        application,
        specifications
      });

      setSuccess('Material requirement published successfully! AI Supplier Matching is now active.');
      setTimeout(() => {
        navigate('/my-requirements');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to publish requirement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <FiPlus className="text-teal-600" /> Post Material Sourcing Requirement
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1 font-medium">
            Specify secondary raw material procurement needs to automatically trigger AI Supplier Matching and receive competitive seller proposals.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
            <FiAlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 bg-teal-50 border border-teal-200 text-teal-800 rounded-xl text-xs font-bold flex items-center gap-2">
            <FiCheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block mb-1">Required Material Name</label>
              <input
                type="text"
                required
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder="e.g. PET Plastic Scrap"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 font-bold text-gray-900"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block mb-1">Material Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 font-bold text-gray-900 bg-white cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block mb-1">Required Quantity & Unit</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="500"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 font-bold text-gray-900"
                />
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-28 px-3 py-2.5 rounded-xl border border-gray-300 font-bold text-gray-900 bg-white cursor-pointer"
                >
                  <option value="kg">kg</option>
                  <option value="tons">tons</option>
                  <option value="litres">litres</option>
                  <option value="units">units</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block mb-1">Procurement Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 font-bold text-gray-900 bg-white cursor-pointer"
              >
                <option value="One-time">One-time Order</option>
                <option value="Weekly">Weekly Recurring</option>
                <option value="Monthly">Monthly Recurring</option>
                <option value="Quarterly">Quarterly Recurring</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block mb-1">Minimum Required Purity (%)</label>
              <input
                type="number"
                required
                value={minPurity}
                onChange={(e) => setMinPurity(e.target.value)}
                placeholder="95"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 font-bold text-gray-900"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block mb-1">Maximum Acceptable Price (₹ / unit)</label>
              <input
                type="number"
                required
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="50"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 font-extrabold text-teal-800"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block mb-1">Delivery City</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Tiruppur"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 font-bold text-gray-900"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block mb-1">Preferred Search Radius (km)</label>
              <input
                type="number"
                required
                value={radiusKm}
                onChange={(e) => setRadiusKm(e.target.value)}
                placeholder="100"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 font-bold text-gray-900"
              />
            </div>
          </div>

          <div className="space-y-4 text-xs pt-2 border-t border-gray-100">
            <div>
              <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block mb-1">Delivery Address & Plant Location</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Plot 42, Industrial Park, Tiruppur"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 font-medium text-gray-900"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block mb-1">Intended Application / Use Case</label>
              <input
                type="text"
                value={application}
                onChange={(e) => setApplication(e.target.value)}
                placeholder="Recycled polymer production & pelletizing"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 font-medium text-gray-900"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block mb-1">Additional Specifications / Lab Standards</label>
              <textarea
                rows={3}
                value={specifications}
                onChange={(e) => setSpecifications(e.target.value)}
                placeholder="Specify moisture tolerance, flake sizing, color requirements..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 font-medium text-gray-900 resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-5 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl text-xs hover:bg-gray-200 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-xl text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Publishing Requirement...' : 'Post Requirement & Start AI Sourcing'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
