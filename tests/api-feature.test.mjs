/**
 * API integration tests (no browser) — requires local Firebase Admin + running API on :5001
 * Run: node --test tests/api-feature.test.mjs
 */
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}

const root = process.cwd();
loadEnvFile(resolve(root, 'client/.env'));
loadEnvFile(resolve(root, 'server/.env'));
if (!process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH = resolve(root, 'server/serviceAccountKey.json');
}
process.chdir(resolve(root, 'server'));

const API = process.env.E2E_API_URL || 'http://localhost:5001/api';
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'payare35@gmail.com';
const API_KEY = process.env.VITE_FIREBASE_API_KEY;

let adminToken = null;
let configMonthly = null;

async function getAdminIdToken() {
  const { auth, db } = await import('../server/src/config/firebase.js');
  let uid;
  try {
    const user = await auth.getUserByEmail(ADMIN_EMAIL);
    uid = user.uid;
  } catch {
    const adminSnap = await db.collection('members').where('role', '==', 'admin').limit(1).get();
    if (adminSnap.empty) throw new Error('No admin user in Firestore members collection');
    uid = adminSnap.docs[0].id;
  }
  const customToken = await auth.createCustomToken(uid);
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    }
  );
  const data = await res.json();
  if (!data.idToken) throw new Error(data.error?.message || 'Failed to get id token');
  return data.idToken;
}

async function api(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

before(async () => {
  if (!API_KEY) throw new Error('VITE_FIREBASE_API_KEY missing in client/.env');
  adminToken = await getAdminIdToken();
  const cfg = await api('GET', '/config');
  assert.equal(cfg.status, 200, 'config fetch');
  configMonthly = cfg.json.data?.monthlyMaintenanceAmount;
  assert.ok(configMonthly > 0, 'society maintenance configured');
});

test('DUE-API-01 create expense with subType', async () => {
  const { status, json } = await api('POST', '/expenses', {
    title: `API Test ${Date.now()}`,
    type: 'Maintenance',
    subType: 'Salary',
    amount: 100,
    date: new Date().toISOString(),
  });
  assert.equal(status, 201);
  assert.equal(json.data.subType, 'Salary');
  assert.equal(json.data.type, 'Maintenance');
});

test('DUE-API-02 transaction note on admin payment', async () => {
  const members = await api('GET', '/members?limit=5');
  const member = members.json.data?.data?.[0];
  assert.ok(member, 'need at least one member');
  const month = new Date().toISOString().slice(0, 7);
  const note = `E2E API note ${Date.now()}`;
  const { status, json } = await api('POST', '/transactions', {
    memberId: member.uid || member.id,
    amount: 100,
    type: 'maintenance',
    month,
    note,
  });
  assert.equal(status, 201);
  assert.equal(json.data.note, note);
});

test('MNT-API-01 generate dues uses member override', async () => {
  const contact = `9${Date.now().toString().slice(-9)}`;
  const override = Math.max(100, Math.floor(configMonthly / 4));
  const create = await api('POST', '/members', {
    name: `API Shop ${Date.now()}`,
    flatNumber: 'Shop-API',
    contactNumber: contact,
    password: 'ApiTest@123456',
    role: 'member',
    monthlyMaintenanceAmount: override,
  });
  assert.equal(create.status, 201, JSON.stringify(create.json));

  const month = new Date().toISOString().slice(0, 7);
  const gen = await api('POST', '/dues/generate', { month });
  assert.ok([200, 201].includes(gen.status), JSON.stringify(gen.json));

  const dues = await api('GET', `/dues?month=${month}&limit=100`);
  assert.equal(dues.status, 200);
  const row = dues.json.data?.data?.find((d) => d.memberName === create.json.data.name);
  assert.ok(row, 'due row exists');
  assert.equal(row.ratePerFlat, override);
  assert.equal(row.amount, override);
});
