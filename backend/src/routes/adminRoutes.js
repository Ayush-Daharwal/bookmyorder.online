import express from 'express';
import {
  adminLogin,
  requestAdminPasswordOtp,
  resetAdminPassword,
  getAdminMetrics,
  getAdminRestaurants,
  togglePromoteRestaurant,
  updateRestaurantStatus,
  deleteRestaurant,
  getAdminReviews,
  deleteAdminReview,
  getAdminUsers,
  getPendingApplications,
  approveRestaurantApplication,
  rejectRestaurantApplication,
  getPlatformSettings,
  updatePlatformSettings,
  getPlatformExpenses,
  addPlatformExpense,
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public Admin Auth Routes
router.post('/login', adminLogin);
router.post('/request-password-otp', requestAdminPasswordOtp);
router.post('/reset-password', resetAdminPassword);

// Protected Admin Dashboard Routes
router.get('/metrics', protect, authorize('admin'), getAdminMetrics);
router.get('/restaurants', protect, authorize('admin'), getAdminRestaurants);
router.patch('/restaurants/:id/promote', protect, authorize('admin'), togglePromoteRestaurant);
router.patch('/restaurants/:id/status', protect, authorize('admin'), updateRestaurantStatus);
router.delete('/restaurants/:id', protect, authorize('admin'), deleteRestaurant);
router.get('/reviews', protect, authorize('admin'), getAdminReviews);
router.delete('/reviews/:id', protect, authorize('admin'), deleteAdminReview);
router.get('/users', protect, authorize('admin'), getAdminUsers);
router.get('/restaurant-applications', protect, authorize('admin'), getPendingApplications);
router.post('/approve-restaurant-application/:id', protect, authorize('admin'), approveRestaurantApplication);
router.post('/reject-restaurant-application/:id', protect, authorize('admin'), rejectRestaurantApplication);
router.get('/settings', protect, authorize('admin'), getPlatformSettings);
router.put('/settings', protect, authorize('admin'), updatePlatformSettings);
router.get('/expenses', protect, authorize('admin'), getPlatformExpenses);
router.post('/expenses', protect, authorize('admin'), addPlatformExpense);

export default router;
