import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateIndustryProfile } from '../services/industryAPI';
import DashboardLayout from '../layouts/DashboardLayout';
import { 
  FiSave, FiCheckCircle, FiShield, FiBriefcase, 
  FiMapPin, FiPhone, FiMail, FiFileText, FiNavigation,
  FiActivity, FiCheck, FiKey, FiLock, FiAlertCircle
} from 'react-icons/fi';
import { motion } from 'framer-motion';

export default function Profile() {
  const { profile, user, loadUser, canonicalRole } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.canonicalRole === 'ADMIN' || canonicalRole === 'ADMIN';
  
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
        latitude: lat !== undefined && lat !== null ? lat.toString() : '',
        longitude: lng !== undefined && lng !== null ? lng.toString() : '',
        contactPhone: profile.contactPhone || '',
        industryType: profile.industryType || 'Manufacturing',
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
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined
      };
      await updateIndustryProfile(payload);
      await loadUser();
      setSuccessMsg('Profile updates saved successfully!');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 font-sans pb-12">
        
        {isAdmin ? (
          /* ==================== PLATFORM ADMINISTRATOR PROFILE ==================== */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#DDE7E2] shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#DDE7E2] pb-5">
                <div>
                  <span className="px-3 py-1 bg-[#E8F7F1] text-[#087A5A] border border-[#009B72]/30 rounded-full text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 mb-2">
                    <FiShield className="w-3.5 h-3.5 text-[#009B72]" /> Platform Administrator
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-black text-[#12233F] tracking-tight">
                    Administrator Identity & Access Control
                  </h1>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">
                    EcoLink Root Platform Operator & Circular Network Custodian Profile
                  </p>
                </div>
                <div className="sm:text-right bg-[#F8FAF9] px-4 py-2 rounded-2xl border border-[#DDE7E2]">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Account Role</span>
                  <span className="text-xs font-black text-[#009B72]">ROOT ADMIN</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-[#F8FAF9] rounded-2xl border border-[#DDE7E2] space-y-1">
                  <span className="text-gray-500 font-bold uppercase text-[10px] tracking-wider">Admin Email</span>
                  <p className="text-sm font-extrabold text-[#12233F]">{user?.email}</p>
                </div>

                <div className="p-4 bg-[#F8FAF9] rounded-2xl border border-[#DDE7E2] space-y-1">
                  <span className="text-gray-500 font-bold uppercase text-[10px] tracking-wider">System Access Level</span>
                  <p className="text-sm font-extrabold text-[#087A5A]">Super Administrator (Tier 1)</p>
                </div>
              </div>

              {/* System Permissions */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#12233F] flex items-center gap-2">
                  <FiKey className="text-[#009B72]" /> Platform Operational Permissions
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 bg-[#E8F7F1]/60 rounded-2xl border border-[#009B72]/20 flex items-center gap-2.5 font-bold text-[#12233F]">
                    <FiCheckCircle className="text-[#009B72] shrink-0" /> Full Industry Account Verification & Moderation
                  </div>
                  <div className="p-3.5 bg-[#E8F7F1]/60 rounded-2xl border border-[#009B72]/20 flex items-center gap-2.5 font-bold text-[#12233F]">
                    <FiCheckCircle className="text-[#009B72] shrink-0" /> Waste Listing Moderation & Status Approval
                  </div>
                  <div className="p-3.5 bg-[#E8F7F1]/60 rounded-2xl border border-[#009B72]/20 flex items-center gap-2.5 font-bold text-[#12233F]">
                    <FiCheckCircle className="text-[#009B72] shrink-0" /> AI Symbiosis & Smart Matching Engine Oversight
                  </div>
                  <div className="p-3.5 bg-[#E8F7F1]/60 rounded-2xl border border-[#009B72]/20 flex items-center gap-2.5 font-bold text-[#12233F]">
                    <FiCheckCircle className="text-[#009B72] shrink-0" /> Regulatory Compliance & ESG Carbon Ledger Auditing
                  </div>
                  <div className="p-3.5 bg-[#E8F7F1]/60 rounded-2xl border border-[#009B72]/20 flex items-center gap-2.5 font-bold text-[#12233F]">
                    <FiCheckCircle className="text-[#009B72] shrink-0" /> RAG Knowledge Base Document Synchronization
                  </div>
                  <div className="p-3.5 bg-[#E8F7F1]/60 rounded-2xl border border-[#009B72]/20 flex items-center gap-2.5 font-bold text-[#12233F]">
                    <FiCheckCircle className="text-[#009B72] shrink-0" /> Freight Distance & Dynamic Route Optimization
                  </div>
                </div>
              </div>

              {/* Security & Audit Parameters */}
              <div className="p-4 bg-[#F8FAF9] rounded-2xl border border-[#DDE7E2] text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-700">Active Authentication Session:</span>
                  <span className="text-[#087A5A] font-extrabold bg-[#E8F7F1] px-2.5 py-0.5 rounded-lg text-[10px]">
                    JWT Signed & Encrypted
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-700">Audit Persistence:</span>
                  <span className="text-[#12233F] font-semibold">MongoDB Atlas Transactional Database</span>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* ==================== INDUSTRY SELLER / BUYER PROFILE ==================== */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Profile Page Header Card */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#DDE7E2] shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-3 py-1 bg-[#E8F7F1] text-[#087A5A] border border-[#009B72]/30 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5">
                    <FiShield className="w-3.5 h-3.5 text-[#009B72]" /> Verified Industrial Profile
                  </span>
                  <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-full text-[10px] font-mono font-extrabold border border-gray-200">
                    {profile?.registrationNumber || 'CIN-REG-ACTIVE'}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-[#12233F] tracking-tight">
                  Company Profile Settings
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">
                  Manage your facility credentials, commodity sector, contact details, and routing geo-coordinates.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-3.5 py-1.5 bg-[#F8FAF9] border border-[#DDE7E2] rounded-xl text-xs font-bold text-[#12233F]">
                  Role: <strong className="text-[#009B72] uppercase">{user?.roles?.join(' & ') || user?.role || 'Seller'}</strong>
                </span>
              </div>
            </div>

            {/* Success Alert */}
            {successMsg && (
              <div className="p-4 bg-[#E8F7F1] border border-[#009B72]/40 text-[#087A5A] rounded-2xl text-xs font-bold flex items-center gap-2 shadow-2xs">
                <FiCheckCircle className="w-4 h-4 text-[#009B72] shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Error Alert */}
            {errorMsg && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
                <FiAlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* ============================================================ */}
              {/* SECTION 1: COMPANY INFORMATION */}
              {/* ============================================================ */}
              <div className="bg-white rounded-3xl border border-[#DDE7E2] shadow-xs overflow-hidden">
                <div className="px-6 py-4 bg-[#F8FAF9] border-b border-[#DDE7E2] flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#E8F7F1] text-[#009B72] flex items-center justify-center font-bold">
                    <FiBriefcase className="w-3.5 h-3.5 text-[#009B72]" />
                  </div>
                  <h2 className="text-xs font-black uppercase tracking-wider text-[#12233F]">
                    1. Company Information
                  </h2>
                </div>

                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Company Name Box */}
                  <div className="bg-white border border-[#DDE7E2] rounded-2xl p-3.5 focus-within:border-[#009B72] focus-within:ring-2 focus-within:ring-[#009B72]/10 transition-all shadow-2xs">
                    <label className="uppercase text-[10px] font-bold text-gray-400 tracking-wider block mb-1">
                      Company Legal Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder="e.g. Apex Minerals Corp."
                      className="w-full text-xs font-extrabold text-[#12233F] placeholder:text-gray-400 bg-transparent border-0 p-0 focus:outline-none focus:ring-0"
                      required
                    />
                  </div>

                  {/* Industry Category Dropdown Box */}
                  <div className="bg-white border border-[#DDE7E2] rounded-2xl p-3.5 focus-within:border-[#009B72] focus-within:ring-2 focus-within:ring-[#009B72]/10 transition-all shadow-2xs">
                    <label className="uppercase text-[10px] font-bold text-gray-400 tracking-wider block mb-1">
                      Industry Category / Sector <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="industryType"
                      value={formData.industryType}
                      onChange={handleChange}
                      className="w-full text-xs font-extrabold text-[#12233F] bg-transparent border-0 p-0 focus:outline-none focus:ring-0 cursor-pointer"
                      required
                    >
                      <option value="Manufacturing">Manufacturing & Engineering</option>
                      <option value="Chemicals & Polymers">Chemicals & Polymers</option>
                      <option value="Thermal Power & Minerals">Thermal Power & Minerals (Fly Ash/Slag)</option>
                      <option value="Metallurgy & Smelting">Metallurgy & Foundry</option>
                      <option value="Recycling & Waste Processing">Recycling & Secondary Processing</option>
                      <option value="Electronics & IT Hardware">Electronics & E-Waste</option>
                      <option value="Textiles & Paper">Textiles & Pulp/Paper</option>
                      <option value="Food & Agriculture Processing">Food & Agriculture Processing</option>
                      <option value="Automotive & Transportation">Automotive & Transportation</option>
                      <option value="Pharmaceuticals & Healthcare">Pharmaceuticals & Healthcare</option>
                      <option value="Construction & Building Materials">Construction & Building Materials</option>
                      <option value="Renewable Energy & Power">Renewable Energy & Power</option>
                      <option value="Other">Other Industrial Sector</option>
                    </select>
                  </div>

                  {/* Account Email (Static Readonly Box) */}
                  <div className="bg-[#F8FAF9] border border-[#DDE7E2] rounded-2xl p-3.5 shadow-2xs cursor-not-allowed">
                    <label className="uppercase text-[10px] font-bold text-gray-400 tracking-wider block mb-1 flex items-center justify-between">
                      <span>Account Email</span>
                      <span className="text-[9px] text-[#009B72] font-extrabold lowercase">(verified id)</span>
                    </label>
                    <div className="text-xs font-extrabold text-gray-600 truncate">
                      {user?.email || 'official@company.com'}
                    </div>
                  </div>

                  {/* Contact Phone Box */}
                  <div className="bg-white border border-[#DDE7E2] rounded-2xl p-3.5 focus-within:border-[#009B72] focus-within:ring-2 focus-within:ring-[#009B72]/10 transition-all shadow-2xs">
                    <label className="uppercase text-[10px] font-bold text-gray-400 tracking-wider block mb-1">
                      Facility Contact Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleChange}
                      placeholder="+91 9876543210"
                      className="w-full text-xs font-extrabold text-[#12233F] placeholder:text-gray-400 bg-transparent border-0 p-0 focus:outline-none focus:ring-0"
                      required
                    />
                  </div>

                </div>
              </div>

              {/* ============================================================ */}
              {/* SECTION 2: FACILITY LOCATION */}
              {/* ============================================================ */}
              <div className="bg-white rounded-3xl border border-[#DDE7E2] shadow-xs overflow-hidden">
                <div className="px-6 py-4 bg-[#F8FAF9] border-b border-[#DDE7E2] flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#E8F7F1] text-[#009B72] flex items-center justify-center font-bold">
                    <FiMapPin className="w-3.5 h-3.5 text-[#009B72]" />
                  </div>
                  <h2 className="text-xs font-black uppercase tracking-wider text-[#12233F]">
                    2. Facility Location
                  </h2>
                </div>

                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Street Address Box */}
                    <div className="bg-white border border-[#DDE7E2] rounded-2xl p-3.5 focus-within:border-[#009B72] focus-within:ring-2 focus-within:ring-[#009B72]/10 transition-all shadow-2xs">
                      <label className="uppercase text-[10px] font-bold text-gray-400 tracking-wider block mb-1">
                        Street Address / Industrial Estate <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Plot 44, GIDC Industrial Estate"
                        className="w-full text-xs font-extrabold text-[#12233F] placeholder:text-gray-400 bg-transparent border-0 p-0 focus:outline-none focus:ring-0"
                        required
                      />
                    </div>

                    {/* City Box */}
                    <div className="bg-white border border-[#DDE7E2] rounded-2xl p-3.5 focus-within:border-[#009B72] focus-within:ring-2 focus-within:ring-[#009B72]/10 transition-all shadow-2xs">
                      <label className="uppercase text-[10px] font-bold text-gray-400 tracking-wider block mb-1">
                        City / Industrial Zone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="e.g. Coimbatore, Vadodara, Chennai"
                        className="w-full text-xs font-extrabold text-[#12233F] placeholder:text-gray-400 bg-transparent border-0 p-0 focus:outline-none focus:ring-0"
                        required
                      />
                    </div>

                  </div>

                  {/* Latitude / Longitude Dual Boxes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Latitude Box */}
                    <div className="bg-white border border-[#DDE7E2] rounded-2xl p-3.5 focus-within:border-[#009B72] focus-within:ring-2 focus-within:ring-[#009B72]/10 transition-all shadow-2xs">
                      <label className="uppercase text-[10px] font-bold text-gray-400 tracking-wider block mb-1 flex items-center justify-between">
                        <span>Latitude</span>
                        <span className="text-[9px] text-[#009B72] font-mono font-bold">GPS Coordinate</span>
                      </label>
                      <input
                        type="number"
                        step="any"
                        name="latitude"
                        value={formData.latitude}
                        onChange={handleChange}
                        placeholder="11.0168"
                        className="w-full text-xs font-mono font-extrabold text-[#12233F] placeholder:text-gray-400 bg-transparent border-0 p-0 focus:outline-none focus:ring-0"
                        required
                      />
                    </div>

                    {/* Longitude Box */}
                    <div className="bg-white border border-[#DDE7E2] rounded-2xl p-3.5 focus-within:border-[#009B72] focus-within:ring-2 focus-within:ring-[#009B72]/10 transition-all shadow-2xs">
                      <label className="uppercase text-[10px] font-bold text-gray-400 tracking-wider block mb-1 flex items-center justify-between">
                        <span>Longitude</span>
                        <span className="text-[9px] text-[#009B72] font-mono font-bold">GPS Coordinate</span>
                      </label>
                      <input
                        type="number"
                        step="any"
                        name="longitude"
                        value={formData.longitude}
                        onChange={handleChange}
                        placeholder="76.9558"
                        className="w-full text-xs font-mono font-extrabold text-[#12233F] placeholder:text-gray-400 bg-transparent border-0 p-0 focus:outline-none focus:ring-0"
                        required
                      />
                    </div>

                  </div>
                </div>
              </div>

              {/* ============================================================ */}
              {/* SECTION 3: COMPANY DESCRIPTION */}
              {/* ============================================================ */}
              <div className="bg-white rounded-3xl border border-[#DDE7E2] shadow-xs overflow-hidden">
                <div className="px-6 py-4 bg-[#F8FAF9] border-b border-[#DDE7E2] flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#E8F7F1] text-[#009B72] flex items-center justify-center font-bold">
                    <FiFileText className="w-3.5 h-3.5 text-[#009B72]" />
                  </div>
                  <h2 className="text-xs font-black uppercase tracking-wider text-[#12233F]">
                    3. Company Description
                  </h2>
                </div>

                <div className="p-6">
                  <div className="bg-white border border-[#DDE7E2] rounded-2xl p-4 focus-within:border-[#009B72] focus-within:ring-2 focus-within:ring-[#009B72]/10 transition-all shadow-2xs">
                    <label className="uppercase text-[10px] font-bold text-gray-400 tracking-wider block mb-2">
                      Company / Byproduct Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows="4"
                      placeholder="Detail your manufacturing processes, recyclable byproduct outputs, storage capacity, handling guidelines, or secondary material requirements..."
                      className="w-full text-xs font-medium text-[#12233F] placeholder:text-gray-400 bg-transparent border-0 p-0 focus:outline-none focus:ring-0 resize-none leading-relaxed"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Save Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-[#009B72] hover:bg-[#087A5A] text-white font-extrabold rounded-2xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving Profile Changes...</span>
                  </>
                ) : (
                  <>
                    <FiCheck className="w-4 h-4 stroke-[3]" />
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
