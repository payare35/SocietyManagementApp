import { test } from 'node:test';
import assert from 'node:assert/strict';
import { countFlats } from './flatUtils.js';

test('countFlats single flat', () => {
  assert.equal(countFlats('501'), 1);
  assert.equal(countFlats('A-101'), 1);
});

test('countFlats comma-separated', () => {
  assert.equal(countFlats('501, 502'), 2);
  assert.equal(countFlats('501,502,503'), 3);
});

test('countFlats empty falls back to 1', () => {
  assert.equal(countFlats(''), 1);
  assert.equal(countFlats(null), 1);
});
