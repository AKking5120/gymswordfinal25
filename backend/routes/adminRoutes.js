const express = require('express');
const router = express.Router();
const {
  getStats,
  getAdminSettings,
  updateAdminSettings,
  getAdminProducts,
  getCustomers,
  getAdminUsers,
  adminResendVerification,
  adminToggleDisableUser,
  adminGetLoginHistory,
  adminGetEmailLogs,
} = require('../controllers/adminController');
const { getAllOrders, updateOrderStatus } = require('../controllers/orderController');
const {
  getContactMessages,
  updateContactMessage,
  deleteContactMessage,
} = require('../controllers/contactController');
const {
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} = require('../controllers/couponController');
const {
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { getAllReferrals } = require('../controllers/referralController');
const { uploadImage } = require('../controllers/uploadController');
const { getLeads, deleteLead } = require('../controllers/leadController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

router.use(protect, adminOnly);

router.get('/stats', getStats);
router.get('/settings', getAdminSettings);
router.patch('/settings', updateAdminSettings);
router.get('/orders', getAllOrders);
router.patch('/orders/:id/status', updateOrderStatus);
router.get('/referrals', getAllReferrals);
router.get('/contact-messages', getContactMessages);
router.patch('/contact-messages/:id', updateContactMessage);
router.delete('/contact-messages/:id', deleteContactMessage);

router.get('/products', getAdminProducts);
router.post('/products', createProduct);
router.patch('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

router.get('/coupons', getAllCoupons);
router.post('/coupons', createCoupon);
router.put('/coupons/:id', updateCoupon);
router.delete('/coupons/:id', deleteCoupon);

router.get('/customers', getCustomers);
router.get('/users', getAdminUsers);
router.post('/users/:id/resend-verification', adminResendVerification);
router.patch('/users/:id/disable', adminToggleDisableUser);
router.get('/users/:id/login-history', adminGetLoginHistory);
router.get('/email-logs', adminGetEmailLogs);

router.post('/uploads', uploadImage);

router.get('/leads', getLeads);
router.delete('/leads/:id', deleteLead);

module.exports = router;
