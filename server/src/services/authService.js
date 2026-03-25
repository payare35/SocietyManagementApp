import { db } from '../config/firebase.js';

export const getUserProfile = async (uid) => {
  const doc = await db.collection('members').doc(uid).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
};

/**
 * Given a contact number, returns the Firebase Auth email for that member.
 * Members registered with a real email use that email for Auth.
 * Members registered without an email use the synthetic {contact}@society.app email.
 */
export const lookupAuthEmailByContact = async (contactNumber) => {
  const snap = await db
    .collection('members')
    .where('contactNumber', '==', contactNumber)
    .where('isActive', '==', true)
    .limit(1)
    .get();

  if (snap.empty) return null;

  const member = snap.docs[0].data();
  return member.email || `${contactNumber}@society.app`;
};
