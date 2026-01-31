const express = require('express');
const router = express.Router();
const promoController = require('../controllers/promoController');
const { authMiddleware } = require('../middleware/auth');
const { validate, validationRules } = require('../middleware/validation');

// Optional auth
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authMiddleware(req, res, next);
    }
    next();
};

router.get('/', optionalAuth, validate(validationRules.pagination), promoController.getPromos);
router.post('/:promoId/like', authMiddleware, promoController.likePromo);
router.delete('/:promoId/like', authMiddleware, promoController.unlikePromo);
router.post('/:promoId/save', authMiddleware, promoController.savePromo);
router.delete('/:promoId/save', authMiddleware, promoController.unsavePromo);

module.exports = router;
