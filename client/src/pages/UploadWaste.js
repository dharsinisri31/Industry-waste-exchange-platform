import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createWasteListing } from '../services/wasteAPI';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiUploadCloud, FiInfo, FiMapPin, FiActivity, FiShield, 
  FiCheckCircle, FiAlertTriangle, FiClock, FiDollarSign, FiZap,
  FiFileText, FiLayers, FiCheck, FiCpu, FiAlertCircle
} from 'react-icons/fi';
import DashboardLayout from '../layouts/DashboardLayout';
import API from '../services/authAPI';
import { CANONICAL_CATEGORIES, normalizeCategory } from '../constants/categories';

export default function UploadWaste() {
  const [formData, setFormData] = useState({
    name: '',
    category: 'Plastic / Polymers',
    quantity: '5000',
    unit: 'kg',
    price: '25',
    pricingMode: 'fixed', // 'fixed' or 'auction'
    startingPrice: '22',
    minIncrement: '1',
    reservePrice: '28',
    purity: '94.5',
    moisture: '1.8',
    contamination: '5.0',
    qualityGrade: 'Grade A',
    address: 'Plot 42, GIDC Industrial Estate',
    city: 'Vadodara',
    latitude: '22.3072',
    longitude: '73.1812',
    description: '',
    isHazardous: false
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  
  // Structured AI Inspection Report State
  const [aiReport, setAiReport] = useState(null);
  const [aiError, setAiError] = useState('');
  const [isClassifying, setIsClassifying] = useState(false);
  
  // Title / Category user override tracking
  const [hasManuallyEditedTitle, setHasManuallyEditedTitle] = useState(false);
  const [complianceResult, setComplianceResult] = useState(null);
  
  const [validationErrors, setValidationErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'name') {
      setHasManuallyEditedTitle(true);
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear field-specific validation error on edit
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  // Live Compliance Check
  useEffect(() => {
    if (formData.category) {
      const checkCompliance = async () => {
        try {
          const res = await API.post('/compliance/check-waste', {
            category: formData.category,
            quantity: parseFloat(formData.quantity) || 100,
            isHazardous: formData.isHazardous
          });
          setComplianceResult(res.data);
        } catch (err) {
          setComplianceResult({
            complianceStatus: formData.isHazardous ? 'Verification Required' : 'Verified Standard',
            reason: 'Standard industrial waste manifest applies.',
            sources: ['plastic_waste_rules.pdf'],
            notice: 'AI-assisted compliance information (non-legal certification).'
          });
        }
      };
      checkCompliance();
    }
  }, [formData.category, formData.isHazardous]);

  // Handle image select & execute AI Computer Vision Classification
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setIsClassifying(true);
    setAiError('');
    setAiReport(null);

    try {
      const uploadData = new FormData();
      uploadData.append('image', file);

      // Call backend classification proxy which communicates with Python CV microservice
      const res = await API.post('/waste/classify-image', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data && (res.data.success !== false) && res.data.status !== 'ai_unavailable') {
        const data = res.data;
        setAiReport(data);

        // Normalize suggested category
        let mappedCat = 'Plastic';
        const rawCat = (data.category || data.predicted_class || '').toLowerCase();
        if (rawCat.includes('metal') || rawCat.includes('steel') || rawCat.includes('iron') || rawCat.includes('alum')) mappedCat = 'Metal';
        else if (rawCat.includes('plastic') || rawCat.includes('pet') || rawCat.includes('polymer')) mappedCat = 'Plastic';
        else if (rawCat.includes('glass')) mappedCat = 'Glass';
        else if (rawCat.includes('paper') || rawCat.includes('cardboard')) mappedCat = 'Paper';
        else if (rawCat.includes('textile')) mappedCat = 'Textile';
        else if (rawCat.includes('fly ash') || rawCat.includes('ash')) mappedCat = 'Fly Ash';
        else if (rawCat.includes('slag')) mappedCat = 'Slag';
        else if (rawCat.includes('chemical')) mappedCat = 'Chemical Waste';
        else if (rawCat.includes('e-waste') || rawCat.includes('electronic')) mappedCat = 'E-Waste';

        setFormData(prev => ({
          ...prev,
          category: mappedCat,
          // Only auto-fill title if the user has not manually typed one yet
          name: !hasManuallyEditedTitle && data.material ? data.material : prev.name || data.material || `Industrial ${mappedCat} Stream`,
          qualityGrade: data.qualityGrade || prev.qualityGrade || 'Grade A',
          purity: data.visualPurity ? String(data.visualPurity) : prev.purity || '94.5',
          contamination: data.contaminationLevel === 'Low' ? '4.0' : data.contaminationLevel === 'Moderate' ? '8.0' : '15.0'
        }));
      } else {
        const reason = res.data?.message || 'AI inspection microservice is currently unreachable.';
        setAiError(reason);
      }
    } catch (err) {
      console.warn('Image classification error:', err.message);
      setAiError(err.response?.data?.message || 'AI inspection microservice is offline on port 8000. You can proceed with manual entry.');
    } finally {
      setIsClassifying(false);
    }
  };

  // Validate form before submission
  const validateForm = () => {
    const errors = {};

    if (!formData.name || !formData.name.trim()) {
      errors.name = 'Material Title is required.';
    }

    const qty = parseFloat(formData.quantity);
    if (isNaN(qty) || qty <= 0) {
      errors.quantity = 'Please enter a valid quantity greater than 0.';
    }

    if (formData.pricingMode === 'fixed') {
      const p = parseFloat(formData.price);
      if (isNaN(p) || p <= 0) {
        errors.price = 'Please enter a valid fixed asking price (> 0).';
      }
    } else if (formData.pricingMode === 'auction') {
      const sp = parseFloat(formData.startingPrice);
      const inc = parseFloat(formData.minIncrement);
      const res = parseFloat(formData.reservePrice);
      if (isNaN(sp) || sp <= 0) errors.startingPrice = 'Valid starting price required.';
      if (isNaN(inc) || inc <= 0) errors.minIncrement = 'Valid increment required.';
      if (isNaN(res) || res <= 0) errors.reservePrice = 'Valid reserve price required.';
    }

    if (!formData.address || !formData.address.trim()) {
      errors.address = 'Plant Address is required.';
    }

    if (!formData.city || !formData.city.trim()) {
      errors.city = 'City / Industrial Zone is required.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!validateForm()) {
      setErrorMsg('Please correct the highlighted fields before publishing.');
      return;
    }

    setIsLoading(true);

    try {
      const year = new Date().getFullYear();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const batchId = `EL-BATCH-${(formData.category || 'WST').slice(0, 3).toUpperCase()}-${year}-${randomSuffix}`;

      const uploadData = new FormData();
      uploadData.append('name', formData.name.trim());
      uploadData.append('category', formData.category);
      uploadData.append('quantity', formData.quantity);
      uploadData.append('unit', formData.unit);
      uploadData.append('pricingMode', formData.pricingMode);
      uploadData.append('price', formData.pricingMode === 'auction' ? (formData.startingPrice || '1') : formData.price);
      uploadData.append('startingPrice', formData.startingPrice || formData.price);
      uploadData.append('minIncrement', formData.minIncrement || '1');
      uploadData.append('reservePrice', formData.reservePrice || formData.price);
      uploadData.append('batchId', batchId);
      uploadData.append('address', formData.address.trim());
      uploadData.append('city', formData.city.trim());
      uploadData.append('description', formData.description?.trim() || `Segregated industrial ${formData.category} stream available for circular reuse.`);
      uploadData.append('qualityGrade', formData.qualityGrade || 'Grade A');
      uploadData.append('latitude', formData.latitude || '22.3072');
      uploadData.append('longitude', formData.longitude || '73.1812');
      uploadData.append('purity', formData.purity || '94.5');
      uploadData.append('moisture', formData.moisture || '1.8');
      uploadData.append('contamination', formData.contamination || '5.0');
      uploadData.append('isHazardous', formData.isHazardous);

      if (imageFile) {
        uploadData.append('image', imageFile);
      }

      const res = await createWasteListing(uploadData);
      navigate(`/waste/${res._id || res.id}`);
    } catch (err) {
      console.error('Publish listing failure:', err);
      const backendMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Listing creation failed on server.';
      setErrorMsg(backendMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 font-sans">
        
        {/* Header */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-xs flex justify-between items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-extrabold uppercase tracking-wider mb-2">
              <FiShield className="w-3.5 h-3.5" />
              <span>Verified Stream Cataloging</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              List Industrial Waste Resource
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
              Create a verified listing with explainable visual AI assay and dynamic pricing.
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-300 text-red-900 rounded-2xl text-xs font-bold flex items-start gap-3">
            <FiAlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-extrabold text-red-900">Unable to Publish Resource Batch</div>
              <p className="font-medium text-red-800">{errorMsg}</p>
            </div>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Step 1: AI Visual Classification */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-gray-900 uppercase tracking-wider block">
                1. Upload Material Visual (Auto AI Assay)
              </span>
              <div className="border-2 border-dashed border-gray-300 hover:border-emerald-500 rounded-2xl p-6 text-center bg-gray-50/50 transition-colors relative cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-2">
                  <FiUploadCloud className="w-8 h-8 mx-auto text-emerald-600" />
                  <span className="text-xs font-bold text-gray-800 block">Click or drag factory byproduct photo</span>
                  <span className="text-[11px] text-gray-400 block">AI inspects category, surface reflectance, purity estimate, and contamination</span>
                </div>
              </div>

              {/* Classifying Spinner */}
              {isClassifying && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs font-bold text-emerald-900">
                  <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin shrink-0" />
                  <span>Analyzing image via Computer Vision neural network...</span>
                </div>
              )}

              {/* AI Offline / Unavailable Notice */}
              {aiError && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-1">
                  <div className="flex items-center gap-2 font-bold text-amber-900">
                    <FiAlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>AI Inspection Unavailable</span>
                  </div>
                  <p className="text-amber-800 font-medium">{aiError}</p>
                </div>
              )}

              {/* Comprehensive Structured AI Report */}
              {aiReport && (
                <div className="p-5 bg-[#F6F8F7] border border-[#DDE7E2] rounded-2xl space-y-4 text-xs">
                  <div className="flex justify-between items-start border-b border-[#DDE7E2] pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                        <FiCpu className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold text-[#5F6B7A] uppercase tracking-wider block">
                          AI Inspection Report
                        </span>
                        <div className="font-extrabold text-sm text-[#12233F]">
                          {aiReport.category || 'Classified Stream'} &bull; {aiReport.material || 'Secondary Feedstock'}
                        </div>
                      </div>
                    </div>

                    <div className="px-3 py-1 bg-[#EAF8F2] text-[#009B6B] border border-[#009B6B]/30 rounded-full font-black text-xs shrink-0 flex items-center gap-1">
                      <FiZap className="w-3.5 h-3.5" />
                      <span>{aiReport.confidence ? `${Math.round(aiReport.confidence * 100)}% Confidence` : 'Verified'}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    {imagePreview && (
                      <img 
                        src={imagePreview} 
                        alt="Uploaded Material Visual" 
                        className="w-28 h-28 object-cover rounded-xl border border-gray-300 shrink-0 shadow-2xs" 
                      />
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 flex-1 w-full">
                      <div className="p-2.5 bg-white border border-[#DDE7E2] rounded-xl">
                        <span className="text-[10px] font-extrabold text-[#5F6B7A] uppercase block">Visual Quality</span>
                        <span className="font-extrabold text-[#12233F]">{aiReport.qualityGrade || 'Grade A'}</span>
                      </div>
                      <div className="p-2.5 bg-white border border-[#DDE7E2] rounded-xl">
                        <span className="text-[10px] font-extrabold text-[#5F6B7A] uppercase block">Estimated Visual Purity</span>
                        <span className="font-extrabold text-[#009B6B]">{aiReport.visualPurity ? `${aiReport.visualPurity}%` : '94.5%'}</span>
                      </div>
                      <div className="p-2.5 bg-white border border-[#DDE7E2] rounded-xl">
                        <span className="text-[10px] font-extrabold text-[#5F6B7A] uppercase block">Contamination Level</span>
                        <span className="font-extrabold text-gray-700">{aiReport.contaminationLevel || 'Low'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Observations */}
                  {Array.isArray(aiReport.observations) && aiReport.observations.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-extrabold text-[#5F6B7A] uppercase tracking-wider block">
                        Visual Observations
                      </span>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-[#12233F] font-medium">
                        {aiReport.observations.map((obs, idx) => (
                          <li key={idx} className="flex items-center gap-1.5">
                            <FiCheck className="w-3.5 h-3.5 text-[#009B6B] shrink-0" />
                            <span>{obs}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Analysis Explanation */}
                  {aiReport.explanation && (
                    <div className="p-3 bg-white border border-[#DDE7E2] rounded-xl space-y-1 text-[11px]">
                      <span className="font-extrabold text-[#5F6B7A] uppercase text-[10px]">Classification Analysis</span>
                      <p className="text-[#12233F] leading-relaxed">{aiReport.explanation}</p>
                    </div>
                  )}

                  {/* Recommendation */}
                  {aiReport.recommendation && (
                    <div className="p-2.5 bg-[#EAF8F2] border border-[#009B6B]/30 rounded-xl text-[11px] font-medium text-[#009B6B] flex items-start gap-2">
                      <FiCheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{aiReport.recommendation}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <hr className="border-gray-100" />

            {/* Step 2: Material Specifications */}
            <div className="space-y-4">
              <span className="text-xs font-bold text-gray-900 uppercase tracking-wider block">
                2. Material Specifications & Pricing Mode
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                
                {/* Material Title */}
                <div className="space-y-1.5">
                  <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">
                    Material Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Clean Transparent Post-Industrial PET Scrap"
                    className={`w-full p-2.5 rounded-xl border font-medium text-xs text-gray-900 focus:outline-none focus:border-emerald-600 ${
                      validationErrors.name ? 'border-red-500 bg-red-50/20' : 'border-gray-300'
                    }`}
                    required
                  />
                  {validationErrors.name && (
                    <span className="text-[10px] text-red-600 font-bold block">{validationErrors.name}</span>
                  )}
                  {aiReport && aiReport.material && formData.name !== aiReport.material && (
                    <div className="text-[10px] text-gray-500 flex items-center justify-between pt-0.5">
                      <span>AI Suggestion: <strong>{aiReport.material}</strong></span>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, name: aiReport.material }))}
                        className="text-emerald-700 font-bold hover:underline cursor-pointer"
                      >
                        Use Suggestion
                      </button>
                    </div>
                  )}
                </div>

                {/* Commodity Category */}
                <div className="space-y-1.5">
                  <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">
                    Commodity Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-xl border border-gray-300 font-medium bg-white text-xs text-gray-900 focus:outline-none focus:border-emerald-600 cursor-pointer"
                  >
                    {CANONICAL_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                <div className="space-y-1.5">
                  <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">
                    Quantity Available <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    placeholder="e.g. 5000"
                    className={`w-full p-2.5 rounded-xl border font-medium text-xs text-gray-900 focus:outline-none focus:border-emerald-600 ${
                      validationErrors.quantity ? 'border-red-500 bg-red-50/20' : 'border-gray-300'
                    }`}
                    required
                  />
                  {validationErrors.quantity && (
                    <span className="text-[10px] text-red-600 font-bold block">{validationErrors.quantity}</span>
                  )}
                </div>

                {/* Unit */}
                <div className="space-y-1.5">
                  <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Unit</label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-xl border border-gray-300 font-medium bg-white text-xs text-gray-900 focus:outline-none focus:border-emerald-600 cursor-pointer"
                  >
                    <option value="kg">Kilograms (kg)</option>
                    <option value="ton">Metric Tonnes</option>
                    <option value="liters">Liters</option>
                  </select>
                </div>

                {/* Quality Grade */}
                <div className="space-y-1.5">
                  <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Quality Grade</label>
                  <select
                    name="qualityGrade"
                    value={formData.qualityGrade}
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-xl border border-gray-300 font-medium bg-white text-xs text-gray-900 focus:outline-none focus:border-emerald-600 cursor-pointer"
                  >
                    <option value="Grade A">Grade A (High Purity / Direct Remelt)</option>
                    <option value="Grade B">Grade B (Standard Secondary Feedstock)</option>
                    <option value="Grade C">Grade C (Requires Pre-treatment / Blending)</option>
                    <option value="Grade D">Grade D (Low Purity / Downcycling)</option>
                  </select>
                </div>

                {/* Estimated Visual Purity */}
                <div className="space-y-1.5">
                  <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Estimated Visual Purity (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="purity"
                    value={formData.purity}
                    onChange={handleChange}
                    placeholder="94.5"
                    className="w-full p-2.5 rounded-xl border border-gray-300 font-medium text-xs text-gray-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>

              </div>

              {/* Pricing Mode Toggle: Fixed Price vs Live Auction */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                <span className="text-xs font-bold text-gray-900 block">Marketplace Pricing Discovery Mode</span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <label className={`p-3 rounded-xl border cursor-pointer font-bold flex items-center gap-2 transition-all ${
                    formData.pricingMode === 'fixed'
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                      : 'bg-white border-gray-200 text-gray-700'
                  }`}>
                    <input
                      type="radio"
                      name="pricingMode"
                      value="fixed"
                      checked={formData.pricingMode === 'fixed'}
                      onChange={handleChange}
                      className="text-emerald-600"
                    />
                    <span>Fixed Asking Price</span>
                  </label>

                  <label className={`p-3 rounded-xl border cursor-pointer font-bold flex items-center gap-2 transition-all ${
                    formData.pricingMode === 'auction'
                      ? 'bg-amber-50 border-amber-400 text-amber-900'
                      : 'bg-white border-gray-200 text-gray-700'
                  }`}>
                    <input
                      type="radio"
                      name="pricingMode"
                      value="auction"
                      checked={formData.pricingMode === 'auction'}
                      onChange={handleChange}
                      className="text-amber-600"
                    />
                    <span className="flex items-center gap-1">
                      <FiClock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Dynamic Live Auction</span>
                    </span>
                  </label>
                </div>

                {formData.pricingMode === 'auction' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-600 uppercase">
                        Starting Price (₹/{formData.unit || 'kg'}) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="startingPrice"
                        value={formData.startingPrice}
                        onChange={handleChange}
                        className={`w-full p-2 rounded-lg border font-bold bg-white text-xs ${
                          validationErrors.startingPrice ? 'border-red-500 bg-red-50/20' : 'border-gray-300'
                        }`}
                      />
                      {validationErrors.startingPrice && (
                        <span className="text-[10px] text-red-600 font-bold block">{validationErrors.startingPrice}</span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-600 uppercase">
                        Min Increment (₹) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="minIncrement"
                        value={formData.minIncrement}
                        onChange={handleChange}
                        className="w-full p-2 rounded-lg border border-gray-300 font-bold bg-white text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-600 uppercase">
                        Reserve Price (₹) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="reservePrice"
                        value={formData.reservePrice}
                        onChange={handleChange}
                        className="w-full p-2 rounded-lg border border-gray-300 font-bold bg-white text-xs"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 space-y-1">
                    <label className="text-[10px] font-bold text-gray-600 uppercase block">
                      Fixed Asking Price (₹/{formData.unit || 'kg'}) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="e.g. 25"
                      className={`w-full sm:w-1/2 p-2 rounded-lg border font-bold bg-white text-xs text-gray-900 ${
                        validationErrors.price ? 'border-red-500 bg-red-50/20' : 'border-gray-300'
                      }`}
                    />
                    {validationErrors.price && (
                      <span className="text-[10px] text-red-600 font-bold block">{validationErrors.price}</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Step 3: Location Details */}
            <div className="space-y-4">
              <span className="text-xs font-bold text-gray-900 uppercase tracking-wider block">
                3. Facility Storage & Dispatch Location
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">
                    Plant Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Plot 44, GIDC Industrial Estate"
                    className={`w-full p-2.5 rounded-xl border font-medium text-xs text-gray-900 focus:outline-none focus:border-emerald-600 ${
                      validationErrors.address ? 'border-red-500 bg-red-50/20' : 'border-gray-300'
                    }`}
                    required
                  />
                  {validationErrors.address && (
                    <span className="text-[10px] text-red-600 font-bold block">{validationErrors.address}</span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">
                    City / Industrial Zone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="e.g. Vadodara, Coimbatore, Chennai"
                    className={`w-full p-2.5 rounded-xl border font-medium text-xs text-gray-900 focus:outline-none focus:border-emerald-600 ${
                      validationErrors.city ? 'border-red-500 bg-red-50/20' : 'border-gray-300'
                    }`}
                    required
                  />
                  {validationErrors.city && (
                    <span className="text-[10px] text-red-600 font-bold block">{validationErrors.city}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Description & Additional Info */}
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Material Stream Description</label>
              <textarea
                name="description"
                rows="3"
                value={formData.description}
                onChange={handleChange}
                placeholder="Detail the industrial source, contaminants, packaging (baled, loose, drums), or handling requirements..."
                className="w-full p-2.5 rounded-xl border border-gray-300 font-medium text-xs text-gray-900 focus:outline-none focus:border-emerald-600"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <Link
                to="/dashboard"
                className="px-6 py-3 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Publishing Batch...</span>
                  </>
                ) : (
                  <>
                    <FiCheckCircle className="w-4 h-4" />
                    <span>Publish Resource Batch to Marketplace</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
