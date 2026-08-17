import { Restaurant } from '../models/Restaurant.js';
import { MenuItem } from '../models/MenuItem.js';
import { FoodOrder } from '../models/FoodOrder.js';
import { TableBooking } from '../models/TableBooking.js';

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
