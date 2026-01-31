const Promo = require('../models/Promo');
const Place = require('../models/Place');
const Like = require('../models/Like');
const Saved = require('../models/Saved');

async function getPromos(req, res, next) {
    try {
        const filters = {
            placeId: req.query.placeId,
            active: req.query.active,
            tag: req.query.tag
        };
        
        const options = {
            sort: req.query.sort || 'recent',
            page: req.query.page || 1,
            limit: req.query.limit || 20
        };
        
        const result = await Promo.findPromos(filters, options);
        
        // Get place names for promos
        const placeIds = [...new Set(result.promos.map(p => p.placeId))];
        const places = await Promise.all(
            placeIds.map(id => Place.findPlaceById(id))
        );
        const placeMap = {};
        places.forEach(place => {
            if (place) placeMap[place.placeId] = place.name;
        });
        
        // Add personalization flags
        let promosWithDetails = result.promos.map(promo => ({
            ...promo,
            placeName: placeMap[promo.placeId] || 'Unknown',
            isLikedByMe: false,
            isSavedByMe: false
        }));
        
        if (req.user) {
            const promoIds = result.promos.map(p => p._id.toString());
            const likedIds = await Like.checkMultipleLikes(req.user._id, 'promo', promoIds);
            const savedIds = await Saved.checkMultipleSaved(req.user._id, 'promo', promoIds);
            
            promosWithDetails = promosWithDetails.map(promo => ({
                ...promo,
                isLikedByMe: likedIds.includes(promo._id.toString()),
                isSavedByMe: savedIds.includes(promo._id.toString())
            }));
        }
        
        res.json({
            data: promosWithDetails,
            meta: result.meta
        });
    } catch (error) {
        next(error);
    }
}

async function likePromo(req, res, next) {
    try {
        const { promoId } = req.params;
        const userId = req.user._id.toString();
        
        const promo = await Promo.findPromoById(promoId);
        if (!promo) {
            return res.status(404).json({
                error: {
                    message: 'Promo not found',
                    code: 'PROMO_NOT_FOUND'
                }
            });
        }
        
        const existingLike = await Like.findLike(userId, 'promo', promo._id.toString());
        
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
            targetType: 'promo',
            targetId: promo._id.toString()
        });
        
        await Promo.updatePromoCounts(promoId, 'likesCount', 1);
        
        res.json({
            data: {
                message: 'Promo liked'
            }
        });
    } catch (error) {
        next(error);
    }
}

async function unlikePromo(req, res, next) {
    try {
        const { promoId } = req.params;
        const userId = req.user._id.toString();
        
        const promo = await Promo.findPromoById(promoId);
        if (!promo) {
            return res.status(404).json({
                error: {
                    message: 'Promo not found',
                    code: 'PROMO_NOT_FOUND'
                }
            });
        }
        
        const deleted = await Like.deleteLike(userId, 'promo', promo._id.toString());
        
        if (!deleted) {
            return res.status(404).json({
                error: {
                    message: 'Like not found',
                    code: 'LIKE_NOT_FOUND'
                }
            });
        }
        
        await Promo.updatePromoCounts(promoId, 'likesCount', -1);
        
        res.json({
            data: {
                message: 'Promo unliked'
            }
        });
    } catch (error) {
        next(error);
    }
}

async function savePromo(req, res, next) {
    try {
        const { promoId } = req.params;
        const userId = req.user._id.toString();
        
        const promo = await Promo.findPromoById(promoId);
        if (!promo) {
            return res.status(404).json({
                error: {
                    message: 'Promo not found',
                    code: 'PROMO_NOT_FOUND'
                }
            });
        }
        
        const existingSaved = await Saved.findSaved(userId, 'promo', promo._id.toString());
        
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
            targetType: 'promo',
            targetId: promo._id.toString()
        });
        
        await Promo.updatePromoCounts(promoId, 'savesCount', 1);
        
        res.json({
            data: {
                message: 'Promo saved'
            }
        });
    } catch (error) {
        next(error);
    }
}

async function unsavePromo(req, res, next) {
    try {
        const { promoId } = req.params;
        const userId = req.user._id.toString();
        
        const promo = await Promo.findPromoById(promoId);
        if (!promo) {
            return res.status(404).json({
                error: {
                    message: 'Promo not found',
                    code: 'PROMO_NOT_FOUND'
                }
            });
        }
        
        const deleted = await Saved.deleteSaved(userId, 'promo', promo._id.toString());
        
        if (!deleted) {
            return res.status(404).json({
                error: {
                    message: 'Saved promo not found',
                    code: 'SAVED_NOT_FOUND'
                }
            });
        }
        
        await Promo.updatePromoCounts(promoId, 'savesCount', -1);
        
        res.json({
            data: {
                message: 'Promo unsaved'
            }
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getPromos,
    likePromo,
    unlikePromo,
    savePromo,
    unsavePromo
};
