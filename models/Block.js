const { ObjectId } = require('mongodb');
const { getDatabase } = require('../config/database');

const COLLECTION_NAME = 'blocks';

async function createBlock(userId, blockedUserId) {
    const db = getDatabase();
    const now = new Date();
    
    const block = {
        userId: new ObjectId(userId),
        blockedUserId: new ObjectId(blockedUserId),
        createdAt: now
    };

    const result = await db.collection(COLLECTION_NAME).insertOne(block);
    return { ...block, _id: result.insertedId };
}

async function findBlock(userId, blockedUserId) {
    const db = getDatabase();
    return await db.collection(COLLECTION_NAME).findOne({
        userId: new ObjectId(userId),
        blockedUserId: new ObjectId(blockedUserId)
    });
}

async function deleteBlock(userId, blockedUserId) {
    const db = getDatabase();
    const result = await db.collection(COLLECTION_NAME).deleteOne({
        userId: new ObjectId(userId),
        blockedUserId: new ObjectId(blockedUserId)
    });
    
    return result.deletedCount > 0;
}

async function getBlockedUserIds(userId) {
    const db = getDatabase();
    const blocks = await db.collection(COLLECTION_NAME)
        .find({ userId: new ObjectId(userId) })
        .toArray();
    
    return blocks.map(block => block.blockedUserId);
}

async function isBlocked(userId, targetUserId) {
    const db = getDatabase();
    const block = await db.collection(COLLECTION_NAME).findOne({
        $or: [
            { userId: new ObjectId(userId), blockedUserId: new ObjectId(targetUserId) },
            { userId: new ObjectId(targetUserId), blockedUserId: new ObjectId(userId) }
        ]
    });
    
    return !!block;
}

module.exports = {
    COLLECTION_NAME,
    createBlock,
    findBlock,
    deleteBlock,
    getBlockedUserIds,
    isBlocked
};
