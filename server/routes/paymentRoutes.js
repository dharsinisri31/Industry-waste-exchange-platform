const express = require('express');
const router = express.Router();
const {
  getOrderPaymentSummary,
  simulatePayment,
  getBuyerPaymentHistory,
  getSellerPaymentHistory,
  getPaymentById,
  getAdminPaymentStats
} = require('../controllers/paymentController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/order/:orderId', getOrderPaymentSummary);
router.post('/simulate', simulatePayment);
router.get('/buyer', getBuyerPaymentHistory);
router.get('/seller', getSellerPaymentHistory);
router.get('/admin/stats', isAdmin, getAdminPaymentStats);
router.get('/:id', getPaymentById);

module.exports = router;
