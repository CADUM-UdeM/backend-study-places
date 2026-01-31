const { ObjectId } = require('mongodb');
const { getDatabase } = require('../config/database');

const COLLECTION_NAME = 'notifications';

const NOTIFICATION_TYPES = {
    FRIEND_REQUEST: 'FRIEND_REQUEST',
    FRIEND_ACCEPTED: 'FRIEND_ACCEPTED',
    SESSION_REQUEST: 'SESSION_REQUEST',
    SESSION_ACCEPTED: 'SESSION_ACCEPTED',
    SESSION_INVITE: 'SESSION_INVITE',
    SESSION_CANCELLED: 'SESSION_CANCELLED',
    PROMO_LIKED: 'PROMO_LIKED',
    PROMO_SAVED: 'PROMO_SAVED',
    REVIEW_LIKED: 'REVIEW_LIKED',
    NEW_PROMO_NEARBY: 'NEW_PROMO_NEARBY'
};

async function createNotification(notificationData) {
    const db = getDatabase();
    const now = new Date();
    
    const notification = {
        userId: new ObjectId(notificationData.userId),
        type: notificationData.type,
        title: notificationData.title,
        description: notificationData.description || '',
        data: notificationData.data || {},
        isRead: false,
        createdAt: now
    };

    const result = await db.collection(COLLECTION_NAME).insertOne(notification);
    return { ...notification, _id: result.insertedId };
}

async function findUserNotifications(userId, options = {}) {
    const db = getDatabase();
    
    const page = parseInt(options.page) || 1;
    const limit = parseInt(options.limit) || 50;
    const skip = (page - 1) * limit;
    
    const notifications = await db.collection(COLLECTION_NAME)
        .find({ userId: new ObjectId(userId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();
    
    const total = await db.collection(COLLECTION_NAME).countDocuments({ userId: new ObjectId(userId) });
    
    return {
        notifications,
        meta: { page, limit, total }
    };
}

async function markNotificationAsRead(notificationId) {
    const db = getDatabase();
    await db.collection(COLLECTION_NAME).updateOne(
        { _id: new ObjectId(notificationId) },
        { $set: { isRead: true } }
    );
}

async function markAllNotificationsAsRead(userId) {
    const db = getDatabase();
    await db.collection(COLLECTION_NAME).updateMany(
        { userId: new ObjectId(userId), isRead: false },
        { $set: { isRead: true } }
    );
}

module.exports = {
    COLLECTION_NAME,
    NOTIFICATION_TYPES,
    createNotification,
    findUserNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
};
