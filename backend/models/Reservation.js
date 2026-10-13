const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    reservationId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    guest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    guestName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },

    phone: {
      type: String,
      required: true,
      trim: true
    },

    date: {
      type: String,
      required: true,
      trim: true
    },

    time: {
      type: String,
      required: true,
      trim: true
    },

    partySize: {
      type: Number,
      required: true,
      min: 1,
      max: 30
    },

    servicePeriod: {
      type: String,
      enum: ['dinner', 'brunch'],
      required: true
    },

    diningOption: {
      type: String,
      enum: ['tasting', 'alacarte', 'table'],
      required: true
    },

    tastingMenu: {
      type: String,
      default: '',
      trim: true
    },

    beveragePairing: {
      type: Boolean,
      default: false
    },

    packageName: {
      type: String,
      default: '',
      trim: true
    },

    table: {
      type: String,
      default: '',
      trim: true
    },

    deposit: {
      type: Number,
      min: 0,
      default: 0
    },

    dietaryNotes: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500
    },

    specialRequests: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500
    },

    status: {
      type: String,
      enum: [
        'Pending',
        'Confirmed',
        'Seated',
        'Completed',
        'Cancelled'
      ],
      default: 'Pending'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  'Reservation',
  reservationSchema
);