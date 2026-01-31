const express = require('express');
const router = express.Router();
const placeController = require('../controllers/placeController');
const { authMiddleware } = require('../middleware/auth');
const { validate, validationRules } = require('../middleware/validation');

// Optional auth - if user is logged in, add personalization
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authMiddleware(req, res, next);
    }
    next();
};

router.get('/', optionalAuth, validate(validationRules.pagination), placeController.getPlaces);
router.get('/:placeId', optionalAuth, placeController.getPlaceById);
router.post('/:placeId/like', authMiddleware, placeController.likePlace);
router.delete('/:placeId/like', authMiddleware, placeController.unlikePlace);
router.post('/:placeId/save', authMiddleware, placeController.savePlace);
router.delete('/:placeId/save', authMiddleware, placeController.unsavePlace);

module.exports = router;
