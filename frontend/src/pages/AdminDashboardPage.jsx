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
  getPendingApplicationsApi,
  approveRestaurantApplicationApi,
  rejectRestaurantApplicationApi,
} from '../services/api';

export default function AdminDashboardPage({ adminUser, onLogout }) {
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics', 'applications', 'restaurants', 'reviews', 'users'
  const [metrics, setMetrics] = useState(null);
  const [charts, setCharts] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [applications, setApplications] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [metricsRes, restRes, appRes, revRes, userRes] = await Promise.all([
        getAdminMetricsApi(),
        getAdminRestaurantsApi(),
        getPendingApplicationsApi(),
        getAdminReviewsApi(),
        getAdminUsersApi(),
      ]);

      setMetrics(metricsRes.data.metrics);
      setCharts(metricsRes.data.charts);
      setRestaurants(restRes.data.restaurants || []);
      setApplications(appRes.data.applications || []);
      setReviews(revRes.data.reviews || []);
      setUsers(userRes.data.users || []);
    } catch (err) {
      console.error('Admin data load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveApplication = async (appId) => {
    try {
      const res = await approveRestaurantApplicationApi(appId);
      setActionMsg(res.data.message || 'Restaurant application approved! Email and SMS sent.');
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.message || 'Approve application failed');
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
          onClick={() => setActiveTab('applications')}
          className={`px-5 py-2.5 rounded-2xl transition-all flex items-center gap-2 ${
            activeTab === 'applications' ? 'bg-[#14382B] text-white shadow' : 'bg-white text-slate-700 hover:bg-sand-100'
          }`}
        >
          <Layers className="w-4 h-4 text-emerald-400" />
          Pending Applications ({applications.filter(a => a.status === 'pending').length})
        </button>

        <button
          onClick={() => setActiveTab('restaurants')}
          className={`px-5 py-2.5 rounded-2xl transition-all flex items-center gap-2 ${
            activeTab === 'restaurants' ? 'bg-[#14382B] text-white shadow' : 'bg-white text-slate-700 hover:bg-sand-100'
          }`}
        >
          <Store className="w-4 h-4 text-[#FF5722]" />
          Verified Partners ({restaurants.length})
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

      {/* Action Message Alert */}
      {actionMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-950 font-bold text-xs rounded-2xl flex items-center justify-between">
          <span>✨ {actionMsg}</span>
          <button onClick={() => setActionMsg('')} className="text-emerald-800 text-xs">Dismiss</button>
        </div>
      )}

      {/* TAB: PENDING RESTAURANT APPLICATIONS */}
      {activeTab === 'applications' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-sand-200 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">Pending Restaurant Applications</h3>
              <p className="text-xs text-slate-500">Review partner applications in Bhopal and approve to trigger Email & SMS credentials.</p>
            </div>
            <span className="bg-amber-100 text-amber-900 text-xs font-bold px-3 py-1 rounded-full">
              {applications.filter(a => a.status === 'pending').length} Action Required
            </span>
          </div>

          {applications.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs bg-sand-50 rounded-2xl border border-sand-200">
              No pending restaurant applications found.
            </div>
          ) : (
            <div className="space-y-6">
              {applications.map((app) => (
                <div key={app._id} className="p-5 bg-[#FAF8F5] rounded-3xl border border-sand-200 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-sand-200 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-base">{app.restaurantName}</span>
                        <span className="bg-forest-900 text-white font-extrabold text-[10px] px-2.5 py-0.5 rounded-full capitalize">
                          Category: {app.category}
                        </span>
                        <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded-full">
                          {app.foodType}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">Manager: <strong>{app.managerName}</strong> | Phone: <strong>{app.managerPhone}</strong> | Email: <strong>{app.email}</strong></p>
                    </div>

                    <div className="flex items-center gap-2">
                      {app.status === 'pending' ? (
                        <button
                          onClick={() => handleApproveApplication(app._id)}
                          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Approve & Notify (Email + SMS)
                        </button>
                      ) : (
                        <span className="px-4 py-1.5 bg-emerald-100 text-emerald-800 font-black text-xs rounded-xl capitalize">
                          Status: {app.status} ✔
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-white p-3.5 rounded-2xl border border-sand-200">
                    <div>
                      <span className="text-slate-400 font-bold text-[10px] uppercase block">City & Address</span>
                      <span className="font-semibold text-slate-800">{app.address}, {app.city}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold text-[10px] uppercase block">Owner Aadhaar</span>
                      <span className="font-semibold text-slate-800">{app.ownerAadhaar}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold text-[10px] uppercase block">Licenses</span>
                      <span className="font-semibold text-slate-800">GST: {app.gstin || 'N/A'} | FSSAI: {app.fssaiNumber || 'N/A'}</span>
                    </div>
                  </div>

                  {/* 6 Photos Preview */}
                  {app.photos && (
                    <div>
                      <p className="text-xs font-bold text-slate-700 mb-2">Attached 6 Registration Photos (Banner + 5 Live Captures):</p>
                      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                        {Object.entries(app.photos).map(([key, imgUrl], idx) => (
                          <div key={idx} className="relative rounded-xl overflow-hidden border border-sand-200 bg-sand-100 h-20 group">
                            <img src={imgUrl} alt={key} className="w-full h-full object-cover" />
                            <span className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-white text-[9px] font-bold text-center py-0.5 capitalize truncate px-1">
                              {key}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}
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
