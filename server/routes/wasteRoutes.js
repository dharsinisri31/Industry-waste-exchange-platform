const express = require('express');
const router = express.Router();
const {
  createListing,
  getMyListings,
  getMarketplace,
  getListingById,
  requestExchange
} = require('../controllers/wasteController');
const { protect } = require('../middleware/authMiddleware');
const uploadImageMiddleware = require('../middleware/uploadMiddleware');

// Public route to browse marketplace & view listing details
router.get('/marketplace', getMarketplace);
router.get('/:id', getListingById);

// Protected routes
router.use(protect);
router.get('/my/listings', getMyListings);
router.post('/', uploadImageMiddleware('image'), createListing);
router.post('/:id/exchange', requestExchange);

module.exports = router;
