const express = require('express');
const router = express.Router();
const {
    register, login, refreshToken, forgotPassword, resetPassword, getMe, logout,
    getPendingUsers, approveUser, rejectUser
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');

router.post('/register', register);
router.post('/login', loginLimiter, login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.get('/pending-users', protect, authorize(['admin']), getPendingUsers);
router.put('/approve/:id', protect, authorize(['admin']), approveUser);
router.put('/reject/:id', protect, authorize(['admin']), rejectUser);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;
