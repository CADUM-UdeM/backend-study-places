const Notification = require('../models/Notification');

async function getNotifications(req, res, next) {
    try {
        const userId = req.user._id.toString();
        
        const options = {
            page: req.query.page || 1,
            limit: req.query.limit || 50
        };
        
        const result = await Notification.findUserNotifications(userId, options);
        
        res.json({
            data: result.notifications,
            meta: result.meta
        });
    } catch (error) {
        next(error);
    }
}

async function markNotificationAsRead(req, res, next) {
    try {
        const { id } = req.params;
        const userId = req.user._id.toString();
        
        await Notification.markNotificationAsRead(id);
        
        res.json({
            data: {
                message: 'Notification marked as read'
            }
        });
    } catch (error) {
        next(error);
    }
}

async function markAllNotificationsAsRead(req, res, next) {
    try {
        const userId = req.user._id.toString();
        
        await Notification.markAllNotificationsAsRead(userId);
        
        res.json({
            data: {
                message: 'All notifications marked as read'
            }
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
};
