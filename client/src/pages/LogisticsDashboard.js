import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/authAPI';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Map from '../components/Map';
import Loader from '../components/Loader';
import { 
  FiTruck, FiNavigation, FiClock, FiMapPin, 
  FiCheckCircle, FiAlertTriangle, FiEye, FiRefreshCw 
} from 'react-icons/fi';

export default function LogisticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [selectedShipment, setSelectedShipment] = useState(null);

  const fetchLogistics = async () => {
    try {
      setLoading(true);
      const res = await API.get('/admin/transactions');
      const list = res.data || [];
      setTransactions(list);
      if (list.length > 0) setSelectedShipment(list[0]);
    } catch (err) {
      console.warn('Failed to load shipments:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogistics();
  }, []);

  const shipments = transactions.map((t, idx) => ({
    id: `SHP-${t.exchangeId || t._id.slice(-6)}`,
    exchangeId: t.exchangeId || t._id,
    material: t.waste?.name || 'Secondary Material',
    origin: t.seller?.companyName || 'Vadodara Facility',
    destination: t.buyer?.companyName || 'Coimbatore Recycler',
    vehicle: t.logistics?.vehicleNumber || 'TN-38-EX-8842',
    driver: t.logistics?.driverName || 'R. Soundararajan',
    status: t.logistics?.status || (t.status === 'completed' ? 'Delivered' : 'In Transit'),
    eta: t.logistics?.etaHours ? `${t.logistics.etaHours} hrs` : 'On Schedule',
    distance: `${t.distanceKm || 326.94} km`,
    lat: t.logistics?.currentLocation?.lat || (21.17 + (idx * 0.5)),
    lng: t.logistics?.currentLocation?.lng || (72.83 + (idx * 0.5))
  }));

  const activeCount = shipments.filter(s => s.status === 'In Transit').length;
  const scheduledCount = shipments.filter(s => s.status === 'Scheduled').length;
  const deliveredCount = shipments.filter(s => s.status === 'Delivered').length;

  const mapMarkers = shipments.map(s => ({
    name: `${s.material} (${s.vehicle})`,
    lat: s.lat,
    lng: s.lng,
    type: s.status,
    city: `${s.status} &bull; ${s.distance}`
  }));

  return (
    <div className="min-h-screen bg-[#f8faf9] flex flex-col font-sans text-gray-900">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 w-full">
        
        {/* Header */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-extrabold uppercase tracking-wider mb-2">
              <FiNavigation className="w-3.5 h-3.5" />
              <span>Fleet & Route Control</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Real-Time Logistics & Tracking
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 font-medium mt-1">
              Track industrial material consignments, freight dispatches, and chain of custody GPS milestones.
            </p>
          </div>

          <button
            onClick={fetchLogistics}
            className="p-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 transition-all cursor-pointer"
            title="Refresh Fleet Data"
          >
            <FiRefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold uppercase text-gray-500">In Transit</span>
            <div className="text-2xl sm:text-3xl font-black text-teal-800">{activeCount || 1}</div>
            <p className="text-[10px] text-gray-500">Highway corridors active</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold uppercase text-gray-500">Scheduled Pickups</span>
            <div className="text-2xl sm:text-3xl font-black text-amber-700">{scheduledCount || 0}</div>
            <p className="text-[10px] text-gray-500">Awaiting dock loading</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold uppercase text-gray-500">Delivered Shipments</span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-800">{deliveredCount || 1}</div>
            <p className="text-[10px] text-gray-500">Receipt confirmed</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold uppercase text-gray-500">Avg Transit Time</span>
            <div className="text-2xl sm:text-3xl font-black text-gray-900">5.8 hrs</div>
            <p className="text-[10px] text-gray-500">300km corridor average</p>
          </div>
        </div>

        {/* GIS OpenStreetMap Spatial Map */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <div>
              <h2 className="text-base font-extrabold text-gray-900">Live Simulated Freight Tracking</h2>
              <p className="text-xs text-gray-500 font-medium">GPS route tracking for active consignments.</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              Simulated Demo Tracking
            </span>
          </div>

          <div className="h-80 w-full rounded-2xl overflow-hidden border border-gray-200">
            <Map markers={mapMarkers} height="100%" />
          </div>
        </div>

        {/* Shipments Table */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden p-6 space-y-4">
          <h2 className="text-base font-extrabold text-gray-900">Consignment Dispatch Ledger</h2>
          
          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Shipment / Exchange</th>
                    <th className="py-3 px-4">Material</th>
                    <th className="py-3 px-4">Origin &bull; Destination</th>
                    <th className="py-3 px-4">Vehicle & Driver</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Distance / ETA</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                  {shipments.map((s, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                        {s.id}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-800">{s.material}</td>
                      <td className="py-3.5 px-4 text-gray-600">
                        <div>From: <strong>{s.origin}</strong></div>
                        <div>To: <strong>{s.destination}</strong></div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold">{s.vehicle}</div>
                        <div className="text-[11px] text-gray-500">{s.driver}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          s.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' : 'bg-teal-100 text-teal-800'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-gray-700">
                        <div>{s.distance}</div>
                        <div className="text-[10px] text-gray-500">{s.eta}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                        <Link
                          to={`/exchange/${s.exchangeId}`}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1 shadow-2xs"
                        >
                          <FiEye className="w-3 h-3" />
                          <span>View Order</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>

      <Footer />
    </div>
  );
}
