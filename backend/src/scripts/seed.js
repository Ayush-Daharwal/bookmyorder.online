import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import { Restaurant } from '../models/Restaurant.js';
import { MenuItem } from '../models/MenuItem.js';
import { TableBooking } from '../models/TableBooking.js';
import { FoodOrder } from '../models/FoodOrder.js';
import { Review } from '../models/Review.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://ayushdaharwal7_db_user:6e2Mq96kJ1sNTBdf@bookmyorder.1udcq53.mongodb.net/bookmyorder?retryWrites=true&w=majority';
    await mongoose.connect(mongoUri);
    console.log('🌱 Connected to MongoDB Atlas for Seeding...');

    // Clear existing data
    await User.deleteMany();
    await Restaurant.deleteMany();
    await MenuItem.deleteMany();
    await TableBooking.deleteMany();
    await FoodOrder.deleteMany();
    await Review.deleteMany();

    // 1. Seed Users (Super Admin, Provider, Customer)
    const adminUser = await User.create({
      phone: '9999999999',
      name: 'Super Admin',
      email: 'support.bookmyorder.online@gmail.com',
      city: 'Bhopal',
      role: 'admin',
      isVerified: true,
    });

    const providerUser = await User.create({
      phone: '9876543210',
      name: 'Vikram Sharma (Partner)',
      email: 'vikram.sky@gmail.com',
      city: 'Bhopal',
      role: 'provider',
      isVerified: true,
    });

    const customerUser = await User.create({
      phone: '9123456789',
      name: 'Ayush Daharwal',
      email: 'ayushdaharwal7@gmail.com',
      city: 'Bhopal',
      role: 'customer',
      isVerified: true,
    });

    console.log('✅ Users Seeded (Admin, Provider, Customer)');

    // 2. Seed Restaurants
    const restaurantsData = [
      {
        ownerId: providerUser._id,
        name: 'Sky Lounge Rooftop & Bistro',
        tier: 'premium',
        tagline: 'Scenic City View Dining & Fine Fusion Cuisine',
        description: 'Bhopal finest rooftop experience offering panoramic lake views, gourmet continental, and authentic North Indian dishes.',
        address: '10th Floor, DB City Mall Commercial Block, Maharana Pratap Nagar',
        city: 'Bhopal',
        modesSupported: ['mode1', 'mode2'],
        fssaiLicenseNumber: '11624001000845',
        gstin: '23AAACB1234C1Z5',
        aadharOtpVerified: true,
        isVerified: true,
        isActive: true,
        avgCostForTwo: 1400,
        discountPercent: 20,
        photos: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800'],
      },
      {
        ownerId: providerUser._id,
        name: 'The Spice House',
        tier: 'mid',
        tagline: 'Authentic Mughlai & Tandoori Specialties',
        description: 'Rich gravy curries, charcoal tandoori platters, and soft garlic naan baked in traditional clay oven.',
        address: 'Plot 42, Arera Colony, Near Bittan Market',
        city: 'Bhopal',
        modesSupported: ['mode1', 'mode2'],
        fssaiLicenseNumber: '11624001000912',
        gstin: '23BCCCD5678D1Z9',
        aadharOtpVerified: true,
        isVerified: true,
        isActive: true,
        avgCostForTwo: 750,
        discountPercent: 15,
        photos: ['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800'],
      },
      {
        ownerId: providerUser._id,
        name: 'Café Aroma Italian & Coffee Bar',
        tier: 'mid',
        tagline: 'Woodfired Pizza, Creamy Pastas & Artisan Brews',
        description: 'Cozy European style bistro serving handcrafted espresso drinks, woodfired sourdough pizza, and tiramisu.',
        address: 'Shop 12, Gulmohar Colony, E-8 Arera',
        city: 'Bhopal',
        modesSupported: ['mode1', 'mode2'],
        fssaiLicenseNumber: '11624001000334',
        gstin: '23CCCEE9012E1Z2',
        aadharOtpVerified: true,
        isVerified: true,
        isActive: true,
        avgCostForTwo: 600,
        discountPercent: 10,
        photos: ['https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&q=80&w=800'],
      },
      {
        ownerId: providerUser._id,
        name: 'MANIT Central College Canteen',
        tier: 'canteen',
        tagline: 'Skip Student Queue - Pre-Order & Batch Pickup',
        description: 'Official student canteen for MANIT Bhopal. Pre-order roll, samosa, cold coffee, and thali with exact batch target pickup time.',
        address: 'MANIT Campus Complex, Link Road 3',
        city: 'Bhopal',
        modesSupported: ['mode3'],
        fssaiLicenseNumber: '11624001000101',
        gstin: '23DDDEFF3456F1Z4',
        aadharOtpVerified: true,
        isVerified: true,
        isActive: true,
        avgCostForTwo: 220,
        discountPercent: 25,
        photos: ['https://images.unsplash.com/photo-1567521464027-f127ff144326?auto=format&fit=crop&q=80&w=800'],
      },
    ];

    const seededRestaurants = await Restaurant.insertMany(restaurantsData);
    console.log(`✅ ${seededRestaurants.length} Restaurants Seeded`);

    // 3. Seed Menu Items
    const skyLounge = seededRestaurants[0];
    const spiceHouse = seededRestaurants[1];
    const cafeAroma = seededRestaurants[2];
    const manitCanteen = seededRestaurants[3];

    const menuData = [
      // Sky Lounge Menu
      { restaurantId: skyLounge._id, name: 'Paneer Tikka Angara', category: 'Starters', isVeg: true, halfPrice: 190, fullPrice: 340, pricing: { default: 340, half: 190, full: 340 }, description: 'Charcoal grilled cottage cheese marinated in spiced yogurt and mustard oil.', tags: ['Bestseller', 'Chef Special'] },
      { restaurantId: skyLounge._id, name: 'Dal Makhani Shahi', category: 'Main Course', isVeg: true, halfPrice: 180, fullPrice: 320, pricing: { default: 320, half: 180, full: 320 }, description: 'Slow cooked black lentils simmered overnight with white butter and cream.', tags: ['Signature'] },
      { restaurantId: skyLounge._id, name: 'Exotic Farmhouse Pizza', category: 'Main Course', isVeg: true, halfPrice: 260, fullPrice: 450, pricing: { default: 450, half: 260, full: 450 }, description: 'Fresh mozzarella, bell peppers, jalapenos, olives, and sundried tomatoes.', tags: ['Woodfired'] },
      { restaurantId: skyLounge._id, name: 'Garlic Butter Naan', category: 'Main Course', isVeg: true, halfPrice: 40, fullPrice: 70, pricing: { default: 70, half: 40, full: 70 }, description: 'Freshly baked tandoori bread coated with melted butter and roasted garlic.', tags: ['Tandoori'] },

      // Spice House Menu
      { restaurantId: spiceHouse._id, name: 'Kadai Paneer Khas', category: 'Main Course', isVeg: true, halfPrice: 160, fullPrice: 290, pricing: { default: 290, half: 160, full: 290 }, description: 'Cottage cheese tossed with wok-roasted coriander seeds and capsicum.', tags: ['Spicy'] },
      { restaurantId: spiceHouse._id, name: 'Butter Tandoori Roti', category: 'Breads', isVeg: true, halfPrice: 20, fullPrice: 35, pricing: { default: 35, half: 20, full: 35 }, description: 'Whole wheat bread baked crisp in tandoor with ghee glaze.', tags: ['Essential'] },

      // Café Aroma Menu
      { restaurantId: cafeAroma._id, name: 'Creamy Alfredo Penne', category: 'Main Course', isVeg: true, halfPrice: 170, fullPrice: 280, pricing: { default: 280, half: 170, full: 280 }, description: 'Italian penne tossed in rich parmesan garlic cream sauce with broccoli.', tags: ['Italian'] },
      { restaurantId: cafeAroma._id, name: 'Hazelnut Cold Brew', category: 'Beverages', isVeg: true, halfPrice: 110, fullPrice: 180, pricing: { default: 180, half: 110, full: 180 }, description: 'Steeped 18-hour cold brew coffee infused with roasted hazelnut syrup.', tags: ['Refreshing'] },

      // MANIT Canteen Menu
      { restaurantId: manitCanteen._id, name: 'Special Cheese Paneer Roll', category: 'Snacks', isVeg: true, halfPrice: 70, fullPrice: 120, pricing: { default: 120, half: 70, full: 120 }, description: 'Flaky paratha stuffed with spiced paneer cubes, grated cheese, and tangy mint chutney.', tags: ['Student Fav'] },
      { restaurantId: manitCanteen._id, name: 'Thick Chocolate Thickshake', category: 'Beverages', isVeg: true, halfPrice: 50, fullPrice: 90, pricing: { default: 90, half: 50, full: 90 }, description: 'Rich cocoa blended with thick vanilla ice cream.', tags: ['Cold'] },
    ];

    await MenuItem.insertMany(menuData);
    console.log('✅ 10+ Digital Menu Items Seeded with Half/Full portion prices');

    // 4. Seed Booking & Order History for Diner
    const sampleBooking = await TableBooking.create({
      bookingId: 'BMO-8841',
      userId: customerUser._id,
      restaurantId: skyLounge._id,
      mode: 'table_and_food',
      bookingDate: '2026-08-18',
      timeSlot: '07:30 PM',
      guestCount: 2,
      tableNumber: 'Table 04',
      preOrderedFood: true,
      status: 'confirmed',
    });

    const sampleFoodOrder = await FoodOrder.create({
      orderId: 'BMO-ORD-9012',
      userId: customerUser._id,
      restaurantId: skyLounge._id,
      bookingId: sampleBooking._id,
      items: [
        { menuItemId: menuData[0]._id, name: 'Paneer Tikka Angara', portion: 'full', price: 340, quantity: 1 },
        { menuItemId: menuData[1]._id, name: 'Dal Makhani Shahi', portion: 'half', price: 180, quantity: 1 },
      ],
      subtotal: 520,
      tax: 26, // 5% GST
      platformFee: 15,
      totalAmount: 561,
      paymentStatus: 'paid',
      cashfreeOrderId: 'CF-ORD-TEST-9012',
      status: 'preparing',
    });

    sampleBooking.foodOrderId = sampleFoodOrder._id;
    await sampleBooking.save();

    // 5. Seed Review
    await Review.create({
      userId: customerUser._id,
      restaurantId: skyLounge._id,
      rating: 5,
      comment: 'Exceptional rooftop dining experience! Table 04 had stunning views, and pre-ordering the Paneer Tikka saved us 30 minutes. Highly recommended!',
    });

    console.log('✅ Past Bookings, Food Orders & Customer Reviews Seeded');
    console.log('🚀 MongoDB Atlas Production Seeding Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Error:', error);
    process.exit(1);
  }
};

seedDatabase();
