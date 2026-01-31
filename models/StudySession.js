const { ObjectId } = require('mongodb');
const { getDatabase } = require('../config/database');

const COLLECTION_NAME = 'studySessions';

async function createSession(sessionData) {
    const db = getDatabase();
    const now = new Date();
    
    const session = {
        createdBy: new ObjectId(sessionData.createdBy),
        title: sessionData.title,
        course: sessionData.course,
        vibe: sessionData.vibe,
        timeSlot: sessionData.timeSlot,
        placeId: sessionData.placeId,
        locationLabel: sessionData.locationLabel,
        maxPeople: sessionData.maxPeople,
        notes: sessionData.notes || '',
        isPublic: sessionData.isPublic !== undefined ? sessionData.isPublic : true,
        status: 'open',
        participantsCount: 1,
        acceptedCount: 1,
        createdAt: now,
        updatedAt: now
    };

    const result = await db.collection(COLLECTION_NAME).insertOne(session);
    return { ...session, _id: result.insertedId };
}

async function findSessions(filters = {}, options = {}) {
    const db = getDatabase();
    const query = {};
    
    if (filters.public === 'true' || filters.public === true) {
        query.isPublic = true;
    }
    
    if (filters.course) {
        query.course = new RegExp(filters.course, 'i');
    }
    
    if (filters.placeId) {
        query.placeId = filters.placeId;
    }
    
    if (filters.district) {
        query.locationLabel = new RegExp(filters.district, 'i');
    }
    
    let sort = { createdAt: -1 };
    if (options.sort === 'popular') {
        sort = { participantsCount: -1 };
    }
    
    const page = parseInt(options.page) || 1;
    const limit = parseInt(options.limit) || 20;
    const skip = (page - 1) * limit;
    
    const sessions = await db.collection(COLLECTION_NAME)
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray();
    
    const total = await db.collection(COLLECTION_NAME).countDocuments(query);
    
    return {
        sessions,
        meta: { page, limit, total }
    };
}

async function findSessionById(sessionId) {
    const db = getDatabase();
    return await db.collection(COLLECTION_NAME).findOne({ _id: new ObjectId(sessionId) });
}

async function updateSession(sessionId, updateData) {
    const db = getDatabase();
    const result = await db.collection(COLLECTION_NAME).findOneAndUpdate(
        { _id: new ObjectId(sessionId) },
        { 
            $set: {
                ...updateData,
                updatedAt: new Date()
            }
        },
        { returnDocument: 'after' }
    );
    
    return result;
}

async function updateSessionCounts(sessionId, updates) {
    const db = getDatabase();
    const setUpdates = {
        updatedAt: new Date()
    };
    
    if (updates.participantsCount !== undefined) {
        setUpdates.participantsCount = updates.participantsCount;
    }
    if (updates.acceptedCount !== undefined) {
        setUpdates.acceptedCount = updates.acceptedCount;
    }
    if (updates.status !== undefined) {
        setUpdates.status = updates.status;
    }
    
    await db.collection(COLLECTION_NAME).updateOne(
        { _id: new ObjectId(sessionId) },
        { $set: setUpdates }
    );
}

module.exports = {
    COLLECTION_NAME,
    createSession,
    findSessions,
    findSessionById,
    updateSession,
    updateSessionCounts
};
