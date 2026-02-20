const express = require('express');
const { getSalesReport } = require('../controllers/adminReportsController');
const requireAuth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

router.get('/sales', requireAuth, requireRole('admin'), getSalesReport);

module.exports = router;
