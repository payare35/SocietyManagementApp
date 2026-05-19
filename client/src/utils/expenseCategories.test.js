import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  EXPENSE_ITEMS,
  cascaderPathToExpense,
  resolveExpenseType,
  getExpenseDisplayLabel,
  getExpenseCascaderOptions,
  expenseToCascaderPath,
} from './expenseCategories.js';

test('EXP-U-01/02 cascader paths', () => {
  const lift = cascaderPathToExpense(['Repair', '__group__Lift Repair', 'Lift Repair — Electrical']);
  assert.equal(lift.type, 'Repair');
  assert.equal(lift.subType, 'Lift Repair — Electrical');
  const salary = cascaderPathToExpense(['Maintenance', 'Salary']);
  assert.equal(salary.type, 'Maintenance');
  assert.equal(salary.subType, 'Salary');
});

test('EXP-U-03 repair standalone', () => {
  const r = cascaderPathToExpense(['Repair', 'Plumbing']);
  assert.equal(r.type, 'Repair');
  assert.equal(r.subType, 'Plumbing');
});

test('EXP-U-04 rollup-only Event', () => {
  const r = cascaderPathToExpense(['Event']);
  assert.equal(r.type, 'Event');
  assert.equal(r.subType, null);
});

test('EXP-U-05 empty path', () => {
  assert.deepEqual(cascaderPathToExpense([]), { type: null, subType: null });
  assert.deepEqual(cascaderPathToExpense(null), { type: null, subType: null });
  assert.deepEqual(cascaderPathToExpense(undefined), { type: null, subType: null });
});

test('EXP-U-06 stopped at group node', () => {
  const r = cascaderPathToExpense(['Repair', '__group__Lift Repair']);
  assert.equal(r.type, null);
  assert.equal(r.subType, null);
});

test('EXP-U-07/08 resolveExpenseType', () => {
  assert.equal(resolveExpenseType('Lift AMC'), 'Maintenance');
  assert.equal(resolveExpenseType('Unknown'), null);
});

test('EXP-U-09/10/11 display labels', () => {
  assert.equal(getExpenseDisplayLabel({ type: 'Maintenance', subType: 'Lift AMC' }), 'Lift AMC');
  assert.equal(getExpenseDisplayLabel({ type: 'Utility' }), 'Utility');
  assert.equal(getExpenseDisplayLabel(null), '—');
});

test('EXP-U-12 expenseToCascaderPath grouped', () => {
  const path = expenseToCascaderPath({
    type: 'Repair',
    subType: 'Lift Repair — Part Replacement',
  });
  assert.deepEqual(path, ['Repair', '__group__Lift Repair', 'Lift Repair — Part Replacement']);
});

test('EXP-U-13 all EXPENSE_ITEMS resolve', () => {
  for (const item of EXPENSE_ITEMS) {
    assert.equal(resolveExpenseType(item.subType), item.type);
  }
});

test('EXP-U-14 cascader options structure', () => {
  const opts = getExpenseCascaderOptions();
  const labels = opts.map((o) => o.label);
  assert.ok(labels.includes('Maintenance'));
  assert.ok(labels.includes('Repair'));
  assert.ok(labels.includes('Event'));
  const repair = opts.find((o) => o.value === 'Repair');
  const liftGroup = repair.children.find((c) => c.value === '__group__Lift Repair');
  assert.equal(liftGroup.children.length, 2);
});
