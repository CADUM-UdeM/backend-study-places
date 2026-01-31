const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friendController');
const { authMiddleware } = require('../middleware/auth');

router.post('/request/:toUserId', authMiddleware, friendController.sendFriendRequest);
router.post('/accept/:requestId', authMiddleware, friendController.acceptFriendRequest);
router.post('/decline/:requestId', authMiddleware, friendController.declineFriendRequest);
router.delete('/remove/:friendId', authMiddleware, friendController.removeFriend);
router.get('/', authMiddleware, friendController.getFriends);
router.get('/requests', authMiddleware, friendController.getIncomingRequests);

module.exports = router;
