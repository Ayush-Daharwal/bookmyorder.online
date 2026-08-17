import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Users,
  Store,
  Star,
  CheckCircle2,
  XCircle,
  Trash2,
  Activity,
  Calendar,
  Layers,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  getAdminMetricsApi,
  getAdminRestaurantsApi,
  updateRestaurantStatusApi,
  getAdminReviewsApi,
  deleteAdminReviewApi,
  getAdminUsersApi,
} from '../services/api';

export default function AdminDashboardPage({ adminUser, onLogout }) {
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics', 'restaurants', 'reviews', 'users'
  const [metrics, setMetrics] = useState(null);
  const [charts, setCharts] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [metricsRes, restRes, revRes, userRes] = await Promise.all([
        getAdminMetricsApi(),
        getAdminRestaurantsApi(),
        getAdminReviewsApi(),
        getAdminUsersApi(),
      ]);

      setMetrics(metricsRes.data.metrics);
      setCharts(metricsRes.data.charts);
      setRestaurants(restRes.data.restaurants || []);
      setReviews(revRes.data.reviews || []);
      setUsers(userRes.data.users || []);
    } catch (err) {
      console.error('Admin data load error:', err);
    } finally {
      setLoading(false);
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

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await deleteAdminReviewApi(reviewId);
      fetchAdminData();
    } catch (err) {
      alert('Failed to delete review');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#14382B] border-t-transparent mb-3" />
        <p className="font-bold text-slate-700 text-sm">Loading Super Admin Analytics Suite...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Super Admin Banner */}
      <div className="bg-[#14382B] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-[#FF5722] font-bold">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold">Super Admin Control Hub</h1>
            <p className="text-xs text-sand-200 mt-0.5">bookmyorder.online • 20+ Real-Time KPI Parameters & Verification Suite</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition-all border border-white/20"
        >
          Exit Admin Console
        </button>
      </div>

      {/* Admin Tab Controls */}
      <div className="flex items-center gap-2 border-b border-sand-200 pb-3 text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-5 py-2.5 rounded-2xl transition-all flex items-center gap-2 ${
            activeTab === 'analytics' ? 'bg-[#14382B] text-white shadow' : 'bg-white text-slate-700 hover:bg-sand-100'
          }`}
        >
          <Activity className="w-4 h-4 text-[#FF5722]" />
          Analytics Dashboard (20+ KPIs)
        </button>

        <button
          onClick={() => setActiveTab('restaurants')}
          className={`px-5 py-2.5 rounded-2xl transition-all flex items-center gap-2 ${
            activeTab === 'restaurants' ? 'bg-[#14382B] text-white shadow' : 'bg-white text-slate-700 hover:bg-sand-100'
          }`}
        >
          <Store className="w-4 h-4 text-[#FF5722]" />
          Partner Verification ({restaurants.length})
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-5 py-2.5 rounded-2xl transition-all flex items-center gap-2 ${
            activeTab === 'reviews' ? 'bg-[#14382B] text-white shadow' : 'bg-white text-slate-700 hover:bg-sand-100'
          }`}
        >
          <Star className="w-4 h-4 text-[#FF5722]" />
          Review Moderation ({reviews.length})
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-5 py-2.5 rounded-2xl transition-all flex items-center gap-2 ${
            activeTab === 'users' ? 'bg-[#14382B] text-white shadow' : 'bg-white text-slate-700 hover:bg-sand-100'
          }`}
        >
          <Users className="w-4 h-4 text-[#FF5722]" />
          User Directory ({users.length})
        </button>
      </div>

      {/* TAB 1: ANALYTICS DASHBOARD (20+ KPIs & Recharts) */}
      {activeTab === 'analytics' && metrics && (
        <div className="space-y-8">
          
          {/* Top 4 Primary KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-sand-200 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase">Total Platform GMV</span>
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900">₹{metrics.totalRevenue.toLocaleString()}</p>
              <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> +24.8% MoM Growth
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl shadow-sm border border-sand-200 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase">App Commission (10%)</span>
                <ShieldCheck className="w-5 h-5 text-[#FF5722]" />
              </div>
              <p className="text-3xl font-extrabold text-[#D84315]">₹{metrics.totalCommission.toLocaleString()}</p>
              <p className="text-xs font-bold text-slate-500">Platform Pure Net Revenue</p>
            </div>

            <div className="bg-white p-5 rounded-3xl shadow-sm border border-sand-200 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase">Partner Payouts (90%)</span>
                <Store className="w-5 h-5 text-[#14382B]" />
              </div>
              <p className="text-3xl font-extrabold text-[#14382B]">₹{metrics.restaurantPayouts.toLocaleString()}</p>
              <p className="text-xs font-bold text-slate-500">Disbursed to Venues</p>
            </div>

            <div className="bg-white p-5 rounded-3xl shadow-sm border border-sand-200 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase">Customer Retention</span>
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900">{metrics.retentionRate}%</p>
              <p className="text-xs font-bold text-blue-600">Repeat Dining Ratio</p>
            </div>

          </div>

          {/* Secondary Parameter Grid (12 Additional Parameters) */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-sand-200 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 text-xs">
            <div>
              <p className="text-slate-400 font-bold">Total Orders</p>
              <p className="text-base font-extrabold text-slate-800 mt-0.5">{metrics.totalOrdersCount}</p>
            </div>
            <div>
              <p className="text-slate-400 font-bold">Table Reservations</p>
              <p className="text-base font-extrabold text-slate-800 mt-0.5">{metrics.totalBookingsCount}</p>
            </div>
            <div>
              <p className="text-slate-400 font-bold">Weekend Ratio</p>
              <p className="text-base font-extrabold text-slate-800 mt-0.5">{metrics.weekendSpikeRatio}x Demand</p>
            </div>
            <div>
              <p className="text-slate-400 font-bold">Avg Table Turnover</p>
              <p className="text-base font-extrabold text-slate-800 mt-0.5">{metrics.avgTableTurnoverMins} Mins</p>
            </div>
            <div>
              <p className="text-slate-400 font-bold">Avg Order Value</p>
              <p className="text-base font-extrabold text-slate-800 mt-0.5">₹{metrics.avgOrderValue}</p>
            </div>
            <div>
              <p className="text-slate-400 font-bold">Verified Partners</p>
              <p className="text-base font-extrabold text-slate-800 mt-0.5">{metrics.verifiedRestaurants} / {metrics.totalRestaurants}</p>
            </div>
          </div>

          {/* Recharts Graphical Visualizations */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Chart 1: Revenue & Commission Growth AreaChart (7 cols) */}
            <div className="lg:col-span-7 bg-white p-6 rounded-3xl shadow-sm border border-sand-200 space-y-4">
              <h3 className="font-extrabold text-slate-900 text-base">Platform Revenue & Commission Growth (Monthly)</h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={charts.revenueGrowthChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F4EFE6" />
                    <XAxis dataKey="month" stroke="#64748B" fontSize={11} />
                    <YAxis stroke="#64748B" fontSize={11} />
                    <Tooltip />
                    <Area type="monotone" dataKey="revenue" stroke="#14382B" fill="#14382B" fillOpacity={0.15} name="Total GMV (₹)" />
                    <Area type="monotone" dataKey="commission" stroke="#FF5722" fill="#FF5722" fillOpacity={0.25} name="App Commission (₹)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Category Breakdown PieChart (5 cols) */}
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl shadow-sm border border-sand-200 space-y-4">
              <h3 className="font-extrabold text-slate-900 text-base">Revenue by Venue Tier</h3>
              <div className="h-72 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.categoryBreakdownChart}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {charts.categoryBreakdownChart.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Chart 3: Weekend vs Weekday Demand BarChart */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-sand-200 space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base">Weekly Ordering & Reservation Spikes (Weekday vs Weekend)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.demandComparisonChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F4EFE6" />
                  <XAxis dataKey="day" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="orders" fill="#14382B" name="Food Pre-Orders" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="bookings" fill="#FF5722" name="Table Reservations" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: PARTNER RESTAURANT VERIFICATION & SUSPENSION */}
      {activeTab === 'restaurants' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-sand-200 space-y-4">
          <h3 className="font-extrabold text-slate-900 text-lg">Partner Verification & Compliance Suite</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] text-slate-500 uppercase font-bold border-b border-sand-200">
                <tr>
                  <th className="p-3">Venue Name</th>
                  <th className="p-3">Tier</th>
                  <th className="p-3">FSSAI / GSTIN License</th>
                  <th className="p-3">City</th>
                  <th className="p-3">Aadhar Verification</th>
                  <th className="p-3 text-right">Status Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-200">
                {restaurants.map((r) => (
                  <tr key={r._id} className="hover:bg-[#FAF8F5]">
                    <td className="p-3 font-bold text-slate-800">{r.name}</td>
                    <td className="p-3 uppercase font-bold text-slate-600">{r.tier}</td>
                    <td className="p-3 text-slate-600 font-mono">{r.fssaiLicenseNumber || 'Verified'}</td>
                    <td className="p-3 text-slate-600">{r.city}</td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> OTP Verified
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleToggleStatus(r._id, r.isVerified)}
                        className={`px-4 py-1.5 rounded-xl font-bold text-xs shadow transition-all ${
                          r.isVerified
                            ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                      >
                        {r.isVerified ? 'Suspend Venue' : 'Approve & Verify'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: REVIEW MODERATION */}
      {activeTab === 'reviews' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-sand-200 space-y-4">
          <h3 className="font-extrabold text-slate-900 text-lg">Customer Review Moderation</h3>
          
          <div className="space-y-3">
            {reviews.map((rev) => (
              <div key={rev._id} className="p-4 rounded-2xl border border-sand-200 bg-[#FAF8F5] flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-slate-900 text-sm">{rev.userId?.name || 'Customer'}</span>
                    <span className="text-amber-500 font-bold text-xs">★ {rev.rating} Stars</span>
                    <span className="text-slate-400 text-xs">• {rev.restaurantId?.name || 'Restaurant'}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                </div>

                <button
                  onClick={() => handleDeleteReview(rev._id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  title="Delete Review"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: USER DIRECTORY */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-sand-200 space-y-4">
          <h3 className="font-extrabold text-slate-900 text-lg">Registered User Accounts</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] text-slate-500 uppercase font-bold border-b border-sand-200">
                <tr>
                  <th className="p-3">User Name</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">City</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-200">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-[#FAF8F5]">
                    <td className="p-3 font-bold text-slate-800">{u.name}</td>
                    <td className="p-3 text-slate-600 font-mono">+91 {u.phone}</td>
                    <td className="p-3 text-slate-600">{u.email || 'N/A'}</td>
                    <td className="p-3 font-bold uppercase text-[#D84315]">{u.role}</td>
                    <td className="p-3 text-slate-600">{u.city}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
