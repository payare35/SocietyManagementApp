import admin, { db } from '../config/firebase.js';
import { getPaginatedSlice } from '../utils/helpers.js';

const COLLECTION = 'transactions';

const tsToMs = (ts) => {
  if (!ts) return 0;
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  if (typeof ts.seconds === 'number') return ts.seconds * 1000;
  return 0;
};

const syncDueOnConfirmed = async (memberId, month, paidAmount) => {
  if (!month) return;
  const snap = await db
    .collection('maintenanceDues')
    .where('memberId', '==', memberId)
    .where('month', '==', month)
    .limit(1)
    .get();
  if (snap.empty) return;
  const dueDoc = snap.docs[0];
  const due = dueDoc.data();
  const newPaidAmount = Math.min((due.paidAmount || 0) + paidAmount, due.amount);
  const newStatus = newPaidAmount >= due.amount ? 'paid' : 'partial';
  await dueDoc.ref.update({
    paidAmount: newPaidAmount,
    status: newStatus,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
};

export const createTransaction = async (data, recordedBy) => {
  const memberDoc = await db.collection('members').doc(data.memberId).get();
  if (!memberDoc.exists) throw new Error('Member not found');
  const member = memberDoc.data();

  const ref = db.collection(COLLECTION).doc();
  const txData = {
    id: ref.id,
    memberId: data.memberId,
    memberName: member.name,
    flatNumber: member.flatNumber,
    amount: Number(data.amount),
    type: data.type || 'maintenance',
    status: 'confirmed',
    fileUrl: data.fileUrl || null,
    fileName: data.fileName || null,
    note: data.note || '',
    month: data.month,
    recordedBy,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  await ref.set(txData);

  if (data.type === 'maintenance' || !data.type) {
    await syncDueOnConfirmed(data.memberId, data.month, Number(data.amount));
  }

  return txData;
};

export const createSelfTransaction = async (data, memberId) => {
  const memberDoc = await db.collection('members').doc(memberId).get();
  if (!memberDoc.exists) throw new Error('Member not found');
  const member = memberDoc.data();

  const ref = db.collection(COLLECTION).doc();
  const txData = {
    id: ref.id,
    memberId,
    memberName: member.name,
    flatNumber: member.flatNumber,
    amount: Number(data.amount),
    type: 'maintenance',
    status: 'pending',
    fileUrl: data.fileUrl || null,
    fileName: data.fileName || null,
    note: data.note || '',
    month: data.month,
    recordedBy: 'self',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  await ref.set(txData);
  return txData;
};

export const getTransactions = async (filters = {}, page = 1, limit = 20) => {
  // Fetch all then filter in memory to avoid composite index requirements
  const snap = await db.collection(COLLECTION).orderBy('createdAt', 'desc').get();
  let docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  if (filters.status) docs = docs.filter((t) => t.status === filters.status);
  if (filters.month) docs = docs.filter((t) => t.month === filters.month);
  if (filters.memberId) docs = docs.filter((t) => t.memberId === filters.memberId);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    docs = docs.filter(
      (t) =>
        t.memberName?.toLowerCase().includes(q) ||
        t.flatNumber?.toLowerCase().includes(q)
    );
  }

  const total = docs.length;
  const data = getPaginatedSlice(docs, page, limit);
  return { data, total, page: parseInt(page, 10), limit: parseInt(limit, 10) };
};

export const getMyTransactions = async (memberId, page = 1, limit = 20) => {
  // Use single equality WHERE only — no orderBy — to avoid composite index requirement
  const snap = await db
    .collection(COLLECTION)
    .where('memberId', '==', memberId)
    .get();
  const docs = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => tsToMs(b.createdAt) - tsToMs(a.createdAt));
  const total = docs.length;
  const data = getPaginatedSlice(docs, page, limit);
  return { data, total, page: parseInt(page, 10), limit: parseInt(limit, 10) };
};

export const getTransactionById = async (id) => {
  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
};

export const updateTransactionStatus = async (id, status, adminUid) => {
  const txDoc = await db.collection(COLLECTION).doc(id).get();
  if (!txDoc.exists) throw new Error('Transaction not found');
  const tx = txDoc.data();

  await db.collection(COLLECTION).doc(id).update({
    status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  if (status === 'confirmed' && tx.type === 'maintenance') {
    await syncDueOnConfirmed(tx.memberId, tx.month, tx.amount);
  }

  return getTransactionById(id);
};
