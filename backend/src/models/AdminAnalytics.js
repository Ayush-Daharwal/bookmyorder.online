import mongoose from 'mongoose';

const adminAnalyticsSchema = new mongoose.Schema(
  {
    date: { type: String, required: true, unique: true }, // YYYY-MM-DD
    totalRevenue: { type: Number, default: 0 },
    totalCommission: { type: Number, default: 0 }, // 10% platform cut
    restaurantPayouts: { type: Number, default: 0 },
    totalOrdersCount: { type: Number, default: 0 },
    totalBookingsCount: { type: Number, default: 0 },
    activeUsersCount: { type: Number, default: 0 },
    weekendSpikeRatio: { type: Number, default: 1.45 },
    retentionRate: { type: Number, default: 88.5 },
  },
  { timestamps: true }
);

export const AdminAnalytics = mongoose.model('AdminAnalytics', adminAnalyticsSchema);
