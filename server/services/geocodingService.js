const axios = require('axios');

const CITY_COORDINATES_MAP = {
  'bangalore': [77.5946, 12.9716],
  'bengaluru': [77.5946, 12.9716],
  'chennai': [80.2707, 13.0827],
  'hyderabad': [78.4867, 17.3850],
  'mumbai': [72.8777, 19.0760],
  'delhi': [77.1025, 28.7041],
  'coimbatore': [76.9558, 11.0168],
  'pune': [73.8567, 18.5204],
  'ahmedabad': [72.5714, 23.0225],
  'kolkata': [88.3639, 22.5726]
};

/**
 * Geocode text address using Nominatim OpenStreetMap API.
 * Returns [longitude, latitude].
 */
const geocodeAddress = async ({ address = '', city = '', state = '', country = 'India', pinCode = '' }) => {
  const query = [address, city, state, pinCode, country].filter(Boolean).join(', ');
  
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: query,
        format: 'json',
        limit: 1
      },
      headers: {
        'User-Agent': 'AI-Industrial-Waste-Exchange-Platform/1.0'
      },
      timeout: 5000
    });

    if (response.data && response.data.length > 0) {
      const lat = parseFloat(response.data[0].lat);
      const lon = parseFloat(response.data[0].lon);
      console.log(`[Geocoding] Successfully geocoded "${query}" -> [${lon}, ${lat}]`);
      return [lon, lat];
    }
  } catch (error) {
    console.warn(`[Geocoding Warning] Nominatim lookup failed for "${query}" (${error.message}). Using fallback coordinate resolver.`);
  }

  // City Fallback Lookup
  const cityKey = (city || '').toLowerCase().trim();
  if (CITY_COORDINATES_MAP[cityKey]) {
    const [lon, lat] = CITY_COORDINATES_MAP[cityKey];
    // Add minor jitter so multiple locations in the same city don't stack on top of each other
    const jitterLon = lon + (Math.random() - 0.5) * 0.05;
    const jitterLat = lat + (Math.random() - 0.5) * 0.05;
    return [parseFloat(jitterLon.toFixed(6)), parseFloat(jitterLat.toFixed(6))];
  }

  // Default Bangalore coordinates
  return [77.5946, 12.9716];
};

module.exports = {
  geocodeAddress,
  CITY_COORDINATES_MAP
};
