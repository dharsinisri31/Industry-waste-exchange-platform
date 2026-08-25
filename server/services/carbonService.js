const { calculateCarbonSaved } = require('../utils/carbonCalculator');

const computeCarbonMetrics = (category, quantity, distanceKm) => {
  return calculateCarbonSaved(category, quantity, distanceKm);
};

module.exports = {
  computeCarbonMetrics
};
