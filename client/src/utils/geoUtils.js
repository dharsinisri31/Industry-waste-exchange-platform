// City Coordinates Lookup Table for Demo Industries (lng, lat)
export const CITY_COORDINATES = {
  // South India
  'erode': [77.7172, 11.3410],
  'coimbatore': [76.9558, 11.0168],
  'salem': [78.1460, 11.6643],
  'tiruppur': [77.3411, 11.1085],
  'chennai': [80.2707, 13.0827],
  'madurai': [78.1198, 9.9252],
  'trichy': [78.7047, 10.7905],
  'tiruchirappalli': [78.7047, 10.7905],
  'hosur': [77.8253, 12.7409],
  'bengaluru': [77.5946, 12.9716],
  'bangalore': [77.5946, 12.9716],
  'hyderabad': [78.4867, 17.3850],
  'visakhapatnam': [83.2185, 17.6868],
  'kochi': [76.2673, 9.9312],

  // West & North-West India
  'vadodara': [73.1812, 22.3072],
  'surat': [72.8311, 21.1702],
  'ahmedabad': [72.5714, 23.0225],
  'vapi': [72.9289, 20.3705],
  'ankleshwar': [73.0031, 21.6264],
  'mumbai': [72.8777, 19.0760],
  'pune': [73.8567, 18.5204],
  'nagpur': [79.0882, 21.1458],
  'nashik': [73.7898, 19.9975],
  'aurangabad': [75.3433, 19.8762],

  // North & East India
  'delhi': [77.1025, 28.7041],
  'new delhi': [77.2090, 28.6139],
  'gurgaon': [77.0266, 28.4595],
  'gurugram': [77.0266, 28.4595],
  'noida': [77.3910, 28.5355],
  'faridabad': [77.3178, 28.4089],
  'kanpur': [80.3319, 26.4499],
  'lucknow': [80.9462, 26.8467],
  'kolkata': [88.3639, 22.5726],
  'jamshedpur': [86.2029, 22.8046],
  'rourkela': [84.8546, 22.2604],
  'bhubaneswar': [85.8245, 20.2961],
  'indore': [75.8577, 22.7196],
  'bhopal': [77.4126, 23.2599],
  'jaipur': [75.7873, 26.9124]
};

/**
 * Extracts valid [lng, lat] from a facility, waste object or user profile.
 * Falls back to city dictionary matching, then default Tamil Nadu/Gujarat cluster coords.
 */
export function getFacilityCoordinates(item, defaultCity = 'erode') {
  if (!item) {
    return CITY_COORDINATES[defaultCity.toLowerCase()] || [77.7172, 11.3410];
  }

  // Direct array [lng, lat] or [lat, lng]
  if (Array.isArray(item)) {
    if (item.length >= 2 && item[0] !== 0 && item[1] !== 0) {
      if (item[0] > 50 && item[1] < 40) return [item[0], item[1]]; // [lng, lat]
      if (item[1] > 50 && item[0] < 40) return [item[1], item[0]]; // [lat, lng] -> [lng, lat]
    }
  }

  // Object coordinates: item.location?.coordinates or item.coordinates
  const coords = item.location?.coordinates || item.coordinates;
  if (Array.isArray(coords) && coords.length >= 2 && coords[0] !== 0 && coords[1] !== 0) {
    if (coords[0] > 50 && coords[1] < 40) return [coords[0], coords[1]];
    if (coords[1] > 50 && coords[0] < 40) return [coords[1], coords[0]];
  }

  // Latitude and Longitude fields
  const lat = item.latitude || item.lat;
  const lng = item.longitude || item.lng;
  if (lat && lng && !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
    return [Number(lng), Number(lat)];
  }

  // Try city string matching
  const cityKey = (
    item.city ||
    item.address ||
    item.location?.city ||
    item.companyProfile?.city ||
    item.uploader?.city ||
    item.name ||
    ''
  ).toLowerCase().trim();

  for (const [knownCity, coord] of Object.entries(CITY_COORDINATES)) {
    if (cityKey.includes(knownCity)) {
      return coord;
    }
  }

  // Fallback to default
  return CITY_COORDINATES[defaultCity.toLowerCase()] || [77.7172, 11.3410];
}

/**
 * Calculates Haversine distance in km between two [lng, lat] coordinates
 */
export function calculateHaversineDistanceKm(coord1, coord2) {
  if (!coord1 || !coord2) return 85;
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const R = 6371; // km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const roadFactor = 1.25; // 25% road detour factor
  return parseFloat((R * c * roadFactor).toFixed(1));
}
