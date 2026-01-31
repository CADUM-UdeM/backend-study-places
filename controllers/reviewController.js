const Review = require('../models/Review');
const Place = require('../models/Place');
const User = require('../models/User');
const Like = require('../models/Like');

async function getPlaceReviews(req, res, next) {
    try {
        const { placeId } = req.params;
        
        const place = await Place.findPlaceById(placeId);
        if (!place) {
            return res.status(404).json({
                error: {
                    message: 'Place not found',
                    code: 'PLACE_NOT_FOUND'
                }
            });
        }
        
        // Get rating summary
        const summary = await Review.getPlaceRatingSummary(placeId);
        
        // Get reviews
        const reviews = await Review.findReviewsByPlaceId(placeId, {
            page: req.query.page || 1,
            limit: req.query.limit || 20
        });
        
        // Populate user details
        const reviewsWithUsers = await Promise.all(
            reviews.map(async (review) => {
                const user = await User.findUserById(review.userId);
                return {
                    _id: review._id,
                    rating: review.rating,
                    text: review.text,
                    likesCount: review.likesCount,
                    createdAt: review.createdAt,
                    user: user ? {
                        _id: user._id,
                        username: user.username,
                        displayName: user.displayName,
                        avatarUrl: user.avatarUrl
                    } : null
                };
            })
        );
        
        res.json({
            data: {
                summary,
                reviews: reviewsWithUsers
            }
        });
    } catch (error) {
        next(error);
    }
}

async function createReview(req, res, next) {
    try {
        const { placeId } = req.params;
        const { rating, text } = req.body;
        const userId = req.user._id.toString();
        
        const place = await Place.findPlaceById(placeId);
        if (!place) {
            return res.status(404).json({
                error: {
                    message: 'Place not found',
                    code: 'PLACE_NOT_FOUND'
                }
            });
        }
        
        // Check if user already reviewed this place
        const existingReview = await Review.findReviewByUserAndPlace(userId, placeId);
        if (existingReview) {
            return res.status(409).json({
                error: {
                    message: 'You already reviewed this place',
                    code: 'REVIEW_EXISTS'
                }
            });
        }
        
        // Create review
        const review = await Review.createReview({
            placeId,
            userId,
            rating,
            text
        });
        
        // Recalculate place rating
        const summary = await Review.getPlaceRatingSummary(placeId);
        await Place.updatePlaceRating(placeId, summary.avg, summary.count);
        
        // Update user stats
        await User.incrementUserStat(userId, 'reviewsCount', 1);
        
        res.status(201).json({
            data: {
                review
            }
        });
    } catch (error) {
        next(error);
    }
}

async function updateReview(req, res, next) {
    try {
        const { reviewId } = req.params;
        const { rating, text } = req.body;
        const userId = req.user._id.toString();
        
        const review = await Review.findReviewById(reviewId);
        
        if (!review) {
            return res.status(404).json({
                error: {
                    message: 'Review not found',
                    code: 'REVIEW_NOT_FOUND'
                }
            });
        }
        
        // Check ownership
        if (review.userId.toString() !== userId) {
            return res.status(403).json({
                error: {
                    message: 'You can only update your own reviews',
                    code: 'FORBIDDEN'
                }
            });
        }
        
        const updateData = {};
        if (rating !== undefined) updateData.rating = rating;
        if (text !== undefined) updateData.text = text;
        
        const updatedReview = await Review.updateReview(reviewId, updateData);
        
        // Recalculate place rating
        const summary = await Review.getPlaceRatingSummary(review.placeId);
        await Place.updatePlaceRating(review.placeId, summary.avg, summary.count);
        
        res.json({
            data: {
                review: updatedReview
            }
        });
    } catch (error) {
        next(error);
    }
}

async function deleteReview(req, res, next) {
    try {
        const { reviewId } = req.params;
        const userId = req.user._id.toString();
        
        const review = await Review.findReviewById(reviewId);
        
        if (!review) {
            return res.status(404).json({
                error: {
                    message: 'Review not found',
                    code: 'REVIEW_NOT_FOUND'
                }
            });
        }
        
        // Check ownership
        if (review.userId.toString() !== userId) {
            return res.status(403).json({
                error: {
                    message: 'You can only delete your own reviews',
                    code: 'FORBIDDEN'
                }
            });
        }
        
        const placeId = review.placeId;
        await Review.deleteReview(reviewId);
        
        // Recalculate place rating
        const summary = await Review.getPlaceRatingSummary(placeId);
        await Place.updatePlaceRating(placeId, summary.avg, summary.count);
        
        // Update user stats
        await User.incrementUserStat(userId, 'reviewsCount', -1);
        
        res.json({
            data: {
                message: 'Review deleted'
            }
        });
    } catch (error) {
        next(error);
    }
}

async function likeReview(req, res, next) {
    try {
        const { reviewId } = req.params;
        const userId = req.user._id.toString();
        
        const review = await Review.findReviewById(reviewId);
        if (!review) {
            return res.status(404).json({
                error: {
                    message: 'Review not found',
                    code: 'REVIEW_NOT_FOUND'
                }
            });
        }
        
        const existingLike = await Like.findLike(userId, 'review', reviewId);
        
        if (existingLike) {
            return res.status(409).json({
                error: {
                    message: 'Already liked',
                    code: 'ALREADY_LIKED'
                }
            });
        }
        
        await Like.createLike({
            userId,
            targetType: 'review',
            targetId: reviewId
        });
        
        await Review.updateReviewCounts(reviewId, 'likesCount', 1);
        
        res.json({
            data: {
                message: 'Review liked'
            }
        });
    } catch (error) {
        next(error);
    }
}

async function unlikeReview(req, res, next) {
    try {
        const { reviewId } = req.params;
        const userId = req.user._id.toString();
        
        const deleted = await Like.deleteLike(userId, 'review', reviewId);
        
        if (!deleted) {
            return res.status(404).json({
                error: {
                    message: 'Like not found',
                    code: 'LIKE_NOT_FOUND'
                }
            });
        }
        
        await Review.updateReviewCounts(reviewId, 'likesCount', -1);
        
        res.json({
            data: {
                message: 'Review unliked'
            }
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getPlaceReviews,
    createReview,
    updateReview,
    deleteReview,
    likeReview,
    unlikeReview
};
