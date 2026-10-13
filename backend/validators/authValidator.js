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

module.exports = {
  guestSignupValidator,
  guestLoginValidator,
  adminLoginValidator
};