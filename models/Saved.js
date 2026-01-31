const { ObjectId } = require('mongodb');
const { getDatabase } = require('../config/database');

const COLLECTION_NAME = 'saved';

async function createSaved(savedData) {
    const db = getDatabase();
    const now = new Date();
    
    const saved = {
        userId: new ObjectId(savedData.userId),
        targetType: savedData.targetType,
        targetId: savedData.targetType === 'place' ? savedData.targetId : new ObjectId(savedData.targetId),
        createdAt: now
    };

    const result = await db.collection(COLLECTION_NAME).insertOne(saved);
    return { ...saved, _id: result.insertedId };
}

async function findSaved(userId, targetType, targetId) {
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

async function deleteSaved(userId, targetType, targetId) {
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

async function findUserSaved(userId, targetType = null, options = {}) {
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

async function checkMultipleSaved(userId, targetType, targetIds) {
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
    
    const saved = await db.collection(COLLECTION_NAME)
        .find(query)
        .toArray();
    
    return saved.map(s => targetType === 'place' ? s.targetId : s.targetId.toString());
}

module.exports = {
    COLLECTION_NAME,
    createSaved,
    findSaved,
    deleteSaved,
    findUserSaved,
    checkMultipleSaved
};
