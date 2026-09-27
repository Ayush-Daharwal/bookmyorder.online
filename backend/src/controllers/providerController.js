import { Restaurant } from '../models/Restaurant.js';
import { MenuItem } from '../models/MenuItem.js';
import { FoodOrder } from '../models/FoodOrder.js';
import { TableBooking } from '../models/TableBooking.js';
import { RestaurantApplication } from '../models/RestaurantApplication.js';
import { User } from '../models/User.js';
import jwt from 'jsonwebtoken';

// @desc    Submit Restaurant Registration Application (Public/Partner)
// @route   POST /api/provider/register-application
export const submitRestaurantApplication = async (req, res) => {
  try {
    const {
      restaurantName,
      managerName,
      managerPhone,
      email,
      password,
      city,
      address,
      exactLocation,
      foodType,
      category,
      gstin,
      fssaiNumber,
      fssaiImage,
      fdaNumber,
      ownerAadhaar,
      photos,
    } = req.body;

    // Enforce City Restriction: Only Bhopal allowed
    if (!city || city.trim().toLowerCase() !== 'bhopal') {
      return res.status(400).json({
        message: 'Registration outside Bhopal is not allowed as services are currently available only in Bhopal.',
      });
    }

    if (!restaurantName || !managerName || !managerPhone || !email || !password || !address || !ownerAadhaar || !photos) {
      return res.status(400).json({ message: 'All required fields and 6 photos must be provided.' });
    }

    // Check if pending application already exists for this email
    let existingApp = await RestaurantApplication.findOne({ email: email.toLowerCase() });
    if (existingApp && existingApp.status === 'pending') {
      return res.status(400).json({
        message: 'An application with this email address is already pending admin approval.',
      });
    }

    const application = await RestaurantApplication.create({
      restaurantName,
      managerName,
      managerPhone,
      email: email.toLowerCase(),
      password,
      city: 'Bhopal',
      address,
      exactLocation,
      foodType,
      category,
      gstin: gstin || '',
      fssaiNumber: fssaiNumber || '',
      fssaiImage: fssaiImage || '',
      fdaNumber: fdaNumber || '',
      ownerAadhaar,
      photos,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      application,
      message: 'You have successfully applied to get registered for the platform. It needs admin approval to start. We will notify you once admin approves your registration.',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Real Partner Analytics from Database
// @route   GET /api/provider/partner-analytics
export const getPartnerAnalytics = async (req, res) => {
  try {
    const orders = await FoodOrder.find();
    const bookings = await TableBooking.find();

    const totalOrdersCount = orders.length;
    const totalBookingsCount = bookings.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.paymentStatus === 'paid' || o.paymentStatus === 'pending' ? (o.totalAmount || 0) : 0), 0) +
                         bookings.reduce((sum, b) => sum + (b.tablePrice || 0), 0);

    // Group real database revenue by last 7 days / periods
    const daysMap = {};
    orders.forEach((o) => {
      const dayKey = new Date(o.createdAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      if (!daysMap[dayKey]) daysMap[dayKey] = { day: dayKey, revenue: 0, orders: 0 };
      daysMap[dayKey].revenue += (o.totalAmount || 0);
      daysMap[dayKey].orders += 1;
    });
    bookings.forEach((b) => {
      const dayKey = new Date(b.createdAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      if (!daysMap[dayKey]) daysMap[dayKey] = { day: dayKey, revenue: 0, orders: 0 };
      daysMap[dayKey].revenue += (b.tablePrice || 0);
    });

    let revenueByDay = Object.values(daysMap);
    if (revenueByDay.length === 0) {
      revenueByDay = [
        { day: 'Mon', revenue: 0, orders: 0, occupancy: '0%' },
        { day: 'Tue', revenue: 0, orders: 0, occupancy: '0%' },
        { day: 'Wed', revenue: 0, orders: 0, occupancy: '0%' },
        { day: 'Thu', revenue: 0, orders: 0, occupancy: '0%' },
        { day: 'Fri', revenue: 0, orders: 0, occupancy: '0%' },
        { day: 'Sat', revenue: 0, orders: 0, occupancy: '0%' },
        { day: 'Sun', revenue: totalRevenue, orders: totalOrdersCount, occupancy: totalBookingsCount > 0 ? '85%' : '0%' },
      ];
    }

    // Month on month growth calculation dynamically from database
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthMap = {};
    orders.forEach((o) => {
      const mName = monthNames[new Date(o.createdAt).getMonth()];
      if (!monthMap[mName]) monthMap[mName] = { month: mName, revenue: 0 };
      monthMap[mName].revenue += (o.totalAmount || 0);
    });
    bookings.forEach((b) => {
      const mName = monthNames[new Date(b.createdAt).getMonth()];
      if (!monthMap[mName]) monthMap[mName] = { month: mName, revenue: 0 };
      monthMap[mName].revenue += (b.tablePrice || 0);
    });

    let momChartData = Object.values(monthMap);
    if (momChartData.length === 0) {
      momChartData = [
        { month: 'Current Month', revenue: totalRevenue, growth: 'Live' },
      ];
    }

    // Aggregate real peak hour occupancy from DB bookings and food orders
    const hourSlots = ['12 PM', '02 PM', '04 PM', '07 PM', '09 PM', '11 PM'];
    const peakOccupancyData = hourSlots.map((hour) => {
      const hourNum = hour.slice(0, 2);
      const dineInCount = bookings.filter((b) => b.timeSlot && b.timeSlot.includes(hourNum)).length;
      const preOrdersCount = orders.filter((o) => (o.prepTargetTime && o.prepTargetTime.includes(hourNum)) || o.items?.length > 0).length;

      return {
        hour,
        dineIn: dineInCount,
        preOrders: preOrdersCount,
      };
    });

    // Real net margin & fee breakdown from MongoDB records
    const foodSubtotal = orders.reduce((sum, o) => sum + (o.subtotal || 0), 0);
    const platformFees = orders.reduce((sum, o) => sum + (o.platformFee || 0), 0);
    const taxes = orders.reduce((sum, o) => sum + (o.tax || 0), 0);
    const netMargin = Math.max(0, totalRevenue - platformFees - taxes);

    const marginsData = [
      { name: 'Food & Beverage Subtotal', value: foodSubtotal || 0, color: '#14382B' },
      { name: 'Restaurant Net Margin', value: netMargin || 0, color: '#2E6B4E' },
      { name: 'Platform Service Fee', value: platformFees || 0, color: '#FF5722' },
      { name: 'Taxes & Levies (5% GST)', value: taxes || 0, color: '#F59E0B' },
    ];

    res.json({
      success: true,
      metrics: {
        totalRevenue,
        totalOrdersCount,
        totalBookingsCount,
      },
      analytics: {
        revenueByDay,
        momChartData,
        peakOccupancyData,
        marginsData,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Partner Login
// @route   POST /api/provider/partner-login
export const partnerLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check application status first
    const app = await RestaurantApplication.findOne({ email: email.toLowerCase() });
    if (app && app.status === 'pending') {
      return res.status(403).json({
        message: 'Your registration application is currently PENDING ADMIN APPROVAL. You will receive an Email and SMS once approved by admin.',
        status: 'pending',
      });
    }

    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials or restaurant account not registered.' });
    }

    const restaurant = await Restaurant.findOne({ ownerId: user._id });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret_key_123', { expiresIn: '30d' });

    res.json({
      success: true,
      token,
      user,
      restaurant,
      message: 'Partner login successful!',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Register a new Restaurant (Provider Onboarding Wizard)
// @route   POST /api/provider/register-restaurant
export const registerRestaurant = async (req, res) => {
  try {
    const {
      name,
      tagline,
      description,
      tier,
      city,
      address,
      cuisine,
      seatingCapacity,
      avgCostForTwo,
      managerDetails,
      licenses,
      photos,
    } = req.body;

    if (!name || !tier || !address) {
      return res.status(400).json({ message: 'Restaurant name, tier, and address are required' });
    }

    // Check if user already owns a restaurant
    let restaurant = await Restaurant.findOne({ ownerId: req.user._id });
    if (restaurant) {
      // Update existing restaurant registration
      Object.assign(restaurant, {
        name,
        tagline: tagline || restaurant.tagline,
        description: description || restaurant.description,
        tier,
        city: city || 'Bhopal',
        address,
        cuisine: cuisine || ['North Indian'],
        seatingCapacity: seatingCapacity || { totalTables: 15, totalSeats: 60 },
        avgCostForTwo: avgCostForTwo || 600,
        managerDetails,
        licenses: { ...licenses, isVerified: true },
        photos: photos && photos.length ? photos : restaurant.photos,
      });
      await restaurant.save();
    } else {
      restaurant = new Restaurant({
        name,
        tagline,
        description,
        tier,
        ownerId: req.user._id,
        city: city || 'Bhopal',
        address,
        cuisine: cuisine || ['North Indian'],
        seatingCapacity: seatingCapacity || { totalTables: 15, totalSeats: 60 },
        avgCostForTwo: avgCostForTwo || 600,
        managerDetails,
        licenses: { ...licenses, isVerified: true },
        photos: photos || ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800'],
      });
      await restaurant.save();
    }

    // Update user role to provider if not already admin
    if (req.user.role !== 'admin') {
      req.user.role = 'provider';
      await req.user.save();
    }

    res.json({
      success: true,
      message: 'Restaurant registered successfully!',
      restaurant,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Provider's Own Restaurant
// @route   GET /api/provider/my-restaurant
export const getMyRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ message: 'No restaurant found registered for this account.' });
    }
    res.json({ success: true, restaurant });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add or Update Menu Item
// @route   POST /api/provider/menu-items
export const saveMenuItem = async (req, res) => {
  try {
    const { id, restaurantId, name, description, category, isVeg, containsEgg, pricing, image, isAvailable } = req.body;

    let menuItem;
    if (id) {
      menuItem = await MenuItem.findByIdAndUpdate(
        id,
        { name, description, category, isVeg, containsEgg, pricing, image, isAvailable },
        { new: true }
      );
    } else {
      menuItem = await MenuItem.create({
        restaurantId,
        name,
        description,
        category,
        isVeg: isVeg !== undefined ? isVeg : true,
        containsEgg: containsEgg || false,
        pricing: pricing || { default: 200, half: 120, full: 200 },
        image: image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400',
        isAvailable: isAvailable !== undefined ? isAvailable : true,
      });
    }

    res.json({ success: true, menuItem });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Menu Items for a Restaurant
// @route   GET /api/provider/menu-items/:restaurantId
export const getMenuByRestaurant = async (req, res) => {
  try {
    const menuItems = await MenuItem.find({ restaurantId: req.params.restaurantId });
    res.json({ success: true, count: menuItems.length, menuItems });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete Menu Item
// @route   DELETE /api/provider/menu-items/:id
export const deleteMenuItem = async (req, res) => {
  try {
    await MenuItem.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Menu item deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Kitchen Display System (KDS) Live Stream & Kitchen Demand
// @route   GET /api/provider/kds/:restaurantId
export const getKdsOrders = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const orders = await FoodOrder.find({ restaurantId }).sort({ createdAt: -1 }).populate('userId', 'name phone');
    const bookings = await TableBooking.find({ restaurantId }).sort({ createdAt: -1 }).populate('userId', 'name phone');

    // Aggregate kitchen item demand for active orders (preparing / received)
    const demandMap = {};
    orders
      .filter((o) => ['received', 'preparing'].includes(o.status))
      .forEach((order) => {
        order.items.forEach((item) => {
          const key = `${item.name} (${item.portion || 'default'})`;
          demandMap[key] = (demandMap[key] || 0) + item.quantity;
        });
      });

    const aggregatedDemand = Object.entries(demandMap).map(([item, totalQuantity]) => ({
      item,
      totalQuantity,
    }));

    res.json({
      success: true,
      orders,
      bookings,
      aggregatedDemand,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update Order Status in Kitchen Display System
// @route   PATCH /api/provider/orders/:orderId/status
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await FoodOrder.findByIdAndUpdate(req.params.orderId, { status }, { new: true });
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create Walk-In Table or Food Booking (POS Staff Tablet)
// @route   POST /api/provider/walkin-booking
export const createWalkInBooking = async (req, res) => {
  try {
    const { restaurantId, guestName, guestPhone, guestCount, tableNumber, items } = req.body;

    const bookingId = 'W-IN-' + Math.floor(100000 + Math.random() * 900000);
    const orderId = 'ORD-POS-' + Math.floor(100000 + Math.random() * 900000);

    let foodOrder = null;
    if (items && items.length > 0) {
      const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const tax = Math.round(subtotal * 0.05);
      const totalAmount = subtotal + tax;

      foodOrder = await FoodOrder.create({
        orderId,
        userId: req.user._id,
        restaurantId,
        items,
        subtotal,
        tax,
        platformFee: 0,
        totalAmount,
        paymentStatus: 'paid',
        paymentMethod: 'Cash at Counter (POS)',
        status: 'preparing',
      });
    }

    const booking = await TableBooking.create({
      bookingId,
      userId: req.user._id,
      restaurantId,
      mode: 'walk_in',
      bookingDate: new Date().toISOString().split('T')[0],
      timeSlot: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      guestCount: guestCount || 2,
      tableNumber: tableNumber || 'T-01',
      status: 'seated',
      foodOrderId: foodOrder ? foodOrder._id : null,
    });

    res.json({ success: true, message: 'Walk-in booking created!', booking, foodOrder });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
