const { ObjectId } = require('mongodb');
const { getDatabase } = require('../config/database');

const COLLECTION_NAME = 'sessionParticipants';

async function createParticipant(participantData) {
    const db = getDatabase();
    const now = new Date();
    
    const participant = {
        sessionId: new ObjectId(participantData.sessionId),
        userId: new ObjectId(participantData.userId),
        status: participantData.status || 'pending',
        createdAt: now,
        updatedAt: now
    };

    const result = await db.collection(COLLECTION_NAME).insertOne(participant);
    return { ...participant, _id: result.insertedId };
}

async function findParticipantsBySessionId(sessionId) {
    const db = getDatabase();
    return await db.collection(COLLECTION_NAME)
        .find({ sessionId: new ObjectId(sessionId) })
        .toArray();
}

async function findParticipant(sessionId, userId) {
    const db = getDatabase();
    return await db.collection(COLLECTION_NAME).findOne({
        sessionId: new ObjectId(sessionId),
        userId: new ObjectId(userId)
    });
}

async function updateParticipantStatus(sessionId, userId, status) {
    const db = getDatabase();
    const result = await db.collection(COLLECTION_NAME).findOneAndUpdate(
        { 
            sessionId: new ObjectId(sessionId),
            userId: new ObjectId(userId)
        },
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

async function deleteParticipant(sessionId, userId) {
    const db = getDatabase();
    const result = await db.collection(COLLECTION_NAME).deleteOne({
        sessionId: new ObjectId(sessionId),
        userId: new ObjectId(userId)
    });
    
    return result.deletedCount > 0;
}

async function countParticipantsByStatus(sessionId, status) {
    const db = getDatabase();
    return await db.collection(COLLECTION_NAME).countDocuments({
        sessionId: new ObjectId(sessionId),
        status
    });
}

module.exports = {
    COLLECTION_NAME,
    createParticipant,
    findParticipantsBySessionId,
    findParticipant,
    updateParticipantStatus,
    deleteParticipant,
    countParticipantsByStatus
};
