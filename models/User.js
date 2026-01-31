const { ObjectId } = require('mongodb');
const { getDatabase } = require('../config/database');

const COLLECTION_NAME = 'users';

async function createUser(userData) {
    const db = getDatabase();
    const now = new Date();
    
    const user = {
        email: userData.email,
        username: userData.username,
        displayName: userData.displayName || 'Deja Brew guest',
        passwordHash: userData.passwordHash,
        avatarUrl: userData.avatarUrl || null,
        bio: userData.bio || '',
        school: userData.school || '',
        preferences: {
            noise: userData.preferences?.noise || 'quiet',
            wifi: userData.preferences?.wifi || true,
            outlets: userData.preferences?.outlets || true,
            favoriteDistricts: userData.preferences?.favoriteDistricts || [],
            tags: userData.preferences?.tags || []
        },
        push: {
            expoToken: userData.push?.expoToken || null
        },
        stats: {
            sessionsCreated: 0,
            sessionsJoined: 0,
            reviewsCount: 0,
            likesGiven: 0
        },
        status: {
            isBanned: false,
            bannedReason: null
        },
        createdAt: now,
        updatedAt: now
    };

    const result = await db.collection(COLLECTION_NAME).insertOne(user);
    return { ...user, _id: result.insertedId };
}

async function findUserById(userId) {
    const db = getDatabase();
    return await db.collection(COLLECTION_NAME).findOne({ _id: new ObjectId(userId) });
}

async function findUserByEmail(email) {
    const db = getDatabase();
    return await db.collection(COLLECTION_NAME).findOne({ email });
}

async function findUserByUsername(username) {
    const db = getDatabase();
    return await db.collection(COLLECTION_NAME).findOne({ username });
}

async function updateUser(userId, updateData) {
    const db = getDatabase();
    const update = {
        ...updateData,
        updatedAt: new Date()
    };
    
    const result = await db.collection(COLLECTION_NAME).findOneAndUpdate(
        { _id: new ObjectId(userId) },
        { $set: update },
        { returnDocument: 'after' }
    );
    
    return result;
}

async function searchUsers(query, limit = 20) {
    const db = getDatabase();
    const searchRegex = new RegExp(query, 'i');
    
    return await db.collection(COLLECTION_NAME)
        .find({
            $or: [
                { username: searchRegex },
                { displayName: searchRegex }
            ]
        })
        .project({ passwordHash: 0 })
        .limit(limit)
        .toArray();
}

async function incrementUserStat(userId, statField, amount = 1) {
    const db = getDatabase();
    await db.collection(COLLECTION_NAME).updateOne(
        { _id: new ObjectId(userId) },
        { 
            $inc: { [`stats.${statField}`]: amount },
            $set: { updatedAt: new Date() }
        }
    );
}

module.exports = {
    COLLECTION_NAME,
    createUser,
    findUserById,
    findUserByEmail,
    findUserByUsername,
    updateUser,
    searchUsers,
    incrementUserStat
};
