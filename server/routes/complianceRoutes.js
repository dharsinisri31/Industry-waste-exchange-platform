const express = require('express');
const router = express.Router();
const { uploadComplianceDoc, getComplianceDocs, checkWasteCompliance } = require('../controllers/complianceController');
const { protect } = require('../middleware/authMiddleware');
const uploadImageMiddleware = require('../middleware/uploadMiddleware');

router.post('/check-waste', checkWasteCompliance);

router.use(protect);
router.post('/upload', uploadImageMiddleware('document'), uploadComplianceDoc);
router.get('/', getComplianceDocs);

module.exports = router;
