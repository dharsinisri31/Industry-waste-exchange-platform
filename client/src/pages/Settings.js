import React, { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { FiBell, FiShield, FiCheckCircle } from 'react-icons/fi';

export default function Settings() {
  const { user } = useAuth();
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [matchNotifications, setMatchNotifications] = useState(true);
  const [savedMsg, setSavedMsg] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    setSavedMsg('Settings saved successfully!');
    setTimeout(() => setSavedMsg(''), 4000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Platform Settings</h1>
          <p className="text-xs text-gray-600 font-medium">Configure notification channels and account privacy options.</p>
        </div>

        {savedMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
            <FiCheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{savedMsg}</span>
          </div>
        )}

        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xs space-y-6">
          {/* Notification Preferences */}
          <div className="space-y-4 pb-4 border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <FiBell className="text-emerald-600 w-4 h-4" /> Notifications & Alerts
            </h3>
            
            <label className="flex items-center justify-between text-xs text-gray-700 font-medium cursor-pointer">
              <span>Receive email notifications on symbiosis matches</span>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
            </label>

            <label className="flex items-center justify-between text-xs text-gray-700 font-medium cursor-pointer">
              <span>Real-time in-app trade updates</span>
              <input
                type="checkbox"
                checked={matchNotifications}
                onChange={(e) => setMatchNotifications(e.target.checked)}
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
            </label>
          </div>

          {/* Account & Security */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <FiShield className="text-teal-600 w-4 h-4" /> Security & Account
            </h3>
            <div className="text-xs text-gray-600 font-medium space-y-1.5 p-3.5 bg-gray-50 rounded-xl border border-gray-200">
              <div>Account Role: <span className="font-extrabold text-gray-900 capitalize">{user?.role?.replace('_', ' ') || 'User'}</span></div>
              <div>Account Email: <span className="font-bold text-gray-900">{user?.email}</span></div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleSave}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition-all cursor-pointer shadow-2xs"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
