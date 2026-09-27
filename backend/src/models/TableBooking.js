import mongoose from 'mongoose';

const tableBookingSchema = new mongoose.Schema(
  {
    bookingId: {
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
    mode: {
      type: String,
      enum: ['table_and_food', 'table_only', 'walk_in', 'canteen_preorder'],
      required: true,
    },
    bookingDate: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    timeSlot: {
      type: String, // e.g. "07:30 PM"
      required: true,
    },
    guestCount: {
      type: Number,
      default: 2,
    },
    tableNumber: {
      type: String,
      default: 'T-04',
    },
    durationMinutes: {
      type: Number,
      default: 60, // 15, 30, 45, 60, or custom minutes
    },
    tablePrice: {
      type: Number,
      default: 100, // Table booking charge in Rupees
    },
    specialRequests: {
      type: String,
      default: '',
    },
    foodOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoodOrder',
    },
    addonFoodOrders: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoodOrder',
    }],
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'seated', 'completed', 'cancelled'],
      default: 'confirmed',
    },
  },
  { timestamps: true }
);

export const TableBooking = mongoose.model('TableBooking', tableBookingSchema);
