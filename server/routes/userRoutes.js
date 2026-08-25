const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateUserProfile,
  getAllUsers
} = require('../controllers/userController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);
router.get('/', isAdmin, getAllUsers);

module.exports = router;
