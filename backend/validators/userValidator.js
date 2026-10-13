const { body } = require('express-validator');

const createUserValidator = [
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
    .isLength({ max: 30 })
    .withMessage('Phone number cannot exceed 30 characters'),

  body('role')
    .optional()
    .isIn(['guest', 'admin'])
    .withMessage('Role must be guest or admin'),

  body('active')
    .optional()
    .isBoolean()
    .withMessage('Active must be true or false')
];

const updateUserValidator = [
  body('firstName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('First name cannot be empty'),

  body('lastName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Last name cannot be empty'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),

  body('phone')
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage('Phone number cannot exceed 30 characters'),

  body('role')
    .optional()
    .isIn(['guest', 'admin'])
    .withMessage('Role must be guest or admin'),

  body('active')
    .optional()
    .isBoolean()
    .withMessage('Active must be true or false')
];

module.exports = {
  createUserValidator,
  updateUserValidator
};