const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
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

router.post('/', authMiddleware, validate(validationRules.createSession), sessionController.createSession);
router.get('/', optionalAuth, validate(validationRules.pagination), sessionController.getSessions);
router.get('/:sessionId', authMiddleware, sessionController.getSessionById);
router.post('/:sessionId/join', authMiddleware, sessionController.joinSession);
router.post('/:sessionId/participants/:userId/accept', authMiddleware, sessionController.acceptParticipant);
router.post('/:sessionId/participants/:userId/decline', authMiddleware, sessionController.declineParticipant);
router.post('/:sessionId/leave', authMiddleware, sessionController.leaveSession);
router.post('/:sessionId/cancel', authMiddleware, sessionController.cancelSession);
router.post('/:sessionId/save', authMiddleware, sessionController.saveSession);
router.delete('/:sessionId/save', authMiddleware, sessionController.unsaveSession);
router.post('/:sessionId/invite/:friendId', authMiddleware, sessionController.inviteFriend);

module.exports = router;
