import React, { useState, useEffect } from 'react';
import {
  Utensils, Calendar, Clock, Users, ShieldCheck, MapPin, ChevronLeft,
  Plus, Minus, ShoppingBag, CheckCircle2, AlertCircle, Sparkles, MessageSquare, Search, Filter
} from 'lucide-react';
import { getRestaurantByIdApi, createBookingApi } from '../services/api';
import CashfreeCheckoutModal from '../components/CashfreeCheckoutModal';
import DigitalReceiptModal from '../components/DigitalReceiptModal';

export default function RestaurantDetailPage({ restaurantId, onBack, user, onOpenAuth }) {
  const getTodayString = () => new Date().toISOString().split('T')[0];
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('table_and_food'); // 'table_and_food', 'table_only', 'canteen_preorder'
  const [bookingDate, setBookingDate] = useState(getTodayString());
  const [timeSlot, setTimeSlot] = useState('07:30 PM');
  const [guestCount, setGuestCount] = useState(2);
  const [specialRequests, setSpecialRequests] = useState('');
  
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
          
          {/* Mode Info Banner (Manual Workflow Choice Removed as requested) */}
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
            <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-[#14382B] text-base flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-[#14382B]" /> Table Reservation & Pre-Order Menu
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Reserve your table and pre-order your favorite dishes ahead to enjoy zero wait time upon arrival.
                </p>
              </div>
              <span className="bg-[#14382B] text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow whitespace-nowrap">
                Table + Food
              </span>
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
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`w-2.5 h-2.5 rounded-full ${item.isVeg ? 'bg-emerald-500' : 'bg-red-500'}`} />
                              <h4 className="font-bold text-forest-900 text-sm">{item.name}</h4>
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
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-sand-200 bg-sand-50 font-semibold text-slate-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">{mode === 'canteen_preorder' ? 'Pickup Time' : 'Time Slot'}</label>
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
