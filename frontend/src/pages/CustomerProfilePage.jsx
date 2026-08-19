import React, { useState, useEffect } from 'react';
import { User, Calendar, Clock, ShoppingBag, Star, ShieldCheck, CheckCircle2, FileText, Check, Edit3, Mail, LogOut, Lock, Sparkles, Send } from 'lucide-react';
import { getMyHistoryApi, addReviewApi, updateProfileApi, requestEmailOtpApi, verifyEmailOtpApi } from '../services/api';
import DigitalReceiptModal from '../components/DigitalReceiptModal';

export default function CustomerProfilePage({ user, onOpenAuth, onLogout, onUserUpdate }) {
  const [history, setHistory] = useState({ bookings: [], orders: [] });
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editCity, setEditCity] = useState(user?.city || 'Bhopal');
  const [editAvatar, setEditAvatar] = useState(user?.avatar || '');

  // Email OTP Verification State
  const [emailInput, setEmailInput] = useState(user?.email || '');
  const [emailOtpStep, setEmailOtpStep] = useState('input'); // 'input', 'otp_sent'
  const [emailOtpCode, setEmailOtpCode] = useState('');
  const [simulatedEmailOtp, setSimulatedEmailOtp] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');

  // Review Form State
  const [reviewModal, setReviewModal] = useState({ isOpen: false, restaurantId: null, rating: 5, comment: '' });

  useEffect(() => {
    if (user) fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await getMyHistoryApi();
      setHistory(res.data);
    } catch (err) {
      console.error('History load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReceipt = (booking, order) => {
    setSelectedBooking(booking);
    setSelectedOrder(order || booking?.foodOrderId);
    setIsReceiptOpen(true);
  };

  const handleOpenReview = (restaurantId) => {
    setReviewModal({ isOpen: true, restaurantId, rating: 5, comment: '' });
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      await addReviewApi({
        restaurantId: reviewModal.restaurantId,
        rating: reviewModal.rating,
        comment: reviewModal.comment,
      });
      alert('Review submitted successfully!');
      setReviewModal({ isOpen: false, restaurantId: null, rating: 5, comment: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Review failed');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await updateProfileApi({
        name: editName,
        city: editCity,
        avatar: editAvatar,
      });
      alert('Profile details updated successfully!');
      if (onUserUpdate) onUserUpdate(res.data.user);
      setIsEditingProfile(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Profile update failed');
    }
  };

  const handleSendEmailOtp = async () => {
    if (!emailInput || !emailInput.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }
    setIsSendingOtp(true);
    setOtpMessage('');
    try {
      const res = await requestEmailOtpApi(emailInput);
      setEmailOtpStep('otp_sent');
      setSimulatedEmailOtp(res.data.simulatedOtp || '');
      setOtpMessage(res.data.message || 'OTP sent successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send Email OTP');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!emailOtpCode) {
      alert('Please enter the 6-digit OTP code');
      return;
    }
    setIsVerifyingOtp(true);
    try {
      const res = await verifyEmailOtpApi({ otp: emailOtpCode });
      alert('🎉 Email verified successfully! Blue verified badge unlocked on your account.');
      if (onUserUpdate) onUserUpdate(res.data.user);
      setEmailOtpStep('input');
      setEmailOtpCode('');
      setOtpMessage('');
    } catch (err) {
      alert(err.response?.data?.message || 'Invalid OTP code');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-3xl shadow-xl border border-sand-200 text-center">
        <User className="w-12 h-12 text-terracotta-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-forest-900 mb-2">My Dining Profile</h2>
        <p className="text-sm text-slate-600 mb-6">Sign in to view your active table bookings, past food pre-orders, and digital receipts.</p>
        <button
          onClick={onOpenAuth}
          className="w-full gradient-orange-btn text-white font-bold py-3 rounded-2xl shadow hover:shadow-lg transition-all text-sm"
        >
          Sign In / Register
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Profile Header & Account Details Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-sand-200 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-sand-200">
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-sand-100 shadow-md shrink-0 bg-[#14382B] text-white flex items-center justify-center font-extrabold text-2xl">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-forest-900">{user.name}</h1>
                {user.isEmailVerified ? (
                  <span title="Verified Diner Account" className="inline-flex items-center gap-1 text-xs font-bold text-white bg-sky-500 px-2 py-0.5 rounded-full shadow-sm">
                    ✔ Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Unverified Email
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-semibold">+91 {user.phone} • {user.city}</p>
              <p className="text-xs text-slate-600 font-medium flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-terracotta-500" />
                {user.email || 'No email added yet'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsEditingProfile(!isEditingProfile)}
            className="px-4 py-2 rounded-2xl bg-sand-100 hover:bg-sand-200 text-forest-900 font-bold text-xs transition-all flex items-center gap-1.5 border border-sand-200 cursor-pointer"
          >
            <Edit3 className="w-4 h-4 text-terracotta-500" />
            {isEditingProfile ? 'Cancel Edit' : 'Edit Profile'}
          </button>
        </div>

        {/* Profile Edit Form Drawer */}
        {isEditingProfile && (
          <form onSubmit={handleSaveProfile} className="bg-sand-50 p-5 rounded-2xl border border-sand-200 space-y-4 text-xs">
            <h4 className="font-extrabold text-forest-900 text-sm">Edit Personal Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-sand-200 bg-white font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Current City</label>
                <input
                  type="text"
                  required
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-sand-200 bg-white font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Profile DP Avatar URL</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-sand-200 bg-white font-semibold text-slate-800"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="gradient-orange-btn text-white font-bold px-5 py-2.5 rounded-xl shadow text-xs cursor-pointer"
              >
                Save Profile Changes
              </button>
            </div>
          </form>
        )}

        {/* Email Verification Section */}
        <div className="bg-sand-50 p-5 rounded-2xl border border-sand-200 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-sky-600" />
              <h4 className="font-extrabold text-slate-800 text-sm">Email Address Verification</h4>
            </div>
            {user.isEmailVerified && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full flex items-center gap-1 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified ✔️
              </span>
            )}
          </div>

          {!user.isEmailVerified ? (
            <div className="space-y-3">
              <p className="text-slate-600 text-xs">
                Verify your email address via 6-digit OTP to unlock your <strong className="text-sky-600">Blue Verified Diner Badge (✔️)</strong> and receive instant booking receipts.
              </p>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  placeholder="Enter your email (e.g. diner@example.com)"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="flex-1 p-2.5 rounded-xl border border-sand-200 bg-white font-semibold text-slate-800 text-xs"
                />

                <button
                  type="button"
                  onClick={handleSendEmailOtp}
                  disabled={isSendingOtp}
                  className="bg-[#14382B] hover:bg-forest-900 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow text-xs shrink-0 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSendingOtp ? 'Sending OTP...' : 'Request Email OTP'}
                </button>
              </div>

              {otpMessage && (
                <p className="text-[11px] font-bold text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                  {otpMessage} {simulatedEmailOtp && <span>(Test OTP Code: <strong className="text-slate-900 font-extrabold">{simulatedEmailOtp}</strong> or use <strong>123456</strong>)</span>}
                </p>
              )}

              {emailOtpStep === 'otp_sent' && (
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit Email OTP (e.g. 123456)"
                    value={emailOtpCode}
                    onChange={(e) => setEmailOtpCode(e.target.value)}
                    className="w-56 p-2.5 rounded-xl border border-sand-300 bg-white font-extrabold text-slate-900 tracking-widest text-center text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyEmailOtp}
                    disabled={isVerifyingOtp}
                    className="gradient-orange-btn text-white font-extrabold px-5 py-2.5 rounded-xl shadow text-xs cursor-pointer disabled:opacity-50"
                  >
                    {isVerifyingOtp ? 'Verifying...' : 'Verify OTP & Unlock Badge ✔️'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-600 font-medium">
              Your email <strong className="text-slate-900">{user.email}</strong> is verified. Your account exhibits a blue verified checkmark.
            </p>
          )}
        </div>
      </div>

      {/* Bookings & Orders History Grid */}
      <div className="space-y-8">
        <div>
          <h3 className="font-extrabold text-forest-900 text-xl mb-4">My Table Reservations & Pre-Orders</h3>
          
          {history.bookings && history.bookings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {history.bookings.map((b) => {
                const isCanteenOrNoTable = b.mode === 'canteen_preorder' || !b.tableNumber || b.tableNumber.toLowerCase().includes('no table');
                const foodOrder = b.foodOrderId;

                return (
                  <div key={b._id} className="bg-white rounded-3xl p-5 shadow-sm border border-sand-200 space-y-3">
                    <div className="flex items-center justify-between border-b border-sand-200 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-forest-800 bg-sand-100 px-3 py-1 rounded-full border border-sand-200">
                            {b.bookingId}
                          </span>
                          {foodOrder && (
                            <span className="text-[10px] font-bold text-orange-800 bg-orange-100 px-2.5 py-0.5 rounded-full border border-orange-200">
                              ₹{foodOrder.totalAmount} Paid
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-slate-800 text-base mt-2">{b.restaurantId?.name || 'Restaurant'}</h4>
                        <p className="text-[11px] text-slate-500 font-medium">{b.restaurantId?.address || b.restaurantId?.city}</p>
                      </div>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full uppercase">
                        {b.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-sand-50 p-3 rounded-2xl border border-sand-200">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Date & Slot</p>
                        <p className="font-bold text-slate-800">{b.bookingDate}</p>
                        <p className="text-[11px] text-slate-600 font-semibold">{b.timeSlot}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Assigned Table / Slot</p>
                        {isCanteenOrNoTable ? (
                          <p className="font-bold text-[#D84315]">No table reservation</p>
                        ) : (
                          <p className="font-bold text-emerald-800">{b.tableNumber} <span className="text-[10px] text-slate-500 font-normal">({b.guestCount} guests)</span></p>
                        )}
                      </div>
                    </div>

                    {/* Pre-ordered items snippet */}
                    {foodOrder && foodOrder.items && foodOrder.items.length > 0 && (
                      <div className="text-xs text-slate-600 space-y-1 bg-white p-2.5 rounded-xl border border-sand-200">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Pre-Ordered Food Items</p>
                        {foodOrder.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between items-center text-[11px]">
                            <span className="font-semibold text-slate-700">
                              {it.quantity}x {it.name} <span className="text-slate-400">({it.portion})</span>
                            </span>
                            <span className="font-bold text-slate-800">₹{it.price * it.quantity}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-2 border-t border-sand-200 flex items-center justify-between text-xs">
                      <button
                        onClick={() => handleOpenReceipt(b, foodOrder)}
                        className="bg-[#14382B] hover:bg-forest-900 text-white font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-400" />
                        Digital Invoice & Bill
                      </button>

                      <button
                        onClick={() => handleOpenReview(b.restaurantId?._id)}
                        className="text-terracotta-600 hover:underline font-bold"
                      >
                        Rate & Review ★
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 text-center border border-sand-200 text-slate-500 text-xs">
              No active reservations yet. Browse restaurants on the home page to prebook!
            </div>
          )}
        </div>
      </div>

      {/* Review Submission Modal */}
      {reviewModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-sand-200">
            <h3 className="text-lg font-bold text-forest-900 mb-4">Rate Your Dining Experience</h3>
            <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Rating (1 to 5 Stars)</label>
                <select
                  value={reviewModal.rating}
                  onChange={(e) => setReviewModal({ ...reviewModal, rating: parseInt(e.target.value) })}
                  className="w-full p-3 rounded-xl border border-sand-200 bg-sand-50 font-bold text-slate-800"
                >
                  <option value={5}>★★★★★ Excellent (5 Stars)</option>
                  <option value={4}>★★★★☆ Very Good (4 Stars)</option>
                  <option value={3}>★★★☆☆ Average (3 Stars)</option>
                  <option value={2}>★★☆☆☆ Poor (2 Stars)</option>
                  <option value={1}>★☆☆☆☆ Bad (1 Star)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Your Review Comment</label>
                <textarea
                  rows={3}
                  required
                  value={reviewModal.comment}
                  onChange={(e) => setReviewModal({ ...reviewModal, comment: e.target.value })}
                  placeholder="Tell us about the food quality, seat comfort, and fast service..."
                  className="w-full p-3 rounded-xl border border-sand-200 bg-sand-50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModal({ isOpen: false, restaurantId: null, rating: 5, comment: '' })}
                  className="px-4 py-2 rounded-xl bg-sand-100 font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="gradient-orange-btn text-white font-bold px-5 py-2 rounded-xl shadow"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Digital Receipt Modal */}
      <DigitalReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        booking={selectedBooking}
        order={selectedOrder}
      />
      {/* Red Logout Action at the very bottom of profile */}
      <div className="pt-6 border-t border-sand-300">
        <button
          onClick={onLogout}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
          Logout from Account
        </button>
      </div>

    </div>
  );
}
