import React, { useState, useEffect } from 'react';
import {
  Utensils, Calendar, Clock, Users, ShieldCheck, MapPin, ChevronLeft,
  Plus, Minus, ShoppingBag, CheckCircle2, AlertCircle, Sparkles, MessageSquare
} from 'lucide-react';
import { getRestaurantByIdApi, createBookingApi } from '../services/api';
import CashfreeCheckoutModal from '../components/CashfreeCheckoutModal';
import DigitalReceiptModal from '../components/DigitalReceiptModal';

export default function RestaurantDetailPage({ restaurantId, onBack, user, onOpenAuth }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('table_and_food'); // 'table_and_food', 'table_only', 'canteen_preorder'
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState('07:30 PM');
  const [guestCount, setGuestCount] = useState(2);
  const [specialRequests, setSpecialRequests] = useState('');
  
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

  // Calculate Subtotal & Taxes
  const cartItemsList = Object.values(cart);
  const subtotal = cartItemsList.reduce((sum, entry) => {
    const price = entry.portion === 'half' ? entry.item.pricing.half : entry.item.pricing.full || entry.item.pricing.default;
    return sum + price * entry.quantity;
  }, 0);
  const tax = Math.round(subtotal * 0.05); // GST 5%
  const platformFee = subtotal > 0 ? 15 : 0;
  const grandTotal = subtotal + tax + platformFee;

  const handleInitiateBooking = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }

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
        specialRequests,
        items: itemsPayload,
        prepTargetTime: timeSlot,
      });

      setCreatedBooking(res.data.booking);
      setCreatedOrder(res.data.foodOrder);
      setIsCheckoutOpen(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Booking initiation failed');
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

      {/* Restaurant Header Card */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-md border border-sand-200 mb-8">
        <div className="relative h-64 sm:h-80 bg-slate-900">
          <img
            src={restaurant.photos?.[0] || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800'}
            alt={restaurant.name}
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
          
          <div className="absolute bottom-6 left-6 right-6 text-white flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
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
        </div>
      </div>

      {/* Grid: 3-Mode Booking Engine & Digital Menu */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Mode Selector & Digital Menu UI */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Mode Selector Header */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-sand-200">
            <h3 className="font-extrabold text-forest-900 text-base mb-4">Choose Your Dining Workflow</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div
                onClick={() => setMode('table_and_food')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  mode === 'table_and_food'
                    ? 'border-terracotta-500 bg-terracotta-500/5 ring-2 ring-terracotta-500/20'
                    : 'border-sand-200 hover:border-slate-300'
                }`}
              >
                <p className="font-bold text-forest-900">Mode 1: Table + Food</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Prebook seat & pre-order dishes</p>
              </div>

              <div
                onClick={() => setMode('table_only')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  mode === 'table_only'
                    ? 'border-terracotta-500 bg-terracotta-500/5 ring-2 ring-terracotta-500/20'
                    : 'border-sand-200 hover:border-slate-300'
                }`}
              >
                <p className="font-bold text-forest-900">Mode 2: Table Only</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Reserve table; order food at runtime</p>
              </div>

              <div
                onClick={() => setMode('canteen_preorder')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  mode === 'canteen_preorder'
                    ? 'border-terracotta-500 bg-terracotta-500/5 ring-2 ring-terracotta-500/20'
                    : 'border-sand-200 hover:border-slate-300'
                }`}
              >
                <p className="font-bold text-forest-900">Mode 3: On-Demand Pickup</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Target pickup time (Canteen mode)</p>
              </div>
            </div>
          </div>

          {/* Digital Menu Items */}
          {mode !== 'table_only' && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-forest-900 text-lg flex items-center justify-between">
                <span>Interactive Digital Menu</span>
                <span className="text-xs font-semibold text-slate-500">Half & Full portion pricing available</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {menuItems.map((item) => (
                  <div key={item._id} className="bg-white rounded-3xl p-4 shadow-sm border border-sand-200 flex flex-col justify-between space-y-3">
                    <div className="flex gap-3">
                      <img src={item.image} alt={item.name} className="w-20 h-20 rounded-2xl object-cover shrink-0" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${item.isVeg ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          <h4 className="font-bold text-forest-900 text-sm">{item.name}</h4>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1">{item.description}</p>
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
                            className="bg-sand-100 hover:bg-sand-200 text-forest-900 font-bold px-3 py-1.5 rounded-xl transition-all text-xs"
                          >
                            + Half
                          </button>
                        )}
                        <button
                          onClick={() => handleAddToCart(item, 'full')}
                          className="gradient-orange-btn text-white font-bold px-3 py-1.5 rounded-xl shadow transition-all text-xs"
                        >
                          + Add Full
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-sand-200 bg-sand-50 font-semibold text-slate-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Time Slot</label>
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-sand-200 bg-sand-50 font-semibold text-slate-800"
                >
                  <option value="01:00 PM">01:00 PM (Lunch)</option>
                  <option value="02:00 PM">02:00 PM (Lunch)</option>
                  <option value="07:30 PM">07:30 PM (Dinner)</option>
                  <option value="08:30 PM">08:30 PM (Dinner)</option>
                  <option value="09:30 PM">09:30 PM (Dinner)</option>
                </select>
              </div>

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
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Special Table / Dining Request</label>
              <input
                type="text"
                placeholder="e.g. Quiet corner table, high chair"
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
              <div className="text-center text-slate-400 py-6 text-xs italic">
                {mode === 'table_only' ? 'Table-only reservation selected. Order food at table!' : 'Cart is empty. Click "+ Add" on menu dishes.'}
              </div>
            )}

            {/* Bill breakdown */}
            <div className="space-y-1.5 text-xs text-slate-600 pt-3 border-t border-sand-200">
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
                <span className="text-terracotta-600">₹{grandTotal > 0 ? grandTotal : 100}</span>
              </div>
            </div>

            <button
              onClick={handleInitiateBooking}
              className="w-full gradient-orange-btn text-white font-bold py-3.5 rounded-2xl shadow-lg hover:shadow-xl transition-all text-sm flex items-center justify-center gap-2"
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
      />

    </div>
  );
}
