const express = require('express');
const router = express.Router();
const savedController = require('../controllers/savedController');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, savedController.getSavedContent);

module.exports = router;
