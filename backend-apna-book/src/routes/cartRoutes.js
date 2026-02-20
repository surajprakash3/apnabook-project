const express = require('express');
const { getCart, addToCart, updateCartItem, removeFromCart } = require('../controllers/cartController');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, getCart);
router.post('/add', requireAuth, addToCart);
router.put('/update', requireAuth, updateCartItem);
router.delete('/remove', requireAuth, removeFromCart);

module.exports = router;
