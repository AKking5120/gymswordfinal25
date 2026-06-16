const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');
const { getReferrals, getAllReferrals } = require('../controllers/referralController');

router.use(protect);
router.get('/', getReferrals);
router.get('/admin/all', isAdmin, getAllReferrals);

module.exports = router;
