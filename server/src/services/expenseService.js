import admin, { db } from '../config/firebase.js';
import { getPaginatedSlice } from '../utils/helpers.js';

const COLLECTION = 'expenses';

export const createExpense = async (data, createdBy) => {
  const ref = db.collection(COLLECTION).doc();
  const expenseData = {
    id: ref.id,
    title: data.title,
    type: data.type,
    amount: Number(data.amount),
    description: data.description || '',
    fileUrl: data.fileUrl || null,
    fileName: data.fileName || null,
    createdBy,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  await ref.set(expenseData);
  return expenseData;
};

export const getExpenses = async (filters = {}, page = 1, limit = 20) => {
  let query = db.collection(COLLECTION).orderBy('createdAt', 'desc');

  if (filters.type) {
    query = query.where('type', '==', filters.type);
  }

  const snap = await query.get();
  let docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  if (filters.startDate) {
    docs = docs.filter((e) => {
      const ts = e.createdAt?.toDate ? e.createdAt.toDate() : new Date(e.createdAt);
      return ts >= new Date(filters.startDate);
    });
  }
  if (filters.endDate) {
    docs = docs.filter((e) => {
      const ts = e.createdAt?.toDate ? e.createdAt.toDate() : new Date(e.createdAt);
      return ts <= new Date(filters.endDate);
    });
  }

  const total = docs.length;
  const data = getPaginatedSlice(docs, page, limit);
  return { data, total, page: parseInt(page, 10), limit: parseInt(limit, 10) };
};

export const getExpenseById = async (id) => {
  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
};

export const updateExpense = async (id, data) => {
  const updateData = {
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  const fields = ['title', 'type', 'amount', 'description', 'fileUrl', 'fileName'];
  fields.forEach((f) => {
    if (data[f] !== undefined) updateData[f] = f === 'amount' ? Number(data[f]) : data[f];
  });
  await db.collection(COLLECTION).doc(id).update(updateData);
  return getExpenseById(id);
};

export const deleteExpense = async (id) => {
  await db.collection(COLLECTION).doc(id).delete();
  return { id };
};
