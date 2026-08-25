const carbonCoefficients = {
  'Plastic Scrap': 1.5,
  'Metal Scrap': 2.0,
  'Fly Ash': 0.8,
  'Glass': 1.2,
  'Textile Waste': 1.0,
  'Food Waste': 0.5,
  'Chemical Containers': 1.4,
  'Electronic Waste': 2.5,
  'Other': 0.7
};

// Transport emissions coefficient: 0.15 kg CO2 per ton-km
const TRANSPORT_COEFFICIENT = 0.15; 

/**
 * Calculates carbon saved by recycling, emissions of transport, and net balance.
 * @param {string} category - Category of waste
 * @param {number} quantity - Quantity of waste in kg
 * @param {number} distanceKm - Distance in km
 * @returns {Object} { totalCarbonSaved, transportEmissions, netSavings }
 */
const calculateCarbonSaved = (category, quantity, distanceKm) => {
  const coefficient = carbonCoefficients[category] || carbonCoefficients['Other'];
  
  // Reuse offset (kg CO2)
  const reuseOffset = quantity * coefficient;
  
  // Convert quantity to tons for transportation emissions formula
  const quantityTons = quantity / 1000;
  
  // Transport emissions (kg CO2)
  const transportEmissions = distanceKm * quantityTons * TRANSPORT_COEFFICIENT;
  
  // Net balance
  const netSavings = Math.max(0, reuseOffset - transportEmissions);
  
  return {
    totalCarbonSaved: parseFloat(reuseOffset.toFixed(2)),
    transportEmissions: parseFloat(transportEmissions.toFixed(2)),
    netSavings: parseFloat(netSavings.toFixed(2))
  };
};

module.exports = {
  calculateCarbonSaved,
  carbonCoefficients
};
