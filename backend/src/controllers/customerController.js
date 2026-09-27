import { Restaurant } from '../models/Restaurant.js';
import { MenuItem } from '../models/MenuItem.js';
import { TableBooking } from '../models/TableBooking.js';
import { FoodOrder } from '../models/FoodOrder.js';
import { Review } from '../models/Review.js';

// Helper to compute available slots for a restaurant on a given date
const ALL_TIME_SLOTS = [
  '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
  '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM', '09:00 PM', '09:30 PM'
];

export async function checkSlotAvailability(restaurantId, bookingDate, requestedSlot) {
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) return { isAvailable: false, nearestSlots: ALL_TIME_SLOTS.slice(0, 3) };

  const totalTables = restaurant.seatingCapacity?.totalTables || 15;
  
  const bookings = await TableBooking.find({
    restaurantId,
    bookingDate,
    status: { $ne: 'cancelled' }
  });

  const slotCounts = {};
  bookings.forEach((b) => {
    slotCounts[b.timeSlot] = (slotCounts[b.timeSlot] || 0) + 1;
  });

  const isRequestedAvailable = requestedSlot ? (slotCounts[requestedSlot] || 0) < totalTables : true;

  const availableSlots = ALL_TIME_SLOTS.filter((slot) => (slotCounts[slot] || 0) < totalTables);
  let nearestSlots = availableSlots.filter((slot) => slot !== requestedSlot).slice(0, 3);
  
  if (nearestSlots.length === 0) {
    nearestSlots = ALL_TIME_SLOTS.filter((slot) => slot !== requestedSlot).slice(0, 3);
  }

  return {
    isAvailable: isRequestedAvailable,
    bookedCount: slotCounts[requestedSlot] || 0,
    totalCapacity: totalTables,
    nearestSlots,
  };
}

