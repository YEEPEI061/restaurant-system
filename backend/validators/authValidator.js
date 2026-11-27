const { body } = require('express-validator');

const guestSignupValidator = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required'),

  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required'),

  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),

  body('phone')
    .optional()
    .trim()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number')
];

const guestLoginValidator = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const adminLoginValidator = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Update profile validator
const updateProfileValidator = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required'),

  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required'),

  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number')
];

// Change password validator
const changePasswordValidator = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),

  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
];

module.exports = {
  guestSignupValidator,
  guestLoginValidator,
  adminLoginValidator,
  updateProfileValidator,
  changePasswordValidator
};