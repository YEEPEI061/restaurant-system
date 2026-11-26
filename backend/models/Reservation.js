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

    selectedDishes: {
      type: [
        {
          id: {
            type: String,
            required: true,
            trim: true
          },
          name: {
            type: String,
            required: true,
            trim: true
          },
          price: {
            type: Number,
            required: true,
            min: 0
          },
          quantity: {
            type: Number,
            default: 1,
            min: 1
          }
        }
      ],
      default: []
    },

    tastingMenus: {
      type: [
        {
          name: {
            type: String,
            required: true,
            trim: true
          },
          quantity: {
            type: Number,
            required: true,
            min: 1
          },
          price: {
            type: Number,
            required: true,
            min: 0
          }
        }
      ],
      default: []
    },

    table: {
      type: String,
      default: '',
      trim: true
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
        'Cancelled',
        'Expired'
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