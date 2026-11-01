const Notification = require('../models/Notification');

const {
    broadcast
} = require('./websocketService');


async function createNotification({
    recipient = null,
    recipientRole,
    type,
    title,
    message,
    reservationId = null
}) {

    const notification =
        await Notification.create({
            recipient,
            recipientRole,
            type,
            title,
            message,
            reservationId
        });

    broadcast({
        type: 'notification.created',
        notification
    });

    return notification;
}


module.exports = {
    createNotification
};