import mongoose from 'mongoose';

const platformExpenseSchema = new mongoose.Schema(
  {
    monthYear: {
      type: String, // e.g. "2026-09"
      required: true,
    },
    serverCost: {
      type: Number,
      default: 12000, // Cloud Server / Hosting Cost (₹)
    },
    databaseCost: {
      type: Number,
      default: 4500, // MongoDB Atlas / DB Cluster Cost (₹)
    },
    gatewayCost: {
      type: Number,
      default: 3200, // Payment Gateway Sandbox/Prod Processing Charges (₹)
    },
    marketingCost: {
      type: Number,
      default: 8500, // Marketing & Promotions (₹)
    },
    otherExpenses: {
      type: Number,
      default: 2000,
    },
    notes: {
      type: String,
      default: 'Monthly infrastructure and platform operating costs',
    },
  },
  { timestamps: true }
);

export const PlatformExpense = mongoose.model('PlatformExpense', platformExpenseSchema);
