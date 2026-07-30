import {
  addDoc,
  collection,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { getFirestoreDb } from '../../core/firebase/firebaseClient.js';
import { attendanceFromFirestore } from '../../core/models/attendance.js';

export function watchAttendance(shopId, callback, onError) {
  const attendanceQuery = query(
    collection(getFirestoreDb(), 'attendance'),
    where('shopId', '==', shopId),
  );

  return onSnapshot(
    attendanceQuery,
    (snapshot) =>
      callback(
        snapshot.docs
          .map(attendanceFromFirestore)
          .sort((left, right) => right.markedAt - left.markedAt),
      ),
    onError,
  );
}

export async function markAttendance({ shopId, staffId, staffName, status }) {
  return addDoc(collection(getFirestoreDb(), 'attendance'), {
    shopId,
    staffId,
    staffName,
    status,
    attendanceDate: new Date().toISOString().slice(0, 10),
    markedAt: serverTimestamp(),
  });
}
