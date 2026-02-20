const express = require('express');
const requireAuth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const {
  getSummary,
  getMonthlySales,
  getMonthlyOrders
} = require('../controllers/adminAnalyticsController');

const router = express.Router();

router.get('/summary', requireAuth, requireRole('admin'), getSummary);
router.get('/monthly-sales', requireAuth, requireRole('admin'), getMonthlySales);
router.get('/monthly-orders', requireAuth, requireRole('admin'), getMonthlyOrders);

module.exports = router;
