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

    const defaultCenter = [11.3410, 77.7172]; // Erode baseline
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
            width: 30px;
            height: 30px;
            border-radius: 50%;
            border: 2px solid #ffffff;
            box-shadow: 0 3px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-weight: bold;
            font-size: 13px;
          ">
            ${symbol}
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -15]
      });
    };

    const plottedLatLngs = [];

    // Plot Markers
    if (markers && markers.length > 0) {
      markers.forEach((m, idx) => {
        const pt = extractLatLng(m.coordinates || m.location || m);
        if (!pt || isNaN(pt[0]) || isNaN(pt[1])) return;

        plottedLatLngs.push(pt);

        let color = '#059669'; // Emerald
        let symbol = '🏭';

        const role = (m.businessRole || m.role || m.type || '').toLowerCase();
        if (role.includes('receiver') || role.includes('buyer')) {
          color = '#0284c7'; // Blue
          symbol = '🏢';
        } else if (role.includes('exchange') || role.includes('transit')) {
          color = '#d97706'; // Amber
          symbol = '🚚';
        } else if (role.includes('waste') || role.includes('source')) {
          color = '#059669'; // Emerald
          symbol = '♻️';
        }

        const icon = createMarkerIcon(color, symbol);
        const markerInstance = L.marker(pt, { icon }).addTo(map);

        const name = m.companyName || m.name || `Facility #${idx + 1}`;
        const city = m.city || m.address || 'Regional Industrial Hub';
        const roleLabel = m.businessRole === 'receiver' ? 'Buyer / Recycler' : m.businessRole === 'sender' ? 'Waste Producer' : m.type || 'Industrial Facility';

        markerInstance.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; color: #111827; padding: 2px; min-width: 150px;">
            <strong style="color: ${color}; font-size: 13px; display: block; margin-bottom: 2px;">${name}</strong>
            <span style="color: #4b5563; font-size: 11px;">Role: <b>${roleLabel}</b></span><br/>
            <span style="color: #4b5563; font-size: 11px;">Location: <b>${city}</b></span>
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
            <span className="font-mono font-bold text-gray-900 text-sm">{routeMetrics.transportCost ? `₹${routeMetrics.transportCost.toLocaleString()}` : `₹${routeMetrics.transportCostInr?.toLocaleString() || 11442}`}</span>
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
