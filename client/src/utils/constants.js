export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  REJECTED: 'rejected',
};

export const TRANSACTION_TYPES = ['maintenance', 'penalty', 'other'];

export const DUE_STATUS = {
  UNPAID: 'unpaid',
  PAID: 'paid',
  PARTIAL: 'partial',
};

export const STATUS_COLORS = {
  confirmed: 'green',
  pending: 'orange',
  rejected: 'red',
  paid: 'green',
  unpaid: 'red',
  partial: 'orange',
  active: 'green',
  inactive: 'default',
};

export const EXPENSE_TYPES = ['Maintenance', 'Repair', 'Event', 'Utility', 'Other'];

export const EXPENSE_TYPE_COLORS = {
  Maintenance: 'blue',
  Repair: 'orange',
  Event: 'purple',
  Utility: 'cyan',
  Other: 'default',
};
