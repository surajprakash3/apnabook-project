const express = require('express');
const requireAuth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const {
  listAdminUploads,
  approveUpload,
  rejectUpload,
  deleteUpload
} = require('../controllers/adminUploadsController');

const router = express.Router();

router.get('/', requireAuth, requireRole('admin'), listAdminUploads);
router.patch('/:id/approve', requireAuth, requireRole('admin'), approveUpload);
router.patch('/:id/reject', requireAuth, requireRole('admin'), rejectUpload);
router.delete('/:id', requireAuth, requireRole('admin'), deleteUpload);

module.exports = router;
