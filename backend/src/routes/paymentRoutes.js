import express from 'express';
import { createCashfreeOrder, verifyCashfreePayment, cashfreeWebhook } from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/create-order', protect, createCashfreeOrder);
router.get('/verify/:orderId', protect, verifyCashfreePayment);
router.post('/webhook', cashfreeWebhook);

export default router;