// @desc    Get All Restaurants with Filtering, Search & Location Sorting
// @route   GET /api/customer/restaurants
export const getRestaurants = async (req, res) => {
  try {
    const { city, tier, cuisine, search, sortBy, hasTableBooking, searchMode, bookingDate, timeSlot } = req.query;
    let query = { isActive: true };

    if (city && city.toLowerCase() !== 'all') {
      query.city = { $regex: city, $options: 'i' };
    }
    if (tier && ['premium', 'mid', 'canteen'].includes(tier)) {
      query.tier = tier;
    } else if (hasTableBooking === 'true' || searchMode === 'table') {
      // Exclude canteens when user specifically searches for table booking
      query.tier = { $ne: 'canteen' };
    } else if (searchMode === 'preorder' || req.query.preorderOnly === 'true') {
      // Exclude premium fine-dining restaurants where table booking is compulsory
      query.tier = { $in: ['mid', 'canteen'] };
    }

    if (cuisine) {
      query.cuisine = { $in: [new RegExp(cuisine, 'i')] };
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { tagline: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { cuisine: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    // Filter restaurants that have available tables at requested bookingDate & timeSlot
    if (bookingDate && timeSlot) {
      const bookings = await TableBooking.find({
        bookingDate,
        timeSlot,
        status: { $ne: 'cancelled' }
      });

      const restaurantBookingCount = {};
      bookings.forEach((b) => {
        const rId = b.restaurantId.toString();
        restaurantBookingCount[rId] = (restaurantBookingCount[rId] || 0) + 1;
      });

      const fullyBookedIds = [];
      for (const [rId, count] of Object.entries(restaurantBookingCount)) {
        const rest = await Restaurant.findById(rId);
        if (rest && count >= (rest.seatingCapacity?.totalTables || 15)) {
          fullyBookedIds.push(rId);
        }
      }

      if (fullyBookedIds.length > 0) {
        query._id = { $nin: fullyBookedIds };
      }
    }

    let sortOptions = { rating: -1, ratingCount: -1 };
    if (sortBy === 'rating') {
      sortOptions = { rating: -1, ratingCount: -1 };
    } else if (sortBy === 'cost_low') {
      sortOptions = { avgCostForTwo: 1, rating: -1 };
    } else if (sortBy === 'cost_high') {
      sortOptions = { avgCostForTwo: -1, rating: -1 };
    } else if (sortBy === 'discount') {
      sortOptions = { discountPercent: -1, rating: -1 };
    } else if (sortBy === 'recommended' || sortBy === 'nearest_rating') {
      sortOptions = { rating: -1, discountPercent: -1 };
    }

    const restaurants = await Restaurant.find(query).sort(sortOptions);
    res.json({ success: true, count: restaurants.length, restaurants });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Check Single Restaurant Slot Availability
// @route   GET /api/customer/restaurants/:id/check-availability
export const checkRestaurantAvailability = async (req, res) => {
  try {
    const { date, time } = req.query;
    if (!date || !time) {
      return res.status(400).json({ message: 'Date and time parameters are required' });
    }

    const availability = await checkSlotAvailability(req.params.id, date, time);
    res.json({ success: true, ...availability });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Single Restaurant Details + Menu + Reviews
// @route   GET /api/customer/restaurants/:id
export const getRestaurantById = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const menuItems = await MenuItem.find({ restaurantId: restaurant._id, isAvailable: true });
    const reviews = await Review.find({ restaurantId: restaurant._id }).populate('userId', 'name avatar').sort({ createdAt: -1 });

    res.json({
      success: true,
      restaurant,
      menuItems,
      reviews,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const calculateServerPlatformFee = (baseWithGst, tier = 'premium') => {
  const amount = Number(baseWithGst) || 0;
  if (amount <= 0) return 0;

  if (tier === 'canteen') {
    if (amount <= 50) return 0;
    if (amount <= 200) {
      const fee = Math.floor(amount * 0.01);
      return Math.max(0, fee);
    }
    if (amount <= 500) return 5;
    return Math.floor(amount * 0.015);
  } else {
    // Casual / Premium / Luxury
    if (amount <= 100) return 0;
    if (amount <= 500) return 15;
    if (amount <= 1000) return 20;
    return Math.floor(amount * 0.02);
  }
};

// @desc    Create Table Reservation & Food Prebook
// @route   POST /api/customer/bookings
export const createBooking = async (req, res) => {
  try {
    const { restaurantId, mode, bookingDate, timeSlot, guestCount, durationMinutes, tablePrice, specialRequests, items, prepTargetTime } = req.body;

    if (!restaurantId || !mode || !bookingDate || !timeSlot) {
      return res.status(400).json({ message: 'Restaurant, mode, date, and time slot are required' });
    }

    const restaurantObj = await Restaurant.findById(restaurantId);
    const restTier = restaurantObj?.tier || 'premium';

    // Verify availability unless it is canteen preorder
    if (mode !== 'canteen_preorder') {
      const availability = await checkSlotAvailability(restaurantId, bookingDate, timeSlot);
      if (!availability.isAvailable) {
        return res.status(400).json({
          message: `Table is not available at ${timeSlot}`,
          isFullyBooked: true,
          requestedTime: timeSlot,
          requestedDate: bookingDate,
          nearestSlots: availability.nearestSlots
        });
      }
    }

    const bookingId = 'BMO-B-' + Math.floor(100000 + Math.random() * 900000);
    let foodOrder = null;

    const computedTablePrice = (mode === 'table_only' || mode === 'table_and_food') ? (tablePrice !== undefined ? tablePrice : 100) : 0;

    if (items && items.length > 0) {
      const orderId = 'BMO-O-' + Math.floor(100000 + Math.random() * 900000);
      const subtotal = items.reduce((sum, item) => {
        const itemPrice = item.portion === 'half' ? item.pricing.half : item.portion === 'full' ? item.pricing.full : item.pricing.default;
        return sum + itemPrice * item.quantity;
      }, 0);

      const baseAmount = subtotal + computedTablePrice;
      const tax = Math.round(baseAmount * 0.05); // GST 5%
      const baseWithGst = baseAmount + tax;
      const platformFee = calculateServerPlatformFee(baseWithGst, restTier);
      const totalAmount = baseWithGst + platformFee;

      const orderItems = items.map((i) => ({
        menuItemId: i._id,
        name: i.name,
        portion: i.portion || 'default',
        price: i.portion === 'half' ? i.pricing.half : i.portion === 'full' ? i.pricing.full : i.pricing.default,
        quantity: i.quantity,
        customNote: i.customNote || '',
      }));

      foodOrder = await FoodOrder.create({
        orderId,
        userId: req.user._id,
        restaurantId,
        items: orderItems,
        subtotal,
        tax,
        platformFee,
        totalAmount,
        paymentStatus: 'pending',
        prepTargetTime: prepTargetTime || timeSlot,
      });
    }

    // Auto-assign table number or No table reservation for canteens
    const tableNumber = mode === 'canteen_preorder' ? 'No table reservation' : 'Table T-' + (Math.floor(Math.random() * 12) + 1);

    const booking = await TableBooking.create({
      bookingId,
      userId: req.user._id,
      restaurantId,
      mode,
      bookingDate,
      timeSlot,
      guestCount: guestCount || 2,
      durationMinutes: durationMinutes || 60,
      tablePrice: tablePrice !== undefined ? tablePrice : 100,
      tableNumber,
      specialRequests: specialRequests || '',
      foodOrderId: foodOrder ? foodOrder._id : null,
      status: 'confirmed',
    });

    const populatedBooking = await TableBooking.findById(booking._id).populate('restaurantId', 'name tier address photos city tagline licenses fssaiLicenseNumber gstin');
    let populatedFoodOrder = null;
    if (foodOrder) {
      populatedFoodOrder = await FoodOrder.findById(foodOrder._id).populate('restaurantId', 'name tier address photos city tagline licenses fssaiLicenseNumber gstin');
    }

    res.json({
      success: true,
      message: 'Booking request created successfully!',
      booking: populatedBooking,
      foodOrder: populatedFoodOrder || foodOrder,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add Food Items to Existing Active Table Booking (Allowed up to 2 min before table time ends)
// @route   POST /api/customer/bookings/:id/add-food
export const addFoodToBooking = async (req, res) => {
  try {
    const { items } = req.body;
    const booking = await TableBooking.findById(req.params.id).populate('restaurantId');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Please select at least one food item' });
    }

    // Check if within 2 minutes of table ending time
    // Parse bookingDate and timeSlot
    const match = (booking.timeSlot || '').match(/(\d+):(\d+)\s*(AM|PM)?/i);
    let hours = 19, mins = 30;
    if (match) {
      hours = parseInt(match[1]);
      mins = parseInt(match[2]);
      const ampm = match[3];
      if (ampm) {
        if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
        if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
      }
    }

    const [yr, mo, dy] = (booking.bookingDate || new Date().toISOString().split('T')[0]).split('-').map(Number);
    const startDate = new Date(yr, mo - 1, dy, hours, mins, 0);
    const durationMins = booking.durationMinutes || 60;
    const endDate = new Date(startDate.getTime() + durationMins * 60 * 1000);
    const cutoffTime = new Date(endDate.getTime() - 2 * 60 * 1000); // 2 mins cutoff

    const now = new Date();

    // Check if cutoff has passed for today's booking
    const isToday = now.toISOString().split('T')[0] === booking.bookingDate;
    if (isToday && now > cutoffTime) {
      return res.status(400).json({
        message: 'Food order window closed! You can only add food items until 2 minutes before your reserved table time ends.',
        isClosed: true
      });
    }

    const orderId = 'BMO-ADD-' + Math.floor(100000 + Math.random() * 900000);
    const subtotal = items.reduce((sum, item) => {
      const itemPrice = item.portion === 'half' ? item.pricing.half : item.portion === 'full' ? item.pricing.full : item.pricing.default;
      return sum + itemPrice * item.quantity;
    }, 0);

    const restTier = booking.restaurantId?.tier || 'premium';
    const tax = Math.round(subtotal * 0.05); // GST 5%
    const baseWithGst = subtotal + tax;
    const platformFee = calculateServerPlatformFee(baseWithGst, restTier);
    const totalAmount = baseWithGst + platformFee;

    const orderItems = items.map((i) => ({
      menuItemId: i._id,
      name: i.name,
      portion: i.portion || 'default',
      price: i.portion === 'half' ? i.pricing.half : i.portion === 'full' ? i.pricing.full : i.pricing.default,
      quantity: i.quantity,
      customNote: i.customNote || '',
    }));

    const addonOrder = await FoodOrder.create({
      orderId,
      userId: req.user._id,
      restaurantId: booking.restaurantId._id || booking.restaurantId,
      items: orderItems,
      subtotal,
      tax,
      platformFee,
      totalAmount,
      paymentStatus: 'pending',
      prepTargetTime: booking.timeSlot,
    });

    if (!booking.addonFoodOrders) {
      booking.addonFoodOrders = [];
    }
    booking.addonFoodOrders.push(addonOrder._id);
    await booking.save();

    const populatedAddonOrder = await FoodOrder.findById(addonOrder._id).populate('restaurantId');
    const updatedBooking = await TableBooking.findById(booking._id)
      .populate('restaurantId')
      .populate('foodOrderId')
      .populate('addonFoodOrders');

    res.json({
      success: true,
      message: 'Add-on food order added to reserved table successfully!',
      booking: updatedBooking,
      foodOrder: populatedAddonOrder,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Customer's Bookings and Order History
// @route   GET /api/customer/my-history
export const getMyHistory = async (req, res) => {
  try {
    const bookings = await TableBooking.find({ userId: req.user._id })
      .populate('restaurantId', 'name tier address photos city tagline licenses fssaiLicenseNumber gstin')
      .populate('foodOrderId')
      .sort({ createdAt: -1 });

    const orders = await FoodOrder.find({ userId: req.user._id })
      .populate('restaurantId', 'name tier address photos city tagline licenses fssaiLicenseNumber gstin')
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings, orders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit Review & Rating for Restaurant
// @route   POST /api/customer/reviews
export const addReview = async (req, res) => {
  try {
    const { restaurantId, rating, comment } = req.body;
    if (!restaurantId || !rating || !comment) {
      return res.status(400).json({ message: 'Restaurant ID, rating, and comment are required' });
    }

    const review = await Review.create({
      userId: req.user._id,
      restaurantId,
      rating,
      comment,
    });

    // Update restaurant rating average
    const reviews = await Review.find({ restaurantId });
    const avgRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);
    await Restaurant.findByIdAndUpdate(restaurantId, {
      rating: parseFloat(avgRating),
      ratingCount: reviews.length,
    });

    res.json({ success: true, review });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
