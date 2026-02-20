const express = require('express');
const {
	getSalesReport,
	listReports,
	generateReport,
	downloadReport
} = require('../controllers/adminReportsController');
const requireAuth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

router.get('/sales', requireAuth, requireRole('admin'), getSalesReport);
router.get('/', requireAuth, requireRole('admin'), listReports);
router.post('/generate', requireAuth, requireRole('admin'), generateReport);
router.get('/:id/download', requireAuth, requireRole('admin'), downloadReport);

module.exports = router;
