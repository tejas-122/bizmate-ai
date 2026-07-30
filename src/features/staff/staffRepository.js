import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  writeBatch,
  where,
} from 'firebase/firestore';
import { getFirestoreDb } from '../../core/firebase/firebaseClient.js';
import { staffFromFirestore } from '../../core/models/staff.js';

export function watchStaff(shopId, callback, onError) {
  const staffQuery = query(
    collection(getFirestoreDb(), 'staff'),
    where('shopId', '==', shopId),
  );

  return onSnapshot(
    staffQuery,
    (snapshot) =>
      callback(
        snapshot.docs
          .map(staffFromFirestore)
          .sort((left, right) => left.fullName.localeCompare(right.fullName)),
      ),
    onError,
  );
}

export async function addStaffMember({
  shopId,
  fullName,
  role,
  email,
  phoneNumber,
  dailyWage,
}) {
  return addDoc(collection(getFirestoreDb(), 'staff'), {
    shopId,
    fullName: fullName.trim(),
    role,
    email: email?.trim() || null,
    phoneNumber: phoneNumber?.trim() || null,
    dailyWage: Number(dailyWage || 0),
    joinedAt: serverTimestamp(),
    isActive: true,
  });
}

export async function removeStaffMember(staffId) {
  const db = getFirestoreDb();
  const attendanceSnapshot = await getDocs(
    query(collection(db, 'attendance'), where('staffId', '==', staffId)),
  );

  if (!attendanceSnapshot.empty) {
    const batch = writeBatch(db);
    attendanceSnapshot.docs.forEach((documentSnapshot) => {
      batch.delete(documentSnapshot.ref);
    });
    await batch.commit();
  }

  return deleteDoc(doc(db, 'staff', staffId));
}
