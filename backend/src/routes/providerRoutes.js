import express from 'express';
import {
  registerRestaurant,
  getMyRestaurant,
  saveMenuItem,
  getMenuByRestaurant,
  deleteMenuItem,
  getKdsOrders,
  updateOrderStatus,
  createWalkInBooking,
} from '../controllers/providerController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register-restaurant', protect, registerRestaurant);
router.get('/my-restaurant', protect, getMyRestaurant);
router.post('/menu-items', protect, requireRole(['provider', 'admin']), saveMenuItem);
router.get('/menu-items/:restaurantId', getMenuByRestaurant);
router.delete('/menu-items/:id', protect, requireRole(['provider', 'admin']), deleteMenuItem);
router.get('/kds/:restaurantId', protect, requireRole(['provider', 'admin']), getKdsOrders);
router.patch('/orders/:orderId/status', protect, requireRole(['provider', 'admin']), updateOrderStatus);
router.post('/walkin-booking', protect, requireRole(['provider', 'admin']), createWalkInBooking);

export default router;
