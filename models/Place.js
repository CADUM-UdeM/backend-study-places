const { ObjectId } = require('mongodb');
const { getDatabase } = require('../config/database');

const COLLECTION_NAME = 'places';

async function createPlace(placeData) {
    const db = getDatabase();
    const now = new Date();
    
    const place = {
        placeId: placeData.placeId,
        name: placeData.name,
        address: placeData.address,
        district: placeData.district,
        vibe: placeData.vibe,
        studyAtmosphere: placeData.studyAtmosphere || [],
        wifi: placeData.wifi || false,
        outlets: placeData.outlets || false,
        food: placeData.food || [],
        hours: placeData.hours,
        tags: placeData.tags || [],
        coords: placeData.coords || null,
        priceLevel: placeData.priceLevel || '$$',
        ratingSummary: {
            avg: 0,
            count: 0
        },
        savesCount: 0,
        likesCount: 0,
        createdAt: now,
        updatedAt: now
    };

    const result = await db.collection(COLLECTION_NAME).insertOne(place);
    return { ...place, _id: result.insertedId };
}

async function findPlaceById(placeId) {
    const db = getDatabase();
    return await db.collection(COLLECTION_NAME).findOne({ placeId });
}

async function findPlaces(filters = {}, options = {}) {
    const db = getDatabase();
    const query = {};
    
    // Text search
    if (filters.q) {
        query.$or = [
            { name: new RegExp(filters.q, 'i') },
            { district: new RegExp(filters.q, 'i') }
        ];
    }
    
    // District filter
    if (filters.district) {
        query.district = filters.district;
    }
    
    // Tag filter
    if (filters.tag) {
        query.tags = filters.tag;
    }
    
    // Boolean filters
    if (filters.wifi === 'true' || filters.wifi === true) {
        query.wifi = true;
    }
    if (filters.outlets === 'true' || filters.outlets === true) {
        query.outlets = true;
    }
    
    // Sorting
    let sort = { createdAt: -1 };
    if (options.sort === 'rating') {
        sort = { 'ratingSummary.avg': -1 };
    } else if (options.sort === 'popular') {
        sort = { likesCount: -1 };
    }
    
    const page = parseInt(options.page) || 1;
    const limit = parseInt(options.limit) || 20;
    const skip = (page - 1) * limit;
    
    const places = await db.collection(COLLECTION_NAME)
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray();
    
    const total = await db.collection(COLLECTION_NAME).countDocuments(query);
    
    return {
        places,
        meta: { page, limit, total }
    };
}

async function updatePlaceRating(placeId, avg, count) {
    const db = getDatabase();
    await db.collection(COLLECTION_NAME).updateOne(
        { placeId },
        { 
            $set: { 
                'ratingSummary.avg': avg,
                'ratingSummary.count': count,
                updatedAt: new Date()
            }
        }
    );
}

async function updatePlaceCounts(placeId, field, increment) {
    const db = getDatabase();
    await db.collection(COLLECTION_NAME).updateOne(
        { placeId },
        { 
            $inc: { [field]: increment },
            $set: { updatedAt: new Date() }
        }
    );
}

module.exports = {
    COLLECTION_NAME,
    createPlace,
    findPlaceById,
    findPlaces,
    updatePlaceRating,
    updatePlaceCounts
};
