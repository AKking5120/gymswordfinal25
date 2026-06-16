const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');
const {
  getProducts, getProduct, createProduct, updateProduct, deleteProduct,
  getCategories, createCategory, searchProducts,
  getProductReviews, getRelatedProducts, addReview, getWishlist, toggleWishlist,
} = require('../controllers/productController');

// Public routes
router.get('/', getProducts);
router.get('/search', searchProducts);
router.get('/categories', getCategories);
router.get('/user/wishlist', protect, getWishlist);
router.get('/:id/reviews', getProductReviews);
router.get('/:id/related', getRelatedProducts);
router.get('/:id', getProduct);

// Protected user routes
router.post('/:id/reviews', protect, addReview);
router.post('/:id/wishlist', protect, toggleWishlist);

// Admin routes
router.post('/', protect, isAdmin, createProduct);
router.put('/:id', protect, isAdmin, updateProduct);
router.delete('/:id', protect, isAdmin, deleteProduct);
router.post('/categories', protect, isAdmin, createCategory);

module.exports = router;
