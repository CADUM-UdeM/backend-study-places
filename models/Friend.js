const { ObjectId } = require('mongodb');
const { getDatabase } = require('../config/database');

const COLLECTION_NAME = 'friends';

async function createFriendship(userId1, userId2) {
    const db = getDatabase();
    const now = new Date();
    
    // Create bidirectional friendship
    const friendship1 = {
        userId: new ObjectId(userId1),
        friendId: new ObjectId(userId2),
        createdAt: now
    };
    
    const friendship2 = {
        userId: new ObjectId(userId2),
        friendId: new ObjectId(userId1),
        createdAt: now
    };
    
    await db.collection(COLLECTION_NAME).insertMany([friendship1, friendship2]);
    return true;
}

async function findFriendship(userId, friendId) {
    const db = getDatabase();
    return await db.collection(COLLECTION_NAME).findOne({
        userId: new ObjectId(userId),
        friendId: new ObjectId(friendId)
    });
}

async function findUserFriends(userId) {
    const db = getDatabase();
    return await db.collection(COLLECTION_NAME)
        .find({ userId: new ObjectId(userId) })
        .sort({ createdAt: -1 })
        .toArray();
}

async function deleteFriendship(userId, friendId) {
    const db = getDatabase();
    // Delete both directions
    await db.collection(COLLECTION_NAME).deleteMany({
        $or: [
            { userId: new ObjectId(userId), friendId: new ObjectId(friendId) },
            { userId: new ObjectId(friendId), friendId: new ObjectId(userId) }
        ]
    });
    
    return true;
}

async function areFriends(userId, friendId) {
    const db = getDatabase();
    const friendship = await db.collection(COLLECTION_NAME).findOne({
        userId: new ObjectId(userId),
        friendId: new ObjectId(friendId)
    });
    
    return !!friendship;
}

module.exports = {
    COLLECTION_NAME,
    createFriendship,
    findFriendship,
    findUserFriends,
    deleteFriendship,
    areFriends
};
