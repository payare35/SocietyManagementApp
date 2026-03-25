export const buildUpiLinks = ({ upiId, societyName, amount, month }) => {
  const params = new URLSearchParams({
    pa: upiId,
    pn: societyName,
    am: String(amount),
    cu: 'INR',
    tn: `Maintenance-${month}`,
  }).toString();

  return {
    gpay: `gpay://upi/pay?${params}`,
    phonepe: `phonepe://pay?${params}`,
    paytm: `paytmmp://pay?${params}`,
    generic: `upi://pay?${params}`,
  };
};
