const express = require('express');

const {
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  updateAvailability
} = require('../controllers/menuController');

const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const { menuItemValidator } = require('../validators/menuValidator');
const validateRequest = require('../middleware/validationMiddleware');

const router = express.Router();

/*
 * PUBLIC MENU
 */

// Get all menu items
router.get('/', getMenuItems);

// Get one menu item
router.get('/:id', getMenuItemById);


/*
 * ADMIN MENU MANAGEMENT
 */

// Create menu item
router.post(
    '/',
    authenticateToken,
    authorizeRoles('admin'),
    menuItemValidator,
    validateRequest,
    createMenuItem
  );

// Update menu item
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('admin'),
  updateMenuItem
);

// Delete menu item
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('admin'),
  deleteMenuItem
);

// Update menu item availability
router.patch(
  '/:id/availability',
  authenticateToken,
  authorizeRoles('admin'),
  updateAvailability
);

module.exports = router;