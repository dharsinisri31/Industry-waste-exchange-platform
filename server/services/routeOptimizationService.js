const { calculateRoadRoute } = require('./routingService');
const { optimizeRoute } = require('./aiService');

const optimizePath = async (waypoints) => {
  if (waypoints && waypoints.length >= 2) {
    return await calculateRoadRoute(waypoints[0], waypoints[waypoints.length - 1]);
  }
  return await optimizeRoute(waypoints || []);
};

module.exports = {
  optimizePath
};
