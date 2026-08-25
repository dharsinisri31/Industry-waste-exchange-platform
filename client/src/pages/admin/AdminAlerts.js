import React, { useState, useEffect } from 'react';
import API from '../../services/authAPI';
import AdminLayout from '../../layouts/AdminLayout';
import Loader from '../../components/Loader';
import { 
  FiAlertTriangle, FiCheckCircle, FiRefreshCw, 
  FiShield, FiInfo, FiAlertOctagon, FiCheck 
} from 'react-icons/fi';

export default function AdminAlerts() {
  const [loading, setLoading] = useState(true);
  const [anomalies, setAnomalies] = useState([]);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [notification, setNotification] = useState('');

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 5000);
  };

  const fetchAnomalies = async () => {
    try {
      setLoading(true);
      const res = await API.get('/admin/anomalies');
      setAnomalies(res.data?.anomalies || res.data || []);
    } catch (err) {
      console.warn('Failed to load anomalies:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnomalies();
  }, []);

  const handleResolveAlert = (id) => {
    setAnomalies(prev => prev.filter(a => (a.id || a._id) !== id));
    showNotification('Alert marked as resolved.');
  };

  const alerts = anomalies.length > 0 ? anomalies : [
    {
      id: 'alt-01',
      severity: 'warning',
      type: 'Listing Classification Mismatch',
      entity: 'Aluminium Foundry Dross (Listing #982)',
      description: 'Uploaded visual evidence suggests Grade B dross while listed as Grade A high-purity.',
      time: '1 hour ago',
      status: 'Under Review'
    },
    {
      id: 'alt-02',
      severity: 'info',
      type: 'EPR Statutory Renewal',
      entity: 'Gujarat Polymers Inc.',
      description: 'Extended Producer Responsibility authorization valid for 30 more days.',
      time: '4 hours ago',
      status: 'New'
    }
  ];

  const filteredAlerts = alerts.filter(a => severityFilter === 'all' || a.severity === severityFilter);

  return (
    <AdminLayout>
      <div className="space-y-6 font-sans">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Alerts & Risk Management
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 font-medium mt-1">
              Review platform issues, suspicious activity, verification risks and operational exceptions.
            </p>
          </div>

          <button
            onClick={() => { fetchAnomalies(); showNotification('Alerts stream refreshed.'); }}
            className="p-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 transition-all cursor-pointer"
            title="Refresh Alerts"
          >
            <FiRefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Notification Banner */}
        {notification && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2">
            <FiCheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex gap-3">
          <button
            onClick={() => setSeverityFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              severityFilter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Alerts ({alerts.length})
          </button>
          <button
            onClick={() => setSeverityFilter('critical')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              severityFilter === 'critical' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Critical
          </button>
          <button
            onClick={() => setSeverityFilter('warning')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              severityFilter === 'warning' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Warnings
          </button>
          <button
            onClick={() => setSeverityFilter('info')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              severityFilter === 'info' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Information
          </button>
        </div>

        {/* Alerts List */}
        <div className="space-y-3">
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-emerald-300 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl mt-0.5 ${
                    alert.severity === 'critical'
                      ? 'bg-red-100 text-red-700'
                      : alert.severity === 'warning'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {alert.severity === 'critical' ? <FiAlertOctagon className="w-5 h-5" /> : <FiAlertTriangle className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-gray-900">{alert.type}</span>
                      <span className="text-[10px] font-bold text-gray-500 font-mono">&bull; {alert.entity}</span>
                    </div>
                    <p className="text-xs text-gray-600 font-medium mt-1 leading-relaxed max-w-2xl">
                      {alert.description}
                    </p>
                    <span className="text-[10px] text-gray-400 font-semibold block mt-1">{alert.time}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-gray-100 text-gray-800">
                    {alert.status}
                  </span>
                  <button
                    onClick={() => handleResolveAlert(alert.id)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <FiCheck className="w-3.5 h-3.5" />
                    <span>Resolve</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white p-12 rounded-3xl border border-gray-200 text-center space-y-2">
              <FiCheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
              <h3 className="text-base font-bold text-gray-900">No active alerts</h3>
              <p className="text-xs text-gray-500">The platform is operating within normal parameters.</p>
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
}
