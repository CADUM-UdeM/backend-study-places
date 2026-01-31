const { MongoClient, ServerApiVersion } = require('mongodb');

let client = null;
let db = null;

async function connectToDatabase() {
    if (db) {
        return db;
    }

    const uri = process.env.mongodb_key;

    if (!uri) {
        throw new Error('MongoDB connection string not found in environment variables');
    }

    client = new MongoClient(uri, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    });

    try {
        await client.connect();
        console.log('Successfully connected to MongoDB');

        db = client.db('deja_brew');


        return db;
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        throw error;
    }
}

async function createIndexes(database) {
    try {
        // Users indexes
        await database.collection('users').createIndex({ email: 1 }, { unique: true });
        await database.collection('users').createIndex({ username: 1 }, { unique: true });

        // Places indexes
        await database.collection('places').createIndex({ placeId: 1 }, { unique: true });
        await database.collection('places').createIndex({ coords: '2dsphere' });
        await database.collection('places').createIndex({ district: 1 });
        await database.collection('places').createIndex({ tags: 1 });

        // Promos indexes
        await database.collection('promos').createIndex({ placeId: 1 });
        await database.collection('promos').createIndex({ promoEnd: 1 });
        await database.collection('promos').createIndex({ tag: 1 });
        await database.collection('promos').createIndex({ isActive: 1 });

        // Reviews indexes
        await database.collection('reviews').createIndex({ placeId: 1, userId: 1 }, { unique: true });
        await database.collection('reviews').createIndex({ placeId: 1 });

        // Study sessions indexes
        await database.collection('studySessions').createIndex({ createdBy: 1 });
        await database.collection('studySessions').createIndex({ placeId: 1 });
        await database.collection('studySessions').createIndex({ isPublic: 1 });
        await database.collection('studySessions').createIndex({ status: 1 });
        await database.collection('studySessions').createIndex({ createdAt: -1 });

        // Session participants indexes
        await database.collection('sessionParticipants').createIndex({ sessionId: 1, userId: 1 }, { unique: true });
        await database.collection('sessionParticipants').createIndex({ sessionId: 1 });
        await database.collection('sessionParticipants').createIndex({ userId: 1 });

        // Likes indexes
        await database.collection('likes').createIndex({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });
        await database.collection('likes').createIndex({ targetType: 1, targetId: 1 });

        // Saved indexes
        await database.collection('saved').createIndex({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });
        await database.collection('saved').createIndex({ userId: 1 });

        // Friend requests indexes
        await database.collection('friendRequests').createIndex({ fromUserId: 1, toUserId: 1 }, { unique: true });
        await database.collection('friendRequests').createIndex({ toUserId: 1 });

        // Friends indexes
        await database.collection('friends').createIndex({ userId: 1, friendId: 1 }, { unique: true });
        await database.collection('friends').createIndex({ userId: 1 });

        // Notifications indexes
        await database.collection('notifications').createIndex({ userId: 1 });
        await database.collection('notifications').createIndex({ isRead: 1 });
        await database.collection('notifications').createIndex({ createdAt: -1 });

        // Blocks indexes
        await database.collection('blocks').createIndex({ userId: 1, blockedUserId: 1 }, { unique: true });
        await database.collection('blocks').createIndex({ userId: 1 });

        console.log('Database indexes created successfully');
    } catch (error) {
        console.error('Error creating indexes:', error);
        // Don't throw - indexes might already exist
    }
}

function getDatabase() {
    if (!db) {
        throw new Error('Database not connected. Call connectToDatabase() first.');
    }
    return db;
}

async function closeDatabase() {
    if (client) {
        await client.close();
        client = null;
        db = null;
        console.log('Database connection closed');
    }
}

module.exports = {
    connectToDatabase,
    getDatabase,
    closeDatabase
};
