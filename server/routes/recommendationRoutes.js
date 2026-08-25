const express = require('express');
const router = express.Router();
const { getRecommendationsForWaste } = require('../controllers/recommendationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/waste/:id', protect, getRecommendationsForWaste);

module.exports = router;
