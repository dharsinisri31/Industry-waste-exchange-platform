const express = require('express');
const router = express.Router();
const {
  submitReview,
  getSellerReviews,
  getOrderReviews
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

// Public lookup for seller reviews
router.get('/seller/:sellerId', getSellerReviews);

// Protected routes
router.post('/', protect, submitReview);
router.get('/order/:orderId', protect, getOrderReviews);

module.exports = router;
