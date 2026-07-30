export function expenseFromFirestore(documentSnapshot) {
  const data = documentSnapshot.data();
  return {
    id: documentSnapshot.id,
    shopId: data.shopId,
    category: data.category,
    amount: Number(data.amount),
    vendor: data.vendor ?? null,
    notes: data.notes ?? null,
    spentAt: data.spentAt?.toDate?.() ?? new Date(),
  };
}
