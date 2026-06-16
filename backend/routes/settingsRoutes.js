const express = require('express');
const router = express.Router();
const { getPublicSettings } = require('../controllers/adminController');

router.get('/public', getPublicSettings);

module.exports = router;