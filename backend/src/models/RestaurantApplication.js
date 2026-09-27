import mongoose from 'mongoose';

const restaurantApplicationSchema = new mongoose.Schema(
  {
    restaurantName: {
      type: String,
      required: true,
      trim: true,
    },
    managerName: {
      type: String,
      required: true,
      trim: true,
    },
    managerPhone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      default: 'Bhopal',
    },
    address: {
      type: String,
      required: true,
    },
    exactLocation: {
      address: String,
      lat: Number,
      lng: Number,
    },
    foodType: {
      type: String,
      enum: ['Pure Veg', 'Pure Non-Veg', 'Veg & Non-Veg'],
      required: true,
    },
    category: {
      type: String,
      enum: ['luxury', 'casual_premium', 'canteen'],
      required: true,
    },
    gstin: {
      type: String,
      default: '',
    },
    fssaiNumber: {
      type: String,
      default: '',
    },
    fssaiImage: {
      type: String,
      default: '',
    },
    fdaNumber: {
      type: String,
      default: '',
    },
    ownerAadhaar: {
      type: String,
      required: true,
    },
    photos: {
      cardBanner: { type: String, required: true },
      front: { type: String, required: true },
      tableSeating: { type: String, required: true },
      kitchen: { type: String, required: true },
      servedFood: { type: String, required: true },
      menu: { type: String, required: true },
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    termsAccepted: {
      type: Boolean,
      default: true,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    notificationsSent: [
      {
        channel: { type: String }, // 'EMAIL' or 'SMS'
        to: { type: String },
        message: { type: String },
        sentAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export const RestaurantApplication = mongoose.model(
  'RestaurantApplication',
  restaurantApplicationSchema
);
