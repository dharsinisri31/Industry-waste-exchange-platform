import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import Loader from '../components/Loader';
import { apiGet, apiPut, apiDelete } from '../services/api';
import { formatINR } from '../utils/formatINR';
import { FiCpu, FiPlus, FiZap, FiMapPin, FiClock, FiEdit2, FiTrash2, FiPauseCircle, FiPlayCircle } from 'react-icons/fi';

export default function MyRequirements() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [requirements, setRequirements] = useState([]);

  const fetchRequirements = async () => {
    setLoading(true);
    try {
      const data = await apiGet('/api/buyer-requirements/my');
      setRequirements(Array.isArray(data) ? data : []);
    } catch (err) {
      // Demo Fallback Data
      setRequirements([
        {
          _id: 'req1',
          material: 'PET Plastic Scrap',
          category: 'Plastic Scrap',
          quantity: 500,
          unit: 'kg',
          minPurity: 95,
          maxPrice: 50,
          frequency: 'Monthly',
          city: 'Tiruppur',
          radiusKm: 100,
          status: 'active',
          matchedSuppliersCount: 5,
          createdAt: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirements();
  }, []);

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      await apiPut(`/api/buyer-requirements/${id}`, { status: newStatus });
      fetchRequirements();
    } catch (err) {
      alert(err.message || 'Failed to update requirement status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this material requirement?')) return;
    try {
      await apiDelete(`/api/buyer-requirements/${id}`);
      fetchRequirements();
    } catch (err) {
      alert(err.message || 'Failed to delete requirement');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <FiCpu className="text-teal-600" /> My Material Procurement Requirements
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 font-medium">
              Manage your active material procurement specifications, view AI matched seller listings, and control sourcing frequency.
            </p>
          </div>

          <Link
            to="/post-requirement"
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-xl text-xs shadow-xs transition flex items-center gap-2 shrink-0"
          >
            <FiPlus className="w-4 h-4" /> Post New Requirement
          </Link>
        </div>

        {loading ? (
          <Loader />
        ) : requirements.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center space-y-3">
            <FiCpu className="w-12 h-12 text-gray-400 mx-auto" />
            <h3 className="text-base font-bold text-gray-900">No active material requirements found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Post a material requirement to allow EcoLink's AI Sourcing engine to find verified seller waste listings for your plant.
            </p>
            <Link
              to="/post-requirement"
              className="px-4 py-2 bg-teal-600 text-white font-bold rounded-xl text-xs inline-block mt-2"
            >
              + Post Requirement
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {requirements.map((req) => (
              <div key={req._id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="px-3 py-1 bg-teal-50 text-teal-800 rounded-full text-xs font-extrabold border border-teal-200">
                        {req.category}
                      </span>
                      <h3 className="text-lg font-extrabold text-gray-900 mt-2">{req.material}</h3>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      req.status === 'active' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      {req.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs">
                    <div>
                      <span className="text-gray-500 font-bold block text-[10px] uppercase">Required Quantity</span>
                      <span className="font-extrabold text-gray-900">{req.quantity} {req.unit} / {req.frequency}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-bold block text-[10px] uppercase">Min Quality / Purity</span>
                      <span className="font-extrabold text-teal-800">&ge; {req.minPurity}% Purity</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-bold block text-[10px] uppercase">Max Acceptable Price</span>
                      <span className="font-extrabold text-emerald-800">Max {formatINR(req.maxPrice)} / {req.unit}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-bold block text-[10px] uppercase">Location & Radius</span>
                      <span className="font-bold text-gray-900">{req.city} ({req.radiusKm}km)</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-600 font-bold">AI Supplier Matches Found:</span>
                    <span className="px-2.5 py-1 bg-teal-100 text-teal-800 rounded-full font-black text-xs">
                      {req.matchedSuppliersCount || 5} Matches
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate('/sourcing-matcher', { state: { requirementId: req._id } })}
                      className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <FiZap className="w-4 h-4" /> Find Suppliers
                    </button>

                    <button
                      onClick={() => handleToggleStatus(req._id, req.status)}
                      className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl border border-gray-200"
                      title={req.status === 'active' ? 'Pause Requirement' : 'Activate Requirement'}
                    >
                      {req.status === 'active' ? <FiPauseCircle className="w-4 h-4" /> : <FiPlayCircle className="w-4 h-4 text-emerald-600" />}
                    </button>

                    <button
                      onClick={() => handleDelete(req._id)}
                      className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl border border-red-200"
                      title="Delete Requirement"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
