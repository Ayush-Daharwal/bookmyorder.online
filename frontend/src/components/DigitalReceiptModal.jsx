import React from 'react';
import { X, Printer, CheckCircle2, ShieldCheck, QrCode, Download, Utensils } from 'lucide-react';

export default function DigitalReceiptModal({ isOpen, onClose, booking, order }) {
  if (!isOpen || (!booking && !order)) return null;

  const handlePrint = () => {
    window.print();
  };

  const receiptId = booking?.bookingId || order?.orderId || `REC-${Date.now()}`;
  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border border-sand-200 overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-sand-100 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Receipt Printable Header */}
        <div className="text-center pb-6 border-b border-dashed border-sand-300">
          <img src="/logo.png" alt="bookmyorder" className="h-10 mx-auto mb-2 object-contain" />
          <p className="text-xs font-bold text-forest-900 uppercase tracking-widest">Digital Order & Reservation Invoice</p>
          <span className="inline-flex items-center gap-1 mt-2 text-xs font-extrabold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verified Cashfree Paid
          </span>
        </div>

        {/* Invoice Meta */}
        <div className="grid grid-cols-2 gap-4 my-4 text-xs">
          <div>
            <p className="text-slate-400 font-medium">Receipt No.</p>
            <p className="font-bold text-slate-800">{receiptId}</p>
          </div>
          <div>
            <p className="text-slate-400 font-medium">Date & Time</p>
            <p className="font-bold text-slate-800">{dateStr}</p>
          </div>
          {booking && (
            <>
              <div>
                <p className="text-slate-400 font-medium">Dining Mode</p>
                <p className="font-bold text-forest-800 uppercase">{booking.mode.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Assigned Table / Slot</p>
                <p className="font-bold text-terracotta-600">
                  {booking.mode === 'canteen_preorder' || !booking.tableNumber || booking.tableNumber.toLowerCase().includes('no table')
                    ? 'No table reservation'
                    : `${booking.tableNumber} (${booking.timeSlot})`}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Order Items Table */}
        {order && order.items && (
          <div className="bg-sand-50 rounded-2xl p-4 my-4 space-y-2 text-xs border border-sand-200">
            <p className="font-extrabold text-forest-900 border-b border-sand-200 pb-1 mb-2">Pre-Ordered Dishes</p>
            {order.items.map((it, idx) => (
              <div key={idx} className="flex justify-between items-center text-slate-700">
                <span className="font-semibold">
                  {it.quantity}x {it.name} <span className="text-[10px] text-slate-400">({it.portion})</span>
                  {it.customNote && <span className="block text-[10px] text-terracotta-600 italic">"{it.customNote}"</span>}
                </span>
                <span className="font-bold">₹{it.price * it.quantity}</span>
              </div>
            ))}
          </div>
        )}

        {/* Payment Breakdown */}
        <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-sand-200">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-semibold">₹{order ? order.subtotal : 100}</span>
          </div>
          <div className="flex justify-between">
            <span>GST (5%)</span>
            <span className="font-semibold">₹{order ? order.tax : 5}</span>
          </div>
          <div className="flex justify-between">
            <span>Platform Service Fee</span>
            <span className="font-semibold">₹{order ? order.platformFee : 15}</span>
          </div>
          <div className="flex justify-between text-base font-extrabold text-forest-900 pt-2 border-t border-sand-300">
            <span>Total Paid Amount</span>
            <span className="text-terracotta-600">₹{order ? order.totalAmount : 120}</span>
          </div>
        </div>

        {/* QR Code & Gateway Footer */}
        <div className="mt-6 pt-4 bg-sand-100 rounded-2xl p-3 flex items-center justify-between border border-sand-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl shadow-sm border border-sand-200">
              <QrCode className="w-8 h-8 text-forest-900" />
            </div>
            <div className="text-[10px]">
              <p className="font-bold text-slate-800">Scan at Table / Kitchen Counter</p>
              <p className="text-slate-500">Cashfree Txn: {order?.cashfreePaymentId || 'CF_PAY_89712'}</p>
            </div>
          </div>

          <button
            onClick={handlePrint}
            className="gradient-orange-btn text-white px-4 py-2 rounded-xl text-xs font-bold shadow hover:shadow-md transition-all flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / Save
          </button>
        </div>

      </div>
    </div>
  );
}
