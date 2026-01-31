const { ObjectId } = require('mongodb');
const { getDatabase } = require('../config/database');

const COLLECTION_NAME = 'friendRequests';

async function createFriendRequest(fromUserId, toUserId) {
    const db = getDatabase();
    const now = new Date();
    
    const request = {
        fromUserId: new ObjectId(fromUserId),
        toUserId: new ObjectId(toUserId),
        status: 'pending',
        createdAt: now,
        updatedAt: now
    };

    const result = await db.collection(COLLECTION_NAME).insertOne(request);
    return { ...request, _id: result.insertedId };
}

async function findRequestById(requestId) {
    const db = getDatabase();
    return await db.collection(COLLECTION_NAME).findOne({ _id: new ObjectId(requestId) });
}

async function findPendingRequest(fromUserId, toUserId) {
    const db = getDatabase();
    return await db.collection(COLLECTION_NAME).findOne({
        $or: [
            { fromUserId: new ObjectId(fromUserId), toUserId: new ObjectId(toUserId) },
            { fromUserId: new ObjectId(toUserId), toUserId: new ObjectId(fromUserId) }
        ],
        status: 'pending'
    });
}

async function findIncomingRequests(userId) {
    const db = getDatabase();
    return await db.collection(COLLECTION_NAME)
        .find({ 
            toUserId: new ObjectId(userId),
            status: 'pending'
        })
        .sort({ createdAt: -1 })
        .toArray();
}

async function updateRequestStatus(requestId, status) {
    const db = getDatabase();
    const result = await db.collection(COLLECTION_NAME).findOneAndUpdate(
        { _id: new ObjectId(requestId) },
        { 
            $set: {
                status,
                updatedAt: new Date()
            }
        },
        { returnDocument: 'after' }
    );
    
    return result;
}

module.exports = {
    COLLECTION_NAME,
    createFriendRequest,
    findRequestById,
    findPendingRequest,
    findIncomingRequests,
    updateRequestStatus
};
