const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    dishId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },

    category: {
      type: String,
      required: true,
      enum: [
        'Prelude & Starters',
        'Wood-Fire Mains',
        'Mid-Course Savory',
        'Desserts & Confections',
        'Beverages'
      ]
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    available: {
      type: Boolean,
      default: true
    },

    signature: {
      type: Boolean,
      default: false
    },

    dietary: {
      type: [String],
      enum: ['GF', 'DF', 'SF', 'NF', 'Veg'],
      default: []
    },

    image: {
      type: String,
      default: '',
      trim: true
    },

    provenance: {
      type: String,
      default: '',
      trim: true,
      maxlength: 300
    },

    pairing: {
      type: String,
      default: '',
      trim: true,
      maxlength: 300
    },

    allergens: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('MenuItem', menuItemSchema);