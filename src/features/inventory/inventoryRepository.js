import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { getFirestoreDb } from '../../core/firebase/firebaseClient.js';
import { inventoryItemFromFirestore } from '../../core/models/inventoryItem.js';

export function watchInventory(shopId, callback, onError) {
  const inventoryQuery = query(
    collection(getFirestoreDb(), 'inventory'),
    where('shopId', '==', shopId),
  );

  return onSnapshot(
    inventoryQuery,
    (snapshot) =>
      callback(
        snapshot.docs
          .map(inventoryItemFromFirestore)
          .sort((left, right) => left.name.localeCompare(right.name)),
      ),
    onError,
  );
}

export async function saveInventoryItem({
  shopId,
  name,
  sku,
  quantity,
  purchasePrice,
  sellingPrice,
  reorderLevel,
}) {
  return addDoc(collection(getFirestoreDb(), 'inventory'), {
    shopId,
    name: name.trim(),
    sku: sku.trim(),
    quantity: Number(quantity),
    purchasePrice: Number(purchasePrice),
    sellingPrice: Number(sellingPrice),
    reorderLevel: reorderLevel ? Number(reorderLevel) : null,
    updatedAt: serverTimestamp(),
  });
}

export function removeInventoryItem(itemId) {
  return deleteDoc(doc(getFirestoreDb(), 'inventory', itemId));
}
