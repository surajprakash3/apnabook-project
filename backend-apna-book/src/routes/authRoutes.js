const express = require('express');
const {
	register,
	requestRegisterOtp,
	requestSignupOtp,
	verifySignupOtp,
	login,
	requestPasswordResetOtp,
	resetPasswordWithOtp,
	me,
	verifyEmailOtp,
	requestLoginOtp,
	verifyLoginOtp
} = require('../controllers/authController');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/register/otp', requestRegisterOtp);
router.post('/request-otp', requestSignupOtp);
router.post('/verify-otp', verifySignupOtp);
router.post('/login', login);
router.post('/forgot-password/request-otp', requestPasswordResetOtp);
router.post('/forgot-password/reset', resetPasswordWithOtp);
router.post('/login-otp', requestLoginOtp);
router.post('/login-otp/verify', verifyLoginOtp);
router.get('/me', requireAuth, me);

module.exports = router;
