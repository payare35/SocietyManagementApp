import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeDueAmount } from './dueAmount.js';

test('MNT-U-01 default rate single flat', () => {
  const r = computeDueAmount({ flatNumber: '501' }, 1500);
  assert.equal(r.ratePerFlat, 1500);
  assert.equal(r.flatCount, 1);
  assert.equal(r.amount, 1500);
});

test('MNT-U-02 override rate single flat', () => {
  const r = computeDueAmount({ flatNumber: 'Shop', monthlyMaintenanceAmount: 500 }, 1500);
  assert.equal(r.ratePerFlat, 500);
  assert.equal(r.amount, 500);
});

test('MNT-U-03 override multi-flat', () => {
  const r = computeDueAmount({ flatNumber: '501, 502', monthlyMaintenanceAmount: 500 }, 1500);
  assert.equal(r.flatCount, 2);
  assert.equal(r.amount, 1000);
});

test('MNT-U-04 no override multi-flat', () => {
  const r = computeDueAmount({ flatNumber: '501, 502, 503' }, 1100);
  assert.equal(r.amount, 3300);
});

test('MNT-U-05 missing override uses config', () => {
  const r = computeDueAmount({ flatNumber: '101' }, 1200);
  assert.equal(r.ratePerFlat, 1200);
});

test('MNT-U-06 zero override is honored (nullish only fallback)', () => {
  const r = computeDueAmount({ flatNumber: 'Shop', monthlyMaintenanceAmount: 0 }, 1500);
  assert.equal(r.ratePerFlat, 0);
  assert.equal(r.amount, 0);
});

test('MNT-U-07 override higher than default', () => {
  const r = computeDueAmount({ flatNumber: '501', monthlyMaintenanceAmount: 3000 }, 1500);
  assert.equal(r.amount, 3000);
});
