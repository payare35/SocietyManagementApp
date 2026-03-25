/**
 * One-time bootstrap script to create the first admin user and society config.
 *
 * Usage:
 *   node src/scripts/createFirstAdmin.js \
 *     --name "Admin Name" \
 *     --email "admin@email.com" \
 *     --password "yourpassword" \
 *     --contact "9876543210" \
 *     --flat "A-101" \
 *     --society "My Society" \
 *     --upi "society@upi" \
 *     --maintenance 2000
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serverDir = resolve(__dirname, '../../');
const serviceAccountPath = resolve(
  serverDir,
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json'
);

const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps.length) {
  const appConfig = { credential: admin.credential.cert(serviceAccount) };
  if (process.env.FIREBASE_STORAGE_BUCKET) {
    appConfig.storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
  }
  admin.initializeApp(appConfig);
}

const db = admin.firestore();
const auth = admin.auth();

const parseArgs = () => {
  const args = process.argv.slice(2);
  const result = {};
  for (let i = 0; i < args.length; i += 2) {
    result[args[i].replace('--', '')] = args[i + 1];
  }
  return result;
};

const run = async () => {
  const args = parseArgs();
  const {
    name,
    email,
    password,
    contact,
    flat = 'Admin',
    society = 'My Society',
    upi = null,
    maintenance = '2000',
  } = args;

  if (!name || !email || !password || !contact) {
    console.error('Required: --name, --email, --password, --contact');
    process.exit(1);
  }

  console.log('Creating admin user...');

  try {
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
    });

    await auth.setCustomUserClaims(userRecord.uid, { role: 'admin' });

    await db.collection('members').doc(userRecord.uid).set({
      uid: userRecord.uid,
      name,
      contactNumber: contact,
      email,
      role: 'admin',
      flatNumber: flat,
      societyId: 'default',
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await db.doc('societyConfig/config').set({
      societyName: society,
      address: '',
      monthlyMaintenanceAmount: Number(maintenance),
      expenseTypes: ['Maintenance', 'Repair', 'Event', 'Utility', 'Other'],
      upiId: upi,
      societyId: 'default',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`\nAdmin created successfully!`);
    console.log(`  UID: ${userRecord.uid}`);
    console.log(`  Email: ${email}`);
    console.log(`  Society: ${society}`);
    console.log(`\nYou can now log in with: ${email} / [your password]`);
    process.exit(0);
  } catch (err) {
    console.error('Failed:', err.message);
    process.exit(1);
  }
};

run();
