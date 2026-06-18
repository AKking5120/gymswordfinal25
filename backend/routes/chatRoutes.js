const express = require('express');
const router = express.Router();
const { chat } = require('../controllers/chatController');
const { protectOptional } = require('../middleware/authMiddleware');

router.post('/', protectOptional, chat);

module.exports = router;
