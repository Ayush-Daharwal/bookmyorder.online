import express from 'express';
import {
  getRestaurants,
  getRestaurantById,
  createBooking,
  getMyHistory,
  addReview,
} from '../controllers/customerController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/restaurants', getRestaurants);
router.get('/restaurants/:id', getRestaurantById);
router.post('/bookings', protect, createBooking);
router.get('/my-history', protect, getMyHistory);
router.post('/reviews', protect, addReview);

export default router;
