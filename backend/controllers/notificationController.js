const mongoose = require('mongoose');

const Notification = require('../models/Notification');


/*
 * --------------------------------------------------
 * GET NOTIFICATIONS
 * --------------------------------------------------
 */

async function getNotifications(req, res) {

    try {

        const user = req.user;

        let query;

        if (user.role === 'admin') {

            query = {
                recipientRole: 'admin'
            };

        } else {

            query = {
                recipient: user.userId,
                recipientRole: 'guest'
            };

        }

        const notifications =
            await Notification.find(query)
                .sort({ createdAt: -1 });

        const unreadCount =
            notifications.filter(
                notification => !notification.read
            ).length;

        res.status(200).json({
            notifications,
            unreadCount
        });

    } catch (error) {

        console.error(
            'Get notifications error:',
            error
        );

        res.status(500).json({
            message: 'Unable to retrieve notifications.'
        });

    }
}


/*
 * --------------------------------------------------
 * MARK NOTIFICATION AS READ
 * --------------------------------------------------
 */

async function markNotificationAsRead(req, res) {

    try {

        const { id } = req.params;
        const user = req.user;

        if (!mongoose.Types.ObjectId.isValid(id)) {

            return res.status(400).json({
                message: 'Invalid notification ID.'
            });

        }

        let query = {
            _id: id
        };

        if (user.role === 'admin') {

            query.recipientRole = 'admin';

        } else {

            query.recipient = user.userId;
            query.recipientRole = 'guest';

        }

        const notification =
            await Notification.findOneAndUpdate(
                query,
                {
                    read: true
                },
                {
                    new: true
                }
            );

        if (!notification) {

            return res.status(404).json({
                message: 'Notification not found.'
            });

        }

        res.status(200).json({
            message: 'Notification marked as read.',
            notification
        });

    } catch (error) {

        console.error(
            'Mark notification as read error:',
            error
        );

        res.status(500).json({
            message: 'Unable to update notification.'
        });

    }
}


/*
 * --------------------------------------------------
 * MARK ALL NOTIFICATIONS AS READ
 * --------------------------------------------------
 */

async function markAllNotificationsAsRead(req, res) {

    try {

        const user = req.user;

        let query;

        if (user.role === 'admin') {

            query = {
                recipientRole: 'admin',
                read: false
            };

        } else {

            query = {
                recipient: user.userId,
                recipientRole: 'guest',
                read: false
            };

        }

        const result =
            await Notification.updateMany(
                query,
                {
                    $set: {
                        read: true
                    }
                }
            );

        res.status(200).json({
            message: 'All notifications marked as read.',
            updatedCount: result.modifiedCount
        });

    } catch (error) {

        console.error(
            'Mark all notifications as read error:',
            error
        );

        res.status(500).json({
            message: 'Unable to update notifications.'
        });

    }
}


module.exports = {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
};