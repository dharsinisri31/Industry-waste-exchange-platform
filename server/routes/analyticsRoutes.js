const express = require('express');
const router = express.Router();
const { getAnalyticsSummary, getDemandForecast } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

router.get('/summary', getAnalyticsSummary);
router.post('/demand-forecast', getDemandForecast);

module.exports = router;
