import crypto from 'crypto';
import { FoodOrder } from '../models/FoodOrder.js';
import { TableBooking } from '../models/TableBooking.js';

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID || 'TEST430329ae80e0f32e41a393d78b923034';
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY || 'TESTaf195616268bd6202eeb3bf8dc458956e7192a85';
const CASHFREE_API_URL = process.env.CASHFREE_API_URL || 'https://sandbox.cashfree.com/pg';

// @desc    Create Cashfree Order Session
// @route   POST /api/payments/create-order
export const createCashfreeOrder = async (req, res) => {
  try {
    const { foodOrderId, bookingId } = req.body;
    let order = null;
    let amount = 0;

    if (foodOrderId) {
      order = await FoodOrder.findById(foodOrderId);
      if (!order) return res.status(404).json({ message: 'Order not found' });
      amount = order.totalAmount;
    } else if (bookingId) {
      const booking = await TableBooking.findById(bookingId);
      if (!booking) return res.status(404).json({ message: 'Booking not found' });
      amount = 100; // Nominal seat reservation deposit if table-only
    } else {
      return res.status(400).json({ message: 'Order ID or Booking ID is required' });
    }

    const cfOrderId = `CF_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const payload = {
      order_id: cfOrderId,
      order_amount: amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: req.user._id.toString(),
        customer_name: req.user.name || 'Diner',
        customer_email: req.user.email || 'customer@bookmyorder.online',
        customer_phone: req.user.phone.length === 10 ? req.user.phone : '9876543210',
      },
      order_meta: {
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}?cf_order_id={order_id}`,
        notify_url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payments/webhook`,
      },
    };

    const response = await fetch(`${CASHFREE_API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': CASHFREE_APP_ID,
        'x-client-secret': CASHFREE_SECRET_KEY,
        'x-api-version': '2023-08-01',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Cashfree API Error]:', data);
      return res.status(400).json({ message: data.message || 'Cashfree Order creation failed' });
    }

    // Save Cashfree Order ID to database order
    if (order) {
      order.cashfreeOrderId = cfOrderId;
      await order.save();
    }

    res.json({
      success: true,
      cfOrderId,
      paymentSessionId: data.payment_session_id,
      order,
    });
  } catch (error) {
    console.error('[Cashfree Controller Exception]:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify Cashfree Payment Status (Backend API Check)
// @route   GET /api/payments/verify/:orderId
export const verifyCashfreePayment = async (req, res) => {
  try {
    const { orderId } = req.params;

    const response = await fetch(`${CASHFREE_API_URL}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'x-client-id': CASHFREE_APP_ID,
        'x-client-secret': CASHFREE_SECRET_KEY,
        'x-api-version': '2023-08-01',
      },
    });

    const data = await response.json();

    if (data.order_status === 'PAID') {
      const order = await FoodOrder.findOne({ cashfreeOrderId: orderId });
      if (order) {
        order.paymentStatus = 'paid';
        order.cashfreePaymentId = data.order_payment_id || `PAY_${Date.now()}`;
        order.status = 'preparing';
        await order.save();

        await TableBooking.updateOne({ foodOrderId: order._id }, { status: 'confirmed' });
      }

      return res.json({
        success: true,
        isPaid: true,
        orderStatus: data.order_status,
        order,
      });
    }

    res.json({ success: true, isPaid: false, orderStatus: data.order_status });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cashfree Webhook Handler with Signature Verification
// @route   POST /api/payments/webhook
export const cashfreeWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-webhook-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];
    const rawBody = JSON.stringify(req.body);

    // Verify HMAC SHA256 Signature
    if (signature && timestamp) {
      const dataToSign = timestamp + rawBody;
      const expectedSignature = crypto
        .createHmac('sha256', CASHFREE_SECRET_KEY)
        .update(dataToSign)
        .digest('base64');

      if (signature !== expectedSignature) {
        console.warn('[Cashfree Webhook] Invalid Webhook Signature Rejected!');
        return res.status(400).send('Invalid signature');
      }
    }

    const { data, type } = req.body;
    if (type === 'PAYMENT_SUCCESS_WEBHOOK' || data?.order?.order_status === 'PAID') {
      const cfOrderId = data.order.order_id;
      const paymentId = data.payment?.cf_payment_id;

      const order = await FoodOrder.findOne({ cashfreeOrderId: cfOrderId });
      if (order) {
        order.paymentStatus = 'paid';
        order.cashfreePaymentId = paymentId?.toString() || `CF_PAY_${Date.now()}`;
        order.status = 'preparing';
        await order.save();

        await TableBooking.updateOne({ foodOrderId: order._id }, { status: 'confirmed' });
        console.log(`[Cashfree Webhook Verified] Order ${cfOrderId} marked PAID successfully!`);
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('[Cashfree Webhook Error]:', error);
    res.status(500).send('Webhook Error');
  }
};
