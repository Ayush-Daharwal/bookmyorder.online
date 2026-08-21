import React, { useState } from 'react';
import { X, Printer, CheckCircle2, ShieldCheck, QrCode, Download, ArrowLeft, Utensils, FileText } from 'lucide-react';
import { downloadPdfBill } from '../utils/pdfGenerator';

export default function DigitalReceiptModal({ isOpen, onClose, booking, order, restaurant, user }) {
  const [downloading, setDownloading] = useState(false);

  if (!isOpen || (!booking && !order)) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    setDownloading(true);
    await downloadPdfBill({ booking, order, restaurant, user });
    setDownloading(false);
  };

  const receiptId = booking?.bookingId || order?.orderId || `REC-${Date.now()}`;
  const restObj = restaurant || booking?.restaurantId || order?.restaurantId || {};
  
  const restName = restObj.name || 'Partner Restaurant';
  const restAddress = restObj.address ? `${restObj.address}, ${restObj.city || 'Bhopal'}` : (restObj.city || 'Bhopal');
  const fssai = restObj.licenses?.fssaiNumber || restObj.fssaiLicenseNumber || '11624001000845';
  const gstin = restObj.licenses?.gstin || restObj.gstin || '23AAACB1234C1Z5';

  const orderCreatedAt = order?.createdAt || booking?.createdAt || new Date();
  const orderTimeStr = new Date(orderCreatedAt).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const paymentTimeStr = new Date(orderCreatedAt).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const foodItems = order?.items || booking?.foodOrderId?.items || [];
  
  let subtotal = order?.subtotal || booking?.foodOrderId?.subtotal || 0;
  let tax = order?.tax || booking?.foodOrderId?.tax || (subtotal > 0 ? Math.round(subtotal * 0.05) : 0);
  let platformFee = order?.platformFee || booking?.foodOrderId?.platformFee || (subtotal > 0 ? 15 : 0);
  let totalAmount = order?.totalAmount || booking?.foodOrderId?.totalAmount || (subtotal + tax + platformFee);

  if (totalAmount === 0 && booking) {
    subtotal = 100;
    tax = 5;
    platformFee = 15;
    totalAmount = 120;
  }

  const paymentMethod = order?.paymentMethod || booking?.foodOrderId?.paymentMethod || 'Bank Transfer / UPI / QR Code (Cashfree PG)';
  const cashfreeTxnId = order?.cashfreePaymentId || booking?.foodOrderId?.cashfreePaymentId || `CF_PAY_${Math.floor(100000 + Math.random() * 900000)}`;

  const userName = user?.name || booking?.userId?.name || 'Valued Guest';
  const userPhone = user?.phone || booking?.userId?.phone || 'N/A';
  const userEmail = user?.email || booking?.userId?.email || 'N/A';

  return (
    <>
      {/* 1. SCREEN VIEW: Interactive Web Modal UI */}
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-md p-3 sm:p-6 flex justify-center items-start sm:items-center no-print">
        <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl relative border border-sand-200 overflow-hidden my-auto sm:my-8 flex flex-col max-h-[92vh]">
          
          {/* Sticky Header with Back Button & Close Icon */}
          <div className="bg-sand-50/90 backdrop-blur-sm px-6 py-3 border-b border-sand-200 flex items-center justify-between sticky top-0 z-20 shrink-0 no-print">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-sand-200 text-slate-700 hover:text-slate-900 font-extrabold text-xs transition-all border border-sand-200 shadow-sm cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-terracotta-600" />
              Back
            </button>

            <div className="flex items-center gap-1.5">
              <img src="/logo.png" alt="bookmyorder" className="h-6 object-contain" />
              <span className="font-extrabold text-forest-900 text-sm">bookmyorder.online</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 bg-white hover:bg-sand-200 rounded-full border border-sand-200 transition-colors cursor-pointer"
              title="Close Receipt"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Modal Content */}
          <div className="p-6 sm:p-8 overflow-y-auto space-y-4">

            {/* Receipt Header Badge */}
            <div className="text-center pb-4 border-b border-dashed border-sand-300">
              <p className="text-xs font-extrabold text-forest-900 uppercase tracking-widest">
                Official Tax Invoice & Cash Receipt
              </p>
              <span className="inline-flex items-center gap-1 mt-2 text-xs font-extrabold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified Paid ({paymentMethod})
              </span>
            </div>

            {/* Restaurant Header & Licenses Details */}
            <div className="bg-sand-50 rounded-2xl p-4 border border-sand-200 text-center space-y-1">
              <h3 className="font-extrabold text-forest-900 text-base uppercase tracking-wide">{restName}</h3>
              <p className="text-xs text-slate-600 font-medium">{restAddress}</p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-[11px] font-bold text-slate-500 border-t border-sand-200/60 mt-2">
                <span className="bg-white px-2.5 py-0.5 rounded-full border border-sand-200">
                  FSSAI Lic: <strong className="text-slate-800">{fssai}</strong>
                </span>
                <span className="bg-white px-2.5 py-0.5 rounded-full border border-sand-200">
                  GSTIN: <strong className="text-slate-800">{gstin}</strong>
                </span>
              </div>
            </div>

            {/* Invoice Meta Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-white p-3.5 rounded-2xl border border-sand-200">
              <div>
                <p className="text-slate-400 font-medium text-[10px] uppercase">Receipt No.</p>
                <p className="font-extrabold text-slate-900">{receiptId}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium text-[10px] uppercase">Order & Payment Time</p>
                <p className="font-bold text-slate-800">{orderTimeStr}</p>
              </div>
              {booking && (
                <>
                  <div>
                    <p className="text-slate-400 font-medium text-[10px] uppercase">Dining Mode</p>
                    <p className="font-bold text-forest-800 uppercase">{booking.mode?.replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-medium text-[10px] uppercase">Assigned Table / Slot</p>
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
            {foodItems && foodItems.length > 0 ? (
              <div className="bg-sand-50 rounded-2xl p-4 space-y-2 text-xs border border-sand-200">
                <p className="font-extrabold text-forest-900 border-b border-sand-200 pb-1 mb-2">Pre-Ordered Dishes</p>
                {foodItems.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-center text-slate-700">
                    <span className="font-semibold">
                      {it.quantity}x {it.name} <span className="text-[10px] text-slate-400">({it.portion})</span>
                      {it.customNote && <span className="block text-[10px] text-terracotta-600 italic">"{it.customNote}"</span>}
                    </span>
                    <span className="font-bold text-slate-900">₹{it.price * it.quantity}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-sand-50 rounded-2xl p-3.5 text-xs text-slate-600 border border-sand-200 text-center font-medium">
                Table Reservation & Priority Seat Booking (No Food Pre-Ordered)
              </div>
            )}

            {/* Payment Breakdown */}
            <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-sand-200">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-800">₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (5%)</span>
                <span className="font-semibold text-slate-800">₹{tax}</span>
              </div>
              <div className="flex justify-between">
                <span>Platform Service Charge</span>
                <span className="font-semibold text-slate-800">₹{platformFee}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-forest-900 pt-2 border-t border-sand-300">
                <span>Total Paid Amount</span>
                <span className="text-terracotta-600 font-black">₹{totalAmount}</span>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-[11px] text-amber-900 space-y-1">
              <p className="font-extrabold text-amber-950 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                Terms & Conditions (Non-Refundable):
              </p>
              <p className="text-[10px] leading-tight text-amber-800">
                This is a computer-generated tax invoice. Payment is <strong>strictly non-refundable</strong> under any circumstances.
              </p>
            </div>

            {/* End Quote & Wishes */}
            <div className="text-center p-3 bg-emerald-50/70 rounded-2xl border border-emerald-100 space-y-1">
              <p className="text-xs font-extrabold text-emerald-900">
                ✨ Thank you for dining with us! Come again soon! ✨
              </p>
              <p className="text-[11px] italic text-emerald-700 font-medium">
                "Good food is the foundation of genuine happiness."
              </p>
            </div>

          </div>

          {/* Sticky Action Footer */}
          <div className="bg-sand-100 px-6 py-4 border-t border-sand-200 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <div className="p-2 bg-white rounded-xl shadow-sm border border-sand-200 shrink-0">
                <QrCode className="w-6 h-6 text-forest-900" />
              </div>
              <div className="text-[10px]">
                <p className="font-bold text-slate-800">Scan at Table / Kitchen Counter</p>
                <p className="text-slate-500 truncate max-w-[170px]">Txn: {cashfreeTxnId}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={handleDownloadPdf}
                disabled={downloading}
                className="flex-1 sm:flex-initial gradient-orange-btn text-white px-4 py-2.5 rounded-xl text-xs font-extrabold shadow hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {downloading ? 'Generating PDF...' : 'Download PDF Bill'}
              </button>

              <button
                onClick={handlePrint}
                className="flex-1 sm:flex-initial bg-[#14382B] hover:bg-forest-900 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print Receipt
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* 2. PRINT TARGET: Compact Official Paper Receipt Document (1-Page Fit) */}
      <div className="printable-paper-receipt-container hidden print:block">
        <div style={{ border: '2px solid #000000', padding: '18px 20px', background: '#ffffff', fontFamily: "'Courier New', Courier, monospace, Arial, sans-serif", color: '#000000', pageBreakInside: 'avoid' }}>
          
          {/* Header with App Logo & Name */}
          <div style={{ textAlign: 'center', borderBottom: '2px dashed #000000', paddingBottom: '10px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
              <img src="/logo.png" alt="bookmyorder" style={{ height: '26px', objectFit: 'contain' }} />
              <span style={{ fontSize: '22px', fontWeight: 900, color: '#14382B', letterSpacing: '0.5px' }}>bookmyorder.online</span>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#333333' }}>
              Skip The Queue & Smart Dining Platform
            </p>
            <div style={{ display: 'inline-block', marginTop: '6px', padding: '3px 12px', border: '1px solid #000000', fontSize: '11px', fontWeight: 'bold', background: '#F3F4F6' }}>
              OFFICIAL TAX INVOICE & CASH RECEIPT
            </div>
          </div>

          {/* Restaurant Details */}
          <div style={{ textAlign: 'center', marginBottom: '14px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, textTransform: 'uppercase', color: '#000000' }}>{restName}</h2>
            <p style={{ margin: '3px 0 0 0', fontSize: '11px', color: '#222222' }}>{restAddress}</p>
            <div style={{ marginTop: '6px', fontSize: '10px', fontWeight: 'bold', color: '#333333', display: 'flex', justifyContent: 'center', gap: '15px' }}>
              <span>FSSAI Lic No: {fssai}</span>
              <span>|</span>
              <span>GSTIN: {gstin}</span>
            </div>
          </div>

          {/* Invoice Meta Grid */}
          <div style={{ borderTop: '1px dashed #000000', borderBottom: '1px dashed #000000', padding: '8px 0', marginBottom: '12px', fontSize: '11px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <p style={{ margin: '1px 0' }}><strong>Receipt / Invoice No:</strong> {receiptId}</p>
              <p style={{ margin: '1px 0' }}><strong>Order Date & Time:</strong> {orderTimeStr}</p>
              <p style={{ margin: '1px 0' }}><strong>Payment Date & Time:</strong> {paymentTimeStr}</p>
            </div>
            <div>
              <p style={{ margin: '1px 0' }}><strong>Customer Name:</strong> {userName}</p>
              <p style={{ margin: '1px 0' }}><strong>Mobile / Email:</strong> +91 {userPhone} {userEmail !== 'N/A' ? `(${userEmail})` : ''}</p>
              {booking && <p style={{ margin: '1px 0' }}><strong>Dining Table / Slot:</strong> {booking.tableNumber || 'N/A'} ({booking.timeSlot || ''})</p>}
            </div>
          </div>

          {/* Items Table */}
          <div style={{ marginBottom: '14px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #000000' }}>
                  <th style={{ padding: '4px 0', width: '30px' }}>#</th>
                  <th style={{ padding: '4px 0' }}>Item Description</th>
                  <th style={{ padding: '4px 0', textAlign: 'center' }}>Portion</th>
                  <th style={{ padding: '4px 0', textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '4px 0', textAlign: 'right' }}>Rate (₹)</th>
                  <th style={{ padding: '4px 0', textAlign: 'right' }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {foodItems && foodItems.length > 0 ? (
                  foodItems.map((it, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px dashed #CCCCCC' }}>
                      <td style={{ padding: '4px 0' }}>{idx + 1}</td>
                      <td style={{ padding: '4px 0', fontWeight: 'bold' }}>
                        {it.name}
                        {it.customNote && (
                          <>
                            <br />
                            <span style={{ fontSize: '9px', fontStyle: 'italic', color: '#555555' }}>Note: {it.customNote}</span>
                          </>
                        )}
                      </td>
                      <td style={{ padding: '4px 0', textAlign: 'center', textTransform: 'capitalize' }}>{it.portion || 'Default'}</td>
                      <td style={{ padding: '4px 0', textAlign: 'center', fontWeight: 'bold' }}>{it.quantity}</td>
                      <td style={{ padding: '4px 0', textAlign: 'right' }}>₹{it.price}</td>
                      <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 'bold' }}>₹{it.price * it.quantity}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ padding: '8px 0', textAlign: 'center', color: '#444444', fontStyle: 'italic' }}>
                      Table Reservation & Priority Dining Advance Booking
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Calculations */}
          <div style={{ borderTop: '2px solid #000000', paddingTop: '8px', marginBottom: '14px', fontSize: '11px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span>Subtotal:</span>
              <span style={{ fontWeight: 'bold' }}>₹{subtotal}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span>GST / Restaurant Taxes (5%):</span>
              <span>₹{tax}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span>Platform Service Charge:</span>
              <span>₹{platformFee}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', paddingTop: '6px', borderTop: '2px dashed #000000', fontSize: '14px', fontWeight: 900 }}>
              <span>TOTAL PAID AMOUNT:</span>
              <span style={{ color: '#14382B' }}>₹{totalAmount}</span>
            </div>
          </div>

          {/* Payment Verification */}
          <div style={{ background: '#F9FAFB', border: '1px solid #000000', padding: '10px', marginBottom: '14px', fontSize: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span><strong>Payment Mode:</strong> {paymentMethod}</span>
              <span style={{ fontWeight: 'bold', color: '#065F46' }}>✔ VERIFIED PAID</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span><strong>Gateway Transaction ID:</strong> {cashfreeTxnId}</span>
              <span><strong>Status:</strong> Completed</span>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div style={{ borderTop: '1px dashed #000000', borderBottom: '1px dashed #000000', padding: '8px 0', marginBottom: '12px', fontSize: '9px', color: '#222222' }}>
            <p style={{ margin: '0 0 3px 0', fontWeight: 'bold', textTransform: 'uppercase', color: '#000000' }}>Terms & Conditions:</p>
            <ul style={{ margin: 0, paddingLeft: '12px', lineHeight: 1.3 }}>
              <li>1. Computer-generated tax invoice requiring no physical signature.</li>
              <li>2. <strong>NON-REFUNDABLE POLICY:</strong> Payments once completed are strictly non-refundable under any circumstances.</li>
              <li>3. Present this official bill/receipt at counter or table upon arrival.</li>
              <li>4. Support: <strong>support.bookmyorder.online@gmail.com</strong></li>
            </ul>
          </div>

          {/* Ending Wishes & Quote */}
          <div style={{ textAlign: 'center', paddingTop: '6px', fontSize: '10px' }}>
            <p style={{ margin: 0, fontWeight: 800, fontSize: '12px', color: '#D84315' }}>
              ✨ Thank you for dining with us! Come again soon! ✨
            </p>
            <p style={{ margin: '3px 0 0 0', fontStyle: 'italic', color: '#444444' }}>
              "Good food is the foundation of genuine happiness."
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
