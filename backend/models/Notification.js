const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },

        recipientRole: {
            type: String,
            enum: ['guest', 'admin'],
            required: true
        },

        type: {
            type: String,
            enum: [
                'reservation_created',
                'reservation_updated',
                'reservation_cancelled',
                'reservation_confirmed',
                'table_assigned'
            ],
            required: true
        },

        title: {
            type: String,
            required: true,
            trim: true
        },

        message: {
            type: String,
            required: true,
            trim: true
        },

        reservationId: {
            type: String,
            default: null
        },

        read: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

notificationSchema.index({
    recipient: 1,
    recipientRole: 1,
    read: 1,
    createdAt: -1
});

module.exports = mongoose.model(
    'Notification',
    notificationSchema
);