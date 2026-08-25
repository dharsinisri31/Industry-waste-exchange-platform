const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createRequirement,
  getMyRequirements,
  getPublicRequirements,
  getRequirementById,
  updateRequirement,
  deleteRequirement,
  getMatchedSuppliers
} = require('../controllers/buyerRequirementController');

router.route('/')
  .post(protect, createRequirement)
  .get(getPublicRequirements);

router.get('/my', protect, getMyRequirements);
router.get('/:id/suppliers', protect, getMatchedSuppliers);

router.route('/:id')
  .get(getRequirementById)
  .put(protect, updateRequirement)
  .delete(protect, deleteRequirement);

module.exports = router;
