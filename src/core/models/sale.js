export const paymentMethods = Object.freeze({
  cash: 'cash',
  card: 'card',
  bankTransfer: 'bankTransfer',
  upi: 'upi',
  other: 'other',
});

export function saleFromFirestore(documentSnapshot) {
  const data = documentSnapshot.data();
  return {
    id: documentSnapshot.id,
    shopId: data.shopId,
    invoiceNumber: data.invoiceNumber,
    itemId: data.itemId ?? null,
    itemName: data.itemName ?? null,
    quantity: Number(data.quantity ?? 1),
    unitPrice: Number(data.unitPrice ?? data.amount),
    amount: Number(data.amount),
    paymentMethod: data.paymentMethod,
    customerName: data.customerName ?? null,
    notes: data.notes ?? null,
    soldAt: data.soldAt?.toDate?.() ?? new Date(),
  };
}
