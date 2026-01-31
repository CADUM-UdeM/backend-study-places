const express = require('express');
const router = express.Router();
const blockController = require('../controllers/blockController');
const { authMiddleware } = require('../middleware/auth');

router.post('/:userId', authMiddleware, blockController.blockUser);
router.delete('/:userId', authMiddleware, blockController.unblockUser);
router.post('/reports', authMiddleware, blockController.createReport);

module.exports = router;
