import React, { useState, useEffect } from 'react';
import { User, Calendar, Clock, ShoppingBag, Star, ShieldCheck, CheckCircle2, FileText, Check, Edit3, Mail, LogOut, Lock, Sparkles, Send, Camera, Download, Plus, Utensils, Trash2, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import { getMyHistoryApi, addReviewApi, updateProfileApi, requestEmailOtpApi, verifyEmailOtpApi, getRestaurantByIdApi, addFoodToBookingApi } from '../services/api';
import DigitalReceiptModal from '../components/DigitalReceiptModal';
import { downloadPdfBill } from '../utils/pdfGenerator';

export default function CustomerProfilePage({ user, onOpenAuth, onLogout, onUserUpdate, initialTab = 'profile', onSubTabChange }) {
  const [activeTab, setActiveTab] = useState(initialTab || 'profile'); // 'profile' or 'bookings'
  const [history, setHistory] = useState({ bookings: [], orders: [] });
  const [visibleHistoryCount, setVisibleHistoryCount] = useState(6);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (onSubTabChange) onSubTabChange(tab);
  };

  // Profile Picture Modal state (Remove vs Upload)
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  // Add Food Modal State
  const [addFoodModal, setAddFoodModal] = useState({
    isOpen: false,
    booking: null,
    menuItems: [],
    cart: {},
    loadingMenu: false,
    submitting: false,
  });

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editCity, setEditCity] = useState(user?.city || 'Bhopal');

  // Email OTP Verification State (default empty input for placeholder)
  const [emailInput, setEmailInput] = useState('');
  const [emailOtpStep, setEmailOtpStep] = useState('input'); // 'input', 'otp_sent'
  const [emailOtpCode, setEmailOtpCode] = useState('');
  const [simulatedEmailOtp, setSimulatedEmailOtp] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');

  // Logout Confirmation State
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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

  const checkCanAddFood = (booking) => {
    if (!booking || booking.status === 'cancelled') return false;
    const timeSlot = booking.timeSlot || '07:30 PM';
    const match = timeSlot.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    let hours = 19, mins = 30;
    if (match) {
      hours = parseInt(match[1]);
      mins = parseInt(match[2]);
      const ampm = match[3];
      if (ampm) {
        if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
        if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
      }
    }
    const dateStr = booking.bookingDate || new Date().toISOString().split('T')[0];
    const [yr, mo, dy] = dateStr.split('-').map(Number);
    const startDate = new Date(yr, mo - 1, dy, hours, mins, 0);
    const durationMins = booking.durationMinutes || 60;
    const endDate = new Date(startDate.getTime() + durationMins * 60 * 1000);
    const cutoffTime = new Date(endDate.getTime() - 2 * 60 * 1000); // 2 mins cutoff before end time

    const now = new Date();
    return now < cutoffTime;
  };

  const handleOpenAddFoodModal = async (booking) => {
    const restId = booking.restaurantId?._id || booking.restaurantId;
    setAddFoodModal({ isOpen: true, booking, menuItems: [], cart: {}, loadingMenu: true, submitting: false });
    try {
      const res = await getRestaurantByIdApi(restId);
      setAddFoodModal((prev) => ({ ...prev, menuItems: res.data.menuItems || [], loadingMenu: false }));
    } catch (err) {
      alert('Failed to fetch restaurant menu');
      setAddFoodModal((prev) => ({ ...prev, loadingMenu: false }));
    }
  };

  const handleAddFoodModalCart = (item, portion = 'full', delta = 1) => {
    setAddFoodModal((prev) => {
      const key = `${item._id}_${portion}`;
      const existing = prev.cart[key] || { item, portion, quantity: 0, customNote: '' };
      const newQty = existing.quantity + delta;
      const newCart = { ...prev.cart };
      if (newQty <= 0) {
        delete newCart[key];
      } else {
        newCart[key] = { ...existing, quantity: newQty };
      }
      return { ...prev, cart: newCart };
    });
  };

  const handleSubmitAddFood = async () => {
    const cartList = Object.values(addFoodModal.cart);
    if (cartList.length === 0) {
      alert('Please add at least 1 dish from the menu.');
      return;
    }
    setAddFoodModal((prev) => ({ ...prev, submitting: true }));
    try {
      const itemsPayload = cartList.map((entry) => ({
        _id: entry.item._id,
        name: entry.item.name,
        portion: entry.portion,
        pricing: entry.item.pricing,
        quantity: entry.quantity,
        customNote: entry.customNote || '',
      }));

      const res = await addFoodToBookingApi(addFoodModal.booking._id, { items: itemsPayload });
      alert('🎉 Add-on food order placed successfully for your reserved table!');
      setAddFoodModal({ isOpen: false, booking: null, menuItems: [], cart: {}, loadingMenu: false, submitting: false });
      await fetchHistory();
      if (res.data.foodOrder) {
        handleOpenReceipt(res.data.booking, res.data.foodOrder);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add food to reserved table');
      setAddFoodModal((prev) => ({ ...prev, submitting: false }));
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
      });
      alert('Profile details updated successfully!');
      if (onUserUpdate) onUserUpdate(res.data.user);
      setIsEditingProfile(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Profile update failed');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize image to max 400x400 for fast, lightweight loading
        const canvas = document.createElement('canvas');
        const maxSize = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const resizedBase64 = canvas.toDataURL('image/jpeg', 0.85);
        uploadAvatar(resizedBase64);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const uploadAvatar = async (base64Image) => {
    try {
      const res = await updateProfileApi({ avatar: base64Image });
      if (onUserUpdate) onUserUpdate(res.data.user);
      alert('🎉 Profile picture updated successfully!');
    } catch (err) {
      console.error('Avatar upload error:', err);
      alert(err.response?.data?.message || 'Failed to update profile picture.');
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      const res = await updateProfileApi({ avatar: '' });
      if (onUserUpdate) onUserUpdate(res.data.user);
      alert('Profile picture removed successfully!');
      setIsAvatarModalOpen(false);
    } catch (err) {
      console.error('Remove avatar error:', err);
      alert(err.response?.data?.message || 'Failed to remove profile picture.');
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
      
      {/* Sub-Tab Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-sand-200 pb-3 font-bold text-xs">
        <button
          onClick={() => handleTabClick('profile')}
          className={`px-5 py-2.5 rounded-full transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-[#14382B] text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-sand-100 border border-sand-200'
          }`}
        >
          <User className="w-4 h-4 text-emerald-400" />
          Account Profile & Settings
        </button>

        <button
          onClick={() => handleTabClick('bookings')}
          className={`px-5 py-2.5 rounded-full transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'bookings'
              ? 'bg-[#14382B] text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-sand-100 border border-sand-200'
          }`}
        >
          <Calendar className="w-4 h-4 text-[#FF5722]" />
          MY Bookings ({history.bookings?.length || 0})
        </button>
      </div>

      {/* Profile Header & Account Details Card (Only shown when activeTab === 'profile') */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-sand-200 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-sand-200">
            <div className="flex items-center gap-4">
            
            {/* Clickable Profile DP Avatar with Options Modal Trigger */}
            <div className="relative inline-block">
              <div
                onClick={() => setIsAvatarModalOpen(true)}
                title="Click for Profile Picture Options"
                className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 border-sand-100 shadow-md shrink-0 bg-[#14382B] text-white flex items-center justify-center font-extrabold text-2xl cursor-pointer group hover:opacity-95 transition-opacity"
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
                )}
              </div>

              {/* WhatsApp-Style Floating Green Camera Circle Icon */}
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(true)}
                title="Profile Photo Options"
                className="absolute bottom-0 right-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-slate-900 shadow-lg border-2 border-white flex items-center justify-center transition-transform hover:scale-110 cursor-pointer z-10"
              >
                <Camera className="w-4 h-4 text-slate-900 stroke-[2.5]" />
              </button>
            </div>

            <input
              id="profile-dp-file-input"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

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
                {user.email || 'Email not verified yet'}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  placeholder="abc@gmail.com"
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
      )}

      {/* Profile Picture Option Modal (Remove vs Upload from Device) */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative border border-sand-200 text-center space-y-4">
            <h3 className="font-extrabold text-forest-900 text-lg">Profile Picture Options</h3>
            <p className="text-xs text-slate-500">Choose an action for your account avatar</p>
            
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsAvatarModalOpen(false);
                  setTimeout(() => {
                    document.getElementById('profile-dp-file-input').click();
                  }, 150);
                }}
                className="w-full bg-[#14382B] hover:bg-forest-900 text-white font-extrabold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow cursor-pointer transition-all"
              >
                <Upload className="w-4 h-4 text-amber-400" />
                Upload from Device / Gallery
              </button>

              {user?.avatar && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 border border-rose-200 cursor-pointer transition-all"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  Remove Profile Picture
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(false)}
                className="w-full bg-sand-100 hover:bg-sand-200 text-slate-700 font-bold py-2.5 px-4 rounded-2xl text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bookings & Orders History Grid (Only shown when activeTab === 'bookings') */}
      {activeTab === 'bookings' && (
        <div className="space-y-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-forest-900 text-xl">My Table Reservations & Pre-Orders</h3>
            {history.bookings && history.bookings.length > 0 && (
              <span className="text-xs font-bold text-slate-500 bg-sand-100 px-3 py-1 rounded-full border border-sand-200">
                Showing {Math.min(visibleHistoryCount, history.bookings.length)} of {history.bookings.length} Cards
              </span>
            )}
          </div>
          
          {history.bookings && history.bookings.length > 0 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {history.bookings.slice(0, visibleHistoryCount).map((b) => {
                  const isCanteenOrNoTable = b.mode === 'canteen_preorder' || !b.tableNumber || b.tableNumber.toLowerCase().includes('no table');
                  const foodOrder = b.foodOrderId;

                  return (
                    <div key={b._id} className="bg-white rounded-3xl p-5 shadow-sm border border-sand-200 space-y-3 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between border-b border-sand-200 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-forest-800 bg-sand-100 px-3 py-1 rounded-full border border-sand-200">
                              {b.bookingId}
                            </span>
                            {foodOrder && (
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                ₹{foodOrder.totalAmount} Paid (UPI/Card)
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-slate-800 text-base mt-2">{b.restaurantId?.name || 'Restaurant'}</h4>
                          <p className="text-[11px] text-slate-500 font-medium">{b.restaurantId?.address || b.restaurantId?.city}</p>
                          
                          {(b.restaurantId?.licenses?.fssaiNumber || b.restaurantId?.fssaiLicenseNumber || b.restaurantId?.licenses?.gstin || b.restaurantId?.gstin) && (
                            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                              {b.restaurantId?.licenses?.fssaiNumber || b.restaurantId?.fssaiLicenseNumber ? `FSSAI: ${b.restaurantId?.licenses?.fssaiNumber || b.restaurantId?.fssaiLicenseNumber}` : ''}
                              {(b.restaurantId?.licenses?.gstin || b.restaurantId?.gstin) ? ` • GSTIN: ${b.restaurantId?.licenses?.gstin || b.restaurantId?.gstin}` : ''}
                            </p>
                          )}
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

                      <div className="pt-2 border-t border-sand-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex flex-wrap items-center gap-2">
                          {checkCanAddFood(b) ? (
                            <button
                              onClick={() => handleOpenAddFoodModal(b)}
                              className="bg-[#D84315] hover:bg-[#B71C1C] text-white font-black px-3 py-2 rounded-xl transition-all flex items-center gap-1 shadow-md text-xs cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5 stroke-[3]" />
                              + Add Food to Table
                            </button>
                          ) : b.mode !== 'canteen_preorder' ? (
                            <span className="text-[10px] font-bold text-slate-400 bg-sand-100 px-2.5 py-1.5 rounded-lg border border-sand-200" title="Food can only be added up to 2 minutes before reserved table time ends">
                              🔒 Food Window Closed
                            </span>
                          ) : null}

                          <button
                            onClick={() => downloadPdfBill({ booking: b, order: foodOrder, restaurant: b.restaurantId, user })}
                            className="gradient-orange-btn text-white font-extrabold px-3 py-2 rounded-xl transition-all flex items-center gap-1 shadow-sm text-xs cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download Bill
                          </button>

                          <button
                            onClick={() => handleOpenReceipt(b, foodOrder)}
                            className="bg-[#14382B] hover:bg-forest-900 text-white font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1 text-xs cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5 text-amber-400" />
                            View Receipt
                          </button>
                        </div>

                        <button
                          onClick={() => handleOpenReview(b.restaurantId?._id)}
                          className="text-terracotta-600 hover:underline font-bold text-xs ml-auto sm:ml-0"
                        >
                          Rate & Review ★
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* View More / Show Less Pagination Controls (Requirement 7) */}
              {history.bookings.length > 6 && (
                <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                  {history.bookings.length > visibleHistoryCount && (
                    <button
                      type="button"
                      onClick={() => setVisibleHistoryCount((prev) => prev + 6)}
                      className="gradient-orange-btn text-white font-extrabold px-6 py-3 rounded-2xl text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <ChevronDown className="w-4 h-4 stroke-[3]" />
                      View More (+6 Cards)
                    </button>
                  )}

                  {visibleHistoryCount > 6 && (
                    <button
                      type="button"
                      onClick={() => setVisibleHistoryCount((prev) => Math.max(6, prev - 6))}
                      className="bg-sand-100 hover:bg-sand-200 text-slate-800 font-extrabold px-5 py-3 rounded-2xl text-xs border border-sand-300 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <ChevronUp className="w-4 h-4 stroke-[3]" />
                      Show Less
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 text-center border border-sand-200 text-slate-500 text-xs">
              No active reservations yet. Browse restaurants on the home page to prebook!
            </div>
          )}
        </div>
      </div>
      )}

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

      {/* Add Food to Reserved Table Modal */}
      {addFoodModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative border border-sand-200 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-sand-200 pb-3 shrink-0">
              <div>
                <h3 className="text-lg font-extrabold text-forest-900 flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-[#D84315]" /> Add Food to Reserved Table ({addFoodModal.booking?.tableNumber || 'Table'})
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {addFoodModal.booking?.restaurantId?.name} • Slot: {addFoodModal.booking?.timeSlot}
                </p>
              </div>
              <button
                onClick={() => setAddFoodModal({ isOpen: false, booking: null, menuItems: [], cart: {}, loadingMenu: false, submitting: false })}
                className="p-2 rounded-full bg-sand-100 hover:bg-sand-200 text-slate-600 font-extrabold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {addFoodModal.loadingMenu ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-forest-800 border-t-transparent mx-auto mb-3" />
                Loading restaurant digital menu...
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {/* Menu items list */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {addFoodModal.menuItems.map((item) => {
                    const fullKey = `${item._id}_full`;
                    const halfKey = `${item._id}_half`;
                    const fullQty = addFoodModal.cart[fullKey]?.quantity || 0;
                    const halfQty = addFoodModal.cart[halfKey]?.quantity || 0;

                    return (
                      <div key={item._id} className="bg-sand-50 p-3.5 rounded-2xl border border-sand-200 flex flex-col justify-between space-y-2">
                        <div className="flex items-start gap-2.5">
                          <img src={item.image} alt={item.name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                          <div className="space-y-0.5 flex-1">
                            <h5 className="font-extrabold text-slate-900 text-xs">{item.name}</h5>
                            <p className="text-[10px] text-slate-500 line-clamp-1">{item.description}</p>
                            <p className="text-xs font-black text-forest-900">
                              Full: ₹{item.pricing?.full || item.pricing?.default}
                              {item.pricing?.half > 0 && <span className="text-[10px] text-slate-500 ml-1.5">Half: ₹{item.pricing.half}</span>}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-sand-200">
                          <span className="text-[10px] font-bold text-slate-500">{item.isVeg ? '🟢 Veg' : '🔴 Non-Veg'}</span>
                          
                          <div className="flex items-center gap-1.5">
                            {item.pricing?.half > 0 && (
                              halfQty > 0 ? (
                                <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-sand-200 text-xs">
                                  <button onClick={() => handleAddFoodModalCart(item, 'half', -1)} className="font-bold text-red-600 cursor-pointer">-</button>
                                  <span className="font-extrabold text-slate-800">{halfQty} Half</span>
                                  <button onClick={() => handleAddFoodModalCart(item, 'half', 1)} className="font-bold text-emerald-600 cursor-pointer">+</button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleAddFoodModalCart(item, 'half', 1)}
                                  className="bg-sand-200 hover:bg-sand-300 text-slate-800 text-[11px] font-bold px-2 py-1 rounded-lg cursor-pointer"
                                >
                                  + Half
                                </button>
                              )
                            )}

                            {fullQty > 0 ? (
                              <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-sand-200 text-xs">
                                <button onClick={() => handleAddFoodModalCart(item, 'full', -1)} className="font-bold text-red-600 cursor-pointer">-</button>
                                <span className="font-extrabold text-slate-800">{fullQty} Full</span>
                                <button onClick={() => handleAddFoodModalCart(item, 'full', 1)} className="font-bold text-emerald-600 cursor-pointer">+</button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleAddFoodModalCart(item, 'full', 1)}
                                className="gradient-orange-btn text-white text-[11px] font-extrabold px-2.5 py-1 rounded-lg shadow-sm cursor-pointer"
                              >
                                + Full
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Modal Footer with Total */}
            {(() => {
              const cartList = Object.values(addFoodModal.cart);
              const subtotal = cartList.reduce((sum, entry) => {
                const price = entry.portion === 'half' ? entry.item.pricing.half : entry.item.pricing.full || entry.item.pricing.default;
                return sum + price * entry.quantity;
              }, 0);
              const tax = Math.round(subtotal * 0.05);
              const platformFee = subtotal > 0 ? 15 : 0;
              const total = subtotal + tax + platformFee;

              return (
                <div className="border-t border-sand-200 pt-3 flex items-center justify-between shrink-0">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Add-on Food Total</p>
                    <p className="text-lg font-black text-terracotta-600">₹{total} <span className="text-[10px] text-slate-500 font-normal">(incl. 5% GST + ₹15 fee)</span></p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAddFoodModal({ isOpen: false, booking: null, menuItems: [], cart: {}, loadingMenu: false, submitting: false })}
                      className="px-4 py-2.5 rounded-xl bg-sand-100 hover:bg-sand-200 text-slate-700 text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitAddFood}
                      disabled={cartList.length === 0 || addFoodModal.submitting}
                      className="gradient-orange-btn text-white font-extrabold px-5 py-2.5 rounded-xl shadow text-xs cursor-pointer disabled:opacity-50"
                    >
                      {addFoodModal.submitting ? 'Adding...' : 'Confirm & Generate Bill'}
                    </button>
                  </div>
                </div>
              );
            })()}

          </div>
        </div>
      )}

      {/* Digital Receipt Modal */}
      <DigitalReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        booking={selectedBooking}
        order={selectedOrder}
        restaurant={selectedBooking?.restaurantId || selectedOrder?.restaurantId}
        user={user}
      />

      {/* Red Logout Action (Only shown when activeTab === 'profile') */}
      {activeTab === 'profile' && (
        <div className="pt-6 border-t border-sand-300">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            Logout from Account
          </button>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4 border border-sand-200">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-inner">
              <LogOut className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Do you want to log out?</h3>
              <p className="text-xs text-slate-500 mt-1">You will need to sign in again with your mobile number or admin credentials.</p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 px-4 rounded-xl bg-sand-100 hover:bg-sand-200 font-bold text-slate-700 text-xs transition-all cursor-pointer"
              >
                No, Stay Logged In
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onLogout();
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 font-extrabold text-white text-xs shadow-md transition-all cursor-pointer"
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
