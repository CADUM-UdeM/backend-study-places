const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, notificationController.getNotifications);
router.post('/:id/read', authMiddleware, notificationController.markNotificationAsRead);
router.post('/read-all', authMiddleware, notificationController.markAllNotificationsAsRead);

module.exports = router;
