const express = require('express');
const router = express.Router();
const {
  createDispute,
  getDisputes,
  getDisputeById,
  respondToDispute,
  resolveDispute
} = require('../controllers/disputeController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', createDispute);
router.get('/', getDisputes);
router.get('/:id', getDisputeById);
router.post('/:id/respond', respondToDispute);
router.patch('/:id/resolve', isAdmin, resolveDispute);

module.exports = router;
