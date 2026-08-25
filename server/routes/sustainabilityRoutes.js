const express = require('express');
const router = express.Router();
const { getSustainabilityMetrics } = require('../controllers/sustainabilityController');

router.get('/metrics', getSustainabilityMetrics);

module.exports = router;
