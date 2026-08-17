import express from 'express';
import {
  getAdminMetrics,
  getAdminRestaurants,
  updateRestaurantStatus,
  getAdminReviews,
  deleteAdminReview,
  getAdminUsers,
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin Routes (Protected & Admin Authorized)
router.get('/metrics', protect, authorize('admin'), getAdminMetrics);
router.get('/restaurants', protect, authorize('admin'), getAdminRestaurants);
router.patch('/restaurants/:id/status', protect, authorize('admin'), updateRestaurantStatus);
router.get('/reviews', protect, authorize('admin'), getAdminReviews);
router.delete('/reviews/:id', protect, authorize('admin'), deleteAdminReview);
router.get('/users', protect, authorize('admin'), getAdminUsers);

export default router;
