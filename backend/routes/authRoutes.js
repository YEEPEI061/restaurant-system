const express = require('express');

const {
  guestSignup,
  guestLogin,
  adminLogin,
  getCurrentUser
} = require('../controllers/authController');

const {
  guestSignupValidator,
  guestLoginValidator,
  adminLoginValidator
} = require('../validators/authValidator');

const validateRequest = require('../middleware/validationMiddleware');
const authenticateToken = require('../middleware/authMiddleware');

const router = express.Router();

// Guest signup
router.post(
  '/guest/signup',
  guestSignupValidator,
  validateRequest,
  guestSignup
);

// Guest login
router.post(
  '/guest/login',
  guestLoginValidator,
  validateRequest,
  guestLogin
);

// Admin login
router.post(
  '/admin/login',
  adminLoginValidator,
  validateRequest,
  adminLogin
);

// Get current authenticated user
router.get(
  '/me',
  authenticateToken,
  getCurrentUser
);


module.exports = router;