const Place = require('../models/Place');
const Promo = require('../models/Promo');
const Review = require('../models/Review');
const Like = require('../models/Like');
const Saved = require('../models/Saved');

async function getPlaces(req, res, next) {
    try {
        const filters = {
            q: req.query.q,
            district: req.query.district,
            tag: req.query.tag,
            wifi: req.query.wifi,
            outlets: req.query.outlets
        };
        
        const options = {
            sort: req.query.sort || 'recent',
            page: req.query.page || 1,
            limit: req.query.limit || 20
        };
        
        const result = await Place.findPlaces(filters, options);
        
        // Add personalization flags
        if (req.user) {
            const placeIds = result.places.map(p => p.placeId);
            const likedIds = await Like.checkMultipleLikes(req.user._id, 'place', placeIds);
            const savedIds = await Saved.checkMultipleSaved(req.user._id, 'place', placeIds);
            
            result.places = result.places.map(place => ({
                ...place,
                isLikedByMe: likedIds.includes(place.placeId),
                isSavedByMe: savedIds.includes(place.placeId)
            }));
        } else {
            result.places = result.places.map(place => ({
                ...place,
                isLikedByMe: false,
                isSavedByMe: false
            }));
        }
        
        res.json({
            data: result.places,
            meta: result.meta
        });
    } catch (error) {
        next(error);
    }
}

async function getPlaceById(req, res, next) {
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
        
        // Get promos for this place
        const promosResult = await Promo.findPromos({ placeId, active: true }, {});
        
        // Get reviews summary
        const reviews = await Review.findReviewsByPlaceId(placeId, { limit: 5 });
        
        // Add personalization flags
        let isLikedByMe = false;
        let isSavedByMe = false;
        
        if (req.user) {
            const like = await Like.findLike(req.user._id, 'place', placeId);
            const saved = await Saved.findSaved(req.user._id, 'place', placeId);
            isLikedByMe = !!like;
            isSavedByMe = !!saved;
        }
        
        res.json({
            data: {
                place: {
                    ...place,
                    isLikedByMe,
                    isSavedByMe
                },
                promos: promosResult.promos,
                reviews
            }
        });
    } catch (error) {
        next(error);
    }
}

async function likePlace(req, res, next) {
    try {
        const { placeId } = req.params;
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
        
        const existingLike = await Like.findLike(userId, 'place', placeId);
        
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
            targetType: 'place',
            targetId: placeId
        });
        
        await Place.updatePlaceCounts(placeId, 'likesCount', 1);
        
        res.json({
            data: {
                message: 'Place liked'
            }
        });
    } catch (error) {
        next(error);
    }
}

async function unlikePlace(req, res, next) {
    try {
        const { placeId } = req.params;
        const userId = req.user._id.toString();
        
        const deleted = await Like.deleteLike(userId, 'place', placeId);
        
        if (!deleted) {
            return res.status(404).json({
                error: {
                    message: 'Like not found',
                    code: 'LIKE_NOT_FOUND'
                }
            });
        }
        
        await Place.updatePlaceCounts(placeId, 'likesCount', -1);
        
        res.json({
            data: {
                message: 'Place unliked'
            }
        });
    } catch (error) {
        next(error);
    }
}

async function savePlace(req, res, next) {
    try {
        const { placeId } = req.params;
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
        
        const existingSaved = await Saved.findSaved(userId, 'place', placeId);
        
        if (existingSaved) {
            return res.status(409).json({
                error: {
                    message: 'Already saved',
                    code: 'ALREADY_SAVED'
                }
            });
        }
        
        await Saved.createSaved({
            userId,
            targetType: 'place',
            targetId: placeId
        });
        
        await Place.updatePlaceCounts(placeId, 'savesCount', 1);
        
        res.json({
            data: {
                message: 'Place saved'
            }
        });
    } catch (error) {
        next(error);
    }
}

async function unsavePlace(req, res, next) {
    try {
        const { placeId } = req.params;
        const userId = req.user._id.toString();
        
        const deleted = await Saved.deleteSaved(userId, 'place', placeId);
        
        if (!deleted) {
            return res.status(404).json({
                error: {
                    message: 'Saved place not found',
                    code: 'SAVED_NOT_FOUND'
                }
            });
        }
        
        await Place.updatePlaceCounts(placeId, 'savesCount', -1);
        
        res.json({
            data: {
                message: 'Place unsaved'
            }
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getPlaces,
    getPlaceById,
    likePlace,
    unlikePlace,
    savePlace,
    unsavePlace
};
