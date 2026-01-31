const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');
const { validate, validationRules } = require('../middleware/validation');

router.post('/register', validate(validationRules.register), authController.register);
router.post('/login', validate(validationRules.login), authController.login);
router.get('/me', authMiddleware, authController.getMe);
router.patch('/me', authMiddleware, validate(validationRules.updateUser), authController.updateMe);
router.post('/me/push-token', authMiddleware, authController.updatePushToken);

module.exports = router;
