const express = require('express');
const router = express.Router();
const { seedDemoData, resetDemoData } = require('../controllers/demoSeedController');

router.post('/seed', seedDemoData);
router.post('/reset', resetDemoData);

module.exports = router;
