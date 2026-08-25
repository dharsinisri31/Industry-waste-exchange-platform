import React, { useState, useEffect } from 'react';
import API from '../../services/authAPI';
import AdminLayout from '../../layouts/AdminLayout';
import Loader from '../../components/Loader';
import { 
  FiSettings, FiCheckCircle, FiShield, FiGlobe, FiSave, FiRefreshCw 
} from 'react-icons/fi';

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    autoApproveListings: false,
    requireCompanyVerification: true,
    requireListingVerification: true,
    maxSearchRadiusKm: 300,
    minPurityThreshold: 60,
    notificationAlerts: true,
    emailNotifications: true,
    standardUnits: ['kg', 'ton', 'liter', 'drum'],
    currency: 'INR (₹)'
  });
  const [notification, setNotification] = useState('');

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 5000);
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await API.get('/admin/settings');
      if (res.data) setSettings(prev => ({ ...prev, ...res.data }));
    } catch (err) {
      console.warn('Failed to load settings:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await API.put('/admin/settings', settings);
      showNotification('Platform configuration updated successfully.');
    } catch (err) {
      alert(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 font-sans max-w-4xl">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-3xl border border-[#DDE7E2] shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#12233F] tracking-tight">
              Platform Settings
            </h1>
            <p className="text-xs text-[#5F6B7A] font-medium mt-1">
              Configure marketplace rules, verification policies, and GIS search parameters.
            </p>
          </div>
        </div>

        {/* Notification Banner */}
        {notification && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2">
            <FiCheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Section 1: Marketplace & Moderation Settings */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-sm font-extrabold text-gray-900 pb-2 border-b border-gray-100 flex items-center gap-2">
              <FiShield className="text-emerald-700 w-4 h-4" />
              <span>Marketplace & Moderation Rules</span>
            </h2>

            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-200 cursor-pointer">
                <div>
                  <span className="font-bold text-gray-900 block">Require Administrator Approval for New Listings</span>
                  <span className="text-gray-500 text-[11px]">Listings remain in pending state until verified by a platform operator.</span>
                </div>
                <input
                  type="checkbox"
                  checked={!settings.autoApproveListings}
                  onChange={(e) => setSettings({ ...settings, autoApproveListings: !e.target.checked })}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-200 cursor-pointer">
                <div>
                  <span className="font-bold text-gray-900 block">Enforce Facility Regulatory Verification</span>
                  <span className="text-gray-500 text-[11px]">Require CIN/GSTIN check before enabling listing and procurement actions.</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.requireCompanyVerification}
                  onChange={(e) => setSettings({ ...settings, requireCompanyVerification: e.target.checked })}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
              </label>
            </div>
          </div>

          {/* Section 2: GIS Logistics & Environmental Calculation */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-sm font-extrabold text-gray-900 pb-2 border-b border-gray-100 flex items-center gap-2">
              <FiGlobe className="text-teal-700 w-4 h-4" />
              <span>GIS Logistics & Matching Parameters</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Maximum Search Radius (km)</label>
                <input
                  type="number"
                  value={settings.maxSearchRadiusKm || 300}
                  onChange={(e) => setSettings({ ...settings, maxSearchRadiusKm: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-gray-300 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Minimum Purity Threshold (%)</label>
                <input
                  type="number"
                  value={settings.minPurityThreshold || 60}
                  onChange={(e) => setSettings({ ...settings, minPurityThreshold: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-gray-300 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <FiSave className="w-4 h-4" />
              <span>{saving ? 'Saving Changes...' : 'Save Configuration'}</span>
            </button>
          </div>

        </form>
      </div>
    </AdminLayout>
  );
}
