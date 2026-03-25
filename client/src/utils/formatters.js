import dayjs from 'dayjs';

export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount));
};

const toDate = (value) => {
  if (!value) return null;
  // Firestore Timestamp with toDate()
  if (typeof value?.toDate === 'function') return value.toDate();
  // Firestore Timestamp serialised as { seconds, nanoseconds }
  if (typeof value?.seconds === 'number') return new Date(value.seconds * 1000);
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

export const formatDate = (value) => {
  const d = toDate(value);
  if (!d) return '-';
  return dayjs(d).format('DD MMM YYYY');
};

export const formatDateTime = (value) => {
  const d = toDate(value);
  if (!d) return '-';
  return dayjs(d).format('DD MMM YYYY, hh:mm A');
};

export const formatMonth = (month) => {
  if (!month || typeof month !== 'string') return '-';
  const d = dayjs(`${month}-01`);
  return d.isValid() ? d.format('MMM YYYY') : month;
};
