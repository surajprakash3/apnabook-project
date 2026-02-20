const express = require('express');
const requireAuth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const {
  listAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory
} = require('../controllers/adminCategoriesController');

const router = express.Router();

router.get('/', requireAuth, requireRole('admin'), listAdminCategories);
router.post('/', requireAuth, requireRole('admin'), createAdminCategory);
router.patch('/:id', requireAuth, requireRole('admin'), updateAdminCategory);
router.delete('/:id', requireAuth, requireRole('admin'), deleteAdminCategory);

module.exports = router;
