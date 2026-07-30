/**
 * @typedef {Object} AppUser
 * @property {string} id
 * @property {string} email
 * @property {string} fullName
 * @property {string | null} phoneNumber
 * @property {Date} createdAt
 */

export function userFromFirestore(documentSnapshot) {
  const data = documentSnapshot.data();
  return {
    id: documentSnapshot.id,
    email: data.email,
    fullName: data.fullName,
    phoneNumber: data.phoneNumber ?? null,
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
  };
}
