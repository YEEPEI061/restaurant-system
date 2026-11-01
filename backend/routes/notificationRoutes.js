const express = require('express');

const {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
} = require('../controllers/notificationController');

const authenticateToken = require('../middleware/authMiddleware');

const router = express.Router();


/*
 * --------------------------------------------------
 * GET NOTIFICATIONS
 * --------------------------------------------------
 */

router.get(
    '/',
    authenticateToken,
    getNotifications
);


/*
 * --------------------------------------------------
 * MARK ONE NOTIFICATION AS READ
 * --------------------------------------------------
 */

router.patch(
    '/:id/read',
    authenticateToken,
    markNotificationAsRead
);


/*
 * --------------------------------------------------
 * MARK ALL NOTIFICATIONS AS READ
 * --------------------------------------------------
 */

router.patch(
    '/read-all',
    authenticateToken,
    markAllNotificationsAsRead
);


module.exports = router;