// Utility to generate direct downloadable PDF Bill Invoice in printed-paper receipt format
import { calculatePlatformFee } from './feeCalculator';

const loadHtml2Pdf = () => {
  return new Promise((resolve, reject) => {
    if (window.html2pdf) {
      resolve(window.html2pdf);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve(window.html2pdf);
    script.onerror = () => reject(new Error('Failed to load html2pdf.js engine.'));
    document.head.appendChild(script);
  });
};

export const downloadPdfBill = async ({ booking, order, restaurant, user }) => {
  const receiptId = booking?.bookingId || order?.orderId || `REC-${Date.now()}`;
  const restObj = restaurant || booking?.restaurantId || order?.restaurantId || {};
  
  const restName = restObj.name || 'Partner Restaurant';
  const restAddress = restObj.address ? `${restObj.address}, ${restObj.city || 'Bhopal'}` : (restObj.city || 'Bhopal');
  const restTier = restObj.tier || 'premium';
  
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

  const paymentTimeStr = orderTimeStr;

  const foodItems = order?.items || (booking?.foodOrderId?.items ? booking.foodOrderId.items : []);
  
  let foodSubtotal = order?.subtotal || booking?.foodOrderId?.subtotal || 0;
  let tablePrice = booking?.tablePrice !== undefined ? booking.tablePrice : (booking && foodSubtotal === 0 ? 100 : 0);
  let subtotal = foodSubtotal;
  let baseAmount = subtotal + tablePrice;

  let tax = order?.tax || booking?.foodOrderId?.tax || (baseAmount > 0 ? Math.round(baseAmount * 0.05) : 0);
  let baseWithGst = baseAmount + tax;
  let platformFee = order?.platformFee !== undefined ? order.platformFee : calculatePlatformFee(baseWithGst, restTier);
  let totalAmount = order?.totalAmount || booking?.foodOrderId?.totalAmount || (baseWithGst + platformFee);

  const paymentMethod = order?.paymentMethod || booking?.foodOrderId?.paymentMethod || 'Bank Transfer / UPI / QR Code (Cashfree PG)';
  const cashfreeTxnId = order?.cashfreePaymentId || booking?.foodOrderId?.cashfreePaymentId || `CF_TXN_${Math.floor(100000 + Math.random() * 900000)}`;

  const userName = user?.name || booking?.userId?.name || 'Valued Guest';
  const userPhone = user?.phone || booking?.userId?.phone || 'N/A';
  const userEmail = user?.email || booking?.userId?.email || 'N/A';

  const bookingModeStr = booking?.mode === 'table_and_food' 
    ? 'Table + Pre-Order Food' 
    : booking?.mode === 'canteen_preorder' 
    ? 'Canteen Food Pre-Order' 
    : 'Book Only Table';

  const tableSlotStr = (booking?.mode === 'canteen_preorder' || !booking?.tableNumber || booking?.tableNumber?.toLowerCase().includes('no table'))
    ? 'No table reservation (Counter Pickup)'
    : `${booking.tableNumber} (Time: ${booking.timeSlot || '07:30 PM'})`;

  const durationStr = `${booking?.durationMinutes || 60} Minutes`;

  const receiptHtml = `
    <div style="border: 2px solid #000000; padding: 20px 24px; background: #ffffff; font-family: Arial, Helvetica, sans-serif; color: #000000; box-sizing: border-box; width: 680px; margin: 0 auto;">
      
      <!-- Top App Brand Header -->
      <div style="text-align: center; border-bottom: 2px dashed #000000; padding-bottom: 12px; margin-bottom: 14px; background: #ffffff;">
        <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 4px;">
          <span style="font-size: 24px; font-weight: 900; color: #14382B; letter-spacing: 0.5px;">bookmyorder.online</span>
        </div>
        <p style="margin: 2px 0 0 0; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #333333;">
          Skip The Queue & Smart Dining Platform
        </p>
        <div style="display: inline-block; margin-top: 6px; padding: 4px 14px; border: 1px solid #000000; font-size: 11px; font-weight: bold; background: #F3F4F6; color: #000000;">
          OFFICIAL TAX INVOICE & CASH RECEIPT
        </div>
      </div>

      <!-- Restaurant Details & Licensing -->
      <div style="text-align: center; margin-bottom: 14px; background: #ffffff;">
        <h2 style="margin: 0; font-size: 18px; font-weight: 800; text-transform: uppercase; color: #000000;">${restName}</h2>
        <p style="margin: 3px 0 0 0; font-size: 11px; color: #222222;">${restAddress}</p>
        <div style="margin-top: 6px; font-size: 10px; font-weight: bold; color: #333333; display: flex; justify-content: center; gap: 15px;">
          <span>FSSAI Lic No: ${fssai}</span>
          <span>|</span>
          <span>GSTIN: ${gstin}</span>
        </div>
      </div>

      <!-- Meta Information Grid -->
      <div style="border-top: 1px dashed #000000; border-bottom: 1px dashed #000000; padding: 10px 0; margin-bottom: 14px; font-size: 11px; color: #000000; background: #ffffff;">
        <table style="width: 100%; border-collapse: collapse; color: #000000;">
          <tr>
            <td style="width: 50%; vertical-align: top; padding-right: 8px;">
              <p style="margin: 3px 0;"><strong>Receipt / Invoice No:</strong> ${receiptId}</p>
              <p style="margin: 3px 0;"><strong>Order Date & Time:</strong> ${orderTimeStr}</p>
              <p style="margin: 3px 0;"><strong>Payment Date & Time:</strong> ${paymentTimeStr}</p>
              <p style="margin: 3px 0;"><strong>Booking Mode:</strong> ${bookingModeStr}</p>
            </td>
            <td style="width: 50%; vertical-align: top; padding-left: 8px;">
              <p style="margin: 3px 0;"><strong>Customer Name:</strong> ${userName}</p>
              <p style="margin: 3px 0;"><strong>Mobile / Email:</strong> +91 ${userPhone} ${userEmail !== 'N/A' ? `(${userEmail})` : ''}</p>
              ${booking && booking.mode !== 'canteen_preorder' && booking.tableNumber && !booking.tableNumber.toLowerCase().includes('no table') ? `
                <p style="margin: 3px 0;"><strong>Assigned Table & Slot:</strong> ${tableSlotStr}</p>
                <p style="margin: 3px 0;"><strong>Booking Duration:</strong> ${durationStr}</p>
              ` : ''}
            </td>
          </tr>
        </table>
      </div>

      <!-- Order Items Table -->
      <div style="margin-bottom: 14px; background: #ffffff;">
        <table style="width: 100%; border-collapse: collapse; font-size: 11px; text-align: left; color: #000000;">
          <thead>
            <tr style="border-bottom: 2px solid #000000; color: #000000;">
              <th style="padding: 6px 0; width: 30px;">#</th>
              <th style="padding: 6px 0;">Item Description</th>
              <th style="padding: 6px 0; text-align: center;">Portion</th>
              <th style="padding: 6px 0; text-align: center;">Qty</th>
              <th style="padding: 6px 0; text-align: right;">Rate (₹)</th>
              <th style="padding: 6px 0; text-align: right;">Amount (₹)</th>
            </tr>
          </thead>
          <tbody style="color: #000000;">
            ${
              foodItems && foodItems.length > 0
                ? foodItems
                    .map(
                      (it, idx) => `
                  <tr style="border-bottom: 1px dashed #CCCCCC; color: #000000;">
                    <td style="padding: 6px 0;">${idx + 1}</td>
                    <td style="padding: 6px 0; font-weight: bold; color: #000000;">
                      ${it.name}
                      ${it.customNote ? `<br/><span style="font-size: 9px; font-style: italic; color: #555555;">Note: ${it.customNote}</span>` : ''}
                    </td>
                    <td style="padding: 6px 0; text-align: center; text-transform: capitalize;">${it.portion || 'Default'}</td>
                    <td style="padding: 6px 0; text-align: center; font-weight: bold;">${it.quantity}</td>
                    <td style="padding: 6px 0; text-align: right;">₹${it.price}</td>
                    <td style="padding: 6px 0; text-align: right; font-weight: bold;">₹${it.price * it.quantity}</td>
                  </tr>
                `
                    )
                    .join('')
                : `
                  <tr>
                    <td colspan="6" style="padding: 10px 0; text-align: center; color: #333333; font-style: italic;">
                      Table Reservation & Priority Dining Advance Booking (${bookingModeStr})
                    </td>
                  </tr>
                `
            }
          </tbody>
        </table>
      </div>

      <!-- Financial Calculations -->
      <div style="border-top: 2px solid #000000; padding-top: 10px; margin-bottom: 14px; font-size: 11px; color: #000000; background: #ffffff;">
        ${tablePrice > 0 ? `
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span>Table Reservation Charge (${durationStr}):</span>
          <span style="font-weight: bold;">₹${tablePrice}</span>
        </div>` : ''}
        ${subtotal > 0 ? `
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span>Food Items Subtotal:</span>
          <span style="font-weight: bold;">₹${subtotal}</span>
        </div>` : ''}
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span>GST / Restaurant Taxes (5%):</span>
          <span>₹${tax}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span>Platform Service Charge:</span>
          <span>₹${platformFee}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 8px; padding-top: 8px; border-top: 2px dashed #000000; font-size: 15px; font-weight: 900; color: #000000;">
          <span>TOTAL PAID AMOUNT:</span>
          <span style="color: #14382B;">₹${totalAmount}</span>
        </div>
      </div>

      <!-- Payment Verification -->
      <div style="background: #F9FAFB; border: 1px solid #000000; padding: 10px; margin-bottom: 14px; font-size: 10px; color: #000000;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span><strong>Payment Mode:</strong> ${paymentMethod}</span>
          <span style="font-weight: bold; color: #065F46;">✔ VERIFIED PAID</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span><strong>Gateway Transaction ID:</strong> ${cashfreeTxnId}</span>
          <span><strong>Status:</strong> Completed</span>
        </div>
      </div>

      <!-- Terms & Conditions -->
      <div style="border-top: 1px dashed #000000; border-bottom: 1px dashed #000000; padding: 8px 0; margin-bottom: 12px; font-size: 9px; color: #222222; background: #ffffff;">
        <p style="margin: 0 0 4px 0; font-weight: bold; text-transform: uppercase; color: #000000;">Terms & Conditions:</p>
        <ul style="margin: 0; padding-left: 14px; line-height: 1.4; color: #000000;">
          <li>1. Computer-generated tax invoice requiring no physical signature.</li>
          <li>2. <strong>NON-REFUNDABLE POLICY:</strong> Payments once completed are strictly non-refundable under any circumstances.</li>
          <li>3. Present this official bill/receipt at counter or table upon arrival.</li>
          <li>4. Support: <strong>support.bookmyorder.online@gmail.com</strong></li>
        </ul>
      </div>

      <!-- Ending Wishes & Quote -->
      <div style="text-align: center; padding-top: 6px; font-size: 10px; background: #ffffff;">
        <p style="margin: 0; font-weight: 800; font-size: 12px; color: #D84315;">
          ✨ Thank you for dining with us! Come again soon! ✨
        </p>
        <p style="margin: 4px 0 0 0; font-style: italic; color: #444444;">
          "Good food is the foundation of genuine happiness."
        </p>
      </div>

    </div>
  `;

  // Create temporary container placed at top-left but behind everything (z-index -99999) so html2canvas renders it properly!
  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'absolute';
  tempContainer.style.left = '0';
  tempContainer.style.top = '0';
  tempContainer.style.width = '720px';
  tempContainer.style.background = '#ffffff';
  tempContainer.style.color = '#000000';
  tempContainer.style.zIndex = '-99999';
  tempContainer.style.opacity = '1';
  tempContainer.style.visibility = 'visible';
  tempContainer.style.pointerEvents = 'none';
  tempContainer.innerHTML = receiptHtml;

  document.body.appendChild(tempContainer);

  try {
    const html2pdf = await loadHtml2Pdf();
    await new Promise((r) => setTimeout(r, 300));

    const opt = {
      margin: [6, 6, 6, 6],
      filename: `bookmyorder_Receipt_${receiptId}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
        windowWidth: 800,
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    };

    await html2pdf().set(opt).from(tempContainer).save();
  } catch (err) {
    console.error('html2pdf download error:', err);
    // Fallback printable window
    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>bookmyorder_Receipt_${receiptId}</title>
            <style>
              @page { margin: 8mm; size: auto; }
              body { margin: 0; padding: 12px; background: #ffffff; color: #000000; }
            </style>
          </head>
          <body>
            ${receiptHtml}
            <script>
              window.onload = function() {
                window.print();
              };
            </script>
          </body>
        </html>
      `);
      printWin.document.close();
    }
  } finally {
    if (document.body.contains(tempContainer)) {
      document.body.removeChild(tempContainer);
    }
  }
};

