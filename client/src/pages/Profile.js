import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateIndustryProfile } from '../services/industryAPI';
import DashboardLayout from '../layouts/DashboardLayout';
import { FiSave, FiCheckCircle, FiShield, FiKey, FiLock, FiCpu, FiUserCheck, FiActivity } from 'react-icons/fi';
import { motion } from 'framer-motion';

export default function Profile() {
  const { profile, user, loadUser } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [formData, setFormData] = useState({
    companyName: '',
    address: '',
    city: '',
    latitude: '',
    longitude: '',
    contactPhone: '',
    industryType: '',
    description: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (profile) {
      const [lng, lat] = profile.location?.coordinates || ['', ''];
      setFormData({
        companyName: profile.companyName || '',
        address: profile.address || '',
        city: profile.city || '',
        latitude: lat ? lat.toString() : '',
        longitude: lng ? lng.toString() : '',
        contactPhone: profile.contactPhone || '',
        industryType: profile.industryType || '',
        description: profile.description || ''
      });
    }
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const payload = {
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude)
      };
      await updateIndustryProfile(payload);
      await loadUser();
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {isAdmin ? (
          /* ==================== PLATFORM ADMINISTRATOR PROFILE ==================== */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xs space-y-6">
              <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                <div>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 mb-2">
                    <FiShield className="w-3.5 h-3.5" /> Platform Administrator
                  </span>
                  <h1 className="text-2xl font-extrabold text-gray-900">Administrator Identity & Access Control</h1>
                  <p className="text-xs text-gray-600 font-medium mt-0.5">EcoLink Root Platform Operator & Network Custodian Profile</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-gray-500 uppercase block">Account Role</span>
                  <span className="text-xs font-black text-emerald-700">ROOT ADMIN</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                  <span className="text-gray-500 font-bold uppercase text-[10px]">Admin Email</span>
                  <p className="text-sm font-extrabold text-gray-900">{user?.email}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                  <span className="text-gray-500 font-bold uppercase text-[10px]">System Access Level</span>
                  <p className="text-sm font-extrabold text-emerald-800">Super Administrator (Tier 1)</p>
                </div>
              </div>

              {/* System Permissions */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-2">
                  <FiKey className="text-emerald-600" /> Platform Operational Permissions
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 flex items-center gap-2 font-bold text-emerald-950">
                    <FiCheckCircle className="text-emerald-600 shrink-0" /> Full Industry Account Verification & Suspension
                  </div>
                  <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 flex items-center gap-2 font-bold text-emerald-950">
                    <FiCheckCircle className="text-emerald-600 shrink-0" /> Waste Listing Moderation & Flag Overrides
                  </div>
                  <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 flex items-center gap-2 font-bold text-emerald-950">
                    <FiCheckCircle className="text-emerald-600 shrink-0" /> AI Symbiosis & Neural Classifier Oversight
                  </div>
                  <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 flex items-center gap-2 font-bold text-emerald-950">
                    <FiCheckCircle className="text-emerald-600 shrink-0" /> CPCB Regulatory & ESG Carbon Ledger Auditing
                  </div>
                  <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 flex items-center gap-2 font-bold text-emerald-950">
                    <FiCheckCircle className="text-emerald-600 shrink-0" /> RAG Knowledge Base Document Synchronization
                  </div>
                  <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 flex items-center gap-2 font-bold text-emerald-950">
                    <FiCheckCircle className="text-emerald-600 shrink-0" /> Dynamic Freight & Carbon Parameter Configuration
                  </div>
                </div>
              </div>

              {/* Security & Audit Parameters */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-700">Active Authentication Session:</span>
                  <span className="text-emerald-800 font-extrabold bg-emerald-100 px-2 py-0.5 rounded text-[10px]">JWT Signed & Encrypted</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-700">Audit Logging:</span>
                  <span className="text-gray-900 font-semibold">Enabled (All admin actions persisted to MongoDB)</span>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* ==================== INDUSTRY SELLER / BUYER PROFILE ==================== */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xs space-y-6"
          >
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Company Profile Settings</h1>
              <p className="text-xs text-gray-600 font-medium">Edit business categories, contact details, and routing geo-coordinates.</p>
            </div>

            {successMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <FiCheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-700">Company Name</label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-xs text-gray-900 font-medium"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-700">Contact Phone</label>
                  <input
                    type="text"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-xs text-gray-900 font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-700">Industry Category</label>
                  <select
                    name="industryType"
                    value={formData.industryType}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-xs text-gray-900 bg-white font-medium cursor-pointer"
                    required
                  >
                    <option value="Chemical">Chemical Processing</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Textile">Textile & Apparel</option>
                    <option value="Metallurgy">Metallurgy & Ore</option>
                    <option value="Electronics">Electronics & Hardware</option>
                    <option value="Energy">Energy & Power</option>
                    <option value="Pharmaceutical">Pharmaceuticals</option>
                    <option value="Other">Other Category</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-700">Account Email (Static)</label>
                  <input
                    type="text"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-100 border border-gray-200 text-xs text-gray-600 font-medium cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700">Street Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-xs text-gray-900 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-700">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-xs text-gray-900 font-medium"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-700">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-xs text-gray-900 font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-700">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-xs text-gray-900 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700">Company / Byproduct Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-xs text-gray-900 font-medium resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                {isLoading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                ) : (
                  <>
                    <FiSave className="w-4 h-4" />
                    <span>Save Profile Updates</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
