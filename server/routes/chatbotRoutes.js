const express = require('express');
const router = express.Router();
const { queryChat } = require('../controllers/chatbotController');
const { protect } = require('../middleware/authMiddleware');

router.post('/query', protect, queryChat);

module.exports = router;
