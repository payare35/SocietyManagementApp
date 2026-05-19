import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}

export async function getAdminCustomToken() {
  const root = resolve(process.cwd(), process.cwd().endsWith('server') ? '..' : '.');
  loadEnvFile(resolve(root, 'client/.env'));
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH = resolve(root, 'server/serviceAccountKey.json');
  }
  const prevCwd = process.cwd();
  process.chdir(resolve(root, 'server'));
  try {
    const { auth, db } = await import('../server/src/config/firebase.js');
    const adminSnap = await db.collection('members').where('role', '==', 'admin').limit(1).get();
    if (adminSnap.empty) throw new Error('No admin member in Firestore');
    const uid = adminSnap.docs[0].id;
    return auth.createCustomToken(uid);
  } finally {
    process.chdir(prevCwd);
  }
}
