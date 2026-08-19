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
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ Error: MONGODB_URI environment variable is missing in .env file.');
      process.exit(1);
    }
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
      // Sky Lounge Menu (Fine Dining Fusion & Multi-Cuisine)
      { restaurantId: skyLounge._id, name: 'Paneer Tikka Angara', category: 'Starters', isVeg: true, halfPrice: 190, fullPrice: 340, pricing: { default: 340, half: 190, full: 340 }, description: 'Charcoal grilled cottage cheese marinated in spiced yogurt and mustard oil.', tags: ['Bestseller', 'Chef Special'], image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&q=80&w=400' },
      { restaurantId: skyLounge._id, name: 'Crispy Veg Chilli Corn Basket', category: 'Starters', isVeg: true, halfPrice: 160, fullPrice: 280, pricing: { default: 280, half: 160, full: 280 }, description: 'Golden fried sweetcorn kernels tossed with scallions and Schezwan garlic spice.', tags: ['Crispy'], image: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&q=80&w=400' },
      { restaurantId: skyLounge._id, name: 'Dal Makhani Shahi', category: 'Main Course', isVeg: true, halfPrice: 180, fullPrice: 320, pricing: { default: 320, half: 180, full: 320 }, description: 'Slow cooked black lentils simmered overnight with white butter and cream.', tags: ['Signature'], image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=400' },
      { restaurantId: skyLounge._id, name: 'Paneer Butter Masala', category: 'Main Course', isVeg: true, halfPrice: 190, fullPrice: 350, pricing: { default: 350, half: 190, full: 350 }, description: 'Tender cottage cheese cubes simmered in velvety tomato cashew gravy.', tags: ['Popular'], image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=400' },
      { restaurantId: skyLounge._id, name: 'Exotic Farmhouse Woodfired Pizza', category: 'Italian', isVeg: true, halfPrice: 260, fullPrice: 450, pricing: { default: 450, half: 260, full: 450 }, description: 'Fresh mozzarella, bell peppers, jalapenos, olives, and sundried tomatoes on artisanal dough.', tags: ['Woodfired'], image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=400' },
      { restaurantId: skyLounge._id, name: 'Veg Hakka Noodles', category: 'Chinese', isVeg: true, halfPrice: 140, fullPrice: 240, pricing: { default: 240, half: 140, full: 240 }, description: 'Wok tossed noodles with shredded capsicum, cabbage, and light soya sauce.', tags: ['Wok Fresh'], image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&q=80&w=400' },
      { restaurantId: skyLounge._id, name: 'Garlic Butter Naan', category: 'Breads', isVeg: true, halfPrice: 40, fullPrice: 70, pricing: { default: 70, half: 40, full: 70 }, description: 'Freshly baked tandoori bread coated with melted butter and roasted garlic.', tags: ['Tandoori'], image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=400' },
      { restaurantId: skyLounge._id, name: 'Sizzling Chocolate Brownie', category: 'Desserts', isVeg: true, halfPrice: 120, fullPrice: 210, pricing: { default: 210, half: 120, full: 210 }, description: 'Warm fudgy brownie served on a sizzler plate with vanilla ice cream and hot fudge.', tags: ['Sweet'], image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=400' },

      // Spice House Menu (North Indian, Mughlai & South Indian)
      { restaurantId: spiceHouse._id, name: 'Kadai Paneer Khas', category: 'Main Course', isVeg: true, halfPrice: 160, fullPrice: 290, pricing: { default: 290, half: 160, full: 290 }, description: 'Cottage cheese tossed with wok-roasted coriander seeds and capsicum.', tags: ['Spicy'], image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=400' },
      { restaurantId: spiceHouse._id, name: 'Crispy Veg Manchurian Gravy', category: 'Chinese', isVeg: true, halfPrice: 150, fullPrice: 260, pricing: { default: 260, half: 150, full: 260 }, description: 'Vegetable dumplings simmered in dark garlic ginger soya glaze.', tags: ['Indo-Chinese'], image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&q=80&w=400' },
      { restaurantId: spiceHouse._id, name: 'Special Masala Dosa', category: 'South Indian', isVeg: true, halfPrice: 90, fullPrice: 160, pricing: { default: 160, half: 90, full: 160 }, description: 'Crispy rice crepe filled with tempered spiced potato masala, served with coconut chutney and hot sambhar.', tags: ['South Special'], image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&q=80&w=400' },
      { restaurantId: spiceHouse._id, name: 'Steamed Button Idli (4 Pcs)', category: 'South Indian', isVeg: true, halfPrice: 60, fullPrice: 110, pricing: { default: 110, half: 60, full: 110 }, description: 'Soft fluffy steamed rice cakes served with tomato red chutney and gun powder ghee.', tags: ['Healthy'], image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=400' },
      { restaurantId: spiceHouse._id, name: 'Butter Tandoori Roti', category: 'Breads', isVeg: true, halfPrice: 20, fullPrice: 35, pricing: { default: 35, half: 20, full: 35 }, description: 'Whole wheat bread baked crisp in tandoor with ghee glaze.', tags: ['Essential'], image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&q=80&w=400' },
      { restaurantId: spiceHouse._id, name: 'Gulab Jamun with Rabri (2 Pcs)', category: 'Desserts', isVeg: true, halfPrice: 70, fullPrice: 130, pricing: { default: 130, half: 70, full: 130 }, description: 'Warm khoya dumplings soaked in saffron cardamom syrup topped with thickened rabri.', tags: ['Traditional'], image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&q=80&w=400' },

      // Café Aroma Menu (Italian, Espresso & Continental)
      { restaurantId: cafeAroma._id, name: 'Creamy Alfredo Penne Pasta', category: 'Main Course', isVeg: true, halfPrice: 170, fullPrice: 280, pricing: { default: 280, half: 170, full: 280 }, description: 'Italian penne tossed in rich parmesan garlic cream sauce with sauteed broccoli.', tags: ['Italian'], image: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281270?auto=format&fit=crop&q=80&w=400' },
      { restaurantId: cafeAroma._id, name: 'Arrabbiata Spicy Tomato Pasta', category: 'Main Course', isVeg: true, halfPrice: 160, fullPrice: 270, pricing: { default: 270, half: 160, full: 270 }, description: 'Penne tossed in fiery San Marzano tomato sauce, fresh basil, and crushed chilli flakes.', tags: ['Spicy'], image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&q=80&w=400' },
      { restaurantId: cafeAroma._id, name: 'Hazelnut Cold Brew Coffee', category: 'Beverages', isVeg: true, halfPrice: 110, fullPrice: 180, pricing: { default: 180, half: 110, full: 180 }, description: 'Steeped 18-hour cold brew coffee infused with roasted hazelnut syrup and cold foam.', tags: ['Refreshing'], image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&q=80&w=400' },
      { restaurantId: cafeAroma._id, name: 'Classic Iced Cappuccino', category: 'Beverages', isVeg: true, halfPrice: 90, fullPrice: 150, pricing: { default: 150, half: 90, full: 150 }, description: 'Double shot dark espresso shaken with ice and cold milk foam.', tags: ['Cold Coffee'], image: 'https://images.unsplash.com/photo-1572442388796-11668ba67e53?auto=format&fit=crop&q=80&w=400' },

      // MANIT Canteen Menu (Campus Quick Eats & Snacks)
      { restaurantId: manitCanteen._id, name: 'Special Cheese Paneer Roll', category: 'Snacks', isVeg: true, halfPrice: 70, fullPrice: 120, pricing: { default: 120, half: 70, full: 120 }, description: 'Flaky paratha stuffed with spiced paneer cubes, grated cheese, and tangy mint chutney.', tags: ['Student Fav'], image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&q=80&w=400' },
      { restaurantId: manitCanteen._id, name: 'Crispy Samosa Chaat (2 Pcs)', category: 'Snacks', isVeg: true, halfPrice: 40, fullPrice: 70, pricing: { default: 70, half: 40, full: 70 }, description: 'Crushed potato samosas topped with spicy chole, sweet tamarind chutney, and nylon sev.', tags: ['Street Style'], image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=400' },
      { restaurantId: manitCanteen._id, name: 'Veg Fried Rice with Manchurian', category: 'Chinese', isVeg: true, halfPrice: 80, fullPrice: 140, pricing: { default: 140, half: 80, full: 140 }, description: 'Aromatic wok fried rice paired with 3 pcs hot gravy Manchurian.', tags: ['Combo Meal'], image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&q=80&w=400' },
      { restaurantId: manitCanteen._id, name: 'Thick Chocolate Fudge Shake', category: 'Beverages', isVeg: true, halfPrice: 50, fullPrice: 90, pricing: { default: 90, half: 50, full: 90 }, description: 'Rich cocoa blended with thick vanilla ice cream.', tags: ['Cold'], image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80&w=400' },
    ];

    await MenuItem.insertMany(menuData);
    console.log('✅ 20+ Digital Menu Items Seeded across Starters, Main Course, South Indian, Chinese, Breads, Beverages, Desserts');

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
