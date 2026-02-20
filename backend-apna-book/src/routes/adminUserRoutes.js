const express = require('express');
const requireAuth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const {
  listAdminUsers,
  updateUserRole,
  blockUser,
  unblockUser,
  deleteAdminUser
} = require('../controllers/adminUsersController');

const router = express.Router();

router.get('/', requireAuth, requireRole('admin'), listAdminUsers);
router.patch('/:id/role', requireAuth, requireRole('admin'), updateUserRole);
router.patch('/:id/block', requireAuth, requireRole('admin'), blockUser);
router.patch('/:id/unblock', requireAuth, requireRole('admin'), unblockUser);
router.delete('/:id', requireAuth, requireRole('admin'), deleteAdminUser);

module.exports = router;
