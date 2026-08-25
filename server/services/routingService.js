const axios = require('axios');

/**
 * Calculates real-time road driving route using OpenRouteService / OSRM API.
 * Inputs: origin [lon, lat], destination [lon, lat]
 */
const calculateRoadRoute = async (origin, destination) => {
  const [lon1, lat1] = origin;
  const [lon2, lat2] = destination;

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson`;
    const response = await axios.get(url, { timeout: 6000 });

    if (response.data && response.data.routes && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      const distanceKm = parseFloat((route.distance / 1000.0).toFixed(2));
      const durationMinutes = Math.round(route.duration / 60.0);

      // Convert GeoJSON [lon, lat] coordinates to Leaflet [lat, lon] points
      const roadPolyline = route.geometry.coordinates.map(([lon, lat]) => [lat, lon]);

      // Calculate freight metrics
      const fuelConsumptionLiters = parseFloat((distanceKm * 0.35).toFixed(2)); // 0.35 L/km diesel truck
      const transportCostUsd = parseFloat((distanceKm * 1.50).toFixed(2)); // $1.50 / km freight rate
      const co2EmissionsKg = parseFloat((fuelConsumptionLiters * 2.68).toFixed(2)); // 2.68 kg CO2/L

      return {
        distanceKm,
        durationMinutes,
        geometry: roadPolyline,
        fuelConsumptionLiters,
        transportCostUsd,
        co2EmissionsKg,
        trafficConditions: durationMinutes > 60 ? 'Moderate Traffic' : 'Low Traffic'
      };
    }
  } catch (error) {
    console.warn(`[Routing Warning] OSRM service lookup failed (${error.message}). Using Haversine route projection.`);
  }

  // Haversine fallback if OSRM service is unreachable
  const R = 6371.0;
  const dlat = (lat2 - lat1) * Math.PI / 180;
  const dlon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dlat / 2) * Math.sin(dlat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dlon / 2) * Math.sin(dlon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = parseFloat((R * c).toFixed(2));
  const durationMinutes = Math.round((distanceKm / 50.0) * 60.0);

  const fuelConsumptionLiters = parseFloat((distanceKm * 0.35).toFixed(2));
  const transportCostUsd = parseFloat((distanceKm * 1.50).toFixed(2));
  const co2EmissionsKg = parseFloat((fuelConsumptionLiters * 2.68).toFixed(2));

  return {
    distanceKm,
    durationMinutes,
    geometry: [[lat1, lon1], [lat2, lon2]],
    fuelConsumptionLiters,
    transportCostUsd,
    co2EmissionsKg,
    trafficConditions: 'Normal Flow'
  };
};

module.exports = {
  calculateRoadRoute
};
