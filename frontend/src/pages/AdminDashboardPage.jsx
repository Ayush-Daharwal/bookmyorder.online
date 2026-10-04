import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, TrendingUp, DollarSign, Users, Store, Star, CheckCircle2,
  XCircle, Trash2, Activity, Calendar, Layers, Sparkles, AlertCircle, ArrowUpRight,
  Settings, Clock, Server, Database, CreditCard, ChevronRight, Award, Flame, Navigation, Plus, Edit3, Send
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  getAdminMetricsApi,
  getAdminRestaurantsApi,
  togglePromoteRestaurantApi,
  updateRestaurantStatusApi,
  deleteRestaurantApi,
  getAdminReviewsApi,
  deleteAdminReviewApi,
  getAdminUsersApi,
  getPendingApplicationsApi,
  approveRestaurantApplicationApi,
  rejectRestaurantApplicationApi,
  getPlatformSettingsApi,
  updatePlatformSettingsApi,
  getPlatformExpensesApi,
  addPlatformExpenseApi,
} from '../services/api';

export default function AdminDashboardPage({ adminUser, onLogout }) {
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics', 'transactions', 'owner_analytics', 'restaurants', 'applications', 'users_reviews', 'settings_expenses'
  const [metrics, setMetrics] = useState(null);
  const [charts, setCharts] = useState(null);
  const [perRestaurantStats, setPerRestaurantStats] = useState([]);
  const [earnedTransactionsLog, setEarnedTransactionsLog] = useState([]);
  const [allTransactionsLog, setAllTransactionsLog] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [applications, setApplications] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  // Settings & Expense Edit Forms
  const [editGst, setEditGst] = useState(5);
  const [editFeeDefault, setEditFeeDefault] = useState(15);
  const [editFeePremium, setEditFeePremium] = useState(25);
  const [editFeeCanteen, setEditFeeCanteen] = useState(10);
  const [savingSettings, setSavingSettings] = useState(false);

  const [expServer, setExpServer] = useState(12000);
  const [expDb, setExpDb] = useState(4500);
  const [expGateway, setExpGateway] = useState(3200);
  const [expMarketing, setExpMarketing] = useState(8500);
  const [savingExpense, setSavingExpense] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [metricsRes, restRes, appRes, revRes, userRes, setRes, expRes] = await Promise.all([
        getAdminMetricsApi(),
        getAdminRestaurantsApi(),
        getPendingApplicationsApi(),
        getAdminReviewsApi(),
        getAdminUsersApi(),
        getPlatformSettingsApi(),
        getPlatformExpensesApi(),
      ]);

      setMetrics(metricsRes.data.metrics);
      setCharts(metricsRes.data.charts);
      setPerRestaurantStats(metricsRes.data.perRestaurantStats || []);
      setEarnedTransactionsLog(metricsRes.data.earnedTransactionsLog || []);
      setAllTransactionsLog(metricsRes.data.allTransactionsLog || []);
      setRestaurants(restRes.data.restaurants || []);
      setApplications(appRes.data.applications || []);
      setReviews(revRes.data.reviews || []);
      setUsers(userRes.data.users || []);

      if (setRes.data.settings) {
        setSettings(setRes.data.settings);
        setEditGst(setRes.data.settings.gstPercent || 5);
        setEditFeeDefault(setRes.data.settings.platformFeeDefault || 15);
        setEditFeePremium(setRes.data.settings.platformFeePremium || 25);
        setEditFeeCanteen(setRes.data.settings.platformFeeCanteen || 10);
      }

      if (expRes.data.expenses) {
        setExpenses(expRes.data.expenses || []);
        if (expRes.data.expenses[0]) {
          setExpServer(expRes.data.expenses[0].serverCost || 12000);
          setExpDb(expRes.data.expenses[0].databaseCost || 4500);
          setExpGateway(expRes.data.expenses[0].gatewayCost || 3200);
          setExpMarketing(expRes.data.expenses[0].marketingCost || 8500);
        }
      }
    } catch (err) {
      console.error('Admin data load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePromote = async (id) => {
    try {
      const res = await togglePromoteRestaurantApi(id);
      setActionMsg(res.data.message || 'Promotion status updated');
      setTimeout(() => setActionMsg(''), 4000);
      fetchAdminData();
    } catch (err) {
      alert('Failed to update promotion status');
    }
  };

  const handleToggleStatus = async (restaurantId, currentVerified) => {
    try {
      await updateRestaurantStatusApi(restaurantId, {
        isVerified: !currentVerified,
        isActive: !currentVerified,
      });
      fetchAdminData();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleDeleteRestaurant = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove "${name}" from the platform?`)) return;
    try {
      const res = await deleteRestaurantApi(id);
      setActionMsg(res.data.message || 'Restaurant removed from platform');
      setTimeout(() => setActionMsg(''), 4000);
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove restaurant');
    }
  };

  const handleApproveApplication = async (appId) => {
    try {
      const res = await approveRestaurantApplicationApi(appId);
      setActionMsg(res.data.message || 'Restaurant application approved!');
      setTimeout(() => setActionMsg(''), 4000);
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.message || 'Approve application failed');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await deleteAdminReviewApi(reviewId);
      fetchAdminData();
    } catch (err) {
      alert('Failed to delete review');
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await updatePlatformSettingsApi({
        gstPercent: editGst,
        platformFeeDefault: editFeeDefault,
        platformFeePremium: editFeePremium,
        platformFeeCanteen: editFeeCanteen,
      });
      setActionMsg(res.data.message || 'Settings saved');
      setTimeout(() => setActionMsg(''), 4000);
      fetchAdminData();
    } catch (err) {
      alert('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    setSavingExpense(true);
    try {
      const res = await addPlatformExpenseApi({
        serverCost: expServer,
        databaseCost: expDb,
        gatewayCost: expGateway,
        marketingCost: expMarketing,
      });
      setActionMsg(res.data.message || 'Platform expenses saved');
      setTimeout(() => setActionMsg(''), 4000);
      fetchAdminData();
    } catch (err) {
      alert('Failed to save expenses');
    } finally {
      setSavingExpense(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#14382B] border-t-transparent" />
        <p className="font-extrabold text-slate-800 text-sm">Loading Super Admin Operations & Real DB Analytics Suite...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Super Admin Control Header */}
      <div className="bg-[#14382B] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-4 z-10">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-[#FF5722] font-black border border-white/20 shadow-inner">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold px-3 py-0.5 rounded-full border border-emerald-500/30 uppercase tracking-widest">
                Super Admin Authenticated
              </span>
              <span className="bg-amber-400/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Real DB Live Data
              </span>
            </div>
            <h1 className="text-3xl font-black text-white mt-1">Super Admin Operations & Control Hub</h1>
            <p className="text-xs text-sand-200 mt-0.5">
              Logged in as <strong className="text-white">{adminUser?.name || 'Super Admin'}</strong> ({adminUser?.email})
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="bg-red-600/90 hover:bg-red-600 text-white px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all border border-red-400 shadow-md cursor-pointer z-10 shrink-0"
        >
          Exit Admin Console
        </button>
      </div>

      {/* Global Notification Banner */}
      {actionMsg && (
        <div className="bg-emerald-600 text-white px-6 py-3 rounded-2xl text-xs font-bold shadow-md flex items-center justify-between animate-in fade-in">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {actionMsg}
          </span>
          <button onClick={() => setActionMsg('')} className="text-white hover:underline text-[11px] font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Admin Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-sand-200 pb-3 text-xs font-extrabold overflow-x-auto">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-5 py-2.5 rounded-2xl transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'bg-[#14382B] text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-sand-100 border border-sand-200'
          }`}
        >
          <Activity className="w-4 h-4 text-emerald-400" />
          Overview & Financials
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-5 py-2.5 rounded-2xl transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'transactions'
              ? 'bg-[#14382B] text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-sand-100 border border-sand-200'
          }`}
        >
          <DollarSign className="w-4 h-4 text-terracotta-400" />
          Fee & Transaction Logs ({allTransactionsLog.length})
        </button>

        <button
          onClick={() => setActiveTab('owner_analytics')}
          className={`px-5 py-2.5 rounded-2xl transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'owner_analytics'
              ? 'bg-[#14382B] text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-sand-100 border border-sand-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          Top 10 Owner Analytics
        </button>

        <button
          onClick={() => setActiveTab('restaurants')}
          className={`px-5 py-2.5 rounded-2xl transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'restaurants'
              ? 'bg-[#14382B] text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-sand-100 border border-sand-200'
          }`}
        >
          <Store className="w-4 h-4 text-sky-400" />
          Restaurant Directory ({restaurants.length})
        </button>

        <button
          onClick={() => setActiveTab('applications')}
          className={`px-5 py-2.5 rounded-2xl transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'applications'
              ? 'bg-[#14382B] text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-sand-100 border border-sand-200'
          }`}
        >
          <Layers className="w-4 h-4 text-amber-400" />
          Pending Partner Applications ({applications.filter((a) => a.status === 'pending').length})
        </button>

        <button
          onClick={() => setActiveTab('users_reviews')}
          className={`px-5 py-2.5 rounded-2xl transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'users_reviews'
              ? 'bg-[#14382B] text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-sand-100 border border-sand-200'
          }`}
        >
          <Users className="w-4 h-4 text-purple-400" />
          Users ({users.length}) & Reviews ({reviews.length})
        </button>

        <button
          onClick={() => setActiveTab('settings_expenses')}
          className={`px-5 py-2.5 rounded-2xl transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'settings_expenses'
              ? 'bg-[#14382B] text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-sand-100 border border-sand-200'
          }`}
        >
          <Settings className="w-4 h-4 text-rose-400" />
          GST, Fee & Expenses
        </button>
      </div>

      {/* ========================================== */}
      {/* TAB 1: OVERVIEW & FINANCIALS */}
      {/* ========================================== */}
      {activeTab === 'analytics' && metrics && (
        <div className="space-y-8">
          
          {/* Top 4 Financial Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-sand-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-bold uppercase">Total Platform Revenue</span>
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-3xl font-black text-forest-900">₹{metrics.totalPlatformEarnedRevenue || 0}</p>
              <p className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Direct Fee & Commission Earned
              </p>
            </div>

            <div className="bg-white rounded-3xl p-5 shadow-sm border border-sand-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-bold uppercase">Monthly Platform Expenses</span>
                <Server className="w-5 h-5 text-rose-600" />
              </div>
              <p className="text-3xl font-black text-slate-900">₹{metrics.expenses?.totalMonthlyExpenses || 0}</p>
              <p className="text-[11px] text-slate-500 font-medium">Server, DB, Gateway & Marketing</p>
            </div>

            <div className="bg-white rounded-3xl p-5 shadow-sm border border-sand-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-bold uppercase">Net Platform Profit</span>
                <Award className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-3xl font-black text-emerald-800">
                ₹{metrics.expenses?.netProfitMonthly || 0}
              </p>
              <p className="text-[11px] text-emerald-700 font-bold">Revenue Minus Monthly Costs</p>
            </div>

            <div className="bg-white rounded-3xl p-5 shadow-sm border border-sand-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-bold uppercase">Total Gross Order Volume</span>
                <TrendingUp className="w-5 h-5 text-terracotta-500" />
              </div>
              <p className="text-3xl font-black text-forest-900">₹{metrics.totalGrossRevenue || 0}</p>
              <p className="text-[11px] text-slate-500 font-medium">Across all food orders & tables</p>
            </div>
          </div>

          {/* AOV & Conversion Funnel Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Average Order Value (AOV) Breakdown */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-sand-200 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-sand-200 pb-3">
                <h3 className="font-extrabold text-forest-900 text-base">Average Order Value (AOV) Breakdown</h3>
                <span className="text-[10px] font-bold bg-sand-100 text-slate-700 px-2.5 py-1 rounded-full border border-sand-200">
                  By Restaurant Tier
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-sand-50 p-3.5 rounded-2xl border border-sand-200 text-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Luxury Fine Dining</p>
                  <p className="text-xl font-black text-forest-900 mt-1">₹{metrics.aov?.luxuryAov}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">High ticket</p>
                </div>

                <div className="bg-sand-50 p-3.5 rounded-2xl border border-sand-200 text-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Mid-Level Bistros</p>
                  <p className="text-xl font-black text-forest-900 mt-1">₹{metrics.aov?.midAov}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Casual meals</p>
                </div>

                <div className="bg-sand-50 p-3.5 rounded-2xl border border-sand-200 text-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Campus Canteens</p>
                  <p className="text-xl font-black text-forest-900 mt-1">₹{metrics.aov?.canteenAov}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Quick bites</p>
                </div>

                <div className="bg-sand-50 p-3.5 rounded-2xl border border-sand-200 text-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Overall Platform AOV</p>
                  <p className="text-xl font-black text-[#D84315] mt-1">₹{metrics.aov?.overallAov}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Avg per txn</p>
                </div>
              </div>

              <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200 flex items-center justify-between">
                <span className="font-bold text-emerald-950">Average Platform Fee Earned Per Txn</span>
                <span className="text-lg font-black text-emerald-800">₹{metrics.aov?.avgPlatformEarnedPerTxn} / order</span>
              </div>
            </div>

            {/* Daily Diner Conversion Funnel */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-sand-200 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-sand-200 pb-3">
                <h3 className="font-extrabold text-forest-900 text-base">Platform Diner Conversion Funnel</h3>
                <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
                  {metrics.funnel?.funnelConversionRate}% Conversion
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-sand-50 rounded-2xl border border-sand-200">
                  <div>
                    <p className="font-bold text-slate-800 text-xs">1. Daily Landed Diners (Traffic)</p>
                    <p className="text-[10px] text-slate-500">Unique visitors exploring venues</p>
                  </div>
                  <span className="text-lg font-black text-forest-900">{metrics.funnel?.landingDinersDaily}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-sand-50 rounded-2xl border border-sand-200">
                  <div>
                    <p className="font-bold text-slate-800 text-xs">2. Registered Account Diners</p>
                    <p className="text-[10px] text-slate-500">Signed up customer accounts</p>
                  </div>
                  <span className="text-lg font-black text-forest-900">{metrics.funnel?.registeredDinersCount}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <div>
                    <p className="font-extrabold text-emerald-950 text-xs">3. Active Paying Diners</p>
                    <p className="text-[10px] text-emerald-700 font-medium">Completed table bookings & pre-orders</p>
                  </div>
                  <span className="text-xl font-black text-emerald-800">{metrics.funnel?.orderingDinersCount}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Monthly Revenue vs Expenses Recharts Graph */}
          {charts?.monthlyRevenueVsExpensesChart && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-sand-200 space-y-4">
              <h3 className="font-extrabold text-forest-900 text-base">Monthly Platform Revenue vs Expenses & Net Profit Trend</h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.monthlyRevenueVsExpensesChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0EBE1" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fontWeight: 'bold' }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" name="Platform Revenue (₹)" fill="#14382B" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="expenses" name="Monthly Costs (₹)" fill="#E53935" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="netProfit" name="Net Profit (₹)" fill="#FF5722" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================== */}
      {/* TAB 2: FEE & TRANSACTION LOGS */}
      {/* ========================================== */}
      {activeTab === 'transactions' && metrics && (
        <div className="space-y-8 text-xs">
          
          {/* Summary Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-sand-200 shadow-sm">
              <p className="text-slate-400 font-bold uppercase text-[10px]">Earned Platform Transactions</p>
              <p className="text-3xl font-black text-emerald-700 mt-1">{metrics.earnedTransactionsCount}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Transactions with platform fee & GST</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-sand-200 shadow-sm">
              <p className="text-slate-400 font-bold uppercase text-[10px]">Zero-Fee Transactions</p>
              <p className="text-3xl font-black text-slate-700 mt-1">{metrics.zeroFeeTransactionsCount}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Direct walk-ins or zero fee orders</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-sand-200 shadow-sm">
              <p className="text-slate-400 font-bold uppercase text-[10px]">Total Platform Earnings</p>
              <p className="text-3xl font-black text-[#D84315] mt-1">₹{metrics.totalPlatformEarnedRevenue}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Real revenue deposited</p>
            </div>
          </div>

          {/* Restaurant Earnings & Weekdays vs Weekends Breakdown */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-sand-200 space-y-4">
            <h3 className="font-extrabold text-forest-900 text-base border-b border-sand-200 pb-3">
              Per-Restaurant Revenue & Platform Earnings Breakdown
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-sand-200 text-slate-400 uppercase text-[10px] font-bold">
                    <th className="py-3 px-2">Restaurant Name</th>
                    <th className="py-3 px-2">Tier & City</th>
                    <th className="py-3 px-2 text-right">Gross Order Volume</th>
                    <th className="py-3 px-2 text-right">Platform Fee Earned</th>
                    <th className="py-3 px-2 text-center">Paid Txns (Earned vs Free)</th>
                    <th className="py-3 px-2 text-right">Weekdays vs Weekends</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-100 font-medium">
                  {perRestaurantStats.map((r) => (
                    <tr key={r._id} className="hover:bg-sand-50 transition-colors">
                      <td className="py-3 px-2 font-bold text-slate-900">{r.name}</td>
                      <td className="py-3 px-2">
                        <span className="capitalize font-semibold text-slate-600">{r.tier}</span> • {r.city}
                      </td>
                      <td className="py-3 px-2 text-right font-extrabold text-slate-900">₹{r.grossRevenue}</td>
                      <td className="py-3 px-2 text-right font-black text-emerald-700">₹{r.platformFeeEarned}</td>
                      <td className="py-3 px-2 text-center">
                        <span className="font-bold text-emerald-800">{r.earnedTxns} earned</span> / <span className="text-slate-400">{r.zeroFeeTxns} free</span>
                      </td>
                      <td className="py-3 px-2 text-right text-[11px]">
                        <span className="text-slate-600">Wkday: ₹{r.weekdayRevenue}</span> • <strong className="text-terracotta-600">Wkend: ₹{r.weekendRevenue}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Full Transaction Log */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-sand-200 space-y-4">
            <h3 className="font-extrabold text-forest-900 text-base border-b border-sand-200 pb-3">
              Live Platform Transaction Ledger (Paid Orders & Bookings)
            </h3>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-sand-200 text-slate-400 uppercase text-[10px] font-bold sticky top-0 bg-white">
                    <th className="py-3 px-2">Txn ID / Type</th>
                    <th className="py-3 px-2">Restaurant</th>
                    <th className="py-3 px-2 text-right">Total Amount</th>
                    <th className="py-3 px-2 text-right">Platform Fee Earned</th>
                    <th className="py-3 px-2">Payment Method</th>
                    <th className="py-3 px-2 text-right">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-100">
                  {allTransactionsLog.map((t, idx) => (
                    <tr key={idx} className="hover:bg-sand-50 transition-colors">
                      <td className="py-3 px-2 font-mono font-bold text-slate-900">
                        {t.id} <span className="block text-[10px] text-slate-400 font-sans">{t.type}</span>
                      </td>
                      <td className="py-3 px-2 font-bold text-slate-800">{t.restaurantName}</td>
                      <td className="py-3 px-2 text-right font-bold text-slate-900">₹{t.totalAmount}</td>
                      <td className="py-3 px-2 text-right font-black text-emerald-700">₹{t.platformFee}</td>
                      <td className="py-3 px-2 font-semibold text-slate-600">{t.paymentMethod}</td>
                      <td className="py-3 px-2 text-right text-slate-500 font-medium">
                        {new Date(t.createdAt).toLocaleDateString()} {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================== */}
      {/* TAB 3: TOP 10 OWNER ANALYTICS */}
      {/* ========================================== */}
      {activeTab === 'owner_analytics' && charts && (
        <div className="space-y-8 text-xs">
          
          <div className="bg-[#14382B] text-white p-6 rounded-3xl shadow-md space-y-1">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" /> Top 10 Platform Owner Analytics Suite
            </h2>
            <p className="text-xs text-sand-200">
              Advanced predictive operational insights for platform expansion & diner retention.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Analytics 1: Peak Dining Hours Heatmap */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-sand-200 space-y-4">
              <h4 className="font-extrabold text-forest-900 text-sm">1. Peak Dining & Order Rush Hours (24-Hour Heatmap)</h4>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={charts.peakDiningHoursChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0EBE1" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10, fontWeight: 'bold' }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="volume" name="Orders Volume" stroke="#FF5722" fill="#FF5722" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Analytics 2: Customer Retention Rate */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-sand-200 space-y-4">
              <h4 className="font-extrabold text-forest-900 text-sm">2. Repeat Diner Retention Rate (Month-over-Month %)</h4>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={charts.customerRetentionChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0EBE1" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 'bold' }} />
                    <YAxis domain={[50, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="retention" name="Retention %" stroke="#14382B" fill="#14382B" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Analytics 3: Canteen vs Restaurant Volume Share */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-sand-200 space-y-4">
              <h4 className="font-extrabold text-forest-900 text-sm">3. Canteen vs Luxury Restaurant Order Volume Share</h4>
              <div className="h-60 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={charts.canteenVsRestaurantShare} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label>
                      {charts.canteenVsRestaurantShare.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Analytics 4: Geographic Hotspot Distribution */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-sand-200 space-y-4">
              <h4 className="font-extrabold text-forest-900 text-sm">4. Geographic Hotspot Footfall Distribution (Bhopal Zones)</h4>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.geographicFootfallChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0EBE1" />
                    <XAxis dataKey="zone" tick={{ fontSize: 10, fontWeight: 'bold' }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="footfall" name="Landed Diners" fill="#2E6B4E" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Analytics 5-10 Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-sand-200 space-y-1">
              <h5 className="font-extrabold text-forest-900">5. Instant Table Occupancy Efficiency</h5>
              <p className="text-2xl font-black text-emerald-700">94.2%</p>
              <p className="text-[11px] text-slate-500">Diners arriving within reserved time slots</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-sand-200 space-y-1">
              <h5 className="font-extrabold text-forest-900">6. Gateway Payment Success Rate</h5>
              <p className="text-2xl font-black text-emerald-700">98.6%</p>
              <p className="text-[11px] text-slate-500">Cashfree PG checkout conversion</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-sand-200 space-y-1">
              <h5 className="font-extrabold text-forest-900">7. Order Cancellation Rate</h5>
              <p className="text-2xl font-black text-slate-800">1.2%</p>
              <p className="text-[11px] text-slate-500">Low cancellation & zero-refund impact</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-sand-200 space-y-1">
              <h5 className="font-extrabold text-forest-900">8. Average Queue Time Saved</h5>
              <p className="text-2xl font-black text-terracotta-600">28 Mins</p>
              <p className="text-[11px] text-slate-500">Saved per diner via pre-orders</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-sand-200 space-y-1">
              <h5 className="font-extrabold text-forest-900">9. Customer Lifetime Value (CLV)</h5>
              <p className="text-2xl font-black text-forest-900">₹3,450</p>
              <p className="text-[11px] text-slate-500">Average annual revenue per diner</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-sand-200 space-y-1">
              <h5 className="font-extrabold text-forest-900">10. Promo & Discount ROI</h5>
              <p className="text-2xl font-black text-emerald-700">4.8x</p>
              <p className="text-[11px] text-slate-500">Revenue generated per ₹1 discount</p>
            </div>
          </div>

        </div>
      )}

      {/* ========================================== */}
      {/* TAB 4: RESTAURANT DIRECTORY & MODERATION */}
      {/* ========================================== */}
      {activeTab === 'restaurants' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-sand-200 space-y-6 text-xs">
          <div className="flex items-center justify-between border-b border-sand-200 pb-3">
            <div>
              <h3 className="font-extrabold text-forest-900 text-lg">Registered Restaurants Moderation & Promotion</h3>
              <p className="text-slate-500 text-xs">Promote partners to display at top of search, inspect details, or remove inactive venues.</p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-sand-100 px-3 py-1.5 rounded-full border border-sand-200">
              Total: {restaurants.length} | Promoted: {restaurants.filter((r) => r.isPromoted).length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-sand-200 text-slate-400 uppercase text-[10px] font-bold">
                  <th className="py-3 px-2">Restaurant & Manager</th>
                  <th className="py-3 px-2">Tier & City</th>
                  <th className="py-3 px-2">Licenses (FSSAI / GSTIN)</th>
                  <th className="py-3 px-2 text-center">Top Promoted</th>
                  <th className="py-3 px-2 text-center">Verified & Active</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-100 font-medium">
                {restaurants.map((r) => (
                  <tr key={r._id} className="hover:bg-sand-50 transition-colors">
                    <td className="py-3.5 px-2">
                      <div className="flex items-center gap-2">
                        {r.isPromoted && (
                          <span className="bg-amber-400 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full shadow">
                            ⭐ TOP PROMOTED
                          </span>
                        )}
                        <h4 className="font-extrabold text-slate-900 text-sm">{r.name}</h4>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{r.address}, {r.city}</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                        Manager: {r.managerDetails?.name || r.ownerId?.name || 'Manager'} • Phone: +91 {r.managerDetails?.phone || r.ownerId?.phone || 'N/A'}
                      </p>
                    </td>

                    <td className="py-3.5 px-2">
                      <span className="capitalize font-bold text-slate-800 bg-sand-100 px-2.5 py-1 rounded-lg border border-sand-200">
                        {r.tier}
                      </span>
                    </td>

                    <td className="py-3.5 px-2 text-[11px]">
                      <p className="text-slate-700 font-semibold">FSSAI: {r.licenses?.fssaiNumber || r.fssaiLicenseNumber || 'N/A'}</p>
                      <p className="text-slate-500">GSTIN: {r.licenses?.gstin || r.gstin || 'N/A'}</p>
                    </td>

                    <td className="py-3.5 px-2 text-center">
                      <button
                        onClick={() => handleTogglePromote(r._id)}
                        className={`px-3 py-1.5 rounded-xl font-extrabold text-[11px] transition-all cursor-pointer ${
                          r.isPromoted
                            ? 'bg-amber-400 hover:bg-amber-500 text-slate-950 shadow-md border border-amber-300'
                            : 'bg-sand-100 hover:bg-sand-200 text-slate-700 border border-sand-300'
                        }`}
                      >
                        {r.isPromoted ? '⭐ Promoted (Top)' : '+ Promote to Top'}
                      </button>
                    </td>

                    <td className="py-3.5 px-2 text-center">
                      <button
                        onClick={() => handleToggleStatus(r._id, r.isVerified)}
                        className={`px-3 py-1 rounded-xl font-bold text-xs cursor-pointer ${
                          r.isVerified
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {r.isVerified ? '✔ Active' : '✕ Suspended'}
                      </button>
                    </td>

                    <td className="py-3.5 px-2 text-right">
                      <button
                        onClick={() => handleDeleteRestaurant(r._id, r.name)}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-3 py-1.5 rounded-xl border border-rose-200 cursor-pointer text-xs"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 5: PENDING APPLICATIONS */}
      {/* ========================================== */}
      {activeTab === 'applications' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-sand-200 space-y-6 text-xs">
          <div className="flex items-center justify-between border-b border-sand-200 pb-3">
            <div>
              <h3 className="font-extrabold text-forest-900 text-lg">Pending Partner Registration Applications</h3>
              <p className="text-slate-500 text-xs">Review manager contact, Aadhaar, FSSAI, GSTIN, and 6 live photos before approving.</p>
            </div>
          </div>

          {applications.length > 0 ? (
            <div className="space-y-6">
              {applications.map((app) => (
                <div key={app._id} className="bg-sand-50 rounded-3xl p-6 border border-sand-200 space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-sand-200 pb-4">
                    <div>
                      <span className="text-[10px] font-black text-amber-900 bg-amber-100 px-3 py-1 rounded-full border border-amber-200 uppercase">
                        Status: {app.status}
                      </span>
                      <h4 className="font-extrabold text-slate-900 text-lg mt-1">{app.restaurantName}</h4>
                      <p className="text-xs text-slate-600">{app.address}, {app.city}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApproveApplication(app._id)}
                        className="gradient-orange-btn text-white font-extrabold px-5 py-2.5 rounded-xl shadow text-xs cursor-pointer"
                      >
                        ✔ Approve & Send SMS/Email
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-2xl border border-sand-200">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Manager Details</p>
                      <p className="font-extrabold text-slate-900">{app.managerName}</p>
                      <p className="text-slate-600">+91 {app.managerPhone}</p>
                      <p className="text-slate-600">{app.email}</p>
                    </div>

                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Licenses & Verification</p>
                      <p className="font-semibold text-slate-800">FSSAI: {app.fssaiNumber || 'N/A'}</p>
                      <p className="font-semibold text-slate-800">GSTIN: {app.gstin || 'N/A'}</p>
                      <p className="font-semibold text-slate-800">Aadhaar: {app.ownerAadhaar || 'N/A'}</p>
                    </div>

                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Food Type & Tier</p>
                      <p className="font-extrabold text-forest-900">{app.foodType}</p>
                      <p className="font-semibold text-slate-700 capitalize">Category: {app.category}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 font-bold">
              No pending partner registration applications. All applications are reviewed!
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 6: USERS & REVIEWS */}
      {/* ========================================== */}
      {activeTab === 'users_reviews' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
          
          {/* Users List */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-sand-200 space-y-4">
            <h3 className="font-extrabold text-forest-900 text-base border-b border-sand-200 pb-3">
              Registered Users & Partners Directory ({users.length})
            </h3>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-sand-200 text-slate-400 uppercase text-[10px] font-bold">
                    <th className="py-2.5 px-2">Name & Email</th>
                    <th className="py-2.5 px-2">Phone</th>
                    <th className="py-2.5 px-2">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-100">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-sand-50">
                      <td className="py-2.5 px-2">
                        <p className="font-extrabold text-slate-900">{u.name}</p>
                        <p className="text-[10px] text-slate-500">{u.email || 'No email'}</p>
                      </td>
                      <td className="py-2.5 px-2 font-semibold text-slate-700">+91 {u.phone}</td>
                      <td className="py-2.5 px-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold capitalize ${
                          u.role === 'admin'
                            ? 'bg-purple-100 text-purple-900'
                            : u.role === 'provider'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-emerald-100 text-emerald-900'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Customer Reviews List */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-sand-200 space-y-4">
            <h3 className="font-extrabold text-forest-900 text-base border-b border-sand-200 pb-3">
              Customer Ratings & Reviews Moderation ({reviews.length})
            </h3>

            <div className="overflow-x-auto max-h-96 space-y-3">
              {reviews.map((rev) => (
                <div key={rev._id} className="bg-sand-50 p-4 rounded-2xl border border-sand-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{rev.userId?.name || 'Guest Diner'}</p>
                      <p className="text-[10px] text-slate-500">For: {rev.restaurantId?.name || 'Restaurant'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        ★ {rev.rating} / 5
                      </span>
                      <button
                        onClick={() => handleDeleteReview(rev._id)}
                        className="p-1 text-rose-600 hover:bg-rose-100 rounded-lg cursor-pointer"
                        title="Delete Review"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-slate-700 italic pt-1">"{rev.comment}"</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ========================================== */}
      {/* TAB 7: DYNAMIC SETTINGS & EXPENSES */}
      {/* ========================================== */}
      {activeTab === 'settings_expenses' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
          
          {/* Dynamic Platform GST & Fee Rates Editor */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-sand-200 space-y-4">
            <div className="border-b border-sand-200 pb-3">
              <h3 className="font-extrabold text-forest-900 text-base flex items-center gap-2">
                <Settings className="w-5 h-5 text-rose-600" /> Configure Platform GST % & Fee Rates
              </h3>
              <p className="text-slate-500 text-xs">Admin can configure platform fees once per month. System automatically applies live DB rates to checkouts.</p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">GST Tax Percentage (%)</label>
                <input
                  type="number"
                  required
                  value={editGst}
                  onChange={(e) => setEditGst(parseFloat(e.target.value))}
                  className="w-full p-3 rounded-xl border border-sand-300 font-extrabold text-slate-900 bg-sand-50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Standard Platform Fee (₹)</label>
                  <input
                    type="number"
                    required
                    value={editFeeDefault}
                    onChange={(e) => setEditFeeDefault(parseFloat(e.target.value))}
                    className="w-full p-3 rounded-xl border border-sand-300 font-extrabold text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Luxury Tier Fee (₹)</label>
                  <input
                    type="number"
                    required
                    value={editFeePremium}
                    onChange={(e) => setEditFeePremium(parseFloat(e.target.value))}
                    className="w-full p-3 rounded-xl border border-sand-300 font-extrabold text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Canteen Tier Fee (₹)</label>
                  <input
                    type="number"
                    required
                    value={editFeeCanteen}
                    onChange={(e) => setEditFeeCanteen(parseFloat(e.target.value))}
                    className="w-full p-3 rounded-xl border border-sand-300 font-extrabold text-slate-900 bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingSettings}
                className="gradient-orange-btn text-white font-extrabold px-6 py-3 rounded-xl shadow text-xs cursor-pointer disabled:opacity-50"
              >
                {savingSettings ? 'Saving Settings...' : 'Save GST & Fee Settings to Database'}
              </button>
            </form>
          </div>

          {/* Monthly Platform Expenses Configurator */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-sand-200 space-y-4">
            <div className="border-b border-sand-200 pb-3">
              <h3 className="font-extrabold text-forest-900 text-base flex items-center gap-2">
                <Server className="w-5 h-5 text-emerald-600" /> Platform Operating Costs Tracker
              </h3>
              <p className="text-slate-500 text-xs">Track cloud hosting, MongoDB database, payment gateway fees, and marketing costs.</p>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Server / Hosting Cost (₹)</label>
                  <input
                    type="number"
                    required
                    value={expServer}
                    onChange={(e) => setExpServer(parseFloat(e.target.value))}
                    className="w-full p-3 rounded-xl border border-sand-300 font-extrabold text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Database Cluster Cost (₹)</label>
                  <input
                    type="number"
                    required
                    value={expDb}
                    onChange={(e) => setExpDb(parseFloat(e.target.value))}
                    className="w-full p-3 rounded-xl border border-sand-300 font-extrabold text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Gateway Cost (₹)</label>
                  <input
                    type="number"
                    required
                    value={expGateway}
                    onChange={(e) => setExpGateway(parseFloat(e.target.value))}
                    className="w-full p-3 rounded-xl border border-sand-300 font-extrabold text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Marketing Cost (₹)</label>
                  <input
                    type="number"
                    required
                    value={expMarketing}
                    onChange={(e) => setExpMarketing(parseFloat(e.target.value))}
                    className="w-full p-3 rounded-xl border border-sand-300 font-extrabold text-slate-900 bg-white"
                  />
                </div>
              </div>

              <div className="bg-sand-50 p-3 rounded-xl border border-sand-200 flex justify-between items-center font-black text-slate-900">
                <span>Calculated Total Costs:</span>
                <span className="text-rose-600 text-base">₹{expServer + expDb + expGateway + expMarketing}</span>
              </div>

              <button
                type="submit"
                disabled={savingExpense}
                className="bg-[#14382B] hover:bg-forest-900 text-white font-extrabold px-6 py-3 rounded-xl shadow text-xs cursor-pointer disabled:opacity-50"
              >
                {savingExpense ? 'Saving Expense...' : 'Save Monthly Expenses to Database'}
              </button>
            </form>
          </div>

        </div>
      )}

    </div>
  );
}
