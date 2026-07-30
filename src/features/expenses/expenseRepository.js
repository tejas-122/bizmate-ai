import {
  addDoc,
  collection,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { getFirestoreDb } from '../../core/firebase/firebaseClient.js';
import { expenseFromFirestore } from '../../core/models/expense.js';

export function watchExpenses(shopId, callback, onError) {
  const expensesQuery = query(
    collection(getFirestoreDb(), 'expenses'),
    where('shopId', '==', shopId),
  );

  return onSnapshot(
    expensesQuery,
    (snapshot) =>
      callback(
        snapshot.docs
          .map(expenseFromFirestore)
          .sort((left, right) => right.spentAt - left.spentAt),
      ),
    onError,
  );
}

export async function recordExpense({ shopId, category, amount, vendor, notes }) {
  return addDoc(collection(getFirestoreDb(), 'expenses'), {
    shopId,
    category: category.trim(),
    amount: Number(amount),
    vendor: vendor?.trim() || null,
    notes: notes?.trim() || null,
    spentAt: serverTimestamp(),
  });
}
