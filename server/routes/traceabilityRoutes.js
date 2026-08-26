const express = require('express');
const router = express.Router();
const {
  getTraceability,
  getMyExchanges,
  getExchangeById,
  uploadExchangeDocument,
  verifyExchangeDocument,
  recordWeighment,
  submitPartnerRating,
  updateLogisticsStatus,
  confirmDemoPayment,
  confirmRecycling,
  updateOrderStatus
} = require('../controllers/traceabilityController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// Exchange list & detail operations (Protected)
router.get('/exchanges', protect, getMyExchanges);
router.get('/exchanges/:id', protect, getExchangeById);
router.patch('/exchanges/:id/order-status', protect, updateOrderStatus);
router.post('/exchanges/:id/documents', protect, uploadExchangeDocument);
router.patch('/exchanges/:id/documents/:docId/verify', protect, isAdmin, verifyExchangeDocument);
router.post('/exchanges/:id/weighment', protect, recordWeighment);
router.post('/exchanges/:id/rate', protect, submitPartnerRating);
router.post('/exchanges/:id/logistics/status', protect, updateLogisticsStatus);
router.post('/exchanges/:id/payment/confirm', protect, confirmDemoPayment);
router.post('/exchanges/:id/recycle-confirm', protect, confirmRecycling);

// Public Traceability lookup by batchId, exchangeId, or transaction _id (Fallback)
router.get('/:batchOrExchangeId', getTraceability);

module.exports = router;
