import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      default: 'Main Course',
    },
    isVeg: {
      type: Boolean,
      default: true,
    },
    containsEgg: {
      type: Boolean,
      default: false,
    },
    halfPrice: {
      type: Number,
      default: 0,
    },
    fullPrice: {
      type: Number,
      default: 0,
    },
    pricing: {
      default: { type: Number, default: 0 },
      half: { type: Number, default: 0 },
      full: { type: Number, default: 0 },
    },
    tags: [{ type: String }],
    image: {
      type: String,
      default: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400',
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    customNotesAllowed: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const MenuItem = mongoose.model('MenuItem', menuItemSchema);
