const { body } = require('express-validator');

const menuItemValidator = [
  body('dishId')
    .trim()
    .notEmpty()
    .withMessage('Dish ID is required')
    .matches(/^M-\d{3,}$/)
    .withMessage('Dish ID must follow the format M-001'),

  body('name')
    .trim()
    .notEmpty()
    .withMessage('Dish name is required')
    .isLength({ max: 100 })
    .withMessage('Dish name cannot exceed 100 characters'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  body('category')
    .isIn([
      'Prelude & Starters',
      'Wood-Fire Mains',
      'Mid-Course Savory',
      'Desserts & Confections',
      'Beverages'
    ])
    .withMessage('Invalid menu category'),

  body('station')
    .isIn([
      'Grill & Robata',
      'Larder / Garde Manger',
      'Pastry Line',
      'Beverage Station'
    ])
    .withMessage('Invalid kitchen station'),

  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a number greater than or equal to 0'),

  body('cost')
    .isFloat({ min: 0 })
    .withMessage('Cost must be a number greater than or equal to 0'),

  body('stock')
    .isInt({ min: 0 })
    .withMessage('Stock must be a whole number greater than or equal to 0'),

  body('parCap')
    .isInt({ min: 0 })
    .withMessage('Par cap must be a whole number greater than or equal to 0'),

  body('available')
    .optional()
    .isBoolean()
    .withMessage('Available must be true or false'),

  body('signature')
    .optional()
    .isBoolean()
    .withMessage('Signature must be true or false'),

  body('dietary')
    .optional()
    .isArray()
    .withMessage('Dietary must be an array'),

  body('dietary.*')
    .optional()
    .isIn(['GF', 'DF', 'SF', 'NF', 'Veg'])
    .withMessage('Invalid dietary label'),

  body('image')
    .optional()
    .isString()
    .withMessage('Image must be a string'),

  body('provenance')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('Provenance cannot exceed 300 characters'),

  body('pairing')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('Pairing cannot exceed 300 characters'),

  body('allergens')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Allergen information cannot exceed 500 characters')
];

module.exports = {
  menuItemValidator
};