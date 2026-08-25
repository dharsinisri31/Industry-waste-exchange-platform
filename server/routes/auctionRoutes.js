const express = require('express');
const router = express.Router();
const { placeBid, closeAuction } = require('../controllers/auctionController');
const { protect } = require('../middleware/authMiddleware');

router.post('/:id/bid', protect, placeBid);
router.post('/:id/auction/close', protect, closeAuction);

module.exports = router;
