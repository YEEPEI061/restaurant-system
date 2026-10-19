const { body } = require('express-validator');

const reservationStatuses = [
  'Pending',
  'Confirmed',
  'Seated',
  'Completed',
  'Cancelled'
];

const servicePeriods = [
  'dinner',
  'brunch'
];

const diningOptions = [
  'tasting',
  'alacarte',
  'table'
];

const createReservationValidator = [
  body('guestName')
    .trim()
    .notEmpty()
    .withMessage('Guest name is required')
    .isLength({ max: 100 })
    .withMessage('Guest name cannot exceed 100 characters'),

  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .isLength({ max: 30 })
    .withMessage('Phone number cannot exceed 30 characters'),

  body('date')
    .trim()
    .notEmpty()
    .withMessage('Reservation date is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Reservation date must use YYYY-MM-DD format'),

  body('time')
    .trim()
    .notEmpty()
    .withMessage('Reservation time is required')
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('Reservation time must use HH:MM format'),

  body('partySize')
    .isInt({ min: 1, max: 30 })
    .withMessage('Party size must be between 1 and 30'),

  body('servicePeriod')
    .isIn(servicePeriods)
    .withMessage('Invalid service period'),

  body('seating')
    .isIn([
      'Main Dining Room',
      "Chef's Counter",
      'Garden Solarium'
    ])
    .withMessage('Invalid seating option'),

  body('diningOption')
    .isIn(diningOptions)
    .withMessage('Invalid dining option'),

    body('selectedDishes')
    .optional()
    .isArray()
    .withMessage('Selected dishes must be an array'),
  
  body('selectedDishes.*.id')
    .if(body('selectedDishes').exists())
    .trim()
    .notEmpty()
    .withMessage('Selected dish ID is required'),
  
  body('selectedDishes.*.name')
    .if(body('selectedDishes').exists())
    .trim()
    .notEmpty()
    .withMessage('Selected dish name is required'),
  
  body('selectedDishes.*.price')
    .if(body('selectedDishes').exists())
    .isFloat({ min: 0 })
    .withMessage('Selected dish price must be a valid non-negative number'),

  body('tastingMenu')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Tasting menu name cannot exceed 200 characters'),

  body('beveragePairing')
    .optional()
    .isBoolean()
    .withMessage('Beverage pairing must be true or false'),

  body('packageName')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Package name cannot exceed 200 characters'),

  body('table')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Table number cannot exceed 20 characters'),

  body('specialRequests')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Special requests cannot exceed 500 characters'),

  body('status')
    .optional()
    .isIn(reservationStatuses)
    .withMessage('Invalid reservation status')
];

const updateReservationValidator = [
  body('guestName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Guest name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Guest name cannot exceed 100 characters'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('phone')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Phone number cannot be empty')
    .isLength({ max: 30 })
    .withMessage('Phone number cannot exceed 30 characters'),

  body('date')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Reservation date cannot be empty')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Reservation date must use YYYY-MM-DD format'),

  body('time')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Reservation time cannot be empty')
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('Reservation time must use HH:MM format'),

  body('partySize')
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage('Party size must be between 1 and 30'),

  body('servicePeriod')
    .optional()
    .isIn(servicePeriods)
    .withMessage('Invalid service period'),

  body('seating')
    .optional()
    .isIn([
      'Main Dining Room',
      "Chef's Counter",
      'Garden Solarium'
    ])
    .withMessage('Invalid seating option'),

  body('diningOption')
    .optional()
    .isIn(diningOptions)
    .withMessage('Invalid dining option'),

  body('tastingMenu')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Tasting menu name cannot exceed 200 characters'),

  body('beveragePairing')
    .optional()
    .isBoolean()
    .withMessage('Beverage pairing must be true or false'),

  body('packageName')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Package name cannot exceed 200 characters'),

  body('table')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Table number cannot exceed 20 characters'),

  body('specialRequests')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Special requests cannot exceed 500 characters'),

  body('status')
    .optional()
    .isIn(reservationStatuses)
    .withMessage('Invalid reservation status')
];

module.exports = {
  createReservationValidator,
  updateReservationValidator
};