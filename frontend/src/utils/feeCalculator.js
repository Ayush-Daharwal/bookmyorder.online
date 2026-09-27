/**
 * Platform Fee Calculation Helper
 * 
 * For Casual and Premium/Luxury restaurants:
 * - Grand total including GST <= 100: Fee = 0
 * - 100 < Grand total <= 500: Fee = 15
 * - 500 < Grand total <= 1000: Fee = 20
 * - Grand total > 1000: Fee = 2% rounded down to nearest floor integer (e.g. 22.4 -> 22)
 * 
 * For Canteen tier:
 * - Total <= 50: Free (0)
 * - 50 < Total <= 200: 1% rounded down (>= 0, e.g. 0.4 -> 0)
 * - 200 < Total <= 500: 5
 * - Total > 500: 1.5% exact rounded down to nearest integer
 * 
 * DO NOT display formula breakdowns or 2%/1.5% rules to the user in the UI.
 */
export const calculatePlatformFee = (baseWithGst, tier = 'premium') => {
  const amount = Number(baseWithGst) || 0;
  if (amount <= 0) return 0;

  if (tier === 'canteen') {
    if (amount <= 50) return 0;
    if (amount <= 200) {
      const fee = Math.floor(amount * 0.01);
      return Math.max(0, fee);
    }
    if (amount <= 500) return 5;
    return Math.floor(amount * 0.015);
  } else {
    // Casual, Premium, Luxury
    if (amount <= 100) return 0;
    if (amount <= 500) return 15;
    if (amount <= 1000) return 20;
    return Math.floor(amount * 0.02);
  }
};
