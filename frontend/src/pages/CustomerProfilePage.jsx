import React, { useState, useEffect } from 'react';
import { User, Calendar, Clock, ShoppingBag, Star, ShieldCheck, CheckCircle2, FileText } from 'lucide-react';
import { getMyHistoryApi, addReviewApi } from '../services/api';
import DigitalReceiptModal from '../components/DigitalReceiptModal';

export default function CustomerProfilePage({ user, onOpenAuth }) {
  const [history, setHistory] = useState({ bookings: [], orders: [] });
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Profile Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-sand-200 mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-forest-800 text-white flex items-center justify-center font-extrabold text-2xl shadow">
            {user.name ? user.name.charAt(0).toUpperCase() : 'D'}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-forest-900">{user.name}</h1>
            <p className="text-xs text-slate-500 font-semibold">+91 {user.phone} • {user.city}</p>
            <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" /> Verified Diner Account
            </span>
          </div>
        </div>
      </div>

      {/* Bookings & Orders History Grid */}
      <div className="space-y-8">
        <div>
          <h3 className="font-extrabold text-forest-900 text-xl mb-4">My Table Reservations & Pre-Orders</h3>
          
          {history.bookings && history.bookings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {history.bookings.map((b) => (
                <div key={b._id} className="bg-white rounded-3xl p-5 shadow-sm border border-sand-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-sand-200 pb-3">
                    <div>
                      <span className="text-xs font-extrabold text-forest-800 bg-sand-100 px-3 py-1 rounded-full border border-sand-200">
                        {b.bookingId}
                      </span>
                      <h4 className="font-bold text-slate-800 text-base mt-2">{b.restaurantId?.name || 'Restaurant'}</h4>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full uppercase">
                      {b.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div>
                      <p className="text-[11px] text-slate-400">Date & Slot</p>
                      <p className="font-bold">{b.bookingDate} ({b.timeSlot})</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400">Assigned Table</p>
                      <p className="font-bold text-terracotta-600">{b.tableNumber} ({b.guestCount} guests)</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-sand-200 flex items-center justify-between text-xs">
                    <button
                      onClick={() => handleOpenReceipt(b, b.foodOrderId)}
                      className="bg-sand-100 hover:bg-sand-200 text-forest-900 font-bold px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5 text-terracotta-500" />
                      Digital Invoice
                    </button>

                    <button
                      onClick={() => handleOpenReview(b.restaurantId?._id)}
                      className="text-terracotta-600 hover:underline font-bold"
                    >
                      Rate & Review ★
                    </button>
                  </div>
                </div>
              ))}
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

    </div>
  );
}
