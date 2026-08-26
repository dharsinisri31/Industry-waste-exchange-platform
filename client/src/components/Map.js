import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FiCrosshair } from 'react-icons/fi';
import { getFacilityCoordinates } from '../utils/geoUtils';

export default function Map({ coordinates, markers = [], roadGeometry, routeMetrics, height = '450px', showControls = true }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Helper to extract [lat, lng]
  const extractLatLng = (item) => {
    if (!item) return null;
    if (Array.isArray(item)) {
      if (item.length >= 2) {
        // [lng, lat] (lng > 50 in India) -> [lat, lng]
        if (item[0] > 50 && item[1] < 40) return [item[1], item[0]];
        return [item[0], item[1]];
      }
      return null;
    }
    if (typeof item === 'object') {
      if (item.lat !== undefined && item.lng !== undefined) return [Number(item.lat), Number(item.lng)];
      if (item.latitude !== undefined && item.longitude !== undefined) return [Number(item.latitude), Number(item.longitude)];
      const coords = getFacilityCoordinates(item);
      if (coords) return [coords[1], coords[0]];
    }
    return null;
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean up previous instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const defaultCenter = [11.3410, 77.7172]; // Baseline
    const centerPoint = extractLatLng(coordinates) || defaultCenter;

    const map = L.map(mapContainerRef.current, {
      center: centerPoint,
      zoom: 7,
      zoomControl: true,
      scrollWheelZoom: false
    });

    mapInstanceRef.current = map;

    // OpenStreetMap Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(map);

    // Marker Icon Creator
    const createMarkerIcon = (color, symbol) => {
      return L.divIcon({
        className: 'custom-leaflet-pin',
        html: `
          <div style="
            background-color: ${color};
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 2.5px solid #ffffff;
            box-shadow: 0 3px 8px rgba(0,0,0,0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-weight: bold;
            font-size: 14px;
          ">
            ${symbol}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
      });
    };

    const plottedLatLngs = [];

    // Plot Markers with strict semantics:
    // Green (#059669) = Industry / Facility / Resource Location
    // Blue (#0284c7) = Buyer Destination
    // Amber (#d97706) = Seller / Waste Pickup Location
    if (markers && markers.length > 0) {
      markers.forEach((m, idx) => {
        const pt = extractLatLng(m.coordinates || m.location || m);
        if (!pt || isNaN(pt[0]) || isNaN(pt[1])) return;

        plottedLatLngs.push(pt);

        let color = '#059669'; // Default: Green for Industry/Facility
        let symbol = '🏭';
        let roleLabel = 'Industry / Facility';

        const role = (m.businessRole || m.role || m.type || '').toLowerCase();
        if (role.includes('receiver') || role.includes('buyer') || role.includes('destination')) {
          color = '#0284c7'; // Blue for Buyer
          symbol = '🏢';
          roleLabel = 'Buyer Facility';
        } else if (role.includes('sender') || role.includes('seller') || role.includes('pickup') || role.includes('origin') || role.includes('waste')) {
          color = '#d97706'; // Amber for Seller / Pickup
          symbol = '📦';
          roleLabel = 'Pickup / Seller';
        } else {
          color = '#059669'; // Green for Industry
          symbol = '🏭';
          roleLabel = 'Industry / Facility';
        }

        const icon = createMarkerIcon(color, symbol);
        const markerInstance = L.marker(pt, { icon }).addTo(map);

        const name = m.companyName || m.name || `Facility #${idx + 1}`;
        const city = m.city || m.address || 'Regional Industrial Zone';
        const material = m.material || m.wasteName || (m.waste ? m.waste.name : null);
        const quantity = m.quantity ? `${m.quantity} ${m.unit || 'kg'}` : null;
        const exchangeId = m.exchangeId || m.orderId || null;
        const status = m.status || m.currentStatus || null;

        markerInstance.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; color: #111827; padding: 4px; min-width: 170px;">
            <strong style="color: ${color}; font-size: 13px; display: block; margin-bottom: 3px;">${name}</strong>
            <div style="color: #374151; font-size: 11px; margin-bottom: 2px;">Role: <b style="color: ${color};">${roleLabel}</b></div>
            <div style="color: #4b5563; font-size: 11px; margin-bottom: 2px;">Location: <b>${city}</b></div>
            ${material ? `<div style="color: #4b5563; font-size: 11px; margin-bottom: 2px;">Material: <b style="color: #059669;">${material}</b></div>` : ''}
            ${quantity ? `<div style="color: #4b5563; font-size: 11px; margin-bottom: 2px;">Quantity: <b>${quantity}</b></div>` : ''}
            ${exchangeId ? `<div style="color: #4b5563; font-size: 11px; margin-bottom: 2px;">Exchange ID: <b style="font-family: monospace;">${exchangeId}</b></div>` : ''}
            ${status ? `<div style="color: #4b5563; font-size: 11px;">Status: <b style="color: #12233F;">${status}</b></div>` : ''}
          </div>
        `);
      });
    }

    // Plot Polyline if roadGeometry exists
    if (roadGeometry && Array.isArray(roadGeometry) && roadGeometry.length > 1) {
      const roadLine = L.polyline(roadGeometry, {
        color: '#059669',
        weight: 5,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      map.fitBounds(roadLine.getBounds(), { padding: [40, 40] });
    } else if (plottedLatLngs.length > 1) {
      const bounds = L.latLngBounds(plottedLatLngs);
      map.fitBounds(bounds, { padding: [40, 40] });
    } else if (plottedLatLngs.length === 1) {
      map.setView(plottedLatLngs[0], 9);
    }

    // Invalidate size after container finishes rendering
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [coordinates, markers, roadGeometry]);

  const handleLocateMe = () => {
    if (navigator.geolocation && mapInstanceRef.current) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          mapInstanceRef.current.setView([lat, lng], 12);

          L.marker([lat, lng], {
            icon: L.divIcon({
              className: 'user-geo-marker',
              html: `<div style="background:#059669; width:22px; height:22px; border-radius:50%; border:3px solid white; box-shadow:0 0 10px rgba(5,150,105,0.6);"></div>`,
              iconSize: [22, 22]
            })
          }).addTo(mapInstanceRef.current).bindPopup('<b>Your Current Location</b>').openPopup();
        },
        (err) => {
          console.warn(`Geolocation Error: ${err.message}`);
        }
      );
    }
  };

  return (
    <div className="w-full relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 shadow-2xs font-sans">
      
      {/* Floating Map Legend */}
      <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-xs px-3 py-2 rounded-xl border border-gray-300 shadow-sm text-[11px] font-bold text-gray-800 space-y-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#059669] inline-block"></span>
          <span>Industry / Facility</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#d97706] inline-block"></span>
          <span>Pickup / Seller</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7] inline-block"></span>
          <span>Buyer</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-1 bg-[#059669] rounded-full inline-block"></span>
          <span>Transportation Route</span>
        </div>
      </div>

      {showControls && (
        <div className="absolute top-3 right-3 z-10">
          <button
            type="button"
            onClick={handleLocateMe}
            className="px-3 py-1.5 bg-white/95 backdrop-blur-xs hover:bg-white text-gray-800 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border border-gray-300 shadow-sm"
            title="Center Map on Current Location"
          >
            <FiCrosshair className="text-emerald-700 w-3.5 h-3.5" />
            <span>Locate</span>
          </button>
        </div>
      )}

      {/* Map Canvas */}
      <div 
        ref={mapContainerRef} 
        style={{ width: '100%', height: height, minHeight: '300px', backgroundColor: '#f1f5f9' }} 
      />

      {/* Metrics Footer if Route was Calculated */}
      {routeMetrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-white border-t border-gray-200 text-xs">
          <div className="p-2 bg-gray-50 rounded-xl border border-gray-200">
            <span className="text-[10px] text-gray-500 uppercase font-bold block">Distance</span>
            <span className="font-mono font-black text-emerald-800 text-sm">{routeMetrics.distanceKm} km</span>
          </div>
          <div className="p-2 bg-gray-50 rounded-xl border border-gray-200">
            <span className="text-[10px] text-gray-500 uppercase font-bold block">Travel Time</span>
            <span className="font-mono font-bold text-gray-900 text-sm">{routeMetrics.durationHours || routeMetrics.durationMinutes} hrs</span>
          </div>
          <div className="p-2 bg-gray-50 rounded-xl border border-gray-200">
            <span className="text-[10px] text-gray-500 uppercase font-bold block">Estimated Freight</span>
            <span className="font-mono font-bold text-gray-900 text-sm">
              {routeMetrics.transportCost !== undefined 
                ? `₹${Number(routeMetrics.transportCost).toLocaleString()}` 
                : `₹${Number(routeMetrics.transportCostInr || 0).toLocaleString()}`}
            </span>
          </div>
          <div className="p-2 bg-gray-50 rounded-xl border border-gray-200">
            <span className="text-[10px] text-gray-500 uppercase font-bold block">CO₂ Emissions</span>
            <span className="font-mono font-bold text-teal-800 text-sm">{routeMetrics.co2EmissionsKg} kg</span>
          </div>
        </div>
      )}
    </div>
  );
}
