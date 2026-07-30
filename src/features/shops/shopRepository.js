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
import { shopFromFirestore } from '../../core/models/shop.js';

export function watchOwnedShops(ownerId, callback, onError) {
  const shopsQuery = query(
    collection(getFirestoreDb(), 'shops'),
    where('ownerId', '==', ownerId),
  );

  return onSnapshot(
    shopsQuery,
    (snapshot) =>
      callback(
        snapshot.docs
          .map(shopFromFirestore)
          .sort((left, right) => left.createdAt - right.createdAt),
      ),
    onError,
  );
}

export async function createShop({ ownerId, name, address, phoneNumber, taxId }) {
  return addDoc(collection(getFirestoreDb(), 'shops'), {
    ownerId,
    name: name.trim(),
    address: address?.trim() || null,
    phoneNumber: phoneNumber?.trim() || null,
    taxId: taxId?.trim() || null,
    createdAt: serverTimestamp(),
  });
}

export async function removeShop(shopId) {
  const db = getFirestoreDb();
  const relatedCollections = ['sales', 'expenses', 'staff', 'attendance', 'inventory'];

  for (const collectionName of relatedCollections) {
    const relatedSnapshot = await getDocs(
      query(collection(db, collectionName), where('shopId', '==', shopId)),
    );

    if (relatedSnapshot.empty) continue;

    const batch = writeBatch(db);
    relatedSnapshot.docs.forEach((documentSnapshot) => {
      batch.delete(documentSnapshot.ref);
    });
    await batch.commit();
  }

  await deleteDoc(doc(db, 'shops', shopId));
}
