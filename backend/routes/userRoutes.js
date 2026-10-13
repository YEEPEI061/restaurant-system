const express = require('express');

const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus
} = require('../controllers/userController');

const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

const {
  createUserValidator,
  updateUserValidator
} = require('../validators/userValidator');

const validateRequest = require('../middleware/validationMiddleware');

const router = express.Router();

/*
 * ALL USER MANAGEMENT ROUTES
 * ADMIN ONLY
 */

router.get(
  '/',
  authenticateToken,
  authorizeRoles('admin'),
  getUsers
);

router.get(
  '/:id',
  authenticateToken,
  authorizeRoles('admin'),
  getUserById
);

router.post(
  '/',
  authenticateToken,
  authorizeRoles('admin'),
  createUserValidator,
  validateRequest,
  createUser
);

router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('admin'),
  updateUserValidator,
  validateRequest,
  updateUser
);

router.patch(
  '/:id/status',
  authenticateToken,
  authorizeRoles('admin'),
  updateUserStatus
);

router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('admin'),
  deleteUser
);

module.exports = router;