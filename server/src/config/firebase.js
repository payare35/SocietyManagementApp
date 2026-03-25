import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import dotenv from 'dotenv';

dotenv.config();

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  // Production (Netlify): service account JSON stored as an env var string.
  // Normalize private_key: Netlify's env UI sometimes stores \n as two characters
  // instead of a real newline, which breaks RSA signing. This handles both cases.
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }
} else {
  // Local development: read from file.
  // process.cwd() is the server/ directory when running via `node src/index.js`.
  const serviceAccountPath = resolve(
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json'
  );
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
}

if (!admin.apps.length) {
  const appConfig = { credential: admin.credential.cert(serviceAccount) };
  if (process.env.FIREBASE_STORAGE_BUCKET) {
    appConfig.storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
  }
  admin.initializeApp(appConfig);
}

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();
export default admin;
