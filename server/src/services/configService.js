import admin, { db } from '../config/firebase.js';

const DOC_PATH = 'societyConfig/config';

export const getConfig = async () => {
  const doc = await db.doc(DOC_PATH).get();
  if (!doc.exists) return null;
  return doc.data();
};

export const updateConfig = async (data) => {
  const existing = await db.doc(DOC_PATH).get();
  const updateData = {
    ...data,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  if (!existing.exists) {
    updateData.createdAt = admin.firestore.FieldValue.serverTimestamp();
    await db.doc(DOC_PATH).set(updateData);
  } else {
    await db.doc(DOC_PATH).update(updateData);
  }
  const updated = await db.doc(DOC_PATH).get();
  return updated.data();
};
