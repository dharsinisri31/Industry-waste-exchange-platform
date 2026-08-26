const express = require('express');
const router = express.Router();
const {
  getUserDocuments,
  getUserExchangesWithChecklist,
  uploadDocument,
  verifyDocument
} = require('../controllers/documentController');
const { protect } = require('../middleware/authMiddleware');
const uploadDocMiddleware = require('../middleware/uploadDocMiddleware');

router.use(protect);

router.get('/', getUserDocuments);
router.get('/exchanges', getUserExchangesWithChecklist);
router.post('/upload', uploadDocMiddleware('document'), uploadDocument);
router.patch('/:exchangeId/:docId/verify', verifyDocument);

module.exports = router;
