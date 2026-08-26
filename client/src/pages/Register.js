import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { 
  FiMail, FiLock, FiBriefcase, FiMapPin, FiPhone, 
  FiAlertCircle, FiUploadCloud, FiRefreshCw, FiZap, 
  FiCheckCircle, FiFileText 
} from 'react-icons/fi';

export default function Register() {
  // 3 Distinct Role Configurations: 'buyer', 'seller', or 'both'
  const [accountType, setAccountType] = useState('seller');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    companyName: '',
    registrationNumber: '',
    neededWasteTypes: '',
    address: '',
    city: '',
    contactPhone: '',
    industryType: 'Manufacturing',
    customIndustryType: '',
    description: ''
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { registerIndustry } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (formData.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long');
      return;
    }

    if (formData.industryType === 'Other' && !formData.customIndustryType?.trim()) {
      setErrorMsg('Please specify your type of industry');
      return;
    }

    setIsLoading(true);

    try {
      const assignedRoles = accountType === 'buyer' ? ['buyer'] : accountType === 'seller' ? ['seller'] : ['buyer', 'seller'];
      const businessRole = accountType === 'buyer' ? 'receiver' : accountType === 'seller' ? 'sender' : 'both';
      const finalIndustryType = formData.industryType === 'Other' && formData.customIndustryType?.trim()
        ? formData.customIndustryType.trim()
        : formData.industryType;

      const payload = {
        ...formData,
        industryType: finalIndustryType,
        roles: assignedRoles,
        businessRole
      };

      await registerIndustry(payload);
      navigate('/dashboard');
    } catch (err) {
      const backendErrors = err.response?.data?.errors;
      const msg = Array.isArray(backendErrors) && backendErrors.length > 0
        ? backendErrors.join('. ')
        : (err.response?.data?.message || err.message || 'Registration failed. Please check your inputs.');
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8faf9] via-emerald-50/30 to-[#f0fdf4] py-12 px-4 overflow-hidden font-sans">
      
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-emerald-500/10 blur-[130px] pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-3xl bg-white p-8 sm:p-10 rounded-3xl relative z-10 border border-gray-200 shadow-xl space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-black text-gray-900 group">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
              <FiZap className="w-5 h-5 fill-current" />
            </div>
            <span>Eco<span className="text-emerald-600">Link</span></span>
          </Link>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
            Create an Industrial Facility Account
          </h2>
          <p className="text-gray-600 text-xs font-medium">
            Join the verified B2B marketplace for industrial by-products & secondary raw materials.
          </p>
        </div>

        {/* 3 Account Role Selector Tabs (Buyer, Seller, Buyer & Seller) */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block text-center">
            Select Your Company Participation Configuration
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-1.5 bg-gray-100 rounded-2xl border border-gray-200">
            <button
              type="button"
              onClick={() => setAccountType('buyer')}
              className={`py-3 px-3 rounded-xl text-xs font-extrabold transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                accountType === 'buyer'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-gray-700 hover:text-gray-900 bg-white/50 sm:bg-transparent'
              }`}
            >
              <FiRefreshCw className="w-4 h-4 shrink-0" />
              <div className="text-center">
                <div className="leading-tight">1. Buyer</div>
                <div className="text-[10px] font-normal opacity-85">Procures secondary materials</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setAccountType('seller')}
              className={`py-3 px-3 rounded-xl text-xs font-extrabold transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                accountType === 'seller'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-gray-700 hover:text-gray-900 bg-white/50 sm:bg-transparent'
              }`}
            >
              <FiUploadCloud className="w-4 h-4 shrink-0" />
              <div className="text-center">
                <div className="leading-tight">2. Seller</div>
                <div className="text-[10px] font-normal opacity-85">Lists industrial by-products</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setAccountType('both')}
              className={`py-3 px-3 rounded-xl text-xs font-extrabold transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                accountType === 'both'
                  ? 'bg-[#12233F] text-white shadow-xs'
                  : 'text-gray-700 hover:text-gray-900 bg-white/50 sm:bg-transparent'
              }`}
            >
              <FiBriefcase className="w-4 h-4 shrink-0" />
              <div className="text-center">
                <div className="leading-tight">3. Buyer & Seller</div>
                <div className="text-[10px] font-normal opacity-85">Dual circular exchange role</div>
              </div>
            </button>
          </div>
        </div>

        {/* Role Explanatory Banner */}
        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs leading-relaxed text-gray-800 font-medium">
          {accountType === 'seller' ? (
            <div className="flex items-start gap-2.5">
              <FiCheckCircle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <span>
                <strong>Seller Portal:</strong> List manufacturing by-products (Polymers, Fly Ash, Slag, Metal Scrap), receive automated market matching, negotiate trades with verified recyclers, and calculate avoided CO₂e metrics.
              </span>
            </div>
          ) : accountType === 'buyer' ? (
            <div className="flex items-start gap-2.5">
              <FiCheckCircle className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
              <span>
                <strong>Buyer Portal:</strong> Post material requirements, discover compatible byproduct suppliers, send direct exchange requests, review freight routes, and secure sustainable circular feedstock.
              </span>
            </div>
          ) : (
            <div className="flex items-start gap-2.5">
              <FiCheckCircle className="w-4 h-4 text-slate-800 shrink-0 mt-0.5" />
              <span>
                <strong>Buyer & Seller Dual Account:</strong> Full access to both Seller (byproduct listing & sales) and Buyer (sourcing requirements & procurement) dashboards with seamless header role switching.
              </span>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold"
          >
            <FiAlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </motion.div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section 1: Account Credentials */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider border-b border-gray-100 pb-1">
              1. Corporate Credentials
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700">Corporate Email</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
                    <FiMail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="official@company.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-medium"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
                    <FiLock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 6 characters"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-medium"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Company & Regulatory Information */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider border-b border-gray-100 pb-1">
              2. Company & Regulatory Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700">Company Legal Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
                    <FiBriefcase className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="e.g. Apex Minerals Ltd."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-medium"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700">Registration / CIN / GSTIN</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
                    <FiFileText className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    name="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={handleChange}
                    placeholder="CIN/GSTIN/REG-98765"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-medium"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700">Industry Sector / Category</label>
                <select
                  name="industryType"
                  value={formData.industryType}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-medium bg-white cursor-pointer"
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
                  <option value="Other">Other (Specify Custom Industry)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700">Facility Phone</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
                    <FiPhone className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    placeholder="+91 9876543210"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-medium"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Custom Industry Input when 'Other' is selected */}
            {formData.industryType === 'Other' && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-1.5 p-3.5 bg-emerald-50/50 border border-emerald-300 rounded-2xl"
              >
                <label className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                  <FiBriefcase className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Specify Your Type of Industry / Sector</span>
                </label>
                <input
                  type="text"
                  name="customIndustryType"
                  value={formData.customIndustryType}
                  onChange={handleChange}
                  placeholder="e.g. Bio-fertilizer Manufacturing, Glass Blowing, Battery Recycling, Agro-Processing..."
                  className="w-full px-4 py-2.5 rounded-xl border border-emerald-400 bg-white text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-medium shadow-2xs"
                  required
                />
              </motion.div>
            )}
          </div>

          {/* Section 3: Facility Location */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider border-b border-gray-100 pb-1">
              3. Facility Location
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700">Street / Industrial Estate</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
                    <FiMapPin className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Plot 44, GIDC Industrial Area"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-medium"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700">City / District</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Vadodara"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-medium"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 4: Waste Profile / Requirements */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider border-b border-gray-100 pb-1">
              4. Material & Facility Profile
            </h3>

            {(accountType === 'buyer' || accountType === 'both') && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700">Required Secondary Waste Types / Feedstock</label>
                <input
                  type="text"
                  name="neededWasteTypes"
                  value={formData.neededWasteTypes}
                  onChange={handleChange}
                  placeholder="e.g. Fly Ash, PET Scrap, Copper Slag, Blast Furnace Slag, E-Waste"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-medium"
                />
              </div>
            )}

            {(accountType === 'seller' || accountType === 'both') && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700">Primary Waste / Byproduct Stream Produced</label>
                <input
                  type="text"
                  name="neededWasteTypes"
                  value={formData.neededWasteTypes}
                  onChange={handleChange}
                  placeholder="e.g. Chemical Sludge, Plastic Regrind, Fly Ash, Metal Offcuts"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-medium"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700">Company Overview & Facility Description</label>
              <textarea
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                placeholder="Briefly describe your plant's manufacturing operations and circular material objectives..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-medium resize-none"
              ></textarea>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3.5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
              isLoading
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : accountType === 'sender'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-teal-700 hover:bg-teal-800 text-white'
            }`}
          >
            {isLoading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
            ) : (
              <span>Complete Company Registration &rarr;</span>
            )}
          </button>
        </form>

        {/* Existing account link */}
        <div className="text-center text-xs text-gray-600 font-medium pt-2 border-t border-gray-100">
          Already registered?{' '}
          <Link to="/login" className="text-emerald-700 font-bold hover:underline">
            Sign In to Your Industry Account
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
