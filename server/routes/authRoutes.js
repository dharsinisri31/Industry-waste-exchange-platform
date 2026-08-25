const express = require('express');
const router = express.Router();
const {
  registerIndustry,
  registerAdmin,
  login,
  logout,
  refreshToken,
  getCurrentUser
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const {
  validateRegisterIndustry,
  validateRegisterAdmin,
  validateLogin
} = require('../validators/authValidator');

router.post('/register-industry', validateRegisterIndustry, registerIndustry);
router.post('/register-admin', validateRegisterAdmin, registerAdmin);
router.post('/login', validateLogin, login);
router.post('/logout', logout);
router.post('/refresh', refreshToken);
router.get('/me', protect, getCurrentUser);

module.exports = router;
