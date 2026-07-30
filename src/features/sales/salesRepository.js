import {
  addDoc,
  collection,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { getFirestoreDb } from '../../core/firebase/firebaseClient.js';
import { saleFromFirestore } from '../../core/models/sale.js';

export function watchSales(shopId, callback, onError) {
  const salesQuery = query(
    collection(getFirestoreDb(), 'sales'),
    where('shopId', '==', shopId),
  );

  return onSnapshot(
    salesQuery,
    (snapshot) =>
      callback(
        snapshot.docs
          .map(saleFromFirestore)
          .sort((left, right) => right.soldAt - left.soldAt),
      ),
    onError,
  );
}

export async function recordSale({
  shopId,
  invoiceNumber,
  itemId,
  itemName,
  quantity,
  unitPrice,
  amount,
  paymentMethod,
  customerName,
  notes,
}) {
  return addDoc(collection(getFirestoreDb(), 'sales'), {
    shopId,
    invoiceNumber: invoiceNumber.trim(),
    itemId: itemId || null,
    itemName: itemName?.trim() || null,
    quantity: Number(quantity || 1),
    unitPrice: Number(unitPrice || amount),
    amount: Number(amount),
    paymentMethod,
    customerName: customerName?.trim() || null,
    notes: notes?.trim() || null,
    soldAt: serverTimestamp(),
  });
}
