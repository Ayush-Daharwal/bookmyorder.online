import React, { useState, useEffect } from 'react';
import {
  Store, ShieldCheck, CheckCircle2, TrendingUp, Users, DollarSign,
  Clock, ArrowRight, Building, Mail, Phone, Lock, Camera, Sparkles,
  BarChart2, PieChart as PieChartIcon, Activity, AlertCircle, Plus, Trash2,
  ChefHat, Utensils, RefreshCw, Send, Check
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import RestaurantRegistrationModal from '../components/RestaurantRegistrationModal';
import {
  partnerLoginApi, getMyRestaurantApi, saveMenuItemApi,
  getMenuByRestaurantApi, deleteMenuItemApi, getKdsOrdersApi,
  updateOrderStatusApi, createWalkInBookingApi, getPartnerAnalyticsApi
} from '../services/api';

export default function ProviderPortal({ user, onOpenAuth }) {
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Submitted Application State
  const [submittedApp, setSubmittedApp] = useState(null);

  // Analytics Interactive Demo Selector State
  const [analyticsView, setAnalyticsView] = useState('revenue'); // 'revenue', 'mom', 'peak', 'margins'
  const [dbAnalytics, setDbAnalytics] = useState(null);

  // Dashboard state for signed-in partner
  const [partnerUser, setPartnerUser] = useState(user);
  const [restaurant, setRestaurant] = useState(null);
  const [activeDashTab, setActiveDashTab] = useState('kds'); // 'kds', 'menu', 'walkin'
  const [menuItems, setMenuItems] = useState([]);
  const [kdsOrders, setKdsOrders] = useState([]);
  const [kdsBookings, setKdsBookings] = useState([]);
  const [demandList, setDemandList] = useState([]);
  const [dashLoading, setDashLoading] = useState(false);
  const [dashMessage, setDashMessage] = useState('');

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
    // Check saved submitted application in localStorage
    const savedApp = localStorage.getItem('bmo_submitted_application');
    if (savedApp) {
      try {
        setSubmittedApp(JSON.parse(savedApp));
      } catch (e) {}
    }

    fetchRealAnalytics();

    if (user && (user.role === 'provider' || user.role === 'admin')) {
      fetchMyRestaurant();
    }
  }, [user]);

  const fetchRealAnalytics = async () => {
    try {
      const res = await getPartnerAnalyticsApi();
      if (res.data.analytics) {
        setDbAnalytics(res.data.analytics);
      }
    } catch (err) {
      console.error('Real analytics fetch error:', err);
    }
  };

  const fetchMyRestaurant = async () => {
    setDashLoading(true);
    try {
      const res = await getMyRestaurantApi();
      if (res.data.restaurant) {
        setRestaurant(res.data.restaurant);
        fetchMenu(res.data.restaurant._id);
        fetchKDS(res.data.restaurant._id);
      }
    } catch (err) {
      console.log('No restaurant attached to current user');
    } finally {
      setDashLoading(false);
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

  // Partner Login Handler
  const handlePartnerLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const res = await partnerLoginApi({ email: loginEmail, password: loginPassword });
      if (res.data.success) {
        localStorage.setItem('bmo_token', res.data.token);
        setPartnerUser(res.data.user);
        setRestaurant(res.data.restaurant);
        setIsLoginModalOpen(false);
        if (res.data.restaurant) {
          fetchMenu(res.data.restaurant._id);
          fetchKDS(res.data.restaurant._id);
        }
      }
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Partner login failed. Please check your email and password.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Walk-In Booking Creation
  const handleCreateWalkIn = async (e) => {
    e.preventDefault();
    if (!restaurant) return alert('No registered restaurant found');
    try {
      await createWalkInBookingApi({
        restaurantId: restaurant._id,
        guestName: walkInForm.guestName,
        guestPhone: walkInForm.guestPhone,
        guestCount: walkInForm.guestCount,
        tableNumber: walkInForm.tableNumber,
      });
      setDashMessage('Walk-in guest seated successfully!');
      fetchKDS(restaurant._id);
    } catch (err) {
      alert(err.response?.data?.message || 'Walk-in creation failed');
    }
  };

  // Save Menu Item
  const handleSaveMenuItem = async (e) => {
    e.preventDefault();
    if (!restaurant) return alert('No registered restaurant found');
    try {
      await saveMenuItemApi({
        restaurantId: restaurant._id,
        name: menuForm.name,
        description: menuForm.description,
        category: menuForm.category,
        isVeg: menuForm.isVeg,
        containsEgg: menuForm.containsEgg,
        pricing: {
          default: parseInt(menuForm.defaultPrice),
          half: parseInt(menuForm.halfPrice),
          full: parseInt(menuForm.fullPrice),
        },
        image: menuForm.image,
      });
      setDashMessage('Menu item saved successfully!');
      fetchMenu(restaurant._id);
    } catch (err) {
      alert(err.response?.data?.message || 'Save menu item failed');
    }
  };

  // Real Database Analytics Data or Fallback Datasets
  const revenueChartData = dbAnalytics?.revenueByDay || [
    { day: 'Day 1', revenue: 12500, orders: 42, occupancy: '65%' },
    { day: 'Day 5', revenue: 18900, orders: 58, occupancy: '78%' },
    { day: 'Day 10', revenue: 24500, orders: 74, occupancy: '84%' },
    { day: 'Day 15', revenue: 31000, orders: 92, occupancy: '91%' },
    { day: 'Day 20', revenue: 39800, orders: 115, occupancy: '96%' },
    { day: 'Day 25', revenue: 46200, orders: 138, occupancy: '98%' },
    { day: 'Day 30', revenue: 58000, orders: 165, occupancy: '100%' },
  ];

  const momChartData = dbAnalytics?.momChartData || [
    { month: 'Month 1', revenue: 180000, growth: '+15%' },
    { month: 'Month 2', revenue: 240000, growth: '+33%' },
    { month: 'Month 3', revenue: 320000, growth: '+33%' },
    { month: 'Month 4', revenue: 450000, growth: '+40%' },
    { month: 'Month 5', revenue: 620000, growth: '+37%' },
    { month: 'Month 6', revenue: 840000, growth: '+35%' },
  ];

  const peakOccupancyData = dbAnalytics?.peakOccupancyData || [
    { hour: '12 PM', dineIn: 45, preOrders: 20 },
    { hour: '02 PM', dineIn: 60, preOrders: 35 },
    { hour: '04 PM', dineIn: 25, preOrders: 15 },
    { hour: '07 PM', dineIn: 95, preOrders: 70 },
    { hour: '09 PM', dineIn: 98, preOrders: 85 },
    { hour: '11 PM', dineIn: 30, preOrders: 15 },
  ];

  const marginsData = dbAnalytics?.marginsData || [
    { name: 'Food & Beverage Subtotal', value: 68, color: '#14382B' },
    { name: 'Restaurant Net Margin', value: 24, color: '#2E6B4E' },
    { name: 'Platform Service Fee', value: 5, color: '#FF5722' },
    { name: 'Taxes & Levies (5% GST)', value: 3, color: '#F59E0B' },
  ];

  // Nearby Joined Bhopal Partner Restaurants
  const nearbyBhopalPartners = [
    {
      name: 'Sagar Gaire Fast Food & Restaurant',
      area: 'MP Nagar Zone 2, Bhopal',
      joined: 'Joined 8 months ago',
      metric: '+52% Footfall Growth',
      badge: 'Casual & Premium Partner',
      img: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=400',
    },
    {
      name: 'Manohar Dairy & Restaurant',
      area: 'Hamidia Road & MP Nagar, Bhopal',
      joined: 'Joined 1 year ago',
      metric: '2.4x Online Pre-Orders',
      badge: 'Casual & Premium Partner',
      img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=400',
    },
    {
      name: 'Royal Chef Fine Dining',
      area: 'Arera Colony, Bhopal',
      joined: 'Joined 6 months ago',
      metric: '94% Table Occupancy',
      badge: 'Luxury Fine Dining Partner',
      img: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&q=80&w=400',
    },
    {
      name: 'Indian Coffee House',
      area: 'New Market, Bhopal',
      joined: 'Joined 5 months ago',
      metric: '+300 Daily Pre-Orders',
      badge: 'Casual & Premium Partner',
      img: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&q=80&w=400',
    },
    {
      name: 'Green Villa Garden Restaurant',
      area: 'Bawadiya Kalan, Bhopal',
      joined: 'Joined 4 months ago',
      metric: 'Zero Waiting Queue',
      badge: 'Luxury Fine Dining Partner',
      img: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&q=80&w=400',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-slate-800 antialiased pb-16">
      
      {/* RESTAURANT REGISTRATION MODAL */}
      <RestaurantRegistrationModal
        isOpen={isRegModalOpen}
        onClose={() => {
          setIsRegModalOpen(false);
          const savedApp = localStorage.getItem('bmo_submitted_application');
          if (savedApp) {
            try {
              setSubmittedApp(JSON.parse(savedApp));
            } catch (e) {}
          }
        }}
        onSuccess={(app) => {
          setSubmittedApp(app);
          fetchMyRestaurant();
        }}
      />

      {/* PARTNER LOGIN MODAL */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-sand-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900">Partner Dashboard Sign In</h3>
                <p className="text-xs text-slate-500">Log in with your registered restaurant email & password.</p>
              </div>
              <button
                onClick={() => setIsLoginModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {loginError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handlePartnerLoginSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Restaurant Registered Email</label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="manager@restaurant.com"
                  className="w-full px-4 py-3 rounded-xl border border-sand-300 focus:outline-none focus:ring-2 focus:ring-forest-800 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Account Password</label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-sand-300 focus:outline-none focus:ring-2 focus:ring-forest-800 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3.5 rounded-xl bg-forest-900 hover:bg-forest-950 text-white font-extrabold text-sm shadow-md transition-all cursor-pointer"
              >
                {loginLoading ? 'Authenticating...' : 'Sign In to Partner Dashboard'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ACTIVE SUBMITTED APPLICATION UNDER REVIEW SCREEN */}
      {submittedApp && !restaurant ? (
        <div className="max-w-3xl mx-auto my-12 bg-white rounded-3xl p-8 border border-emerald-200 shadow-xl space-y-6 text-center animate-in fade-in">
          <div className="w-20 h-20 mx-auto bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center border-4 border-emerald-200 shadow-md">
            <ShieldCheck className="w-10 h-10 text-emerald-700" />
          </div>

          <div>
            <span className="bg-amber-100 text-amber-900 font-extrabold text-xs px-3.5 py-1 rounded-full border border-amber-200">
              Status: Pending Admin Approval
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-3">
              Application Applied Successfully & Under Review
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-lg mx-auto">
              Your registration application for <strong className="text-slate-900">{submittedApp.restaurantName}</strong> is undergoing verification by BookMyOrder Admin in Bhopal.
            </p>
          </div>

          <div className="bg-sand-50 rounded-2xl p-5 text-left text-xs border border-sand-200 space-y-2">
            <p className="font-extrabold text-forest-900 border-b border-sand-200 pb-1.5 text-sm">Submitted Application Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700 pt-1">
              <p>Manager Name: <strong className="text-slate-900">{submittedApp.managerName}</strong></p>
              <p>Hotline Phone: <strong className="text-slate-900">{submittedApp.managerPhone}</strong></p>
              <p>Notification Email: <strong className="text-slate-900">{submittedApp.email}</strong></p>
              <p>City & Location: <strong className="text-slate-900">{submittedApp.address}, {submittedApp.city}</strong></p>
              <p>Category: <strong className="text-slate-900 capitalize">{submittedApp.category}</strong></p>
              <p>Food Type: <strong className="text-slate-900">{submittedApp.foodType}</strong></p>
            </div>
          </div>

          <p className="text-xs text-slate-500 italic">
            📩 Once approved by admin, you will receive an Email and SMS notification at <strong>{submittedApp.email}</strong> and can log in directly to your partner dashboard!
          </p>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              onClick={() => {
                localStorage.removeItem('bmo_submitted_application');
                setSubmittedApp(null);
              }}
              className="px-5 py-2.5 rounded-xl border border-sand-300 hover:bg-sand-100 text-slate-700 font-bold text-xs cursor-pointer"
            >
              Submit Another Application
            </button>
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="px-6 py-2.5 rounded-xl bg-forest-900 hover:bg-forest-950 text-white font-extrabold text-xs shadow-md cursor-pointer"
            >
              Sign In to Partner Dashboard
            </button>
          </div>
        </div>
      ) : restaurant ? (

        /* IF RESTAURANT IS APPROVED & SIGNED IN: RENDER LIVE PARTNER POS & KDS DASHBOARD */
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          
          {/* Dashboard Top Header */}
          <div className="bg-forest-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-emerald-500/20 text-emerald-300 text-xs font-extrabold px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Approved Partner POS & KDS Active
                </span>
                <span className="bg-terracotta-500/20 text-terracotta-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  City: {restaurant.city || 'Bhopal'}
                </span>
              </div>
              <h1 className="text-3xl font-black text-white">{restaurant.name}</h1>
              <p className="text-xs text-sand-300 mt-1 max-w-xl">
                {restaurant.address} | Tier: <strong className="text-emerald-400 capitalize">{restaurant.tier}</strong>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchKDS(restaurant._id)}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" /> Refresh KDS
              </button>
            </div>
          </div>

          {/* Navigation Tabs for Partner Dashboard */}
          <div className="flex gap-2 border-b border-sand-200 pb-2">
            <button
              onClick={() => setActiveDashTab('kds')}
              className={`px-5 py-2.5 rounded-full font-bold text-xs transition-all flex items-center gap-2 ${
                activeDashTab === 'kds'
                  ? 'bg-forest-900 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-sand-100 border border-sand-200'
              }`}
            >
              <ChefHat className="w-4 h-4 text-emerald-400" /> Kitchen Display System (KDS Feed)
            </button>
            <button
              onClick={() => setActiveDashTab('walkin')}
              className={`px-5 py-2.5 rounded-full font-bold text-xs transition-all flex items-center gap-2 ${
                activeDashTab === 'walkin'
                  ? 'bg-forest-900 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-sand-100 border border-sand-200'
              }`}
            >
              <Users className="w-4 h-4 text-terracotta-500" /> Walk-In Table Booking (Tablet POS)
            </button>
            <button
              onClick={() => setActiveDashTab('menu')}
              className={`px-5 py-2.5 rounded-full font-bold text-xs transition-all flex items-center gap-2 ${
                activeDashTab === 'menu'
                  ? 'bg-forest-900 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-sand-100 border border-sand-200'
              }`}
            >
              <Utensils className="w-4 h-4 text-amber-500" /> Manage Digital Menu
            </button>
          </div>

          {/* Dashboard Tab Content */}
          {activeDashTab === 'kds' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Live Kitchen Orders Feed */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-black text-slate-900">Live Kitchen Orders ({kdsOrders.length})</h3>
                  <span className="text-xs font-bold text-slate-500">Real-time Ticket Stream</span>
                </div>

                {kdsOrders.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center border border-sand-200 text-slate-500 text-xs">
                    No active kitchen orders at the moment.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {kdsOrders.map((order) => (
                      <div key={order._id} className="bg-white rounded-2xl p-5 border border-sand-200 shadow-sm space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-mono font-extrabold text-forest-900 text-sm">#{order.orderId}</span>
                            <p className="text-xs text-slate-500">Customer: {order.userId?.name || 'Guest Diner'}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-extrabold capitalize ${
                            order.status === 'ready'
                              ? 'bg-emerald-100 text-emerald-800'
                              : order.status === 'preparing'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-sky-100 text-sky-800'
                          }`}>
                            {order.status}
                          </span>
                        </div>

                        <div className="bg-sand-50 rounded-xl p-3 space-y-1 text-xs">
                          {order.items?.map((it, idx) => (
                            <div key={idx} className="flex justify-between text-slate-800 font-semibold">
                              <span>{it.quantity}x {it.name} ({it.portion})</span>
                              <span>₹{it.price * it.quantity}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-between items-center text-xs pt-1">
                          <span className="font-extrabold text-slate-900">Total: ₹{order.totalAmount}</span>
                          <div className="flex gap-2">
                            <button
                              onClick={async () => {
                                await updateOrderStatusApi(order._id, 'preparing');
                                fetchKDS(restaurant._id);
                              }}
                              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] cursor-pointer"
                            >
                              Start Prep
                            </button>
                            <button
                              onClick={async () => {
                                await updateOrderStatusApi(order._id, 'ready');
                                fetchKDS(restaurant._id);
                              }}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] cursor-pointer"
                            >
                              Mark Ready
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Aggregated Kitchen Item Demand */}
              <div className="space-y-4">
                <h3 className="text-lg font-black text-slate-900">Aggregated Item Demand</h3>
                <div className="bg-white rounded-2xl p-5 border border-sand-200 shadow-sm space-y-3">
                  {demandList.length === 0 ? (
                    <p className="text-xs text-slate-400">No active prep demand.</p>
                  ) : (
                    demandList.map((d, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2.5 bg-sand-50 rounded-xl text-xs">
                        <span className="font-bold text-slate-800">{d.item}</span>
                        <span className="px-2.5 py-1 bg-forest-900 text-white font-extrabold rounded-lg">
                          x{d.totalQuantity}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* Walk-in Booking Tool */}
          {activeDashTab === 'walkin' && (
            <div className="max-w-xl mx-auto bg-white rounded-3xl p-6 border border-sand-200 shadow-sm space-y-4">
              <h3 className="text-lg font-black text-slate-900">Create Walk-In Table Reservation</h3>
              <form onSubmit={handleCreateWalkIn} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Guest Name</label>
                  <input
                    type="text"
                    value={walkInForm.guestName}
                    onChange={(e) => setWalkInForm({ ...walkInForm, guestName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-sand-300"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Guest Count</label>
                    <input
                      type="number"
                      value={walkInForm.guestCount}
                      onChange={(e) => setWalkInForm({ ...walkInForm, guestCount: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-sand-300"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Assigned Table No.</label>
                    <input
                      type="text"
                      value={walkInForm.tableNumber}
                      onChange={(e) => setWalkInForm({ ...walkInForm, tableNumber: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-sand-300 font-bold"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-forest-900 text-white font-extrabold rounded-xl shadow-md cursor-pointer"
                >
                  Seat Walk-In Guest Now
                </button>
              </form>
            </div>
          )}

          {/* Menu Management */}
          {activeDashTab === 'menu' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-sand-200 shadow-sm">
                <h3 className="text-lg font-black text-slate-900 mb-4">Add Menu Item</h3>
                <form onSubmit={handleSaveMenuItem} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <input
                    type="text"
                    placeholder="Item Name"
                    value={menuForm.name}
                    onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                    className="px-4 py-2.5 rounded-xl border border-sand-300"
                  />
                  <input
                    type="text"
                    placeholder="Category"
                    value={menuForm.category}
                    onChange={(e) => setMenuForm({ ...menuForm, category: e.target.value })}
                    className="px-4 py-2.5 rounded-xl border border-sand-300"
                  />
                  <input
                    type="number"
                    placeholder="Price (₹)"
                    value={menuForm.defaultPrice}
                    onChange={(e) => setMenuForm({ ...menuForm, defaultPrice: e.target.value, fullPrice: e.target.value })}
                    className="px-4 py-2.5 rounded-xl border border-sand-300"
                  />
                  <button
                    type="submit"
                    className="sm:col-span-3 py-3 bg-forest-900 text-white font-bold rounded-xl cursor-pointer"
                  >
                    Save Dish to Menu
                  </button>
                </form>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {menuItems.map((m) => (
                  <div key={m._id} className="bg-white rounded-2xl p-4 border border-sand-200 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-extrabold text-slate-900">{m.name}</p>
                      <p className="text-slate-500">₹{m.pricing?.default || m.pricing?.full}</p>
                    </div>
                    <button
                      onClick={async () => {
                        await deleteMenuItemApi(m._id);
                        fetchMenu(restaurant._id);
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-xl cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      ) : (

        /* PUBLIC BOOKMYORDER PARTNER POS & KDS B2B HUB LANDING PAGE */
        <div className="space-y-16">
          
          {/* HERO SECTION */}
          <div className="relative bg-forest-900 text-white overflow-hidden py-16 sm:py-24">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              
              {/* Top Banner Badge */}
              <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-4 py-1.5 rounded-full border border-emerald-500/30 text-xs font-extrabold uppercase tracking-wider mb-6">
                <Sparkles className="w-4 h-4 text-emerald-400" /> BookMyOrder Partner POS & KDS Hub
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight text-white">
                    Supercharge Your Restaurant Growth & Footfall in Bhopal
                  </h1>
                  <p className="text-sm sm:text-base text-sand-300 leading-relaxed max-w-xl">
                    Partner POS & KDS is your all-in-one restaurant growth engine. Eliminate dining queue friction, accept online food pre-orders, and gain instant visual business analytics.
                  </p>

                  <div className="flex flex-wrap items-center gap-4 pt-2">
                    {localStorage.getItem('bmo_restaurant_reg_draft') ? (
                      <button
                        onClick={() => setIsRegModalOpen(true)}
                        className="px-8 py-4 rounded-2xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-sm shadow-xl hover:scale-105 transition-all cursor-pointer flex items-center gap-2 border-2 border-amber-300"
                      >
                        <Sparkles className="w-5 h-5 text-slate-950" />
                        <span>Continue Saved Application (Resume Step)</span>
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsRegModalOpen(true)}
                        className="px-8 py-4 rounded-2xl bg-terracotta-500 hover:bg-terracotta-600 text-white font-black text-sm shadow-xl shadow-terracotta-500/30 hover:scale-105 transition-all cursor-pointer flex items-center gap-2"
                      >
                        <span>Register as Restaurant with Us</span>
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    )}

                    <button
                      onClick={() => setIsLoginModalOpen(true)}
                      className="px-6 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-sm border border-white/20 transition-all cursor-pointer"
                    >
                      Already Joined? Sign In
                    </button>
                  </div>
                </div>

                {/* Hero Visual Card / Metric Preview */}
                <div className="relative bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 shadow-2xl space-y-4">
                  <div className="flex justify-between items-center border-b border-white/10 pb-3">
                    <span className="text-xs font-extrabold text-emerald-400 flex items-center gap-1.5">
                      <Activity className="w-4 h-4" /> Live Partner Growth Dashboard Preview
                    </span>
                    <span className="text-[10px] bg-emerald-400/20 text-emerald-300 px-2.5 py-0.5 rounded-full font-bold">
                      City: Bhopal
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-white">
                    <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10">
                      <p className="text-[10px] text-sand-300 font-bold uppercase">Monthly Footfall</p>
                      <p className="text-2xl font-black text-emerald-400">+48.5%</p>
                    </div>
                    <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10">
                      <p className="text-[10px] text-sand-300 font-bold uppercase">Net Revenue Surge</p>
                      <p className="text-2xl font-black text-terracotta-400">2.6x</p>
                    </div>
                  </div>

                  <div className="h-44 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueChartData.slice(0, 5)}>
                        <defs>
                          <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2E6B4E" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#2E6B4E" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#heroGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

            </div>
          </div>

          {/* KEY BUSINESS BENEFITS & NUMBERS */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-2 mb-10">
              <h2 className="text-3xl font-black text-slate-900">Why Top Bhopal Restaurants Join Us</h2>
              <p className="text-xs text-slate-500 max-w-lg mx-auto">
                Real business impact delivered from Day 1 with our zero-friction dining engine.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="bg-white rounded-3xl p-6 border border-sand-200 shadow-sm hover:shadow-md transition-all space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
                  <TrendingUp className="w-6 h-6 text-emerald-700" />
                </div>
                <h3 className="text-2xl font-black text-forest-900">+45% Footfall</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Attract high-intent diners looking for guaranteed table seats without waiting in queues.
                </p>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-sand-200 shadow-sm hover:shadow-md transition-all space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
                  <DollarSign className="w-6 h-6 text-amber-700" />
                </div>
                <h3 className="text-2xl font-black text-forest-900">2.4x Revenue</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Customers pre-order food dishes while booking tables, driving up average order value.
                </p>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-sand-200 shadow-sm hover:shadow-md transition-all space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-800 flex items-center justify-center font-black">
                  <Clock className="w-6 h-6 text-sky-700" />
                </div>
                <h3 className="text-2xl font-black text-forest-900">0 Mins Delays</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Kitchen Display System (KDS) streams orders straight to chefs as guests arrive.
                </p>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-sand-200 shadow-sm hover:shadow-md transition-all space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-black">
                  <BarChart2 className="w-6 h-6 text-indigo-700" />
                </div>
                <h3 className="text-2xl font-black text-forest-900">100% Automated</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Ready-made visual business analytics generated automatically. No manual tracking needed.
                </p>
              </div>

            </div>
          </div>

          {/* INTERACTIVE VISUAL ANALYTICS DEMO */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-3xl p-8 border border-sand-200 shadow-xl space-y-6">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-sand-200 pb-6">
                <div>
                  <span className="text-xs font-extrabold text-terracotta-600 uppercase tracking-wider">
                    Interactive Visual Analytics Demo
                  </span>
                  <h3 className="text-2xl font-black text-slate-900">
                    See How Effortless Your Analytics Will Look
                  </h3>
                  <p className="text-xs text-slate-500">
                    Graphical insights updated live from database records for your restaurant upon registration.
                  </p>
                </div>

                {/* Interactive View Toggles */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setAnalyticsView('revenue')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      analyticsView === 'revenue'
                        ? 'bg-forest-900 text-white shadow'
                        : 'bg-sand-100 text-slate-700 hover:bg-sand-200'
                    }`}
                  >
                    Everyday Revenue & Growth
                  </button>
                  <button
                    onClick={() => setAnalyticsView('mom')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      analyticsView === 'mom'
                        ? 'bg-forest-900 text-white shadow'
                        : 'bg-sand-100 text-slate-700 hover:bg-sand-200'
                    }`}
                  >
                    Month-on-Month Growth
                  </button>
                  <button
                    onClick={() => setAnalyticsView('peak')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      analyticsView === 'peak'
                        ? 'bg-forest-900 text-white shadow'
                        : 'bg-sand-100 text-slate-700 hover:bg-sand-200'
                    }`}
                  >
                    Peak Hour Occupancy
                  </button>
                  <button
                    onClick={() => setAnalyticsView('margins')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      analyticsView === 'margins'
                        ? 'bg-forest-900 text-white shadow'
                        : 'bg-sand-100 text-slate-700 hover:bg-sand-200'
                    }`}
                  >
                    Margins & Revenue Breakdown
                  </button>
                </div>
              </div>

              {/* Chart Display Area */}
              <div className="h-80 w-full pt-2">
                {analyticsView === 'revenue' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="#14382B" fill="#2E6B4E" fillOpacity={0.2} strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}

                {analyticsView === 'mom' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={momChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="revenue" name="Monthly Sales (₹)" fill="#FF5722" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}

                {analyticsView === 'peak' && (
                  <div className="space-y-3 h-full flex flex-col justify-between">
                    <div className="flex flex-wrap items-center justify-center gap-4 bg-sand-50 p-2.5 rounded-2xl border border-sand-200 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 rounded bg-[#14382B] inline-block shadow-sm"></span>
                        <span className="font-extrabold text-[#14382B]">🌲 Dark Green Bar: Seated Table Dine-In Occupancy Count</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 rounded bg-[#F59E0B] inline-block shadow-sm"></span>
                        <span className="font-extrabold text-amber-700">⭐ Golden Yellow Bar: Pre-Ordered Food Dishes Count</span>
                      </div>
                    </div>

                    <ResponsiveContainer width="100%" height="75%">
                      <BarChart data={peakOccupancyData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                        <Bar dataKey="dineIn" name="Seated Table Occupancy (Count)" fill="#14382B" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="preOrders" name="Pre-Ordered Food Dishes (Count)" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <p className="text-[11px] text-slate-600 text-center font-medium bg-amber-50/80 p-2 rounded-xl border border-amber-200">
                      💡 <strong>Graph Key Explanation:</strong> The <strong>Dark Green bar</strong> tracks seated table reservations at that hour, while the <strong>Golden Yellow bar</strong> tracks advance food orders pre-booked for that hour.
                    </p>
                  </div>
                )}

                {analyticsView === 'margins' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={marginsData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={95}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {marginsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

            </div>
          </div>

          {/* NEARBY JOINED BHOPAL PARTNER RESTAURANTS */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-xs font-extrabold text-forest-800 uppercase tracking-wider">
                  Bhopal Partner Network
                </span>
                <h2 className="text-2xl font-black text-slate-900">
                  Nearby Restaurants Already Joined With Us
                </h2>
              </div>
              <button
                onClick={() => setIsRegModalOpen(true)}
                className="hidden sm:inline-flex items-center gap-1 text-xs font-extrabold text-terracotta-600 hover:underline cursor-pointer"
              >
                Join Them Today →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {nearbyBhopalPartners.map((partner, idx) => (
                <div key={idx} className="bg-white rounded-3xl overflow-hidden border border-sand-200 shadow-sm hover:shadow-md transition-all group">
                  <div className="relative h-44 overflow-hidden">
                    <img src={partner.img} alt={partner.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute top-3 left-3 bg-forest-900/90 text-white text-[10px] font-bold px-3 py-1 rounded-full backdrop-blur-md">
                      {partner.badge}
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <h3 className="font-extrabold text-slate-900 text-sm leading-snug">{partner.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-slate-400" /> {partner.area}
                    </p>

                    <div className="flex justify-between items-center pt-2 border-t border-sand-100 text-xs">
                      <span className="text-slate-400 font-medium text-[11px]">{partner.joined}</span>
                      <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {partner.metric}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RESTAURANT CATEGORIES OVERVIEW */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-slate-900">Supported Restaurant Operational Types</h2>
              <p className="text-xs text-slate-500">Choose the category that best matches your venue model in Bhopal.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="bg-white rounded-3xl p-6 border-2 border-forest-800 shadow-md space-y-3">
                <span className="bg-forest-100 text-forest-900 font-extrabold text-xs px-3 py-1 rounded-full inline-block">
                  Type 1: Luxury Fine Dining
                </span>
                <h3 className="text-lg font-black text-slate-900">Mandatory Table Reservation</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Ideal for premium fine-dining establishments where table booking is mandatory before pre-ordering food dishes.
                </p>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-sand-200 shadow-sm space-y-3">
                <span className="bg-amber-100 text-amber-900 font-extrabold text-xs px-3 py-1 rounded-full inline-block">
                  Type 2: Casual & Premium
                </span>
                <h3 className="text-lg font-black text-slate-900">Optional Table Booking</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  No table reservation necessary, but guests can choose to pre-book a table in advance alongside pre-ordering food.
                </p>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-sand-200 shadow-sm space-y-3">
                <span className="bg-emerald-100 text-emerald-900 font-extrabold text-xs px-3 py-1 rounded-full inline-block">
                  Type 3: Canteen & Food Stall
                </span>
                <h3 className="text-lg font-black text-slate-900">Direct Food Ordering</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Designed for small outlets, college canteens & food stalls with zero table reservation needed; direct food pickup and ordering.
                </p>
              </div>

            </div>
          </div>

          {/* CHECKLIST OF WHAT YOU NEED TO REGISTER */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-3xl p-8 border border-sand-200 shadow-lg space-y-6">
              <div>
                <span className="text-xs font-extrabold text-terracotta-600 uppercase tracking-wider">
                  Registration Preparation
                </span>
                <h2 className="text-2xl font-black text-slate-900">
                  What You Need to Register With Us
                </h2>
                <p className="text-xs text-slate-500">
                  Keep these details ready before clicking the registration button.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div className="p-3.5 bg-sand-50 rounded-2xl border border-sand-200 flex items-center gap-3">
                  <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>1. All-time manager location access</span>
                </div>
                <div className="p-3.5 bg-sand-50 rounded-2xl border border-sand-200 flex items-center gap-3">
                  <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>2. Dedicated Hotline Phone Number for Customer Queries & Direct Support</span>
                </div>
                <div className="p-3.5 bg-sand-50 rounded-2xl border border-sand-200 flex items-center gap-3">
                  <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>3. Email ID & Account Password</span>
                </div>
                <div className="p-3.5 bg-sand-50 rounded-2xl border border-sand-200 flex items-center gap-3">
                  <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>4. Restaurant Name & City (Fixed: Bhopal)</span>
                </div>
                <div className="p-3.5 bg-sand-50 rounded-2xl border border-sand-200 flex items-center gap-3">
                  <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>5. Type: Pure Veg, Pure Non-Veg, Veg & Non-Veg</span>
                </div>
                <div className="p-3.5 bg-sand-50 rounded-2xl border border-sand-200 flex items-center gap-3">
                  <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>6. GSTIN Number (Optional)</span>
                </div>
                <div className="p-3.5 bg-sand-50 rounded-2xl border border-sand-200 flex items-center gap-3">
                  <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>7. Exact Location (Locked after admin approval)</span>
                </div>
                <div className="p-3.5 bg-sand-50 rounded-2xl border border-sand-200 flex items-center gap-3">
                  <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>8. FSSAI Number & License Image (Optional)</span>
                </div>
                <div className="p-3.5 bg-sand-50 rounded-2xl border border-sand-200 flex items-center gap-3">
                  <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>9. FDA Approval Number (Optional)</span>
                </div>
                <div className="p-3.5 bg-sand-50 rounded-2xl border border-sand-200 flex items-center gap-3">
                  <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>10. Owner's Aadhaar Number</span>
                </div>
                <div className="p-3.5 bg-sand-50 rounded-2xl border border-sand-200 flex items-center gap-3 sm:col-span-2">
                  <Camera className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>11. 6 Photos (1 Banner Upload + 5 Direct Live Camera Photos: Front, Table Seating, Kitchen, Served Food, Menu)</span>
                </div>
              </div>

              <div className="pt-4 text-center">
                <button
                  onClick={() => setIsRegModalOpen(true)}
                  className="px-10 py-4 rounded-2xl bg-forest-900 hover:bg-forest-950 text-white font-black text-sm shadow-xl hover:scale-105 transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <span>Register as Restaurant with Us Now</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

            </div>
          </div>

          {/* CONTACT TEAM BOOKMYORDER.ONLINE */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-forest-900 text-white rounded-3xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
              <div className="space-y-2">
                <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">
                  Partner Support
                </span>
                <h3 className="text-2xl font-black text-white">Have Questions or Need Onboarding Help?</h3>
                <p className="text-xs text-sand-300">
                  Our dedicated restaurant support team in Bhopal is here to assist you 24/7.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center space-y-2 shrink-0">
                <p className="text-xs text-sand-300 font-bold">Official Partner Support Email:</p>
                <a
                  href="mailto:bookmyorder.online@gmail.com"
                  className="block text-sm font-black text-emerald-400 hover:underline"
                >
                  bookmyorder.online@gmail.com
                </a>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
