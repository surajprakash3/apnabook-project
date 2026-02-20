const express = require('express');
const {
  createProduct,
  listProducts,
  getProduct,
  updateProduct,
  updateApproval,
  deleteProduct,
  myUploads
} = require('../controllers/productsController');
const requireAuth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

router.get('/', listProducts);
router.get('/mine', requireAuth, myUploads);
router.get('/:id', getProduct);
router.post('/', requireAuth, createProduct);
router.patch('/:id', requireAuth, updateProduct);
router.patch('/:id/approval', requireAuth, requireRole('admin'), updateApproval);
router.delete('/:id', requireAuth, deleteProduct);

module.exports = router;
