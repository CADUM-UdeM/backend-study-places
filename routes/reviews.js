const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authMiddleware } = require('../middleware/auth');
const { validate, validationRules } = require('../middleware/validation');

router.get('/places/:placeId/reviews', reviewController.getPlaceReviews);
router.post('/places/:placeId/reviews', authMiddleware, validate(validationRules.createReview), reviewController.createReview);
router.patch('/:reviewId', authMiddleware, validate(validationRules.createReview), reviewController.updateReview);
router.delete('/:reviewId', authMiddleware, reviewController.deleteReview);
router.post('/:reviewId/like', authMiddleware, reviewController.likeReview);
router.delete('/:reviewId/like', authMiddleware, reviewController.unlikeReview);

module.exports = router;
