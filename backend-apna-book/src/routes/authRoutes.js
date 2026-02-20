const express = require('express');
const {
	register,
	login,
	me,
	verifyEmailOtp,
	requestLoginOtp,
	verifyLoginOtp
} = require('../controllers/authController');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyEmailOtp);
router.post('/login-otp', requestLoginOtp);
router.post('/login-otp/verify', verifyLoginOtp);
router.get('/me', requireAuth, me);

module.exports = router;
