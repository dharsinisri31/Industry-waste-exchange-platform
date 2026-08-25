import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { getMyListings, getMarketplaceListings } from '../services/wasteAPI';
import API from '../services/authAPI';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  FiNavigation, FiTruck, FiMapPin, FiClock, 
  FiDollarSign, FiZap, FiAlertTriangle, FiCheckCircle 
} from 'react-icons/fi';
import { formatINR } from '../utils/formatINR';
import { getFacilityCoordinates, calculateHaversineDistanceKm } from '../utils/geoUtils';

export default function RouteOptimization() {
  const routerLocation = useLocation();
  const stateWasteId = routerLocation.state?.wasteId;
  const stateBuyerId = routerLocation.state?.buyerId;

  const [loading, setLoading] = useState(true);
  const [wasteListings, setWasteListings] = useState([]);
  const [buyersList, setBuyersList] = useState([]);

  const [selectedWasteId, setSelectedWasteId] = useState(stateWasteId || '');
  const [selectedBuyerId, setSelectedBuyerId] = useState(stateBuyerId || '');
  const [truckType, setTruckType] = useState('medium'); // small, medium, heavy

  const [routeMetrics, setRouteMetrics] = useState(null);
  const [roadGeometry, setRoadGeometry] = useState(null);
  const [routingWarning, setRoutingWarning] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Freight rate specifications per truck category
  const truckRates = {
    small: { name: 'Small Truck (3.5T)', ratePerKm: 25, co2Factor: 0.35 },
    medium: { name: 'Medium Truck (10T)', ratePerKm: 35, co2Factor: 0.46 },
    heavy: { name: 'Heavy Multi-Axle (25T)', ratePerKm: 48, co2Factor: 0.65 }
  };

  // Demo fallback suppliers & buyers with well-known Indian industrial clusters
  const defaultSellers = [
    { _id: 'seller-1', name: 'PET Plastic Flakes', city: 'Erode', uploader: { companyName: 'Tamil Nadu Polymer Works' }, category: 'Plastic' },
    { _id: 'seller-2', name: 'Aluminium Foundry Dross', city: 'Coimbatore', uploader: { companyName: 'Kongu Extrusions' }, category: 'Metal' },
    { _id: 'seller-3', name: 'Fly Ash Class F', city: 'Salem', uploader: { companyName: 'Salem Thermal Power Facility' }, category: 'Fly Ash' },
    { _id: 'seller-4', name: 'HDPE Granules', city: 'Vadodara', uploader: { companyName: 'Gujarat Petrochem Recyclers' }, category: 'Plastic' },
    { _id: 'seller-5', name: 'Post-Industrial Cotton Clippings', city: 'Tiruppur', uploader: { companyName: 'South Cotton Mills' }, category: 'Textile' }
  ];

  const defaultBuyers = [
    { _id: 'buyer-1', companyName: 'Kongu Green Polymers Ltd.', city: 'Coimbatore', industryType: 'Polymer Extrusion' },
    { _id: 'buyer-2', companyName: 'Chennai Eco-Smelting Refineries', city: 'Chennai', industryType: 'Metal Smelting' },
    { _id: 'buyer-3', companyName: 'Salem Pozzolanic Cement Works', city: 'Salem', industryType: 'Cement Manufacturing' },
    { _id: 'buyer-4', companyName: 'Bengaluru Circular Composites', city: 'Bengaluru', industryType: 'Industrial Packaging' },
    { _id: 'buyer-5', companyName: 'Surat Textile Recyclers', city: 'Surat', industryType: 'Synthetic Yarn Mills' }
  ];

  // 1. Load initial suppliers and buyers
  useEffect(() => {
    const loadFacilities = async () => {
      setLoading(true);
      try {
        const [myWaste, marketData, nearbyInd] = await Promise.all([
          getMyListings().catch(() => []),
          getMarketplaceListings({ limit: 30 }).catch(() => ({ listings: [] })),
          API.get('/industry/nearby?distance=500').catch(() => ({ data: [] }))
        ]);

        const combinedWastes = [...(myWaste || []), ...(marketData?.listings || [])];
        const uniqueWastes = combinedWastes.length > 0
          ? Array.from(new Map(combinedWastes.map(w => [w._id, w])).values())
          : defaultSellers;

        const combinedBuyers = nearbyInd?.data && nearbyInd.data.length > 0
          ? nearbyInd.data
          : defaultBuyers;

        setWasteListings(uniqueWastes);
        setBuyersList(combinedBuyers);

        const initialWaste = uniqueWastes.find(w => w._id === stateWasteId) || uniqueWastes[0];
        const initialBuyer = combinedBuyers.find(b => b._id === stateBuyerId) || (combinedBuyers[1] || combinedBuyers[0]);

        if (initialWaste) setSelectedWasteId(initialWaste._id);
        if (initialBuyer) setSelectedBuyerId(initialBuyer._id);

        if (initialWaste && initialBuyer) {
          executeRouteCalculation(initialWaste, initialBuyer, truckType);
        }
      } catch (err) {
        console.warn('Facility load warning:', err);
        setWasteListings(defaultSellers);
        setBuyersList(defaultBuyers);
        setSelectedWasteId(defaultSellers[0]._id);
        setSelectedBuyerId(defaultBuyers[0]._id);
        executeRouteCalculation(defaultSellers[0], defaultBuyers[0], truckType);
      } finally {
        setLoading(false);
      }
    };

    loadFacilities();
  }, []);

  // 2. Route calculation logic with OSRM and Haversine fallback
  const executeRouteCalculation = async (sellerObj, buyerObj, currentTruck) => {
    setIsCalculating(true);
    setRoutingWarning('');

    const sellerCoords = getFacilityCoordinates(sellerObj, sellerObj?.city || 'erode'); // [lng, lat]
    const buyerCoords = getFacilityCoordinates(buyerObj, buyerObj?.city || 'coimbatore');   // [lng, lat]

    const truckConfig = truckRates[currentTruck] || truckRates.medium;

    try {
      // Try public OSRM router for real road geometry
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${sellerCoords[0]},${sellerCoords[1]};${buyerCoords[0]},${buyerCoords[1]}?overview=full&geometries=geojson`;
      const osrmRes = await fetch(osrmUrl);
      const osrmData = await osrmRes.json();

      if (osrmData && osrmData.routes && osrmData.routes.length > 0) {
        const route = osrmData.routes[0];
        const distKm = parseFloat((route.distance / 1000).toFixed(1));
        const durationHours = parseFloat((route.duration / 3600).toFixed(1));
        const costInr = Math.round(distKm * truckConfig.ratePerKm);
        const co2Kg = parseFloat((distKm * truckConfig.co2Factor).toFixed(1));

        // Leaflet polyline format [lat, lng]
        const polylineLatLngs = route.geometry.coordinates.map(c => [c[1], c[0]]);

        setRoadGeometry(polylineLatLngs);
        setRouteMetrics({
          distanceKm: distKm,
          durationHours: durationHours,
          transportCostInr: costInr,
          co2EmissionsKg: co2Kg,
          sellerCoords,
          buyerCoords,
          sellerName: sellerObj.uploader?.companyName || sellerObj.name || 'Seller Facility',
          sellerCity: sellerObj.city || 'Erode',
          buyerName: buyerObj.companyName || 'Buyer Facility',
          buyerCity: buyerObj.city || 'Coimbatore'
        });
        return;
      }
    } catch (err) {
      console.warn('OSRM router unavailable, using straight-line fallback route:', err.message);
    }

    // Fallback: Haversine distance with 25% road detour factor
    const distKm = calculateHaversineDistanceKm(sellerCoords, buyerCoords);
    const durationHours = parseFloat((distKm / 50).toFixed(1)); // Avg 50 km/h commercial truck speed
    const costInr = Math.round(distKm * truckConfig.ratePerKm);
    const co2Kg = parseFloat((distKm * truckConfig.co2Factor).toFixed(1));

    // Fallback polyline: direct line between [lat, lng] points
    const fallbackPolyline = [
      [sellerCoords[1], sellerCoords[0]],
      [buyerCoords[1], buyerCoords[0]]
    ];

    setRoadGeometry(fallbackPolyline);
    setRoutingWarning('Route service temporarily unavailable. Showing direct logistics corridor.');
    setRouteMetrics({
      distanceKm: distKm,
      durationHours: durationHours,
      transportCostInr: costInr,
      co2EmissionsKg: co2Kg,
      sellerCoords,
      buyerCoords,
      sellerName: sellerObj.uploader?.companyName || sellerObj.name || 'Seller Facility',
      sellerCity: sellerObj.city || 'Erode',
      buyerName: buyerObj.companyName || 'Buyer Facility',
      buyerCity: buyerObj.city || 'Coimbatore'
    });
    setIsCalculating(false);
  };

  const handleCalculateClick = (e) => {
    e.preventDefault();
    const seller = wasteListings.find(w => w._id === selectedWasteId);
    const buyer = buyersList.find(b => b._id === selectedBuyerId);
    if (seller && buyer) {
      executeRouteCalculation(seller, buyer, truckType);
    }
  };

  // 3. Interactive Leaflet Map Renderer
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean up previous map instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const defaultCenter = [11.3410, 77.7172]; // Erode baseline

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 7,
      zoomControl: true,
      scrollWheelZoom: false
    });

    mapInstanceRef.current = map;

    // OpenStreetMap Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18
    }).addTo(map);

    // Marker Icon Builders
    const createCustomPin = (bgColor, label, iconText) => {
      return L.divIcon({
        className: 'custom-route-marker',
        html: `
          <div style="
            background-color: ${bgColor};
            color: #ffffff;
            font-weight: 800;
            font-size: 11px;
            padding: 4px 8px;
            border-radius: 12px;
            border: 2px solid #ffffff;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            gap: 4px;
            white-space: nowrap;
            font-family: ui-sans-serif, system-ui, sans-serif;
          ">
            <span>${iconText}</span>
            <span>${label}</span>
          </div>
        `,
        iconSize: [110, 28],
        iconAnchor: [55, 14]
      });
    };

    if (routeMetrics) {
      const sellerLatLng = [routeMetrics.sellerCoords[1], routeMetrics.sellerCoords[0]];
      const buyerLatLng = [routeMetrics.buyerCoords[1], routeMetrics.buyerCoords[0]];

      // Source / Seller Marker (Green)
      const sellerMarker = L.marker(sellerLatLng, {
        icon: createCustomPin('#059669', `FROM: ${routeMetrics.sellerCity}`, '🏭')
      }).addTo(map);

      sellerMarker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #111827; padding: 2px;">
          <strong style="color: #059669; font-size: 13px; display: block;">Source Supplier (Seller)</strong>
          <span style="font-weight: 600; color: #374151;">${routeMetrics.sellerName}</span><br/>
          <span style="color: #6b7280;">Location: ${routeMetrics.sellerCity}</span>
        </div>
      `);

      // Destination / Buyer Marker (Blue)
      const buyerMarker = L.marker(buyerLatLng, {
        icon: createCustomPin('#0284c7', `TO: ${routeMetrics.buyerCity}`, '🏢')
      }).addTo(map);

      buyerMarker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #111827; padding: 2px;">
          <strong style="color: #0284c7; font-size: 13px; display: block;">Destination Facility (Buyer)</strong>
          <span style="font-weight: 600; color: #374151;">${routeMetrics.buyerName}</span><br/>
          <span style="color: #6b7280;">Location: ${routeMetrics.buyerCity}</span>
        </div>
      `);

      // Road Route Polyline
      if (roadGeometry && roadGeometry.length > 0) {
        const routeLine = L.polyline(roadGeometry, {
          color: '#059669',
          weight: 5,
          opacity: 0.85,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(map);

        map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
      } else {
        const bounds = L.latLngBounds([sellerLatLng, buyerLatLng]);
        map.fitBounds(bounds, { padding: [60, 60] });
      }
    }

    // Invalidate size to ensure Leaflet renders all tiles properly
    const resizeTimer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 250);

    return () => {
      clearTimeout(resizeTimer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [routeMetrics, roadGeometry]);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto font-sans">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <FiNavigation className="text-emerald-600" /> Route Optimization
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1 font-medium">
            Find the best transport route between the seller and buyer.
          </p>
        </div>

        {/* Compact Selection Form */}
        <form onSubmit={handleCalculateClick} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            
            {/* FROM: Seller / Source */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block">
                FROM: Seller / Source
              </label>
              <select
                value={selectedWasteId}
                onChange={(e) => setSelectedWasteId(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-xs text-gray-900 font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {wasteListings.map(w => (
                  <option key={w._id} value={w._id}>
                    {w.uploader?.companyName || w.name} ({w.city || 'Erode'}) - {w.category || 'Material'}
                  </option>
                ))}
              </select>
            </div>

            {/* TO: Buyer / Destination */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block">
                TO: Buyer / Destination
              </label>
              <select
                value={selectedBuyerId}
                onChange={(e) => setSelectedBuyerId(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-xs text-gray-900 font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {buyersList.map(b => (
                  <option key={b._id} value={b._id}>
                    {b.companyName} ({b.city || 'Coimbatore'}) - {b.industryType || 'Recycler'}
                  </option>
                ))}
              </select>
            </div>

            {/* VEHICLE: Truck Type */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block">
                VEHICLE: Truck Type
              </label>
              <select
                value={truckType}
                onChange={(e) => setTruckType(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-xs text-gray-900 font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="small">Small Truck (3.5T) - ₹25/km</option>
                <option value="medium">Medium Truck (10T) - ₹35/km</option>
                <option value="heavy">Heavy Multi-Axle (25T) - ₹48/km</option>
              </select>
            </div>

            {/* Action Button */}
            <div>
              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FiNavigation className="w-4 h-4" />
                <span>Calculate Route</span>
              </button>
            </div>

          </div>
        </form>

        {/* Routing Fallback Warning if OSRM is offline */}
        {routingWarning && (
          <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl text-xs font-semibold flex items-center gap-2">
            <FiAlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{routingWarning}</span>
          </div>
        )}

        {/* Route Metrics Summary (LEFT / TOP) */}
        {routeMetrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Distance */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-gray-500 uppercase flex items-center gap-1">
                <FiMapPin className="text-emerald-600" /> Distance
              </span>
              <div className="text-2xl font-black text-gray-900 tracking-tight">
                {routeMetrics.distanceKm} <span className="text-sm font-semibold text-gray-500">km</span>
              </div>
            </div>

            {/* Travel Time */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-gray-500 uppercase flex items-center gap-1">
                <FiClock className="text-teal-600" /> Travel Time
              </span>
              <div className="text-2xl font-black text-gray-900 tracking-tight">
                {routeMetrics.durationHours} <span className="text-sm font-semibold text-gray-500">hrs</span>
              </div>
            </div>

            {/* Transport Cost */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-gray-500 uppercase flex items-center gap-1">
                <FiDollarSign className="text-emerald-600" /> Transport Cost
              </span>
              <div className="text-2xl font-black text-gray-900 tracking-tight">
                {formatINR(routeMetrics.transportCostInr)}
              </div>
            </div>

            {/* CO2 Emissions */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-gray-500 uppercase flex items-center gap-1">
                <FiZap className="text-teal-600" /> CO₂ Emissions
              </span>
              <div className="text-2xl font-black text-emerald-800 tracking-tight">
                {routeMetrics.co2EmissionsKg} <span className="text-sm font-semibold text-gray-500">kg CO₂</span>
              </div>
            </div>

          </div>
        )}

        {/* LIVE ROUTE MAP CONTAINER */}
        <div className="bg-white p-4 rounded-3xl border border-gray-200 shadow-2xs space-y-3">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Route Map
            </h2>
            {routeMetrics && (
              <span className="text-xs text-gray-600 font-bold">
                {routeMetrics.sellerCity} &rarr; {routeMetrics.buyerCity}
              </span>
            )}
          </div>

          <div className="w-full rounded-2xl overflow-hidden border border-gray-200 shadow-inner bg-gray-100">
            <div
              ref={mapContainerRef}
              style={{ width: '100%', height: '520px', minHeight: '400px' }}
            />
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
