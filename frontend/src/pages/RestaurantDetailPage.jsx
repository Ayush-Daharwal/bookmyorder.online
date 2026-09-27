import React, { useState, useEffect } from 'react';
import {
  Utensils, Calendar, Clock, Users, ShieldCheck, MapPin, ChevronLeft, ChevronRight,
  Plus, Minus, ShoppingBag, CheckCircle2, AlertCircle, Sparkles, MessageSquare, Search, Filter
} from 'lucide-react';
import { getRestaurantByIdApi, createBookingApi, checkRestaurantAvailabilityApi } from '../services/api';
import CashfreeCheckoutModal from '../components/CashfreeCheckoutModal';
import DigitalReceiptModal from '../components/DigitalReceiptModal';
import PastTimeModal from '../components/PastTimeModal';
import TableUnavailableModal from '../components/TableUnavailableModal';
import { isPastDateTime } from '../utils/dateUtils';
import { calculatePlatformFee } from '../utils/feeCalculator';

export default function RestaurantDetailPage({
  restaurantId,
  onBack,
  user,
  onOpenAuth,
  initialDate,
  initialTime,
  initialGuests,
}) {
  const getTodayString = () => new Date().toISOString().split('T')[0];
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('table_only'); // 'table_only', 'table_and_food', 'canteen_preorder'
  const [bookingDate, setBookingDate] = useState(initialDate || getTodayString());
  const [timeSlot, setTimeSlot] = useState(initialTime || '07:30 PM');
  const [guestCount, setGuestCount] = useState(initialGuests ? parseInt(initialGuests) || 2 : 2);
  const [durationMinutes, setDurationMinutes] = useState(60); // 15, 30, 45, 60, or custom minutes
  const [customDuration, setCustomDuration] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  // Restaurant Image Slideshow State (6 Photos Bounded)
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  // Modals for Past Time & Fully Booked Table
  const [isPastTimeModalOpen, setIsPastTimeModalOpen] = useState(false);
  const [isTableUnavailableModalOpen, setIsTableUnavailableModalOpen] = useState(false);
  const [nearestSlots, setNearestSlots] = useState(['08:00 PM', '08:30 PM', '09:00 PM']);

  useEffect(() => {
    if (initialDate) setBookingDate(initialDate);
    if (initialTime) setTimeSlot(initialTime);
    if (initialGuests) setGuestCount(parseInt(initialGuests) || 2);
  }, [initialDate, initialTime, initialGuests]);
  
  // Interactive Menu Filter & Search State
  const [menuSearch, setMenuSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Dishes');
  const [dietaryFilter, setDietaryFilter] = useState('veg'); // 'veg' or 'nonveg'
  
  // Cart State for Food Items
  const [cart, setCart] = useState({}); // { itemId: { item, portion: 'full', quantity: 1, customNote: '' } }
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [createdBooking, setCreatedBooking] = useState(null);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  useEffect(() => {
    fetchDetail();
  }, [restaurantId]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await getRestaurantByIdApi(restaurantId);
      setData(res.data);
      if (res.data.restaurant?.tier === 'canteen') {
        setMode('canteen_preorder');
      } else {
        setMode('table_only');
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (item, portion = 'full') => {
    setCart((prev) => {
      const key = `${item._id}_${portion}`;
      const existing = prev[key] || { item, portion, quantity: 0, customNote: '' };
      return {
        ...prev,
        [key]: { ...existing, quantity: existing.quantity + 1 },
      };
    });
  };

  const handleUpdateQuantity = (key, delta) => {
    setCart((prev) => {
      const existing = prev[key];
      if (!existing) return prev;
      const newQty = existing.quantity + delta;
      if (newQty <= 0) {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      }
      return { ...prev, [key]: { ...existing, quantity: newQty } };
    });
  };

  const handleUpdateNote = (key, customNote) => {
    setCart((prev) => {
      if (!prev[key]) return prev;
      return { ...prev, [key]: { ...prev[key], customNote } };
    });
  };

  const handleCheckSlotAvailability = async (date, time) => {
    if (mode === 'canteen_preorder') return;
    if (isPastDateTime(date, time)) {
      setIsPastTimeModalOpen(true);
      return;
    }
    try {
      const res = await checkRestaurantAvailabilityApi(restaurantId, { date, time });
      if (res.data && res.data.isAvailable === false) {
        setNearestSlots(res.data.nearestSlots || ['08:00 PM', '08:30 PM', '09:00 PM']);
        setIsTableUnavailableModalOpen(true);
      }
    } catch (err) {
      console.error('Check availability error:', err);
    }
  };

  const handleSelectNearestTime = (slot) => {
    setTimeSlot(slot);
    setIsTableUnavailableModalOpen(false);
    const elem = document.getElementById('digital-menu-section');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // 1. Dynamic Table Price calculation according to booking time & duration
  const activeDurationMinutes = durationMinutes === 'custom' ? (parseInt(customDuration) || 60) : (parseInt(durationMinutes) || 60);
  const baseHourlyRate = 100;
  let calculatedTableRate = Math.max(20, Math.round((activeDurationMinutes / 60) * baseHourlyRate));

  // Peak evening slots (07:00 PM - 10:00 PM)
  const isPeakSlot = timeSlot && (timeSlot.includes('07:') || timeSlot.includes('08:') || timeSlot.includes('09:') || timeSlot.includes('10:')) && timeSlot.toLowerCase().includes('pm');
  if (isPeakSlot) {
    calculatedTableRate = Math.round(calculatedTableRate * 1.2);
  }

  const tablePrice = (mode === 'table_only' || mode === 'table_and_food') ? calculatedTableRate : 0;

  // Calculate Subtotal, Table Charge & Taxes & Platform Fee accurately
  const cartItemsList = Object.values(cart);
  const itemsSubtotal = cartItemsList.reduce((sum, entry) => {
    const price = entry.portion === 'half' ? entry.item.pricing.half : entry.item.pricing.full || entry.item.pricing.default;
    return sum + price * entry.quantity;
  }, 0);

  const restTier = data?.restaurant?.tier || 'premium';

  let subtotal = 0;
  let tax = 0;
  let platformFee = 0;
  let grandTotal = 0;

  if (mode === 'table_only') {
    subtotal = 0;
    const base = tablePrice;
    tax = Math.round(base * 0.05);
    const baseWithGst = base + tax;
    platformFee = calculatePlatformFee(baseWithGst, restTier);
    grandTotal = baseWithGst + platformFee;
  } else if (mode === 'table_and_food') {
    subtotal = itemsSubtotal;
    const base = tablePrice + itemsSubtotal;
    tax = Math.round(base * 0.05);
    const baseWithGst = base + tax;
    platformFee = calculatePlatformFee(baseWithGst, restTier);
    grandTotal = baseWithGst + platformFee;
  } else {
    // canteen_preorder mode
    subtotal = itemsSubtotal;
    tax = Math.round(itemsSubtotal * 0.05);
    const baseWithGst = itemsSubtotal + tax;
    platformFee = calculatePlatformFee(baseWithGst, restTier);
    grandTotal = baseWithGst + platformFee;
  }

  const handleInitiateBooking = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }

    if (isPastDateTime(bookingDate, timeSlot)) {
      setIsPastTimeModalOpen(true);
      return;
    }

    if (mode === 'canteen_preorder' && cartItemsList.length === 0) {
      alert('Please select at least 1 food item to pre-order.');
      return;
    }

    if (mode === 'table_and_food' && cartItemsList.length === 0) {
      alert('You have selected "Book Table + Pre-Order Food" but your cart is empty. Please add dishes from the menu below or switch to "Book Only Table".');
      return;
    }

    const finalDurationNum = durationMinutes === 'custom' ? (parseInt(customDuration) || 60) : (parseInt(durationMinutes) || 60);

    try {
      const itemsPayload = cartItemsList.map((entry) => ({
        _id: entry.item._id,
        name: entry.item.name,
        portion: entry.portion,
        pricing: entry.item.pricing,
        quantity: entry.quantity,
        customNote: entry.customNote,
      }));

      const res = await createBookingApi({
        restaurantId,
        mode,
        bookingDate,
        timeSlot,
        guestCount,
        durationMinutes: finalDurationNum,
        tablePrice: (mode === 'table_only' || mode === 'table_and_food') ? tablePrice : 0,
        specialRequests,
        items: itemsPayload,
        prepTargetTime: timeSlot,
      });

      const bookingObj = {
        ...(res.data.booking || {}),
        restaurantId: res.data.booking?.restaurantId || data?.restaurant,
        durationMinutes: finalDurationNum,
        tablePrice: (mode === 'table_only' || mode === 'table_and_food') ? tablePrice : 0,
      };

      setCreatedBooking(bookingObj);
      setCreatedOrder(res.data.foodOrder);
      setIsCheckoutOpen(true);
    } catch (err) {
      if (err.response?.data?.isFullyBooked) {
        setNearestSlots(err.response.data.nearestSlots || ['08:00 PM', '08:30 PM', '09:00 PM']);
        setIsTableUnavailableModalOpen(true);
      } else {
        alert(err.response?.data?.message || 'Booking initiation failed');
      }
    }
  };

  const handlePaymentSuccess = (order, booking) => {
    setIsReceiptOpen(true);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-forest-800 border-t-transparent mx-auto mb-4" />
        Loading restaurant details & digital menu...
      </div>
    );
  }

  if (!data || !data.restaurant) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-red-600 font-bold">Restaurant not found.</p>
        <button onClick={onBack} className="mt-4 text-xs font-bold text-forest-800 underline">
          Go Back
        </button>
      </div>
    );
  }

  const { restaurant, menuItems, reviews } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Back button */}
      <button
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-forest-900 bg-white px-4 py-2 rounded-full border border-sand-200 shadow-sm"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Restaurants
      </button>

      {/* Restaurant Header Manual Slideshow Card (6 Bounded Photos) */}
      {(() => {
        const slideshowPhotos = [
          { url: restaurant.photos?.[0] || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800', title: '1/6 Main Restaurant View' },
          { url: restaurant.photos?.[1] || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800', title: '2/6 Restaurant Front Entrance' },
          { url: restaurant.photos?.[2] || 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&q=80&w=800', title: '3/6 Dining Hall & Table Area' },
          { url: restaurant.photos?.[3] || 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=800', title: '4/6 Hygienic Kitchen Area' },
          { url: restaurant.photos?.[4] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800', title: '5/6 Signature Served Dish Plate' },
          { url: restaurant.photos?.[5] || 'https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&q=80&w=800', title: '6/6 Official Digital Menu Card' },
        ];
        const currentPhoto = slideshowPhotos[activePhotoIdx] || slideshowPhotos[0];

        return (
          <div className="bg-white rounded-3xl overflow-hidden shadow-md border border-sand-200 mb-8 relative">
            <div className="relative h-72 sm:h-96 bg-slate-900 transition-all duration-300">
              <img
                src={currentPhoto.url}
                alt={currentPhoto.title}
                className="w-full h-full object-cover opacity-90 transition-opacity duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
              
              {/* Photo Title & Index Badge (Top Left) */}
              <div className="absolute top-4 left-4 z-20">
                <span className="bg-slate-950/80 text-amber-400 text-xs font-black px-3 py-1.5 rounded-full border border-amber-400/30 backdrop-blur-md shadow-lg flex items-center gap-1.5">
                  📷 {currentPhoto.title}
                </span>
              </div>

              {/* Manual Nav Prev/Next Buttons (Top Right, Bounded 1 to 6) */}
              <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
                <button
                  type="button"
                  disabled={activePhotoIdx === 0}
                  onClick={() => setActivePhotoIdx((prev) => Math.max(0, prev - 1))}
                  className="p-2 rounded-full bg-slate-950/80 hover:bg-slate-950 text-white backdrop-blur-md transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed border border-white/20 shadow-md"
                  title="Previous Photo (6 <- 5 <- 4...)"
                >
                  <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                </button>
                <span className="text-xs font-black text-white px-2 py-1 bg-slate-950/70 rounded-lg backdrop-blur-md">
                  {activePhotoIdx + 1} / 6
                </span>
                <button
                  type="button"
                  disabled={activePhotoIdx === slideshowPhotos.length - 1}
                  onClick={() => setActivePhotoIdx((prev) => Math.min(slideshowPhotos.length - 1, prev + 1))}
                  className="p-2 rounded-full bg-slate-950/80 hover:bg-slate-950 text-white backdrop-blur-md transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed border border-white/20 shadow-md"
                  title="Next Photo (1 -> 2 -> 3...)"
                >
                  <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>

              {/* Bottom Info Overlay */}
              <div className="absolute bottom-6 left-6 right-6 text-white flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 z-10">
                <div>
                  <span className="bg-terracotta-500 text-white text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider mb-2 inline-block shadow">
                    {restaurant.tier} Tier Operating Mode
                  </span>
                  <h1 className="text-2xl sm:text-4xl font-extrabold">{restaurant.name}</h1>
                  <p className="text-sand-200 text-xs sm:text-sm mt-1">{restaurant.tagline}</p>
                </div>
                
                <div className="bg-white/90 backdrop-blur-md text-slate-900 px-4 py-2 rounded-2xl border border-white/50 text-center shadow-lg">
                  <p className="text-xl font-extrabold text-terracotta-600">★ {restaurant.rating || 4.5}</p>
                  <p className="text-[10px] text-slate-500 font-semibold">{restaurant.ratingCount || 128} verified reviews</p>
                </div>
              </div>

              {/* Bottom Slide Thumbnails Strip (Manual Clickable 1-6) */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 bg-slate-950/60 p-1.5 rounded-full backdrop-blur-md border border-white/10">
                {slideshowPhotos.map((ph, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActivePhotoIdx(idx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      activePhotoIdx === idx ? 'w-6 bg-amber-400' : 'w-2 bg-white/50 hover:bg-white'
                    }`}
                    title={ph.title}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Grid: 3-Mode Booking Engine & Digital Menu */}
      <div id="digital-menu-section" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Mode Selector & Digital Menu UI */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Mode Info Banner & Interactive Mode Switcher */}
          {restaurant.tier === 'canteen' ? (
            <div className="bg-orange-50 border border-orange-200 rounded-3xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-[#D84315] text-base flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-[#D84315]" /> Food Pre-Order & Quick Counter Pickup
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Campus & Institutional Canteen mode — Select your meal items below and pick up at the designated time. No table booking required.
                </p>
              </div>
              <span className="bg-[#D84315] text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow whitespace-nowrap">
                Pre-Order Only
              </span>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-5 shadow-md border border-sand-200 space-y-4">
              <div className="flex items-center justify-between border-b border-sand-200 pb-3">
                <h3 className="font-extrabold text-forest-900 text-base flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-[#14382B]" /> Choose Booking Option
                </h3>
                <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  {mode === 'table_only' ? '🪑 Book Only Table (Food Optional)' : '🍽️ Book Table + Pre-Order Food'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => setMode('table_only')}
                  className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                    mode === 'table_only'
                      ? 'bg-[#14382B] text-white border-[#14382B] shadow-lg ring-2 ring-[#14382B]/20'
                      : 'bg-sand-50 text-slate-800 border-sand-200 hover:bg-sand-100'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="font-black text-sm flex items-center gap-1.5">
                      🪑 Book Only Table
                    </span>
                    <p className={`text-xs ${mode === 'table_only' ? 'text-sand-200' : 'text-slate-500'}`}>
                      Reserve table for 15, 30, 45, or 60 min. Food is completely optional!
                    </p>
                  </div>
                  <span className={`text-[10px] font-extrabold mt-3 px-2.5 py-1 rounded-lg inline-block w-max ${
                    mode === 'table_only' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-900'
                  }`}>
                    Table Fee: ₹{tablePrice}
                  </span>
                </button>

                <button
                  onClick={() => setMode('table_and_food')}
                  className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                    mode === 'table_and_food'
                      ? 'bg-[#14382B] text-white border-[#14382B] shadow-lg ring-2 ring-[#14382B]/20'
                      : 'bg-sand-50 text-slate-800 border-sand-200 hover:bg-sand-100'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="font-black text-sm flex items-center gap-1.5">
                      🍲 Book Table + Pre-Order Food
                    </span>
                    <p className={`text-xs ${mode === 'table_and_food' ? 'text-sand-200' : 'text-slate-500'}`}>
                      Reserve table and pre-order dishes from menu for zero-wait serving upon arrival.
                    </p>
                  </div>
                  <span className={`text-[10px] font-extrabold mt-3 px-2.5 py-1 rounded-lg inline-block w-max ${
                    mode === 'table_and_food' ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-900'
                  }`}>
                    Table + Food Bill
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Book Only Table Option: Render Table Photos Showcase Gallery (Requirement 6) */}
          {mode === 'table_only' && (
            <div className="bg-white rounded-3xl p-6 shadow-md border border-sand-200 space-y-5">
              <div className="border-b border-sand-200 pb-3">
                <h3 className="font-extrabold text-forest-900 text-lg flex items-center gap-2">
                  🪑 Restaurant Table Showcase & Seating Gallery
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Explore available table seating layouts provided by {restaurant.name}. Your reserved table is guaranteed upon confirmation.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Photo 1: Table Hall Photo */}
                <div className="bg-sand-50 rounded-2xl overflow-hidden border border-sand-200 shadow-sm flex flex-col hover:shadow-md transition-shadow">
                  <div className="relative h-44 bg-slate-900">
                    <img
                      src={restaurant.photos?.[2] || 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&q=80&w=800'}
                      alt="Main Dining Table Hall"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-md text-amber-400 text-[10px] font-black px-2.5 py-1 rounded-full border border-amber-400/30">
                      Photo 1: Table Hall View
                    </span>
                  </div>
                  <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-xs">Spacious Dining Hall Area</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Air-conditioned central hall with premium wooden tables and ambient lighting.</p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 w-max">
                      Family & Group Dining
                    </span>
                  </div>
                </div>

                {/* Photo 2: Particular Table Photo */}
                <div className="bg-sand-50 rounded-2xl overflow-hidden border border-sand-200 shadow-sm flex flex-col hover:shadow-md transition-shadow">
                  <div className="relative h-44 bg-slate-900">
                    <img
                      src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800"
                      alt="Particular 4-Seater Table"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-md text-amber-400 text-[10px] font-black px-2.5 py-1 rounded-full border border-amber-400/30">
                      Photo 2: Particular Table Setup
                    </span>
                  </div>
                  <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-xs">Particular Reserved Table</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Cushioned ergonomic seating with priority table service upon arrival.</p>
                    </div>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 w-max">
                      Priority Reserved Seat
                    </span>
                  </div>
                </div>

                {/* Photo 3: Different Location Table Photo */}
                <div className="bg-sand-50 rounded-2xl overflow-hidden border border-sand-200 shadow-sm flex flex-col hover:shadow-md transition-shadow">
                  <div className="relative h-44 bg-slate-900">
                    <img
                      src="https://images.unsplash.com/photo-1578474846511-04ba529f0b88?auto=format&fit=crop&q=80&w=800"
                      alt="Window & Outdoor Table"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-md text-amber-400 text-[10px] font-black px-2.5 py-1 rounded-full border border-amber-400/30">
                      Photo 3: Window / Outdoor View
                    </span>
                  </div>
                  <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-xs">Window-Side & Terrace Table</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Cozy window-side view table location perfect for couples & intimate dining.</p>
                    </div>
                    <span className="text-[10px] font-bold text-purple-800 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 w-max">
                      Scenic View Location
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Digital Menu Interactive Filter & Search Controls */}
          {mode !== 'table_only' && (
            <div className="space-y-5">
              
              {/* Menu Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sand-200 pb-3">
                <div>
                  <h3 className="font-extrabold text-forest-900 text-xl flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-terracotta-500" /> Interactive Digital Menu
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Explore dishes by category, search favorites, half & full portion options available.
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-600 bg-sand-100 px-3 py-1 rounded-full self-start sm:self-auto border border-sand-200">
                  {menuItems.length} Total Dishes
                </span>
              </div>

              {/* Search Bar & Veg Toggle Bar */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search dishes, ingredients, or cuisines (e.g. Paneer, Dosa, Noodles)..."
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                    className="w-full bg-white text-slate-800 text-xs font-semibold pl-10 pr-4 py-2.5 rounded-2xl border border-sand-200 focus:outline-none focus:ring-2 focus:ring-[#14382B] shadow-sm"
                  />
                  {menuSearch && (
                    <button
                      onClick={() => setMenuSearch('')}
                      className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-700 font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {restaurant.isPureVeg ? (
                  <button
                    disabled
                    title="This restaurant is 100% Pure Veg"
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl font-extrabold text-xs bg-emerald-700 text-white border border-emerald-700 shadow shrink-0 cursor-default"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-pulse" />
                    Pure Veg Only
                  </button>
                ) : (
                  <button
                    onClick={() => setDietaryFilter(dietaryFilter === 'veg' ? 'nonveg' : 'veg')}
                    title="Click to toggle between Veg and Non-Veg menu"
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl font-extrabold text-xs border transition-all cursor-pointer shrink-0 shadow-md ${
                      dietaryFilter === 'veg'
                        ? 'bg-emerald-700 text-white border-emerald-700 hover:bg-emerald-800'
                        : 'bg-rose-700 text-white border-rose-700 hover:bg-rose-800'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${dietaryFilter === 'veg' ? 'bg-emerald-300' : 'bg-rose-300'}`} />
                    {dietaryFilter === 'veg' ? 'Veg Only 🟢' : 'Non-Veg Only 🔴'}
                  </button>
                )}
              </div>

              {/* Dynamic Category Filter Pills */}
              {(() => {
                const uniqueCategories = ['All Dishes', ...Array.from(new Set(menuItems.map((it) => it.category).filter(Boolean)))];

                return (
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar">
                    {uniqueCategories.map((cat) => {
                      const count = cat === 'All Dishes'
                        ? menuItems.length
                        : menuItems.filter((it) => it.category === cat).length;

                      const isSelected = selectedCategory === cat;

                      return (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-4 py-2 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'bg-[#14382B] text-white shadow-md'
                              : 'bg-white text-slate-700 hover:bg-sand-100 border border-sand-200'
                          }`}
                        >
                          <span>{cat}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-sand-100 text-slate-500'}`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Filtered Menu Grid */}
              {(() => {
                const filtered = menuItems.filter((item) => {
                  if (selectedCategory !== 'All Dishes' && item.category !== selectedCategory) {
                    return false;
                  }
                  if (restaurant.isPureVeg || dietaryFilter === 'veg') {
                    if (!item.isVeg) return false;
                  } else if (dietaryFilter === 'nonveg') {
                    if (item.isVeg) return false;
                  }
                  if (menuSearch) {
                    const q = menuSearch.toLowerCase();
                    const nameMatch = item.name && item.name.toLowerCase().includes(q);
                    const descMatch = item.description && item.description.toLowerCase().includes(q);
                    const catMatch = item.category && item.category.toLowerCase().includes(q);
                    if (!nameMatch && !descMatch && !catMatch) return false;
                  }
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="bg-white rounded-3xl p-10 text-center border border-sand-200 text-slate-500 space-y-2">
                      <Utensils className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-bold text-slate-800 text-sm">No dishes found matching your filter.</p>
                      <p className="text-xs text-slate-500">Try clearing your search query or selecting a different category pill above.</p>
                      <button
                        onClick={() => { setMenuSearch(''); setSelectedCategory('All Dishes'); setDietaryFilter('veg'); }}
                        className="mt-2 text-xs font-extrabold text-[#D84315] hover:underline"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filtered.map((item) => (
                      <div key={item._id} className="bg-white rounded-3xl p-4 shadow-sm border border-sand-200 flex flex-col justify-between space-y-3 hover:shadow-md transition-shadow">
                        <div className="flex gap-3">
                          <img src={item.image} alt={item.name} className="w-20 h-20 rounded-2xl object-cover shrink-0" />
                          <div className="space-y-1 flex-1">
                            <div className="flex items-start justify-between gap-1.5">
                              <div className="flex items-center gap-1.5">
                                {/* Standard Veg / Non-Veg Square Icon */}
                                <span
                                  title={item.isVeg ? 'Pure Veg Dish' : 'Non-Veg Dish'}
                                  className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center shrink-0 ${
                                    item.isVeg ? 'border-emerald-600 bg-emerald-50' : 'border-rose-600 bg-rose-50'
                                  }`}
                                >
                                  <span className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                                </span>
                                <h4 className="font-bold text-forest-900 text-sm leading-snug">{item.name}</h4>
                              </div>

                              <span
                                className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md border shrink-0 uppercase tracking-wider ${
                                  item.isVeg
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-rose-50 text-rose-800 border-rose-200'
                                }`}
                              >
                                {item.isVeg ? '🟢 Veg' : '🔴 Non-Veg'}
                              </span>
                            </div>

                            <span className="inline-block text-[10px] font-bold text-slate-500 bg-sand-100 px-2 py-0.5 rounded-md">
                              {item.category || 'Main Course'}
                            </span>
                            <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-sand-200 flex items-center justify-between text-xs">
                          <div>
                            <p className="font-extrabold text-forest-900 text-sm">
                              ₹{item.pricing?.full || item.pricing?.default}
                            </p>
                            {item.pricing?.half > 0 && (
                              <p className="text-[10px] text-slate-500">Half: ₹{item.pricing.half}</p>
                            )}
                          </div>

                          {/* Add Buttons for Full and Half */}
                          <div className="flex items-center gap-1.5">
                            {item.pricing?.half > 0 && (
                              <button
                                onClick={() => handleAddToCart(item, 'half')}
                                className="bg-sand-100 hover:bg-sand-200 text-forest-900 font-bold px-3 py-1.5 rounded-xl transition-all text-xs cursor-pointer"
                              >
                                + Half
                              </button>
                            )}
                            <button
                              onClick={() => handleAddToCart(item, 'full')}
                              className="gradient-orange-btn text-white font-bold px-3 py-1.5 rounded-xl shadow transition-all text-xs cursor-pointer"
                            >
                              + Add Full
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

            </div>
          )}

        </div>

        {/* Right 1 Col: Reservation Parameters & Cart Drawer */}
        <div className="space-y-6">
          
          {/* Reservation Card */}
          <div className="bg-white rounded-3xl p-6 shadow-md border border-sand-200 space-y-4 text-xs">
            <h3 className="font-extrabold text-forest-900 text-base border-b border-sand-200 pb-3">
              Booking Details
            </h3>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Dining Date</label>
              <input
                type="date"
                value={bookingDate}
                min={getTodayString()}
                onChange={(e) => {
                  const newDate = e.target.value;
                  setBookingDate(newDate);
                  if (isPastDateTime(newDate, timeSlot)) {
                    setIsPastTimeModalOpen(true);
                  } else {
                    handleCheckSlotAvailability(newDate, timeSlot);
                  }
                }}
                className="w-full p-2.5 rounded-xl border border-sand-200 bg-sand-50 font-semibold text-slate-800 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">{mode === 'canteen_preorder' ? 'Pickup Time' : 'Time Slot'}</label>
                <select
                  value={timeSlot}
                  onChange={(e) => {
                    const newTime = e.target.value;
                    setTimeSlot(newTime);
                    if (isPastDateTime(bookingDate, newTime)) {
                      setIsPastTimeModalOpen(true);
                    } else {
                      handleCheckSlotAvailability(bookingDate, newTime);
                    }
                  }}
                  className="w-full p-2.5 rounded-xl border border-sand-200 bg-sand-50 font-semibold text-slate-800 cursor-pointer"
                >
                  <option value="01:00 PM">01:00 PM (Lunch)</option>
                  <option value="01:30 PM">01:30 PM (Lunch)</option>
                  <option value="02:00 PM">02:00 PM (Lunch)</option>
                  <option value="02:30 PM">02:30 PM (Lunch)</option>
                  <option value="07:00 PM">07:00 PM (Dinner)</option>
                  <option value="07:30 PM">07:30 PM (Dinner)</option>
                  <option value="08:00 PM">08:00 PM (Dinner)</option>
                  <option value="08:30 PM">08:30 PM (Dinner)</option>
                  <option value="09:00 PM">09:00 PM (Dinner)</option>
                  <option value="09:30 PM">09:30 PM (Dinner)</option>
                  {!['01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM', '09:00 PM', '09:30 PM'].includes(timeSlot) && (
                    <option value={timeSlot}>{timeSlot}</option>
                  )}
                </select>

                {/* Editable Custom Time Input */}
                <div className="mt-1.5 space-y-1">
                  <input
                    type="text"
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    placeholder="e.g. 08:15 PM or 06:45 PM"
                    className="w-full px-3 py-2 rounded-xl border border-sand-300 font-bold text-xs bg-white text-forest-900 focus:ring-2 focus:ring-forest-800"
                  />
                  <p className="text-[10px] text-slate-500 font-medium italic">
                    ✏️ Editable: You can manually type any pickup or table reservation time above.
                  </p>
                </div>
              </div>

              {mode === 'canteen_preorder' ? (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Table</label>
                  <div className="w-full p-2 rounded-xl border border-orange-200 bg-orange-50 font-bold text-[#D84315] text-[11px] text-center">
                    No table reservation
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Guest Count</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={guestCount}
                    onChange={(e) => setGuestCount(parseInt(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-sand-200 bg-sand-50 font-semibold text-slate-800"
                  />
                </div>
              )}
            </div>

            {mode !== 'canteen_preorder' && (
              <div className="pt-1 border-t border-sand-200">
                <label className="block font-bold text-slate-700 mb-1.5">
                  Reserved Table Time Duration (mins)
                </label>
                <div className="grid grid-cols-4 gap-1.5 mb-2">
                  {[15, 30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => { setDurationMinutes(mins); setCustomDuration(''); }}
                      className={`py-2 px-1 rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${
                        durationMinutes === mins
                          ? 'bg-[#14382B] text-white border-[#14382B] shadow'
                          : 'bg-sand-50 text-slate-700 hover:bg-sand-100 border-sand-200'
                      }`}
                    >
                      {mins} min
                    </button>
                  ))}
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDurationMinutes('custom')}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold shrink-0 cursor-pointer border ${
                      durationMinutes === 'custom'
                        ? 'bg-[#14382B] text-white border-[#14382B]'
                        : 'bg-sand-50 text-slate-700 border-sand-200'
                    }`}
                  >
                    Custom Duration
                  </button>
                  {durationMinutes === 'custom' && (
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="number"
                        min={5}
                        max={240}
                        placeholder="e.g. 90"
                        value={customDuration}
                        onChange={(e) => setCustomDuration(e.target.value)}
                        className="w-full p-1.5 rounded-xl border border-sand-200 bg-sand-50 font-bold text-xs"
                      />
                      <span className="text-xs text-slate-500 font-bold">mins</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {mode === 'canteen_preorder' ? 'Special Instructions for Kitchen' : 'Special Table / Dining Request'}
              </label>
              <input
                type="text"
                placeholder={mode === 'canteen_preorder' ? 'e.g. Keep extra napkins, pack separately' : 'e.g. Quiet corner table, high chair'}
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-sand-200 bg-sand-50"
              />
            </div>
          </div>

          {/* Cart Drawer & Checkout Summary */}
          <div className="bg-white rounded-3xl p-6 shadow-md border border-sand-200 space-y-4">
            <h3 className="font-extrabold text-forest-900 text-base border-b border-sand-200 pb-3 flex items-center justify-between">
              <span>Order Summary</span>
              <ShoppingBag className="w-5 h-5 text-terracotta-500" />
            </h3>

            {cartItemsList.length > 0 ? (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {cartItemsList.map((entry) => {
                  const key = `${entry.item._id}_${entry.portion}`;
                  const price = entry.portion === 'half' ? entry.item.pricing.half : entry.item.pricing.full || entry.item.pricing.default;
                  return (
                    <div key={key} className="bg-sand-50 p-3 rounded-2xl text-xs space-y-2 border border-sand-200">
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span>{entry.item.name} ({entry.portion})</span>
                        <span>₹{price * entry.quantity}</span>
                      </div>

                      {/* Custom note text box */}
                      <input
                        type="text"
                        placeholder="Custom note: e.g. less spicy, extra cheese"
                        value={entry.customNote || ''}
                        onChange={(e) => handleUpdateNote(key, e.target.value)}
                        className="w-full px-2.5 py-1 rounded-xl bg-white border border-sand-200 text-[11px]"
                      />

                      {/* Quantity controls */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-slate-500">₹{price} each</span>
                        <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-sand-200">
                          <button onClick={() => handleUpdateQuantity(key, -1)} className="p-0.5 text-slate-600 hover:text-red-600">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-bold text-slate-800">{entry.quantity}</span>
                          <button onClick={() => handleUpdateQuantity(key, 1)} className="p-0.5 text-slate-600 hover:text-emerald-600">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-slate-500 py-6 text-xs bg-sand-50 rounded-2xl border border-sand-200">
                {mode === 'table_only'
                  ? '🪑 Table-only reservation selected (₹100). Food is optional! You can add dishes below or order at table.'
                  : '🛒 Cart is empty. Click "+ Add" on menu dishes below.'}
              </div>
            )}

            {/* Bill breakdown */}
            <div className="space-y-1.5 text-xs text-slate-600 pt-3 border-t border-sand-200">
              {(mode === 'table_only' || mode === 'table_and_food') && (
                <div className="flex justify-between font-bold text-slate-800">
                  <span>Table Booking Charge ({durationMinutes === 'custom' ? (customDuration || '60') : durationMinutes} mins)</span>
                  <span>₹{tablePrice}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-semibold">₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (5%)</span>
                <span className="font-semibold">₹{tax}</span>
              </div>
              <div className="flex justify-between">
                <span>Platform Fee</span>
                <span className="font-semibold">₹{platformFee}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-forest-900 pt-2 border-t border-sand-300">
                <span>Grand Total</span>
                <span className="text-terracotta-600">
                  ₹{grandTotal}
                </span>
              </div>
              {grandTotal === 0 && (
                <p className="text-[10px] text-amber-700 font-semibold text-center pt-1">
                  (No items selected — Grand Total: ₹0)
                </p>
              )}
            </div>

            <button
              onClick={handleInitiateBooking}
              disabled={grandTotal === 0 && mode !== 'table_only'}
              className="w-full gradient-orange-btn text-white font-bold py-3.5 rounded-2xl shadow-lg hover:shadow-xl transition-all text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Proceed to Cashfree Checkout
            </button>

          </div>

        </div>

      </div>

      {/* Cashfree Payment Gateway Sandbox Modal */}
      <CashfreeCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        foodOrder={createdOrder}
        booking={createdBooking}
        onSuccess={handlePaymentSuccess}
      />

      {/* Instant Digital Receipt Modal */}
      <DigitalReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        booking={createdBooking}
        order={createdOrder}
        restaurant={restaurant}
        user={user}
      />

      {/* Past Time Modal */}
      <PastTimeModal
        isOpen={isPastTimeModalOpen}
        onClose={() => setIsPastTimeModalOpen(false)}
        selectedDate={bookingDate}
        selectedTime={timeSlot}
      />

      {/* Table Unavailable / Fully Booked Slot Modal */}
      <TableUnavailableModal
        isOpen={isTableUnavailableModalOpen}
        onClose={() => setIsTableUnavailableModalOpen(false)}
        restaurantName={restaurant.name}
        requestedTime={timeSlot}
        requestedDate={bookingDate}
        nearestSlots={nearestSlots}
        onSelectNearestTime={handleSelectNearestTime}
      />

    </div>
  );
}
