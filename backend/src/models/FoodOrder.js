import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  menuItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
  },
  name: { type: String, required: true },
  portion: { type: String, enum: ['default', 'half', 'full'], default: 'default' },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 1 },
  customNote: { type: String, default: '' },
});

const foodOrderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    tax: { type: Number, required: true }, // GST 5%
    platformFee: { type: Number, default: 15 },
    totalAmount: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    cashfreeOrderId: { type: String },
    cashfreePaymentId: { type: String },
    paymentMethod: { type: String, default: 'Cashfree Sandbox (UPI/Card)' },
    status: {
      type: String,
      enum: ['received', 'preparing', 'ready', 'served', 'completed', 'cancelled'],
      default: 'received',
    },
    prepTargetTime: {
      type: String, // e.g. "20 mins" or target time "08:15 PM"
      default: '20 mins',
    },
  },
  { timestamps: true }
);

export const FoodOrder = mongoose.model('FoodOrder', foodOrderSchema);
