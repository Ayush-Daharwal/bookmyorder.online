import React, { useState, useEffect } from 'react';
import {
  Store, ShieldCheck, CheckCircle2, FileCheck, ChefHat, Plus, Trash2,
  Clock, Users, AlertCircle, Sparkles, RefreshCw, Send, Utensils
} from 'lucide-react';
import {
  registerRestaurantApi, getMyRestaurantApi, saveMenuItemApi,
  getMenuByRestaurantApi, deleteMenuItemApi, getKdsOrdersApi,
  updateOrderStatusApi, createWalkInBookingApi
} from '../services/api';

export default function ProviderPortal({ user, onOpenAuth }) {
  const [activeTab, setActiveTab] = useState('kds'); // 'onboarding', 'kds', 'menu'
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [kdsOrders, setKdsOrders] = useState([]);
  const [kdsBookings, setKdsBookings] = useState([]);
  const [demandList, setDemandList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Form State for Onboarding Wizard
  const [formData, setFormData] = useState({
    name: 'The Spice House & Bistro',
    tagline: 'Authentic North Indian & Continental Fine Dining',
    tier: 'premium',
    city: 'Bhopal',
    address: 'MP Nagar Zone 2, Near DB Mall, Bhopal, MP',
    avgCostForTwo: 900,
    seatingTables: 16,
    seatingSeats: 64,
    managerName: 'Rajesh Sharma',
    managerPhone: '9826012345',
    aadharNumber: '4532-8901-2345',
    fssaiNumber: '11223344556677',
    gstin: '23AAAAA0000A1Z5',
    fdaNumber: 'FDA-MP-89712',
    isAadharVerified: true,
  });

  // Form State for Menu Item
  const [menuForm, setMenuForm] = useState({
    name: 'Paneer Butter Masala',
    description: 'Rich cottage cheese cooked in creamy tomato butter gravy',
    category: 'Main Course',
    isVeg: true,
    containsEgg: false,
    defaultPrice: 280,
    halfPrice: 160,
    fullPrice: 280,
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=400',
  });

  // Form State for Walk-In
  const [walkInForm, setWalkInForm] = useState({
    guestName: 'Walk-in Guest',
    guestPhone: '9988776655',
    guestCount: 2,
    tableNumber: 'T-05',
  });

  useEffect(() => {
    if (user) {
      fetchMyRestaurant();
    }
  }, [user]);

  const fetchMyRestaurant = async () => {
    setLoading(true);
    try {
      const res = await getMyRestaurantApi();
      if (res.data.restaurant) {
        setRestaurant(res.data.restaurant);
        fetchMenu(res.data.restaurant._id);
        fetchKDS(res.data.restaurant._id);
      }
    } catch (err) {
      // Restaurant not registered yet -> show onboarding tab
      setActiveTab('onboarding');
    } finally {
      setLoading(false);
    }
  };

  const fetchMenu = async (restaurantId) => {
    try {
      const res = await getMenuByRestaurantApi(restaurantId);
      setMenuItems(res.data.menuItems || []);
    } catch (err) {
      console.error('Menu load error:', err);
    }
  };

  const fetchKDS = async (restaurantId) => {
    try {
      const res = await getKdsOrdersApi(restaurantId);
      setKdsOrders(res.data.orders || []);
      setKdsBookings(res.data.bookings || []);
      setDemandList(res.data.aggregatedDemand || []);
    } catch (err) {
      console.error('KDS load error:', err);
    }
  };

  const handleRegisterRestaurant = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        seatingCapacity: {
          totalTables: parseInt(formData.seatingTables),
          totalSeats: parseInt(formData.seatingSeats),
        },
        managerDetails: {
          name: formData.managerName,
          phone: formData.managerPhone,
          aadharNumber: formData.aadharNumber,
        },
        licenses: {
          fssaiNumber: formData.fssaiNumber,
          gstin: formData.gstin,
          fdaNumber: formData.fdaNumber,
          isVerified: true,
        },
      };
      const res = await registerRestaurantApi(payload);
      setRestaurant(res.data.restaurant);
      setMessage('Restaurant verified & onboarded successfully!');
      setActiveTab('kds');
      fetchKDS(res.data.restaurant._id);
    } catch (err) {
      alert(err.response?.data?.message || 'Onboarding failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMenuItem = async (e) => {
    e.preventDefault();
    if (!restaurant) return alert('Register restaurant first');
    try {
      await saveMenuItemApi({
        restaurantId: restaurant._id,
        name: menuForm.name,
        description: menuForm.description,
        category: menuForm.category,
        isVeg: menuForm.isVeg,
        containsEgg: menuForm.containsEgg,
        pricing: {
          default: parseFloat(menuForm.defaultPrice),
          half: parseFloat(menuForm.halfPrice),
          full: parseFloat(menuForm.fullPrice),
        },
        image: menuForm.image,
      });
      fetchMenu(restaurant._id);
      setMenuForm({
        name: '',
        description: '',
        category: 'Main Course',
        isVeg: true,
        containsEgg: false,
        defaultPrice: 200,
        halfPrice: 120,
        fullPrice: 200,
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400',
      });
      setMessage('Menu item added!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save item');
    }
  };

  const handleDeleteItem = async (id) => {
    if (!confirm('Delete menu item?')) return;
    try {
      await deleteMenuItemApi(id);
      fetchMenu(restaurant._id);
    } catch (err) {
      alert('Delete failed');
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await updateOrderStatusApi(orderId, newStatus);
      fetchKDS(restaurant._id);
    } catch (err) {
      alert('Status update failed');
    }
  };

  const handleWalkIn = async (e) => {
    e.preventDefault();
    if (!restaurant) return;
    try {
      await createWalkInBookingApi({
        restaurantId: restaurant._id,
        ...walkInForm,
      });
      alert('Walk-in booking created!');
      fetchKDS(restaurant._id);
    } catch (err) {
      alert('Walk-in creation failed');
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-3xl shadow-xl border border-sand-200 text-center">
        <Store className="w-12 h-12 text-terracotta-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-forest-900 mb-2">Partner POS & KDS Portal</h2>
        <p className="text-sm text-slate-600 mb-6">
          Please sign in to register your restaurant tier, manage live kitchen orders, or configure digital menus.
        </p>
        <button
          onClick={onOpenAuth}
          className="w-full gradient-orange-btn text-white font-bold py-3 rounded-2xl shadow hover:shadow-lg transition-all text-sm"
        >
          Sign In as Restaurant Partner
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header Banner */}
      <div className="bg-forest-900 text-white rounded-3xl p-6 sm:p-8 mb-8 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-forest-800">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-terracotta-500 text-white px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider">
              {restaurant ? `${restaurant.tier} Tier Partner` : 'Partner Registration'}
            </span>
            <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" />
              Verified Status
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {restaurant ? restaurant.name : 'Register Your Restaurant & Skip The Queue'}
          </h1>
          <p className="text-sand-200 text-xs sm:text-sm mt-1">
            {restaurant ? restaurant.tagline : 'Setup Aadhar verification, FSSAI licenses, seating capacity & KDS dashboard'}
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 bg-forest-800 p-1.5 rounded-2xl border border-forest-700">
          <button
            onClick={() => setActiveTab('kds')}
            disabled={!restaurant}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'kds' ? 'bg-terracotta-500 text-white shadow' : 'text-sand-200 hover:text-white'
            }`}
          >
            Live KDS & POS
          </button>

          <button
            onClick={() => setActiveTab('menu')}
            disabled={!restaurant}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'menu' ? 'bg-terracotta-500 text-white shadow' : 'text-sand-200 hover:text-white'
            }`}
          >
            Digital Menu Editor
          </button>

          <button
            onClick={() => setActiveTab('onboarding')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'onboarding' ? 'bg-terracotta-500 text-white shadow' : 'text-sand-200 hover:text-white'
            }`}
          >
            Partner Setup
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-6 p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          {message}
        </div>
      )}

      {/* TAB 1: KDS & LIVE ORDERS */}
      {activeTab === 'kds' && restaurant && (
        <div className="space-y-8">
          
          {/* Kitchen Demand Summary Bar */}
          <div className="bg-white rounded-3xl p-6 shadow-md border border-sand-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ChefHat className="w-6 h-6 text-terracotta-500" />
                <h3 className="font-bold text-forest-900 text-lg">Kitchen Aggregate Item Demand</h3>
              </div>
              <button
                onClick={() => fetchKDS(restaurant._id)}
                className="text-xs font-bold text-terracotta-500 hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh Feed
              </button>
            </div>

            {demandList.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {demandList.map((item, idx) => (
                  <div key={idx} className="bg-sand-50 p-4 rounded-2xl border border-sand-200">
                    <p className="text-xs text-slate-500 font-semibold">{item.item}</p>
                    <p className="text-2xl font-extrabold text-forest-800 mt-1">{item.totalQuantity} <span className="text-xs font-semibold text-slate-500">units needed</span></p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No active kitchen preparation queue. Incoming pre-orders will aggregate here.</p>
            )}
          </div>

          {/* Grid Layout: Live Order KDS Stream & Walk-In Station */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Live Orders Stream (2 cols) */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-bold text-forest-900 text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-terracotta-500" />
                Live Order Stream & Preparation Board
              </h3>

              {kdsOrders.length > 0 ? (
                kdsOrders.map((order) => (
                  <div key={order._id} className="bg-white rounded-2xl p-5 shadow-sm border border-sand-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between border-b border-sand-200 pb-3 mb-3">
                      <div>
                        <span className="text-xs font-extrabold bg-sand-100 text-forest-800 px-3 py-1 rounded-full border border-sand-200">
                          {order.orderId}
                        </span>
                        <span className="ml-3 text-xs text-slate-500">
                          Customer: <strong>{order.userId?.name || 'Diner'}</strong> ({order.userId?.phone || 'N/A'})
                        </span>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                        order.status === 'received' ? 'bg-amber-100 text-amber-800' :
                        order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'ready' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-2 mb-4">
                      {order.items.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs sm:text-sm">
                          <span className="font-semibold text-slate-800">
                            {it.quantity}x {it.name} ({it.portion})
                            {it.customNote && <span className="block text-[11px] text-terracotta-600 italic">Note: "{it.customNote}"</span>}
                          </span>
                          <span className="font-bold text-slate-700">₹{it.price * it.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-sand-200 text-xs">
                      <span className="font-extrabold text-forest-900 text-base">Total Paid: ₹{order.totalAmount}</span>
                      
                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        {order.status === 'received' && (
                          <button
                            onClick={() => handleUpdateStatus(order._id, 'preparing')}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-xl shadow transition-all"
                          >
                            Start Preparing
                          </button>
                        )}
                        {order.status === 'preparing' && (
                          <button
                            onClick={() => handleUpdateStatus(order._id, 'ready')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl shadow transition-all"
                          >
                            Mark Ready
                          </button>
                        )}
                        {order.status === 'ready' && (
                          <button
                            onClick={() => handleUpdateStatus(order._id, 'served')}
                            className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-3 py-1.5 rounded-xl shadow transition-all"
                          >
                            Mark Served
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-2xl p-8 text-center border border-sand-200 text-slate-500">
                  No active orders right now. New customer bookings will stream live here.
                </div>
              )}
            </div>

            {/* Walk-in POS Terminal (1 col) */}
            <div className="bg-white rounded-3xl p-6 shadow-md border border-sand-200 h-fit">
              <h3 className="font-bold text-forest-900 text-base mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-terracotta-500" />
                Staff POS: Quick Walk-in Entry
              </h3>

              <form onSubmit={handleWalkIn} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Guest Name</label>
                  <input
                    type="text"
                    required
                    value={walkInForm.guestName}
                    onChange={(e) => setWalkInForm({ ...walkInForm, guestName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-sand-200 bg-sand-50"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={walkInForm.guestPhone}
                    onChange={(e) => setWalkInForm({ ...walkInForm, guestPhone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-sand-200 bg-sand-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Guests</label>
                    <input
                      type="number"
                      required
                      value={walkInForm.guestCount}
                      onChange={(e) => setWalkInForm({ ...walkInForm, guestCount: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-sand-200 bg-sand-50"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Assigned Table</label>
                    <input
                      type="text"
                      required
                      value={walkInForm.tableNumber}
                      onChange={(e) => setWalkInForm({ ...walkInForm, tableNumber: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-sand-200 bg-sand-50"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-forest-800 hover:bg-forest-700 text-white font-bold py-3 rounded-xl shadow transition-all"
                >
                  Confirm Walk-In Seating
                </button>
              </form>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: DIGITAL MENU EDITOR */}
      {activeTab === 'menu' && restaurant && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Add Item Form */}
          <div className="bg-white rounded-3xl p-6 shadow-md border border-sand-200 h-fit">
            <h3 className="font-bold text-forest-900 text-base mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-terracotta-500" />
              Add Digital Menu Item
            </h3>

            <form onSubmit={handleAddMenuItem} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Item Dish Name</label>
                <input
                  type="text"
                  required
                  value={menuForm.name}
                  onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-sand-200 bg-sand-50"
                  placeholder="e.g. Dal Makhani"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Category</label>
                <input
                  type="text"
                  required
                  value={menuForm.category}
                  onChange={(e) => setMenuForm({ ...menuForm, category: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-sand-200 bg-sand-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Half Price (₹)</label>
                  <input
                    type="number"
                    value={menuForm.halfPrice}
                    onChange={(e) => setMenuForm({ ...menuForm, halfPrice: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-sand-200 bg-sand-50"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={menuForm.fullPrice}
                    onChange={(e) => setMenuForm({ ...menuForm, fullPrice: e.target.value, defaultPrice: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-sand-200 bg-sand-50"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    checked={menuForm.isVeg}
                    onChange={(e) => setMenuForm({ ...menuForm, isVeg: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-0"
                  />
                  Pure Veg 🟢
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    checked={menuForm.containsEgg}
                    onChange={(e) => setMenuForm({ ...menuForm, containsEgg: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-0"
                  />
                  Contains Egg 🟡
                </label>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Short Description</label>
                <textarea
                  rows={2}
                  value={menuForm.description}
                  onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-sand-200 bg-sand-50"
                />
              </div>

              <button
                type="submit"
                className="w-full gradient-orange-btn text-white font-bold py-3 rounded-xl shadow transition-all"
              >
                Publish Dish to Menu
              </button>
            </form>
          </div>

          {/* Current Menu List */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-bold text-forest-900 text-lg">Active Digital Menu ({menuItems.length} Dishes)</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {menuItems.map((item) => (
                <div key={item._id} className="bg-white rounded-2xl p-4 shadow-sm border border-sand-200 flex gap-4 items-center">
                  <img src={item.image} alt={item.name} className="w-20 h-20 rounded-xl object-cover" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${item.isVeg ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <h4 className="font-bold text-forest-900 text-sm">{item.name}</h4>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1">{item.description}</p>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="font-extrabold text-terracotta-600">
                        Full: ₹{item.pricing?.full || item.pricing?.default} {item.pricing?.half ? `| Half: ₹${item.pricing.half}` : ''}
                      </span>
                      <button
                        onClick={() => handleDeleteItem(item._id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: ONBOARDING WIZARD */}
      {activeTab === 'onboarding' && (
        <div className="max-w-3xl mx-auto bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-sand-200">
          <h2 className="text-xl font-extrabold text-forest-900 mb-6 flex items-center gap-2 border-b border-sand-200 pb-4">
            <FileCheck className="w-6 h-6 text-terracotta-500" />
            Restaurant Partner Onboarding & Verification Wizard
          </h2>

          <form onSubmit={handleRegisterRestaurant} className="space-y-6 text-xs sm:text-sm">
            
            {/* Tier Selection */}
            <div>
              <label className="block font-bold text-slate-800 mb-2">Select Restaurant Operating Tier</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { id: 'premium', label: 'Premium Restaurant', desc: 'Table + Food Prebook & Walk-ins' },
                  { id: 'mid', label: 'Mid-Level Bistro', desc: 'Pre-order Food with Pickup/Dine time' },
                  { id: 'canteen', label: 'College Canteen', desc: 'Batch Kitchen Demand Forecasting' },
                ].map((tier) => (
                  <div
                    key={tier.id}
                    onClick={() => setFormData({ ...formData, tier: tier.id })}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      formData.tier === tier.id
                        ? 'border-terracotta-500 bg-terracotta-500/5 ring-2 ring-terracotta-500/20'
                        : 'border-sand-200 hover:border-slate-300'
                    }`}
                  >
                    <p className="font-bold text-forest-900">{tier.label}</p>
                    <p className="text-xs text-slate-500 mt-1">{tier.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Restaurant Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 rounded-xl border border-sand-200 bg-sand-50"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full p-3 rounded-xl border border-sand-200 bg-sand-50"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Full Physical Address</label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full p-3 rounded-xl border border-sand-200 bg-sand-50"
              />
            </div>

            {/* Aadhar & License Simulator */}
            <div className="bg-sand-50 p-5 rounded-2xl border border-sand-200 space-y-4">
              <h4 className="font-bold text-forest-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Owner & Manager Aadhar KYC + FSSAI Verification
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Manager / Owner Name</label>
                  <input
                    type="text"
                    required
                    value={formData.managerName}
                    onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-sand-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Aadhar Card Number</label>
                  <input
                    type="text"
                    required
                    value={formData.aadharNumber}
                    onChange={(e) => setFormData({ ...formData, aadharNumber: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-sand-200 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">FSSAI License No.</label>
                  <input
                    type="text"
                    required
                    value={formData.fssaiNumber}
                    onChange={(e) => setFormData({ ...formData, fssaiNumber: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-sand-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    required
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-sand-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">FDA Approval No.</label>
                  <input
                    type="text"
                    required
                    value={formData.fdaNumber}
                    onChange={(e) => setFormData({ ...formData, fdaNumber: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-sand-200 bg-white"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full gradient-orange-btn text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all text-base"
            >
              {loading ? 'Verifying & Onboarding...' : 'Complete Verification & Publish Partner Store'}
            </button>

          </form>
        </div>
      )}

    </div>
  );
}
