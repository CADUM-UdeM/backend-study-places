const { ObjectId } = require('mongodb');
const { getDatabase } = require('../config/database');

const COLLECTION_NAME = 'likes';

async function createLike(likeData) {
    const db = getDatabase();
    const now = new Date();
    
    const like = {
        userId: new ObjectId(likeData.userId),
        targetType: likeData.targetType,
        targetId: likeData.targetType === 'place' ? likeData.targetId : new ObjectId(likeData.targetId),
        createdAt: now
    };

    const result = await db.collection(COLLECTION_NAME).insertOne(like);
    return { ...like, _id: result.insertedId };
}

async function findLike(userId, targetType, targetId) {
    const db = getDatabase();
    const query = {
        userId: new ObjectId(userId),
        targetType
    };
    
    if (targetType === 'place') {
        query.targetId = targetId;
    } else {
        query.targetId = new ObjectId(targetId);
    }
    
    return await db.collection(COLLECTION_NAME).findOne(query);
}

async function deleteLike(userId, targetType, targetId) {
    const db = getDatabase();
    const query = {
        userId: new ObjectId(userId),
        targetType
    };
    
    if (targetType === 'place') {
        query.targetId = targetId;
    } else {
        query.targetId = new ObjectId(targetId);
    }
    
    const result = await db.collection(COLLECTION_NAME).deleteOne(query);
    return result.deletedCount > 0;
}

async function findUserLikes(userId, targetType = null, options = {}) {
    const db = getDatabase();
    const query = { userId: new ObjectId(userId) };
    
    if (targetType) {
        query.targetType = targetType;
    }
    
    const page = parseInt(options.page) || 1;
    const limit = parseInt(options.limit) || 50;
    const skip = (page - 1) * limit;
    
    return await db.collection(COLLECTION_NAME)
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();
}

async function checkMultipleLikes(userId, targetType, targetIds) {
    const db = getDatabase();
    const query = {
        userId: new ObjectId(userId),
        targetType
    };
    
    if (targetType === 'place') {
        query.targetId = { $in: targetIds };
    } else {
        query.targetId = { $in: targetIds.map(id => new ObjectId(id)) };
    }
    
    const likes = await db.collection(COLLECTION_NAME)
        .find(query)
        .toArray();
    
    return likes.map(like => targetType === 'place' ? like.targetId : like.targetId.toString());
}

module.exports = {
    COLLECTION_NAME,
    createLike,
    findLike,
    deleteLike,
    findUserLikes,
    checkMultipleLikes
};
