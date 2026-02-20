const express = require('express');
const {
  createOrder,
  listOrders,
  listMyOrders,
  updateOrderStatus
} = require('../controllers/ordersController');
const requireAuth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

router.post('/', requireAuth, createOrder);
router.get('/', requireAuth, listMyOrders);
router.put('/:id/status', requireAuth, requireRole('admin'), updateOrderStatus);

module.exports = router;
