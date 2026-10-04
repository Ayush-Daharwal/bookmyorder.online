import mongoose from 'mongoose';

const platformSettingsSchema = new mongoose.Schema(
  {
    gstPercent: {
      type: Number,
      default: 5,
    },
    platformFeeDefault: {
      type: Number,
      default: 15, // default fee per transaction (₹)
    },
    platformFeePremium: {
      type: Number,
      default: 25, // premium tier fee per transaction (₹)
    },
    platformFeeCanteen: {
      type: Number,
      default: 10, // canteen tier fee per transaction (₹)
    },
    lastFeeUpdateDate: {
      type: Date,
      default: Date.now,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

export const PlatformSettings = mongoose.model('PlatformSettings', platformSettingsSchema);
