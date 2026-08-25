const express = require('express');
const router = express.Router();
const {
  getMapData,
  getNearbyIndustries,
  calculateRoute,
  calculateCarbon
} = require('../controllers/gisController');

router.get('/map-data', getMapData);
router.get('/nearby-industries', getNearbyIndustries);
router.post('/calculate-route', calculateRoute);
router.post('/calculate-carbon', calculateCarbon);

module.exports = router;
