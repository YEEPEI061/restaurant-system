const express = require('express');

const {
  getReservations,
  getReservationById,
  getMyReservations,
  createReservation,
  updateReservation,
  deleteReservation,
  updateReservationStatus
} = require('../controllers/reservationController');

const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

const {
  createReservationValidator,
  updateReservationValidator
} = require('../validators/reservationValidator');

const validateRequest = require('../middleware/validationMiddleware');

const router = express.Router();

/*
 * GET ALL RESERVATIONS
 * Admin only
 */

router.get(
  '/',
  authenticateToken,
  authorizeRoles('admin'),
  getReservations
);

/*
 * GET MY RESERVATIONS
 * Guest only
 */

router.get(
  '/my',
  authenticateToken,
  authorizeRoles('guest'),
  getMyReservations
);

/*
 * GET RESERVATION BY ID
 */

router.get(
  '/:id',
  authenticateToken,
  authorizeRoles('admin', 'guest'),
  getReservationById
);

/*
 * CREATE RESERVATION
 * Guest only
 */

router.post(
  '/',
  authenticateToken,
  authorizeRoles('guest'),
  createReservationValidator,
  validateRequest,
  createReservation
);

/*
 * UPDATE RESERVATION
 */

router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('admin', 'guest'),
  updateReservationValidator,
  validateRequest,
  updateReservation
);

/*
 * UPDATE RESERVATION STATUS
 * Admin: can update any reservation status
 * Guest: can only cancel their own Pending/Confirmed reservation
 */

router.patch(
  '/:id/status',
  authenticateToken,
  authorizeRoles('admin', 'guest'),
  updateReservationStatus
);

/*
 * DELETE RESERVATION
 * Admin only
 */

router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('admin'),
  deleteReservation
);

module.exports = router;