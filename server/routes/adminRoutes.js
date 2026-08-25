const express = require('express');
const router = express.Router();
const {
  getDashboardSummary,
  getAllIndustries,
  updateIndustryStatus,
  approveIndustry,
  getAllWasteListings,
  updateWasteListingStatus,
  getAllBuyerRequirements,
  updateBuyerRequirementStatus,
  getAllTransactions,
  updateTransactionStatus,
  getAnomaliesList,
  getKnowledgeBaseStatus,
  reindexKnowledgeBase,
  getPlatformSettings,
  updatePlatformSettings
} = require('../controllers/adminController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/summary', isAdmin, getDashboardSummary);

// Industry Management
router.get('/industries', isAdmin, getAllIndustries);
router.patch('/industries/:id/status', isAdmin, updateIndustryStatus);
router.post('/approve-industry/:id', isAdmin, approveIndustry);

// Waste Listings Moderation
router.get('/waste-listings', isAdmin, getAllWasteListings);
router.patch('/waste-listings/:id/status', isAdmin, updateWasteListingStatus);

// Buyer Requirements Oversight
router.get('/buyer-requirements', isAdmin, getAllBuyerRequirements);
router.patch('/buyer-requirements/:id/status', isAdmin, updateBuyerRequirementStatus);

// Exchanges & Transactions
router.get('/transactions', isAdmin, getAllTransactions);
router.patch('/transactions/:id', updateTransactionStatus);

// AI & Anomalies
router.get('/anomalies', isAdmin, getAnomaliesList);

// RAG Knowledge Base Management
router.get('/knowledge-base', isAdmin, getKnowledgeBaseStatus);
router.post('/knowledge-base/reindex', isAdmin, reindexKnowledgeBase);

// Platform Settings
router.get('/settings', isAdmin, getPlatformSettings);
router.put('/settings', isAdmin, updatePlatformSettings);

module.exports = router;
