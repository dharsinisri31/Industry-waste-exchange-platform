const express = require('express');
const router = express.Router();
const {
  getDashboardMetrics,
  updateProfile,
  getNearbyIndustries
} = require('../controllers/industryController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/dashboard', getDashboardMetrics);
router.put('/profile', updateProfile);
router.get('/nearby', getNearbyIndustries);

module.exports = router;
