const { ObjectId } = require('mongodb');
const { getDatabase } = require('../config/database');

const COLLECTION_NAME = 'promos';

async function createPromo(promoData) {
    const db = getDatabase();
    const now = new Date();
    
    const promo = {
        promoId: promoData.promoId,
        placeId: promoData.placeId,
        title: promoData.title,
        description: promoData.description,
        tag: promoData.tag,
        promoStart: promoData.promoStart,
        promoEnd: promoData.promoEnd,
        isActive: promoData.isActive !== undefined ? promoData.isActive : true,
        likesCount: 0,
        savesCount: 0,
        createdAt: now,
        updatedAt: now
    };

    const result = await db.collection(COLLECTION_NAME).insertOne(promo);
    return { ...promo, _id: result.insertedId };
}

async function findPromos(filters = {}, options = {}) {
    const db = getDatabase();
    const query = {};
    
    if (filters.placeId) {
        query.placeId = filters.placeId;
    }
    
    if (filters.tag) {
        query.tag = filters.tag;
    }
    
    if (filters.active === 'true' || filters.active === true) {
        const now = new Date();
        query.isActive = true;
        query.promoStart = { $lte: now };
        query.promoEnd = { $gte: now };
    }
    
    let sort = { createdAt: -1 };
    if (options.sort === 'popular') {
        sort = { likesCount: -1 };
    } else if (options.sort === 'endingSoon') {
        sort = { promoEnd: 1 };
    }
    
    const page = parseInt(options.page) || 1;
    const limit = parseInt(options.limit) || 20;
    const skip = (page - 1) * limit;
    
    const promos = await db.collection(COLLECTION_NAME)
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray();
    
    const total = await db.collection(COLLECTION_NAME).countDocuments(query);
    
    return {
        promos,
        meta: { page, limit, total }
    };
}

async function findPromoById(promoId) {
    const db = getDatabase();
    return await db.collection(COLLECTION_NAME).findOne({ promoId });
}

async function updatePromoCounts(promoId, field, increment) {
    const db = getDatabase();
    await db.collection(COLLECTION_NAME).updateOne(
        { promoId },
        { 
            $inc: { [field]: increment },
            $set: { updatedAt: new Date() }
        }
    );
}

module.exports = {
    COLLECTION_NAME,
    createPromo,
    findPromos,
    findPromoById,
    updatePromoCounts
};
