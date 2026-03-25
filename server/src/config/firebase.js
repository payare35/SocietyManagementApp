import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  // Production (Netlify): service account JSON stored as an env var string
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
} else {
  // Local development: read from file
  const serverDir = resolve(__dirname, '../../');
  const serviceAccountPath = resolve(
    serverDir,
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
