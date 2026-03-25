import admin, { db } from '../config/firebase.js';
import { getPaginatedSlice } from '../utils/helpers.js';

const COLLECTION = 'maintenanceDues';

export const generateDues = async (month) => {
  const configDoc = await db.collection('societyConfig').doc('config').get();
  if (!configDoc.exists) throw new Error('Society config not found. Run setup first.');
  const { monthlyMaintenanceAmount } = configDoc.data();

  // Fetch all active members regardless of role — admins who are also
  // residents should have dues generated for them too.
  const membersSnap = await db
    .collection('members')
    .where('isActive', '==', true)
    .get();

  const existingSnap = await db
    .collection(COLLECTION)
    .where('month', '==', month)
    .get();
  const existingMemberIds = new Set(existingSnap.docs.map((d) => d.data().memberId));

  const batch = db.batch();
  const newDues = [];
  const [year, monthNum] = month.split('-').map(Number);
  const dueDate = new Date(year, monthNum - 1, 5);

  for (const memberDoc of membersSnap.docs) {
    const member = memberDoc.data();
    if (!existingMemberIds.has(member.uid)) {
      const dueRef = db.collection(COLLECTION).doc();
      const due = {
        id: dueRef.id,
        memberId: member.uid,
        memberName: member.name,
        flatNumber: member.flatNumber,
        month,
        amount: monthlyMaintenanceAmount,
        status: 'unpaid',
        paidAmount: 0,
        dueDate: admin.firestore.Timestamp.fromDate(dueDate),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      batch.set(dueRef, due);
      newDues.push(due);
    }
  }

  await batch.commit();
  return { generated: newDues.length, skipped: existingMemberIds.size };
};

export const getDues = async (filters = {}, page = 1, limit = 20) => {
  // Fetch all then filter in memory to avoid composite index requirements.
  // 'orderBy' alone (no WHERE) uses the auto-created single-field index.
  const snap = await db.collection(COLLECTION).orderBy('createdAt', 'desc').get();
  let docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  if (filters.month) docs = docs.filter((d) => d.month === filters.month);
  if (filters.status) docs = docs.filter((d) => d.status === filters.status);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    docs = docs.filter(
      (d) =>
        d.memberName?.toLowerCase().includes(q) ||
        d.flatNumber?.toLowerCase().includes(q)
    );
  }

  const total = docs.length;
  const data = getPaginatedSlice(docs, page, limit);
  return { data, total, page: parseInt(page, 10), limit: parseInt(limit, 10) };
};

export const getMyDues = async (memberId, page = 1, limit = 20) => {
  // Use single equality WHERE only — no orderBy — to avoid composite index requirement.
  // Sort by month descending in memory instead.
  const snap = await db
    .collection(COLLECTION)
    .where('memberId', '==', memberId)
    .get();
  const docs = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.month || '').localeCompare(a.month || ''));
  const total = docs.length;
  const data = getPaginatedSlice(docs, page, limit);
  return { data, total, page: parseInt(page, 10), limit: parseInt(limit, 10) };
};

export const markDueAsPaid = async (dueId) => {
  const doc = await db.collection(COLLECTION).doc(dueId).get();
  if (!doc.exists) throw new Error('Due not found');
  const due = doc.data();
  await db.collection(COLLECTION).doc(dueId).update({
    status: 'paid',
    paidAmount: due.amount,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { id: dueId };
};
