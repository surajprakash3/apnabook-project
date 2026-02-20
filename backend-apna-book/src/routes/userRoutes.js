const express = require('express');
const {
  getUsers,
  getUser,
  updateUserStatus,
  deleteUser
} = require('../controllers/usersController');
const requireAuth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

router.get('/', requireAuth, requireRole('admin'), getUsers);
router.get('/:id', requireAuth, requireRole('admin'), getUser);
router.patch('/:id/status', requireAuth, requireRole('admin'), updateUserStatus);
router.delete('/:id', requireAuth, requireRole('admin'), deleteUser);

module.exports = router;
