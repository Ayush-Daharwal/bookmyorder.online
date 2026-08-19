import mongoose from 'mongoose';

const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    tagline: {
      type: String,
      default: 'Skip The Queue & Dine Fine',
    },
    description: {
      type: String,
      default: 'Authentic cuisine prepared fresh for your dining and pickup convenience.',
    },
    tier: {
      type: String,
      enum: ['premium', 'mid', 'canteen'],
      required: true,
      default: 'premium',
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    city: {
      type: String,
      required: true,
      default: 'Bhopal',
    },
    address: {
      type: String,
      required: true,
    },
    cuisine: {
      type: [String],
      default: ['North Indian', 'Continental'],
    },
    photos: {
      type: [String],
      default: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800'],
    },
    logo: {
      type: String,
      default: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=300',
    },
    seatingCapacity: {
      totalTables: { type: Number, default: 15 },
      totalSeats: { type: Number, default: 60 },
    },
    avgCostForTwo: {
      type: Number,
      default: 800,
    },
    rating: {
      type: Number,
      default: 4.5,
    },
    ratingCount: {
      type: Number,
      default: 128,
    },
    discountPercent: {
      type: Number,
      default: 15,
    },
    managerDetails: {
      name: String,
      phone: String,
      aadharNumber: String,
    },
    licenses: {
      fssaiNumber: String,
      gstin: String,
      fdaNumber: String,
      tradeLicense: String,
      isVerified: { type: Boolean, default: true },
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPureVeg: {
      type: Boolean,
      default: false,
    },
    modesSupported: {
      mode1TableAndFood: { type: Boolean, default: true },
      mode2TableOnly: { type: Boolean, default: true },
      mode3WalkInOrPickup: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export const Restaurant = mongoose.model('Restaurant', restaurantSchema);
