import { Restaurant } from '../models/Restaurant.js';
import { MenuItem } from '../models/MenuItem.js';
import { TableBooking } from '../models/TableBooking.js';
import { FoodOrder } from '../models/FoodOrder.js';
import { Review } from '../models/Review.js';

// @desc    Get All Restaurants with Filtering, Search & Location Sorting
// @route   GET /api/customer/restaurants
export const getRestaurants = async (req, res) => {
  try {
    const { city, tier, cuisine, search, sortBy, hasTableBooking, searchMode } = req.query;
    let query = { isActive: true };

    if (city && city.toLowerCase() !== 'all') {
      query.city = { $regex: city, $options: 'i' };
    }
    if (tier && ['premium', 'mid', 'canteen'].includes(tier)) {
      query.tier = tier;
    } else if (hasTableBooking === 'true' || searchMode === 'table') {
      // Exclude canteens when user specifically searches for table booking
      query.tier = { $ne: 'canteen' };
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

// @desc    Create Table Reservation & Food Prebook
// @route   POST /api/customer/bookings
export const createBooking = async (req, res) => {
  try {
    const { restaurantId, mode, bookingDate, timeSlot, guestCount, specialRequests, items, prepTargetTime } = req.body;

    if (!restaurantId || !mode || !bookingDate || !timeSlot) {
      return res.status(400).json({ message: 'Restaurant, mode, date, and time slot are required' });
    }

    const bookingId = 'BMO-B-' + Math.floor(100000 + Math.random() * 900000);
    let foodOrder = null;

    if (items && items.length > 0) {
      const orderId = 'BMO-O-' + Math.floor(100000 + Math.random() * 900000);
      const subtotal = items.reduce((sum, item) => {
        const itemPrice = item.portion === 'half' ? item.pricing.half : item.portion === 'full' ? item.pricing.full : item.pricing.default;
        return sum + itemPrice * item.quantity;
      }, 0);

      const tax = Math.round(subtotal * 0.05); // GST 5%
      const platformFee = 15;
      const totalAmount = subtotal + tax + platformFee;

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
      tableNumber,
      specialRequests: specialRequests || '',
      foodOrderId: foodOrder ? foodOrder._id : null,
      status: 'confirmed',
    });

    res.json({
      success: true,
      message: 'Booking request created successfully!',
      booking,
      foodOrder,
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
      .populate('restaurantId', 'name tier address photos city tagline')
      .populate('foodOrderId')
      .sort({ createdAt: -1 });

    const orders = await FoodOrder.find({ userId: req.user._id })
      .populate('restaurantId', 'name tier address photos city')
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
