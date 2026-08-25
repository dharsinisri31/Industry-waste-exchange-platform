const { geocodeAddress } = require('./services/geocodingService');
const { calculateRoadRoute } = require('./services/routingService');

async function testGISServices() {
  console.log('\n=== 1. TESTING NOMINATIM ADDRESS GEOCODING ===');
  const addressQuery = {
    address: 'Peenya Industrial Area',
    city: 'Bangalore',
    state: 'Karnataka',
    country: 'India'
  };
  const coords = await geocodeAddress(addressQuery);
  console.log(`Address: "${addressQuery.address}, ${addressQuery.city}" -> GeoJSON Coordinates: [${coords[0]}, ${coords[1]}]`);
  if (!Array.isArray(coords) || coords.length !== 2) {
    throw new Error('Geocoding returned invalid coordinate array');
  }

  console.log('\n=== 2. TESTING OSRM REAL-TIME ROAD ROUTING ===');
  const origin = [77.5946, 12.9716]; // Bangalore
  const destination = [77.6500, 13.0200]; // Nearby Plant
  const route = await calculateRoadRoute(origin, destination);

  console.log(`Road Distance: ${route.distanceKm} km`);
  console.log(`Estimated Travel Time: ${route.durationMinutes} mins`);
  console.log(`Road Polyline Points: ${route.geometry.length} coordinates`);
  console.log(`Estimated Freight Cost: $${route.transportCostUsd}`);
  console.log(`Estimated Transport CO2 Footprint: ${route.co2EmissionsKg} kg`);

  if (!route.distanceKm || route.distanceKm <= 0) {
    throw new Error('OSRM route returned zero or invalid road distance');
  }

  console.log('\n=== 3. TESTING MULTI-CRITERIA AI RECOMMENDATION SCORING FORMULA ===');
  // Formula: Compatibility 50%, Distance 20%, Demand 15%, Carbon 10%, Equipment 5%
  const comp = 0.90;
  const distScore = Math.max(0.0, 1.0 - (route.distanceKm / 300.0));
  const demand = 0.85;
  const carbonScore = 0.80;
  const equipScore = 0.60;

  const score = (0.50 * comp) + (0.20 * distScore) + (0.15 * demand) + (0.10 * carbonScore) + (0.05 * equipScore);
  console.log(`Calculated Multi-Criteria Score: ${(score * 100).toFixed(1)}%`);

  console.log('\n=== ALL REAL-TIME GIS ROUTING & GEOCODING TESTS PASSED CLEANLY! ===\n');
}

testGISServices().catch(err => {
  console.error('GIS Test Error:', err);
  process.exit(1);
});
