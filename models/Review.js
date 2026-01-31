const { ObjectId } = require('mongodb');
const { getDatabase } = require('../config/database');

const COLLECTION_NAME = 'reviews';

async function createReview(reviewData) {
    const db = getDatabase();
    const now = new Date();
    
    const review = {
        placeId: reviewData.placeId,
        userId: new ObjectId(reviewData.userId),
        rating: reviewData.rating,
        text: reviewData.text || '',
        likesCount: 0,
        createdAt: now,
        updatedAt: now
    };

    const result = await db.collection(COLLECTION_NAME).insertOne(review);
    return { ...review, _id: result.insertedId };
}

async function findReviewsByPlaceId(placeId, options = {}) {
    const db = getDatabase();
    
    const page = parseInt(options.page) || 1;
    const limit = parseInt(options.limit) || 20;
    const skip = (page - 1) * limit;
    
    const reviews = await db.collection(COLLECTION_NAME)
        .find({ placeId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();
    
    return reviews;
}

async function findReviewById(reviewId) {
    const db = getDatabase();
    return await db.collection(COLLECTION_NAME).findOne({ _id: new ObjectId(reviewId) });
}

async function updateReview(reviewId, updateData) {
    const db = getDatabase();
    const result = await db.collection(COLLECTION_NAME).findOneAndUpdate(
        { _id: new ObjectId(reviewId) },
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

async function deleteReview(reviewId) {
    const db = getDatabase();
    const result = await db.collection(COLLECTION_NAME).deleteOne({ _id: new ObjectId(reviewId) });
    return result.deletedCount > 0;
}

async function getPlaceRatingSummary(placeId) {
    const db = getDatabase();
    
    const result = await db.collection(COLLECTION_NAME).aggregate([
        { $match: { placeId } },
        {
            $group: {
                _id: null,
                avg: { $avg: '$rating' },
                count: { $sum: 1 }
            }
        }
    ]).toArray();
    
    if (result.length === 0) {
        return { avg: 0, count: 0 };
    }
    
    return {
        avg: Math.round(result[0].avg * 10) / 10,
        count: result[0].count
    };
}

async function updateReviewCounts(reviewId, field, increment) {
    const db = getDatabase();
    await db.collection(COLLECTION_NAME).updateOne(
        { _id: new ObjectId(reviewId) },
        { 
            $inc: { [field]: increment },
            $set: { updatedAt: new Date() }
        }
    );
}

async function findReviewByUserAndPlace(userId, placeId) {
    const db = getDatabase();
    return await db.collection(COLLECTION_NAME).findOne({ 
        userId: new ObjectId(userId),
        placeId 
    });
}

module.exports = {
    COLLECTION_NAME,
    createReview,
    findReviewsByPlaceId,
    findReviewById,
    updateReview,
    deleteReview,
    getPlaceRatingSummary,
    updateReviewCounts,
    findReviewByUserAndPlace
};
