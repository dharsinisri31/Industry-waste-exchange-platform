const express = require('express');
const router = express.Router();
const { getTransformationAdvice } = require('../controllers/transformationController');

router.post('/analyze', getTransformationAdvice);

module.exports = router;
