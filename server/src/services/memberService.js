import admin, { db, auth } from '../config/firebase.js';
import { buildSyntheticEmail, getPaginatedSlice } from '../utils/helpers.js';

const COLLECTION = 'members';

export const createMember = async (data, createdBy) => {
  const { name, contactNumber, email, password, role = 'member', flatNumber } = data;
  const authEmail = email || buildSyntheticEmail(contactNumber);

  const userRecord = await auth.createUser({
    email: authEmail,
    password,
    displayName: name,
  });

  await auth.setCustomUserClaims(userRecord.uid, { role });

  const configDoc = await db.collection('societyConfig').doc('config').get();
  const societyId = configDoc.exists ? (configDoc.data().societyId || 'default') : 'default';

  const memberData = {
    uid: userRecord.uid,
    name,
    contactNumber,
    email: email || null,
    role,
    flatNumber,
    societyId,
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await db.collection(COLLECTION).doc(userRecord.uid).set(memberData);
  return { ...memberData, uid: userRecord.uid };
};

export const getMembers = async (search, page = 1, limit = 20) => {
  const snap = await db.collection(COLLECTION).orderBy('name').get();
  let docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  if (search) {
    const q = search.toLowerCase();
    docs = docs.filter(
      (m) =>
        m.name?.toLowerCase().includes(q) ||
        m.flatNumber?.toLowerCase().includes(q) ||
        m.contactNumber?.includes(q)
    );
  }

  const total = docs.length;
  const data = getPaginatedSlice(docs, page, limit);
  return { data, total, page: parseInt(page, 10), limit: parseInt(limit, 10) };
};

export const getMemberById = async (id) => {
  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
};

export const updateMember = async (id, data) => {
  const { name, contactNumber, email, flatNumber, role, isActive } = data;
  const updateData = {
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  if (name !== undefined) updateData.name = name;
  if (contactNumber !== undefined) updateData.contactNumber = contactNumber;
  if (email !== undefined) updateData.email = email;
  if (flatNumber !== undefined) updateData.flatNumber = flatNumber;
  if (isActive !== undefined) updateData.isActive = isActive;

  if (role !== undefined) {
    updateData.role = role;
    await auth.setCustomUserClaims(id, { role });
  }

  const authUpdate = {};
  if (data.password) authUpdate.password = data.password;
  // Re-enable the Auth account if admin explicitly reactivates the member
  if (isActive === true) authUpdate.disabled = false;
  if (Object.keys(authUpdate).length > 0) {
    await auth.updateUser(id, authUpdate);
  }

  await db.collection(COLLECTION).doc(id).update(updateData);
  return getMemberById(id);
};

export const deleteMember = async (id) => {
  // Disable the Firebase Auth account so the user can no longer obtain a valid token
  await auth.updateUser(id, { disabled: true });
  await db.collection(COLLECTION).doc(id).update({
    isActive: false,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { id };
};

export const getActiveMembers = async () => {
  const snap = await db
    .collection(COLLECTION)
    .where('isActive', '==', true)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};
