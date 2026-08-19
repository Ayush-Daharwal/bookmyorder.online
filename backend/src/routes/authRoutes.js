import express from 'express';
import {
  requestOtp,
  verifyOtp,
  adminLogin,
  getMe,
  updateProfile,
  requestEmailOtp,
  verifyEmailOtp,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);
router.post('/admin-login', adminLogin);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/request-email-otp', protect, requestEmailOtp);
router.post('/verify-email-otp', protect, verifyEmailOtp);

export default router;
