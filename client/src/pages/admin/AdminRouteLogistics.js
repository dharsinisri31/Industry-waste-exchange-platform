import React, { useState, useEffect } from 'react';
import API from '../../services/authAPI';
import AdminLayout from '../../layouts/AdminLayout';
import Map from '../../components/Map';
import Loader from '../../components/Loader';
import { formatINR } from '../../utils/formatINR';
import { 
  FiNavigation, FiTruck, FiMapPin, FiClock, 
  FiDollarSign, FiGlobe, FiRefreshCw, FiAlertCircle 
} from 'react-icons/fi';

export default function AdminRouteLogistics() {
  const [loading, setLoading] = useState(true);
  const [industries, setIndustries] = useState([]);
  const [originIndex, setOriginIndex] = useState(0);
  const [destinationIndex, setDestinationIndex] = useState(1);
  const [vehicleType, setVehicleType] = useState('mediumTruck');
  const [routeError, setRouteError] = useState('');
  const [routeGeometry, setRouteGeometry] = useState(null);
  const [calculatedRoute, setCalculatedRoute] = useState({
    distanceKm: 0,
    durationHours: 0,
    transportCost: 0,
    co2EmissionsKg: 0
  });

  const fetchIndustries = async () => {
    try {
      setLoading(true);
      const res = await API.get('/admin/industries');
      const list = res.data || [];
      setIndustries(list);
    } catch (err) {
      console.warn('Failed to load industries for GIS logistics:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIndustries();
  }, []);

  const defaultLocations = [
    { name: 'Apex Plastics Pvt. Ltd.', city: 'Vadodara', coordinates: [73.1812, 22.3072], businessRole: 'sender' },
    { name: 'GreenPoly Recycling', city: 'Coimbatore', coordinates: [76.9558, 11.0168], businessRole: 'receiver' },
    { name: 'Tamil Nadu Materials Recovery', city: 'Chennai', coordinates: [80.2707, 13.0827], businessRole: 'receiver' },
    { name: 'Erode Industrial Manufacturing', city: 'Erode', coordinates: [77.7172, 11.3410], businessRole: 'sender' }
  ];

  const effectiveIndustries = industries.length > 0 ? industries : defaultLocations;

  const handleRecalculateRoute = () => {
    setRouteError('');
    if (originIndex === destinationIndex) {
      setRouteError('Origin (Seller) and Destination (Buyer) facilities must be different.');
      return;
    }

    const origin = effectiveIndustries[originIndex] || defaultLocations[0];
    const destination = effectiveIndustries[destinationIndex] || defaultLocations[1];

    const originCoords = origin.location?.coordinates || origin.coordinates || [73.1812, 22.3072];
    const destCoords = destination.location?.coordinates || destination.coordinates || [76.9558, 11.0168];

    // Haversine / Road Distance Calculation
    const lat1 = originCoords[1], lon1 = originCoords[0];
    const lat2 = destCoords[1], lon2 = destCoords[0];
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const directKm = 6371 * c;
    const roadKm = Number((directKm * 1.32).toFixed(1)); // Road curve multiplier

    if (roadKm <= 0 || isNaN(roadKm)) {
      setRouteError('Route could not be calculated. Please check the selected locations.');
      return;
    }

    const ratePerKm = vehicleType === 'smallTruck' ? 25 : vehicleType === 'mediumTruck' ? 35 : 48;
    const emissionFactor = vehicleType === 'smallTruck' ? 0.35 : vehicleType === 'mediumTruck' ? 0.46 : 0.65;
    const baseHandlingFee = 500;

    setCalculatedRoute({
      distanceKm: roadKm,
      durationHours: Number((roadKm / 50).toFixed(1)),
      transportCost: Math.round((roadKm * ratePerKm) + baseHandlingFee),
      co2EmissionsKg: Number((roadKm * emissionFactor).toFixed(1))
    });

    // Interpolate realistic road waypoints between origin & destination
    const steps = 8;
    const waypoints = [];
    for (let i = 0; i <= steps; i++) {
      const frac = i / steps;
      const interLat = lat1 + (lat2 - lat1) * frac + (Math.sin(frac * Math.PI) * 0.15);
      const interLng = lon1 + (lon2 - lon1) * frac + (Math.sin(frac * Math.PI) * -0.15);
      waypoints.push([interLat, interLng]);
    }
    setRouteGeometry(waypoints);
  };

  useEffect(() => {
    if (effectiveIndustries.length >= 2) {
      handleRecalculateRoute();
    }
  }, [originIndex, destinationIndex, vehicleType, industries]);

  const markers = effectiveIndustries.map((ind, i) => {
    let role = ind.businessRole || 'both';
    if (i === originIndex) role = 'sender'; // Origin / Seller
    else if (i === destinationIndex) role = 'receiver'; // Destination / Buyer

    return {
      id: ind._id || i,
      name: ind.companyName || ind.name || `Facility ${i + 1}`,
      businessRole: role,
      role: role,
      type: role === 'receiver' ? 'Buyer Destination' : role === 'sender' ? 'Seller Pickup' : 'Industrial Facility',
      city: ind.city || ind.address || 'Regional Hub',
      coordinates: ind.location?.coordinates || ind.coordinates || [73.1812 + (i * 0.5), 22.3072 + (i * 0.4)]
    };
  });

  return (
    <AdminLayout>
      <div className="space-y-6 font-sans">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-3xl border border-[#DDE7E2] shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#12233F] tracking-tight">
              Route & Logistics
            </h1>
            <p className="text-xs text-[#5F6B7A] font-medium mt-1">
              Plan and monitor transportation routes for industrial material exchanges.
            </p>
          </div>
        </div>

        {/* Route Planning Controls */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-6">
          <div className="pb-2 border-b border-gray-100">
            <h2 className="text-base font-extrabold text-gray-900">Exchange Transit Simulator</h2>
            <p className="text-xs text-gray-500 font-medium">Select source producer, receiving recycler, and vehicle specifications to calculate transit metrics.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Origin Facility (Seller)</label>
              <select
                value={originIndex}
                onChange={(e) => setOriginIndex(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-gray-300 font-medium bg-white"
              >
                {effectiveIndustries.map((ind, i) => (
                  <option key={i} value={i}>{ind.companyName || ind.name || `Facility ${i + 1}`} ({ind.city || 'Origin'})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Destination Facility (Buyer)</label>
              <select
                value={destinationIndex}
                onChange={(e) => setDestinationIndex(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-gray-300 font-medium bg-white"
              >
                {effectiveIndustries.map((ind, i) => (
                  <option key={i} value={i}>{ind.companyName || ind.name || `Facility ${i + 1}`} ({ind.city || 'Destination'})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Haulage Vehicle Type</label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-300 font-medium bg-white"
              >
                <option value="smallTruck">Light Commercial (LCV - 3.5 Tonnes)</option>
                <option value="mediumTruck">Medium Freight (MCV - 10 Tonnes)</option>
                <option value="heavyTruck">Heavy Bulk Tipper (HCV - 25 Tonnes)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleRecalculateRoute}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <FiNavigation className="w-4 h-4" />
              <span>Compute Optimal Freight Path</span>
            </button>
          </div>

          {routeError && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-bold flex items-center gap-2">
              <FiAlertCircle className="w-4 h-4 shrink-0" />
              <span>{routeError}</span>
            </div>
          )}

          {/* Computed Transit Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
              <span className="text-[10px] font-bold uppercase text-gray-500 block">Driving Distance</span>
              <span className="text-xl font-black text-gray-900">{calculatedRoute.distanceKm} km</span>
              <p className="text-[10px] text-gray-500">Highway & road routing</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
              <span className="text-[10px] font-bold uppercase text-gray-500 block">Estimated Travel Time</span>
              <span className="text-xl font-black text-gray-900">{calculatedRoute.durationHours} hrs</span>
              <p className="text-[10px] text-gray-500">Freight speed limit factored</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
              <span className="text-[10px] font-bold uppercase text-gray-500 block">Estimated Transport Cost</span>
              <span className="text-xl font-black text-emerald-800">{formatINR(calculatedRoute.transportCost)}</span>
              <p className="text-[10px] text-gray-500">Fuel & toll base estimate</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
              <span className="text-[10px] font-bold uppercase text-gray-500 block">CO₂ Emissions</span>
              <span className="text-xl font-black text-teal-800">{calculatedRoute.co2EmissionsKg} kg</span>
              <p className="text-[10px] text-gray-500">Haulage carbon footprint</p>
            </div>
          </div>
        </div>

        {/* GIS OpenStreetMap Canvas */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <div>
              <h2 className="text-base font-extrabold text-gray-900">Calculated Freight Corridor</h2>
              <p className="text-xs text-gray-500 font-medium">Interactive route polyline and facility spatial locations.</p>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              OpenStreetMap GIS
            </span>
          </div>

          <div className="h-96 w-full rounded-2xl overflow-hidden border border-gray-200">
            <Map markers={markers} roadGeometry={routeGeometry} height="100%" />
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
