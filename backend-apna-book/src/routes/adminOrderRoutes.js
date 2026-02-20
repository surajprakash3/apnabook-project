const express = require('express');
const { listOrders, updateOrderStatus } = require('../controllers/ordersController');
const requireAuth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

router.get('/', requireAuth, requireRole('admin'), listOrders);
router.put('/:id/status', requireAuth, requireRole('admin'), updateOrderStatus);

module.exports = router;
